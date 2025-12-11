import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { Button, Tooltip } from '../ui'
import { useAuth } from '../../contexts/AuthContext'
import { useNotificationsContext } from '../../contexts/NotificationsContext'
import { useReducedMotion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'

export const UserMenu = ({ onLogoutClick, onNotificationsClick }) => {
  const { user } = useAuth()
  const { unreadCount = 0, totalCount = 0 } = useNotificationsContext()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const getInteractiveMotion = (hoverScale = 1.05, tapScale = 0.95) => {
    if (shouldReduceMotion) return {}
    const props = { whileHover: { scale: hoverScale } }
    if (typeof tapScale === 'number') {
      props.whileTap = { scale: tapScale }
    }
    return props
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <ThemeToggle />

      {/* Notifications Bell */}
      <motion.div
        {...getInteractiveMotion(1.05, 0.95)}
      >
        <Tooltip
          content={
            unreadCount > 0
              ? `${unreadCount} unread${unreadCount > 1 ? 's' : ''}${totalCount > unreadCount ? ` • ${totalCount} total` : ''}`
              : totalCount > 0
              ? `${totalCount} notification${totalCount > 1 ? 's' : ''}`
              : 'No notifications'
          }
          position="bottom"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            aria-label="Notifications"
            className="relative h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/50 bg-background/50 backdrop-blur-sm dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            {/* Notification badge - only show when there are unread notifications */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </Tooltip>
      </motion.div>

      {/* User Avatar Dropdown */}
      <DropdownMenu.Root open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            className="flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80 transition-colors dark:border-slate-700 dark:hover:bg-slate-800 outline-none"
            {...getInteractiveMotion(1.02, 0.98)}
          >
            <div className="h-8 w-8 rounded-lg bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center text-sm font-semibold shadow-sm flex-shrink-0">
              {user?.profilePicture?.url ? (
                <img 
                  src={user.profilePicture.url} 
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <>
                  {(user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                  {user?.lastName?.[0]?.toUpperCase() || ''}
                </>
              )}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium leading-none truncate max-w-24 md:max-w-none text-foreground">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.name || 'User'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block flex-shrink-0" />
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50"
            sideOffset={8}
            align="end"
          >
            <DropdownMenu.Item
              asChild
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 outline-none cursor-pointer"
            >
              <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                <User className="h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenu.Item>
            
            <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            
            <DropdownMenu.Item
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 outline-none cursor-pointer"
              onSelect={() => {
                setUserMenuOpen(false)
                onLogoutClick()
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

