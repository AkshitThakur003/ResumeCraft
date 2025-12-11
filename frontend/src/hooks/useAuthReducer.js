import { useReducer } from 'react'
import { getStoredAccessToken } from '../utils/tokenStorage'

// Action types
export const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_REMEMBER_ME: 'SET_REMEMBER_ME',
  SET_SESSION_EXPIRY: 'SET_SESSION_EXPIRY',
}

const storedTokenInfo = getStoredAccessToken()

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  rememberMe: storedTokenInfo.rememberMe,
  sessionExpiresAt: storedTokenInfo.expiresAt,
}

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        rememberMe: state.rememberMe,
        sessionExpiresAt: null,
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload, // Replace entire user object to ensure nested objects are updated
      }

    case AUTH_ACTIONS.SET_REMEMBER_ME:
      return {
        ...state,
        rememberMe: action.payload,
      }

    case AUTH_ACTIONS.SET_SESSION_EXPIRY:
      return {
        ...state,
        sessionExpiresAt: action.payload,
      }
    
    default:
      return state
  }
}

/**
 * Hook to use auth reducer
 */
export const useAuthReducer = () => {
  return useReducer(authReducer, initialState)
}

