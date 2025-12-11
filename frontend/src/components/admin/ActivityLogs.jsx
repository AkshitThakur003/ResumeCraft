import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Activity, Clock, User, FileText, Search, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Pagination } from '../ui'
import { adminAPI } from '../../utils/api'
import { fadeInUp, staggerContainer } from '../ui/motionVariants'
import { useToast } from '../ui'

export const ActivityLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [page, setPage] = useState(1)
  const limit = 20
  const { showToast } = useToast()
  const isFetchingRef = useRef(false)

  const showToastRef = useRef(showToast)
  
  useEffect(() => {
    showToastRef.current = showToast
  }, [showToast])

  const fetchLogs = useCallback(async (pageNum) => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      const response = await adminAPI.getAuditLogs({ 
        page: pageNum,
        limit,
      }).catch((err) => {
        // Silently handle 404 or other errors - audit logs are optional
        if (err.response?.status === 404 || err.response?.status === 500) {
          return { data: { data: { logs: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, hasNext: false, hasPrev: false } } } }
        }
        throw err
      })
      
      const logsData = response.data?.data?.logs || []
      const paginationData = response.data?.data?.pagination || {
        currentPage: pageNum,
        totalPages: 1,
        totalItems: logsData.length,
        hasNext: false,
        hasPrev: false,
      }
      
      setLogs(logsData)
      setPagination(paginationData)
    } catch (err) {
      // Only show error for non-404/500 errors
      if (err.response?.status !== 404 && err.response?.status !== 500) {
        try {
          showToastRef.current('Failed to fetch activity logs', 'error')
        } catch (toastErr) {
          // Silently fail if toast fails
        }
      }
      setLogs([])
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
      })
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [limit]) // Removed showToast from dependencies

  useEffect(() => {
    fetchLogs(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]) // Only depend on page, not fetchLogs

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.adminId?.email?.toLowerCase().includes(query) ||
      log.targetUserId?.email?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.ipAddress?.toLowerCase().includes(query)
    )
  })

  const getActionIcon = (action) => {
    if (action?.includes('login') || action?.includes('auth')) return User
    if (action?.includes('resume') || action?.includes('file')) return FileText
    if (action?.includes('role') || action?.includes('status')) return User
    return Activity
  }

  const getActionColor = (action) => {
    if (action?.includes('create') || action?.includes('register')) return 'text-emerald-600 dark:text-emerald-400'
    if (action?.includes('delete') || action?.includes('remove') || action?.includes('deactivate')) return 'text-red-600 dark:text-red-400'
    if (action?.includes('update') || action?.includes('edit') || action?.includes('change')) return 'text-blue-600 dark:text-blue-400'
    if (action?.includes('activate')) return 'text-emerald-600 dark:text-emerald-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  const formatAction = (action) => {
    return action?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Action'
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search activity logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLogs(page)}
          disabled={loading}
        >
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Logs ({pagination.totalItems})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activity logs available</p>
              <p className="text-sm mt-2">Activity logging will appear here when enabled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => {
                const ActionIcon = getActionIcon(log.action)
                const actionColor = getActionColor(log.action)
                
                return (
                  <motion.div
                    key={log._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className={`font-medium ${actionColor}`}>
                            {formatAction(log.action)}
                          </div>
                          {log.description && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {log.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-500">
                            {log.adminId && typeof log.adminId === 'object' && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Admin: {log.adminId?.email || log.adminId?.firstName || 'Unknown'}
                              </div>
                            )}
                            {log.targetUserId && typeof log.targetUserId === 'object' && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Target: {log.targetUserId?.email || log.targetUserId?.firstName || 'Unknown'}
                              </div>
                            )}
                            {log.ipAddress && (
                              <div className="flex items-center gap-1">
                                IP: {log.ipAddress}
                              </div>
                            )}
                            {log.success === false && (
                              <div className="text-red-600 dark:text-red-400 font-medium">
                                Failed
                              </div>
                            )}
                          </div>
                        </div>
                        {(log.createdAt || log.timestamp) && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {new Date(log.createdAt || log.timestamp).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

