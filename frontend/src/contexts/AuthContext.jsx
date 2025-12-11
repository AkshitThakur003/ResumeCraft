import React, { createContext, useContext, useEffect } from 'react'
import { useAuthReducer } from '../hooks/useAuthReducer'
import { useAuthActions } from '../hooks/useAuthActions'
import { useSessionManagement } from '../hooks/useSessionManagement'

// Create context
const AuthContext = createContext()

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useAuthReducer()
  const actions = useAuthActions(state, dispatch)
  const { logout } = actions

  // Check for existing auth on mount
  // Note: actions.checkAuth is stable and doesn't need to be in deps
  useEffect(() => {
    actions.checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // actions object is stable from useAuthActions hook
  }, [])

  // Manage session expiry
  useSessionManagement(state, dispatch, logout)

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    rememberMe: state.rememberMe,
    sessionExpiresAt: state.sessionExpiresAt,
    
    // Actions
    ...actions,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth()
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      // Redirect to login will be handled by route protection
      return null
    }
    
    return <Component {...props} />
  }
}

// Auth guard hook for conditional rendering
export const useAuthGuard = () => {
  const { isAuthenticated, loading } = useAuth()
  
  return {
    isAuthenticated,
    loading,
    canAccess: isAuthenticated && !loading,
  }
}

export default AuthContext
