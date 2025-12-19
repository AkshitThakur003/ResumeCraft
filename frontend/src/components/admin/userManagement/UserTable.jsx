/**
 * User Table Component
 * Displays users in a table format with actions
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Pagination } from '../../ui'
import { Users, Mail, Calendar, Eye, UserCheck, UserX, CheckSquare, Square } from 'lucide-react'
import { cn } from '../../../utils'

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const UserTable = ({
  users,
  pagination,
  loading,
  error,
  filters,
  selectedUserIds,
  onToggleSelectAll,
  onToggleUserSelection,
  onRoleChange,
  onStatusChange,
  onUserClick,
  onRefresh,
  onPageChange,
  onSortChange,
}) => {
  return (
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
            onClick={onRefresh}
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
                        onClick={onToggleSelectAll}
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
                          onSortChange('firstName', newOrder)
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
                          onSortChange('createdAt', newOrder)
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
                            onClick={() => onToggleUserSelection(user._id)}
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
                            onChange={(e) => onRoleChange(user, e.target.value)}
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
                              onClick={() => onStatusChange(user, !user.isActive)}
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
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

