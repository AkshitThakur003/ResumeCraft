/**
 * @fileoverview Bias Detection Utility
 * @module utils/biasDetector
 * @description Detects various forms of bias in AI-generated content
 */

const logger = require('./logger');

/**
 * Gender-biased language patterns
 */
const GENDER_BIAS_PATTERNS = {
  masculine: [
    /\b(?:aggressive|assertive|dominant|ambitious|competitive|decisive|independent|leader|powerful|strong|forceful|confident|driven|focused|analytical|logical|rational|technical|engineering|building|creating|developing)\b/gi,
  ],
  feminine: [
    /\b(?:nurturing|empathetic|collaborative|supportive|gentle|caring|compassionate|emotional|sensitive|warm|friendly|helpful|understanding|patient|cooperative|harmonious|team-oriented|inclusive|open-minded)\b/gi,
  ],
  neutral: [
    // Neutral alternatives that should be preferred
    /\b(?:skilled|experienced|professional|capable|effective|successful|excellent|outstanding|qualified|competent|talented|accomplished)\b/gi,
  ],
};

/**
 * Age-related bias patterns
 */
const AGE_BIAS_PATTERNS = {
  young: [
    /\b(?:fresh|energetic|dynamic|tech-savvy|digital native|young talent|recent graduate|entry-level|junior|new generation|modern|cutting-edge|up-and-coming)\b/gi,
  ],
  old: [
    /\b(?:seasoned|veteran|experienced|mature|established|traditional|old-school|overqualified|set in ways|outdated|legacy|senior|elderly)\b/gi,
  ],
};

/**
 * Cultural/ethnic bias indicators
 */
const CULTURAL_BIAS_PATTERNS = [
  /\b(?:native speaker|native English|fluent English|American|Western|European)\b/gi,
  // Patterns that might indicate cultural bias
];

/**
 * Socioeconomic bias indicators
 */
const SOCIOECONOMIC_BIAS_PATTERNS = [
  /\b(?:prestigious|elite|ivy league|top-tier|exclusive|premium|luxury|high-end)\b/gi,
];

/**
 * Check for gender bias in content
 * @param {string} content - Content to analyze
 * @returns {Object} Gender bias detection results
 */
const detectGenderBias = (content) => {
  if (!content || typeof content !== 'string') {
    return { hasBias: false, score: 0, issues: [] };
  }

  const contentLower = content.toLowerCase();
  const issues = [];
  let biasScore = 0;

  // Count masculine-biased terms
  const masculineMatches = GENDER_BIAS_PATTERNS.masculine.flatMap(pattern =>
    content.match(pattern) || []
  );
  const masculineCount = masculineMatches.length;

  // Count feminine-biased terms
  const feminineMatches = GENDER_BIAS_PATTERNS.feminine.flatMap(pattern =>
    content.match(pattern) || []
  );
  const feminineCount = feminineMatches.length;

  // Count neutral terms
  const neutralMatches = GENDER_BIAS_PATTERNS.neutral.flatMap(pattern =>
    content.match(pattern) || []
  );
  const neutralCount = neutralMatches.length;

  const totalBiasedTerms = masculineCount + feminineCount;
  const totalTerms = totalBiasedTerms + neutralCount;

  // Calculate bias score (0-100, higher = more biased)
  if (totalTerms > 0) {
    const biasRatio = totalBiasedTerms / totalTerms;
    biasScore = Math.round(biasRatio * 100);
  }

  // Detect imbalance
  if (masculineCount > feminineCount * 2 && masculineCount > 3) {
    issues.push('Content leans toward masculine-biased language');
  } else if (feminineCount > masculineCount * 2 && feminineCount > 3) {
    issues.push('Content leans toward feminine-biased language');
  }

  if (masculineCount > 0 || feminineCount > 0) {
    if (neutralCount < totalBiasedTerms) {
      issues.push('Consider using more neutral, inclusive language');
    }
  }

  return {
    hasBias: biasScore > 30,
    biasScore,
    masculineTerms: masculineCount,
    feminineTerms: feminineCount,
    neutralTerms: neutralCount,
    issues,
    recommendation: biasScore > 50
      ? 'Significant gender bias detected - use more neutral language'
      : biasScore > 30
      ? 'Some gender bias present - consider neutral alternatives'
      : 'Language appears relatively neutral',
  };
};

/**
 * Check for age-related bias
 * @param {string} content - Content to analyze
 * @returns {Object} Age bias detection results
 */
const detectAgeBias = (content) => {
  if (!content || typeof content !== 'string') {
    return { hasBias: false, issues: [] };
  }

  const issues = [];
  let hasBias = false;

  // Check for young-biased terms
  const youngMatches = AGE_BIAS_PATTERNS.young.flatMap(pattern =>
    content.match(pattern) || []
  );
  const youngCount = youngMatches.length;

  // Check for old-biased terms
  const oldMatches = AGE_BIAS_PATTERNS.old.flatMap(pattern =>
    content.match(pattern) || []
  );
  const oldCount = oldMatches.length;

  if (youngCount > 2) {
    issues.push('Content may favor younger candidates');
    hasBias = true;
  }

  if (oldCount > 2) {
    issues.push('Content may favor more experienced/older candidates');
    hasBias = true;
  }

  return {
    hasBias,
    youngBiasedTerms: youngCount,
    oldBiasedTerms: oldCount,
    issues,
  };
};

