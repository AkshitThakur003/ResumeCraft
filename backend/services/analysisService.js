/**
 * @fileoverview Resume Analysis Service
 * @module services/analysisService
 * @description 
 * Hybrid resume analysis service that combines rule-based scoring with AI-powered 
 * analysis. Uses rule-based algorithms for cost-effective scoring of contact info, 
 * skills, and formatting, while leveraging OpenAI for generating summaries, 
 * strengths, weaknesses, and recommendations.
 * 
 * @author ResumeCraft Team
 * @version 1.0.0
 */

const crypto = require('crypto');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { sanitizeJobDescription, sanitizeResumeText } = require('../utils/inputSanitizer');
const { validateAnalysisResponse, normalizeAnalysisResponse } = require('../utils/analysisValidator');
const { parseResumeSections } = require('./sectionParser');
const { scoreContactInfo, scoreSkills, scoreFormatting, calculateOverallScore } = require('./ruleBasedScoring');
const { calculateSkillRelevance } = require('./embeddingsService');
const { generateAIPrompt } = require('./promptGenerators');
const { generateFallbackAnalysis } = require('./fallbackAnalysis');
const {
  ANALYSIS_CACHE_TTL_MS,
} = require('../config/constants');

/**
 * OpenAI client instance for AI-powered resume analysis
 * @type {OpenAI}
 * @private
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fallback in-memory cache (used only if Redis is unavailable)
 * Key: hash of inputs, Value: { result, timestamp }
 * @type {Map<string, Object>}
 * @private
 */
const fallbackCache = new Map();

/**
 * Generate cache key from inputs
 * @param {string} resumeText - Resume text
 * @param {string} analysisType - Analysis type
 * @param {string|null} jobDescription - Optional job description
 * @returns {string} Cache key (hash)
 * @private
 */
const generateCacheKey = (resumeText, analysisType, jobDescription = null) => {
  const inputString = `${resumeText}|${analysisType}|${jobDescription || ''}`;
  return crypto.createHash('sha256').update(inputString).digest('hex');
};

/**
 * Get cached result if available and not expired
 * Uses Redis if available, falls back to in-memory cache
 * @param {string} cacheKey - Cache key
 * @returns {Promise<Object|null>} Cached result or null
 * @private
 */
