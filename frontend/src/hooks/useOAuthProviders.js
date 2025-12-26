import { useState, useEffect } from 'react'
import { authAPI, handleApiError } from '../utils/api'
import { logger } from '../utils/logger'

/**
 * Cache configuration for OAuth providers
 */
const CACHE_KEY = 'oauth_providers_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached OAuth providers from localStorage
 * @returns {Array|null} Cached providers array or null if cache is invalid/expired
 */
const getCachedProviders = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY)
    }
  } catch (e) {
    // Ignore cache errors (corrupted data, etc.)
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch {
      // Ignore removal errors
    }
  }
  return null
}

/**
 * Cache OAuth providers in localStorage
 * @param {Array} providers - Providers array to cache
 */
const setCachedProviders = (providers) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: providers,
      timestamp: Date.now()
    }))
  } catch (e) {
    // Ignore cache errors (quota exceeded, etc.)
  }
}

/**
 * Hook to fetch OAuth providers with retry logic and caching
 * Handles cold starts and network errors gracefully with exponential backoff
 * @returns {Object} { providers, loading, error }
 */
export const useOAuthProviders = () => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const maxRetries = 3
    const baseDelay = 2000 // Start with 2 seconds

    // Check cache first for instant display
    const cachedProviders = getCachedProviders()
    if (cachedProviders && cachedProviders.length >= 0) {
      setProviders(cachedProviders)
      setLoading(false)
      // Still fetch in background to update cache, but don't block UI
    }

    /**
     * Fetch OAuth providers from API with retry logic
     * @param {number} attempt - Current retry attempt (0-indexed)
     */
    const fetchProviders = async (attempt = 0) => {
      try {
        setLoading(true)
        setError('')
        
        const response = await authAPI.getOAuthProviders()
        
        if (!isMounted) return
        
        // Handle different response structures
        const responseData = response?.data
        let providerList = []
        
        if (responseData) {
          // Check if response has the expected structure
          if (Array.isArray(responseData.data)) {
            providerList = responseData.data
          } else if (Array.isArray(responseData)) {
            providerList = responseData
          } else if (responseData.success && Array.isArray(responseData.data)) {
            providerList = responseData.data
          }
        }
        
        // Cache the successful response
        setCachedProviders(providerList)
        
        setProviders(providerList)
        setError('')
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        
        // Use the standardized error handler
        let errorInfo
        try {
          errorInfo = handleApiError(err)
        } catch (handleError) {
          // If handleApiError itself fails, use basic error info
          logger.error('Error handling failed:', handleError)
          errorInfo = {
            status: err?.response?.status || 0,
            message: err?.message || 'Unknown error',
            isServiceUnavailable: err?.response?.status === 503,
            isNetworkError: !err?.response
          }
        }
        
        // Handle 503 (Service Unavailable) - OAuth not configured
        if (errorInfo.status === 503 || errorInfo.isServiceUnavailable) {
          // OAuth is not configured, which is fine - just don't show providers
          setProviders([])
          setError('')
          setLoading(false)
          return
        }
        
        // Retry on network errors or timeouts (cold start scenario)
        const isNetworkError = errorInfo.status === 0 || errorInfo.isNetworkError
        const isTimeout = err.code === 'ECONNABORTED' || 
                         err.message?.includes('timeout') ||
                         err.message?.includes('Network Error')
        
        if ((isNetworkError || isTimeout) && attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = baseDelay * Math.pow(2, attempt)
          retryCount = attempt + 1
          
          logger.debug(`OAuth providers fetch failed (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms...`)
          
          setTimeout(() => {
            if (isMounted) {
              fetchProviders(attempt + 1)
            }
          }, delay)
          return
        }
        
        // Max retries reached or non-retryable error
        logger.warn('OAuth providers unavailable:', errorInfo.message)
        setProviders([])
        setError('')
        setLoading(false)
      }
    }

    // Always fetch to get fresh data (or retry if needed)
    // If we had cached data, this will update it in the background
    fetchProviders()

    return () => {
      isMounted = false
    }
  }, [])

  return { providers, loading, error }
}

