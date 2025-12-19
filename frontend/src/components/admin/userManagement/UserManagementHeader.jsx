/**
 * User Management Header Component
 * Search, filters, and bulk action controls
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Button, Input } from '../../ui'
import { Search, Filter, X, UserCheck, Edit, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { fadeInUp } from '../../ui/motionVariants'

export const UserManagementHeader = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  selectedUserIds,
  onBulkStatusChange,
  onBulkRoleChange,
  onExport,
}) => {
  return (
    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={onSearchChange}
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
              onClick={onBulkStatusChange}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Activate ({selectedUserIds.size})
            </Button>
            <Button
              variant="outline"
              onClick={onBulkRoleChange}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Change Role ({selectedUserIds.size})
            </Button>
          </motion.div>
        )}
        <Button
          variant="outline"
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </motion.div>
  )
}

