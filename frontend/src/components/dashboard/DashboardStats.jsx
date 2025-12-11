import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { StatsCard } from '../ui'
import { FileText, BarChart3, Award, Target } from 'lucide-react'
import { elegantFadeIn, staggerFadeIn, cardHover, cardTap } from './dashboardAnimations'

/**
 * DashboardStats component displays key statistics cards
 * Memoized to prevent unnecessary re-renders
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics data object
 * @param {number} props.stats.totalResumes - Total number of resumes
 * @param {number} props.stats.totalAnalyses - Total number of analyses
 * @param {number} props.stats.averageScore - Average score percentage
 * @param {number} props.stats.bestScore - Best score percentage
 * @param {number} props.stats.profileCompletion - Profile completion percentage
 * @param {Object} props.statChanges - Change data for statistics
 */
export const DashboardStats = React.memo(({ stats, statChanges }) => {
  if (!stats) return null

  // Memoize statsData to prevent recalculation on every render
  const statsData = useMemo(() => [
    { 
      title: "Total Resumes", 
      value: stats.totalResumes || 0, 
      icon: FileText, 
      change: statChanges.totalResumes?.change, 
      trend: statChanges.totalResumes?.trend || 'neutral' 
    },
    { 
      title: "Total Analyses", 
      value: stats.totalAnalyses || 0, 
      icon: BarChart3, 
      change: statChanges.totalAnalyses?.change, 
      trend: statChanges.totalAnalyses?.trend || 'neutral' 
    },
    { 
      title: "Average Score", 
      value: stats.averageScore !== null && stats.averageScore !== undefined ? `${stats.averageScore}%` : 'N/A', 
      icon: Award, 
      change: stats.scoreImprovement ? `${stats.scoreImprovement > 0 ? '+' : ''}${stats.scoreImprovement.toFixed(1)}%` : undefined, 
      trend: stats.scoreImprovement && stats.scoreImprovement > 0 ? 'positive' : stats.scoreImprovement && stats.scoreImprovement < 0 ? 'negative' : 'neutral' 
    },
    stats.bestScore !== null && stats.bestScore !== undefined 
      ? { title: "Best Score", value: `${stats.bestScore}%`, icon: Target }
      : { 
          title: "Profile Completion", 
          value: `${stats.profileCompletion || 0}%`, 
          icon: Target, 
          change: statChanges.profileCompletion?.change, 
          trend: statChanges.profileCompletion?.trend || 'neutral' 
        }
  ], [stats, statChanges])

  return (
    <motion.section 
      variants={elegantFadeIn}
      initial="initial"
      animate="animate"
      className="mb-8"
      aria-label="Key Statistics"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={staggerFadeIn}
            custom={index}
            whileHover={cardHover}
            whileTap={cardTap}
            className="relative"
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              trend={stat.trend}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if stats or statChanges actually changed
  return (
    prevProps.stats?.totalResumes === nextProps.stats?.totalResumes &&
    prevProps.stats?.totalAnalyses === nextProps.stats?.totalAnalyses &&
    prevProps.stats?.averageScore === nextProps.stats?.averageScore &&
    prevProps.stats?.bestScore === nextProps.stats?.bestScore &&
    prevProps.stats?.profileCompletion === nextProps.stats?.profileCompletion &&
    prevProps.statChanges === nextProps.statChanges
  )
})

