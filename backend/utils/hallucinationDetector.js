/**
 * @fileoverview Hallucination Detection Utility
 * @module utils/hallucinationDetector
 * @description Detects AI hallucinations by cross-referencing generated content with source materials
 */

const logger = require('./logger');

/**
 * Extract key facts and claims from text
 * @param {string} text - Text to extract facts from
 * @returns {Array} Array of extracted facts
 */
const extractFacts = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const facts = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    
    // Extract quantifiable claims (numbers, percentages, metrics)
    const numberPattern = /\b\d+(?:\.\d+)?\s*(?:%|percent|years?|months?|years? of experience|people|team members?|projects?|companies?|dollars?|\$|million|billion)\b/gi;
    const numbers = trimmed.match(numberPattern);
    if (numbers && numbers.length > 0) {
      facts.push({
        type: 'quantifiable',
        content: trimmed,
        metrics: numbers,
      });
    }

    // Extract skill/technology mentions
    const skillPattern = /\b(?:JavaScript|Python|Java|React|Node\.?js|AWS|Azure|GCP|Docker|Kubernetes|SQL|MongoDB|PostgreSQL|Git|Agile|Scrum|TypeScript|Angular|Vue|PHP|Ruby|Go|Rust|C\+\+|C#|\.NET|Swift|Kotlin|Machine Learning|AI|Data Science|DevOps|CI\/CD)\b/gi;
    const skills = trimmed.match(skillPattern);
    if (skills && skills.length > 0) {
      facts.push({
        type: 'skills',
        content: trimmed,
        skills: skills,
      });
    }

    // Extract job titles and positions
    const titlePattern = /\b(?:Engineer|Developer|Manager|Director|Lead|Senior|Junior|Intern|Consultant|Analyst|Specialist|Architect|Designer|Developer|Programmer)\b/gi;
    const titles = trimmed.match(titlePattern);
    if (titles && titles.length > 0) {
      facts.push({
        type: 'positions',
        content: trimmed,
        titles: titles,
      });
    }

    // Extract company names (capitalized words/phrases)
    const companyPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Systems|Solutions))?\b/g;
    const companies = trimmed.match(companyPattern);
    if (companies && companies.length > 0) {
      // Filter out common false positives
      const commonWords = ['Dear', 'Hello', 'Hi', 'Thank', 'Sincerely', 'Best', 'Regards', 'The'];
      const filteredCompanies = companies.filter(c => !commonWords.includes(c));
      if (filteredCompanies.length > 0) {
        facts.push({
          type: 'companies',
          content: trimmed,
          companies: filteredCompanies,
        });
      }
    }
  });

  return facts;
};

/**
 * Check if claims in generated content can be verified in source material
 * @param {string} generatedContent - AI-generated content
 * @param {string} resumeText - Source resume text
 * @param {string} jobDescription - Source job description (optional)
 * @returns {Object} Hallucination detection results
 */
