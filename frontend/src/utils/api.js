/**
 * @fileoverview API Client Module
 * @module utils/api
 * @description 
 * Centralized API client with authentication, caching, request deduplication, 
 * and comprehensive error handling. Provides typed API methods for all backend 
 * endpoints with automatic token refresh, rate limiting handling, and retry logic.
 * 
 * @author ResumeCraft Team
 * @version 1.0.0
 */

import axios from 'axios'
import { logger } from './logger'
import { captureException } from './sentry'

// ============================================
// Constants
// ============================================

/** @constant {string} LocalStorage key for access token */
const ACCESS_TOKEN_KEY = 'accessToken'

/** @constant {string} LocalStorage key for access token expiration timestamp */
const ACCESS_TOKEN_EXP_KEY = 'accessTokenExpiresAt'

/** @constant {string} LocalStorage key for remember me preference */
const REMEMBER_ME_KEY = 'rememberMe'

/** @constant {string} Custom event name for token refresh notifications */
const TOKEN_REFRESHED_EVENT = 'tokenRefreshed'

/** @constant {number} Default API timeout in milliseconds (30 seconds) */
const API_TIMEOUT_MS = 30000

/** @constant {number} Cache time-to-live in milliseconds (30 seconds) */
const CACHE_TTL_MS = 30000

/** @constant {boolean} Whether code is running in browser environment */
const isBrowser = typeof window !== 'undefined'

/**
 * Decodes JWT token to extract expiration timestamp
 * @param {string} token - JWT token string
 * @returns {number|null} Expiration timestamp in milliseconds, or null if invalid
 * @private
 */
const decodeTokenExpiry = (token) => {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload?.exp) {
      return payload.exp * 1000
    }
  } catch (error) {
    logger.warn('Failed to decode JWT expiry:', error)
  }
  return null
}

/**
 * Clears access token from both localStorage and sessionStorage
 * @function clearStoredAccessToken
 * @private
 * @returns {void}
 */
const clearStoredAccessToken = () => {
  if (!isBrowser) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
}

/**
 * Stores access token in localStorage or sessionStorage based on remember me preference.
 * Also dispatches a custom event when token is stored.
 * 
 * @function storeAccessToken
 * @param {string} token - JWT access token to store
 * @private
 * @returns {void}
 * 
 * @description
 * Storage strategy:
 * - If rememberMe is true: stores in localStorage (persists across sessions)
 * - If rememberMe is false: stores in sessionStorage (cleared on tab close)
 * - Dispatches TOKEN_REFRESHED_EVENT for other components to listen
 */
const storeAccessToken = (token) => {
  if (!isBrowser || !token) return

  const rememberPreference = localStorage.getItem(REMEMBER_ME_KEY)
  const rememberMe = rememberPreference === null ? true : rememberPreference === 'true'
  const expiresAt = decodeTokenExpiry(token)

  const expString = expiresAt ? String(expiresAt) : ''

  if (rememberMe) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    if (expiresAt) {
      localStorage.setItem(ACCESS_TOKEN_EXP_KEY, expString)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
    }
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    if (expiresAt) {
      sessionStorage.setItem(ACCESS_TOKEN_EXP_KEY, expString)
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  }

  window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, {
    detail: { accessToken: token, expiresAt },
  }))
}

// ============================================
// Request Deduplication & Caching
// ============================================

/**
 * Map of in-flight requests to prevent duplicate concurrent requests
 * @type {Map<string, Promise>}
 * @private
 */
const pendingRequests = new Map()

/**
 * Promise for in-flight token refresh request to prevent duplicate refresh calls
 * @type {Promise<string>|null}
 * @private
 */
let pendingRefreshRequest = null

/**
 * Map of cached GET responses with timestamps
 * @type {Map<string, {response: Object, timestamp: number}>}
 * @private
 */
const responseCache = new Map()

/**
 * Generates a unique cache key for request deduplication and caching
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @param {Object} [params] - Query parameters
 * @param {Object} [data] - Request body data
 * @returns {string} Unique cache key
 * @private
 */
const getRequestKey = (method, url, params, data) => {
  const paramsStr = params ? JSON.stringify(params) : ''
  const dataStr = data ? JSON.stringify(data) : ''
  return `${method.toUpperCase()}:${url}:${paramsStr}:${dataStr}`
}

