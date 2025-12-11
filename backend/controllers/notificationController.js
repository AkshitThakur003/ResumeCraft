const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { setupSSEHeaders, handleSSECleanup, sendSSE } = require('./sseController');
const notificationEmitter = require('../utils/notificationEmitter');
const logger = require('../utils/logger');

/**
 * Get user's notifications with optional filters
 * Query params: unread (boolean), limit (number), sort (string), order (string)
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { unread, limit = 50, sort = 'createdAt', order = 'desc' } = req.query;

  // Build query
  const query = { user: userId };
  if (unread === 'true') {
    query.read = false;
  }

  // Build sort
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj = { [sort]: sortOrder };

  // Fetch notifications
  const notifications = await Notification.find(query)
    .sort(sortObj)
    .limit(parseInt(limit, 10))
    .lean();

  res.json({
    success: true,
    data: {
      notifications,
      count: notifications.length,
    },
  });
});

/**
 * Get single notification by ID
 */
exports.getNotificationById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    user: userId,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({
    success: true,
    data: { notification },
  });
});

/**
 * Mark notification as read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({
    success: true,
    data: { notification },
  });
});

/**
 * Mark all user notifications as read
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  );

  res.json({
    success: true,
    data: {
      updated: result.modifiedCount,
    },
  });
});

/**
 * Dismiss/delete a notification
 */
exports.dismissNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.json({
    success: true,
    message: 'Notification dismissed',
  });
});

/**
 * Clear all user notifications
 */
exports.clearAll = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.deleteMany({ user: userId });

  res.json({
    success: true,
    data: {
      deleted: result.deletedCount,
    },
  });
});

/**
 * Create a notification (for system use)
 * This endpoint allows creating notifications programmatically
 */
exports.createNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type, title, message, metadata } = req.body;

  const notification = new Notification({
    user: userId,
    type: type || 'info',
    title,
    message,
    metadata: metadata || {},
  });

  await notification.save();

  // Emit notification to connected SSE clients
  try {
    notificationEmitter.sendNotification(userId.toString(), notification);
  } catch (error) {
    logger.error('Error emitting notification via SSE:', error);
  }

  res.status(201).json({
    success: true,
    data: { notification },
  });
});

/**
 * Stream notifications via Server-Sent Events (SSE)
 * @route GET /api/notifications/stream
 */
exports.streamNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  // Setup SSE headers
  setupSSEHeaders(res);
  
  // Add connection to emitter
  notificationEmitter.addConnection(userId, res);
  
  logger.info(`SSE notification stream started for user ${userId}`);
  
  // Send initial connection confirmation
  sendSSE(res, 'connected', {
    message: 'Notification stream connected',
    userId,
  });

  // Send any unread notifications immediately
  try {
    const unreadNotifications = await Notification.find({
      user: userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (unreadNotifications.length > 0) {
      sendSSE(res, 'initial', {
        notifications: unreadNotifications,
        count: unreadNotifications.length,
      });
    }
  } catch (error) {
    logger.error('Error fetching initial notifications for SSE:', error);
  }

  // Handle cleanup
  handleSSECleanup(res, () => {
    notificationEmitter.removeConnection(userId, res);
    logger.info(`SSE notification stream closed for user ${userId}`);
  });
});

