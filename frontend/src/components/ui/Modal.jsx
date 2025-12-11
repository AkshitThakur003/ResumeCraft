import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils'
import { Button } from './Button'

// Modal Overlay
const ModalOverlay = ({ isOpen, onClose, children, className }) => {
  const modalRef = useRef(null)
  const previousActiveElementRef = useRef(null)

  // Get all focusable elements within the modal
  const getFocusableElements = (element) => {
    if (!element) return []
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')
    return Array.from(element.querySelectorAll(focusableSelectors))
  }

  // Focus trap logic
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    const modalElement = modalRef.current
    const focusableElements = getFocusableElements(modalElement)
    
    if (focusableElements.length === 0) return

    // Store the element that had focus before modal opened
    previousActiveElementRef.current = document.activeElement

    // Focus the first focusable element
    const firstElement = focusableElements[0]
    firstElement?.focus()

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modalElement.addEventListener('keydown', handleTabKey)

    return () => {
      modalElement.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      // Use setTimeout to ensure the modal is fully closed before restoring focus
      setTimeout(() => {
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus()
        }
        previousActiveElementRef.current = null
      }, 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content - Bottom sheet on mobile, centered on desktop */}
      <div 
        className={cn(
          'relative bg-background shadow-lg max-h-[90vh] w-full overflow-y-auto',
          'rounded-t-2xl sm:rounded-lg',
          'sm:max-w-lg md:max-w-xl lg:max-w-2xl',
          'safe-area-inset',
          className
        )}
        role="document"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden py-2">
          <div className="drawer-handle" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

// Main Modal Component
export const Modal = ({ isOpen, onClose, children, className }) => {
  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className={className}>
      {children}
    </ModalOverlay>
  )
}

// Modal Components
export const ModalHeader = ({ children, className, onClose, showCloseButton = true }) => (
  <div className={cn('flex items-center justify-between p-4 sm:p-6 border-b', className)}>
    <div>{children}</div>
    {showCloseButton && (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8 sm:h-6 sm:w-6 rounded-full tap-target flex items-center justify-center"
        aria-label="Close modal"
      >
        <span aria-hidden="true">✕</span>
      </Button>
    )}
  </div>
)

export const ModalTitle = ({ children, className, id }) => (
  <h2 id={id || 'modal-title'} className={cn('text-lg font-semibold', className)}>
    {children}
  </h2>
)

export const ModalDescription = ({ children, className }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>
    {children}
  </p>
)

export const ModalContent = ({ children, className }) => (
  <div className={cn('p-4 sm:p-6', className)}>
    {children}
  </div>
)

export const ModalFooter = ({ children, className }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 p-4 sm:p-6 border-t bg-muted/50', className)}>
    {children}
  </div>
)

// Confirmation Modal
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  description = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <ModalDescription>{description}</ModalDescription>
      </ModalContent>
      
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// Alert Modal
export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = 'Alert',
  description,
  buttonText = 'OK'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <ModalDescription>{description}</ModalDescription>
      </ModalContent>
      
      <ModalFooter>
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// Loading Modal
export const LoadingModal = ({ isOpen, title = 'Loading...', description }) => {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} className="w-full max-w-md">
      <ModalContent className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <ModalTitle className="mb-2">{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalContent>
    </Modal>
  )
}

// Custom Hook for Modal State
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  const toggleModal = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  }
}

// Drawer Component (slide from side)
export const Drawer = ({ 
  isOpen, 
  onClose, 
  children, 
  side = 'right', 
  className 
}) => {
  const drawerRef = useRef(null)
  const previousActiveElementRef = useRef(null)

  const sideClasses = {
    right: 'right-0 top-0 h-full w-full sm:w-96 max-w-full transform translate-x-0',
    left: 'left-0 top-0 h-full w-full sm:w-96 max-w-full transform -translate-x-0',
    top: 'top-0 left-0 w-full h-auto max-h-[90vh] transform -translate-y-0 rounded-b-2xl',
    bottom: 'bottom-0 left-0 w-full h-auto max-h-[90vh] transform translate-y-0 rounded-t-2xl safe-area-inset',
  }

  const slideClasses = {
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  }

  // Focus management for drawer
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const drawerElement = drawerRef.current
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')
    const focusableElements = Array.from(drawerElement.querySelectorAll(focusableSelectors))
    
    if (focusableElements.length > 0) {
      previousActiveElementRef.current = document.activeElement
      const firstElement = focusableElements[0]
      firstElement?.focus()
    }
  }, [isOpen])

  // Restore focus when drawer closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      setTimeout(() => {
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus()
        }
        previousActiveElementRef.current = null
      }, 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return createPortal(
    <div className={cn('fixed inset-0 z-50', isOpen ? 'block' : 'hidden')} role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Content */}
      <div 
        ref={drawerRef}
        className={cn(
          'fixed bg-background shadow-lg transition-transform duration-300 ease-in-out',
          sideClasses[side],
          slideClasses[side],
          className
        )}
        role="document"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
