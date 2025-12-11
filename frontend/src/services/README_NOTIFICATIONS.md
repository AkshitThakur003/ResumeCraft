# Unified Notification System

This document explains how to use the unified notification system that handles both toasts (temporary) and notifications (persistent).

## Overview

The notification system automatically routes messages to:
- **Toasts**: Temporary popup messages that auto-dismiss
- **Notifications**: Persistent messages saved in the notification panel
- **Both**: Important messages that show a toast AND save to history

## Basic Usage

### Import the service

```javascript
import notify, { notificationHelpers } from '../services/notificationService'
```

### Simple Toast (Temporary Only)

```javascript
// Quick success feedback - toast only, no notification
notify({ 
  message: 'Settings saved!', 
  type: 'success', 
  duration: 3000 
})

// Or use the helper
notificationHelpers.toast('Settings saved!', 'success', 3000)
```

### Toast + Notification (Important Event)

```javascript
// Resume analysis complete - show toast AND save to notifications
notify({ 
  message: 'Resume analysis complete! View your results.', 
  type: 'success', 
  priority: 'high',
  metadata: { resumeId: '123' }
})

// Or use the helper
notificationHelpers.success('Resume analysis complete!', {
  priority: 'high',
  metadata: { resumeId: '123' }
})
```

### Error (Always Saved)

```javascript
// Errors are automatically saved to notifications
notify({ 
  message: 'Failed to process resume. Please try again.', 
  type: 'error' 
})

// Or use the helper
notificationHelpers.error('Failed to process resume. Please try again.')
```

### Notification Only (Background Event)

```javascript
// System update - notification only, no toast
notify({ 
  message: 'System maintenance scheduled for tomorrow 2-4 AM', 
  type: 'info',
  category: 'systemUpdate',
  syncToNotifications: true
})

// Or use the helper
notificationHelpers.notification(
  'System maintenance scheduled', 
  'info',
  { priority: 'medium' }
)
```

## Advanced Options

### Full Options Object

```javascript
notify({
  message: 'Your message here',        // Required
  type: 'success',                     // 'success', 'error', 'warning', 'info', 'rateLimit'
  priority: 'medium',                  // 'low', 'medium', 'high', 'critical'
  category: 'resumeAnalysis',          // For routing decisions
  persist: false,                       // Force save to notifications
  duration: 5000,                       // Toast duration in ms
  metadata: { resumeId: '123' },       // Additional data
  syncToNotifications: undefined       // true/false/undefined (auto-detect)
})
```

## Automatic Routing Rules

The system automatically decides what to do based on:

1. **Type**: Errors are always saved to notifications
2. **Priority**: High/Critical priority messages are saved
3. **Duration**: Messages with duration ≥ 5000ms are usually important
4. **Category**: Some categories are toast-only or notification-only

### Default Behavior

- **Errors** → Toast + Notification (always)
- **Success (short)** → Toast only
- **Success (important)** → Toast + Notification
- **Warnings** → Toast + Notification (if duration ≥ 5000ms)
- **Info (system)** → Toast only
- **Info (important)** → Toast + Notification

## Migration from Old System

### Old Way (Still Works)

```javascript
const { addToast } = useGlobalToast()
addToast('Settings saved!', 'success', 3000)
```

### New Way (Recommended)

```javascript
import notify from '../services/notificationService'
notify({ message: 'Settings saved!', type: 'success', duration: 3000 })
```

### Explicit Sync to Notifications

If you want to explicitly sync a toast to notifications:

```javascript
const { addToast } = useGlobalToast()
addToast(
  'Resume analysis complete!', 
  'success', 
  5000,
  { syncToNotifications: true, metadata: { resumeId: '123' } }
)
```

## Examples by Use Case

### User Action Feedback

```javascript
// Quick feedback - toast only
notify({ message: 'Resume deleted', type: 'success', duration: 3000 })
```

### Background Process Complete

```javascript
// Important completion - toast + notification
notify({ 
  message: 'Cover letter generated successfully!', 
  type: 'success',
  priority: 'high',
  metadata: { coverLetterId: '456' }
})
```

### System Error

```javascript
// Error - automatically saved
notify({ 
  message: 'Unable to connect to server. Please check your connection.', 
  type: 'error' 
})
```

### System Maintenance

```javascript
// Background notification - no toast
notify({ 
  message: 'Scheduled maintenance: System will be unavailable tomorrow 2-4 AM', 
  type: 'info',
  category: 'systemUpdate',
  syncToNotifications: true
})
```

## Helper Functions

```javascript
import { notificationHelpers } from '../services/notificationService'

// Quick helpers
notificationHelpers.success('Operation completed!')
notificationHelpers.error('Something went wrong!')
notificationHelpers.warning('Please review your input')
notificationHelpers.info('Information message')

// Toast only
notificationHelpers.toast('Quick message', 'success', 2000)

// Notification only
notificationHelpers.notification('Background update', 'info')
```

## Best Practices

1. **Use toasts for immediate feedback** on user actions
2. **Use notifications for important events** that users might want to review later
3. **Always save errors** - they're automatically saved
4. **Use metadata** to make notifications actionable (e.g., resumeId for navigation)
5. **Don't overuse notifications** - only save important messages
6. **Use appropriate priorities** - helps with routing decisions

## Integration

The system is already integrated with:
- ✅ ToastContext (shows toasts)
- ✅ NotificationsContext (saves to notification panel)
- ✅ Event system (listens for custom events)

No additional setup required!

