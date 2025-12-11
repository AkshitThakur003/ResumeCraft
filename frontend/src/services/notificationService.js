/**
 * Unified Notification Service
 * 
 * Handles both toasts (temporary) and notifications (persistent)
 * with intelligent routing based on message type and importance.
 * 
 * This service provides a single API for showing notifications,
 * automatically deciding whether to show a toast, save to notifications,
 * or both based on the message type and priority.
 */

// Notification categories for routing decisions
export const NOTIFICATION_CATEGORIES = {
  // Toast only (ephemeral, no history needed)
  TOAST_ONLY: ['networkStatus', 'typing', 'hover', 'loading'],
  
  // Notification only (important, no toast needed)
  NOTIFICATION_ONLY: ['systemUpdate', 'maintenance', 'featureAnnouncement'],
  
  // Both (show toast + save to history)
  BOTH: ['actionComplete', 'error', 'warning', 'success', 'resumeAnalysis', 'coverLetter']
}

// Priority levels
export const PRIORITY = {
  LOW: 'low',           // Toast only, short duration
  MEDIUM: 'medium',      // Toast + notification if important
  HIGH: 'high',         // Toast + notification always
  CRITICAL: 'critical'  // Toast + notification + sound/badge
}

/**
 * Extract a title from a message
 * @param {string} message - Full message text
 * @param {string} type - Notification type
 * @returns {string} Extracted title
 */
const extractTitle = (message, type) => {
  // Extract first sentence or first 60 chars as title
  const firstSentence = message.split('.')[0].trim()
  if (firstSentence.length <= 60 && firstSentence.length > 0) {
    return firstSentence
  }
  
  // Type-based titles as fallback
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    rateLimit: 'Service Update'
  }
  return titles[type] || 'Notification'
}

/**
 * Unified notification function
 * 
 * This is the main entry point for all notifications in the app.
 * It intelligently routes messages to toasts, notifications, or both.
 * 
 * @param {Object} options - Notification options
 * @param {string} options.message - Message text (required)
 * @param {string} [options.type='info'] - Type (success, error, warning, info, rateLimit)
 * @param {string} [options.priority='medium'] - Priority level (low, medium, high, critical)
 * @param {string} [options.category] - Category for routing decisions
 * @param {boolean} [options.persist=false] - Force save to notifications
 * @param {number} [options.duration=5000] - Toast duration in milliseconds
 * @param {Object} [options.metadata={}] - Additional data (resumeId, etc.)
 * @param {boolean} [options.syncToNotifications] - Explicitly enable/disable notification sync
 * 
 * @example
 * // Toast only (quick feedback)
 * notify({ message: 'Settings saved!', type: 'success', duration: 3000 })
 * 
 * @example
 * // Toast + Notification (important event)
 * notify({ 
 *   message: 'Resume analysis complete!', 
 *   type: 'success', 
 *   priority: 'high',
 *   metadata: { resumeId: '123' }
 * })
 * 
 * @example
 * // Notification only (background event)
 * notify({ 
 *   message: 'System maintenance scheduled', 
 *   type: 'info',
 *   category: 'systemUpdate',
 *   syncToNotifications: true
 * })
 */
export const notify = (options) => {
  const {
    message,
    type = 'info',
    priority = PRIORITY.MEDIUM,
    category,
    persist = false,
    duration = 5000,
    metadata = {},
    syncToNotifications = undefined // undefined = auto-detect
  } = options

  if (!message) {
    console.warn('NotificationService: message is required')
    return
  }

  // Determine routing based on category, priority, and explicit settings
  const isToastOnly = NOTIFICATION_CATEGORIES.TOAST_ONLY.includes(category)
  const isNotificationOnly = NOTIFICATION_CATEGORIES.NOTIFICATION_ONLY.includes(category)
  const isBothCategory = NOTIFICATION_CATEGORIES.BOTH.includes(category)

  // Determine if we should show toast
  const shouldShowToast = syncToNotifications === false 
    ? false 
    : syncToNotifications === true 
      ? true 
      : !isNotificationOnly // Auto-detect: show toast unless notification-only

  // Determine if we should save to notifications
  let shouldSaveNotification = syncToNotifications === true || persist
  
  if (syncToNotifications === undefined) {
    // Auto-detect based on priority, type, and category
    shouldSaveNotification = 
      isNotificationOnly || // Notification-only category
      isBothCategory ||    // Both category
      priority === PRIORITY.HIGH || // High priority
      priority === PRIORITY.CRITICAL || // Critical priority
      type === 'error' || // Always save errors
      (type === 'warning' && duration >= 5000) || // Important warnings
      (type === 'success' && duration >= 5000 && priority !== PRIORITY.LOW) // Important successes
  }

  // Show toast via custom event
  if (shouldShowToast) {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { 
        message, 
        type, 
        duration,
        metadata 
      }
    }))
  }

  // Save to notifications via custom event
  if (shouldSaveNotification) {
    window.dispatchEvent(new CustomEvent('addNotification', {
      detail: {
        type,
        title: extractTitle(message, type),
        message,
        metadata,
        priority,
        createdAt: new Date().toISOString()
      }
    }))
  }
}

/**
 * Convenience methods for common notification types
 */
export const notificationHelpers = {
  /**
   * Show success notification
   */
  success: (message, options = {}) => {
    notify({ message, type: 'success', ...options })
  },

  /**
   * Show error notification
   */
  error: (message, options = {}) => {
    notify({ message, type: 'error', priority: PRIORITY.HIGH, ...options })
  },

  /**
   * Show warning notification
   */
  warning: (message, options = {}) => {
    notify({ message, type: 'warning', priority: PRIORITY.MEDIUM, ...options })
  },

  /**
   * Show info notification
   */
  info: (message, options = {}) => {
    notify({ message, type: 'info', ...options })
  },

  /**
   * Show toast only (no notification)
   */
  toast: (message, type = 'info', duration = 3000) => {
    notify({ message, type, duration, syncToNotifications: false })
  },

  /**
   * Show notification only (no toast)
   */
  notification: (message, type = 'info', options = {}) => {
    notify({ message, type, syncToNotifications: true, ...options })
  }
}

export default notify