/**
 * Request deduplication and caching wrapper.
 * Prevents duplicate concurrent requests and caches GET responses.
 * 
 * @function dedupeRequest
 * @param {Function} requestFn - Function that returns a Promise for the API request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @param {Object} [config={}] - Request configuration
 * @param {Object} [config.params] - Query parameters
 * @param {Object} [config.data] - Request body data
 * @param {boolean} [config.skipCache=false] - Whether to skip cache check
 * @returns {Promise<Object>} Promise resolving to API response
 * @private
 * 
 * @description
 * For GET requests:
 * - Checks cache first (if not expired)
 * - Returns cached response if available
 * - Prevents duplicate in-flight requests
 * 
 * For other methods:
 * - Only prevents duplicate in-flight requests
 * - Does not cache responses
 */
const dedupeRequest = (requestFn, method, url, config = {}) => {
  const { params, data, skipCache = false } = config
  const key = getRequestKey(method, url, params, data)
  
  // For GET requests, check cache first
  if (method === 'GET' && !skipCache) {
    const cached = responseCache.get(key)
    if (cached) {
      const age = Date.now() - cached.timestamp
      if (age < CACHE_TTL_MS) {
        // Return cached response
        return Promise.resolve(cached.response)
      } else {
        // Cache expired, remove it
        responseCache.delete(key)
      }
    }
  }
  
  // If request is already in flight, return the same promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }
  
  // Create new request
  const promise = requestFn()
    .then(response => {
      // Remove from pending on success
      pendingRequests.delete(key)
      
      // Cache GET responses
      if (method === 'GET' && !skipCache) {
        responseCache.set(key, {
          response,
          timestamp: Date.now()
        })
      }
      
      return response
    })
    .catch(error => {
      // Remove from pending on error
      pendingRequests.delete(key)
      throw error
    })
  
  // Store in-flight request
  pendingRequests.set(key, promise)
  
  return promise
}

/**
 * Invalidates cached responses matching a specific endpoint pattern.
 * Useful for cache invalidation after mutations (POST, PUT, DELETE).
 * 
 * @function invalidateCache
 * @param {string} pattern - Pattern to match against cache keys (e.g., '/user/profile')
 * @returns {void}
 * 
 * @example
 * // After updating user profile, invalidate profile cache
 * await userAPI.updateProfile(data);
 * invalidateCache('/user/profile');
 */
export const invalidateCache = (pattern) => {
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key)
    }
  }
}

/**
 * Clears all cached API responses.
 * Useful for logout or when you want to force fresh data.
 * 
 * @function clearCache
 * @returns {void}
 * 
 * @example
 * // Clear all cache on logout
 * await authAPI.logout();
 * clearCache();
 */
export const clearCache = () => {
  responseCache.clear()
}

// ============================================
// Axios Instance Configuration
// ============================================

/**
 * Axios instance configured for API requests
 * @type {import('axios').AxiosInstance}
 * @private
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

/**
 * Request interceptor to automatically add authentication token to requests.
 * Retrieves token from localStorage or sessionStorage and adds it to Authorization header.
 * 
 * @function requestInterceptor
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request config
 * @returns {import('axios').InternalAxiosRequestConfig} Modified config with auth header
 */
