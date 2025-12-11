/**
 * @fileoverview Cover Letter Generation Service
 * @module services/coverLetterService
 * @description AI-powered cover letter generation service with caching, validation, and retry logic
 */

const crypto = require('crypto');
const OpenAI = require('openai');
const logger = require('../utils/logger');
const { sanitizeJobDescription, sanitizeResumeText } = require('../utils/inputSanitizer');
const { validateCoverLetterContent, calculateQualityScore } = require('../utils/coverLetterValidator');
const { moderateContentComprehensive } = require('../utils/contentModerator');
const { detectHallucinationsComprehensive } = require('../utils/hallucinationDetector');
const { detectBiasComprehensive } = require('../utils/biasDetector');
const CoverLetter = require('../models/CoverLetter');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const {
  MAX_COVER_LETTER_RESUME_LENGTH,
  MAX_COVER_LETTER_JD_LENGTH,
  COVER_LETTER_CACHE_TTL_MS,
  COVER_LETTER_MAX_RETRIES,
  COVER_LETTER_RETRY_DELAY_MS,
  COVER_LETTER_MAX_TOKENS,
  COVER_LETTER_ESTIMATED_OUTPUT_TOKENS,
  COVER_LETTER_TIMEOUT_MS,
} = require('../config/constants');

/**
 * OpenAI client instance
 * @type {OpenAI}
 * @private
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: COVER_LETTER_TIMEOUT_MS,
});

/**
 * Fallback in-memory cache (used only if Redis is unavailable)
 * Key: hash of inputs, Value: { content, metadata, timestamp }
 * @type {Map<string, Object>}
 * @private
 */
const fallbackCache = new Map();

/**
 * Estimate token count for a text string (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 * @private
 */
const estimateTokens = (text) => {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // This is conservative and may overestimate
  return Math.ceil(text.length / 4);
};

/**
 * Calculate total estimated tokens for a generation request
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} tone - Tone
 * @returns {number} Total estimated tokens
 * @private
 */
const calculateTotalTokens = (resumeText, jobDescription, jobTitle, companyName, tone) => {
  const systemMessage = 'You are an expert career counselor and professional writer specializing in crafting compelling cover letters. You understand what recruiters and hiring managers look for and can create personalized, impactful cover letters that highlight a candidate\'s strengths while addressing job requirements.';
  const promptTemplate = generateCoverLetterPrompt('', '', '', '', '');
  
  const systemTokens = estimateTokens(systemMessage);
  const promptBaseTokens = estimateTokens(promptTemplate);
  const resumeTokens = estimateTokens(resumeText);
  const jobDescTokens = estimateTokens(jobDescription);
  const jobTitleTokens = estimateTokens(jobTitle);
  const companyTokens = estimateTokens(companyName);
  const outputTokens = COVER_LETTER_ESTIMATED_OUTPUT_TOKENS;
  
  return systemTokens + promptBaseTokens + resumeTokens + jobDescTokens + 
         jobTitleTokens + companyTokens + outputTokens;
};

/**
 * Generate cache key from inputs
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} tone - Tone
 * @returns {string} Cache key (hash)
 * @private
 */
