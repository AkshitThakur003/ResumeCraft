const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');
const { MAX_RESUME_TEXT_LENGTH } = require('../config/constants');

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<{text: string, pages: number}>}
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text.trim(),
      pages: data.numpages || 1,
      wordCount: data.text.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: data.text.length,
    };
  } catch (error) {
    logger.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

/**
 * Extract text from DOCX buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<{text: string, pages: number}>}
 */
const extractTextFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();
    
    // Estimate pages (assuming ~500 words per page)
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500));
    
    return {
      text,
      pages: estimatedPages,
      wordCount,
      characterCount: text.length,
    };
  } catch (error) {
    logger.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
};

/**
 * Extract text from TXT buffer
 * @param {Buffer} buffer - TXT file buffer
 * @returns {Promise<{text: string, pages: number}>}
 */
const extractTextFromTXT = async (buffer) => {
  try {
    const text = buffer.toString('utf-8').trim();
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500));
    
    return {
      text,
      pages: estimatedPages,
      wordCount,
      characterCount: text.length,
    };
  } catch (error) {
    logger.error('Error extracting text from TXT:', error);
    throw new Error('Failed to extract text from TXT file');
  }
};

/**
 * Extract text from resume file based on file type
 * @param {Buffer} buffer - File buffer
 * @param {string} fileType - File type (pdf, docx, txt)
 * @returns {Promise<{text: string, pages: number, wordCount: number, characterCount: number}>}
 */
const extractTextFromResume = async (buffer, fileType) => {
  let result;
  switch (fileType.toLowerCase()) {
    case 'pdf':
      result = await extractTextFromPDF(buffer);
      break;
    case 'docx':
    case 'doc':
      result = await extractTextFromDOCX(buffer);
      break;
    case 'txt':
      result = await extractTextFromTXT(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  // FIX #5: Validate and truncate text length
  if (result.text && result.text.length > MAX_RESUME_TEXT_LENGTH) {
    logger.warn(`Resume text exceeds maximum length (${result.text.length} > ${MAX_RESUME_TEXT_LENGTH}). Truncating.`);
    result.text = result.text.substring(0, MAX_RESUME_TEXT_LENGTH);
    result.truncated = true;
  }

  return result;
};

/**
 * Extract resume sections from text
 * @param {string} text - Resume text
 * @returns {string[]} Array of detected section names
 */
const extractSections = (text) => {
  const commonSections = [
    'contact information',
    'contact info',
    'summary',
    'objective',
    'experience',
    'work experience',
    'employment history',
    'education',
    'academic background',
    'skills',
    'technical skills',
    'certifications',
    'achievements',
    'awards',
    'projects',
    'publications',
    'languages',
    'references',
  ];

  const sections = [];
  const lowerText = text.toLowerCase();

  commonSections.forEach(section => {
    const regex = new RegExp(`\\b${section}\\b`, 'i');
    if (regex.test(lowerText)) {
      sections.push(section);
    }
  });

  return sections;
};

/**
 * Upload resume file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} userId - User ID for folder organization
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadResumeToCloudinary = async (fileBuffer, userId, originalFilename) => {
  try {
    const folder = `resumecraft/resumes/${userId}`;
    const result = await uploadToCloudinary(fileBuffer, folder, 'raw');
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    logger.error('Error uploading resume to Cloudinary:', error);
    throw new Error('Failed to upload resume file');
  }
};

/**
 * Delete resume file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
const deleteResumeFromCloudinary = async (publicId) => {
  try {
    await deleteFromCloudinary(publicId, 'raw');
  } catch (error) {
    logger.error('Error deleting resume from Cloudinary:', error);
    // Don't throw error - file might already be deleted
  }
};

/**
 * Process resume file: extract text and upload to storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileType - File type
 * @param {string} userId - User ID
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{url: string, publicId: string, extractedText: string, metadata: object}>}
 */
const processResumeFile = async (fileBuffer, fileType, userId, originalFilename) => {
  try {
    // Extract text from file
    const { text, pages, wordCount, characterCount } = await extractTextFromResume(fileBuffer, fileType);
    
    // Extract sections
    const sections = extractSections(text);
    
    // Upload to Cloudinary
    const { url, publicId } = await uploadResumeToCloudinary(fileBuffer, userId, originalFilename);
    
    return {
      url,
      publicId,
      extractedText: text,
      metadata: {
        pages,
        sections,
        wordCount,
        characterCount,
      },
    };
  } catch (error) {
    logger.error('Error processing resume file:', error);
    throw error;
  }
};

module.exports = {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
  extractTextFromResume,
  extractSections,
  uploadResumeToCloudinary,
  deleteResumeFromCloudinary,
  processResumeFile,
};

