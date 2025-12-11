import { useState, useEffect, useCallback, useRef } from 'react'
import { adminAPI } from '../utils/api'
import { useToast } from '../components/ui'
import { logger } from '../utils/logger'

export const useAdminStats = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    recruiterUsers: 0,
    regularUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
  })
  const { showToast } = useToast()
  const isFetchingRef = useRef(false)
  const hasFetchedRef = useRef(false)

  const fetchStats = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      
      // Use aggregated stats endpoint for better performance
      const response = await adminAPI.getStats()
      const data = response.data?.data || {}
      
      const roleDistribution = data.roleDistribution || {}
      
      setStats({
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        inactiveUsers: data.inactiveUsers || 0,
        adminUsers: roleDistribution.admin || 0,
        recruiterUsers: roleDistribution.recruiter || 0,
        regularUsers: roleDistribution.user || 0,
        newUsersToday: 0, // Can be calculated from recentUsers if needed
        newUsersThisWeek: 0, // Can be calculated from recentUsers if needed
        newUsersThisMonth: data.newUsersLast30Days || 0,
      })
      hasFetchedRef.current = true
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch statistics'
      setError(errorMessage)
      // Use showToast from ref to avoid dependency issues
      try {
        showToast(errorMessage, 'error')
      } catch (toastError) {
        // Silently fail - don't log in production
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to show toast:', toastError)
        }
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, []) // Remove showToast from dependencies to prevent infinite loop

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      fetchStats()
    }
    // fetchStats is stable (empty deps) - safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only run once on mount

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  }
}

