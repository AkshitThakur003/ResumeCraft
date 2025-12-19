import React, { useState, useCallback, useMemo } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { ICON_SIZES, ICON_STROKE_WIDTH } from '../../constants/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { ConfirmModal, Breadcrumbs, NotificationsCenter, Button } from '../ui'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcut'
import { PageTransition } from './PageTransition'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const DashboardLayout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login')
  }, [logout, navigate])

  // Memoize callbacks to prevent unnecessary re-renders
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), [])
  const handleToggleCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])
  const handleOpenSidebar = useCallback(() => setSidebarOpen(true), [])
  const handleOpenLogoutModal = useCallback(() => setShowLogoutModal(true), [])
  const handleCloseLogoutModal = useCallback(() => setShowLogoutModal(false), [])
  const handleOpenNotifications = useCallback(() => setNotificationsOpen(true), [])
  const handleCloseNotifications = useCallback(() => setNotificationsOpen(false), [])

  // Memoize keyboard shortcut callbacks
  const handleEscapeKey = useCallback(() => {
    if (sidebarOpen) setSidebarOpen(false)
    if (showLogoutModal) setShowLogoutModal(false)
  }, [sidebarOpen, showLogoutModal])

  const handleToggleSidebarKey = useCallback((e) => {
    e.preventDefault()
    if (window.innerWidth < 1024) {
      setSidebarOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => !prev)
    }
  }, [])

  // Keyboard shortcuts for navigation
  const keyboardShortcuts = useMemo(() => [
    {
      key: 'Escape',
      callback: handleEscapeKey,
      enabled: true,
    },
    {
      key: 'b',
      ctrlKey: true,
      callback: handleToggleSidebarKey,
      enabled: true,
    },
  ], [handleEscapeKey, handleToggleSidebarKey])

  useKeyboardShortcuts(keyboardShortcuts)

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <AnimatePresence>
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={sidebarCollapsed}
          onClose={handleCloseSidebar}
          onToggleCollapse={handleToggleCollapse}
        />
      </AnimatePresence>

      {/* Main content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        <Header 
          isSidebarCollapsed={sidebarCollapsed}
          onMenuClick={handleOpenSidebar}
          onLogoutClick={handleOpenLogoutModal}
          onNotificationsClick={handleOpenNotifications}
        />

        {/* Page content with animation */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
           <Breadcrumbs className="mb-6" />
           <PageTransition>
              <Outlet />
           </PageTransition>
        </main>
      </div>

      {/* Logout confirmation modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleCloseLogoutModal}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Stay"
      />

      {/* Notifications Center */}
      <NotificationsCenter 
        isOpen={notificationsOpen} 
        onClose={handleCloseNotifications} 
      />
    </div>
  )
}

// Alternative minimal layout for auth pages
export const AuthLayout = () => {
  const { toggleTheme, getThemeIcon, isDark } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
       {/* Background Ambient Orbs */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with glassmorphism */}
      <motion.header 
        className="bg-background/50 backdrop-blur-md border-b border-border z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105 p-1.5">
              <FileText className="h-10 w-10 text-primary" strokeWidth={ICON_STROKE_WIDTH.normal} />
            </div>
            <span className="h4 text-foreground">
              ResumeCraft
            </span>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-accent text-muted-foreground"
          >
            <motion.span 
              className="text-lg"
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            >
              {getThemeIcon()}
            </motion.span>
          </Button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.2 }}
          className="w-full max-w-md sm:max-w-lg"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground z-10">
         © 2025 ResumeCraft. All rights reserved.
      </footer>
    </div>
  )
}

// Landing page layout with enhanced design
export const LandingLayout = () => {
  const { toggleTheme, getThemeIcon, isDark } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans transition-colors duration-300">
      {/* Header with glassmorphism */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 transition-transform group-hover:scale-105 p-1.5">
              <FileText className="h-8 w-8 text-primary" strokeWidth={ICON_STROKE_WIDTH.normal} />
            </div>
            <span className="h5 text-foreground">
              ResumeCraft
            </span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hover:bg-accent text-muted-foreground"
            >
              <motion.span 
                className="text-base"
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              >
                {getThemeIcon()}
              </motion.span>
            </Button>
            
            {/* Mobile: Show condensed buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full px-3 text-foreground">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full px-3 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-none">Start</Button>
              </Link>
            </div>
            
            {/* Desktop: Full buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="rounded-full px-5 hover:bg-accent text-foreground">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full px-5 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground border-none">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 p-2">
              <FileText className="h-6 w-6 text-primary" strokeWidth={ICON_STROKE_WIDTH.normal} />
            </div>
            <span className="h4 text-foreground">ResumeCraft</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2025 ResumeCraft. Building careers with AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
