const express = require('express');
const { body, param, query } = require('express-validator');
const {
  generateCoverLetterHandler,
  generateCoverLetterStreamHandler,
  listCoverLetters,
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  createVersion,
  getTemplates,
  exportCoverLetter,
  regenerateVersion,
} = require('../controllers/coverLetterController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { generalRateLimit, coverLetterRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Validation rules
const generateCoverLetterValidation = [
  body('resumeId')
    .isMongoId()
    .withMessage('Invalid resume ID'),
  body('jobTitle')
    .trim()
    .notEmpty()
    .withMessage('Job title is required')
    .isLength({ max: 200 })
    .withMessage('Job title cannot exceed 200 characters'),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage('Job description is required')
    .isLength({ min: 50 })
    .withMessage('Job description must be at least 50 characters')
    .isLength({ max: 10000 })
    .withMessage('Job description cannot exceed 10000 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'formal', 'enthusiastic'])
    .withMessage('Tone must be one of: professional, friendly, formal, enthusiastic'),
];

const updateCoverLetterValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid cover letter ID'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('tags')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length <= 50);
      }
      return typeof value === 'string' && value.length <= 50;
    })
    .withMessage('Tags must be a string or array of strings (max 50 chars each)'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Job title cannot exceed 200 characters'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
];

const coverLetterIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid cover letter ID'),
];

const createVersionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid cover letter ID'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'formal', 'enthusiastic'])
    .withMessage('Tone must be one of: professional, friendly, formal, enthusiastic'),
];

// Routes

// Generate cover letter (with specific rate limiting)
router.post(
  '/generate',
  coverLetterRateLimit, // More restrictive rate limit for cost control
  generateCoverLetterValidation,
  handleValidationErrors,
  generateCoverLetterHandler
);

// Generate cover letter with SSE stream (with specific rate limiting)
router.post(
  '/generate-stream',
  coverLetterRateLimit, // More restrictive rate limit for cost control
  generateCoverLetterValidation,
  handleValidationErrors,
  generateCoverLetterStreamHandler
);

// List cover letters
router.get(
  '/list',
  generalRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sort').optional().isString().withMessage('Sort must be a string'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('resumeId').optional().isMongoId().withMessage('Invalid resume ID'),
  ],
  handleValidationErrors,
  listCoverLetters
);

// Get available templates (must be before /:id route to avoid route conflicts)
router.get(
  '/templates',
  generalRateLimit,
  getTemplates
);

// Get single cover letter
router.get(
  '/:id',
  generalRateLimit,
  coverLetterIdValidation,
  handleValidationErrors,
  getCoverLetter
);

// Update cover letter
router.put(
  '/:id',
  generalRateLimit,
  updateCoverLetterValidation,
  handleValidationErrors,
  updateCoverLetter
);

// Delete cover letter
router.delete(
  '/:id',
  generalRateLimit,
  coverLetterIdValidation,
  handleValidationErrors,
  deleteCoverLetter
);

// Create new version
router.post(
  '/:id/version',
  generalRateLimit,
  createVersionValidation,
  handleValidationErrors,
  createVersion
);

// Export cover letter
router.get(
  '/:id/export',
  generalRateLimit,
  coverLetterIdValidation,
  [
    query('format').optional().isIn(['pdf', 'docx', 'txt']).withMessage('Format must be pdf, docx, or txt'),
  ],
  handleValidationErrors,
  exportCoverLetter
);

// Regenerate version with AI
router.post(
  '/:id/regenerate',
  coverLetterRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid cover letter ID'),
    body('tone')
      .optional()
      .isIn(['professional', 'friendly', 'formal', 'enthusiastic'])
      .withMessage('Tone must be one of: professional, friendly, formal, enthusiastic'),
    body('template')
      .optional()
      .isIn(['traditional', 'modern', 'creative', 'technical', 'executive'])
      .withMessage('Template must be one of: traditional, modern, creative, technical, executive'),
  ],
  handleValidationErrors,
  regenerateVersion
);

module.exports = router;

