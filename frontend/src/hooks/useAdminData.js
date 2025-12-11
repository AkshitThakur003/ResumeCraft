import { useState, useEffect, useCallback, useRef } from 'react'
import { adminAPI } from '../utils/api'
import { useToast } from '../components/ui'

export const useAdminData = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const { showToast } = useToast()
  const isFetchingRef = useRef(false)
  const filtersRef = useRef(filters)
  const hasInitialFetchRef = useRef(false)
  const showToastRef = useRef(showToast)

  // Keep refs in sync
  useEffect(() => {
    filtersRef.current = filters
    showToastRef.current = showToast
  }, [filters, showToast])

  const fetchUsers = useCallback(async (customFilters = null) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      
      // Use custom filters if provided, otherwise use current filters from ref
      const filtersToUse = customFilters || filtersRef.current
      
      // Filter out empty string values to avoid validation errors
      const cleanFilters = Object.entries(filtersToUse).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {})
      
      const response = await adminAPI.getUsers(cleanFilters)
      
      // Handle response
      if (response?.data?.success) {
        const usersData = response.data.data?.users || []
        const paginationData = response.data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: usersData.length,
          hasNext: false,
          hasPrev: false,
        }
        setUsers(usersData)
        setPagination(paginationData)
      } else {
        // If response doesn't have success flag, try to extract data anyway
        if (response?.data?.data?.users) {
          setUsers(response.data.data.users)
          setPagination(response.data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.data.users.length,
            hasNext: false,
            hasPrev: false,
          })
        } else {
          throw new Error('Invalid response format')
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users'
      setError(errorMessage)
      // Use showToast from ref to avoid dependency issues
      if (showToastRef.current) {
        showToastRef.current(errorMessage, 'error')
      }
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        const { logger } = await import('../utils/logger')
        logger.error('Error fetching users:', err)
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, []) // Empty dependencies - use refs for values that change

  // Initial fetch on mount
  useEffect(() => {
    if (!hasInitialFetchRef.current) {
      hasInitialFetchRef.current = true
      fetchUsers()
    }
    // fetchUsers is stable (empty deps, uses refs) - safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Fetch when filters change
  useEffect(() => {
    // Skip on initial mount (handled by the effect above)
    if (!hasInitialFetchRef.current) {
      return
    }

    // Small delay to batch filter changes
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 100)

    return () => clearTimeout(timeoutId)
    // fetchUsers is stable (empty deps, uses refs) - safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.role, filters.status, filters.page, filters.limit, filters.sortBy, filters.sortOrder])

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await adminAPI.updateUserStatus(userId, isActive)
      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? response.data.data.user : user
          )
        )
        if (showToastRef.current) {
          showToastRef.current(`User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success')
        }
        return true
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status'
      if (showToastRef.current) {
        showToastRef.current(errorMessage, 'error')
      }
      return false
    }
  }

  const updateUserRole = async (userId, role) => {
    try {
      const response = await adminAPI.updateUserRole(userId, role)
      if (response.data.success) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user._id === userId ? response.data.data.user : user
          )
        )
        if (showToastRef.current) {
          showToastRef.current('User role updated successfully', 'success')
        }
        return true
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update user role'
      if (showToastRef.current) {
        showToastRef.current(errorMessage, 'error')
      }
      return false
    }
  }

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters, page: 1 }
      return updated
    })
  }, [])

  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const refreshUsers = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    pagination,
    filters,
    loading,
    error,
    updateUserStatus,
    updateUserRole,
    updateFilters,
    goToPage,
    refreshUsers,
  }
}

