/**
 * User Management Component
 * Main component for managing users (admin)
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useAdminData } from '../../hooks/useAdminData'
import { useUserManagement } from '../../hooks/useUserManagement'
import { staggerContainer } from '../ui/motionVariants'
import {
  UserManagementHeader,
  UserFilters,
  UserTable,
  UserManagementModals
} from './userManagement/index.js'

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

  const {
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
    setShowFilters,
    setBulkRoleValue,
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
    onCloseConfirm,
    onCloseBulk,
    onBulkRoleValueChange,
  } = useUserManagement({
    users,
    filters,
    updateFilters,
    updateUserStatus,
    updateUserRole,
    refreshUsers,
  })

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <UserManagementHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        selectedUserIds={selectedUserIds}
        onBulkStatusChange={() => handleBulkAction('status')}
        onBulkRoleChange={() => handleBulkAction('role')}
        onExport={exportToCSV}
      />

      <UserFilters
        showFilters={showFilters}
        filters={filters}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
        onClearSearch={clearSearch}
      />

      <UserTable
        users={users}
        pagination={pagination}
        loading={loading}
        error={error}
        filters={filters}
        selectedUserIds={selectedUserIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleUserSelection={toggleUserSelection}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        onUserClick={onUserClick}
        onRefresh={refreshUsers}
        onPageChange={goToPage}
        onSortChange={handleSortChange}
      />

      <UserManagementModals
        showConfirmModal={showConfirmModal}
        onCloseConfirm={onCloseConfirm}
        onConfirmAction={confirmAction}
        actionType={actionType}
        selectedUser={selectedUser}
        roleChangeUser={roleChangeUser}
        roleChangeValue={roleChangeValue}
        showBulkModal={showBulkModal}
        onCloseBulk={onCloseBulk}
        onConfirmBulk={confirmBulkAction}
        bulkAction={bulkAction}
        selectedUserIds={selectedUserIds}
        bulkRoleValue={bulkRoleValue}
        onBulkRoleValueChange={onBulkRoleValueChange}
      />
    </motion.div>
  )
}
