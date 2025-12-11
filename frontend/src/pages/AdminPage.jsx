import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Users, BarChart3, Activity, 
  Settings, TrendingUp, AlertCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, Button } from '../components/ui'
import { 
  UserManagement, 
  SystemStatistics, 
  UserDetailModal, 
  ActivityLogs,
  SystemSettings
} from '../components/admin'
import { staggerContainer, fadeInUp, pageVariants } from '../components/ui/motionVariants'
import { useToast } from '../components/ui'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const AdminPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const { showToast } = useToast()

  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleCloseUserModal = () => {
    setShowUserModal(false)
    setSelectedUser(null)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8 relative max-w-7xl mx-auto"
    >
      {/* Decorative Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"
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
          className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl"
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
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Manage users, monitor activity, and view system statistics
                </p>
              </div>
            </div>
          </div>
          <motion.div
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Logged in as</div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {user?.email}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Warning Banner for Admins */}
        <motion.div
          variants={fadeInUp}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Admin Access
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">
              You have full administrative access. Please use these privileges responsibly.
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={fadeInUp}>
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-6 py-3 text-sm font-medium transition-colors
                    ${isActive
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }
                  `}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <SystemStatistics />
              
              {/* Quick Actions */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => setActiveTab('users')}
                    >
                      <Users className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">Manage Users</div>
                        <div className="text-xs text-slate-500">View and manage all users</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => setActiveTab('activity')}
                    >
                      <Activity className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">View Activity</div>
                        <div className="text-xs text-slate-500">Monitor system activity</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => setActiveTab('settings')}
                    >
                      <Settings className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold">System Settings</div>
                        <div className="text-xs text-slate-500">Configure system options</div>
                      </div>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}

          {activeTab === 'users' && (
            <UserManagement onUserClick={handleUserClick} />
          )}

          {activeTab === 'activity' && (
            <ActivityLogs />
          )}

          {activeTab === 'settings' && (
            <SystemSettings />
          )}
        </motion.div>
      </AnimatePresence>

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        user={selectedUser}
      />
    </motion.div>
  )
}