api.interceptors.request.use(
  (config) => {
    let token = null
    if (isBrowser) {
      token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor to handle:
 * - Automatic token refresh on 401 errors
 * - Rate limiting detection and event dispatch
 * - Notification endpoint 404 suppression
 * 
 * @function responseInterceptor
 * @param {import('axios').AxiosResponse} response - Successful response
 * @returns {import('axios').AxiosResponse} Response object
 * @param {import('axios').AxiosError} error - Error response
 * @returns {Promise<import('axios').AxiosResponse>} Retried request or rejected promise
 */
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Suppress 404 errors for notifications endpoint (expected - endpoint may not exist)
    const isNotifications404 = error.response?.status === 404 && 
                                originalRequest?.url?.includes('/notifications')
    
    if (isNotifications404) {
      // Return resolved promise with empty data to prevent error propagation
      // The catch handler in notificationsAPI will handle this
      return Promise.reject(error) // Still reject but suppress console error
    }

    // Check for rate limiting errors
    const errorMsg = typeof error.response?.data?.error === 'string' ? error.response.data.error : ''
    const messageMsg = typeof error.response?.data?.message === 'string' ? error.response.data.message : ''
    const isRateLimit = error.response?.status === 429 || 
                       errorMsg.includes('rate limit') ||
                       messageMsg.includes('Too many requests')
    
    if (isRateLimit) {
      // Dispatch custom event for global rate limiting notification
      window.dispatchEvent(new CustomEvent('rateLimit', {
        detail: { error }
      }))
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Use existing refresh request if one is in flight to prevent duplicate calls
        if (!pendingRefreshRequest) {
          pendingRefreshRequest = axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          ).then(response => {
            const { accessToken } = response.data.data
            storeAccessToken(accessToken)
            return accessToken
          }).catch(refreshError => {
            // Clear pending request on error
            pendingRefreshRequest = null
            throw refreshError
          })
        }

        const accessToken = await pendingRefreshRequest
        // Clear pending request after successful refresh
        pendingRefreshRequest = null

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Clear pending request on error
        pendingRefreshRequest = null
        // Refresh failed, redirect to login
        clearStoredAccessToken()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ============================================
// Auth API
// ============================================

/**
 * Authentication API endpoints
 * @namespace authAPI
 * @description Handles user authentication, registration, password management, and OAuth
 */
export const authAPI = {
  /**
   * Register a new user account
   * @method register
   * @param {Object} data - Registration data
   * @param {string} data.email - User email address
   * @param {string} data.password - User password
   * @param {string} [data.name] - User full name
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   * 
   * @example
   * const response = await authAPI.register({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   name: 'John Doe'
   * });
   */
  register: (data) => api.post('/auth/register', data),
  
  /**
   * Authenticate user and receive access token
   * @method login
   * @param {Object} data - Login credentials
   * @param {string} data.email - User email address
   * @param {string} data.password - User password
   * @param {boolean} [data.rememberMe] - Whether to remember user session
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   */
  login: (data) => api.post('/auth/login', data),
  
  /**
   * Logout current user and invalidate session
   * @method logout
   * @returns {Promise<import('axios').AxiosResponse>} Logout confirmation
   */
  logout: () => api.post('/auth/logout'),
  
  /**
   * Get current authenticated user information
   * @method getMe
   * @returns {Promise<import('axios').AxiosResponse>} Response with user profile data
   */
  getMe: () => api.get('/auth/me'),
  
  /**
   * Change user password
   * @method changePassword
   * @param {Object} data - Password change data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<import('axios').AxiosResponse>} Success confirmation
   */
  changePassword: (data) => api.put('/auth/change-password', data),
  
  /**
   * Delete user account
   * @method deleteAccount
   * @param {Object} data - Account deletion confirmation
   * @param {string} data.password - User password for confirmation
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteAccount: (data) => api.delete('/auth/delete-account', { data }),
  
  /**
   * Refresh access token using refresh token cookie
   * @method refresh
   * @returns {Promise<import('axios').AxiosResponse>} Response with new access token
   */
  refresh: () => api.post('/auth/refresh'),
  
  /**
   * Exchange OAuth authorization code for tokens
   * @method exchangeOAuthCode
   * @param {string} code - OAuth authorization code
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data and tokens
   */
  exchangeOAuthCode: (code) => api.post('/auth/oauth/exchange', { code }),
  
  /**
   * Verify user email address with verification token
   * @method verifyEmail
   * @param {string} token - Email verification token
   * @returns {Promise<import('axios').AxiosResponse>} Verification confirmation
   */
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  
  /**
   * Resend email verification link
   * @method resendVerification
   * @param {string} email - Email address to resend verification to
   * @returns {Promise<import('axios').AxiosResponse>} Resend confirmation
   */
  resendVerification: (email) => api.post('/auth/verify-email/resend', { email }),
  
  /**
   * Request password reset email
   * @method forgotPassword
   * @param {string} email - Email address for password reset
   * @returns {Promise<import('axios').AxiosResponse>} Reset email sent confirmation
   */
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  /**
   * Reset password using reset token
   * @method resetPassword
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise<import('axios').AxiosResponse>} Password reset confirmation
   */
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  /**
   * Get available OAuth providers
   * @method getOAuthProviders
   * @returns {Promise<import('axios').AxiosResponse>} Response with list of OAuth providers
   */
  getOAuthProviders: () => api.get('/auth/providers'),
}

// ============================================
// User API
// ============================================

/**
 * User profile and account management API endpoints
 * @namespace userAPI
 * @description Handles user profile, skills, preferences, and account operations
 */
export const userAPI = {
  /**
   * Get current user profile information
   * @method getProfile
   * @returns {Promise<import('axios').AxiosResponse>} Response with user profile data
   */
  getProfile: () => api.get('/user/profile'),
  
  /**
   * Update user profile information
   * @method updateProfile
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
   * @method uploadProfilePicture
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
   * @method deleteProfilePicture
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteProfilePicture: () => api.delete('/user/profile-picture'),
  
  /**
   * Get user's skills list
   * @method getSkills
   * @returns {Promise<import('axios').AxiosResponse>} Response with skills array
   */
  getSkills: () => api.get('/user/skills'),
  
  /**
   * Add a new skill to user profile
   * @method addSkill
   * @param {Object} data - Skill data
   * @param {string} data.name - Skill name
   * @param {string} [data.category] - Skill category (technical, soft, etc.)
   * @param {number} [data.proficiency] - Proficiency level (1-5)
   * @returns {Promise<import('axios').AxiosResponse>} Response with created skill
   */
  addSkill: (data) => api.post('/user/skills', data),
  
  /**
   * Update an existing skill
   * @method updateSkill
   * @param {string|number} skillId - Skill ID to update
   * @param {Object} data - Updated skill data
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated skill
   */
  updateSkill: (skillId, data) => api.put(`/user/skills/${skillId}`, data),
  
  /**
   * Delete a skill from user profile
   * @method deleteSkill
   * @param {string|number} skillId - Skill ID to delete
   * @returns {Promise<import('axios').AxiosResponse>} Deletion confirmation
   */
  deleteSkill: (skillId) => api.delete(`/user/skills/${skillId}`),
  
  /**
   * Get user dashboard data (cached)
   * @method getDashboard
   * @returns {Promise<import('axios').AxiosResponse>} Response with dashboard data
   */
  getDashboard: () => dedupeRequest(() => api.get('/user/dashboard'), 'GET', '/user/dashboard'),
  
  /**
   * Get user statistics
   * @method getStats
   * @returns {Promise<import('axios').AxiosResponse>} Response with user stats
   */
  getStats: () => api.get('/user/stats'),
  
  /**
   * Get user profile analytics
   * @method getProfileAnalytics
   * @returns {Promise<import('axios').AxiosResponse>} Response with analytics data
   */
  getProfileAnalytics: () => api.get('/user/analytics'),
  
  /**
   * Get user preferences
   * @method getPreferences
   * @returns {Promise<import('axios').AxiosResponse>} Response with user preferences
   */
  getPreferences: () => api.get('/user/preferences'),
  
  /**
   * Update user preferences
   * @method updatePreferences
   * @param {Object} data - Preferences data
   * @param {string} [data.theme] - UI theme preference
   * @param {boolean} [data.emailNotifications] - Email notifications preference
   * @param {string} [data.language] - Language preference
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated preferences
   */
  updatePreferences: (data) => api.put('/user/preferences', data),
}

// ============================================
// Admin API
// ============================================

/**
 * Admin API endpoints for user and system management
 * @namespace adminAPI
 * @description Handles administrative operations (requires admin role)
 */
export const adminAPI = {
  /**
   * Get paginated list of users
   * @method getUsers
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
   * @method getUser
   * @param {string|number} id - User ID
   * @returns {Promise<import('axios').AxiosResponse>} Response with user data
   */
  getUser: (id) => api.get(`/admin/users/${id}`),
  
  /**
   * Update user active status
   * @method updateUserStatus
   * @param {string|number} id - User ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated user
   */
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  
  /**
   * Update user role
   * @method updateUserRole
   * @param {string|number} id - User ID
   * @param {string} role - New role (user, admin, etc.)
   * @returns {Promise<import('axios').AxiosResponse>} Response with updated user
   */
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  
  /**
   * Get audit logs with filtering
   * @method getAuditLogs
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
   * @method getStats
   * @returns {Promise<import('axios').AxiosResponse>} Response with system stats
   */
  getStats: () => api.get('/admin/stats'),
  
  /**
   * Bulk update users (status or role)
   * @method bulkUpdateUsers
   * @param {Object} data - Bulk update data
   * @param {string[]} data.userIds - Array of user IDs
   * @param {string} data.action - Action type ('status' or 'role')
   * @param {boolean|string} data.value - New value (boolean for status, string for role)
   * @returns {Promise<import('axios').AxiosResponse>} Response with update result
   */
  bulkUpdateUsers: (data) => api.post('/admin/users/bulk', data),
  
  /**
   * Reset user password (sends reset email)
   * @method resetUserPassword
   * @param {string|number} id - User ID
   * @returns {Promise<import('axios').AxiosResponse>} Response with success status
   */
  resetUserPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  
  /**
   * Get user activity logs
   * @method getUserActivity
   * @param {string|number} id - User ID
   * @param {Object} [params] - Query parameters
   * @param {number} [params.page] - Page number
   * @param {number} [params.limit] - Items per page
   * @returns {Promise<import('axios').AxiosResponse>} Response with user activity logs
   */
  getUserActivity: (id, params) => api.get(`/admin/users/${id}/activity`, { params }),
  
  /**
   * Send email to user
   * @method sendEmailToUser
   * @param {string|number} id - User ID
   * @param {Object} data - Email data
   * @param {string} data.subject - Email subject
   * @param {string} data.message - Email message
   * @returns {Promise<import('axios').AxiosResponse>} Response with success status
   */
  sendEmailToUser: (id, data) => api.post(`/admin/users/${id}/send-email`, data),
  
  /**
   * Impersonate user (login as another user)
   * @method impersonateUser
   * @param {string|number} id - User ID to impersonate
   * @returns {Promise<import('axios').AxiosResponse>} Response with user tokens
   */
  impersonateUser: (id) => api.post(`/admin/users/${id}/impersonate`),
}


// ============================================
// Notifications API
// ============================================

/**
 * Helper function to handle optional notification endpoints gracefully.
 * These endpoints may not exist on the backend - that's OK, we'll use event-based notifications.
 * 
 * @function handleOptionalEndpoint
 * @param {Function} requestFn - Function that returns a Promise for the API request
 * @param {Object} [fallbackData={success: true}] - Fallback data to return on error
 * @returns {Promise<Object>} Promise resolving to API response or fallback data
 * @private
 */
const handleOptionalEndpoint = (requestFn, fallbackData = { success: true }) => {
  return requestFn().catch((error) => {
    // Silently handle 404s (endpoint doesn't exist) and return fallback response
    // For other errors, still return fallback to prevent breaking the app
    return Promise.resolve({ data: fallbackData })
  })
}

/**
 * Notifications API endpoints.
 * These endpoints may not exist on the backend - that's OK, we'll use event-based notifications.
 * All methods gracefully handle missing endpoints by returning fallback data.
 * 
 * @namespace notificationsAPI
 * @description Handles notification management operations
 */
export const notificationsAPI = {
  /**
   * Get list of notifications
   * @method list
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
   * @method getById
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Response with notification data or error message if not found
   */
  getById: (id) => handleOptionalEndpoint(
    () => api.get(`/notifications/${id}`),
    { success: false, message: 'Notification not found' }
  ),
  
  /**
   * Mark notification as read
   * @method markAsRead
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Success confirmation
   */
  markAsRead: (id) => handleOptionalEndpoint(
    () => api.patch(`/notifications/${id}/read`)
  ),
  
  /**
   * Mark all notifications as read
   * @method markAllAsRead
   * @returns {Promise<Object>} Success confirmation
   */
  markAllAsRead: () => handleOptionalEndpoint(
    () => api.patch('/notifications/read-all')
  ),
  
  /**
   * Dismiss a notification
   * @method dismiss
   * @param {string|number} id - Notification ID
   * @returns {Promise<Object>} Success confirmation
   */
  dismiss: (id) => handleOptionalEndpoint(
    () => api.delete(`/notifications/${id}`)
  ),
  
  /**
   * Clear all notifications
   * @method clearAll
   * @returns {Promise<Object>} Success confirmation
   */
  clearAll: () => handleOptionalEndpoint(
    () => api.delete('/notifications')
  ),
}

// ============================================
// Error Handling Utilities
// ============================================

/**
 * Standardized API error handler that extracts error information from axios errors.
 * Handles different error types: server errors, network errors, and other errors.
 * 
 * @function handleApiError
 * @param {import('axios').AxiosError|Error} error - Error object from axios or other source
 * @returns {Object} Standardized error object
 * @returns {string} returns.message - Human-readable error message
 * @returns {number} returns.status - HTTP status code (0 for network errors)
 * @returns {Array} returns.errors - Array of validation errors (if any)
 * @returns {*} returns.data - Error response data (if any)
 * @returns {boolean} [returns.isRateLimit] - True if error is rate limiting (429)
 * @returns {boolean} [returns.isServiceUnavailable] - True if error is service unavailable (503)
 * @returns {boolean} [returns.isNetworkError] - True if error is a network error
 * 
 * @example
 * try {
 *   await authAPI.login(credentials);
 * } catch (error) {
 *   const errorInfo = handleApiError(error);
 *   if (errorInfo.isRateLimit) {
 *     console.log('Too many requests, please wait');
 *   } else {
 *     console.error(errorInfo.message);
 *   }
 * }
 */
export const handleApiError = (error) => {
  // Enhanced error logging for debugging
  if (error.response) {
    // Server responded with error status
    const { status, data, config } = error.response
    const requestInfo = {
      url: config?.url,
      method: config?.method?.toUpperCase(),
      baseURL: config?.baseURL,
      status,
      statusText: error.response.statusText,
      errorMessage: data?.message || data?.error || 'Unknown error',
      errorData: data,
    }
    
    // Log detailed error information for 400 errors
    if (status === 400) {
      logger.error('400 Bad Request Error Details:', {
        ...requestInfo,
        requestPayload: config?.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : undefined,
        validationErrors: data?.errors || [],
      })
    } else {
      logger.error('API Error:', requestInfo)
      
      // Capture server errors (500+) in Sentry
      if (status >= 500) {
        captureException(error, {
          tags: {
            errorType: 'api_error',
            statusCode: status,
          },
          extra: {
            url: config?.url,
            method: config?.method,
            status,
            errorMessage: data?.message || data?.error,
          },
        })
      }
    }
  } else {
    logger.error('API Error:', {
      message: error.message,
      request: error.request ? 'Request made but no response' : 'No request made',
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : undefined,
    })
    
    // Capture network errors in Sentry
    if (error.request) {
      captureException(error, {
        tags: {
          errorType: 'network_error',
        },
        extra: {
          url: error.config?.url,
          method: error.config?.method,
        },
      })
    }
  }
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    
    // Handle rate limiting gracefully
    if (status === 429) {
      return {
        message: data.message || 'Too many requests. Please try again later.',
        status,
        errors: data.errors || [],
        data: data.data,
        isRateLimit: true
      }
    }
    
    // Handle service unavailable
    if (status === 503) {
      return {
        message: data.message || 'Service temporarily unavailable. Please try again later.',
        status,
        errors: data.errors || [],
        data: data.data,
        isServiceUnavailable: true
      }
    }
    
    return {
      message: data.message || 'An error occurred',
      status,
      errors: data.errors || [], // Backend returns validation errors as array of objects
      data: data.data,
    }
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      errors: [],
    }
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      errors: [],
      isNetworkError: true,
    }
  }
}

