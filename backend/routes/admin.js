const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
  getStats,
  bulkUpdateUsers,
  resetUserPassword,
  getUserActivity,
  sendEmailToUser,
  impersonateUser,
} = require('../controllers/adminController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { generalRateLimit, adminGetRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('admin'));

router.get(
  '/users',
  adminGetRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      return ['active', 'inactive'].includes(value);
    }).withMessage('Invalid status filter'),
    query('role').optional().custom((value) => {
      if (!value || value === '') return true; // Allow empty string
      return typeof value === 'string';
    }).withMessage('Role filter must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email', 'lastLogin', 'role']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  ],
  handleValidationErrors,
  getUsers,
);

router.get(
  '/users/:id',
  adminGetRateLimit,
  [param('id').isMongoId().withMessage('Invalid user ID')],
  handleValidationErrors,
  getUserDetails,
);

router.patch(
  '/users/:id/status',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  handleValidationErrors,
  updateUserStatus,
);

router.patch(
  '/users/:id/role',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(['user', 'recruiter', 'admin']).withMessage('Role must be user, recruiter, or admin'),
  ],
  handleValidationErrors,
  updateUserRole,
);

router.get(
  '/audit-logs',
  adminGetRateLimit,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('action').optional().isString().withMessage('Action filter must be a string'),
  ],
  handleValidationErrors,
  getAuditLogs,
);

router.get(
  '/stats',
  adminGetRateLimit,
  getStats,
);

router.post(
  '/users/bulk',
  generalRateLimit,
  [
    body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
    body('userIds.*').isMongoId().withMessage('All userIds must be valid MongoDB IDs'),
    body('action').isIn(['status', 'role']).withMessage('Action must be either "status" or "role"'),
    body('value').custom((value, { req }) => {
      if (req.body.action === 'status' && typeof value !== 'boolean') {
        throw new Error('Value must be a boolean for status action');
      }
      if (req.body.action === 'role' && !['user', 'recruiter', 'admin'].includes(value)) {
        throw new Error('Invalid role value');
      }
      return true;
    }),
  ],
  handleValidationErrors,
  bulkUpdateUsers,
);

router.post(
  '/users/:id/reset-password',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  handleValidationErrors,
  resetUserPassword,
);

router.get(
  '/users/:id/activity',
  adminGetRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  handleValidationErrors,
  getUserActivity,
);

router.post(
  '/users/:id/send-email',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters'),
  ],
  handleValidationErrors,
  sendEmailToUser,
);

router.post(
  '/users/:id/impersonate',
  generalRateLimit,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
  ],
  handleValidationErrors,
  impersonateUser,
);

module.exports = router;

