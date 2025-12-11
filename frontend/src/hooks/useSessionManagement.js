import { useEffect, useRef } from 'react'
import { decodeTokenExpiry, getStoredAccessToken } from '../utils/tokenStorage'
import { AUTH_ACTIONS } from './useAuthReducer'

const ACCESS_TOKEN_KEY = 'accessToken'
const SESSION_WARNING_EVENT = 'sessionExpiring'
const SESSION_EXPIRED_EVENT = 'sessionExpired'
const TOKEN_REFRESHED_EVENT = 'tokenRefreshed'
const SESSION_WARNING_OFFSET_MS = 2 * 60 * 1000

/**
 * Hook for managing session expiry and warnings
 */
export const useSessionManagement = (state, dispatch, logout) => {
  const warningTimeoutRef = useRef(null)
  const expirationTimeoutRef = useRef(null)
  const warningShownRef = useRef(false)

  // Sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === ACCESS_TOKEN_KEY && !e.newValue) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT })
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [dispatch])

  // Handle token refresh events
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const refreshedToken = event.detail?.accessToken
      const providedExpiry = event.detail?.expiresAt
      const tokenInfo = getStoredAccessToken()
      const activeToken = refreshedToken || tokenInfo.token

      if (!activeToken) {
        return
      }

      const rememberPreference = tokenInfo.rememberMe
      const expiry = providedExpiry || tokenInfo.expiresAt || decodeTokenExpiry(activeToken)

      dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: rememberPreference })
      dispatch({ type: AUTH_ACTIONS.SET_SESSION_EXPIRY, payload: expiry })
    }

    window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefreshed)
    return () => window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefreshed)
  }, [dispatch])

  // Manage session expiry warnings and auto-logout
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiresAt) {
      warningShownRef.current = false
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = null
      }
      if (expirationTimeoutRef.current) {
        clearTimeout(expirationTimeoutRef.current)
        expirationTimeoutRef.current = null
      }
      return
    }

    const now = Date.now()
    const timeUntilExpiry = state.sessionExpiresAt - now

    if (timeUntilExpiry <= 0) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { expiresAt: state.sessionExpiresAt }
      }))
      logout()
      return
    }

    warningShownRef.current = false

    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    if (expirationTimeoutRef.current) clearTimeout(expirationTimeoutRef.current)

    const warningDelay = Math.max(timeUntilExpiry - SESSION_WARNING_OFFSET_MS, 0)

    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true
        window.dispatchEvent(new CustomEvent(SESSION_WARNING_EVENT, {
          detail: { expiresAt: state.sessionExpiresAt }
        }))
      }
    }, warningDelay)

    expirationTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
        detail: { expiresAt: state.sessionExpiresAt }
      }))
      logout()
    }, timeUntilExpiry)

    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (expirationTimeoutRef.current) clearTimeout(expirationTimeoutRef.current)
    }
  }, [state.isAuthenticated, state.sessionExpiresAt, logout])
}

