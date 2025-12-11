const express = require('express');
const { body, param, query } = require('express-validator');
const {
  uploadResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  analyzeResume,
  analyzeResumeStream,
  getAnalysis,
  listAnalyses,
  compareResumes,
} = require('../controllers/resumeController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { resumeUpload, handleUploadError, validateResumeFileContent } = require('../middleware/uploadMiddleware');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { generalRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Validation rules
const uploadResumeValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      }
      return false;
    })
    .withMessage('Tags must be a string or array of strings (max 50 chars each)'),
];

const updateResumeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resume ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      }
      return false;
    })
    .withMessage('Tags must be a string or array of strings (max 50 chars each)'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
];

const analyzeResumeValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resume ID'),
  body('analysisType')
    .optional()
    .isIn(['general', 'ats', 'jd_match'])
    .withMessage('Invalid analysis type'),
  body('jobDescription')
    .optional()
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If provided, must be a string with valid length
      if (typeof value !== 'string') {
        throw new Error('Job description must be a string');
      }
      if (value.trim().length < 50) {
        throw new Error('Job description must be at least 50 characters when provided');
      }
      if (value.length > 10000) {
        throw new Error('Job description cannot exceed 10000 characters');
      }
      return true;
    }),
];

const resumeIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resume ID'),
];

const analysisIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resume ID'),
  param('analysisId')
    .isMongoId()
    .withMessage('Invalid analysis ID'),
];

// Routes

// Upload resume
router.post(
  '/upload',
  generalRateLimit,
  resumeUpload.single('file'),
  handleUploadError,
  validateResumeFileContent, // FIX #4: File content validation
  uploadResumeValidation,
  handleValidationErrors,
  uploadResume
);

// List resumes
router.get(
  '/list',
  generalRateLimit,
  [
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'all']),
    query('sort').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 }),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  listResumes
);

// Get single resume
router.get(
  '/:id',
  generalRateLimit,
  resumeIdValidation,
  handleValidationErrors,
  getResume
);

// Update resume
router.put(
  '/:id',
  generalRateLimit,
  updateResumeValidation,
  handleValidationErrors,
  updateResume
);

// Delete resume
router.delete(
  '/:id',
  generalRateLimit,
  resumeIdValidation,
  handleValidationErrors,
  deleteResume
);

// Analyze resume
router.post(
  '/:id/analyze',
  generalRateLimit,
  analyzeResumeValidation,
  handleValidationErrors,
  analyzeResume
);

// Analyze resume with SSE stream
router.post(
  '/:id/analyze-stream',
  generalRateLimit,
  analyzeResumeValidation,
  handleValidationErrors,
  analyzeResumeStream
);

// Get analysis results
router.get(
  '/:id/analysis/:analysisId',
  generalRateLimit,
  analysisIdValidation,
  handleValidationErrors,
  getAnalysis
);

// List all analyses for a resume
router.get(
  '/:id/analyses',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid resume ID'),
    query('type').optional().isIn(['general', 'ats', 'jd_match']),
    query('limit').optional().custom((value) => {
      if (value === undefined || value === '') return true;
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1 && num <= 50;
    }).withMessage('Limit must be a number between 1 and 50'),
    query('page').optional().custom((value) => {
      if (value === undefined || value === '') return true;
      const num = parseInt(value, 10);
      return !isNaN(num) && num >= 1;
    }).withMessage('Page must be a positive number'),
  ],
  handleValidationErrors,
  listAnalyses
);

// Compare resumes
router.post(
  '/compare',
  generalRateLimit,
  [
    body('resumeIds')
      .isArray({ min: 2, max: 2 })
      .withMessage('Please provide exactly 2 resume IDs'),
    body('resumeIds.*')
      .isMongoId()
      .withMessage('Invalid resume ID'),
  ],
  handleValidationErrors,
  compareResumes
);

module.exports = router;