const generateCacheKey = (resumeText, jobDescription, jobTitle, companyName, tone) => {
  const inputString = `${resumeText}|${jobDescription}|${jobTitle}|${companyName}|${tone}`;
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
      const cached = await redis.get(`coverletter:${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.info('Cover letter cache hit (Redis)', { cacheKey: cacheKey.substring(0, 8) });
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
  if (age > COVER_LETTER_CACHE_TTL_MS) {
    fallbackCache.delete(cacheKey);
    return null;
  }
  
  logger.info('Cover letter cache hit (in-memory)', { cacheKey: cacheKey.substring(0, 8) });
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
      const ttlSeconds = Math.floor(COVER_LETTER_CACHE_TTL_MS / 1000);
      await redis.setex(`coverletter:${cacheKey}`, ttlSeconds, JSON.stringify(result));
      logger.debug('Cover letter cached in Redis', { cacheKey: cacheKey.substring(0, 8) });
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
      if (now - value.timestamp > COVER_LETTER_CACHE_TTL_MS) {
        fallbackCache.delete(key);
      }
    }
  }
};

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} Function result
 * @private
 */
const retryWithBackoff = async (fn, maxRetries = COVER_LETTER_MAX_RETRIES, initialDelay = COVER_LETTER_RETRY_DELAY_MS) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`Cover letter generation attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error.message,
        attempt: attempt + 1,
        maxRetries,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Generate fallback cover letter template
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @returns {string} Fallback cover letter
 * @private
 */
const generateFallbackCoverLetter = (jobTitle, companyName) => {
  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. I am excited about the opportunity to contribute to your team and believe my skills and experience align well with your requirements.

Throughout my career, I have developed a strong foundation in my field and have consistently delivered results. I am confident that I can bring value to ${companyName} and help achieve your organizational goals.

I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to your team. Thank you for considering my application.

Sincerely,
[Your Name]`;
};

/**
 * Validate and truncate inputs
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Object} Validated and truncated inputs with warnings
 * @private
 */
const validateAndTruncateInputs = (resumeText, jobDescription) => {
  const warnings = [];
  
  // Validate and truncate resume text
  let validatedResume = resumeText;
  if (validatedResume.length > MAX_COVER_LETTER_RESUME_LENGTH) {
    warnings.push(`Resume text was truncated from ${validatedResume.length} to ${MAX_COVER_LETTER_RESUME_LENGTH} characters`);
    validatedResume = validatedResume.substring(0, MAX_COVER_LETTER_RESUME_LENGTH);
  }
  
  // Validate and truncate job description
  let validatedJD = jobDescription;
  if (validatedJD.length > MAX_COVER_LETTER_JD_LENGTH) {
    warnings.push(`Job description was truncated from ${validatedJD.length} to ${MAX_COVER_LETTER_JD_LENGTH} characters`);
    validatedJD = validatedJD.substring(0, MAX_COVER_LETTER_JD_LENGTH);
  }
  
  // Check token limits
  const estimatedTokens = calculateTotalTokens(validatedResume, validatedJD, '', '', '');
  if (estimatedTokens > COVER_LETTER_MAX_TOKENS) {
    // Further truncate if needed
    const reductionRatio = COVER_LETTER_MAX_TOKENS / estimatedTokens * 0.9; // 90% to be safe
    const newResumeLength = Math.floor(validatedResume.length * reductionRatio);
    const newJDLength = Math.floor(validatedJD.length * reductionRatio);
    
    if (newResumeLength < validatedResume.length) {
      warnings.push(`Resume text further truncated to ${newResumeLength} characters due to token limits`);
      validatedResume = validatedResume.substring(0, newResumeLength);
    }
    
    if (newJDLength < validatedJD.length) {
      warnings.push(`Job description further truncated to ${newJDLength} characters due to token limits`);
      validatedJD = validatedJD.substring(0, newJDLength);
    }
  }
  
  return {
    resumeText: validatedResume,
    jobDescription: validatedJD,
    warnings,
  };
};

/**
 * Generate a cover letter using AI
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Job description
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} tone - Tone of the cover letter (professional, friendly, formal, enthusiastic)
 * @param {string} template - Template style (traditional, modern, creative, technical, executive)
 * @returns {Promise<Object>} Generated cover letter and metadata
 */
const generateCoverLetter = async (resumeText, jobDescription, jobTitle, companyName, tone = 'professional', template = 'traditional') => {
  const startTime = Date.now();

  try {
    // Step 1: Sanitize inputs (SECURITY)
    const sanitizedResumeText = sanitizeResumeText(resumeText, MAX_COVER_LETTER_RESUME_LENGTH);
    const sanitizedJobDescription = sanitizeJobDescription(jobDescription);
    
    if (!sanitizedResumeText || sanitizedResumeText.trim().length < 50) {
      throw new Error('Resume text is too short or invalid');
    }
    
    if (!sanitizedJobDescription || sanitizedJobDescription.trim().length < 50) {
      throw new Error('Job description is too short or invalid');
    }

    // Step 2: Validate and truncate inputs (COST CONTROL)
    const { resumeText: validatedResume, jobDescription: validatedJD, warnings } = 
      validateAndTruncateInputs(sanitizedResumeText, sanitizedJobDescription);
    
    if (warnings.length > 0) {
      logger.warn('Cover letter input validation warnings', { warnings });
    }

    // Step 3: Check cache (COST OPTIMIZATION)
    const cacheKey = generateCacheKey(validatedResume, validatedJD, jobTitle, companyName, tone);
    const cached = await getCachedResult(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        warnings,
      };
    }

    // Step 4: Check token limits (RELIABILITY)
    const estimatedTokens = calculateTotalTokens(validatedResume, validatedJD, jobTitle, companyName, tone);
    if (estimatedTokens > COVER_LETTER_MAX_TOKENS) {
      throw new Error(
        `Input too large. Estimated ${estimatedTokens} tokens exceeds limit of ${COVER_LETTER_MAX_TOKENS}. ` +
        `Please reduce resume or job description length.`
      );
    }

    logger.info('Generating cover letter with AI...', {
      jobTitle,
      companyName,
      tone,
      resumeLength: validatedResume.length,
      jobDescLength: validatedJD.length,
      estimatedTokens,
    });

    // Step 5: Generate prompt
    const prompt = generateCoverLetterPrompt(
      validatedResume,
      validatedJD,
      jobTitle,
      companyName,
      tone,
      template
    );

    // Step 6: Call OpenAI API with retry logic (RELIABILITY)
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert career counselor and professional writer specializing in crafting compelling cover letters. You understand what recruiters and hiring managers look for and can create personalized, impactful cover letters that highlight a candidate's strengths while addressing job requirements.

CRITICAL GUIDELINES FOR ACCURACY AND FAIRNESS:

1. ACCURACY & FACT-CHECKING (Anti-Hallucination):
   - ONLY mention information explicitly stated in the resume or job description provided
   - DO NOT fabricate, infer, or assume details not present in the source materials
   - DO NOT add specific numbers, metrics, or achievements that aren't in the resume
   - DO NOT invent company names, job titles, or experiences
   - If information is missing, use general professional language rather than making up specifics
   - Cross-reference all claims with the provided resume text before including them

2. BIAS MITIGATION:
   - Use inclusive, neutral language that welcomes candidates from all backgrounds
   - Avoid gender-biased language (use neutral terms like "skilled professional" instead of gender-coded words)
   - Do not make assumptions about age, culture, or socioeconomic status
   - Use diverse examples and inclusive phrasing
   - Focus on skills, qualifications, and achievements rather than demographic characteristics

3. PROFESSIONAL STANDARDS:
   - Maintain a professional, respectful tone throughout
   - Avoid any language that could be considered discriminatory or exclusionary
   - Ensure the content is appropriate for a professional business context
   - Do not include personal information (emails, phone numbers, addresses, SSN, etc.)

4. CONTENT SAFETY:
   - Avoid any harmful, hateful, or inappropriate language
   - Do not include content that could be offensive or discriminatory
   - Keep language professional and suitable for all audiences

Remember: Your primary goal is to create an accurate, inclusive, and professional cover letter that truthfully represents the candidate based ONLY on the information provided.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
    });

    const content = response.choices[0].message.content.trim();
    const tokensUsed = response.usage?.total_tokens || 0;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const processingTime = Date.now() - startTime;
    
    // Calculate cost (GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output)
    const INPUT_COST_PER_MILLION = 0.15;
    const OUTPUT_COST_PER_MILLION = 0.60;
    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
    const totalCost = inputCost + outputCost;

    // Step 7: Validate generated content
    if (!content || content.length < 100) {
      logger.warn('Generated cover letter seems too short, using fallback');
      const fallbackContent = generateFallbackCoverLetter(jobTitle, companyName);
      return {
        content: fallbackContent,
        metadata: {
          wordCount: fallbackContent.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: fallbackContent.length,
          aiModel: 'fallback',
          tokensUsed: 0,
          processingTime,
          cost: 0,
          costBreakdown: {
            inputTokens: 0,
            outputTokens: 0,
            inputCost: 0,
            outputCost: 0,
            totalCost: 0,
          },
        },
        cached: false,
        warnings: [...warnings, 'AI generation failed, used fallback template'],
      };
    }

    // Calculate word and character counts
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = content.length;

    // Step 7b: Validate and score content quality
    const qualityScore = calculateQualityScore(content, jobTitle, companyName, validatedJD);
    const validation = validateCoverLetterContent(content, jobTitle, companyName);

    // Step 7c: Content Moderation (Security & Safety)
    const moderationResults = await moderateContentComprehensive(content, {
      checkPII: true,
      checkModeration: true,
      checkToxicity: true,
    });

    // Step 7d: Hallucination Detection (Accuracy)
    const hallucinationResults = detectHallucinationsComprehensive(content, {
      resumeText: validatedResume,
      jobDescription: validatedJD,
      jobTitle,
      companyName,
    });

    // Step 7e: Bias Detection (Fairness & Inclusivity)
    const biasResults = detectBiasComprehensive(content);

    // Combine all warnings and issues
    const allWarnings = [...warnings];
    const allIssues = [];

    // Add moderation warnings
    if (!moderationResults.safe) {
      allWarnings.push(...moderationResults.warnings);
      allIssues.push(...moderationResults.issues);
      logger.warn('Content moderation issues detected', {
        safetyScore: moderationResults.safetyScore,
        issues: moderationResults.issues,
      });
    }

    // Add hallucination warnings
    if (hallucinationResults.hasHallucinations || !hallucinationResults.isReliable) {
      allWarnings.push(...hallucinationResults.warnings);
      allIssues.push(...hallucinationResults.issues);
      logger.warn('Potential hallucinations detected', {
        confidence: hallucinationResults.overallConfidence,
        unmatchedClaims: hallucinationResults.unmatchedClaims.length,
      });
    }

    // Add bias warnings
    if (biasResults.hasBias) {
      allWarnings.push(...biasResults.issues);
      logger.warn('Bias detected in generated content', {
        overallScore: biasResults.overallScore,
        grade: biasResults.grade,
      });
    }

    logger.info('Cover letter generated successfully', {
      wordCount,
      characterCount,
      tokensUsed,
      processingTime,
      estimatedTokens,
      qualityScore: qualityScore.overallScore,
      grade: qualityScore.grade,
      safetyScore: moderationResults.safetyScore,
      hallucinationConfidence: hallucinationResults.overallConfidence,
      biasScore: biasResults.overallScore,
    });

    const result = {
      content,
      metadata: {
        wordCount,
        characterCount,
        aiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        tokensUsed,
        processingTime,
        estimatedTokens,
        qualityScore: qualityScore.overallScore,
        qualityGrade: qualityScore.grade,
        structureScore: qualityScore.structureScore,
        relevanceScore: qualityScore.relevanceScore,
        validation: {
          valid: validation.valid,
          issues: validation.issues,
          strengths: validation.strengths,
          metrics: validation.metrics,
        },
        // Security & Safety Metrics
        moderation: {
          safe: moderationResults.safe,
          safetyScore: moderationResults.safetyScore,
          status: moderationResults.status,
          hasPII: moderationResults.pii?.hasPII || false,
          piiCount: moderationResults.pii?.count || 0,
          flagged: moderationResults.moderation?.flagged || false,
        },
        // Accuracy Metrics
        hallucination: {
          hasHallucinations: hallucinationResults.hasHallucinations,
          confidence: hallucinationResults.overallConfidence,
          isReliable: hallucinationResults.isReliable,
          verificationRate: hallucinationResults.verificationRate,
          unmatchedClaimsCount: hallucinationResults.unmatchedClaims?.length || 0,
          recommendation: hallucinationResults.recommendation,
        },
        // Fairness Metrics
        bias: {
          hasBias: biasResults.hasBias,
          overallScore: biasResults.overallScore,
          grade: biasResults.grade,
          recommendation: biasResults.recommendation,
        },
        cost: totalCost,
        costBreakdown: {
          inputTokens,
          outputTokens,
          inputCost: Math.round(inputCost * 10000) / 10000, // Round to 4 decimals
          outputCost: Math.round(outputCost * 10000) / 10000,
          totalCost: Math.round(totalCost * 10000) / 10000,
        },
      },
      cached: false,
      warnings: allWarnings,
      issues: allIssues,
      // Add disclaimer
      disclaimer: 'This cover letter was generated by AI. Please review carefully for accuracy, bias, and appropriateness before sending. Verify all facts, numbers, and claims against your actual resume and experience.',
    };

    // Step 8: Cache result (COST OPTIMIZATION)
    await setCachedResult(cacheKey, result);

    return result;
  } catch (error) {
    logger.error('Error generating cover letter:', {
      error: error.message,
      stack: error.stack,
      jobTitle,
      companyName,
    });

    // Fallback on error (USER EXPERIENCE)
    if (error.status === 429 || error.status === 503 || !process.env.OPENAI_API_KEY) {
      logger.info('Using fallback cover letter due to API unavailability');
      const fallbackContent = generateFallbackCoverLetter(jobTitle, companyName);
      return {
        content: fallbackContent,
        metadata: {
          wordCount: fallbackContent.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: fallbackContent.length,
          aiModel: 'fallback',
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
          cost: 0,
          costBreakdown: {
            inputTokens: 0,
            outputTokens: 0,
            inputCost: 0,
            outputCost: 0,
            totalCost: 0,
          },
        },
        cached: false,
        warnings: ['AI service unavailable, used fallback template'],
      };
    }

    throw new Error(`Failed to generate cover letter: ${error.message}`);
  }
};

/**
 * Cover letter templates for different styles
 * @type {Object}
 * @private
 */
const TEMPLATES = {
  traditional: {
    name: 'Traditional',
    description: 'Classic business format, conservative and professional',
    instructions: 'Use a traditional business letter format with formal language. Follow standard business letter conventions.',
  },
  modern: {
    name: 'Modern',
    description: 'Contemporary style with engaging opening and clear value proposition',
    instructions: 'Use a modern, engaging style. Start with a compelling hook. Be concise and results-focused.',
  },
  creative: {
    name: 'Creative',
    description: 'Stand out with a unique approach while remaining professional',
    instructions: 'Use a creative, memorable approach while staying professional. Show personality and originality.',
  },
  technical: {
    name: 'Technical',
    description: 'For technical roles, emphasize skills and achievements',
    instructions: 'Focus on technical skills, projects, and quantifiable achievements. Be specific about technologies and tools.',
  },
  executive: {
    name: 'Executive',
    description: 'For senior roles, emphasize leadership and strategic impact',
    instructions: 'Emphasize leadership experience, strategic thinking, and high-level achievements. Use executive-level language.',
  },
};

/**
 * Generate the prompt for cover letter generation
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} tone - Tone preference
 * @param {string} template - Template style (optional)
 * @returns {string} Generated prompt
 */
const generateCoverLetterPrompt = (resumeText, jobDescription, jobTitle, companyName, tone, template = 'traditional') => {
  const toneInstructions = {
    professional: 'Use a professional, confident tone. Be respectful and demonstrate competence.',
    friendly: 'Use a warm, approachable tone while maintaining professionalism. Show enthusiasm and personality.',
    formal: 'Use a formal, traditional business tone. Be very respectful and conservative in language.',
    enthusiastic: 'Use an energetic, passionate tone. Show excitement and genuine interest in the role.',
  };

  const templateInfo = TEMPLATES[template] || TEMPLATES.traditional;

  return `Generate a compelling cover letter for the following position:

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

INSTRUCTIONS:
1. Write a personalized cover letter that:
   - Addresses the hiring manager (use "Dear Hiring Manager" if name is not available)
   - Opens with a strong hook that demonstrates interest in the specific role and company
   - Highlights 2-3 key qualifications from the resume that directly match the job requirements
   - Provides specific examples of relevant experience and achievements
   - Demonstrates knowledge of the company (if possible from job description)
   - Shows enthusiasm for the role
   - Closes with a call to action requesting an interview

2. Tone: ${toneInstructions[tone] || toneInstructions.professional}

3. Template Style: ${templateInfo.name} - ${templateInfo.description}
   ${templateInfo.instructions}

4. Length: Aim for 250-400 words (3-4 paragraphs)

5. Structure:
   - Opening paragraph: Express interest and mention the specific position
   - Body paragraph(s): Highlight relevant experience and skills with specific examples
   - Closing paragraph: Reiterate interest and request next steps

6. Key Requirements:
   - Be specific and avoid generic statements
   - Use action verbs and quantifiable achievements when possible
   - Match the language and keywords from the job description
   - Show how the candidate's experience aligns with the role requirements
   - Be authentic and avoid clichés

7. Do NOT include:
   - Salary expectations
   - Availability dates (unless specifically relevant)
   - Negative comments about previous employers
   - Overly personal information
   - Any information not explicitly stated in the resume or job description
   - Fabricated numbers, metrics, or achievements
   - Assumed details about the candidate's background

8. CRITICAL ACCURACY REQUIREMENTS:
   - Verify every fact, number, and claim against the provided resume
   - Only mention skills, experiences, or achievements that are clearly stated in the resume
   - If a detail is not in the resume, use general professional language instead of inventing specifics
   - Do not infer or assume information that isn't explicitly provided

9. INCLUSIVITY REQUIREMENTS:
   - Use neutral, inclusive language throughout
   - Avoid gender-coded terms - use "skilled professional" instead of "assertive leader" or "empathetic collaborator"
   - Focus on qualifications and achievements, not personal characteristics
   - Ensure language is welcoming to all candidates regardless of background

Generate ONLY the cover letter content (no headers, no explanations, just the letter itself). Ensure all claims are verifiable against the provided resume.`;
};

/**
 * Generate multiple versions of a cover letter (A/B testing)
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Job description
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {number} count - Number of versions to generate (default: 2, max: 5)
 * @returns {Promise<Array>} Array of generated cover letters
 */
const generateMultipleVersions = async (resumeText, jobDescription, jobTitle, companyName, count = 2) => {
  const maxVersions = Math.min(count, 2); // Fixed to maximum 2 versions
  const templates = Object.keys(TEMPLATES);
  const tones = ['professional', 'friendly', 'formal', 'enthusiastic'];
  
  const versions = [];
  
  for (let i = 0; i < maxVersions; i++) {
    // Vary template and tone for diversity
    const template = templates[i % templates.length];
    const tone = tones[i % tones.length];
    
    try {
      const result = await generateCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        tone,
        template
      );
      
      versions.push({
        ...result,
        versionNumber: i + 1,
        template,
        tone,
      });
    } catch (error) {
      logger.error(`Failed to generate version ${i + 1}:`, error);
      // Continue with other versions even if one fails
    }
  }
  
  return versions;
};

/**
 * Get available templates
 * @returns {Array} Array of template objects
 */
const getAvailableTemplates = () => {
  return Object.entries(TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
};

module.exports = {
  generateCoverLetter,
  generateMultipleVersions,
  getAvailableTemplates,
  TEMPLATES,
};
