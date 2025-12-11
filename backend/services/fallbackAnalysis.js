/**
 * Fallback Analysis Module
 * Provides basic analysis when AI service is unavailable
 * @module services/fallbackAnalysis
 */

/**
 * Generate fallback analysis when AI is unavailable
 * @param {string} analysisType - Type of analysis
 * @param {string} resumeText - Resume text content
 * @param {string} jobDescription - Optional job description
 * @returns {Promise<{analysis: object, tokensUsed: number, model: string}>}
 */
const generateFallbackAnalysis = async (analysisType, resumeText, jobDescription = null) => {
  const wordCount = resumeText.split(/\s+/).length;
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(resumeText);
  const hasExperience = /experience|work|employment|position|role/i.test(resumeText);
  const hasEducation = /education|degree|university|college|bachelor|master/i.test(resumeText);
  const hasSkills = /skills|technical|proficient|expert/i.test(resumeText);

  // Basic scoring
  let overallScore = 60; // Base score
  if (wordCount > 300) overallScore += 10;
  if (hasEmail && hasPhone) overallScore += 5;
  if (hasExperience) overallScore += 10;
  if (hasEducation) overallScore += 5;
  if (hasSkills) overallScore += 10;
  overallScore = Math.min(85, overallScore); // Cap at 85 for fallback

  const analysis = {
    overallScore,
    sectionScores: {
      contactInfo: hasEmail && hasPhone ? 80 : 40,
      summary: wordCount > 200 ? 70 : 50,
      experience: hasExperience ? 75 : 40,
      education: hasEducation ? 70 : 40,
      skills: hasSkills ? 70 : 40,
      achievements: 60,
      formatting: 65,
      atsOptimization: 60,
    },
    strengths: [
      {
        category: 'Content',
        description: 'Resume contains key sections',
        examples: [],
      },
    ],
    weaknesses: [
      {
        category: 'Analysis',
        description: 'Detailed analysis requires AI service',
        impact: 'Limited insights available',
        suggestions: ['Try again when AI service is available'],
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'System',
        title: 'AI Analysis Unavailable',
        description: 'AI-powered analysis is currently unavailable. Please try again later for detailed insights.',
        actionItems: [],
      },
    ],
    skillsAnalysis: {
      detected: [],
      missing: [],
      recommendations: [],
      categorized: {
        technical: [],
        soft: [],
        industry: [],
        other: [],
      },
    },
  };

  return {
    analysis,
    tokensUsed: 0,
    model: 'fallback',
    processingTime: 100,
    rawResponse: null,
  };
};

module.exports = {
  generateFallbackAnalysis,
};

