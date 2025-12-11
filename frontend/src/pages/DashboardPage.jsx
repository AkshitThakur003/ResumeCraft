import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { DashboardSkeleton, ErrorState } from '../components/ui'
import { staggerContainer } from '../components/ui/motionVariants'
import {
  useDashboardData,
  DashboardHeader,
  DashboardStats,
  QuickActions,
  ActivityOverview,
  ScoreTrendsChart,
  SectionScoresChart,
  AnalysisTypeChart,
  SectionPerformanceChart,
  TopRecommendations,
  RecentActivity
} from '../components/dashboard'

export const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    stats,
    trends,
    insights,
    recentActivity,
    loading,
    error,
    isRefreshing,
    lastRefreshTime,
    statChanges,
    refreshDashboardData,
    loadDashboardData
  } = useDashboardData()

  const handleChartClick = () => {
    navigate('/resumes')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify({ stats, trends, insights }, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Unable to load dashboard"
          message={error}
          onRetry={loadDashboardData}
          retryLabel="Try Again"
        />
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-8 relative max-w-7xl mx-auto"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      role="main"
      aria-label="Dashboard"
    >
      {/* Decorative Ambient Background with Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Header */}
      <DashboardHeader
        user={user}
        lastRefreshTime={lastRefreshTime}
        onRefresh={() => refreshDashboardData(false)}
        onExport={handleExport}
        loading={loading}
        isRefreshing={isRefreshing}
        stats={stats}
        trends={trends}
        insights={insights}
      />

      {/* Primary Stats */}
      <DashboardStats stats={stats} statChanges={statChanges} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Analytics & Insights Section */}
      <div className="space-y-6 mb-8">
        {/* Activity Overview */}
        <ActivityOverview stats={stats} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScoreTrendsChart 
            trends={trends} 
            loading={loading} 
            onChartClick={handleChartClick}
          />
          <SectionScoresChart 
            trends={trends} 
            loading={loading}
          />
          <AnalysisTypeChart 
            trends={trends} 
            loading={loading}
          />
          <SectionPerformanceChart 
            trends={trends} 
            loading={loading}
            onChartClick={handleChartClick}
          />
        </div>

        {/* Top Recommendations */}
        <TopRecommendations insights={insights} />
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={recentActivity} />
    </motion.div>
  )
}
