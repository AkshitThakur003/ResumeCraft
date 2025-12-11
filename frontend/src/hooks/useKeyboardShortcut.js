import { useEffect } from 'react'

/**
 * Hook for handling keyboard shortcuts
 * @param {string} key - The key to listen for (e.g., 'Escape', 'Enter', 'k')
 * @param {Function} callback - Function to call when shortcut is pressed
 * @param {Object} options - Options for the shortcut
 * @param {boolean} options.ctrlKey - Require Ctrl key
 * @param {boolean} options.shiftKey - Require Shift key
 * @param {boolean} options.altKey - Require Alt key
 * @param {boolean} options.metaKey - Require Meta/Cmd key
 * @param {boolean} options.enabled - Whether shortcut is enabled
 */
export const useKeyboardShortcut = (
  key,
  callback,
  options = {}
) => {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    metaKey = false,
    enabled = true,
  } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      // Check modifier keys
      if (ctrlKey && !e.ctrlKey && !e.metaKey) return
      if (metaKey && !e.metaKey && !e.ctrlKey) return
      if (shiftKey && !e.shiftKey) return
      if (altKey && !e.altKey) return

      // Check main key
      if (e.key === key || e.key.toLowerCase() === key.toLowerCase()) {
        // Don't trigger if user is typing in an input/textarea
        const isInput = e.target.tagName === 'INPUT' || 
                      e.target.tagName === 'TEXTAREA' ||
                      e.target.isContentEditable
        if (isInput && key !== 'Escape') return

        e.preventDefault()
        callback(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, ctrlKey, shiftKey, altKey, metaKey, enabled])
}

/**
 * Hook for multiple keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    if (!shortcuts || shortcuts.length === 0) return

    const handleKeyDown = (e) => {
      for (const shortcut of shortcuts) {
        const {
          key,
          callback,
          ctrlKey = false,
          shiftKey = false,
          altKey = false,
          metaKey = false,
          enabled = true,
        } = shortcut

        if (!enabled) continue

        // Check modifier keys
        if (ctrlKey && !e.ctrlKey && !e.metaKey) continue
        if (metaKey && !e.metaKey && !e.ctrlKey) continue
        if (shiftKey && !e.shiftKey) continue
        if (altKey && !e.altKey) continue

        // Check main key
        if (e.key === key || e.key.toLowerCase() === key.toLowerCase()) {
          // Don't trigger if user is typing in an input/textarea
          const isInput = e.target.tagName === 'INPUT' || 
                        e.target.tagName === 'TEXTAREA' ||
                        e.target.isContentEditable
          if (isInput && key !== 'Escape') continue

          e.preventDefault()
          callback(e)
          break // Only trigger first matching shortcut
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export default useKeyboardShortcut

