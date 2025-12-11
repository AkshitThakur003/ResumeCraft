import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { elegantFadeIn, staggerFadeIn } from './dashboardAnimations'

export const ActivityOverview = ({ stats }) => {
  if (!stats) return null

  const activityItems = [
    { label: "Last 7 Days", value: stats.resumesLast7Days || 0, sublabel: "Resumes" },
    { label: "Last 7 Days", value: stats.analysesLast7Days || 0, sublabel: "Analyses" },
    { label: "Last 30 Days", value: stats.resumesLast30Days || 0, sublabel: "Resumes" },
    { label: "Last 30 Days", value: stats.analysesLast30Days || 0, sublabel: "Analyses" },
    { 
      label: "Score Trend", 
      value: stats.scoreImprovement !== null ? (
        <div className="flex items-center justify-center gap-1">
          {stats.scoreImprovement > 0 ? (
            <ArrowUp className="h-4 w-4 text-green-500" />
          ) : stats.scoreImprovement < 0 ? (
            <ArrowDown className="h-4 w-4 text-red-500" />
          ) : null}
          <span>{stats.scoreImprovement > 0 ? '+' : ''}{stats.scoreImprovement?.toFixed(1)}%</span>
        </div>
      ) : "No data",
      sublabel: stats.scoreImprovement !== null ? "vs previous period" : stats.analysesLast7Days > 0 ? "Need more data" : "Analyze resumes"
    },
    { label: "Profile", value: `${stats.profileCompletion || 0}%`, sublabel: "Complete" }
  ]

  return (
    <motion.section 
      variants={elegantFadeIn}
      initial="initial"
      animate="animate"
      aria-label="Activity Trends"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activityItems.map((item, index) => (
              <motion.div
                key={index}
                className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/50 relative overflow-hidden group/item transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/20 dark:hover:border-primary/30"
                variants={staggerFadeIn}
                custom={index}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 dark:from-primary/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 relative z-10">{item.label}</p>
                <motion.div 
                  className="text-2xl font-bold text-slate-900 dark:text-slate-100 relative z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {item.value}
                </motion.div>
                {item.sublabel && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 relative z-10">{item.sublabel}</p>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

