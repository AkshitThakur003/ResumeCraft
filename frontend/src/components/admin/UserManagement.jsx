import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, X, MoreVertical, 
  UserCheck, UserX, Shield, User, Mail, Calendar,
  ChevronDown, ChevronUp, Eye, Edit, Download,
  CheckSquare, Square
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Pagination } from '../ui'
import { useAdminData } from '../../hooks/useAdminData'
import { adminAPI } from '../../utils/api'
import { useToast } from '../ui'
import { ConfirmModal } from '../ui'
import { fadeInUp, staggerContainer } from '../ui/motionVariants'
import { cn } from '../../utils'

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  recruiter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const UserManagement = ({ onUserClick }) => {
  const {
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
  } = useAdminData()

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

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search - only update filters after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      if (value.length === 0 || value.length >= 2) {
        updateFilters({ search: value })
      }
    }, 500) // 500ms debounce
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleStatusChange = (user, newStatus) => {
    setSelectedUser(user)
    setActionType('status')
    setShowConfirmModal(true)
  }

  const handleRoleChange = (user, newRole) => {
    setRoleChangeUser(user)
    setRoleChangeValue(newRole)
    setActionType('role')
    // Extra confirmation for admin role assignment
    if (newRole === 'admin') {
      setShowConfirmModal(true)
    } else {
      setShowConfirmModal(true)
    }
  }

  const confirmAction = async () => {
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
  }

  const toggleUserSelection = (userId) => {
    const newSelection = new Set(selectedUserIds)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUserIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map(u => u._id)))
    }
  }

  const handleBulkAction = (action) => {
    if (selectedUserIds.size === 0) {
      showToast('Please select at least one user', 'warning')
      return
    }
    setBulkAction(action)
    if (action === 'role') {
      setBulkRoleValue('user')
    }
    setShowBulkModal(true)
  }

  const confirmBulkAction = async () => {
    if (selectedUserIds.size === 0) return

    try {
      const userIds = Array.from(selectedUserIds)
      let value
      if (bulkAction === 'status') {
        value = true // Activate selected users
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
  }

  const exportToCSV = () => {
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
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header with Search and Filters */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {selectedUserIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <Button
                variant="outline"
                onClick={() => handleBulkAction('status')}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Activate ({selectedUserIds.size})
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('role')}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Change Role ({selectedUserIds.size})
              </Button>
            </motion.div>
          )}
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select
                    value={filters.role || ''}
                    onChange={(e) => updateFilters({ role: e.target.value })}
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={filters.status || ''}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('')
                      updateFilters({ search: '', role: '', status: '' })
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({pagination.totalItems})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshUsers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper-mobile overflow-x-auto scroll-hide-mobile">
                <table className="table-responsive w-full min-w-[640px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 w-12">
                        <button
                          onClick={toggleSelectAll}
                          className="tap-target p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          aria-label={selectedUserIds.size === users.length ? "Deselect all users" : "Select all users"}
                        >
                          {selectedUserIds.size === users.length ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <button
                          onClick={() => {
                            const newOrder = filters.sortBy === 'firstName' && filters.sortOrder === 'asc' ? 'desc' : 'asc'
                            updateFilters({ sortBy: 'firstName', sortOrder: newOrder })
                          }}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          User
                          {filters.sortBy === 'firstName' && (
                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <button
                          onClick={() => {
                            const newOrder = filters.sortBy === 'createdAt' && filters.sortOrder === 'asc' ? 'desc' : 'asc'
                            updateFilters({ sortBy: 'createdAt', sortOrder: newOrder })
                          }}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          Joined
                          {filters.sortBy === 'createdAt' && (
                            <span>{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {users.map((user, index) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4" data-label="">
                            <button
                              onClick={() => toggleUserSelection(user._id)}
                              className="tap-target p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              aria-label={selectedUserIds.has(user._id) ? "Deselect user" : "Select user"}
                            >
                              {selectedUserIds.has(user._id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4" data-label="User">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4" data-label="Role">
                            <Select
                              value={user.role || 'user'}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              className="w-full sm:w-32 text-xs"
                            >
                              <option value="user">User</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="admin">Admin</option>
                            </Select>
                          </td>
                          <td className="py-4 px-4" data-label="Status">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                              statusColors[user.isActive ? 'active' : 'inactive']
                            )}>
                              {user.isActive ? (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-4 px-4" data-label="Joined">
                            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-4 px-4" data-label="Actions">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUserClick?.(user)}
                                className="tap-target h-10 w-10 sm:h-8 sm:w-8 p-0"
                                aria-label="View user details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(user, !user.isActive)}
                                className="tap-target h-10 w-10 sm:h-8 sm:w-8 p-0"
                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
                              >
                                {user.isActive ? (
                                  <UserX className="h-4 w-4 text-red-600" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-emerald-600" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={goToPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Modal for Single Actions */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setSelectedUser(null)
          setRoleChangeUser(null)
          setActionType(null)
          setRoleChangeValue('user')
        }}
        onConfirm={confirmAction}
        title={
          actionType === 'status'
            ? `${selectedUser?.isActive ? 'Deactivate' : 'Activate'} User?`
            : roleChangeValue === 'admin'
            ? '⚠️ Assign Admin Role?'
            : 'Change User Role?'
        }
        description={
          actionType === 'status'
            ? `Are you sure you want to ${selectedUser?.isActive ? 'deactivate' : 'activate'} ${selectedUser?.email}?`
            : roleChangeValue === 'admin'
            ? `⚠️ WARNING: You are about to assign ADMIN role to ${roleChangeUser?.email}. This will give them full system access. Are you absolutely sure?`
            : `Are you sure you want to change the role for ${roleChangeUser?.email} to ${roleChangeValue}?`
        }
        confirmText={actionType === 'status' ? (selectedUser?.isActive ? 'Deactivate' : 'Activate') : 'Change Role'}
        variant={actionType === 'status' && selectedUser?.isActive ? 'destructive' : roleChangeValue === 'admin' ? 'destructive' : 'default'}
      />

      {/* Bulk Action Modal */}
      <ConfirmModal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false)
          setBulkAction(null)
        }}
        onConfirm={confirmBulkAction}
        title={
          bulkAction === 'status'
            ? `Activate ${selectedUserIds.size} Users?`
            : `Change Role for ${selectedUserIds.size} Users?`
        }
        description={
          bulkAction === 'status'
            ? `Are you sure you want to activate ${selectedUserIds.size} selected users?`
            : (
              <div className="space-y-3">
                <p>Select new role for {selectedUserIds.size} users:</p>
                <Select
                  value={bulkRoleValue}
                  onChange={(e) => setBulkRoleValue(e.target.value)}
                  className="w-full"
                >
                  <option value="user">User</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </Select>
                {bulkRoleValue === 'admin' && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ⚠️ WARNING: Assigning admin role to multiple users will give them full system access!
                  </p>
                )}
              </div>
            )
        }
        confirmText={bulkAction === 'status' ? 'Activate' : 'Change Role'}
        variant={bulkAction === 'role' && bulkRoleValue === 'admin' ? 'destructive' : 'default'}
      />
    </motion.div>
  )
}

