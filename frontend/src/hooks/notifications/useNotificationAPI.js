/**
 * Hook for notification API operations
 * Handles fetching, marking as read, dismissing notifications
 */

import { useCallback } from 'react'
import { notificationsAPI } from '../../utils/api'
import { formatNotifications, checkEndpointExists, markEndpointAsMissing } from './notificationUtils'
import { logger } from '../../utils/logger'
import { isValidObjectId } from '../../utils'

export const useNotificationAPI = ({ dispatch, isAuthenticated }) => {
  /**
   * Fetch notifications from API or generate from events
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) return

    const { skip = 0, limit = 50, append = false } = options

    try {
      if (!append) {
        dispatch({ type: 'SET_LOADING', payload: true })
      }
      
      // Skip API call if we've determined the endpoint doesn't exist
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
            const formattedNotifications = formatNotifications(apiNotifications)
            
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
          // API not available (404 is expected) - silently continue
          if (apiError?.response?.status === 404) {
            markEndpointAsMissing()
          } else if (apiError?.response?.status !== 404) {
            logger.debug('Notifications API error:', apiError.message)
          }
        }
      }
      
    } catch (error) {
      logger.error('Failed to fetch notifications:', error)
    } finally {
      if (!append) {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
  }, [isAuthenticated, dispatch])

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (id, notification, fetchNotifications) => {
    // Optimistic update
    dispatch({ type: 'MARK_AS_READ', payload: id })
    
    // Only call API for valid MongoDB ObjectIds
    if (isValidObjectId(id)) {
      try {
        await notificationsAPI.markAsRead(id)
        await fetchNotifications()
      } catch (error) {
        // Rollback on error
        if (notification) {
          dispatch({ type: 'MARK_AS_READ', payload: { id, read: false } })
        }
        if (error?.response?.status !== 404) {
          logger.error('Failed to mark notification as read:', error)
        }
      }
    }
  }, [dispatch])

  /**
   * Mark all as read
   */
  const markAllAsRead = useCallback(async (previousNotifications, fetchNotifications) => {
    dispatch({ type: 'MARK_ALL_AS_READ' })
    
    try {
      await notificationsAPI.markAllAsRead()
      await fetchNotifications()
    } catch (error) {
      // Rollback on error
      dispatch({ type: 'SET_NOTIFICATIONS', payload: previousNotifications })
      if (error?.response?.status !== 404) {
        logger.error('Failed to mark all notifications as read:', error)
      }
    }
  }, [dispatch])

  /**
   * Dismiss notification
   */
  const dismissNotification = useCallback(async (id, notification, fetchNotifications) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id })
    
    // Only call API for valid MongoDB ObjectIds
    if (isValidObjectId(id)) {
      try {
        await notificationsAPI.dismiss(id)
        await fetchNotifications()
      } catch (error) {
        // Rollback on error
        if (notification) {
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        }
        if (error?.response?.status !== 404) {
          logger.error('Failed to dismiss notification:', error)
        }
      }
    }
  }, [dispatch])

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async (fetchNotifications) => {
    dispatch({ type: 'CLEAR_ALL' })
    
    try {
      await notificationsAPI.clearAll()
      await fetchNotifications()
    } catch (error) {
      if (error?.response?.status !== 404) {
        logger.error('Failed to clear all notifications:', error)
      }
    }
  }, [dispatch])

  return {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
  }
}

