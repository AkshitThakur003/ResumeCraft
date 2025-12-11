import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Info, CheckCircle2, AlertTriangle, XCircle, Bot } from 'lucide-react'
import { cn } from '../../utils'

/**
 * Toast notification component
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message
 * @param {string} props.type - Toast type (info, success, warning, error, rateLimit)
 * @param {number} props.duration - Auto-dismiss duration in milliseconds
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {string} props.className - Additional CSS classes
 */
const Toast = React.forwardRef(({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  className 
}, ref) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300) // Allow animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // Improved color contrast for WCAG AA compliance
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
    success: 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
    warning: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100',
    rateLimit: 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100'
  }

  const iconComponents = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    rateLimit: Bot
  }

  const IconComponent = iconComponents[type] || Info

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'max-w-md p-4 border rounded-lg shadow-lg backdrop-blur-sm',
        typeStyles[type],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose?.(), 300)
          }}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  )
})

Toast.displayName = 'Toast'

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  const timeoutRefs = useRef(new Map()) // Track timeouts for cleanup
  const MAX_TOASTS = 5 // Maximum number of toasts to display

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => {
      // Check for duplicate messages (same message and type within last 2 seconds)
      const now = Date.now()
      const recentDuplicate = prev.find(
        t => t.message === message && t.type === type
      )
      if (recentDuplicate) {
        return prev // Don't add duplicate
      }
      
      const newToasts = [...prev, toast]
      // Limit number of toasts - remove oldest if exceeding limit
      return newToasts.slice(-MAX_TOASTS)
    })
    
    // Auto-remove after duration
    const timeoutId = setTimeout(() => {
      removeToast(id)
      timeoutRefs.current.delete(id)
    }, duration + 300) // Add small buffer for animation
    
    // Store timeout reference for cleanup
    timeoutRefs.current.set(id, timeoutId)
  }

  const removeToast = (id) => {
    // Clear timeout if toast is manually removed
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
    
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutRefs.current.clear()
    }
  }, [])

  const addRateLimitToast = () => {
    addToast(
      'AI service is busy! Don\'t worry - we\'ve used our intelligent backup system to analyze your resume.',
      'rateLimit',
      7000
    )
  }

  const addServiceUnavailableToast = () => {
    addToast(
      'AI service temporarily unavailable. Your analysis completed successfully using our backup system.',
      'warning',
      7000
    )
  }

  // Convenience method that supports both formats:
  // - showToast(message, type) - show custom message
  // - showToast(type) - show predefined toast
  const showToast = (messageOrType, type, duration) => {
    // If two arguments provided, treat as (message, type)
    if (type !== undefined) {
      addToast(messageOrType, type, duration)
      return
    }
    
    // Otherwise, treat as predefined type shortcut
    switch (messageOrType) {
      case 'rateLimit':
        addRateLimitToast()
        break
      case 'rateLimitFallback':
        addServiceUnavailableToast()
        break
      default:
        // Don't show unknown notification - just log it
        // Using logger would require importing, keeping console.warn for now
        if (import.meta.env.DEV) {
          console.warn(`Unknown notification type: ${messageOrType}`)
        }
    }
  }

  return {
    toasts,
    addToast,
    removeToast,
    addRateLimitToast,
    addServiceUnavailableToast,
    showToast
  }
}

export default Toast
