const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { asyncHandler } = require('../middleware/errorHandler');
const { analyzeResumeWithAI } = require('../services/analysisService');
const { calculatePagination } = require('../utils/controllerHelpers');
const { sendSSE, setupSSEHeaders, handleSSECleanup } = require('./sseController');
const { ANALYSIS_CACHE_TTL_MS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Async function to perform resume analysis
 * @param {Object} resume - Resume document
 * @param {Object} analysis - Analysis document
 * @param {string} analysisType - Type of analysis
 * @param {string} jobDescription - Optional job description
 */
const analyzeResumeAsync = async (resume, analysis, analysisType, jobDescription) => {
  try {
    const startTime = Date.now();
    
    // Perform AI analysis
    const {
      analysis: analysisResult,
      tokensUsed,
      model,
      processingTime,
      rawResponse,
    } = await analyzeResumeWithAI(
      analysisType,
      resume.extractedText,
      jobDescription
    );

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
    analysis.processingTime = processingTime || (Date.now() - startTime);
    analysis.analysisDate = new Date();
    analysis.rawResponse = rawResponse;

    await analysis.save();

    // Update resume's last analyzed date
    resume.lastAnalyzed = new Date();
    await resume.save();

    logger.info(`Analysis completed for resume ${resume._id}, type: ${analysisType}`);
  } catch (error) {
    logger.error(`Analysis failed for resume ${resume._id}:`, error);
    analysis.status = 'failed';
    analysis.errorMessage = error.message || 'Analysis failed';
    await analysis.save();
  }
};

/**
 * @desc    Analyze a resume
 * @route   POST /api/resume/:id/analyze
 * @access  Private
 */
const analyzeResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { analysisType = 'general', jobDescription } = req.body;

  // Validate analysis type
  const validTypes = ['general', 'ats', 'jd_match'];
  if (!validTypes.includes(analysisType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  // Find resume
  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  if (!resume.extractedText || resume.extractedText.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Resume text extraction failed. Please re-upload the resume.',
    });
  }

  // Check if there's already a pending analysis of this type
  const existingPending = await ResumeAnalysis.findOne({
    resumeId: resume._id,
    analysisType,
    status: { $in: ['pending', 'processing'] },
  });

  if (existingPending) {
    return res.json({
      success: true,
      message: 'Analysis already in progress',
      data: {
        analysisId: existingPending._id,
        status: existingPending.status,
      },
    });
  }

  // Check for recent completed analysis (within cache TTL) to avoid duplicate API calls
  const cacheCutoffDate = new Date(Date.now() - ANALYSIS_CACHE_TTL_MS);
  
  // For job-specific analysis, also match job description
  const recentAnalysisQuery = {
    resumeId: resume._id,
    analysisType,
    status: 'completed',
    analysisDate: { $gte: cacheCutoffDate },
  };
  
  // If job-specific analysis, include job description in query
  if (analysisType === 'jd_match' && jobDescription) {
    recentAnalysisQuery.jobDescription = jobDescription;
  }
  
  const recentAnalysis = await ResumeAnalysis.findOne(recentAnalysisQuery)
    .sort({ analysisDate: -1 })
    .lean();

  if (recentAnalysis) {
    logger.info(`Returning cached analysis result for resume ${resume._id}, type: ${analysisType}`);
    return res.json({
      success: true,
      message: 'Analysis found (cached)',
      data: {
        analysisId: recentAnalysis._id,
        status: recentAnalysis.status,
        cached: true,
        analysis: {
          overallScore: recentAnalysis.overallScore,
          sectionScores: recentAnalysis.sectionScores,
          strengths: recentAnalysis.strengths,
          weaknesses: recentAnalysis.weaknesses,
          recommendations: recentAnalysis.recommendations,
          skillsAnalysis: recentAnalysis.skillsAnalysis,
        },
      },
    });
  }

  // Create analysis record
  const analysis = await ResumeAnalysis.create({
    resumeId: resume._id,
    userId,
    analysisType,
    status: 'processing',
    jobDescription: jobDescription || null,
  });

  // Start analysis asynchronously (fire and forget)
  analyzeResumeAsync(resume, analysis, analysisType, jobDescription).catch((error) => {
    logger.error('Error in async analysis:', error);
    analysis.status = 'failed';
    analysis.errorMessage = error.message;
    analysis.save();
  });

  res.status(202).json({
    success: true,
    message: 'Analysis started',
    data: {
      analysisId: analysis._id,
      status: analysis.status,
      estimatedTime: 30, // seconds
    },
  });
});

