import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkEndpointExists,
  markEndpointAsMissing,
  formatNotification,
  formatNotifications,
} from './notificationUtils'

// Mock formatRelativeTime from utils
vi.mock('../../utils', () => ({
  formatRelativeTime: (date) => {
    if (!date) return 'N/A'
    const now = new Date('2024-01-15T12:00:00Z')
    const dateObj = new Date(date)
    const diffInSeconds = Math.floor((now - dateObj) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  },
}))

describe('notificationUtils', () => {
  beforeEach(() => {
    // Reset localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('checkEndpointExists', () => {
    it('returns true when endpoint is not marked as missing', () => {
      expect(checkEndpointExists()).toBe(true)
    })

    it('returns false when endpoint is marked as missing', () => {
      markEndpointAsMissing()
      expect(checkEndpointExists()).toBe(false)
    })
  })

  describe('markEndpointAsMissing', () => {
    it('marks endpoint as missing in localStorage', () => {
      markEndpointAsMissing()
      
      const stored = localStorage.getItem('notificationsEndpointExists')
      expect(stored).toBe('false')
    })
  })

  describe('formatNotification', () => {
    it('formats notification with all fields', () => {
      const notification = {
        _id: '123',
        type: 'success',
        title: 'Test Title',
        message: 'Test message',
        createdAt: '2024-01-15T11:00:00Z',
        read: false,
        metadata: { key: 'value' },
      }

      const formatted = formatNotification(notification)

      expect(formatted).toEqual({
        id: '123',
        type: 'success',
        title: 'Test Title',
        message: 'Test message',
        timestamp: expect.any(String),
        createdAt: '2024-01-15T11:00:00Z',
        read: false,
        metadata: { key: 'value' },
      })
    })

    it('uses id field if _id is missing', () => {
      const notification = {
        id: '456',
        message: 'Test',
        createdAt: '2024-01-15T11:00:00Z',
      }

      const formatted = formatNotification(notification)

      expect(formatted.id).toBe('456')
    })

    it('uses default values for optional fields', () => {
      const notification = {
        _id: '123',
        title: 'Test',
        message: 'Test message',
      }

      const formatted = formatNotification(notification)

      expect(formatted.type).toBe('info')
      expect(formatted.read).toBe(false)
      expect(formatted.metadata).toEqual({})
    })

    it('uses timestamp if createdAt is missing', () => {
      const notification = {
        _id: '123',
        message: 'Test',
        timestamp: '2024-01-15T11:00:00Z',
      }

      const formatted = formatNotification(notification)

      expect(formatted.createdAt).toBe('2024-01-15T11:00:00Z')
    })
  })

  describe('formatNotifications', () => {
    it('formats array of notifications', () => {
      const notifications = [
        { _id: '1', message: 'First', createdAt: '2024-01-15T11:00:00Z' },
        { _id: '2', message: 'Second', createdAt: '2024-01-15T12:00:00Z' },
      ]

      const formatted = formatNotifications(notifications)

      expect(formatted).toHaveLength(2)
      expect(formatted[0].id).toBe('1')
      expect(formatted[1].id).toBe('2')
    })

    it('returns empty array for empty input', () => {
      const formatted = formatNotifications([])
      expect(formatted).toEqual([])
    })
  })
})

