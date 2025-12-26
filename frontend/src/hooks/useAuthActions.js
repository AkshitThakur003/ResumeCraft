import { useCallback, useMemo } from 'react'
import { authAPI, userAPI, handleApiError } from '../utils/api'
import { decodeTokenExpiry, storeAccessToken, clearStoredToken, getStoredAccessToken, setRememberPreference } from '../utils/tokenStorage'
import { AUTH_ACTIONS } from './useAuthReducer'
import { logger } from '../utils/logger'

/**
 * Hook for authentication actions
 */
export const useAuthActions = (state, dispatch) => {
  const handleAuthSuccess = async (user, accessToken, rememberPreference = state.rememberMe) => {
    const expiresAt = decodeTokenExpiry(accessToken) || Date.now() + 15 * 60 * 1000
    const remember = rememberPreference ?? true

    storeAccessToken(accessToken, expiresAt, remember)

    dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: remember })
    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: { user },
    })
    dispatch({ type: AUTH_ACTIONS.SET_SESSION_EXPIRY, payload: expiresAt })

    // Auto-update profile with name and email from OAuth/login
    try {
      if (user && (user.firstName || user.lastName)) {
        const updateData = {}
        
        if (user.firstName && user.firstName.trim()) {
          updateData.firstName = user.firstName.trim()
        }
        
        if (user.lastName && user.lastName.trim()) {
          updateData.lastName = user.lastName.trim()
        }

        if (Object.keys(updateData).length > 0) {
          await userAPI.updateProfile(updateData).catch(err => {
            logger.debug('Auto-profile update skipped:', err)
          })
        }
      }
    } catch (error) {
      logger.debug('Auto-profile update error:', error)
    }

    return expiresAt
  }

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      logger.error('Logout error:', error)
    } finally {
      clearStoredToken()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }, [dispatch])

  const checkAuth = async () => {
    try {
      const { token, expiresAt, rememberMe } = getStoredAccessToken()

      // ✅ Optimize: If no token exists, we know user is not authenticated
      // Set loading to false immediately without making API call
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: rememberMe })
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      // We have a token, might be authenticated - set loading true
      // This only happens when there's a token, so we're likely authenticated
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })

      if (state.rememberMe !== rememberMe) {
        dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: rememberMe })
      }

      const response = await authAPI.getMe()
      const user = response.data.data.user || response.data.data
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: user,
      })

      const derivedExpiry = expiresAt || decodeTokenExpiry(token)
      dispatch({ type: AUTH_ACTIONS.SET_SESSION_EXPIRY, payload: derivedExpiry })
      storeAccessToken(token, derivedExpiry, rememberMe)
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    } catch (error) {
      logger.error('Auth check failed:', error)
      clearStoredToken()
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const { rememberMe: rememberPreference = state.rememberMe, ...authCredentials } = credentials

      dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: rememberPreference })
      setRememberPreference(rememberPreference)

      const response = await authAPI.login(authCredentials)
      const { user, accessToken } = response.data.data

      await handleAuthSuccess(user, accessToken, rememberPreference)

      return { success: true, user }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      return {
        success: false,
        error: errorDetails.message,
        status: errorDetails.status,
        requiresVerification: errorDetails.data?.requiresVerification,
        email: errorDetails.data?.email,
      }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await authAPI.register(userData)
      const { user, requiresVerification } = response.data.data

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })

      return {
        success: true,
        user,
        requiresVerification,
        message: response.data.message,
      }
    } catch (error) {
      const errorDetails = handleApiError(error)
      // Extract validation errors if present
      // Backend returns errors as array of objects: [{ field: 'password', message: '...' }]
      const validationErrors = errorDetails.errors || []
      const errorMessage = validationErrors.length > 0 
        ? validationErrors.map(err => typeof err === 'string' ? err : err.message || err.msg).join(', ')
        : errorDetails.message
      
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      return { 
        success: false, 
        error: errorMessage,
        errors: validationErrors,
        status: errorDetails.status,
      }
    }
  }

  const verifyEmail = async (token) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await authAPI.verifyEmail(token)
      const { user, accessToken } = response.data.data

      await handleAuthSuccess(user, accessToken)

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })

      return { success: true, user }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      return { success: false, error: errorDetails.message }
    }
  }

  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification(email)
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { success: false, error: errorDetails.message }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email)
      return {
        success: true,
        message: response.data?.message || 'If an account exists for this email, a password reset link has been sent.',
      }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { success: false, error: errorDetails.message }
    }
  }

  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await authAPI.resetPassword(token, password)
      const { user, accessToken } = response.data.data

      handleAuthSuccess(user, accessToken)
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })

      return { success: true, user, message: response.data?.message }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      return { success: false, error: errorDetails.message }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      const response = await userAPI.updateProfile(profileData)
      
      const updatedUser = response?.data?.data?.user || profileData

      try {
        const profileResponse = await userAPI.getProfile()
        const fullUser = profileResponse?.data?.data?.user || updatedUser
        
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: fullUser,
        })

        return { success: true, user: fullUser }
      } catch (profileError) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: updatedUser,
        })
        return { success: true, user: updatedUser }
      }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      return { success: false, error: errorDetails.message }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      await authAPI.changePassword(passwordData)
      return { success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      return { success: false, error: errorDetails.message }
    }
  }

  const deleteAccount = async (password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      await authAPI.deleteAccount({ password })
      
      clearStoredToken()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })

      return { success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorDetails.message,
      })
      return { success: false, error: errorDetails.message }
    }
  }

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  const setRememberMe = (remember) => {
    setRememberPreference(remember)
    dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: remember })

    const existingTokenInfo = getStoredAccessToken()
    if (existingTokenInfo.token) {
      storeAccessToken(existingTokenInfo.token, existingTokenInfo.expiresAt, remember)
      dispatch({ type: AUTH_ACTIONS.SET_SESSION_EXPIRY, payload: existingTokenInfo.expiresAt })
    }
  }

  // Memoize actions object to prevent recreation on every render
  return useMemo(() => ({
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    clearError,
    checkAuth,
    setRememberMe,
  }), [
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    clearError,
    checkAuth,
    setRememberMe,
  ])
}

