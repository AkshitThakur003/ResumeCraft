/**
 * @fileoverview Cover Letter Content Validation and Quality Scoring
 * @module utils/coverLetterValidator
 * @description Validates and scores generated cover letters for quality
 */

/**
 * Validate cover letter content structure and completeness
 * @param {string} content - Cover letter content
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @returns {Object} Validation result with score and issues
 */
const validateCoverLetterContent = (content, jobTitle, companyName) => {
  const issues = [];
  const strengths = [];
  let score = 100;

  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      score: 0,
      issues: ['Cover letter content is missing or invalid'],
      strengths: [],
    };
  }

  const trimmedContent = content.trim();
  const wordCount = trimmedContent.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = trimmedContent.length;

  // Length validation
  if (wordCount < 150) {
    issues.push('Cover letter is too short (minimum 150 words recommended)');
    score -= 20;
  } else if (wordCount > 600) {
    issues.push('Cover letter is too long (maximum 600 words recommended)');
    score -= 10;
  } else if (wordCount >= 250 && wordCount <= 400) {
    strengths.push('Optimal length (250-400 words)');
  }

  // Structure validation
  const hasGreeting = /^(Dear|Hello|Hi|To)\s+/i.test(trimmedContent);
  if (!hasGreeting) {
    issues.push('Missing proper greeting (Dear Hiring Manager, etc.)');
    score -= 10;
  } else {
    strengths.push('Includes proper greeting');
  }

  const hasClosing = /(Sincerely|Best regards|Regards|Yours truly|Thank you)/i.test(trimmedContent);
  if (!hasClosing) {
    issues.push('Missing professional closing');
    score -= 10;
  } else {
    strengths.push('Includes professional closing');
  }

  // Paragraph count (should have 3-4 paragraphs)
  const paragraphs = trimmedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 2) {
    issues.push('Too few paragraphs (recommended: 3-4 paragraphs)');
    score -= 15;
  } else if (paragraphs.length > 5) {
    issues.push('Too many paragraphs (recommended: 3-4 paragraphs)');
    score -= 5;
  } else {
    strengths.push('Good paragraph structure');
  }

  // Job title mention
  if (jobTitle && !trimmedContent.toLowerCase().includes(jobTitle.toLowerCase())) {
    issues.push('Job title not mentioned in cover letter');
    score -= 10;
  } else if (jobTitle) {
    strengths.push('Mentions job title');
  }

  // Company name mention
  if (companyName && !trimmedContent.toLowerCase().includes(companyName.toLowerCase())) {
    issues.push('Company name not mentioned in cover letter');
    score -= 10;
  } else if (companyName) {
    strengths.push('Mentions company name');
  }

  // Action verbs check
  const actionVerbs = [
    'achieved', 'managed', 'developed', 'created', 'improved', 'increased', 'led',
    'implemented', 'designed', 'built', 'delivered', 'executed', 'optimized',
    'transformed', 'established', 'collaborated', 'analyzed', 'resolved'
  ];
  const hasActionVerbs = actionVerbs.some(verb => 
    new RegExp(`\\b${verb}\\w*\\b`, 'i').test(trimmedContent)
  );
  if (!hasActionVerbs) {
    issues.push('Limited use of action verbs');
    score -= 5;
  } else {
    strengths.push('Uses action verbs effectively');
  }

  // Quantifiable achievements check
  const hasNumbers = /\d+/.test(trimmedContent);
  if (!hasNumbers) {
    issues.push('No quantifiable achievements mentioned');
    score -= 5;
  } else {
    strengths.push('Includes quantifiable achievements');
  }

  // Personalization check (should not be too generic)
  const genericPhrases = [
    'I am writing to apply',
    'I am interested in',
    'I believe I would be',
    'I am confident that',
  ];
  const genericCount = genericPhrases.filter(phrase => 
    trimmedContent.toLowerCase().includes(phrase.toLowerCase())
  ).length;
  if (genericCount > 2) {
    issues.push('Contains too many generic phrases');
    score -= 10;
  }

  // Readability check (sentence length)
  const sentences = trimmedContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    : 0;
  if (avgSentenceLength > 25) {
    issues.push('Sentences are too long (affects readability)');
    score -= 5;
  } else if (avgSentenceLength >= 15 && avgSentenceLength <= 20) {
    strengths.push('Good sentence length for readability');
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    valid: issues.length === 0 || score >= 60,
    score: Math.round(score),
    issues,
    strengths,
    metrics: {
      wordCount,
      charCount,
      paragraphCount: paragraphs.length,
      sentenceCount: sentences.length,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    },
  };
};

/**
 * Calculate quality score for cover letter
 * @param {string} content - Cover letter content
 * @param {string} jobTitle - Job title
 * @param {string} companyName - Company name
 * @param {string} jobDescription - Job description (optional, for relevance check)
 * @returns {Object} Quality score and breakdown
 */
const calculateQualityScore = (content, jobTitle, companyName, jobDescription = '') => {
  const validation = validateCoverLetterContent(content, jobTitle, companyName);
  
  let relevanceScore = 0;
  if (jobDescription) {
    // Check if cover letter mentions key terms from job description
    const jdWords = jobDescription.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4) // Only meaningful words
      .slice(0, 20); // Top 20 words
    
    const contentLower = content.toLowerCase();
    const matchedWords = jdWords.filter(word => contentLower.includes(word));
    relevanceScore = Math.min(100, (matchedWords.length / jdWords.length) * 100);
  }

  // Overall quality score (70% structure, 30% relevance)
  const overallScore = Math.round(
    validation.score * 0.7 + relevanceScore * 0.3
  );

  return {
    overallScore,
    structureScore: validation.score,
    relevanceScore: Math.round(relevanceScore),
    validation,
    grade: getQualityGrade(overallScore),
  };
};

/**
 * Get quality grade from score
 * @param {number} score - Quality score (0-100)
 * @returns {string} Grade (A+, A, B+, B, C, D, F)
 */
const getQualityGrade = (score) => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

module.exports = {
  validateCoverLetterContent,
  calculateQualityScore,
  getQualityGrade,
};

