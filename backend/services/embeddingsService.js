const OpenAI = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get embeddings for text(s) using OpenAI's text-embedding-3-small model
 * Very cost-effective: $0.02 per 1M tokens
 * @param {string|string[]} texts - Text or array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
const getEmbeddings = async (texts) => {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OpenAI API key not configured, skipping embeddings');
    return [];
  }

  try {
    // Ensure texts is an array
    const textArray = Array.isArray(texts) ? texts : [texts];
    
    if (textArray.length === 0) {
      return [];
    }

    logger.debug(`🔮 Embeddings: Requesting embeddings for ${textArray.length} text(s)`);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: textArray,
    });

    const embeddings = response.data.map(item => item.embedding);
    const tokensUsed = response.usage?.total_tokens || 0;
    
    logger.debug(`✅ Embeddings: Generated ${embeddings.length} embeddings (${tokensUsed} tokens)`);
    
    return embeddings;
  } catch (error) {
    logger.error('❌ Embeddings: Error getting embeddings:', error);
    // Return empty array on error to allow fallback
    return [];
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Similarity score between -1 and 1
 */
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    logger.warn('Vector length mismatch in cosine similarity');
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
};

/**
 * Split text into chunks for embedding
 * @param {string} text - Text to split
 * @param {number} chunkSize - Maximum chunk size in characters
 * @returns {string[]} Array of text chunks
 */
const splitIntoChunks = (text, chunkSize = 500) => {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/[.!?]\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence + '. ';
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence + '. ';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
};

/**
 * Calculate skill relevance using embeddings
 * Compares skills against resume content to determine relevance
 * @param {string[]} skills - Array of skills
 * @param {string} resumeText - Full resume text
 * @returns {Promise<number>} Relevance score from 0-100
 */
/**
 * Calculate skill relevance using embeddings
 * Compares skills against resume content to determine relevance
 * @param {string[]} skills - Array of skills
 * @param {string} resumeText - Full resume text
 * @returns {Promise<{score: number, metadata: object}>} Relevance score and metadata
 */
