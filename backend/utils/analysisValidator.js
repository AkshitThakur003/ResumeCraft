/**
 * Analysis Response Validation Utility
 * Validates AI analysis responses to ensure they match expected schema
 * @module utils/analysisValidator
 */

const { z } = require('zod');
const logger = require('./logger');

// Section scores schema
const sectionScoresSchema = z.object({
  contactInfo: z.number().min(0).max(100).optional(),
  summary: z.number().min(0).max(100).optional(),
  experience: z.number().min(0).max(100).optional(),
  education: z.number().min(0).max(100).optional(),
  skills: z.number().min(0).max(100).optional(),
  achievements: z.number().min(0).max(100).optional(),
  formatting: z.number().min(0).max(100).optional(),
  atsOptimization: z.number().min(0).max(100).optional(),
}).passthrough(); // Allow additional fields

// Strength schema
const strengthSchema = z.object({
  category: z.string(),
  description: z.string(),
  examples: z.array(z.string()).optional(),
}).passthrough();

// Weakness schema
const weaknessSchema = z.object({
  category: z.string(),
  description: z.string(),
  impact: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
}).passthrough();

// Recommendation schema
const recommendationSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  actionItems: z.array(z.string()).optional(),
}).passthrough();

// Skills analysis schema
const skillsAnalysisSchema = z.object({
  detected: z.array(z.string()).optional(),
  missing: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  categorized: z.object({
    technical: z.array(z.string()).optional(),
    soft: z.array(z.string()).optional(),
    industry: z.array(z.string()).optional(),
    other: z.array(z.string()).optional(),
  }).optional(),
}).passthrough();

// Base analysis schema
const baseAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  sectionScores: sectionScoresSchema.optional(),
  strengths: z.array(strengthSchema).optional(),
  weaknesses: z.array(weaknessSchema).optional(),
  recommendations: z.array(recommendationSchema).optional(),
  skillsAnalysis: skillsAnalysisSchema.optional(),
}).passthrough();

/**
 * Validate general analysis response
 * @param {any} analysis - Analysis response object
 * @returns {{valid: boolean, data: any, errors: any[]}} Validation result
 */
const validateGeneralAnalysis = (analysis) => {
  try {
    const validated = baseAnalysisSchema.parse(analysis);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      valid: false,
      data: null,
      errors: [{ message: error.message }],
    };
  }
};

/**
 * Validate ATS analysis response
 * @param {any} analysis - Analysis response object
 * @returns {{valid: boolean, data: any, errors: any[]}} Validation result
 */
const validateATSAnalysis = (analysis) => {
  try {
    const atsSchema = baseAnalysisSchema.extend({
      atsAnalysis: z.object({
        score: z.number().min(0).max(100).optional(),
        issues: z.array(z.object({
          type: z.enum(['keyword', 'formatting', 'structure', 'content']).optional(),
          severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
          description: z.string().optional(),
          location: z.string().optional(),
          fix: z.string().optional(),
        })).optional(),
        optimizations: z.array(z.object({
          category: z.string().optional(),
          suggestion: z.string().optional(),
          impact: z.string().optional(),
        })).optional(),
        keywords: z.object({
          found: z.array(z.string()).optional(),
          missing: z.array(z.string()).optional(),
          density: z.number().optional(),
        }).optional(),
      }).optional(),
    }).passthrough();

    const validated = atsSchema.parse(analysis);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      valid: false,
      data: null,
      errors: [{ message: error.message }],
    };
  }
};

/**
 * Validate JD matching analysis response
 * @param {any} analysis - Analysis response object
 * @returns {{valid: boolean, data: any, errors: any[]}} Validation result
 */
const validateJDMatchAnalysis = (analysis) => {
  try {
    const jdMatchSchema = baseAnalysisSchema.extend({
      jobDescriptionMatch: z.object({
        score: z.number().min(0).max(100).optional(),
        skillsMatch: z.object({
          matched: z.array(z.string()).optional(),
          missing: z.array(z.string()).optional(),
          percentage: z.number().optional(),
        }).optional(),
        requirementsMatch: z.object({
          met: z.array(z.string()).optional(),
          unmet: z.array(z.string()).optional(),
          percentage: z.number().optional(),
        }).optional(),
        recommendations: z.array(z.string()).optional(),
      }).optional(),
    }).passthrough();

    const validated = jdMatchSchema.parse(analysis);
    return { valid: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      valid: false,
      data: null,
      errors: [{ message: error.message }],
    };
  }
};

/**
 * Validate and normalize analysis response based on type
 * @param {any} analysis - Analysis response object
 * @param {string} analysisType - Type of analysis
 * @returns {{valid: boolean, data: any, errors: any[]}} Validation result
 */
const validateAnalysisResponse = (analysis, analysisType) => {
  if (!analysis || typeof analysis !== 'object') {
    return {
      valid: false,
      data: null,
      errors: [{ message: 'Analysis response must be an object' }],
    };
  }

  // Ensure overallScore is a valid number
  if (typeof analysis.overallScore !== 'number' || 
      analysis.overallScore < 0 || 
      analysis.overallScore > 100) {
    analysis.overallScore = Math.max(0, Math.min(100, Number(analysis.overallScore) || 0));
  }

  switch (analysisType) {
    case 'ats':
      return validateATSAnalysis(analysis);
    case 'jd_match':
      return validateJDMatchAnalysis(analysis);
    case 'general':
    default:
      return validateGeneralAnalysis(analysis);
  }
};

/**
 * Normalize analysis response (fix common issues without strict validation)
 * @param {any} analysis - Analysis response object
 * @returns {any} Normalized analysis
 */
const normalizeAnalysisResponse = (analysis) => {
  if (!analysis || typeof analysis !== 'object') {
    return null;
  }

  const normalized = { ...analysis };

  // Ensure overallScore is valid
  if (typeof normalized.overallScore !== 'number') {
    normalized.overallScore = 0;
  } else {
    normalized.overallScore = Math.max(0, Math.min(100, normalized.overallScore));
  }

  // Ensure arrays exist
  normalized.strengths = Array.isArray(normalized.strengths) ? normalized.strengths : [];
  normalized.weaknesses = Array.isArray(normalized.weaknesses) ? normalized.weaknesses : [];
  normalized.recommendations = Array.isArray(normalized.recommendations) ? normalized.recommendations : [];

  // Ensure sectionScores is an object
  if (!normalized.sectionScores || typeof normalized.sectionScores !== 'object') {
    normalized.sectionScores = {};
  }

  return normalized;
};

module.exports = {
  validateAnalysisResponse,
  validateGeneralAnalysis,
  validateATSAnalysis,
  validateJDMatchAnalysis,
  normalizeAnalysisResponse,
};

