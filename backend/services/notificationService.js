const Notification = require('../models/Notification');
const notificationEmitter = require('../utils/notificationEmitter');

/**
 * Create a notification for a user
 * Prevents duplicates by checking if similar notification exists within last 24 hours
 * @param {Object} options
 * @param {String} options.userId - User ID
 * @param {String} options.type - Notification type (info, success, warning, error, default)
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message (optional)
 * @param {Object} options.metadata - Additional metadata (optional)
 * @param {Boolean} options.preventDuplicates - Whether to check for duplicates (default: true)
 * @param {Number} options.duplicateWindowHours - Hours to check for duplicates (default: 24)
 * @returns {Promise<Object|null>} Created notification or null if duplicate
 */
const createNotification = async ({
  userId,
  type = 'info',
  title,
  message,
  metadata = {},
  preventDuplicates = true,
  duplicateWindowHours = 24,
}) => {
  if (!userId || !title) {
    throw new Error('userId and title are required');
  }

  // Validate type
  const validTypes = ['info', 'success', 'warning', 'error', 'default'];
  if (!validTypes.includes(type)) {
    type = 'info';
  }

  // Prevent duplicates if enabled
  if (preventDuplicates) {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - duplicateWindowHours);

    const existingNotification = await Notification.findOne({
      user: userId,
      title,
      type,
      createdAt: { $gte: windowStart },
    });

    if (existingNotification) {
      // Duplicate found - return existing notification
      return existingNotification;
    }
  }

  // Create new notification
  const notification = new Notification({
    user: userId,
    type,
    title,
    message,
    metadata,
    read: false,
  });

  await notification.save();

  // Emit notification to connected SSE clients
  try {
    notificationEmitter.sendNotification(userId.toString(), notification);
  } catch (error) {
    // Don't fail notification creation if SSE emission fails
    console.error('Error emitting notification via SSE:', error);
  }

  return notification;
};

/**
 * Create notification for resume analysis completion
 */
const notifyResumeAnalysisComplete = async (userId, resumeId, fileName, analysisType = 'resume-only') => {
  return createNotification({
    userId,
    type: 'success',
    title: 'Resume Analysis Complete',
    message: analysisType === 'jd-based'
      ? `Your resume "${fileName}" has been analyzed against the job description.`
      : `Your resume "${fileName}" has been analyzed successfully.`,
    metadata: {
      type: 'resume_analysis',
      resumeId,
      fileName,
      analysisType,
    },
    preventDuplicates: true,
    duplicateWindowHours: 1, // Allow same notification once per hour
  });
};

/**
 * Create notification for note reminder
 */
const notifyNoteReminder = async (userId, noteId, noteTitle, hoursUntil) => {
  return createNotification({
    userId,
    type: hoursUntil !== undefined && hoursUntil <= 2 ? 'warning' : 'info',
    title: 'Reminder: Note Due',
    message: `"${noteTitle || 'Untitled Note'}" reminder ${hoursUntil !== undefined && hoursUntil <= 1 ? 'now' : `in ${Math.floor(hoursUntil)} hours`}.`,
    metadata: {
      type: 'note_reminder',
      noteId,
      noteTitle,
      hoursUntil,
    },
    preventDuplicates: true,
    duplicateWindowHours: 2, // Allow same reminder notification once per 2 hours
  });
};

module.exports = {
  createNotification,
  notifyResumeAnalysisComplete,
  notifyNoteReminder,
};

