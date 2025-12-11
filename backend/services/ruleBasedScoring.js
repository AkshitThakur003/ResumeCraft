const logger = require('../utils/logger');

/**
 * Calculate contact info score (0-100)
 * Scoring: email (25pts), phone (25pts), LinkedIn/GitHub (25pts), location (25pts)
 * @param {Object} contact - Contact information object
 * @returns {number} Score from 0-100
 */
const scoreContactInfo = (contact) => {
  let score = 0;

  if (contact.email) {
    // Validate email format
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (emailRegex.test(contact.email)) {
      score += 25;
    }
  }

  if (contact.phone) {
    // Validate phone format
    const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
    if (phoneRegex.test(contact.phone)) {
      score += 25;
    }
  }

  if (contact.linkedin || contact.github) {
    score += 25;
  }

  if (contact.location) {
    score += 25;
  }

  return Math.min(100, score);
};

/**
 * Calculate skills score using rule-based logic
 * Scoring: relevance (35pts), diversity/balance (25pts), specificity (20pts), keyword optimization (20pts)
 * @param {string[]} skills - Array of skills
 * @param {string} resumeText - Full resume text
 * @param {number} relevanceScore - Optional relevance score from embeddings (0-100)
 * @returns {number} Score from 0-100
 */
const scoreSkills = (skills, resumeText, relevanceScore = null) => {
  if (!skills || skills.length === 0) {
    return 0;
  }

  let score = 0;
  const skillCount = skills.length;
  const lowerText = resumeText.toLowerCase();

  // Diversity/Balance (25pts)
  if (skillCount >= 10) {
    score += 25;
  } else if (skillCount >= 7) {
    score += 20;
  } else if (skillCount >= 5) {
    score += 15;
  } else if (skillCount >= 3) {
    score += 10;
  } else {
    score += 5;
  }

  // Specificity (20pts) - Check for specific tech names vs generic terms
  const specificTechPatterns = [
    /^(JavaScript|TypeScript|Python|Java|C\+\+|C#|Go|Rust|Swift|Kotlin|PHP|Ruby|Scala|R)$/i,
    /^(React|Vue|Angular|Svelte|Next\.js|Nuxt\.js|Gatsby)$/i,
    /^(Node\.js|Express|Django|Flask|Spring|Laravel|Rails|ASP\.NET)$/i,
    /^(AWS|Azure|GCP|Docker|Kubernetes|Terraform|Ansible)$/i,
    /^(MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|DynamoDB)$/i,
    /^(Git|Jenkins|CI\/CD|GitLab|GitHub Actions|CircleCI)$/i,
  ];

  let specificCount = 0;
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase().trim();
    for (const pattern of specificTechPatterns) {
      if (pattern.test(skillLower)) {
        specificCount++;
        break;
      }
    }
  });

  if (specificCount >= 5) {
    score += 20;
  } else if (specificCount >= 3) {
    score += 15;
  } else if (specificCount >= 2) {
    score += 10;
  } else if (specificCount >= 1) {
    score += 5;
  }

  // Relevance (35pts) - Use embeddings score if provided, otherwise use keyword matching
  if (relevanceScore !== null && relevanceScore !== undefined) {
    score += (relevanceScore / 100) * 35;
  } else {
    // Fallback: Check if skills are mentioned in experience/education sections
    let mentionedCount = 0;
    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (lowerText.includes(skillLower)) {
        mentionedCount++;
      }
    });
    const mentionRatio = mentionedCount / skillCount;
    score += mentionRatio * 35;
  }

  // Keyword Optimization (20pts) - Check for industry-relevant keywords
  const industryKeywords = [
    'agile', 'scrum', 'devops', 'microservices', 'api', 'rest', 'graphql',
    'test', 'testing', 'tdd', 'bdd', 'ci/cd', 'deployment', 'scalable',
    'performance', 'optimization', 'security', 'authentication', 'authorization',
  ];

  let keywordCount = 0;
  industryKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      keywordCount++;
    }
  });

  if (keywordCount >= 5) {
    score += 20;
  } else if (keywordCount >= 3) {
    score += 15;
  } else if (keywordCount >= 2) {
    score += 10;
  } else if (keywordCount >= 1) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
};

/**
 * Calculate formatting score (ATS-friendly)
 * Scoring: ATS-friendly structure (40pts), readability (30pts), consistency (30pts)
 * @param {string[]} detectedSections - Array of detected section headers
 * @param {string} text - Resume text
 * @returns {number} Score from 0-100
 */
const scoreFormatting = (detectedSections, text) => {
  let score = 0;

  // ATS-friendly structure (40pts)
  const standardSections = ['experience', 'education', 'skills', 'summary'];
  const lowerSections = detectedSections.map(s => s.toLowerCase());
  
  let standardCount = 0;
  standardSections.forEach(section => {
    if (lowerSections.some(ds => ds.includes(section))) {
      standardCount++;
    }
  });

  if (standardCount === 4) {
    score += 40;
  } else if (standardCount === 3) {
    score += 30;
  } else if (standardCount === 2) {
    score += 20;
  } else if (standardCount === 1) {
    score += 10;
  }

  // Readability (30pts) - Check for proper formatting
  const hasBullets = /[•\-\*]\s/.test(text) || /^\s*[-•*]\s/m.test(text);
  const hasProperSpacing = /\n\n/.test(text) || /\n\s*\n/.test(text);
  const hasLineBreaks = text.split('\n').length > 10; // Multiple lines

  let readabilityScore = 0;
  if (hasBullets) readabilityScore += 10;
  if (hasProperSpacing) readabilityScore += 10;
  if (hasLineBreaks) readabilityScore += 10;

  score += readabilityScore;

  // Consistency (30pts) - Check date formats, consistent styling
  const dateFormats = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || 
                      text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi);
  
  if (dateFormats && dateFormats.length > 0) {
    // Check if dates are consistent
    const dateLengths = dateFormats.map(d => d.length);
    const uniqueLengths = new Set(dateLengths);
    
    if (uniqueLengths.size <= 2) {
      score += 30; // Consistent format
    } else {
      score += 15; // Somewhat consistent
    }
  } else {
    // No dates found, check for other consistency indicators
    const hasConsistentCapitalization = /^[A-Z]/.test(text.split('\n').filter(l => l.trim().length > 0).join('\n').substring(0, 100));
    if (hasConsistentCapitalization) {
      score += 15;
    }
  }

  return Math.min(100, score);
};

/**
 * Calculate overall score from section scores
 * @param {Object} sectionScores - Object with section scores
 * @param {Object} weights - Optional weights for each section
 * @returns {number} Overall score from 0-100
 */
const calculateOverallScore = (sectionScores, weights = null) => {
  const defaultWeights = {
    contactInfo: 0.10,
    summary: 0.15,
    experience: 0.30,
    education: 0.15,
    skills: 0.20,
    achievements: 0.05,
    formatting: 0.05,
  };

  const w = weights || defaultWeights;
  
  let weightedSum = 0;
  let totalWeight = 0;

  Object.keys(w).forEach(section => {
    const score = sectionScores[section] || 0;
    const weight = w[section] || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  });

  // Normalize by total weight
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  return Math.min(100, Math.max(0, Math.round(overallScore)));
};

module.exports = {
  scoreContactInfo,
  scoreSkills,
  scoreFormatting,
  calculateOverallScore,
};

