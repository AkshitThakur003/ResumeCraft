import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { userAPI } from '../../utils/api'
import { apiRequest } from '../../utils/api/errorHandling'

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MIN_REFRESH_INTERVAL = 2 * 60 * 1000 // Minimum 2 minutes between refreshes

export const useDashboardData = () => {
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState(null)
  const [insights, setInsights] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [previousStats, setPreviousStats] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)

  // Use refs to access current values without causing re-renders
  const isRefreshingRef = useRef(false)
  const loadingRef = useRef(false)
  const lastRefreshTimeRef = useRef(null)
  const refreshFunctionRef = useRef(null)

  // Keep refs in sync with state
  useEffect(() => {
    isRefreshingRef.current = isRefreshing
    loadingRef.current = loading
    lastRefreshTimeRef.current = lastRefreshTime
  }, [isRefreshing, loading, lastRefreshTime])

  const loadDashboardData = useCallback(async (showLoading = true) => {
    // Prevent multiple simultaneous requests
    if (isRefreshing || (loading && !showLoading)) {
      return
    }

    try {
      if (showLoading) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      
      // ✅ Load dashboard data with retry logic for critical calls
      // Retry on network errors or 5xx errors (cold start scenarios)
      const result = await apiRequest(
        () => userAPI.getDashboard(),
        {
          retries: 2,
          retryDelay: 2000,
          retryableStatuses: [0, 500, 502, 503, 504],
          errorMessage: 'Failed to load dashboard data. Please try again.',
          onRetry: (attempt, maxRetries) => {
            logger.debug(`Dashboard data fetch failed (attempt ${attempt}/${maxRetries}), retrying...`)
          }
        }
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      // Process stats
      const dashboardData = result.data || {}
      const dashboardStats = dashboardData.stats || {}
      const dashboardTrends = dashboardData.trends || {}
      const dashboardInsights = dashboardData.insights || {}
      const activities = dashboardData.activities || []

      const nextStats = {
        ...dashboardStats
      }

      // Store current stats as previous before updating
      setStats((prevStats) => {
        if (prevStats) {
          setPreviousStats({ ...prevStats })
        }
        return nextStats
      })
      setTrends(dashboardTrends)
      setInsights(dashboardInsights)

      // Process activities - convert timestamp strings to Date objects for sorting
      const processedActivities = activities.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }))
      
      // Sort by timestamp (already sorted from backend, but ensure it's correct)
      setRecentActivity(processedActivities.sort((a, b) => b.timestamp - a.timestamp))

      // Update last refresh time
      setLastRefreshTime(Date.now())

    } catch (error) {
      const { logger } = await import('../../utils/logger')
      logger.error('Failed to load dashboard data:', error)
      // Don't show error on silent refresh to avoid disrupting user
      if (showLoading) {
        setError('Failed to load dashboard data. Please try again.')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }, [isRefreshing, loading])

  // Separate function for manual refresh
  const refreshDashboardData = useCallback(async (silent = false) => {
    await loadDashboardData(!silent)
  }, [loadDashboardData])

  // Store refresh function in ref for use in useEffect
  useEffect(() => {
    refreshFunctionRef.current = refreshDashboardData
  }, [refreshDashboardData])

  useEffect(() => {
    loadDashboardData()

    // Smart auto-refresh: only when tab is visible and not too frequent
    let intervalId
    let visibilityHandler

    const setupAutoRefresh = () => {
      // Clear existing interval
      if (intervalId) {
        clearInterval(intervalId)
      }

      // Only set up auto-refresh if tab is visible
      if (document.visibilityState === 'visible') {
        intervalId = setInterval(() => {
          // Check if enough time has passed since last refresh
          const now = Date.now()
          const timeSinceLastRefresh = lastRefreshTimeRef.current ? now - lastRefreshTimeRef.current : Infinity
          
          // Only refresh if:
          // 1. Not currently loading/refreshing
          // 2. Tab is visible
          // 3. Minimum interval has passed
          // 4. Refresh function is available
          if (!isRefreshingRef.current && !loadingRef.current && document.visibilityState === 'visible' && timeSinceLastRefresh >= MIN_REFRESH_INTERVAL && refreshFunctionRef.current) {
            refreshFunctionRef.current(true) // Silent refresh
          }
        }, AUTO_REFRESH_INTERVAL)
      }
    }

    // Handle visibility changes
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible - refresh if data is stale (older than refresh interval)
        const now = Date.now()
        const timeSinceLastRefresh = lastRefreshTimeRef.current ? now - lastRefreshTimeRef.current : Infinity
        
        if (timeSinceLastRefresh >= AUTO_REFRESH_INTERVAL && !isRefreshingRef.current && !loadingRef.current && refreshFunctionRef.current) {
          refreshFunctionRef.current(true)
        } else {
          // Just set up auto-refresh for future
          setupAutoRefresh()
        }
      } else {
        // Tab is hidden - clear interval to save resources
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }

    // Set up initial auto-refresh after a short delay to ensure refresh function is set
    const timeoutId = setTimeout(() => {
      setupAutoRefresh()
      document.addEventListener('visibilitychange', visibilityHandler)
    }, 100)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [loadDashboardData])

  // ✅ Memoize stat changes calculation - only recalculate when stats or previousStats change
  const statChanges = useMemo(() => {
    if (!stats || !previousStats) return {}

    const formatDelta = (key) => {
      const current = typeof stats[key] === 'number' ? stats[key] : Number(stats[key])
      const previous = typeof previousStats[key] === 'number' ? previousStats[key] : Number(previousStats[key])
      if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
      const diff = current - previous
      if (diff === 0) return null

      return {
        change: `${diff > 0 ? '+' : ''}${diff}`,
        trend: diff > 0 ? 'positive' : 'negative'
      }
    }

    return {
      totalResumes: formatDelta('totalResumes'),
      totalAnalyses: formatDelta('totalAnalyses'),
      averageScore: formatDelta('averageScore'),
      profileCompletion: formatDelta('profileCompletion')
    }
  }, [stats, previousStats])

  return {
    stats,
    trends,
    insights,
    recentActivity,
    loading,
    error,
    isRefreshing,
    lastRefreshTime,
    statChanges,
    refreshDashboardData,
    loadDashboardData
  }
}

