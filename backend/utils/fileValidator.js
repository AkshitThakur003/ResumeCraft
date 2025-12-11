/**
 * File Content Validation Utility
 * Validates file types using magic bytes (file signatures) for security
 * @module utils/fileValidator
 */

const logger = require('./logger');

// File type magic bytes (first few bytes of file)
const FILE_SIGNATURES = {
  pdf: [
    Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  ],
  docx: [
    // DOCX is a ZIP archive with specific structure
    // Check for ZIP signature (PK)
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
  ],
  doc: [
    // Legacy DOC format
    Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), // OLE2 Compound Document
  ],
  txt: [
    // Text files don't have specific signatures, but we can check if it's valid UTF-8
    // We'll validate separately
  ],
};

/**
 * Validate file content using magic bytes
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedType - Expected file type (pdf, docx, doc, txt)
 * @returns {boolean} True if file matches expected type
 */
const validateFileContent = (buffer, expectedType) => {
  if (!buffer) {
    return false;
  }

  const type = expectedType.toLowerCase();

  // For text files, validate UTF-8 encoding
  if (type === 'txt') {
    try {
      // Allow empty or very small text files
      if (buffer.length === 0) {
        return true; // Allow empty text files
      }
      
      const text = buffer.toString('utf-8');
      if (text.length === 0) {
        return true;
      }
      
      // Check if it's valid UTF-8 and contains reasonable text characters
      // Allow some non-printable characters but reject binary data
      const printableRatio = text.split('').filter(char => {
        const code = char.charCodeAt(0);
        return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
      }).length / text.length;
      
      return printableRatio > 0.7; // At least 70% printable characters
    } catch (error) {
      logger.warn('Text file validation error:', error);
      // If we can't parse it, assume it's invalid
      return false;
    }
  }

  // For binary files, require minimum size
  if (buffer.length < 4) {
    logger.warn(`File buffer too small for type ${type}: ${buffer.length} bytes`);
    return false;
  }

  // Check magic bytes for binary files
  const signatures = FILE_SIGNATURES[type];
  if (!signatures || signatures.length === 0) {
    logger.warn(`No signatures defined for file type: ${type}`);
    return false;
  }

  // For DOCX, we need to check if it's a ZIP and contains specific files
  if (type === 'docx') {
    // Check ZIP signature
    if (buffer.slice(0, 4).equals(signatures[0])) {
      // Additional check: DOCX files should contain [Content_Types].xml
      const bufferStr = buffer.toString('binary');
      return bufferStr.includes('[Content_Types].xml') || 
             bufferStr.includes('word/') ||
             bufferStr.includes('_rels/');
    }
    return false;
  }

  // For other file types, check magic bytes
  return signatures.some(signature => {
    return buffer.slice(0, signature.length).equals(signature);
  });
};

/**
 * Get file type from magic bytes
 * @param {Buffer} buffer - File buffer
 * @returns {string|null} Detected file type or null
 */
const detectFileType = (buffer) => {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // Check PDF
  if (buffer.slice(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]))) {
    return 'pdf';
  }

  // Check ZIP-based formats (DOCX)
  if (buffer.slice(0, 4).equals(Buffer.from([0x50, 0x4B, 0x03, 0x04]))) {
    const bufferStr = buffer.toString('binary');
    if (bufferStr.includes('[Content_Types].xml') || 
        bufferStr.includes('word/')) {
      return 'docx';
    }
  }

  // Check legacy DOC
  if (buffer.length >= 8 && 
      buffer.slice(0, 8).equals(Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]))) {
    return 'doc';
  }

  // Check if it's likely a text file
  try {
    const text = buffer.toString('utf-8');
    const printableRatio = text.split('').filter(char => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
    }).length / text.length;
    
    if (printableRatio > 0.7) {
      return 'txt';
    }
  } catch (error) {
    // Not a valid text file
  }

  return null;
};

module.exports = {
  validateFileContent,
  detectFileType,
};

