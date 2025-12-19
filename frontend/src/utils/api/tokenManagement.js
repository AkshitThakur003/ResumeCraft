/**
 * Token Management Module
 * Re-exports token storage utilities from tokenStorage.js
 * Provides API-specific wrappers when needed
 * @module api/tokenManagement
 */

import { getStoredAccessToken as getStoredAccessTokenFull } from '../tokenStorage'

// Re-export constants and functions from tokenStorage
export {
  decodeTokenExpiry,
  clearStoredToken as clearStoredAccessToken,
  storeAccessToken,
  setRememberPreference,
} from '../tokenStorage'

// Re-export constants
export const ACCESS_TOKEN_KEY = 'accessToken'
export const ACCESS_TOKEN_EXP_KEY = 'accessTokenExpiresAt'
export const REMEMBER_ME_KEY = 'rememberMe'
export const TOKEN_REFRESHED_EVENT = 'tokenRefreshed'

/**
 * Gets stored access token (returns just the token string, not the full object)
 * This is a wrapper for API client usage that only needs the token string
 * @returns {string|null} Access token or null if not found
 */
export const getStoredAccessToken = () => {
  const result = getStoredAccessTokenFull()
  return result?.token || null
}

