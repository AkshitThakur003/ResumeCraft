import React from 'react'
import { AuthProvider } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { ErrorProvider } from '../../contexts/ErrorContext'
import { NotificationsProvider } from '../../contexts/NotificationsContext'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

/**
 * NetworkMonitor component - monitors network status
 */
const NetworkMonitor = () => {
  useNetworkStatus()
  return null
}

/**
 * AppProviders - Combines all context providers to reduce nesting
 * This improves performance by reducing provider re-render cascades
 */
export const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <ToastProvider>
            <ErrorProvider>
              <NetworkMonitor />
              {children}
            </ErrorProvider>
          </ToastProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