const calculateSkillRelevance = async (skills, resumeText) => {
  const startTime = Date.now();
  const metadata = {
    method: 'fallback',
    skillsCount: skills?.length || 0,
    embeddingsUsed: false,
    embeddingsTokens: 0,
    similarityCalculations: 0,
    processingTime: 0,
  };

  if (!skills || skills.length === 0) {
    return { score: 0, metadata };
  }

  if (!process.env.OPENAI_API_KEY) {
    logger.info('📊 Embeddings: API key not configured, using keyword matching fallback');
    // Fallback: simple keyword matching
    const lowerText = resumeText.toLowerCase();
    const mentionedSkills = skills.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );
    metadata.processingTime = Date.now() - startTime;
    return {
      score: (mentionedSkills.length / skills.length) * 100,
      metadata,
    };
  }

  try {
    logger.info(`🔍 Embeddings: Calculating relevance for ${skills.length} skills`);
    
    // Split resume into chunks first
    const resumeChunks = splitIntoChunks(resumeText, 500);
    logger.info(`📄 Embeddings: Split resume into ${resumeChunks.length} chunks for embedding`);
    
    // Batch both skills and resume chunks into a single API call for efficiency
    const allTexts = [...skills, ...resumeChunks];
    const embeddingsStart = Date.now();
    const allEmbeddings = await getEmbeddings(allTexts);
    const embeddingsTime = Date.now() - embeddingsStart;
    
    if (allEmbeddings.length === 0) {
      logger.warn('📊 Embeddings: No embeddings returned, using fallback');
      metadata.processingTime = Date.now() - startTime;
      return { score: 0, metadata };
    }

    // Split results back into skills and resume embeddings
    const skillEmbeddings = allEmbeddings.slice(0, skills.length);
    const resumeEmbeddings = allEmbeddings.slice(skills.length);
    
    if (skillEmbeddings.length === 0) {
      logger.warn('📊 Embeddings: No skill embeddings returned, using fallback');
      metadata.processingTime = Date.now() - startTime;
      return { score: 0, metadata };
    }

    if (resumeEmbeddings.length === 0) {
      logger.warn('📊 Embeddings: No resume embeddings returned, using fallback');
      metadata.processingTime = Date.now() - startTime;
      return { score: 0, metadata };
    }

    logger.info(`✅ Embeddings: Generated ${skillEmbeddings.length} skill and ${resumeEmbeddings.length} resume chunk embeddings in a single batch call (${embeddingsTime}ms)`);

    // Calculate similarity for each skill
    let totalSimilarity = 0;
    let validSkills = 0;
    let similarityCalculations = 0;
    const skillSimilarities = [];

    for (let i = 0; i < skillEmbeddings.length; i++) {
      const skillEmbedding = skillEmbeddings[i];
      let maxSimilarity = 0;
      let bestMatchChunk = -1;
      
      for (let j = 0; j < resumeEmbeddings.length; j++) {
        const resumeEmbedding = resumeEmbeddings[j];
        const similarity = cosineSimilarity(skillEmbedding, resumeEmbedding);
        similarityCalculations++;
        
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatchChunk = j;
        }
      }

      // Convert similarity (-1 to 1) to relevance score (0 to 100)
      if (maxSimilarity > 0) {
        const relevanceScore = Math.min(100, (maxSimilarity + 1) * 50);
        totalSimilarity += relevanceScore;
        validSkills++;
        
        skillSimilarities.push({
          skill: skills[i],
          similarity: maxSimilarity,
          relevanceScore: Math.round(relevanceScore),
          bestMatchChunk,
        });
      }
    }

    const averageScore = validSkills > 0 ? totalSimilarity / validSkills : 0;
    metadata.method = 'embeddings';
    metadata.embeddingsUsed = true;
    metadata.embeddingsTokens = (skills.length + resumeChunks.length) * 10; // Rough estimate
    metadata.similarityCalculations = similarityCalculations;
    metadata.processingTime = Date.now() - startTime;
    metadata.skillCount = skills.length;
    metadata.resumeChunks = resumeChunks.length;
    metadata.averageSimilarity = skillSimilarities.length > 0
      ? skillSimilarities.reduce((sum, s) => sum + s.similarity, 0) / skillSimilarities.length
      : 0;
    metadata.topMatches = skillSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(s => ({
        skill: s.skill,
        similarity: Math.round(s.similarity * 100) / 100,
        relevance: s.relevanceScore,
      }));

    logger.info(`🎯 Embeddings: Calculated relevance score: ${Math.round(averageScore)}/100`);
    logger.info(`   - Valid skills: ${validSkills}/${skills.length}`);
    logger.info(`   - Average similarity: ${Math.round(metadata.averageSimilarity * 100) / 100}`);
    logger.info(`   - Processing time: ${metadata.processingTime}ms`);
    logger.info(`   - Top matches: ${metadata.topMatches.map(m => `${m.skill} (${m.similarity})`).join(', ')}`);

    return {
      score: averageScore,
      metadata,
    };
  } catch (error) {
    logger.error('❌ Embeddings: Error calculating skill relevance:', error);
    metadata.processingTime = Date.now() - startTime;
    metadata.error = error.message;
    
    // Fallback to keyword matching
    const lowerText = resumeText.toLowerCase();
    const mentionedSkills = skills.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );
    return {
      score: (mentionedSkills.length / skills.length) * 100,
      metadata,
    };
  }
};

/**
 * Find missing skills by comparing job description with resume
 * @param {string} jobDescription - Job description text
 * @param {string[]} resumeSkills - Skills found in resume
 * @returns {Promise<string[]>} Array of potentially missing skills
 */
const findMissingSkills = async (jobDescription, resumeSkills) => {
  if (!jobDescription || !process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    // Extract skills from job description (simple keyword extraction)
    const commonJobSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
      'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Angular', 'Vue',
      'Express', 'Django', 'Flask', 'Spring', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
      'Swift', 'Kotlin', 'HTML', 'CSS', 'SASS', 'LESS', 'Redux', 'GraphQL',
      'REST', 'API', 'Microservices', 'Agile', 'Scrum', 'CI/CD', 'Jenkins',
      'GitLab', 'GitHub', 'Jira', 'Confluence', 'Figma', 'Adobe', 'Photoshop',
    ];

    const lowerJD = jobDescription.toLowerCase();
    const jdSkills = commonJobSkills.filter(skill => 
      lowerJD.includes(skill.toLowerCase())
    );

    // Find skills in JD but not in resume
    const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
    const missing = jdSkills.filter(skill => 
      !resumeSkillsLower.some(rs => rs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(rs))
    );

    return [...new Set(missing)];
  } catch (error) {
    logger.error('Error finding missing skills:', error);
    return [];
  }
};

module.exports = {
  getEmbeddings,
  cosineSimilarity,
  splitIntoChunks,
  calculateSkillRelevance,
  findMissingSkills,
};

