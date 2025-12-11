/**
 * @fileoverview Content Moderation Utility
 * @module utils/contentModerator
 * @description Modulates AI-generated content for safety, toxicity, and PII detection
 */

const OpenAI = require('openai');
const logger = require('./logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Detect PII (Personally Identifiable Information) in content
 * @param {string} content - Content to scan for PII
 * @returns {Object} PII detection results
 */
const detectPII = (content) => {
  const issues = [];
  const detectedPII = [];
  
  if (!content || typeof content !== 'string') {
    return { hasPII: false, issues, detectedPII };
  }

  // Email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = content.match(emailPattern);
  if (emails && emails.length > 0) {
    issues.push('Email addresses detected');
    detectedPII.push(...emails.map(email => ({ type: 'email', value: email })));
  }

  // Phone number patterns (US and international)
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = content.match(phonePattern);
  if (phones && phones.length > 0) {
    issues.push('Phone numbers detected');
    detectedPII.push(...phones.map(phone => ({ type: 'phone', value: phone })));
  }

  // SSN pattern (XXX-XX-XXXX)
  const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ssns = content.match(ssnPattern);
  if (ssns && ssns.length > 0) {
    issues.push('Social Security Numbers detected');
    detectedPII.push(...ssns.map(ssn => ({ type: 'ssn', value: ssn })));
  }

  // Credit card pattern (basic - 13-19 digits with optional dashes/spaces)
  const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  const creditCards = content.match(creditCardPattern);
  if (creditCards && creditCards.length > 0) {
    issues.push('Credit card numbers detected');
    detectedPII.push(...creditCards.map(cc => ({ type: 'credit_card', value: cc })));
  }

  // Date of birth patterns (MM/DD/YYYY, YYYY-MM-DD, etc.)
  const dobPattern = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  const dobs = content.match(dobPattern);
  if (dobs && dobs.length > 0) {
    // Filter to likely DOB patterns (not just any date)
    const likelyDOBs = dobs.filter(date => {
      const parts = date.split(/[\/\-]/);
      if (parts.length === 3) {
        const year = parseInt(parts[2] || parts[0]);
        return year >= 1900 && year <= new Date().getFullYear();
      }
      return false;
    });
    if (likelyDOBs.length > 0) {
      issues.push('Potential dates of birth detected');
      detectedPII.push(...likelyDOBs.map(dob => ({ type: 'dob', value: dob })));
    }
  }

  return {
    hasPII: detectedPII.length > 0,
    issues,
    detectedPII,
    count: detectedPII.length,
  };
};

/**
 * Moderate content using OpenAI's moderation API
 * @param {string} content - Content to moderate
 * @returns {Promise<Object>} Moderation results
 */
const moderateContent = async (content) => {
  if (!content || typeof content !== 'string') {
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      error: 'Invalid content provided',
    };
  }

  // Skip moderation if API key is not available
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OpenAI API key not available, skipping content moderation');
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      skipped: true,
    };
  }

  try {
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    const categories = result.categories;
    const categoryScores = result.category_scores;

    // Check for specific harmful categories
    const harmfulCategories = [
      'hate',
      'hate/threatening',
      'harassment',
      'harassment/threatening',
      'self-harm',
      'self-harm/intent',
      'self-harm/instructions',
      'sexual',
      'sexual/minors',
      'violence',
      'violence/graphic',
    ];

    const flaggedCategories = harmfulCategories.filter(cat => categories[cat]);

    return {
      flagged: result.flagged,
      categories,
      categoryScores,
      flaggedCategories,
      hasHarmfulContent: flaggedCategories.length > 0,
    };
  } catch (error) {
    logger.error('Error in content moderation:', {
      error: error.message,
      stack: error.stack,
    });
    
    // On error, return safe defaults but log the issue
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
      error: 'Moderation check failed',
      moderationError: error.message,
    };
  }
};

/**
 * Check for toxic or inappropriate language patterns
 * @param {string} content - Content to check
 * @returns {Object} Toxicity check results
 */
const checkToxicity = (content) => {
  if (!content || typeof content !== 'string') {
    return { isToxic: false, issues: [] };
  }

  const issues = [];
  const contentLower = content.toLowerCase();

  // Common toxic/inappropriate patterns
  const toxicPatterns = [
    /\b(fuck|shit|damn|hell|asshole|bitch|bastard)\b/gi,
    // Add more patterns as needed
  ];

  // Profanity check
  toxicPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Inappropriate language detected: ${matches.length} instance(s)`);
    }
  });

  return {
    isToxic: issues.length > 0,
    issues,
    severity: issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low',
  };
};

/**
 * Comprehensive content moderation check
 * @param {string} content - Content to moderate
 * @param {Object} options - Moderation options
 * @returns {Promise<Object>} Complete moderation results
 */
const moderateContentComprehensive = async (content, options = {}) => {
  const {
    checkPII = true,
    checkModeration = true,
    checkToxicity: checkToxicityFlag = true,
  } = options;

  const results = {
    safe: true,
    issues: [],
    warnings: [],
    pii: null,
    moderation: null,
    toxicity: null,
  };

  // Check PII
  if (checkPII) {
    results.pii = detectPII(content);
    if (results.pii.hasPII) {
      results.safe = false;
      results.issues.push(...results.pii.issues);
      results.warnings.push(
        `⚠️ Personal information detected: ${results.pii.count} item(s). ` +
        `Please review and remove sensitive data before sharing.`
      );
    }
  }

  // Check OpenAI moderation
  if (checkModeration) {
    results.moderation = await moderateContent(content);
    if (results.moderation.flagged || results.moderation.hasHarmfulContent) {
      results.safe = false;
      results.issues.push('Harmful or inappropriate content detected');
      results.warnings.push(
        '⚠️ Content may contain harmful, hateful, or inappropriate material. ' +
        'Please review and revise before sharing.'
      );
    }
  }

  // Check toxicity patterns
  if (checkToxicityFlag) {
    results.toxicity = checkToxicity(content);
    if (results.toxicity.isToxic) {
      results.safe = false;
      results.issues.push(...results.toxicity.issues);
      results.warnings.push(
        '⚠️ Inappropriate language detected. Please use professional language.'
      );
    }
  }

  // Calculate overall safety score (0-100)
  let safetyScore = 100;
  if (results.pii?.hasPII) safetyScore -= 30;
  if (results.moderation?.flagged) safetyScore -= 50;
  if (results.toxicity?.isToxic) safetyScore -= 20;
  safetyScore = Math.max(0, safetyScore);

  results.safetyScore = safetyScore;
  results.status = safetyScore >= 80 ? 'safe' : safetyScore >= 50 ? 'warning' : 'unsafe';

  return results;
};

module.exports = {
  detectPII,
  moderateContent,
  checkToxicity,
  moderateContentComprehensive,
};

