/**
 * Register Form Messages Component
 * Displays error and success messages
 */

import React from 'react'
import { motion } from 'framer-motion'

export const RegisterFormMessages = ({ error, generalError, successMessage }) => {
  return (
    <>
      {error && (
        <motion.div 
          className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      {generalError && (
        <motion.div 
          className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {generalError}
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {successMessage}
        </motion.div>
      )}
    </>
  )
}

