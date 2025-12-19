import { useState, useEffect } from 'react'
import { authAPI, handleApiError } from '../utils/api'

/**
 * Hook to fetch OAuth providers
 * @returns {Object} { providers, loading, error }
 */
export const useOAuthProviders = () => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    // Wrap in try-catch to handle any unexpected errors
    const fetchProviders = async () => {
      try {
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
        
        setProviders(providerList)
        setError('')
      } catch (err) {
        if (!isMounted) return
        
        // Use the standardized error handler
        let errorInfo
        try {
          errorInfo = handleApiError(err)
        } catch (handleError) {
          // If handleApiError itself fails, use basic error info
          console.error('Error handling failed:', handleError)
          errorInfo = {
            status: err?.response?.status || 0,
            message: err?.message || 'Unknown error',
            isServiceUnavailable: err?.response?.status === 503
          }
        }
        
        // Handle 503 (Service Unavailable) - OAuth not configured
        if (errorInfo.status === 503 || errorInfo.isServiceUnavailable) {
          // OAuth is not configured, which is fine - just don't show providers
          setProviders([])
          setError('')
        } else {
          // For other errors, log but don't show error to user
          // OAuth is optional, so we'll just hide the buttons
          console.warn('OAuth providers unavailable:', errorInfo.message)
          setProviders([])
          setError('')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProviders()

    return () => {
      isMounted = false
    }
  }, [])

  return { providers, loading, error }
}

