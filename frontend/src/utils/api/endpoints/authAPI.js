/**
 * Authentication API endpoints
 * @module api/endpoints/authAPI
 * @description Handles user authentication, registration, password management, and OAuth
 */

import api from '../client'

/**
 * Authentication API endpoints
 * @namespace authAPI
 */
export const authAPI = {
  /**
   * Register a new user account
   * @param {Object} data - Registration data
   * @param {string} data.email - User email address
   * @param {string} data.password - User password
   * @param {string} [data.name] - User full name
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   */
  register: (data) => api.post('/auth/register', data),
  
  /**
   * Authenticate user and receive access token
   * @param {Object} data - Login credentials
   * @param {string} data.email - User email address
   * @param {string} data.password - User password
   * @param {boolean} [data.rememberMe] - Whether to remember user session
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   */
  login: (data) => api.post('/auth/login', data),
  
  /**
   * Logout current user and invalidate session
   * @returns {Promise<import('axios').AxiosResponse>} Logout confirmation
   */
  logout: () => api.post('/auth/logout'),
  
  /**
   * Get current authenticated user information
   * @returns {Promise<import('axios').AxiosResponse>} Response with user profile data
   */
  getMe: () => api.get('/auth/me'),
  
  /**
   * Change user password
   * @param {Object} data - Password change data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<import('axios').AxiosResponse>} Success confirmation
   */
  changePassword: (data) => api.put('/auth/change-password', data),
  
  /**
   * Delete user account
   * @param {Object} data - Account deletion confirmation
   * @param {string} data.password - User password for confirmation
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteAccount: (data) => api.delete('/auth/delete-account', { data }),
  
  /**
   * Refresh access token using refresh token cookie
   * @returns {Promise<import('axios').AxiosResponse>} Response with new access token
   */
  refresh: () => api.post('/auth/refresh'),
  
  /**
   * Exchange OAuth authorization code for tokens
   * @param {string} code - OAuth authorization code
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   */
  exchangeOAuthCode: (code) => api.post('/auth/oauth/exchange', { code }),
  
  /**
   * Verify user email address with verification token
   * @param {string} token - Email verification token
   * @returns {Promise<import('axios').AxiosResponse>} Verification confirmation
   */
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  
  /**
   * Resend email verification link
   * @param {string} email - Email address to resend verification to
   * @returns {Promise<import('axios').AxiosResponse>} Resend confirmation
   */
  resendVerification: (email) => api.post('/auth/verify-email/resend', { email }),
  
  /**
   * Request password reset email
   * @param {string} email - Email address for password reset
   * @returns {Promise<import('axios').AxiosResponse>} Reset email sent confirmation
   */
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  /**
   * Reset password using reset token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<import('axios').AxiosResponse>} Password reset confirmation
   */
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  /**
   * Get available OAuth providers
   * @returns {Promise<import('axios').AxiosResponse>} Response with list of OAuth providers
   */
  getOAuthProviders: () => api.get('/auth/providers'),
}

