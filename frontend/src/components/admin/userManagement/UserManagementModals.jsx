/**
 * User Management Modals Component
 * Confirmation modals for user actions
 */

import React from 'react'
import { ConfirmModal, Select } from '../../ui'

export const UserManagementModals = ({
  showConfirmModal,
  onCloseConfirm,
  onConfirmAction,
  actionType,
  selectedUser,
  roleChangeUser,
  roleChangeValue,
  showBulkModal,
  onCloseBulk,
  onConfirmBulk,
  bulkAction,
  selectedUserIds,
  bulkRoleValue,
  onBulkRoleValueChange,
}) => {
  return (
    <>
      {/* Confirm Modal for Single Actions */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={onCloseConfirm}
        onConfirm={onConfirmAction}
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
        onClose={onCloseBulk}
        onConfirm={onConfirmBulk}
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
                  onChange={onBulkRoleValueChange}
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
    </>
  )
}