const detectHallucinations = (generatedContent, resumeText, jobDescription = '') => {
  if (!generatedContent || typeof generatedContent !== 'string') {
    return {
      hasHallucinations: false,
      confidence: 100,
      issues: [],
      warnings: [],
      unmatchedClaims: [],
    };
  }

  const issues = [];
  const warnings = [];
  const unmatchedClaims = [];
  let confidenceScore = 100;

  // Extract facts from generated content
  const generatedFacts = extractFacts(generatedContent);
  
  // Extract facts from source materials
  const resumeFacts = extractFacts(resumeText);
  const jdFacts = extractFacts(jobDescription);

  // Combine source facts for cross-referencing
  const allSourceFacts = [...resumeFacts, ...jdFacts];
  const sourceText = `${resumeText} ${jobDescription}`.toLowerCase();

  // Check each fact in generated content against sources
  generatedFacts.forEach(fact => {
    const factText = fact.content.toLowerCase();
    let isVerified = false;

    // Check quantifiable claims
    if (fact.type === 'quantifiable' && fact.metrics) {
      // Check if the metric is mentioned in source
      fact.metrics.forEach(metric => {
        const metricLower = metric.toLowerCase();
        if (!sourceText.includes(metricLower)) {
          // Check for similar metrics (allow some variation)
          const metricNumber = metric.match(/\d+(?:\.\d+)?/)?.[0];
          if (metricNumber && !sourceText.includes(metricNumber)) {
            unmatchedClaims.push({
              type: 'quantifiable',
              claim: fact.content,
              metric: metric,
              severity: 'medium',
            });
          }
        } else {
          isVerified = true;
        }
      });
    }

    // Check skills mentioned
    if (fact.type === 'skills' && fact.skills) {
      const unverifiedSkills = fact.skills.filter(skill => {
        const skillLower = skill.toLowerCase();
        return !sourceText.includes(skillLower);
      });

      if (unverifiedSkills.length > 0) {
        unmatchedClaims.push({
          type: 'skills',
          claim: fact.content,
          unverifiedSkills: unverifiedSkills,
          severity: 'high', // Skills are important - high severity if hallucinated
        });
      } else {
        isVerified = true;
      }
    }

    // Check job titles/positions
    if (fact.type === 'positions') {
      // Positions are often inferred, so lower severity
      // Just warn if many positions are mentioned that aren't in resume
      if (!sourceText.includes(factText.substring(0, 20).toLowerCase())) {
        warnings.push(`Position claim may not be directly from resume: "${fact.content.substring(0, 50)}"`);
      }
    }

    // Check company names
    if (fact.type === 'companies' && fact.companies) {
      const unverifiedCompanies = fact.companies.filter(company => {
        const companyLower = company.toLowerCase();
        return !sourceText.includes(companyLower);
      });

      if (unverifiedCompanies.length > 0) {
        unmatchedClaims.push({
          type: 'companies',
          claim: fact.content,
          unverifiedCompanies: unverifiedCompanies,
          severity: 'high', // Companies shouldn't be fabricated
        });
      }
    }
  });

  // Calculate confidence score based on unmatched claims
  if (unmatchedClaims.length > 0) {
    const highSeverityCount = unmatchedClaims.filter(c => c.severity === 'high').length;
    const mediumSeverityCount = unmatchedClaims.filter(c => c.severity === 'medium').length;

    confidenceScore -= (highSeverityCount * 20) + (mediumSeverityCount * 10);
    confidenceScore = Math.max(0, confidenceScore);

    issues.push(`${unmatchedClaims.length} claim(s) could not be verified in source materials`);
  }

  // Check for overly specific claims that might be fabricated
  const overlySpecificPattern = /\b(?:specifically|exactly|precisely|I have been|I was|I worked at|I managed a team of)\b/gi;
  const specificClaims = generatedContent.match(overlySpecificPattern);
  if (specificClaims && specificClaims.length > 3) {
    warnings.push('Content contains many specific claims - verify against resume for accuracy');
    confidenceScore -= 5;
  }

  // Check for generic vs. specific balance
  const wordCount = generatedContent.split(/\s+/).length;
  const specificTerms = (generatedContent.match(/\b\d+\b/g) || []).length;
  const specificityRatio = specificTerms / wordCount;

  if (specificityRatio < 0.01 && wordCount > 200) {
    warnings.push('Content may be too generic - consider adding specific examples from resume');
  }

  return {
    hasHallucinations: unmatchedClaims.length > 0 || confidenceScore < 70,
    confidence: Math.max(0, Math.min(100, confidenceScore)),
    issues,
    warnings,
    unmatchedClaims,
    verifiedFacts: generatedFacts.length - unmatchedClaims.length,
    totalFacts: generatedFacts.length,
    verificationRate: generatedFacts.length > 0
      ? ((generatedFacts.length - unmatchedClaims.length) / generatedFacts.length * 100).toFixed(1)
      : 100,
  };
};

/**
 * Verify that job title and company name are correctly used
 * @param {string} content - Generated content
 * @param {string} jobTitle - Expected job title
 * @param {string} companyName - Expected company name
 * @returns {Object} Verification results
 */
const verifyJobDetails = (content, jobTitle, companyName) => {
  const issues = [];
  let accuracyScore = 100;

  const contentLower = content.toLowerCase();
  const jobTitleLower = jobTitle?.toLowerCase() || '';
  const companyNameLower = companyName?.toLowerCase() || '';

  // Check job title accuracy
  if (jobTitle && jobTitle.trim().length > 0) {
    // Exact match or contains key words
    const titleWords = jobTitleLower.split(/\s+/).filter(w => w.length > 3);
    const hasTitleMatch = contentLower.includes(jobTitleLower) ||
      titleWords.every(word => contentLower.includes(word));

    if (!hasTitleMatch) {
      issues.push(`Job title "${jobTitle}" not clearly mentioned in content`);
      accuracyScore -= 15;
    }
  }

  // Check company name accuracy
  if (companyName && companyName.trim().length > 0) {
    const hasCompanyMatch = contentLower.includes(companyNameLower);
    
    if (!hasCompanyMatch) {
      issues.push(`Company name "${companyName}" not mentioned in content`);
      accuracyScore -= 15;
    }
  }

  return {
    accurate: accuracyScore >= 85,
    accuracyScore: Math.max(0, accuracyScore),
    issues,
  };
};

/**
 * Comprehensive hallucination detection
 * @param {string} generatedContent - AI-generated content
 * @param {Object} sourceData - Source data object
 * @returns {Object} Complete hallucination detection results
 */
const detectHallucinationsComprehensive = (generatedContent, sourceData = {}) => {
  const {
    resumeText = '',
    jobDescription = '',
    jobTitle = '',
    companyName = '',
  } = sourceData;

  const hallucinationResults = detectHallucinations(
    generatedContent,
    resumeText,
    jobDescription
  );

  const jobDetailsVerification = verifyJobDetails(
    generatedContent,
    jobTitle,
    companyName
  );

  // Combine results
  const overallConfidence = (
    (hallucinationResults.confidence * 0.7) +
    (jobDetailsVerification.accuracyScore * 0.3)
  );

  return {
    ...hallucinationResults,
    jobDetailsVerification,
    overallConfidence: Math.round(overallConfidence),
    isReliable: overallConfidence >= 75,
    recommendation: overallConfidence >= 90
      ? 'Content appears reliable and factually grounded'
      : overallConfidence >= 75
      ? 'Content is mostly reliable but review recommended'
      : 'Content should be carefully reviewed for accuracy',
  };
};

module.exports = {
  extractFacts,
  detectHallucinations,
  verifyJobDetails,
  detectHallucinationsComprehensive,
};

