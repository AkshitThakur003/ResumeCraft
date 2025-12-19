/**
 * Token Storage Utilities
 * Handles storing and retrieving access tokens from localStorage/sessionStorage
 */

import { logger } from './logger'

const ACCESS_TOKEN_KEY = 'accessToken'
const ACCESS_TOKEN_EXP_KEY = 'accessTokenExpiresAt'
const REMEMBER_ME_KEY = 'rememberMe'

const isBrowser = typeof window !== 'undefined'

/**
 * Decode JWT token to get expiry timestamp
 */
export const decodeTokenExpiry = (token) => {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload?.exp) {
      return payload.exp * 1000
    }
  } catch (error) {
    logger.warn('Failed to decode JWT expiry:', error)
  }
  return null
}

/**
 * Set remember me preference
 */
export const setRememberPreference = (remember) => {
  if (!isBrowser) return
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false')
}

/**
 * Clear stored tokens
 */
export const clearStoredToken = () => {
  if (!isBrowser) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
}

/**
 * Store access token in appropriate storage
 * @param {string} token - JWT access token
 * @param {number|null} expiresAt - Optional expiration timestamp (auto-detected if not provided)
 * @param {boolean|null} remember - Optional remember preference (uses existing preference if not provided)
 */
export const storeAccessToken = (token, expiresAt = null, remember = null) => {
  if (!isBrowser || !token) return

  // Auto-detect expiresAt from token if not provided
  if (expiresAt === null) {
    expiresAt = decodeTokenExpiry(token)
  }

  // Use existing remember preference if not provided
  if (remember === null) {
    const rememberPreference = localStorage.getItem(REMEMBER_ME_KEY)
    remember = rememberPreference === null ? true : rememberPreference === 'true'
  }

  const expString = expiresAt ? String(expiresAt) : ''

  if (remember) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
    if (expiresAt) {
      localStorage.setItem(ACCESS_TOKEN_EXP_KEY, expString)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
    }
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
    if (expiresAt) {
      sessionStorage.setItem(ACCESS_TOKEN_EXP_KEY, expString)
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_EXP_KEY)
  }

  setRememberPreference(remember)

  // Dispatch token refreshed event for API module compatibility
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokenRefreshed', {
      detail: { accessToken: token, expiresAt },
    }))
  }
}

/**
 * Get stored access token
 */
export const getStoredAccessToken = () => {
  if (!isBrowser) {
    return { token: null, expiresAt: null, rememberMe: true }
  }

  const rememberPreference = localStorage.getItem(REMEMBER_ME_KEY)
  const rememberMe = rememberPreference === null ? true : rememberPreference === 'true'

  const localToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (localToken) {
    const expiresAt = parseInt(localStorage.getItem(ACCESS_TOKEN_EXP_KEY) || '', 10)
    return {
      token: localToken,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
      rememberMe: true,
    }
  }

  const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  if (sessionToken) {
    const expiresAt = parseInt(sessionStorage.getItem(ACCESS_TOKEN_EXP_KEY) || '', 10)
    return {
      token: sessionToken,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
      rememberMe: false,
    }
  }

  return { token: null, expiresAt: null, rememberMe }
}

