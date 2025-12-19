/**
 * Hook for Server-Sent Events (SSE) notification connection
 */

import { useRef, useCallback } from 'react'
import { createSSEConnection } from '../../utils/sse'
import { getStoredAccessToken } from '../../utils/tokenStorage'
import { formatNotification, formatNotifications } from './notificationUtils'
import { logger } from '../../utils/logger'

export const useNotificationSSE = ({ dispatch, isAuthenticated, stopPolling, startPolling }) => {
  const sseConnectionRef = useRef(null)
  const sseFailedRef = useRef(false)

  /**
   * Set up SSE connection
   */
  const setupSSE = useCallback(() => {
    // Skip SSE if we've already determined it doesn't work
    if (sseFailedRef.current) {
      logger.debug('SSE previously failed, using polling fallback')
      startPolling()
      return
    }

    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const sseUrl = `${baseURL}/notifications/stream`
      
      const { token } = getStoredAccessToken()
      
      logger.debug('Attempting SSE connection for notifications')
      
      const cancelFn = createSSEConnection(sseUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        onMessage: (data) => {
          const eventType = data.event || data.type
          
          if (eventType === 'notification') {
            const notification = data
            const formattedNotification = formatNotification({
              ...notification,
              id: notification.id || notification._id,
            })
            
            dispatch({ type: 'ADD_NOTIFICATION', payload: formattedNotification })
          } else if (eventType === 'initial') {
            const notifications = data.notifications || []
            const formattedNotifications = formatNotifications(notifications)
            
            dispatch({ 
              type: 'SET_NOTIFICATIONS', 
              payload: { 
                notifications: formattedNotifications, 
                totalCount: data.count || formattedNotifications.length 
              } 
            })
          } else if (eventType === 'connected') {
            logger.debug('SSE notification stream connected')
            stopPolling()
            sseFailedRef.current = false
          }
        },
        onComplete: () => {
          logger.debug('SSE notification stream completed')
          sseConnectionRef.current = null
          setTimeout(() => {
            if (isAuthenticated) {
              setupSSE()
            }
          }, 5000) // Retry after 5 seconds
        },
        onError: (error) => {
          logger.warn('SSE notification stream error, falling back to polling:', error.message)
          sseFailedRef.current = true
          sseConnectionRef.current = null
          startPolling()
        },
      })

      sseConnectionRef.current = cancelFn
      logger.debug('SSE connection established for notifications')
    } catch (error) {
      logger.warn('Failed to establish SSE connection, using polling:', error.message)
      sseFailedRef.current = true
      startPolling()
    }
  }, [dispatch, isAuthenticated, stopPolling, startPolling])

  /**
   * Cleanup SSE connection
   */
  const cleanupSSE = useCallback(() => {
    if (sseConnectionRef.current) {
      sseConnectionRef.current()
      sseConnectionRef.current = null
    }
  }, [])

  return {
    setupSSE,
    cleanupSSE,
    sseConnectionRef,
  }
}

