/**
 * Notification Utilities
 * Helper functions for notification management
 */

/**
 * Check localStorage to see if we've already determined the endpoint doesn't exist
 */
export const checkEndpointExists = () => {
  const cached = localStorage.getItem('notificationsEndpointExists')
  // If cached value is 'false', endpoint doesn't exist
  // If null or 'true', we should try the endpoint
  return cached !== 'false'
}

/**
 * Mark endpoint as missing in localStorage
 */
export const markEndpointAsMissing = () => {
  localStorage.setItem('notificationsEndpointExists', 'false')
}

import { formatRelativeTime } from '../../utils'

/**
 * Format notification from API response
 */
export const formatNotification = (notif) => {
  return {
    id: notif._id || notif.id,
    type: notif.type || 'info',
    title: notif.title,
    message: notif.message,
    timestamp: formatRelativeTime(notif.createdAt || notif.timestamp),
    createdAt: notif.createdAt || notif.timestamp,
    read: notif.read || false,
    metadata: notif.metadata || {},
  }
}

/**
 * Format multiple notifications
 */
export const formatNotifications = (notifications) => {
  return notifications.map(formatNotification)
}

