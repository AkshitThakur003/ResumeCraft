import React, { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FileText } from 'lucide-react'
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

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (sidebarOpen) setSidebarOpen(false)
        if (showLogoutModal) setShowLogoutModal(false)
      },
      enabled: true,
    },
    {
      key: 'b',
      ctrlKey: true,
      callback: (e) => {
        // Cmd/Ctrl+B to toggle sidebar (mobile) or collapse (desktop)
        e.preventDefault()
        // On mobile, toggle open/close. On desktop, toggle collapse
        if (window.innerWidth < 1024) {
          setSidebarOpen(prev => !prev)
        } else {
          setSidebarCollapsed(prev => !prev)
        }
      },
      enabled: true,
    },
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <AnimatePresence>
        <Sidebar 
          isOpen={sidebarOpen} 
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />
      </AnimatePresence>

      {/* Main content */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        <Header 
          isSidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setSidebarOpen(true)}
          onLogoutClick={() => setShowLogoutModal(true)}
          onNotificationsClick={() => setNotificationsOpen(true)}
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
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Stay"
      />

      {/* Notifications Center */}
      <NotificationsCenter 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </div>
  )
}

// Alternative minimal layout for auth pages
export const AuthLayout = () => {
  const { toggleTheme, getThemeIcon, isDark } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
       {/* Background Ambient Orbs */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with glassmorphism */}
      <motion.header 
        className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20 transition-transform duration-300 group-hover:scale-105">
              <FileText className="h-6 w-6" strokeWidth={2} />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              ResumeCraft
            </span>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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
      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 z-10">
         © 2024 ResumeCraft. All rights reserved.
      </footer>
    </div>
  )
}

// Landing page layout with enhanced design
export const LandingLayout = () => {
  const { toggleTheme, getThemeIcon, isDark } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans transition-colors duration-300">
      {/* Header with glassmorphism */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white transition-transform group-hover:scale-105">
              <FileText className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              ResumeCraft
            </span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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
                <Button variant="ghost" size="sm" className="rounded-full px-3 text-slate-700 dark:text-slate-300">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="rounded-full px-3 shadow-lg shadow-brand-600/20 bg-brand-600 hover:bg-brand-700 text-white border-none">Start</Button>
              </Link>
            </div>
            
            {/* Desktop: Full buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="rounded-full px-5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full px-5 shadow-lg shadow-brand-600/20 bg-brand-600 hover:bg-brand-700 text-white border-none">Get Started</Button>
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
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-6 w-6 text-brand-600" />
            <span className="text-xl font-bold">ResumeCraft</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2024 ResumeCraft. Building careers with AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