/**
 * @desc    Get analysis results
 * @route   GET /api/resume/:id/analysis/:analysisId
 * @access  Private
 */
const getAnalysis = asyncHandler(async (req, res) => {
  const { id, analysisId } = req.params;
  const userId = req.user._id;

  // Verify resume belongs to user
  const resume = await Resume.findOne({ _id: id, userId });
  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  // Get analysis
  const analysis = await ResumeAnalysis.findOne({
    _id: analysisId,
    resumeId: resume._id,
    userId,
  });

  if (!analysis) {
    return res.status(404).json({
      success: false,
      message: 'Analysis not found',
    });
  }

  res.json({
    success: true,
    data: {
      analysis,
    },
  });
});

/**
 * @desc    Get all analyses for a resume
 * @route   GET /api/resume/:id/analyses
 * @access  Private
 */
const listAnalyses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { type, limit, page } = req.query;

  // Verify resume belongs to user
  const resume = await Resume.findOne({ _id: id, userId });
  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  // Build query
  const query = {
    resumeId: resume._id,
    userId,
  };

  if (type) {
    query.analysisType = type;
  }

  // Parse and validate pagination parameters
  const DEFAULT_ANALYSIS_PAGE_SIZE = 10;
  const MAX_ANALYSIS_PAGE_SIZE = 50;
  const { pageSize, skip, pageNum } = calculatePagination(page, limit, DEFAULT_ANALYSIS_PAGE_SIZE, MAX_ANALYSIS_PAGE_SIZE);

  // Get analyses with pagination
  const [analyses, total] = await Promise.all([
    ResumeAnalysis.find(query)
      .sort({ analysisDate: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('-rawResponse') // Don't include raw response
      .lean(),
    ResumeAnalysis.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      analyses,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    },
  });
});

/**
 * @desc    Compare two resumes
 * @route   POST /api/resume/compare
 * @access  Private
 */
const compareResumes = asyncHandler(async (req, res) => {
  const { resumeIds } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(resumeIds) || resumeIds.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Please provide exactly 2 resume IDs to compare',
    });
  }

  // Find both resumes
  const resumes = await Resume.find({
    _id: { $in: resumeIds },
    userId,
  });

  if (resumes.length !== 2) {
    return res.status(404).json({
      success: false,
      message: 'One or more resumes not found',
    });
  }

  // Get latest analyses for both resumes
  const analyses = await Promise.all(
    resumes.map(resume =>
      ResumeAnalysis.findOne({
        resumeId: resume._id,
        status: 'completed',
      })
        .sort({ analysisDate: -1 })
        .lean()
    )
  );

  // Build comparison
  const comparison = {
    resume1: {
      ...resumes[0].getSummary(),
      analysis: analyses[0] || null,
    },
    resume2: {
      ...resumes[1].getSummary(),
      analysis: analyses[1] || null,
    },
    differences: {},
  };

  // Compare scores if analyses exist
  if (analyses[0] && analyses[1]) {
    comparison.differences = {
      overallScore: analyses[0].overallScore - analyses[1].overallScore,
      sectionScores: {},
    };

    if (analyses[0].sectionScores && analyses[1].sectionScores) {
      Object.keys(analyses[0].sectionScores).forEach(section => {
        const score1 = analyses[0].sectionScores[section] || 0;
        const score2 = analyses[1].sectionScores[section] || 0;
        comparison.differences.sectionScores[section] = score1 - score2;
      });
    }
  }

  res.json({
    success: true,
    data: {
      comparison,
    },
  });
});

/**
 * Analyze resume with SSE progress updates
 * @route POST /api/resume/:id/analyze-stream
 */
