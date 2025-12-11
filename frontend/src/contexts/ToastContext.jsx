import React, { createContext, useContext, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import Toast, { useToast } from '../components/ui/Toast'

const ToastContext = createContext()

export const useGlobalToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useGlobalToast must be used within a ToastProvider')
  }
  return context
}

// Helper hook to safely access notifications context
const useNotificationsSafely = () => {
  try {
    // Dynamic import to avoid circular dependency issues
    const { useNotificationsContext } = require('./NotificationsContext')
    return useNotificationsContext()
  } catch (error) {
    return null
  }
}

export const ToastProvider = ({ children }) => {
  const { addToast, toasts, removeToast, addRateLimitToast, addServiceUnavailableToast, showToast } = useToast()
  
  // Try to get notifications context (may not be available if provider order is different)
  const notificationsContext = useNotificationsSafely()
  const addNotification = notificationsContext?.addNotification

  // Enhanced addToast that can optionally sync to notifications
  const addToastWithSync = useCallback((message, type = 'info', duration = 5000, options = {}) => {
    const { 
      syncToNotifications = false,  // Explicit opt-in for backward compatibility
      metadata = {}
    } = options

    // Always show toast
    addToast(message, type, duration)

    // Conditionally sync to notifications
    if (syncToNotifications && addNotification) {
      // Extract title from message
      const firstSentence = message.split('.')[0].trim()
      const title = firstSentence.length <= 60 && firstSentence.length > 0 
        ? firstSentence 
        : type.charAt(0).toUpperCase() + type.slice(1)

      addNotification({
        id: `toast-${Date.now()}-${Math.random()}`,
        type: type === 'rateLimit' ? 'info' : type, // Normalize rateLimit to info
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
        metadata
      })
    }
  }, [addToast, addNotification])

  useEffect(() => {
    // Listen for unified notification service events
    const handleShowToast = (event) => {
      const { message, type, duration, metadata } = event.detail || {}
      if (message) {
        addToast(message, type || 'info', duration || 5000)
      }
    }

    // Listen for global rate limiting events
    const handleRateLimit = (event) => {
      showToast('rateLimit')
    }

    const handleRateLimitFallback = (event) => {
      showToast('rateLimitFallback')
    }

    const handleSessionExpiring = (event) => {
      const expiresAt = event.detail?.expiresAt
      let minutes = 1
      if (expiresAt) {
        const diffMs = expiresAt - Date.now()
        if (diffMs > 0) {
          minutes = Math.max(1, Math.round(diffMs / 60000))
        }
      }

      addToastWithSync(
        `Your session will expire in about ${minutes} minute${minutes === 1 ? '' : 's'}. Save your work to avoid losing changes.`,
        'warning',
        7000,
        { syncToNotifications: true } // Important warning, save to notifications
      )
    }

    const handleSessionExpired = () => {
      addToastWithSync(
        'Your session has expired. Please sign in again to continue.', 
        'error', 
        7000,
        { syncToNotifications: true } // Critical error, save to notifications
      )
    }

    // Network status events - toast only (too frequent for notifications)
    const handleNetworkOnline = (event) => {
      addToast(event.detail?.message || 'Connection restored. You\'re back online.', 'success', 3000)
    }

    const handleNetworkOffline = (event) => {
      addToast(event.detail?.message || 'No internet connection. Some features may be unavailable.', 'warning', 5000)
    }

    // Add event listeners
    window.addEventListener('showToast', handleShowToast)
    window.addEventListener('rateLimit', handleRateLimit)
    window.addEventListener('rateLimitFallback', handleRateLimitFallback)
    window.addEventListener('sessionExpiring', handleSessionExpiring)
    window.addEventListener('sessionExpired', handleSessionExpired)
    window.addEventListener('networkOnline', handleNetworkOnline)
    window.addEventListener('networkOffline', handleNetworkOffline)

    // Cleanup
    return () => {
      window.removeEventListener('showToast', handleShowToast)
      window.removeEventListener('rateLimit', handleRateLimit)
      window.removeEventListener('rateLimitFallback', handleRateLimitFallback)
      window.removeEventListener('sessionExpiring', handleSessionExpiring)
      window.removeEventListener('sessionExpired', handleSessionExpired)
      window.removeEventListener('networkOnline', handleNetworkOnline)
      window.removeEventListener('networkOffline', handleNetworkOffline)
    }
  }, [showToast, addToast, addToastWithSync])

  return (
    <ToastContext.Provider value={{ 
      addToast: addToastWithSync, // Use enhanced version that can sync to notifications
      toasts, 
      removeToast, 
      showToast, 
      addRateLimitToast, 
      addServiceUnavailableToast 
    }}>
      {children}
      
      {/* Global Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
