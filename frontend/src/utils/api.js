/**
 * @fileoverview API Client Module (Legacy - Re-exports from modular structure)
 * @module utils/api
 * @description 
 * This file is maintained for backward compatibility.
 * All functionality has been split into modular files in ./api/
 * 
 * @deprecated Import directly from './api' instead
 * @author ResumeCraft Team
 * @version 2.0.0
 */

// Re-export everything explicitly for better compatibility
export { default } from './api/index.js'
export { 
  authAPI,
  userAPI,
  adminAPI,
  notificationsAPI,
  analyticsAPI,
  invalidateCache,
  clearCache,
  handleApiError,
  createUploadConfig,
  apiRequest,
  storeAccessToken,
  clearStoredAccessToken,
  getStoredAccessToken,
  decodeTokenExpiry,
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_EXP_KEY,
  REMEMBER_ME_KEY,
  TOKEN_REFRESHED_EVENT,
  healthCheck
} from './api/index.js'
