import React, { createContext, useContext, useMemo, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { logger } from '../utils/logger'

const NotificationsContext = createContext(null)

export const NotificationsProvider = ({ children }) => {
  const notifications = useNotifications()

  // Listen for unified notification service events
  useEffect(() => {
    const handleAddNotification = (event) => {
      const { type, title, message, metadata, priority, createdAt } = event.detail || {}
      if (title || message) {
        notifications.addNotification({
          id: `notif-${Date.now()}-${Math.random()}`,
          type: type || 'info',
          title: title || message,
          message: message || title,
          createdAt: createdAt || new Date().toISOString(),
          read: false,
          metadata: metadata || {}
        })
      }
    }

    window.addEventListener('addNotification', handleAddNotification)

    return () => {
      window.removeEventListener('addNotification', handleAddNotification)
    }
  }, [notifications.addNotification])

  const value = useMemo(
    () => ({
      state: notifications.state,
      notifications: notifications.state.notifications,
      isLoading: notifications.state.isLoading,
      unreadCount: notifications.state.notifications.filter(n => !n.read).length,
      totalCount: notifications.state.totalCount,
      hasUndo: notifications.state.undoStack.length > 0,
      fetchNotifications: notifications.fetchNotifications,
      addNotification: notifications.addNotification,
      markAsRead: notifications.markAsRead,
      markAllAsRead: notifications.markAllAsRead,
      dismissNotification: notifications.dismissNotification,
      clearAll: notifications.clearAll,
      undoLastAction: notifications.undoLastAction,
    }),
    [notifications]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    // Return a safe default instead of throwing, to handle cases where provider isn't available yet
    logger.warn('useNotificationsContext called outside NotificationsProvider, returning default values')
    return {
      notifications: [],
      isLoading: false,
      unreadCount: 0,
      totalCount: 0,
      hasUndo: false,
      fetchNotifications: async () => {},
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      dismissNotification: () => {},
      clearAll: () => {},
      undoLastAction: () => {},
    }
  }
  return context
}

