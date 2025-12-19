/**
 * Main Notifications Hook
 * Orchestrates notification management with API, SSE, and polling
 */

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotificationsReducer } from './useNotificationsReducer'
import { useNotificationAPI } from './notifications/useNotificationAPI'
import { useNotificationPolling } from './notifications/useNotificationPolling'
import { useNotificationSSE } from './notifications/useNotificationSSE'

export const useNotifications = () => {
  // Safely get auth context
  let isAuthenticated = false
  try {
    const auth = useAuth()
    isAuthenticated = auth?.isAuthenticated || false
  } catch (error) {
    isAuthenticated = false
  }
  
  const { state, dispatch } = useNotificationsReducer()
  
  // Initialize hooks
  const { fetchNotifications, markAsRead: apiMarkAsRead, markAllAsRead: apiMarkAllAsRead, dismissNotification: apiDismissNotification, clearAll: apiClearAll } = useNotificationAPI({ dispatch, isAuthenticated })
  const { startPolling, stopPolling } = useNotificationPolling(fetchNotifications)
  const { setupSSE, cleanupSSE } = useNotificationSSE({ dispatch, isAuthenticated, stopPolling, startPolling })

  // Add a new notification
  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  // Mark notification as read
  const markAsRead = async (id) => {
    const notification = state.notifications.find(n => n.id === id)
    await apiMarkAsRead(id, notification, fetchNotifications)
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const previousNotifications = [...state.notifications]
    await apiMarkAllAsRead(previousNotifications, fetchNotifications)
  }

  // Dismiss notification
  const dismissNotification = async (id) => {
    const notification = state.notifications.find(n => n.id === id)
    await apiDismissNotification(id, notification, fetchNotifications)
  }

  // Clear all notifications
  const clearAll = async () => {
    await apiClearAll(fetchNotifications)
  }

  // Undo last action
  const undoLastAction = () => {
    dispatch({ type: 'UNDO_LAST_ACTION' })
  }

  // Set up SSE connection or polling fallback when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear notifications when logged out
      dispatch({ type: 'SET_NOTIFICATIONS', payload: { notifications: [], totalCount: 0 } })
      cleanupSSE()
      stopPolling()
      return
    }

    // Initial fetch
    fetchNotifications()

    // Try SSE connection
    setupSSE()

    return () => {
      cleanupSSE()
      stopPolling()
    }
  }, [isAuthenticated, fetchNotifications, dispatch, setupSSE, cleanupSSE, stopPolling])

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
