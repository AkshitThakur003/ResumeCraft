const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generalRateLimit } = require('../middleware/rateLimit');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's notifications
router.get('/', notificationController.getNotifications);

// Get notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark notification as read
router.patch('/:id/read', generalRateLimit, notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', generalRateLimit, notificationController.markAllAsRead);

// Dismiss/delete a notification
router.delete('/:id', generalRateLimit, notificationController.dismissNotification);

// Clear all notifications
router.delete('/', generalRateLimit, notificationController.clearAll);

// Create notification (optional - for system use)
router.post('/', generalRateLimit, notificationController.createNotification);

// Stream notifications via SSE (real-time)
router.get('/stream', notificationController.streamNotifications);

module.exports = router;

