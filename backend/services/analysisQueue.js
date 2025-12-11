/**
 * Analysis Queue Service using Bull
 * Handles background job processing for resume analysis
 * @module services/analysisQueue
 */

const Queue = require('bull');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const { analyzeResumeWithAI } = require('./analysisService');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { ANALYSIS_MAX_RETRIES, ANALYSIS_RETRY_DELAY_MS } = require('../config/constants');

// Initialize Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
};

let redisClient = null;

try {
  redisClient = new Redis(redisConfig);
  redisClient.on('error', (err) => {
    logger.warn('Redis connection error (queue will use in-memory fallback):', err.message);
  });
} catch (error) {
  logger.warn('Redis initialization failed, queue will use in-memory fallback:', error.message);
}

// Create analysis queue
const analysisQueue = new Queue('resume-analysis', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: ANALYSIS_MAX_RETRIES,
    backoff: {
      type: 'exponential',
      delay: ANALYSIS_RETRY_DELAY_MS,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Process jobs
analysisQueue.process(async (job) => {
  const { resumeId, analysisId, analysisType, resumeText, jobDescription } = job.data;

  logger.info(`Processing analysis job: ${analysisId} for resume: ${resumeId}`);

  try {
    // Update status to processing
    await ResumeAnalysis.findByIdAndUpdate(analysisId, {
      status: 'processing',
      startedAt: new Date(),
    });

    // Perform AI analysis
    const {
      analysis: analysisResult,
      tokensUsed,
      model,
      processingTime,
      rawResponse,
    } = await analyzeResumeWithAI(analysisType, resumeText, jobDescription);

    // Get fresh analysis document
    const analysis = await ResumeAnalysis.findById(analysisId);
    if (!analysis) {
      throw new Error('Analysis document not found');
    }

    // Update analysis record
    analysis.status = 'completed';
    analysis.overallScore = analysisResult.overallScore || 0;
    analysis.sectionScores = analysisResult.sectionScores || {};
    analysis.strengths = analysisResult.strengths || [];
    analysis.weaknesses = analysisResult.weaknesses || [];
    analysis.recommendations = analysisResult.recommendations || [];
    analysis.skillsAnalysis = analysisResult.skillsAnalysis || {};
    analysis.experienceAnalysis = analysisResult.experienceAnalysis || {};
    analysis.atsAnalysis = analysisResult.atsAnalysis || {};
    
    if (analysisType === 'jd_match' && analysisResult.jobDescriptionMatch) {
      analysis.jobDescriptionMatch = analysisResult.jobDescriptionMatch;
    }
    
    analysis.aiModel = model;
    analysis.tokensUsed = tokensUsed;
    analysis.processingTime = processingTime;
    analysis.analysisDate = new Date();
    analysis.rawResponse = rawResponse;

    await analysis.save();

    // Update resume's last analyzed date
    await Resume.findByIdAndUpdate(resumeId, {
      lastAnalyzed: new Date(),
    });

    logger.info(`Analysis completed successfully: ${analysisId}`);
    return { success: true, analysisId };
  } catch (error) {
    logger.error(`Analysis job failed: ${analysisId}`, error);
    
    // Update analysis status to failed
    await ResumeAnalysis.findByIdAndUpdate(analysisId, {
      status: 'failed',
      errorMessage: error.message || 'Analysis failed',
      completedAt: new Date(),
    });

    throw error; // Re-throw to trigger retry mechanism
  }
});

// Queue event handlers
analysisQueue.on('completed', (job, result) => {
  logger.info(`Analysis job completed: ${job.data.analysisId}`);
});

analysisQueue.on('failed', (job, err) => {
  logger.error(`Analysis job failed: ${job?.data?.analysisId}`, err);
});

analysisQueue.on('stalled', (job) => {
  logger.warn(`Analysis job stalled: ${job?.data?.analysisId}`);
});

/**
 * Add analysis job to queue
 * @param {Object} jobData - Job data
 * @returns {Promise<Bull.Job>} Job instance
 */
const addAnalysisJob = async (jobData) => {
  try {
    const job = await analysisQueue.add(jobData, {
      jobId: jobData.analysisId.toString(), // Use analysis ID as job ID to prevent duplicates
    });
    logger.info(`Analysis job added to queue: ${jobData.analysisId}`);
    return job;
  } catch (error) {
    logger.error('Error adding analysis job to queue:', error);
    throw error;
  }
};

/**
 * Get job status
 * @param {string} jobId - Job ID (analysis ID)
 * @returns {Promise<Object>} Job state
 */
const getJobStatus = async (jobId) => {
  try {
    const job = await analysisQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    
    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  } catch (error) {
    logger.error('Error getting job status:', error);
    return null;
  }
};

/**
 * Clean up queue (remove old jobs)
 */
const cleanupQueue = async () => {
  try {
    await analysisQueue.clean(24 * 3600 * 1000, 'completed', 1000);
    await analysisQueue.clean(7 * 24 * 3600 * 1000, 'failed', 1000);
    logger.info('Queue cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up queue:', error);
  }
};

module.exports = {
  analysisQueue,
  addAnalysisJob,
  getJobStatus,
  cleanupQueue,
};