const analyzeResumeStream = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { analysisType = 'general', jobDescription } = req.body;

  // Validate analysis type
  const validTypes = ['general', 'ats', 'jd_match'];
  if (!validTypes.includes(analysisType)) {
    sendSSE(res, 'error', {
      message: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`,
    });
    res.end();
    return;
  }

  // Setup SSE headers
  setupSSEHeaders(res);
  handleSSECleanup(res);

  try {
    sendSSE(res, 'progress', { message: 'Validating resume...', progress: 5 });

    // Find resume
    const resume = await Resume.findOne({ _id: id, userId });

    if (!resume) {
      sendSSE(res, 'error', { message: 'Resume not found' });
      res.end();
      return;
    }

    if (!resume.extractedText || resume.extractedText.trim().length === 0) {
      sendSSE(res, 'error', {
        message: 'Resume text extraction failed. Please re-upload the resume.',
      });
      res.end();
      return;
    }

    // Check if there's already a pending analysis of this type
    const existingPending = await ResumeAnalysis.findOne({
      resumeId: resume._id,
      analysisType,
      status: { $in: ['pending', 'processing'] },
    });

    if (existingPending) {
      sendSSE(res, 'error', {
        message: 'Analysis already in progress',
        analysisId: existingPending._id,
        status: existingPending.status,
      });
      res.end();
      return;
    }

    // Check for recent completed analysis (within cache TTL) to avoid duplicate API calls
    const cacheCutoffDate = new Date(Date.now() - ANALYSIS_CACHE_TTL_MS);
    
    // For job-specific analysis, also match job description
    const recentAnalysisQuery = {
      resumeId: resume._id,
      analysisType,
      status: 'completed',
      analysisDate: { $gte: cacheCutoffDate },
    };
    
    // If job-specific analysis, include job description in query
    if (analysisType === 'jd_match' && jobDescription) {
      recentAnalysisQuery.jobDescription = jobDescription;
    }
    
    const recentAnalysis = await ResumeAnalysis.findOne(recentAnalysisQuery)
      .sort({ analysisDate: -1 })
      .lean();

    if (recentAnalysis) {
      logger.info(`Returning cached analysis result for resume ${resume._id}, type: ${analysisType} (SSE)`);
      sendSSE(res, 'complete', { 
        analysis: recentAnalysis,
        cached: true,
      });
      res.end();
      return;
    }

    sendSSE(res, 'progress', { message: 'Creating analysis record...', progress: 10 });

    // Create analysis record
    const analysis = await ResumeAnalysis.create({
      resumeId: resume._id,
      userId,
      analysisType,
      status: 'processing',
      jobDescription: jobDescription || null,
    });

    sendSSE(res, 'analysis_id', { analysisId: analysis._id });

    // Start analysis with progress updates
    const startTime = Date.now();

    try {
      sendSSE(res, 'progress', { message: 'Parsing resume sections...', progress: 15 });
      await new Promise(resolve => setTimeout(resolve, 200));

      sendSSE(res, 'progress', { message: 'Calculating rule-based scores...', progress: 25 });
      await new Promise(resolve => setTimeout(resolve, 200));

      sendSSE(res, 'progress', { message: 'Analyzing skills...', progress: 35 });
      
      // Perform AI analysis
      sendSSE(res, 'progress', { message: 'Generating AI analysis...', progress: 45 });
      
      const {
        analysis: analysisResult,
        tokensUsed,
        model,
        processingTime,
        rawResponse,
      } = await analyzeResumeWithAI(analysisType, resume.extractedText, jobDescription);

      sendSSE(res, 'progress', { message: 'Finalizing analysis...', progress: 90 });

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
      analysis.processingTime = processingTime || Date.now() - startTime;
      analysis.analysisDate = new Date();
      analysis.rawResponse = rawResponse;

      await analysis.save();

      // Update resume's last analyzed date
      resume.lastAnalyzed = new Date();
      await resume.save();

      logger.info(`Analysis completed for resume ${resume._id}, type: ${analysisType}`);

      sendSSE(res, 'complete', { analysis });
      res.end();
    } catch (error) {
      logger.error(`Analysis failed for resume ${resume._id}:`, error);
      analysis.status = 'failed';
      analysis.errorMessage = error.message || 'Analysis failed';
      await analysis.save();

      sendSSE(res, 'error', { message: error.message || 'Analysis failed' });
      res.end();
    }
  } catch (error) {
    logger.error('Error in SSE resume analysis:', error);
    sendSSE(res, 'error', { message: error.message || 'An unexpected error occurred' });
    res.end();
  }
});

module.exports = {
  analyzeResume,
  analyzeResumeStream,
  getAnalysis,
  listAnalyses,
  compareResumes,
};

