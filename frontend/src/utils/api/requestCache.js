/**
 * Request Cache and Deduplication Module
 * Handles request caching and prevents duplicate concurrent requests
 * @module api/requestCache
 */

/** @constant {number} Cache time-to-live in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Map of in-flight requests to prevent duplicate concurrent requests
 * @type {Map<string, Promise>}
 */
const pendingRequests = new Map()

/**
 * Map of cached GET responses with timestamps
 * @type {Map<string, {response: Object, timestamp: number}>}
 */
const responseCache = new Map()

/**
 * Generates a unique cache key for request deduplication and caching
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @param {Object} [params] - Query parameters
 * @param {Object} [data] - Request body data
 * @returns {string} Unique cache key
 */
export const getRequestKey = (method, url, params, data) => {
  const paramsStr = params ? JSON.stringify(params) : ''
  const dataStr = data ? JSON.stringify(data) : ''
  return `${method.toUpperCase()}:${url}:${paramsStr}:${dataStr}`
}

/**
 * Request deduplication and caching wrapper.
 * Prevents duplicate concurrent requests and caches GET responses.
 * 
 * @param {Function} requestFn - Function that returns a Promise for the API request
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Request URL
 * @param {Object} [config={}] - Request configuration
 * @param {Object} [config.params] - Query parameters
 * @param {Object} [config.data] - Request body data
 * @param {boolean} [config.skipCache=false] - Whether to skip cache check
 * @returns {Promise<Object>} Promise resolving to API response
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
export const dedupeRequest = (requestFn, method, url, config = {}) => {
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
 * @returns {void}
 * 
 * @example
 * // Clear all cache on logout
 * await authAPI.logout();
 * clearCache();
 */
export const clearCache = () => {
  responseCache.clear()
  pendingRequests.clear()
}

