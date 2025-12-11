import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button, ConfirmModal, Tooltip } from '../ui'
import { cn, formatRelativeTime } from '../../utils'
import { useNotificationsContext } from '../../contexts/NotificationsContext'
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Check, X, Trash2, Filter, ArrowUpDown, RotateCcw, ChevronDown } from 'lucide-react'

const NotificationItem = ({ notification, onMarkAsRead, onDismiss, onNavigate }) => {
  const iconMap = {
    info: { Icon: Info, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    success: { Icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
    error: { Icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
    default: { Icon: Bell, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' }
  }

  const { Icon, color } = iconMap[notification.type] || iconMap.default

  // Determine if notification is clickable based on metadata
  const isClickable = notification.metadata && notification.metadata.resumeId

  const handleClick = () => {
    if (!isClickable || !onNavigate) return
    
    const { resumeId } = notification.metadata || {}
    
    if (resumeId) {
      onNavigate(`/resumes/${resumeId}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border transition-all duration-200',
        notification.read 
          ? 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700' 
          : 'bg-white border-blue-200 shadow-sm dark:bg-slate-800 dark:border-blue-900/30',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-lg flex items-center justify-center', color)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>
        )}
        {notification.createdAt && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span>{formatRelativeTime(notification.createdAt)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        {!notification.read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="h-8 w-8 flex items-center justify-center border border-gray-300 hover:border-green-500 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-400 dark:hover:bg-green-900/20 rounded-lg transition-all cursor-pointer"
            title="Mark as read"
          >
            <Check className="w-4 h-4 text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(notification.id)
          }}
          className="h-8 w-8 flex items-center justify-center border border-gray-300 hover:border-red-500 hover:bg-red-50 dark:border-gray-600 dark:hover:border-red-400 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4 text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400" />
        </button>
      </div>
    </motion.div>
  )
}

export const NotificationsCenter = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const {
    notifications,
    isLoading,
    unreadCount,
    totalCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    undoLastAction,
    hasUndo,
  } = useNotificationsContext()
  const shouldReduceMotion = useReducedMotion()
  
  // Filter and sort state
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read', 'info', 'success', 'warning', 'error'
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest'
  const [showFilters, setShowFilters] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const scrollContainerRef = useRef(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Refresh notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Determine if there are more notifications to load
  const hasMore = notifications.length < totalCount && totalCount > 0

  // Filter and sort notifications
  const filteredAndSortedNotifications = React.useMemo(() => {
    let filtered = [...notifications]

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read)
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter)
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [notifications, filter, sortBy])

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || isLoadingMore || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    if (isNearBottom && hasMore) {
      setIsLoadingMore(true)
      // Load more notifications
      fetchNotifications({ skip: notifications.length, limit: 20, append: true })
        .catch(() => {
          // Error handled by context
        })
        .finally(() => {
          setIsLoadingMore(false)
        })
    }
  }, [isLoadingMore, hasMore, notifications.length, totalCount, fetchNotifications])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handleNavigate = (path) => {
    navigate(path)
    onClose() // Close notification panel when navigating
  }

  const handleMarkAsRead = (id) => {
    markAsRead(id)
  }

  const handleDismiss = (id) => {
    dismissNotification(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleClearAll = () => {
    setShowClearConfirm(true)
  }

  const confirmClearAll = () => {
    clearAll()
    setShowClearConfirm(false)
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 400 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Updates
                  </h2>
                  {unreadCount > 0 && (
                    <Tooltip content={totalCount > 99 ? `${totalCount} total notifications` : undefined}>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {unreadCount} new update{unreadCount > 1 ? 's' : ''}
                        {totalCount > unreadCount && ` • ${totalCount} total`}
                      </p>
                    </Tooltip>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasUndo && (
                  <Tooltip content="Undo last action">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={undoLastAction}
                      className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  title="Filter and sort"
                >
                  <Filter className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter and Sort Bar */}
            {showFilters && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/30 dark:bg-slate-950/30"
            >
              {isLoading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 mb-4 animate-pulse">
                    <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Checking for updates...
                  </p>
                </div>
              ) : filteredAndSortedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {filter === 'all' ? "You're all caught up" : `No ${filter} notifications`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filter === 'all' ? 'No new updates for now.' : 'Try changing the filter.'}
                  </p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {filteredAndSortedNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDismiss={handleDismiss}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </AnimatePresence>
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {hasMore && !isLoadingMore && (
                    <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                      Scroll for more notifications
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-900/30"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Clear All Confirmation Modal */}
          <ConfirmModal
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            onConfirm={confirmClearAll}
            title="Clear All Notifications"
            description={`Are you sure you want to delete all ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}? This action cannot be undone.`}
            confirmText="Clear All"
            cancelText="Cancel"
            variant="destructive"
          />
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationsCenter
