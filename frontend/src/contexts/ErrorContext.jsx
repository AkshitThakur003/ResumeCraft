import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { useGlobalToast } from './ToastContext'

const ErrorContext = createContext(null)

const initialState = {
  errors: [],
  isRetrying: false,
  retryQueue: [],
}

const errorReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ERROR': {
      const error = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      }
      return {
        ...state,
        errors: [error, ...state.errors].slice(0, 50), // Keep last 50 errors
      }
    }
    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter((e) => e.id !== action.payload),
      }
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      }
    case 'ADD_TO_RETRY_QUEUE': {
      // Replace existing item if it exists, otherwise add new one
      const existingIndex = state.retryQueue.findIndex((item) => item.id === action.payload.id)
      const newQueue = [...state.retryQueue]
      if (existingIndex >= 0) {
        newQueue[existingIndex] = action.payload
      } else {
        newQueue.push(action.payload)
      }
      return {
        ...state,
        retryQueue: newQueue,
      }
    }
    case 'REMOVE_FROM_RETRY_QUEUE':
      return {
        ...state,
        retryQueue: state.retryQueue.filter((item) => item.id !== action.payload),
      }
    case 'SET_RETRYING':
      return {
        ...state,
        isRetrying: action.payload,
      }
    default:
      return state
  }
}

export const ErrorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState)
  const { addToast } = useGlobalToast()

  const addError = useCallback((error, options = {}) => {
    const {
      showToast = true,
      retryable = false,
      retryFn = null,
      severity = 'error',
      userMessage = null,
    } = options

    const errorObj = {
      message: error.message || 'An error occurred',
      status: error.status || 0,
      originalError: error,
      retryable,
      retryFn,
      severity,
      userMessage: userMessage || error.message || 'An error occurred',
    }

    dispatch({ type: 'ADD_ERROR', payload: errorObj })

    if (showToast) {
      addToast(errorObj.userMessage, severity === 'error' ? 'error' : 'warning', 5000)
    }

    // Add to retry queue if retryable
    if (retryable && retryFn) {
      dispatch({
        type: 'ADD_TO_RETRY_QUEUE',
        payload: {
          id: errorObj.id,
          retryFn,
          error: errorObj,
          attempts: 0,
          maxAttempts: 3,
        },
      })
    }

    return errorObj.id
  }, [addToast])

  const removeError = useCallback((errorId) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorId })
  }, [])

  const clearErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_ERRORS' })
  }, [])

  const retryRequest = useCallback(async (errorId) => {
    const error = state.errors.find((e) => e.id === errorId)
    const retryItem = state.retryQueue.find((item) => item.id === errorId)

    if (!error || !error.retryable || !error.retryFn) {
      return { success: false, message: 'Error cannot be retried' }
    }

    try {
      dispatch({ type: 'SET_RETRYING', payload: true })
      
      const result = await error.retryFn()
      
      // Remove from queue and errors on success
      dispatch({ type: 'REMOVE_ERROR', payload: errorId })
      dispatch({ type: 'REMOVE_FROM_RETRY_QUEUE', payload: errorId })
      dispatch({ type: 'SET_RETRYING', payload: false })
      
      addToast('Request retried successfully', 'success', 3000)
      return { success: true, data: result }
    } catch (retryError) {
      const updatedRetryItem = {
        ...retryItem,
        attempts: (retryItem?.attempts || 0) + 1,
      }

      if (updatedRetryItem.attempts >= updatedRetryItem.maxAttempts) {
        // Remove from retry queue after max attempts
        dispatch({ type: 'REMOVE_FROM_RETRY_QUEUE', payload: errorId })
        addToast('Failed after multiple retry attempts', 'error', 5000)
      } else {
        // Update retry item with new attempt count
        const retryItem = state.retryQueue.find((item) => item.id === errorId)
        dispatch({
          type: 'ADD_TO_RETRY_QUEUE',
          payload: { 
            id: errorId,
            retryFn: retryItem?.retryFn || error.retryFn,
            error: error,
            ...updatedRetryItem,
          },
        })
        addToast(`Retry failed. ${updatedRetryItem.maxAttempts - updatedRetryItem.attempts} attempts remaining.`, 'warning', 4000)
      }

      dispatch({ type: 'SET_RETRYING', payload: false })
      return { success: false, error: retryError }
    }
  }, [state.errors, state.retryQueue, addToast])

  const value = useMemo(
    () => ({
      errors: state.errors,
      retryQueue: state.retryQueue,
      isRetrying: state.isRetrying,
      addError,
      removeError,
      clearErrors,
      retryRequest,
    }),
    [state.errors, state.retryQueue, state.isRetrying, addError, removeError, clearErrors, retryRequest]
  )

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
}

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

