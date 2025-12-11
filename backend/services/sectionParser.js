const logger = require('../utils/logger');

/**
 * Parse resume into structured sections
 * @param {string} text - Resume text
 * @returns {Object} Parsed sections with validation
 */
const parseResumeSections = (text) => {
  try {
    const sections = {
      contact: extractContactInfo(text),
      summary: extractSummary(text),
      experience: extractExperience(text),
      education: extractEducation(text),
      skills: extractSkills(text),
      achievements: extractAchievements(text),
    };

    const detectedSections = detectSectionHeaders(text);
    
    return {
      sections,
      detectedSections,
      validation: validateSections(sections, detectedSections),
    };
  } catch (error) {
    logger.error('Error parsing resume sections:', error);
    return {
      sections: {},
      detectedSections: [],
      validation: { isValid: false, errors: [error.message] },
    };
  }
};

/**
 * Extract contact information
 * @param {string} text - Resume text
 * @returns {Object} Contact information
 */
const extractContactInfo = (text) => {
  const email = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)?.[0] || null;
  const phone = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/)?.[0] || null;
  const linkedin = text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] || null;
  const github = text.match(/github\.com\/[\w-]+/i)?.[0] || null;
  const location = extractLocation(text);
  
  return { email, phone, linkedin, github, location };
};

/**
 * Extract location from resume
 * @param {string} text - Resume text
 * @returns {string|null} Location
 */
const extractLocation = (text) => {
  // Look for common location patterns (City, State or City, Country)
  const locationPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      // Return the first location found (usually in header)
      return match[0].trim();
    }
  }

  return null;
};

/**
 * Extract summary/objective section
 * @param {string} text - Resume text
 * @returns {string|null} Summary text
 */
const extractSummary = (text) => {
  const summaryPatterns = [
    /(?:summary|professional\s+summary|objective|profile)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|experience|education|skills|$)/i,
    /(?:summary|professional\s+summary|objective|profile)\s*([\s\S]{50,500}?)(?=\n\n[A-Z]|experience|education|skills|$)/i,
  ];

  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const summary = match[1].trim();
      if (summary.length >= 50 && summary.length <= 500) {
        return summary;
      }
    }
  }

  return null;
};

/**
 * Extract experience section
 * @param {string} text - Resume text
 * @returns {string|null} Experience text
 */
const extractExperience = (text) => {
  const experiencePatterns = [
    /(?:experience|work\s+experience|employment\s+history|professional\s+experience)[:\n]+([\s\S]*?)(?=\n\n(?:education|skills|certifications|projects|$))/i,
  ];

  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Extract education section
 * @param {string} text - Resume text
 * @returns {string|null} Education text
 */
const extractEducation = (text) => {
  const educationPatterns = [
    /(?:education|academic\s+background|academic\s+qualifications)[:\n]+([\s\S]*?)(?=\n\n(?:skills|certifications|projects|experience|$))/i,
  ];

  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

/**
 * Extract skills section
 * @param {string} text - Resume text
 * @returns {string[]} Array of skills
 */
const extractSkills = (text) => {
  const skills = [];
  
  // Try to find skills section
  const skillsPatterns = [
    /(?:skills?|technical\s+skills?|core\s+skills?|competencies)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|experience|education|certifications|projects|$)/i,
  ];

  let skillsText = '';
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      skillsText = match[1].trim();
      break;
    }
  }

  if (skillsText) {
    // Extract skills from various formats (comma-separated, bullet points, etc.)
    const skillMatches = skillsText
      .split(/[,•\n\-•\u2022]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50 && !/^[•\-\*]$/.test(s));
    
    skills.push(...skillMatches);
  } else {
    // Fallback: extract skills mentioned throughout the resume
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
      'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
      'Express', 'Django', 'Flask', 'Spring', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
      'Swift', 'Kotlin', 'HTML', 'CSS', 'SASS', 'LESS', 'Redux', 'GraphQL',
      'REST', 'API', 'Microservices', 'Agile', 'Scrum', 'CI/CD', 'Jenkins',
      'GitLab', 'GitHub', 'Jira', 'Confluence', 'Figma', 'Adobe', 'Photoshop',
    ];

    const lowerText = text.toLowerCase();
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
  }

  // Remove duplicates and return
  return [...new Set(skills)];
};

/**
 * Extract achievements section
 * @param {string} text - Resume text
 * @returns {string[]} Array of achievements
 */
const extractAchievements = (text) => {
  const achievements = [];
  
  const achievementPatterns = [
    /(?:achievements?|awards?|accomplishments?)[:\n]+([\s\S]*?)(?=\n\n[A-Z]|experience|education|skills|$)/i,
  ];

  for (const pattern of achievementPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const achievementsText = match[1].trim();
      const achievementList = achievementsText
        .split(/[•\n\-•\u2022]/)
        .map(a => a.trim())
        .filter(a => a.length > 0);
      achievements.push(...achievementList);
      break;
    }
  }

  return achievements;
};

/**
 * Detect section headers in resume
 * @param {string} text - Resume text
 * @returns {string[]} Array of detected section names
 */
const detectSectionHeaders = (text) => {
  const commonSections = [
    'contact information',
    'contact info',
    'summary',
    'professional summary',
    'objective',
    'experience',
    'work experience',
    'employment history',
    'education',
    'academic background',
    'skills',
    'technical skills',
    'core skills',
    'certifications',
    'achievements',
    'awards',
    'projects',
    'publications',
    'languages',
    'references',
  ];

  const detected = [];
  const lowerText = text.toLowerCase();

  commonSections.forEach(section => {
    const regex = new RegExp(`\\b${section.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(lowerText)) {
      detected.push(section);
    }
  });

  return detected;
};

/**
 * Validate parsed sections
 * @param {Object} sections - Parsed sections
 * @param {string[]} detectedSections - Detected section headers
 * @returns {Object} Validation result
 */
const validateSections = (sections, detectedSections) => {
  const errors = [];
  const warnings = [];

  // Validate contact info
  if (!sections.contact.email && !sections.contact.phone) {
    warnings.push('Contact information is incomplete (missing email and phone)');
  } else if (!sections.contact.email) {
    warnings.push('Email address not found');
  } else if (!sections.contact.phone) {
    warnings.push('Phone number not found');
  }

  // Validate summary
  if (!sections.summary) {
    warnings.push('Summary/Objective section not found');
  } else if (sections.summary.length < 50) {
    warnings.push('Summary is too short (should be 50-500 characters)');
  }

  // Validate experience
  if (!sections.experience) {
    errors.push('Experience section not found');
  }

  // Validate education
  if (!sections.education) {
    warnings.push('Education section not found');
  }

  // Validate skills
  if (!sections.skills || sections.skills.length === 0) {
    warnings.push('Skills section not found or empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasRequiredSections: {
      contact: !!(sections.contact.email || sections.contact.phone),
      summary: !!sections.summary,
      experience: !!sections.experience,
      education: !!sections.education,
      skills: sections.skills && sections.skills.length > 0,
    },
  };
};

module.exports = {
  parseResumeSections,
  extractContactInfo,
  extractSummary,
  extractExperience,
  extractEducation,
  extractSkills,
  extractAchievements,
  detectSectionHeaders,
  validateSections,
};

