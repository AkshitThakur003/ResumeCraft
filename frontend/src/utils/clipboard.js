/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        return successful
      } catch (err) {
        document.body.removeChild(textArea)
        return false
      }
    }
  } catch (err) {
    console.error('Failed to copy text:', err)
    return false
  }
}

/**
 * Copy object as JSON to clipboard
 * @param {Object} obj - Object to copy as JSON
 * @param {boolean} formatted - Whether to format JSON
 * @returns {Promise<boolean>} Success status
 */
export const copyObjectToClipboard = async (obj, formatted = true) => {
  try {
    const jsonString = formatted 
      ? JSON.stringify(obj, null, 2)
      : JSON.stringify(obj)
    return await copyToClipboard(jsonString)
  } catch (err) {
    console.error('Failed to copy object:', err)
    return false
  }
}

export default copyToClipboard

