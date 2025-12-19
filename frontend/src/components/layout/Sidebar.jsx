import React, { useMemo, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, FileText, Settings, Mail, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { cn } from '../../utils'
import { createSidebarPulseVariants } from '../ui/motionVariants'
import { useReducedMotion } from 'framer-motion'
import { Button } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { ICON_SIZES, ICON_STROKE_WIDTH } from '../../constants/icons'

const baseNavigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Cover Letters', href: '/cover-letters', icon: Mail },
  { name: 'Settings', href: '/profile', icon: Settings },
]

/**
 * Sidebar component - Memoized to prevent unnecessary re-renders
 */
export const Sidebar = React.memo(({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const { user } = useAuth()
  
  // Memoize navigation array to prevent recreation on every render
  const navigation = useMemo(() => {
    return user?.role === 'admin' 
      ? [...baseNavigation, { name: 'Admin', href: '/admin', icon: Shield }]
      : baseNavigation
  }, [user?.role])

  // Memoize active pathname check
  const activePath = useMemo(() => location.pathname, [location.pathname])

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
        </motion.div>
      )}

      {/* Sidebar */}
      <motion.div 
        className={cn(
          'fixed inset-y-0 left-0 z-50',
          // Responsive width: smaller on mobile, full width on desktop
          'w-72 sm:w-80',
          // Desktop: collapsed width is 80px (20 * 4), expanded is 256px (64 * 4)
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile: transform based on sidebarOpen state
          'transform transition-all duration-300 ease-in-out lg:transform-none',
          // Desktop: always visible
          'lg:translate-x-0',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Glassmorphism sidebar */}
        <div className="h-full bg-background/80 backdrop-blur-xl border-r border-border shadow-2xl lg:shadow-none flex flex-col">
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-3 p-6 border-b border-border transition-all duration-300",
            isCollapsed && "justify-center px-2"
          )}>
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 flex-shrink-0 p-1.5">
              <FileText className="h-10 w-10 text-primary" strokeWidth={ICON_STROKE_WIDTH.normal} />
            </div>
            <motion.h1 
              className={cn(
                "h4 text-foreground whitespace-nowrap",
                isCollapsed && "lg:hidden"
              )}
              initial={false}
              animate={{
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : 'auto',
              }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            >
              ResumeCraft
            </motion.h1>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 p-4 space-y-1 overflow-y-auto transition-all duration-300",
            isCollapsed && "px-2"
          )}>
            {navigation.map((item) => {
              // Check if route is active - support nested routes
              let isActive = false
              if (item.href === '/resumes') {
                isActive = activePath.startsWith('/resumes')
              } else if (item.href === '/cover-letters') {
                isActive = activePath.startsWith('/cover-letters')
              } else if (item.href === '/admin') {
                isActive = activePath.startsWith('/admin')
              } else {
                isActive = activePath === item.href
              }
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                    isCollapsed && 'justify-center px-2',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {/* Active Background with Gradient */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary shadow-md shadow-primary/20"
                      layoutId="activeNav"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className={cn("relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 flex-shrink-0", isActive && "text-primary-foreground")}>
                    {React.createElement(item.icon, { className: ICON_SIZES.md, strokeWidth: ICON_STROKE_WIDTH.normal })}
                  </span>
                  <motion.span 
                    className={cn("relative z-10 font-medium whitespace-nowrap", isActive && "text-primary-foreground")}
                    initial={false}
                    animate={{
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? 0 : 'auto',
                      marginLeft: isCollapsed ? 0 : '0.75rem',
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  >
                    {item.name}
                  </motion.span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className={cn(
            "p-4 border-t border-border transition-all duration-300",
            isCollapsed && "px-2"
          )}>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 backdrop-blur-sm border border-border text-center"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <p className="font-medium text-foreground">ResumeCraft v1.0</p>
                  <p className="mt-1 opacity-70">Crafted for your career</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Collapse/Expand Toggle Button - Desktop only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex w-full mt-2 h-10 rounded-xl border border-border text-muted-foreground hover:bg-accent transition-all duration-200",
                isCollapsed && "justify-center"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              >
                {isCollapsed ? (
                  <ChevronRight className={ICON_SIZES.md} strokeWidth={ICON_STROKE_WIDTH.normal} />
                ) : (
                  <ChevronLeft className={ICON_SIZES.md} strokeWidth={ICON_STROKE_WIDTH.normal} />
                )}
              </motion.div>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
})

Sidebar.displayName = 'Sidebar'

