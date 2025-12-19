/**
 * Admin API endpoints for user and system management
 * @module api/endpoints/adminAPI
 * @description Handles administrative operations (requires admin role)
 */

import api from '../client'

/**
 * Admin API endpoints
 * @namespace adminAPI
 */
export const adminAPI = {
  /**
   * Get paginated list of users
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @param {string} [params.search] - Search query
   * @param {string} [params.role] - Filter by role
   * @returns {Promise<import('axios').AxiosResponse>} Response with users list
   */
  getUsers: (params) => api.get('/admin/users', { params }),
  
  /**
   * Get specific user by ID
   * @param {string|number} id - User ID
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data
   */
  getUser: (id) => api.get(`/admin/users/${id}`),
  
  /**
   * Update user active status
   * @param {string|number} id - User ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated user
   */
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  
  /**
   * Update user role
   * @param {string|number} id - User ID
   * @param {string} role - New role (user, admin, etc.)
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated user
   */
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  
  /**
   * Get audit logs with filtering
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @param {string} [params.userId] - Filter by user ID
   * @param {string} [params.action] - Filter by action type
   * @returns {Promise<import('axios').AxiosResponse>} Response with audit logs
   */
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  
  /**
   * Get aggregated system statistics
   * @returns {Promise<import('axios').AxiosResponse>} Response with system stats
   */
  getStats: () => api.get('/admin/stats'),
  
  /**
   * Bulk update users (status or role)
   * @param {Object} data - Bulk update data
   * @param {string[]} data.userIds - Array of user IDs
   * @param {string} data.action - Action type ('status' or 'role')
   * @param {boolean|string} data.value - New value (boolean for status, string for role)
   * @returns {Promise<import('axios').AxiosResponse>} Response with update result
   */
  bulkUpdateUsers: (data) => api.post('/admin/users/bulk', data),
  
  /**
   * Reset user password (sends reset email)
   * @param {string|number} id - User ID
   * @returns {Promise<import('axios').AxiosResponse>} Response with success status
   */
  resetUserPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  
  /**
   * Get user activity logs
   * @param {string|number} id - User ID
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @returns {Promise<import('axios').AxiosResponse>} Response with user activity logs
   */
  getUserActivity: (id, params) => api.get(`/admin/users/${id}/activity`, { params }),
  
  /**
   * Send email to user
   * @param {string|number} id - User ID
   * @param {Object} data - Email data
   * @param {string} data.subject - Email subject
   * @param {string} data.message - Email message
   * @returns {Promise<import('axios').AxiosResponse>} Response with success status
   */
  sendEmailToUser: (id, data) => api.post(`/admin/users/${id}/send-email`, data),
  
  /**
   * Impersonate user (login as another user)
   * @param {string|number} id - User ID to impersonate
   * @returns {Promise<import('axios').AxiosResponse>} Response with user tokens
   */
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
}

