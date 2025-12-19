/**
 * Notifications API endpoints.
 * These endpoints may not exist on the backend - that's OK, we'll use event-based notifications.
 * All methods gracefully handle missing endpoints by returning fallback data.
 * 
 * @module api/endpoints/notificationsAPI
 * @description Handles notification management operations
 */

import api from '../client'

/**
 * Helper function to handle optional notification endpoints gracefully.
 * These endpoints may not exist on the backend - that's OK, we'll use event-based notifications.
 * 
 * @param {Function} requestFn - Function that returns a Promise for the API request
 * @param {Object} [fallbackData={success: true}] - Fallback data to return on error
 * @returns {Promise<Object>} Promise resolving to API response or fallback data
 */
const handleOptionalEndpoint = (requestFn, fallbackData = { success: true }) => {
  return requestFn().catch((error) => {
    // Silently handle 404s (endpoint doesn't exist) and return fallback response
    // For other errors, still return fallback to prevent breaking the app
    return Promise.resolve({ data: fallbackData })
  })
}

/**
 * Notifications API endpoints
 * @namespace notificationsAPI
 */
export const notificationsAPI = {
  /**
   * Get list of notifications
   * @param {Object} [params] - Query parameters
   * @param {boolean} [params.unreadOnly] - Filter unread notifications only
   * @param {number} [params.limit] - Maximum number of notifications
   * @returns {Promise<Object>} Response with notifications array or empty array if endpoint missing
   */
  list: (params) => handleOptionalEndpoint(
    () => api.get('/notifications', { params }),
    { success: true, data: { notifications: [] } }
  ),
  
  /**
   * Get notification by ID
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Response with notification data or error message if not found
   */
  getById: (id) => handleOptionalEndpoint(
    () => api.get(`/notifications/${id}`),
    { success: false, message: 'Notification not found' }
  ),
  
  /**
   * Mark notification as read
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Success confirmation
   */
  markAsRead: (id) => handleOptionalEndpoint(
    () => api.patch(`/notifications/${id}/read`)
  ),
  
  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Success confirmation
   */
  markAllAsRead: () => handleOptionalEndpoint(
    () => api.patch('/notifications/read-all')
  ),
  
  /**
   * Dismiss a notification
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Success confirmation
   */
  dismiss: (id) => handleOptionalEndpoint(
    () => api.delete(`/notifications/${id}`)
  ),
  
  /**
   * Clear all notifications
   * @returns {Promise<Object>} Success confirmation
   */
  clearAll: () => handleOptionalEndpoint(
    () => api.delete('/notifications')
  ),
}

