/**
 * User Filters Component
 * Filter panel for role and status
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, Select, Button } from '../../ui'
import { X } from 'lucide-react'

export const UserFilters = ({
  showFilters,
  filters,
  onFilterChange,
  onClearFilters,
  onClearSearch,
}) => {
  return (
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
                  onChange={(e) => onFilterChange({ role: e.target.value })}
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
                  onChange={(e) => onFilterChange({ status: e.target.value })}
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
                    onClearSearch()
                    onClearFilters()
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
  )
}

