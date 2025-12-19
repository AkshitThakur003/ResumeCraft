import { useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { notificationsAPI } from '../utils/api'
import { formatRelativeTime, isValidObjectId } from '../utils'
import { useNotificationsReducer } from './useNotificationsReducer'
import { logger } from '../utils/logger'
import { createSSEConnection } from '../utils/sse'
import { getStoredAccessToken } from '../utils/tokenStorage'

// Check localStorage to see if we've already determined the endpoint doesn't exist
const checkEndpointExists = () => {
  const cached = localStorage.getItem('notificationsEndpointExists')
  // If cached value is 'false', endpoint doesn't exist
  // If null or 'true', we should try the endpoint
  return cached !== 'false'
}

const markEndpointAsMissing = () => {
  localStorage.setItem('notificationsEndpointExists', 'false')
}

export const useNotifications = () => {
  // Safely get auth context - handle case where AuthProvider isn't ready yet
  let isAuthenticated = false
  try {
    const auth = useAuth()
    isAuthenticated = auth?.isAuthenticated || false
  } catch (error) {
    // AuthProvider not available yet, use default value
    isAuthenticated = false
  }
  
  const { state, dispatch } = useNotificationsReducer()
  const pollingIntervalRef = useRef(null)
  const userActivityTimeoutRef = useRef(null)
  const sseConnectionRef = useRef(null)
  const sseFailedRef = useRef(false) // Track if SSE failed, to use polling fallback

  // Fetch notifications from API or generate from events
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) return

    const { skip = 0, limit = 50, append = false } = options

    try {
      if (!append) {
        dispatch({ type: 'SET_LOADING', payload: true })
      }
      
      // Skip API call if we've determined the endpoint doesn't exist (to avoid repeated 404 errors)
      // Check localStorage to persist this across page reloads
      if (checkEndpointExists()) {
        try {
          const response = await notificationsAPI.list({ 
            limit, 
            skip,
            sort: 'createdAt',
            order: 'desc'
          })
          const apiNotifications = response?.data?.data?.notifications || []
          const totalCount = response?.data?.data?.count || response?.data?.data?.total || apiNotifications.length
          
          if (apiNotifications.length > 0 || totalCount > 0) {
            // Transform API notifications to our format
            const formattedNotifications = apiNotifications.map(notif => ({
              id: notif._id || notif.id,
              type: notif.type || 'info',
              title: notif.title,
              message: notif.message,
              timestamp: formatRelativeTime(notif.createdAt || notif.timestamp),
              createdAt: notif.createdAt || notif.timestamp,
              read: notif.read || false,
              metadata: notif.metadata || {},
            }))
            
            if (append) {
              dispatch({ 
                type: 'APPEND_NOTIFICATIONS', 
                payload: { notifications: formattedNotifications, totalCount } 
              })
            } else {
              dispatch({ 
                type: 'SET_NOTIFICATIONS', 
                payload: { notifications: formattedNotifications, totalCount } 
              })
            }
            return
          }
        } catch (apiError) {
          // API not available (404 is expected) - silently continue with event-based generation
          if (apiError?.response?.status === 404) {
            // Mark that endpoint doesn't exist so we skip API calls in the future
            // Use localStorage to persist across page reloads
            markEndpointAsMissing()
          } else if (apiError?.response?.status !== 404) {
            logger.debug('Notifications API error:', apiError.message)
          }
        }
      } else {
        // Endpoint doesn't exist - skip API call entirely
        // This prevents repeated 404 errors in server logs
      }

      // Generate notifications from app state/events if API unavailable
      if (!append) {
        await generateEventBasedNotifications()
      }
      
    } catch (error) {
      logger.error('Failed to fetch notifications:', error)
    } finally {
      if (!append) {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }, [isAuthenticated, dispatch])

  // Generate notifications from recent app events
  const generateEventBasedNotifications = useCallback(async () => {
    try {
      const notifications = []
      const now = new Date()
      
      // Fetch minimal data needed for notifications using cached/deduplicated API calls
      // These calls will be deduplicated if DashboardPage or other components already loaded the data

      // Sort by creation date (newest first) and limit to 50
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50)

      dispatch({ 
        type: 'SET_NOTIFICATIONS', 
        payload: { 
          notifications: sortedNotifications, 
          totalCount: sortedNotifications.length 
        } 
      })
    } catch (error) {
      logger.error('Error generating event-based notifications:', error)
    }
  }, [dispatch])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }, [dispatch])

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    // Optimistic update
    const notification = state.notifications.find(n => n.id === id)
    dispatch({ type: 'MARK_AS_READ', payload: id })
    
    // Only call API for valid MongoDB ObjectIds (not custom notif-* IDs)
    if (isValidObjectId(id)) {
      try {
        // Also update on backend if API available
        await notificationsAPI.markAsRead(id)
        // Refetch to ensure sync
        await fetchNotifications()
      } catch (error) {
        // Rollback on error
        if (notification) {
          dispatch({ type: 'MARK_AS_READ', payload: { id, read: false } })
        }
        // Error will be handled by global error handler or silently if 404
        if (error?.response?.status !== 404) {
          logger.error('Failed to mark notification as read:', error)
        }
      }
    }
    // For custom IDs (notif-*), the optimistic update is sufficient
  }, [state.notifications, fetchNotifications, dispatch])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    // Store previous state for rollback
    const previousNotifications = [...state.notifications]
    dispatch({ type: 'MARK_ALL_AS_READ' })
    
    try {
      // Also update on backend if API available
      await notificationsAPI.markAllAsRead()
      // Refetch to ensure sync
      await fetchNotifications()
    } catch (error) {
      // Rollback on error
      dispatch({ type: 'SET_NOTIFICATIONS', payload: previousNotifications })
      // Error will be handled by global error handler or silently if 404
      if (error?.response?.status !== 404) {
        logger.error('Failed to mark all notifications as read:', error)
      }
    }
  }, [state.notifications, fetchNotifications, dispatch])

  // Dismiss notification
  const dismissNotification = useCallback(async (id) => {
    // Store previous state for rollback
    const notification = state.notifications.find(n => n.id === id)
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })
    
    // Only call API for valid MongoDB ObjectIds (not custom notif-* IDs)
    if (isValidObjectId(id)) {
      try {
        // Also update on backend if API available
        await notificationsAPI.dismiss(id)
        // Refetch to ensure sync
        await fetchNotifications()
      } catch (error) {
        // Rollback on error - add notification back
        if (notification) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        }
        // Error will be handled by global error handler or silently if 404
        if (error?.response?.status !== 404) {
          logger.error('Failed to dismiss notification:', error)
        }
      }
    }
    // For custom IDs (notif-*), the optimistic update is sufficient
  }, [state.notifications, fetchNotifications, dispatch])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    dispatch({ type: 'CLEAR_ALL' })
    
    try {
      // Also update on backend if API available
      await notificationsAPI.clearAll()
      // Refetch to ensure sync
      await fetchNotifications()
    } catch (error) {
      // Error will be handled by global error handler or silently if 404
      if (error?.response?.status !== 404) {
        logger.error('Failed to clear all notifications:', error)
      }
    }
  }, [fetchNotifications, dispatch])

  // Undo last action
  const undoLastAction = useCallback(() => {
    dispatch({ type: 'UNDO_LAST_ACTION' })
  }, [dispatch])

  // Start polling as fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return // Already polling
    }

    const pollInterval = 3 * 60 * 1000 // 3 minutes
    const poll = () => {
      fetchNotifications()
    }

    // Initial poll
    poll()
    
    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, pollInterval)
    logger.debug('Started polling for notifications (fallback mode)')
  }, [fetchNotifications])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      logger.debug('Stopped polling for notifications')
    }
    if (userActivityTimeoutRef.current) {
      clearTimeout(userActivityTimeoutRef.current)
      userActivityTimeoutRef.current = null
    }
  }, [])

  // Set up SSE connection or polling fallback when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear notifications when logged out
      dispatch({ type: 'SET_NOTIFICATIONS', payload: { notifications: [], totalCount: 0 } })
      if (sseConnectionRef.current) {
        sseConnectionRef.current()
        sseConnectionRef.current = null
      }
      stopPolling()
      return
    }

    // Try SSE first, fallback to polling if it fails
    const trySSE = () => {
      // Skip SSE if we've already determined it doesn't work
      if (sseFailedRef.current) {
        logger.debug('SSE previously failed, using polling fallback')
        startPolling()
        return
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const sseUrl = `${baseURL}/api/notifications/stream`
        
        // Get auth token using centralized token storage utility
        const { token } = getStoredAccessToken()
        
        logger.debug('Attempting SSE connection for notifications')
        
        const cancelFn = createSSEConnection(sseUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          onMessage: (data) => {
            // Handle different event types
            const eventType = data.event || data.type
            
            if (eventType === 'notification') {
              // Single notification received (from notificationEmitter)
              // Data is already the notification object
              const notification = data
              const formattedNotification = {
                id: notification.id || notification._id,
                type: notification.type || 'info',
                title: notification.title,
                message: notification.message,
                timestamp: formatRelativeTime(notification.createdAt || notification.timestamp),
                createdAt: notification.createdAt || notification.timestamp,
                read: notification.read || false,
                metadata: notification.metadata || {},
              }
              
              dispatch({ type: 'ADD_NOTIFICATION', payload: formattedNotification })
            } else if (eventType === 'initial') {
              // Initial batch of notifications
              const notifications = data.notifications || []
              const formattedNotifications = notifications.map(notif => ({
                id: notif._id || notif.id,
                type: notif.type || 'info',
                title: notif.title,
                message: notif.message,
                timestamp: formatRelativeTime(notif.createdAt || notif.timestamp),
                createdAt: notif.createdAt || notif.timestamp,
                read: notif.read || false,
                metadata: notif.metadata || {},
              }))
              
              dispatch({ 
                type: 'SET_NOTIFICATIONS', 
                payload: { 
                  notifications: formattedNotifications, 
                  totalCount: data.count || formattedNotifications.length 
                } 
              })
            } else if (eventType === 'connected') {
              logger.debug('SSE notification stream connected')
              // Stop polling since SSE is working
              stopPolling()
              sseFailedRef.current = false // Reset failure flag
            }
          },
          onComplete: () => {
            logger.debug('SSE notification stream completed')
            // Restart connection or fallback to polling
            sseConnectionRef.current = null
            setTimeout(() => {
              if (isAuthenticated) {
                trySSE()
              }
            }, 5000) // Retry after 5 seconds
          },
          onError: (error) => {
            logger.warn('SSE notification stream error, falling back to polling:', error.message)
            sseFailedRef.current = true
            sseConnectionRef.current = null
            
            // Fallback to polling
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
    }

    // Initial fetch
    fetchNotifications()

    // Try SSE connection
    trySSE()

    return () => {
      if (sseConnectionRef.current) {
        sseConnectionRef.current()
        sseConnectionRef.current = null
      }
      stopPolling()
    }
  }, [isAuthenticated, fetchNotifications, dispatch, startPolling, stopPolling])

  return {
    state,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    undoLastAction,
  }
}

