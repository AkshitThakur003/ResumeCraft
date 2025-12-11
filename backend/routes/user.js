const express = require('express');
const { body, param } = require('express-validator');
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  getDashboardData,
  getUserStats,
  getProfileAnalytics,
  getPreferences,
  updatePreferences,
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { profilePictureUpload, handleUploadError } = require('../middleware/uploadMiddleware');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { generalRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Validation rules
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('experience')
    .optional()
    .trim(),
  body('education')
    .optional()
    .trim(),
];

const skillValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  body('level')
    .isInt({ min: 1, max: 10 })
    .withMessage('Skill level must be between 1 and 10'),
];

const updateSkillValidation = [
  param('skillId')
    .isMongoId()
    .withMessage('Invalid skill ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  body('level')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Skill level must be between 1 and 10'),
];

const deleteSkillValidation = [
  param('skillId')
    .isMongoId()
    .withMessage('Invalid skill ID'),
];

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', generalRateLimit, updateProfileValidation, handleValidationErrors, updateProfile);

// Profile picture routes
router.post('/profile-picture', 
  generalRateLimit,
  profilePictureUpload.single('profilePicture'), 
  handleUploadError, 
  uploadProfilePicture
);
router.delete('/profile-picture', generalRateLimit, deleteProfilePicture);

// Skills routes
router.get('/skills', getSkills);
router.post('/skills', generalRateLimit, skillValidation, handleValidationErrors, addSkill);
router.put('/skills/:skillId', generalRateLimit, updateSkillValidation, handleValidationErrors, updateSkill);
router.delete('/skills/:skillId', generalRateLimit, deleteSkillValidation, handleValidationErrors, deleteSkill);

// Dashboard and stats routes
router.get('/dashboard', getDashboardData);
router.get('/stats', getUserStats);
router.get('/analytics', getProfileAnalytics);

// Preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', generalRateLimit, updatePreferences);

module.exports = router;
