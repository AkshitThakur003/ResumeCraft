/**
 * Custom hook for user management operations
 * Handles search, filters, bulk actions, and user operations
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { adminAPI } from '../utils/api'
import { useToast } from '../components/ui'

export const useUserManagement = ({
  users,
  filters,
  updateFilters,
  updateUserStatus,
  updateUserRole,
  refreshUsers,
}) => {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState(new Set())
  const [bulkAction, setBulkAction] = useState(null)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkRoleValue, setBulkRoleValue] = useState('user')
  const [roleChangeUser, setRoleChangeUser] = useState(null)
  const [roleChangeValue, setRoleChangeValue] = useState('user')
  const searchTimeoutRef = useRef(null)

  // Sync searchQuery with filters when filters change externally
  useEffect(() => {
    if (filters.search !== searchQuery) {
      setSearchQuery(filters.search || '')
    }
  }, [filters.search])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = useCallback((e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length === 0 || value.length >= 2) {
        updateFilters({ search: value })
      }
    }, 500)
  }, [updateFilters])

  const handleStatusChange = useCallback((user, newStatus) => {
    setSelectedUser(user)
    setActionType('status')
    setShowConfirmModal(true)
  }, [])

  const handleRoleChange = useCallback((user, newRole) => {
    setRoleChangeUser(user)
    setRoleChangeValue(newRole)
    setActionType('role')
    setShowConfirmModal(true)
  }, [])

  const confirmAction = useCallback(async () => {
    if (!selectedUser && !roleChangeUser) return

    let success = false
    if (actionType === 'status') {
      success = await updateUserStatus(selectedUser._id, !selectedUser.isActive)
    } else if (actionType === 'role') {
      success = await updateUserRole(roleChangeUser._id, roleChangeValue)
    }

    if (success) {
      setShowConfirmModal(false)
      setSelectedUser(null)
      setRoleChangeUser(null)
      setActionType(null)
      setRoleChangeValue('user')
    }
  }, [selectedUser, roleChangeUser, actionType, roleChangeValue, updateUserStatus, updateUserRole])

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUserIds(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(userId)) {
        newSelection.delete(userId)
      } else {
        newSelection.add(userId)
      }
      return newSelection
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedUserIds(prev => {
      if (prev.size === users.length) {
        return new Set()
      } else {
        return new Set(users.map(u => u._id))
      }
    })
  }, [users])

  const handleBulkAction = useCallback((action) => {
    if (selectedUserIds.size === 0) {
      showToast('Please select at least one user', 'warning')
      return
    }
    setBulkAction(action)
    if (action === 'role') {
      setBulkRoleValue('user')
    }
    setShowBulkModal(true)
  }, [selectedUserIds.size, showToast])

  const confirmBulkAction = useCallback(async () => {
    if (selectedUserIds.size === 0) return

    try {
      const userIds = Array.from(selectedUserIds)
      let value
      if (bulkAction === 'status') {
        value = true
      } else {
        value = bulkRoleValue
      }

      const response = await adminAPI.bulkUpdateUsers({
        userIds,
        action: bulkAction,
        value,
      })

      if (response.data?.success) {
        showToast(`Successfully updated ${response.data.data.modifiedCount} users`, 'success')
        setSelectedUserIds(new Set())
        setShowBulkModal(false)
        setBulkAction(null)
        refreshUsers()
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update users', 'error')
    }
  }, [selectedUserIds, bulkAction, bulkRoleValue, refreshUsers, showToast])

  const exportToCSV = useCallback(() => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date']
    const rows = users.map(user => [
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      user.email,
      user.role || 'user',
      user.isActive ? 'Active' : 'Inactive',
      new Date(user.createdAt).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Users exported successfully', 'success')
  }, [users, showToast])

  const clearFilters = useCallback(() => {
    updateFilters({ role: '', status: '' })
  }, [updateFilters])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    updateFilters({ sortBy, sortOrder })
  }, [updateFilters])

  return {
    // State
    searchQuery,
    showFilters,
    selectedUser,
    actionType,
    showConfirmModal,
    selectedUserIds,
    bulkAction,
    showBulkModal,
    bulkRoleValue,
    roleChangeUser,
    roleChangeValue,
    
    // Setters
    setShowFilters,
    setBulkRoleValue,
    
    // Actions
    handleSearch,
    handleStatusChange,
    handleRoleChange,
    confirmAction,
    toggleUserSelection,
    toggleSelectAll,
    handleBulkAction,
    confirmBulkAction,
    exportToCSV,
    clearFilters,
    clearSearch,
    handleSortChange,
    
    // Modal handlers
    onCloseConfirm: () => {
      setShowConfirmModal(false)
      setSelectedUser(null)
      setRoleChangeUser(null)
      setActionType(null)
      setRoleChangeValue('user')
    },
    onCloseBulk: () => {
      setShowBulkModal(false)
      setBulkAction(null)
    },
    onBulkRoleValueChange: (e) => setBulkRoleValue(e.target.value),
  }
}

