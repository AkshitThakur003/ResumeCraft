import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, EmptyState, Button } from '../ui'
import { Activity, FileText, BarChart3, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRelativeTime } from '../../utils'
import { elegantFadeIn } from './dashboardAnimations'

const getActivityIcon = (type) => {
  switch (type) {
    case 'resume_upload': return FileText
    case 'analysis': return BarChart3
    case 'interview': return Target
    default: return Activity
  }
}

const ITEMS_PER_PAGE = 5

export const RecentActivity = ({ activities }) => {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedActivities = useMemo(() => {
    return activities.slice(startIndex, endIndex)
  }, [activities, startIndex, endIndex])

  // Reset to page 1 if current page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const handlePageClick = (page) => {
    setCurrentPage(page)
  }

  return (
    <motion.section 
      variants={elegantFadeIn}
      initial="initial"
      animate="animate"
      aria-label="Recent Activity"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10" />
      <motion.div 
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            <Activity className="h-5 w-5 text-blue-500" />
          </motion.div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Latest Updates</h2>
        </div>
        {activities.length > ITEMS_PER_PAGE && (
          <motion.div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, activities.length)} of {activities.length}
            </span>
          </motion.div>
        )}
      </motion.div>
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {paginatedActivities.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type)
                  return (
                    <motion.div 
                      key={activity.id}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 relative group/item overflow-hidden"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ 
                        x: 4,
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                      <motion.div 
                        className="p-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shrink-0 relative z-10"
                        whileHover={{ 
                          scale: 1.1,
                          rotate: 5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <ActivityIcon className="h-5 w-5" />
                      </motion.div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <motion.p 
                          className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                        >
                          {activity.title}
                        </motion.p>
                        <motion.p 
                          className="text-xs text-slate-500 dark:text-slate-400 truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.15 }}
                        >
                          {activity.description}
                        </motion.p>
                      </div>
                      <motion.span 
                        className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap relative z-10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                      >
                        {formatRelativeTime(activity.timestamp)}
                      </motion.span>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <motion.div 
                className="p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <EmptyState
                  icon={<Activity className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
                  title="No updates yet"
                  description="Your recent actions will appear here once you start using the app."
                  variant="minimal"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        
        {/* Pagination Controls */}
        {activities.length > ITEMS_PER_PAGE && (
          <motion.div 
            className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  // Show all pages if 7 or fewer
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  // Show first 5 pages + ... + last
                  if (i < 5) {
                    pageNum = i + 1
                  } else if (i === 5) {
                    return (
                      <span key="ellipsis-start" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  } else {
                    pageNum = totalPages
                  }
                } else if (currentPage >= totalPages - 3) {
                  // Show first + ... + last 5 pages
                  if (i === 0) {
                    pageNum = 1
                  } else if (i === 1) {
                    return (
                      <span key="ellipsis-end" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  } else {
                    pageNum = totalPages - 6 + i
                  }
                } else {
                  // Show first + ... + current-1, current, current+1 + ... + last
                  if (i === 0) {
                    pageNum = 1
                  } else if (i === 1) {
                    return (
                      <span key="ellipsis-start" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  } else if (i < 5) {
                    pageNum = currentPage - 2 + i
                  } else if (i === 5) {
                    return (
                      <span key="ellipsis-end" className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  } else {
                    pageNum = totalPages
                  }
                }

                if (pageNum === undefined) return null

                return (
                  <motion.button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {pageNum}
                  </motion.button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </Card>
    </motion.section>
  )
}
