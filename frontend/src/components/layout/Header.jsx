import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Button } from '../ui'
import { UserMenu } from './UserMenu'
import { useReducedMotion } from 'framer-motion'
import { ICON_SIZES, ICON_STROKE_WIDTH } from '../../constants/icons'

const baseNavigation = [
  { name: 'Home', href: '/dashboard', icon: null },
  { name: 'Resumes', href: '/resumes', icon: null },
  { name: 'Settings', href: '/profile', icon: null },
]

/**
 * Header component for the main application layout
 * Memoized to prevent unnecessary re-renders
 * @param {Object} props - Component props
 * @param {Function} props.onMenuClick - Callback when menu button is clicked
 * @param {Function} props.onLogoutClick - Callback when logout is triggered
 * @param {Function} props.onNotificationsClick - Callback when notifications are clicked
 * @param {boolean} props.isSidebarCollapsed - Whether sidebar is collapsed
 */
export const Header = React.memo(({ onMenuClick, onLogoutClick, onNotificationsClick, isSidebarCollapsed }) => {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  // Memoize page title lookup
  const pageTitle = useMemo(() => {
    return baseNavigation.find(item => item.href === location.pathname)?.name || 'Home'
  }, [location.pathname])

  return (
    <motion.header 
      className="bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-30 transition-all duration-300 ease-in-out"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden h-10 w-10 rounded-xl border border-border text-muted-foreground"
        >
          <Menu className={ICON_SIZES.md} strokeWidth={ICON_STROKE_WIDTH.normal} aria-hidden="true" />
        </Button>

        {/* Page title with breadcrumb effect */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
           <h2 className="h5 text-foreground truncate">
             {pageTitle}
           </h2>
        </div>

        {/* User menu */}
        <UserMenu 
          onLogoutClick={onLogoutClick}
          onNotificationsClick={onNotificationsClick}
        />
      </div>
    </motion.header>
  )
})

Header.displayName = 'Header'

