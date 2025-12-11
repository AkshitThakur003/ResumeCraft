import { useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

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

    authAPI.getOAuthProviders()
      .then((response) => {
        if (!isMounted) return
        const providerList = response.data?.data || []
        setProviders(providerList)
        setError('')
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load OAuth providers', err)
        setError('Social login is temporarily unavailable.')
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { providers, loading, error }
}

