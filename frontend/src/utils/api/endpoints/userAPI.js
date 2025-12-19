/**
 * User profile and account management API endpoints
 * @module api/endpoints/userAPI
 * @description Handles user profile, skills, preferences, and account operations
 */

import api from '../client'
import { dedupeRequest } from '../requestCache'

/**
 * User profile and account management API endpoints
 * @namespace userAPI
 */
export const userAPI = {
  /**
   * Get current user profile information
   * @returns {Promise<import('axios').AxiosResponse>} Response with user profile data
   */
  getProfile: () => api.get('/user/profile'),
  
  /**
   * Update user profile information
   * @param {Object} data - Profile update data
   * @param {string} [data.name] - User full name
   * @param {string} [data.bio] - User biography
   * @param {string} [data.location] - User location
   * @param {string} [data.website] - User website URL
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated profile
   */
  updateProfile: (data) => api.put('/user/profile', data),
  
  /**
   * Upload user profile picture
   * @param {File} file - Image file to upload
   * @returns {Promise<import('axios').AxiosResponse>} Response with image URL
   */
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('profilePicture', file)
    return api.post('/user/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  /**
   * Delete user profile picture
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteProfilePicture: () => api.delete('/user/profile-picture'),
  
  /**
   * Get user's skills list
   * @returns {Promise<import('axios').AxiosResponse>} Response with skills array
   */
  getSkills: () => api.get('/user/skills'),
  
  /**
   * Add a new skill to user profile
   * @param {Object} data - Skill data
   * @param {string} data.name - Skill name
   * @param {string} [data.category] - Skill category (technical, soft, etc.)
   * @param {number} [data.proficiency] - Proficiency level (1-5)
   * @returns {Promise<import('axios').AxiosResponse>} Response with created skill
   */
  addSkill: (data) => api.post('/user/skills', data),
  
  /**
   * Update an existing skill
   * @param {string|number} skillId - Skill ID to update
   * @param {Object} data - Updated skill data
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated skill
   */
  updateSkill: (skillId, data) => api.put(`/user/skills/${skillId}`, data),
  
  /**
   * Delete a skill from user profile
   * @param {string|number} skillId - Skill ID to delete
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteSkill: (skillId) => api.delete(`/user/skills/${skillId}`),
  
  /**
   * Get user dashboard data (cached)
   * @returns {Promise<import('axios').AxiosResponse>} Response with dashboard data
   */
  getDashboard: () => dedupeRequest(() => api.get('/user/dashboard'), 'GET', '/user/dashboard'),
  
  /**
   * Get user statistics
   * @returns {Promise<import('axios').AxiosResponse>} Response with user stats
   */
  getStats: () => api.get('/user/stats'),
  
  /**
   * Get user profile analytics
   * @returns {Promise<import('axios').AxiosResponse>} Response with analytics data
   */
  getProfileAnalytics: () => api.get('/user/analytics'),
  
  /**
   * Get user preferences
   * @returns {Promise<import('axios').AxiosResponse>} Response with user preferences
   */
  getPreferences: () => api.get('/user/preferences'),
  
  /**
   * Update user preferences
   * @param {Object} data - Preferences data
   * @param {string} [data.theme] - UI theme preference
   * @param {boolean} [data.emailNotifications] - Email notifications preference
   * @param {string} [data.language] - Language preference
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated preferences
   */
  updatePreferences: (data) => api.put('/user/preferences', data),
}

