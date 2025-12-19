/**
 * Hook for notification polling (fallback when SSE unavailable)
 */

import { useRef, useCallback } from 'react'
import { logger } from '../../utils/logger'

export const useNotificationPolling = (fetchNotifications) => {
  const pollingIntervalRef = useRef(null)
  const userActivityTimeoutRef = useRef(null)

  /**
   * Start polling as fallback
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return // Already polling
    }

    const pollInterval = 3 * 60 * 1000 // 3 minutes
    const poll = () => {
      fetchNotifications()
    }

    // Initial poll
    poll()
    
    // Set up polling interval
    pollingIntervalRef.current = setInterval(poll, pollInterval)
    logger.debug('Started polling for notifications (fallback mode)')
  }, [fetchNotifications])

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      logger.debug('Stopped polling for notifications')
    }
    if (userActivityTimeoutRef.current) {
      clearTimeout(userActivityTimeoutRef.current)
      userActivityTimeoutRef.current = null
    }
  }, [])

  return {
    startPolling,
    stopPolling,
  }
}

