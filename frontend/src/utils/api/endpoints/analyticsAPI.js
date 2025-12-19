/**
 * Analytics API endpoints for usage statistics and user analytics
 * @module api/endpoints/analyticsAPI
 * @description Handles analytics and usage statistics
 */

import api from '../client'

/**
 * Analytics API endpoints
 * @namespace analyticsAPI
 */
export const analyticsAPI = {
  /**
   * Get analytics data for current user
   * @returns {Promise<import('axios').AxiosResponse>} Response with user analytics data
   */
  getUserAnalytics: () => api.get('/analytics/user'),
  
  /**
   * Get platform-wide usage statistics
   * @returns {Promise<import('axios').AxiosResponse>} Response with usage statistics
   */
  getUsageStats: () => api.get('/analytics/usage')
}

