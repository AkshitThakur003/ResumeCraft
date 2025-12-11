import React from 'react'
import { motion } from 'framer-motion'
import { QuickActionCard } from '../ui'
import { Sparkles, FileUp, FileText, BarChart3, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { elegantFadeIn, staggerFadeIn } from './dashboardAnimations'

export const QuickActions = () => {
  const navigate = useNavigate()

  const quickActions = [
    {
      title: 'Upload Resume',
      description: 'Add a new resume',
      icon: FileUp,
      onClick: () => navigate('/resumes')
    },
    {
      title: 'View Resumes',
      description: 'Manage your resumes',
      icon: FileText,
      onClick: () => navigate('/resumes')
    },
    {
      title: 'View Analytics',
      description: 'Check your progress',
      icon: BarChart3,
      onClick: () => navigate('/profile')
    },
    {
      title: 'Compare Resumes',
      description: 'Compare versions',
      icon: Briefcase,
      onClick: () => navigate('/compare')
    }
  ]

  return (
    <motion.section 
      variants={elegantFadeIn}
      initial="initial"
      animate="animate"
      className="mb-8"
      aria-label="Quick Actions"
    >
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          <Sparkles className="h-5 w-5 text-amber-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div 
            key={action.title} 
            variants={staggerFadeIn}
            custom={index}
            whileHover={{ 
              scale: 1.05, 
              y: -4,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
            <QuickActionCard
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

