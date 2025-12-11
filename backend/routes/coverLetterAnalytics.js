const express = require('express');
const { query } = require('express-validator');
const {
  getCostAnalytics,
  getQualityAnalytics,
} = require('../controllers/coverLetterAnalyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { generalRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Get cost analytics
router.get(
  '/costs',
  generalRateLimit,
  [
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  ],
  handleValidationErrors,
  getCostAnalytics
);

// Get quality analytics
router.get(
  '/quality',
  generalRateLimit,
  handleValidationErrors,
  getQualityAnalytics
);

module.exports = router;

