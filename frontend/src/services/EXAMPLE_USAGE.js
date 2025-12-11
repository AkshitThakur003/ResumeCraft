/**
 * Example Usage of Unified Notification Service
 * 
 * This file shows examples of how to use the new notification system
 * in different scenarios throughout the app.
 */

import notify, { notificationHelpers } from './notificationService'

// ============================================
// Example 1: Resume Analysis Complete
// ============================================
// OLD WAY:
// showToast('Analysis completed!', 'success')

// NEW WAY (Toast + Notification):
export const notifyResumeAnalysisComplete = (resumeId, resumeName) => {
  notify({
    message: `Resume analysis complete for "${resumeName}"! View your results.`,
    type: 'success',
    priority: 'high',
    category: 'resumeAnalysis',
    metadata: { resumeId },
    duration: 5000
  })
}

// ============================================
// Example 2: Cover Letter Generated
// ============================================
export const notifyCoverLetterGenerated = (coverLetterId) => {
  notify({
    message: 'Cover letter generated successfully!',
    type: 'success',
    priority: 'high',
    category: 'coverLetter',
    metadata: { coverLetterId },
    duration: 5000
  })
}

// ============================================
// Example 3: Error Handling
// ============================================
// Errors are automatically saved to notifications
export const notifyError = (errorMessage) => {
  notify({
    message: errorMessage || 'An error occurred. Please try again.',
    type: 'error',
    priority: 'high' // Errors are always high priority
  })
}

// ============================================
// Example 4: Quick Success Feedback (Toast Only)
// ============================================
export const notifyQuickSuccess = (message) => {
  notify({
    message,
    type: 'success',
    duration: 3000,
    syncToNotifications: false // Explicitly no notification
  })
  
  // Or use helper
  // notificationHelpers.toast(message, 'success', 3000)
}

// ============================================
// Example 5: System Update (Notification Only)
// ============================================
export const notifySystemUpdate = (message) => {
  notify({
    message,
    type: 'info',
    category: 'systemUpdate',
    syncToNotifications: true // Notification only, no toast
  })
}

// ============================================
// Example 6: Using Helpers
// ============================================
export const examplesWithHelpers = {
  success: () => {
    notificationHelpers.success('Operation completed successfully!', {
      priority: 'high',
      metadata: { action: 'save' }
    })
  },
  
  error: () => {
    notificationHelpers.error('Failed to save changes. Please try again.')
  },
  
  warning: () => {
    notificationHelpers.warning('Your session will expire in 5 minutes.')
  },
  
  info: () => {
    notificationHelpers.info('New features available! Check them out.')
  },
  
  toastOnly: () => {
    notificationHelpers.toast('Quick message', 'success', 2000)
  },
  
  notificationOnly: () => {
    notificationHelpers.notification('Background process completed', 'success')
  }
}

// ============================================
// Example 7: Migration Pattern
// ============================================
// If you have existing code using useGlobalToast:

// BEFORE:
/*
import { useGlobalToast } from '../contexts/ToastContext'
const { addToast } = useGlobalToast()
addToast('Settings saved!', 'success', 3000)
*/

// AFTER (Option 1 - Use new service):
/*
import notify from '../services/notificationService'
notify({ message: 'Settings saved!', type: 'success', duration: 3000 })
*/

// AFTER (Option 2 - Keep using addToast, but with sync option):
/*
import { useGlobalToast } from '../contexts/ToastContext'
const { addToast } = useGlobalToast()
addToast('Resume analysis complete!', 'success', 5000, { 
  syncToNotifications: true,
  metadata: { resumeId: '123' }
})
*/

// ============================================
// Example 8: Real-World Integration
// ============================================
// In ResumeAnalysisPage.jsx:

export const exampleResumeAnalysisIntegration = {
  // When analysis starts
  onAnalysisStart: () => {
    notificationHelpers.toast('Starting analysis...', 'info', 2000)
  },
  
  // When analysis completes
  onAnalysisComplete: (resumeId, resumeName) => {
    notify({
      message: `Analysis complete for "${resumeName}"!`,
      type: 'success',
      priority: 'high',
      category: 'resumeAnalysis',
      metadata: { resumeId },
      duration: 5000
    })
  },
  
  // When analysis fails
  onAnalysisError: (errorMessage) => {
    notify({
      message: errorMessage || 'Analysis failed. Please try again.',
      type: 'error'
    })
  }
}

// ============================================
// Example 9: Conditional Notifications
// ============================================
export const notifyConditionally = (isImportant, message) => {
  if (isImportant) {
    // Important: toast + notification
    notify({
      message,
      type: 'success',
      priority: 'high'
    })
  } else {
    // Quick feedback: toast only
    notificationHelpers.toast(message, 'success', 3000)
  }
}

// ============================================
// Example 10: With Metadata for Navigation
// ============================================
export const notifyWithNavigation = (resumeId) => {
  notify({
    message: 'Resume analysis complete! Click to view.',
    type: 'success',
    priority: 'high',
    metadata: { 
      resumeId,
      action: 'navigate',
      path: `/resumes/${resumeId}`
    }
  })
}

