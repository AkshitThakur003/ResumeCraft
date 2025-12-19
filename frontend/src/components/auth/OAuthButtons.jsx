import React from 'react'
import { motion } from 'framer-motion'
import { ProviderIcon } from './ProviderIcon'

/**
 * OAuth Buttons Component
 * Displays OAuth provider buttons for social login
 */
export const OAuthButtons = ({ providers, loading, error }) => {
  if (!loading && !error && providers.length === 0) {
    return null
  }

  const shouldShowDivider = !loading && !error && providers.length > 0

  return (
    <div className="space-y-4">
      {shouldShowDivider && (
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <span className="text-sm text-muted-foreground">Or continue with</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center text-sm text-muted-foreground">Loading options…</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-600 dark:text-red-300 text-center">{error}</div>
      )}

      {!loading && !error && providers.length > 0 && (
        <div className="grid gap-3">
          {providers.map((provider) => (
            <motion.a
              key={provider.id}
              href={provider.authUrl}
              className="w-full h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-all duration-200 group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ProviderIcon icon={provider.icon} name={provider.name} />
              <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200">
                Continue with {provider.name}
              </span>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}

