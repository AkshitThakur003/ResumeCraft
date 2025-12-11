import React from 'react'
import { motion } from 'framer-motion'
import { Button, Tooltip } from '../ui'
import { RefreshCw, Download } from 'lucide-react'
import { formatRelativeTime } from '../../utils'
import { staggerFadeIn } from './dashboardAnimations'

export const DashboardHeader = ({ user, lastRefreshTime, onRefresh, onExport, loading, isRefreshing, stats, trends, insights }) => {
  return (
    <motion.div 
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
      variants={staggerFadeIn}
      custom={0}
    >
      <motion.div
        variants={staggerFadeIn}
        custom={0}
      >
        <motion.h1 
          className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          Welcome back, {user?.firstName || user?.name || 'User'}
        </motion.h1>
        <motion.p 
          className="text-slate-500 dark:text-slate-400 mt-1 text-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          Ready to make some progress today?
        </motion.p>
        {lastRefreshTime && (
          <motion.p 
            className="text-xs text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Last updated: {formatRelativeTime(new Date(lastRefreshTime))}
          </motion.p>
        )}
      </motion.div>
      <motion.div 
        className="flex items-center gap-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tooltip content="Export dashboard data">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onExport}
              aria-label="Export dashboard"
              className="rounded-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              <Download className="h-4 w-4" />
            </Button>
          </motion.div>
        </Tooltip>
        <Tooltip content="Refresh data">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ rotate: { duration: 0.3 } }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              aria-label="Refresh dashboard"
              disabled={loading || isRefreshing}
              className="rounded-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            </Button>
          </motion.div>
        </Tooltip>
      </motion.div>
    </motion.div>
  )
}

