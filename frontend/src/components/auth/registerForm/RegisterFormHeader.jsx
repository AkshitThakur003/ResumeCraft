/**
 * Register Form Header Component
 */

import React from 'react'
import { motion } from 'framer-motion'
import { CardHeader, CardTitle } from '../../ui'
import { UserPlus } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export const RegisterFormHeader = () => {
  return (
    <CardHeader className="relative z-10">
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-slate-200 dark:border-white/10">
          <UserPlus className="h-8 w-8 text-blue-500 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
          Create Account
        </CardTitle>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Start your journey with us</p>
      </motion.div>
    </CardHeader>
  )
}