/**
 * Creates axios upload configuration with progress tracking.
 * Useful for file uploads where you want to show progress to the user.
 * 
 * @function createUploadConfig
 * @param {Function} onProgress - Callback function called with upload progress (0-100)
 * @returns {Object} Axios request configuration object with onUploadProgress handler
 * 
 * @example
 * const config = createUploadConfig((percent) => {
 *   console.log(`Upload progress: ${percent}%`);
 * });
 * await userAPI.uploadProfilePicture(file, config);
 */
export const createUploadConfig = (onProgress) => ({
  onUploadProgress: (progressEvent) => {
    if (onProgress && progressEvent.total) {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  },
})

/**
 * Generic API request wrapper with automatic retry logic and error handling.
 * Automatically retries failed requests for retryable status codes with exponential backoff.
 * 
 * @async
 * @function apiRequest
 * @param {Function} requestFn - Function that returns a Promise for the API request
 * @param {Object} [options={}] - Retry and error handling options
 * @param {string} [options.errorMessage='An error occurred'] - Default error message
 * @param {number} [options.retries=0] - Maximum number of retry attempts
 * @param {number} [options.retryDelay=1000] - Base delay in milliseconds between retries
 * @param {number[]} [options.retryableStatuses=[408, 429, 500, 502, 503, 504]] - HTTP status codes that should trigger retry
 * @param {Function} [options.onRetry] - Callback called before each retry (attempt, maxRetries, errorDetails)
 * @returns {Promise<Object>} Promise resolving to standardized response object
 * @returns {boolean} returns.success - Whether request succeeded
 * @returns {*} [returns.data] - Response data (if successful)
 * @returns {string} [returns.message] - Success message (if successful)
 * @returns {string} [returns.error] - Error message (if failed)
 * @returns {Array} [returns.errors] - Validation errors (if failed)
 * @returns {number} [returns.status] - HTTP status code (if failed)
 * @returns {boolean} [returns.isRetryable] - Whether error is retryable (if failed)
 * @returns {Error} [returns.originalError] - Original error object (if failed)
 * 
 * @example
 * // Simple request with retry
 * const result = await apiRequest(
 *   () => api.get('/user/profile'),
 *   { retries: 3, retryDelay: 1000 }
 * );
 * 
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * 
 * @example
 * // Request with retry callback
 * const result = await apiRequest(
 *   () => api.post('/data', payload),
 *   {
 *     retries: 2,
 *     onRetry: (attempt, maxRetries, error) => {
 *       console.log(`Retry ${attempt}/${maxRetries}: ${error.message}`);
 *     }
 *   }
 * );
 */
export const apiRequest = async (requestFn, options = {}) => {
  const {
    errorMessage = 'An error occurred',
    retries = 0,
    retryDelay = 1000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry = null,
  } = options

  let lastError = null
  let attempt = 0

  while (attempt <= retries) {
    try {
      const response = await requestFn()
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message,
      }
    } catch (error) {
      lastError = error
      const errorDetails = handleApiError(error)
      const status = errorDetails.status || 0

      // Check if error is retryable
      const isRetryable = 
        retries > 0 && 
        attempt < retries &&
        (retryableStatuses.includes(status) || status === 0) // status 0 = network error

      if (isRetryable) {
        attempt++
        if (onRetry) {
          onRetry(attempt, retries, errorDetails)
        }
        // Exponential backoff: delay increases with each retry
        await new Promise((resolve) => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)))
        continue
      }

      // Not retryable or max retries reached
      return {
        success: false,
        error: errorDetails.message || errorMessage,
        errors: errorDetails.errors,
        status: errorDetails.status,
        isRetryable: false,
        originalError: error,
      }
    }
  }

  // Should never reach here, but just in case
  const errorDetails = handleApiError(lastError)
  return {
    success: false,
    error: errorDetails.message || errorMessage,
    errors: errorDetails.errors,
    status: errorDetails.status,
    isRetryable: false,
    originalError: lastError,
  }
}

// ============================================
// Health Check
// ============================================

/**
 * Health check endpoint to verify API server is running
 * @function healthCheck
 * @returns {Promise<import('axios').AxiosResponse>} Response with server health status
 */
export const healthCheck = () => api.get('/health')

// ============================================
// Analytics API
// ============================================

/**
 * Analytics API endpoints for usage statistics and user analytics
 * @namespace analyticsAPI
 * @description Handles analytics and usage statistics
 */
export const analyticsAPI = {
  /**
   * Get analytics data for current user
   * @method getUserAnalytics
   * @returns {Promise<import('axios').AxiosResponse>} Response with user analytics data
   */
  getUserAnalytics: () => api.get('/analytics/user'),
  
  /**
   * Get platform-wide usage statistics
   * @method getUsageStats
   * @returns {Promise<import('axios').AxiosResponse>} Response with usage statistics
   */
  getUsageStats: () => api.get('/analytics/usage')
}

/**
 * Default export: Axios instance for direct API calls
 * @type {import('axios').AxiosInstance}
 * @default
 */
export default api
