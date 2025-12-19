/**
 * @fileoverview API Client Module
 * @module utils/api
 * @description 
 * Centralized API client with authentication, caching, request deduplication, 
 * and comprehensive error handling. Provides typed API methods for all backend 
 * endpoints with automatic token refresh, rate limiting handling, and retry logic.
 * 
 * @author ResumeCraft Team
 * @version 2.0.0
 */

// Import interceptors to set them up
import './interceptors'

// Export axios instance
export { default } from './client'

// Export API endpoint namespaces
export { authAPI } from './endpoints/authAPI'
export { userAPI } from './endpoints/userAPI'
export { adminAPI } from './endpoints/adminAPI'
export { notificationsAPI } from './endpoints/notificationsAPI'
export { analyticsAPI } from './endpoints/analyticsAPI'

// Export cache utilities
export { invalidateCache, clearCache } from './requestCache'

// Export error handling utilities
export { handleApiError, createUploadConfig, apiRequest } from './errorHandling'

// Export token management utilities
export { 
  storeAccessToken, 
  clearStoredAccessToken, 
  getStoredAccessToken,
  decodeTokenExpiry,
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_EXP_KEY,
  REMEMBER_ME_KEY,
  TOKEN_REFRESHED_EVENT
} from './tokenManagement'

// Health check endpoint
import api from './client'
export const healthCheck = () => api.get('/health')