const getCachedResult = async (cacheKey) => {
  const redis = getRedisClient();
  const redisAvailable = redis && await isRedisAvailable();
  
  if (redisAvailable) {
    try {
      const cached = await redis.get(`analysis:${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.info('Resume analysis cache hit (Redis)', { cacheKey: cacheKey.substring(0, 8) });
        return parsed;
      }
      return null;
    } catch (error) {
      logger.warn('Redis cache get error, falling back to in-memory:', error.message);
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  const cached = fallbackCache.get(cacheKey);
  if (!cached) {
    return null;
  }
  
  const age = Date.now() - cached.timestamp;
  if (age > ANALYSIS_CACHE_TTL_MS) {
    fallbackCache.delete(cacheKey);
    return null;
  }
  
  logger.info('Resume analysis cache hit (in-memory)', { cacheKey: cacheKey.substring(0, 8) });
  return cached.result;
};

/**
 * Store result in cache
 * Uses Redis if available, falls back to in-memory cache
 * @param {string} cacheKey - Cache key
 * @param {Object} result - Result to cache
 * @private
 */
const setCachedResult = async (cacheKey, result) => {
  const redis = getRedisClient();
  const redisAvailable = redis && await isRedisAvailable();
  
  if (redisAvailable) {
    try {
      const ttlSeconds = Math.floor(ANALYSIS_CACHE_TTL_MS / 1000);
      await redis.setex(`analysis:${cacheKey}`, ttlSeconds, JSON.stringify(result));
      logger.debug('Resume analysis cached in Redis', { cacheKey: cacheKey.substring(0, 8) });
      return;
    } catch (error) {
      logger.warn('Redis cache set error, falling back to in-memory:', error.message);
      // Fall through to in-memory cache
    }
  }
  
  // Fallback to in-memory cache
  fallbackCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
  
  // Clean up old cache entries periodically (simple cleanup)
  if (fallbackCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of fallbackCache.entries()) {
      if (now - value.timestamp > ANALYSIS_CACHE_TTL_MS) {
        fallbackCache.delete(key);
      }
    }
  }
};

/**
 * Analyzes a resume using a hybrid approach: rule-based scoring + AI for summary/suggestions.
 * 
 * This function implements a cost-optimized analysis strategy:
 * 1. Rule-based scoring (no AI cost) for contact info, skills, and formatting
 * 2. AI-powered analysis for summaries, strengths, weaknesses, and recommendations
 * 3. Automatic fallback to basic analysis if OpenAI API is unavailable
 * 
 * @async
 * @function analyzeResumeWithAI
 * @param {string} analysisType - Type of analysis to perform. 
 *   Valid values: 'general', 'ats', 'job-specific'
 * @param {string} resumeText - Raw resume text content to analyze
 * @param {string|null} [jobDescription=null] - Optional job description for job-specific analysis
 * 
 * @returns {Promise<Object>} Analysis result object
 * @returns {Object} returns.analysis - Complete analysis object
 * @returns {number} returns.analysis.overallScore - Overall resume score (0-100)
 * @returns {Object} returns.analysis.sectionScores - Scores for each resume section
 * @returns {number} returns.analysis.sectionScores.contactInfo - Contact information score (0-100)
 * @returns {number} returns.analysis.sectionScores.skills - Skills section score (0-100)
 * @returns {number} returns.analysis.sectionScores.formatting - Formatting score (0-100)
 * @returns {number} returns.analysis.sectionScores.summary - Summary section score (0-100)
 * @returns {number} returns.analysis.sectionScores.experience - Experience section score (0-100)
 * @returns {number} returns.analysis.sectionScores.education - Education section score (0-100)
 * @returns {number} returns.analysis.sectionScores.achievements - Achievements section score (0-100)
 * @returns {string[]} returns.analysis.strengths - Array of identified strengths
 * @returns {string[]} returns.analysis.weaknesses - Array of identified weaknesses
 * @returns {string[]} returns.analysis.recommendations - Array of improvement recommendations
 * @returns {Object} returns.analysis.skillsAnalysis - Detailed skills analysis
 * @returns {string[]} returns.analysis.skillsAnalysis.detected - List of detected skills
 * @returns {string[]} returns.analysis.skillsAnalysis.missing - List of missing/recommended skills
 * @returns {string[]} returns.analysis.skillsAnalysis.recommendations - Skills-specific recommendations
 * @returns {Object} returns.analysis.skillsAnalysis.categorized - Skills organized by category
 * @returns {string[]} returns.analysis.skillsAnalysis.categorized.technical - Technical skills
 * @returns {string[]} returns.analysis.skillsAnalysis.categorized.soft - Soft skills
 * @returns {string[]} returns.analysis.skillsAnalysis.categorized.industry - Industry-specific skills
 * @returns {string[]} returns.analysis.skillsAnalysis.categorized.other - Other skills
 * @returns {number} returns.tokensUsed - Number of OpenAI tokens consumed
 * @returns {string} returns.model - Model used for analysis (e.g., 'hybrid-gpt-4o-mini')
 * @returns {number} returns.processingTime - Processing time in milliseconds
 * @returns {string} returns.rawResponse - Raw JSON response from OpenAI
 * 
 * @throws {Error} If resume text is invalid or analysis fails critically
 * 
 * @example
 * // General resume analysis
 * const result = await analyzeResumeWithAI('general', resumeText);
 * console.log(result.analysis.overallScore); // 85
 * 
 * @example
 * // Job-specific analysis
 * const result = await analyzeResumeWithAI('job-specific', resumeText, jobDescription);
 * console.log(result.analysis.recommendations); // ['Add more relevant experience...']
 */
const analyzeResumeWithAI = async (analysisType, resumeText, jobDescription = null) => {
  const startTime = Date.now();

  try {
    // Step 1: Sanitize inputs
    const sanitizedResumeText = sanitizeResumeText(resumeText);
    const sanitizedJobDescription = jobDescription ? sanitizeJobDescription(jobDescription) : null;

    // Step 1.5: Check cache (COST OPTIMIZATION)
    const cacheKey = generateCacheKey(sanitizedResumeText, analysisType, sanitizedJobDescription);
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      logger.info('Returning cached analysis result', { 
        analysisType,
        cacheKey: cacheKey.substring(0, 8),
      });
      return {
        ...cached,
        cached: true,
      };
    }

    // Step 2: Parse resume sections (no AI cost)
    logger.info('Parsing resume sections...');
    const { sections, detectedSections, validation: sectionValidation } = parseResumeSections(sanitizedResumeText);

    // Step 3: Calculate rule-based scores (no/minimal AI cost)
    logger.info('Calculating rule-based scores...');
    const contactScore = scoreContactInfo(sections.contact);
    
    // Calculate skill relevance using embeddings (minimal cost)
    let skillRelevanceScore = 0;
    let embeddingsMetadata = null;
    
    if (sections.skills && sections.skills.length > 0) {
      try {
        logger.info(`🔍 Starting embeddings calculation for ${sections.skills.length} skills`);
        const relevanceResult = await calculateSkillRelevance(sections.skills, sanitizedResumeText);
        skillRelevanceScore = relevanceResult.score;
        embeddingsMetadata = relevanceResult.metadata;
        
        if (embeddingsMetadata.embeddingsUsed) {
          logger.info(`✅ Embeddings: Successfully calculated skill relevance (${Math.round(skillRelevanceScore)}/100)`);
        } else {
          logger.info(`⚠️ Embeddings: Using fallback method (keyword matching)`);
        }
      } catch (error) {
        logger.warn('Error calculating skill relevance, using fallback:', error.message);
        // Fallback: simple keyword matching
        const lowerText = sanitizedResumeText.toLowerCase();
        const mentionedSkills = sections.skills.filter(skill => 
          lowerText.includes(skill.toLowerCase())
        );
        skillRelevanceScore = (mentionedSkills.length / sections.skills.length) * 100;
        embeddingsMetadata = {
          method: 'fallback',
          error: error.message,
          embeddingsUsed: false,
        };
      }
    }
    
    const skillsScore = scoreSkills(sections.skills || [], sanitizedResumeText, skillRelevanceScore);
    const formattingScore = scoreFormatting(detectedSections, sanitizedResumeText);

    const ruleBasedScores = {
      contactInfo: contactScore,
      skills: skillsScore,
      formatting: formattingScore,
    };

    // Step 4: Use AI only for summary + suggestions (reduced prompt)
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured, using fallback analysis');
      return generateFallbackAnalysis(analysisType, sanitizedResumeText, sanitizedJobDescription);
    }

    logger.info('Generating AI analysis for summary and suggestions...');
    const aiPrompt = generateAIPrompt(analysisType, sections, sanitizedResumeText, sanitizedJobDescription, ruleBasedScores);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // Default to cost-effective model
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyst. Provide ONLY summary analysis, section scores (for summary/experience/education/achievements), strengths, weaknesses, and recommendations. Contact, Skills, and Formatting scores are already calculated. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: aiPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000, // Reduced from 4000 since we're doing less work
      response_format: { type: 'json_object' },
    });

    const processingTime = Date.now() - startTime;
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response:', parseError);
      logger.error('Response content:', content);
      throw new Error('Invalid JSON response from AI');
    }

    // Step 5: Merge rule-based scores with AI analysis
    const mergedSectionScores = {
      contactInfo: ruleBasedScores.contactInfo,
      skills: ruleBasedScores.skills,
      formatting: ruleBasedScores.formatting,
      summary: aiAnalysis.sectionScores?.summary || 0,
      experience: aiAnalysis.sectionScores?.experience || 0,
      education: aiAnalysis.sectionScores?.education || 0,
      achievements: aiAnalysis.sectionScores?.achievements || 0,
    };

    // Calculate overall score from merged section scores
    const overallScore = calculateOverallScore(mergedSectionScores);

    // Merge everything into final analysis
    const analysis = {
      overallScore,
      sectionScores: mergedSectionScores,
      strengths: aiAnalysis.strengths || [],
      weaknesses: aiAnalysis.weaknesses || [],
      recommendations: aiAnalysis.recommendations || [],
      skillsAnalysis: {
        detected: sections.skills || [],
        missing: aiAnalysis.skillsAnalysis?.missing || [],
        recommendations: aiAnalysis.skillsAnalysis?.recommendations || [],
        categorized: aiAnalysis.skillsAnalysis?.categorized || {
          technical: [],
          soft: [],
          industry: [],
          other: [],
        },
        // Add embeddings metadata for visibility
        embeddingsMetadata: embeddingsMetadata || null,
      },
    };

    // Validate and normalize
    const validation = validateAnalysisResponse(analysis, analysisType);
    if (!validation.valid) {
      logger.warn('Analysis response validation failed, normalizing:', validation.errors);
      const normalized = normalizeAnalysisResponse(analysis);
      return {
        analysis: normalized,
        tokensUsed: response.usage?.total_tokens || 0,
        model: `hybrid-${model}`,
        processingTime,
        rawResponse: content,
      };
    }

    // Log embeddings verification summary
    if (embeddingsMetadata) {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('📊 EMBEDDINGS VERIFICATION SUMMARY');
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`Method: ${embeddingsMetadata.method.toUpperCase()}`);
      logger.info(`Embeddings Used: ${embeddingsMetadata.embeddingsUsed ? '✅ YES' : '❌ NO (Fallback)'}`);
      if (embeddingsMetadata.embeddingsUsed) {
        logger.info(`Skills Processed: ${embeddingsMetadata.skillCount || 0}`);
        logger.info(`Resume Chunks: ${embeddingsMetadata.resumeChunks || 0}`);
        logger.info(`Similarity Calculations: ${embeddingsMetadata.similarityCalculations || 0}`);
        logger.info(`Average Similarity: ${embeddingsMetadata.averageSimilarity ? Math.round(embeddingsMetadata.averageSimilarity * 100) / 100 : 'N/A'}`);
        logger.info(`Processing Time: ${embeddingsMetadata.processingTime || 0}ms`);
        if (embeddingsMetadata.topMatches && embeddingsMetadata.topMatches.length > 0) {
          logger.info(`Top Matches: ${embeddingsMetadata.topMatches.map(m => `${m.skill} (${m.similarity})`).join(', ')}`);
        }
      } else {
        logger.info(`Fallback Reason: ${embeddingsMetadata.error || 'API key not configured'}`);
      }
      logger.info(`Final Skills Score: ${mergedSectionScores.skills}/100`);
      logger.info('═══════════════════════════════════════════════════════');
    }

    const result = {
      analysis: validation.data,
      tokensUsed: response.usage?.total_tokens || 0,
      model: `hybrid-${model}`,
      processingTime,
      rawResponse: content,
      cached: false,
    };

    // Step 6: Cache result (COST OPTIMIZATION)
    await setCachedResult(cacheKey, result);

    return result;
  } catch (error) {
    logger.error('Error in hybrid AI analysis:', error);
    
    // If OpenAI fails, fall back to basic analysis
    if (error.status === 429 || error.status === 503 || !process.env.OPENAI_API_KEY) {
      logger.info('Falling back to basic analysis');
      return generateFallbackAnalysis(analysisType, resumeText, jobDescription);
    }
    
    throw error;
  }
};

/**
 * @module services/analysisService
 * @exports {Function} analyzeResumeWithAI - Main resume analysis function
 */
module.exports = {
  analyzeResumeWithAI,
};

