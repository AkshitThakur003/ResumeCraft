/**
 * Error Handling Utilities
 * Standardized error handling for API requests
 * @module api/errorHandling
 */

import { logger } from '../logger'
import { captureException } from '../sentry'

/**
 * Standardized API error handler that extracts error information from axios errors.
 * Handles different error types: server errors, network errors, and other errors.
 * 
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
        message: data.message || 'Service temporarily unavailable. The server may be starting up. Please try again in a moment.',
        status,
        errors: data.errors || [],
        data: data.data,
        isServiceUnavailable: true
      }
    }
    
    // Handle 500 errors with user-friendly message
    if (status >= 500) {
      return {
        message: data.message || 'Server error. Our team has been notified. Please try again in a moment.',
        status,
        errors: data.errors || [],
        data: data.data,
      }
    }
    
    // Handle 404 errors
    if (status === 404) {
      return {
        message: data.message || 'The requested resource was not found.',
        status,
        errors: data.errors || [],
        data: data.data,
      }
    }
    
    // Handle 401/403 errors
    if (status === 401) {
      return {
        message: data.message || 'Your session has expired. Please log in again.',
        status,
        errors: data.errors || [],
        data: data.data,
      }
    }
    
    if (status === 403) {
      return {
        message: data.message || 'You don\'t have permission to perform this action.',
        status,
        errors: data.errors || [],
        data: data.data,
      }
    }
    
    return {
      message: data.message || 'An error occurred. Please try again.',
      status,
      errors: data.errors || [], // Backend returns validation errors as array of objects
      data: data.data,
    }
  } else if (error.request) {
    // Network error - provide user-friendly message
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
    const isOffline = !navigator.onLine
    
    let message = 'Network error. Please check your connection.'
    if (isTimeout) {
      message = 'Request timed out. The server may be slow to respond. Please try again.'
    } else if (isOffline) {
      message = 'You appear to be offline. Please check your internet connection and try again.'
    }
    
    return {
      message,
      status: 0,
      errors: [],
      isNetworkError: true,
      isTimeout,
      isOffline,
    }
  } else {
    // Other error - provide user-friendly message
    let message = error.message || 'An unexpected error occurred'
    
    // Map common error messages to user-friendly text
    const errorMessageMap = {
      'Network Error': 'Connection lost. Please check your internet and try again.',
      'timeout': 'Request timed out. Please try again.',
      'Failed to fetch': 'Unable to reach the server. Please check your connection.',
    }
    
    for (const [key, friendlyMessage] of Object.entries(errorMessageMap)) {
      if (error.message?.includes(key)) {
        message = friendlyMessage
        break
      }
    }
    
    return {
      message,
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

