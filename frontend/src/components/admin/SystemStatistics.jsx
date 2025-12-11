import React from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserCheck, UserX, Shield, Briefcase, 
  TrendingUp, Calendar, Activity
} from 'lucide-react'
import { StatsCard, Card, CardHeader, CardTitle, CardContent } from '../ui'
import { useAdminStats } from '../../hooks/useAdminStats'
import { fadeInUp, staggerContainer } from '../ui/motionVariants'

export const SystemStatistics = () => {
  const { stats, loading } = useAdminStats()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const statsData = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      trend: 'neutral',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: UserCheck,
      trend: 'positive',
      gradient: 'from-emerald-500 to-teal-500',
      change: `${((stats.activeUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% of total`,
    },
    {
      title: 'Inactive Users',
      value: stats.inactiveUsers,
      icon: UserX,
      trend: 'negative',
      gradient: 'from-red-500 to-pink-500',
    },
    {
      title: 'Admin Users',
      value: stats.adminUsers,
      icon: Shield,
      trend: 'neutral',
      gradient: 'from-purple-500 to-indigo-500',
    },
  ]

  const roleStats = [
    {
      title: 'Regular Users',
      value: stats.regularUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Recruiters',
      value: stats.recruiterUsers,
      icon: Briefcase,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      title: 'Admins',
      value: stats.adminUsers,
      icon: Shield,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ]

  const timeStats = [
    {
      title: 'New Today',
      value: stats.newUsersToday,
      icon: Calendar,
      period: '24 hours',
    },
    {
      title: 'New This Week',
      value: stats.newUsersThisWeek,
      icon: TrendingUp,
      period: '7 days',
    },
    {
      title: 'New This Month',
      value: stats.newUsersThisMonth,
      icon: Activity,
      period: '30 days',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Main Stats Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            custom={index}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 rounded-xl blur-xl transition-opacity duration-300`} />
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              trend={stat.trend}
              className="relative z-10"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Role Distribution & Time Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleStats.map((role, index) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${role.bgColor}`}>
                        <role.icon className={`h-5 w-5 ${role.color}`} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {role.title}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {stats.totalUsers > 0
                            ? `${((role.value / stats.totalUsers) * 100).toFixed(1)}% of total`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {role.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Time-based Stats */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeStats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {stat.title}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {stat.period}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

