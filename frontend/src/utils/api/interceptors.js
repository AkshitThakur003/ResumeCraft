/**
 * Response Interceptors Module
 * Handles token refresh, rate limiting, and error responses
 * @module api/interceptors
 */

import axios from 'axios'
import api from './client'
import { storeAccessToken, clearStoredAccessToken } from './tokenManagement'

/**
 * Promise for in-flight token refresh request to prevent duplicate refresh calls
 * @type {Promise<string>|null}
 */
let pendingRefreshRequest = null

/**
 * Sets up response interceptors for the API client
 * Handles:
 * - Automatic token refresh on 401 errors
 * - Rate limiting detection and event dispatch
 * - Notification endpoint 404 suppression
 */
export const setupInterceptors = () => {
  api.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // Suppress 404 errors for notifications endpoint (expected - endpoint may not exist)
      const isNotifications404 = error.response?.status === 404 && 
                                  originalRequest?.url?.includes('/notifications')
      
      if (isNotifications404) {
        // Return resolved promise with empty data to prevent error propagation
        // The catch handler in notificationsAPI will handle this
        return Promise.reject(error) // Still reject but suppress console error
      }

      // Check for rate limiting errors
      const errorMsg = typeof error.response?.data?.error === 'string' ? error.response.data.error : ''
      const messageMsg = typeof error.response?.data?.message === 'string' ? error.response.data.message : ''
      const isRateLimit = error.response?.status === 429 || 
                         errorMsg.includes('rate limit') ||
                         messageMsg.includes('Too many requests')
      
      if (isRateLimit) {
        // Dispatch custom event for global rate limiting notification
        window.dispatchEvent(new CustomEvent('rateLimit', {
          detail: { error }
        }))
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Use existing refresh request if one is in flight to prevent duplicate calls
          if (!pendingRefreshRequest) {
            pendingRefreshRequest = axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
              {},
              { withCredentials: true }
            ).then(response => {
              const { accessToken } = response.data.data
              storeAccessToken(accessToken)
              return accessToken
            }).catch(refreshError => {
              // Clear pending request on error
              pendingRefreshRequest = null
              throw refreshError
            })
          }

          const accessToken = await pendingRefreshRequest
          // Clear pending request after successful refresh
          pendingRefreshRequest = null

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          // Clear pending request on error
          pendingRefreshRequest = null
          // Refresh failed, redirect to login
          clearStoredAccessToken()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )
}

// Setup interceptors immediately
setupInterceptors()

