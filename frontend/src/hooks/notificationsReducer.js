// Notification ID generator
let notificationIdCounter = 1
export const generateNotificationId = () => {
  return `notif-${Date.now()}-${notificationIdCounter++}`
}

export const initialState = {
  notifications: [],
  isLoading: false,
  lastFetched: null,
  totalCount: 0,
  undoStack: [], // Store last action for undo
  maxUndoStackSize: 5,
}

export function notificationsReducer(state, action) {
  switch (action.type) {
    case 'SET_NOTIFICATIONS': {
      return { 
        ...state, 
        notifications: action.payload.notifications || action.payload,
        totalCount: action.payload.totalCount || (Array.isArray(action.payload) ? action.payload.length : 0),
        lastFetched: new Date() 
      }
    }
    case 'APPEND_NOTIFICATIONS': {
      const existingIds = new Set(state.notifications.map(n => n.id))
      const newNotifications = (action.payload.notifications || action.payload).filter(
        n => !existingIds.has(n.id)
      )
      return {
        ...state,
        notifications: [...state.notifications, ...newNotifications],
        totalCount: action.payload.totalCount || state.totalCount,
      }
    }
    case 'ADD_NOTIFICATION': {
      const newNotification = {
        ...action.payload,
        id: action.payload.id || generateNotificationId(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
        read: false,
      }
      // Add to beginning of array
      return { 
        ...state, 
        notifications: [newNotification, ...state.notifications],
        totalCount: state.totalCount + 1,
      }
    }
    case 'MARK_AS_READ': {
      // Handle both simple id string and rollback object { id, read: false }
      const payload = typeof action.payload === 'string' 
        ? { id: action.payload, read: true }
        : action.payload
      
      const notification = state.notifications.find(n => n.id === payload.id)
      const undoAction = notification && !notification.read ? {
        type: 'MARK_AS_READ',
        payload: { id: payload.id, read: false },
        timestamp: Date.now(),
      } : null

      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === payload.id ? { ...notif, read: payload.read !== false } : notif
        ),
        undoStack: undoAction ? [
          undoAction,
          ...state.undoStack.slice(0, state.maxUndoStackSize - 1)
        ] : state.undoStack,
      }
    }
    case 'MARK_ALL_AS_READ': {
      const unreadNotifications = state.notifications.filter(n => !n.read)
      const undoAction = unreadNotifications.length > 0 ? {
        type: 'MARK_ALL_AS_READ',
        payload: { notificationIds: unreadNotifications.map(n => n.id) },
        timestamp: Date.now(),
      } : null

      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, read: true })),
        undoStack: undoAction ? [
          undoAction,
          ...state.undoStack.slice(0, state.maxUndoStackSize - 1)
        ] : state.undoStack,
      }
    }
    case 'DISMISS_NOTIFICATION': {
      const notification = state.notifications.find(n => n.id === action.payload)
      const undoAction = notification ? {
        type: 'ADD_NOTIFICATION',
        payload: notification,
        timestamp: Date.now(),
      } : null

      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
        totalCount: Math.max(0, state.totalCount - 1),
        undoStack: undoAction ? [
          undoAction,
          ...state.undoStack.slice(0, state.maxUndoStackSize - 1)
        ] : state.undoStack,
      }
    }
    case 'CLEAR_ALL': {
      const undoAction = state.notifications.length > 0 ? {
        type: 'SET_NOTIFICATIONS',
        payload: { notifications: state.notifications, totalCount: state.totalCount },
        timestamp: Date.now(),
      } : null

      return {
        ...state,
        notifications: [],
        totalCount: 0,
        undoStack: undoAction ? [
          undoAction,
          ...state.undoStack.slice(0, state.maxUndoStackSize - 1)
        ] : state.undoStack,
      }
    }
    case 'UNDO_LAST_ACTION': {
      if (state.undoStack.length === 0) return state
      
      const lastAction = state.undoStack[0]
      const newUndoStack = state.undoStack.slice(1)

      // Apply undo based on action type
      let newState = { ...state, undoStack: newUndoStack }
      
      if (lastAction.type === 'MARK_AS_READ') {
        newState.notifications = newState.notifications.map(notif =>
          notif.id === lastAction.payload.id 
            ? { ...notif, read: lastAction.payload.read }
            : notif
        )
      } else if (lastAction.type === 'MARK_ALL_AS_READ') {
        const idsToUnread = new Set(lastAction.payload.notificationIds || [])
        newState.notifications = newState.notifications.map(notif =>
          idsToUnread.has(notif.id) ? { ...notif, read: false } : notif
        )
      } else if (lastAction.type === 'ADD_NOTIFICATION') {
        const existingIds = new Set(newState.notifications.map(n => n.id))
        if (!existingIds.has(lastAction.payload.id)) {
          newState.notifications = [lastAction.payload, ...newState.notifications]
          newState.totalCount = newState.totalCount + 1
        }
      } else if (lastAction.type === 'SET_NOTIFICATIONS') {
        newState.notifications = lastAction.payload.notifications || []
        newState.totalCount = lastAction.payload.totalCount || 0
      }

      return newState
    }
    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload }
    }
    case 'SET_TOTAL_COUNT': {
      return { ...state, totalCount: action.payload }
    }
    default:
      return state
  }
}

