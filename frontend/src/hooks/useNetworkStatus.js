import { useState, useEffect } from 'react'

/**
 * Hook to detect network status and handle offline/online states
 * Note: This hook doesn't require ToastContext to avoid circular dependencies
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Dispatch custom event for toast system to handle
        window.dispatchEvent(new CustomEvent('networkOnline', {
          detail: { message: 'Connection restored. You\'re back online.' }
        }))
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      // Dispatch custom event for toast system to handle
      window.dispatchEvent(new CustomEvent('networkOffline', {
        detail: { message: 'No internet connection. Some features may be unavailable.' }
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}

