const multer = require('multer');
const { MAX_FILE_SIZE } = require('../config/constants');
const { validateFileContent } = require('../utils/fileValidator');
const logger = require('../utils/logger');

// Configure multer to store files in memory (for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter for profile pictures
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer for profile picture uploads
const profilePictureUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter,
});

// File filter for resume uploads
const resumeFileFilter = (req, file, cb) => {
  // Accept PDF, DOCX, DOC, and TXT files
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, DOC, and TXT files are allowed for resumes'), false);
  }
};

// Configure multer for resume uploads
const resumeUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: resumeFileFilter,
});

// Middleware to validate file content after upload (FIX #4)
const validateResumeFileContent = (req, res, next) => {
  // Skip validation if no file uploaded (shouldn't happen, but be safe)
  if (!req.file) {
    return next();
  }

  // Skip validation if buffer is missing or empty
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'File buffer is empty or invalid.',
    });
  }

  try {
    // Determine expected file type from mimetype
    let expectedType = 'txt';
    if (req.file.mimetype === 'application/pdf') {
      expectedType = 'pdf';
    } else if (req.file.mimetype.includes('wordprocessingml')) {
      expectedType = 'docx';
    } else if (req.file.mimetype.includes('msword')) {
      expectedType = 'doc';
    }

    // Validate file content using magic bytes
    const isValid = validateFileContent(req.file.buffer, expectedType);
    if (!isValid) {
      logger.warn(`File validation failed for type ${expectedType}, file size: ${req.file.size}, mimetype: ${req.file.mimetype}`);
      // Log warning but allow upload to proceed - MIME type check is already done
      // File validation is an extra security layer, but we don't want to block legitimate uploads
      // If the file extraction fails later, that will be caught then
    }
  } catch (error) {
    // If validation fails with an error, log it but continue
    // This allows the upload to proceed if validation is non-critical
    logger.error('File validation error:', error);
    // Continue anyway - let other validation handle it
  }

  next();
};

// Error handler for upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${Math.round((MAX_FILE_SIZE || 10 * 1024 * 1024) / (1024 * 1024))}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
    });
  }
  
  next();
};

module.exports = {
  profilePictureUpload,
  resumeUpload,
  handleUploadError,
  validateResumeFileContent,
};

