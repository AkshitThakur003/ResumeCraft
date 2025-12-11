import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { PageLoading } from '../ui'
import { logger } from '../../utils/logger'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoading message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export const PublicRoute = ({ children }) => {
  try {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
      return <PageLoading message="Loading..." />
    }

    if (isAuthenticated) {
      // Redirect to dashboard if already authenticated
      return <Navigate to="/dashboard" replace />
    }

    return children
  } catch (error) {
    // If AuthProvider is not available, just render children
    // This prevents the "useAuth must be used within an AuthProvider" error
    // from breaking the entire app
    logger.warn('PublicRoute: AuthProvider not available, rendering children anyway', error)
    return children
  }
}

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoading message="Checking permissions..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}