/**
 * Check for cultural/ethnic bias
 * @param {string} content - Content to analyze
 * @returns {Object} Cultural bias detection results
 */
const detectCulturalBias = (content) => {
  if (!content || typeof content !== 'string') {
    return { hasBias: false, issues: [] };
  }

  const issues = [];
  let hasBias = false;

  // Check for cultural bias patterns
  CULTURAL_BIAS_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Cultural bias indicator found: "${matches[0]}"`);
      hasBias = true;
    }
  });

  // Check for language requirements that might be exclusionary
  const languageRequirementPattern = /\b(?:must|required|native|fluent)\s+(?:speak|speaking|English|language)\b/gi;
  const languageMatches = content.match(languageRequirementPattern);
  if (languageMatches && languageMatches.length > 0) {
    issues.push('Language requirements may exclude qualified candidates');
    hasBias = true;
  }

  return {
    hasBias,
    issues,
  };
};

/**
 * Check for socioeconomic bias
 * @param {string} content - Content to analyze
 * @returns {Object} Socioeconomic bias detection results
 */
const detectSocioeconomicBias = (content) => {
  if (!content || typeof content !== 'string') {
    return { hasBias: false, issues: [] };
  }

  const issues = [];
  let hasBias = false;

  SOCIOECONOMIC_BIAS_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`Socioeconomic bias indicator: "${matches[0]}"`);
      hasBias = true;
    }
  });

  return {
    hasBias,
    issues,
  };
};

/**
 * Check for inclusive language usage
 * @param {string} content - Content to analyze
 * @returns {Object} Inclusivity analysis results
 */
const checkInclusivity = (content) => {
  if (!content || typeof content !== 'string') {
    return { isInclusive: false, score: 0, suggestions: [] };
  }

  const suggestions = [];
  let inclusivityScore = 100;

  // Check for inclusive terms
  const inclusiveTerms = [
    /\b(?:diverse|inclusive|welcoming|respectful|equitable|accessible|collaborative|team-oriented|supportive|open|accommodating)\b/gi,
  ];
  const inclusiveMatches = inclusiveTerms.flatMap(pattern =>
    content.match(pattern) || []
  );
  const inclusiveCount = inclusiveMatches.length;

  // Check for exclusive language
  const exclusivePatterns = [
    /\b(?:only|must|required|exclusively|not|cannot|unable|unsuitable)\b/gi,
  ];
  const exclusiveMatches = exclusivePatterns.flatMap(pattern =>
    content.match(pattern) || []
  );
  const exclusiveCount = exclusiveMatches.length;

  // Balance check
  if (exclusiveCount > inclusiveCount * 2 && exclusiveCount > 3) {
    suggestions.push('Consider using more inclusive language');
    inclusivityScore -= 20;
  }

  if (inclusiveCount === 0 && content.length > 500) {
    suggestions.push('Consider adding inclusive language to welcome diverse candidates');
    inclusivityScore -= 10;
  }

  return {
    isInclusive: inclusivityScore >= 70,
    score: Math.max(0, Math.min(100, inclusivityScore)),
    inclusiveTerms: inclusiveCount,
    exclusiveTerms: exclusiveCount,
    suggestions,
  };
};

/**
 * Comprehensive bias detection
 * @param {string} content - Content to analyze
 * @returns {Object} Complete bias detection results
 */
const detectBiasComprehensive = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      hasBias: false,
      overallScore: 100,
      gender: null,
      age: null,
      cultural: null,
      socioeconomic: null,
      inclusivity: null,
    };
  }

  const genderBias = detectGenderBias(content);
  const ageBias = detectAgeBias(content);
  const culturalBias = detectCulturalBias(content);
  const socioeconomicBias = detectSocioeconomicBias(content);
  const inclusivity = checkInclusivity(content);

  // Calculate overall bias score (0-100, lower = more biased)
  let overallScore = 100;
  if (genderBias.hasBias) overallScore -= 20;
  if (ageBias.hasBias) overallScore -= 15;
  if (culturalBias.hasBias) overallScore -= 20;
  if (socioeconomicBias.hasBias) overallScore -= 15;
  overallScore = Math.max(0, Math.min(100, overallScore));

  const hasBias = genderBias.hasBias || ageBias.hasBias || 
                  culturalBias.hasBias || socioeconomicBias.hasBias;

  // Collect all issues
  const allIssues = [
    ...genderBias.issues,
    ...ageBias.issues,
    ...culturalBias.issues,
    ...socioeconomicBias.issues,
    ...inclusivity.suggestions,
  ];

  return {
    hasBias,
    overallScore,
    grade: overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : 'D',
    gender: genderBias,
    age: ageBias,
    cultural: culturalBias,
    socioeconomic: socioeconomicBias,
    inclusivity,
    issues: allIssues,
    recommendation: overallScore >= 90
      ? 'Content appears unbiased and inclusive'
      : overallScore >= 75
      ? 'Content is mostly unbiased but could be improved'
      : 'Content may contain bias - review recommended',
  };
};

module.exports = {
  detectGenderBias,
  detectAgeBias,
  detectCulturalBias,
  detectSocioeconomicBias,
  checkInclusivity,
  detectBiasComprehensive,
};

