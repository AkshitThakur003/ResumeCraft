import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRegisterForm } from './useRegisterForm'

// Mock dependencies
const mockRegister = vi.fn()
const mockAddToast = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    loading: false,
    error: null,
  }),
}))

vi.mock('../contexts/ToastContext', () => ({
  useGlobalToast: () => ({
    addToast: mockAddToast,
  }),
}))

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes with empty form data', () => {
      const { result } = renderHook(() => useRegisterForm())

      expect(result.current.formData).toEqual({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
    })

    it('initializes with empty errors', () => {
      const { result } = renderHook(() => useRegisterForm())

      expect(result.current.formErrors).toEqual({})
    })

    it('exposes loading from auth context', () => {
      const { result } = renderHook(() => useRegisterForm())

      expect(result.current.loading).toBe(false)
    })
  })

  describe('handleChange', () => {
    it('updates form data when field changes', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'firstName', value: 'John' },
        })
      })

      expect(result.current.formData.firstName).toBe('John')
    })

    it('validates field on change', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid-email' },
        })
      })

      expect(result.current.formErrors.email).toBe('Please enter a valid email address')
    })

    it('clears error when field becomes valid', () => {
      const { result } = renderHook(() => useRegisterForm())

      // Set invalid email
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid' },
        })
      })

      expect(result.current.formErrors.email).toBeTruthy()

      // Fix email
      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'valid@example.com' },
        })
      })

      expect(result.current.formErrors.email).toBe('')
    })
  })


  describe('handleSubmit', () => {
    it('prevents submission with invalid form', async () => {
      const { result } = renderHook(() => useRegisterForm())

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        })
      })

      expect(mockRegister).not.toHaveBeenCalled()
      expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0)
    })

    it('submits form with valid data', async () => {
      mockRegister.mockResolvedValue({
        success: true,
        message: 'Registration successful',
      })

      const { result } = renderHook(() => useRegisterForm())

      // Fill form with valid data
      act(() => {
        result.current.handleChange({
          target: { name: 'firstName', value: 'John' },
        })
        result.current.handleChange({
          target: { name: 'lastName', value: 'Doe' },
        })
        result.current.handleChange({
          target: { name: 'email', value: 'john@example.com' },
        })
        result.current.handleChange({
          target: { name: 'password', value: 'Password123!' },
        })
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'Password123!' },
        })
      })

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        })
      })

      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
      })
    })

    it('shows success toast on successful registration', async () => {
      mockRegister.mockResolvedValue({
        success: true,
        message: 'Registration successful',
      })

      const { result } = renderHook(() => useRegisterForm())

      // Fill form
      act(() => {
        result.current.handleChange({
          target: { name: 'firstName', value: 'John' },
        })
        result.current.handleChange({
          target: { name: 'lastName', value: 'Doe' },
        })
        result.current.handleChange({
          target: { name: 'email', value: 'john@example.com' },
        })
        result.current.handleChange({
          target: { name: 'password', value: 'Password123!' },
        })
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'Password123!' },
        })
      })

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        })
      })

      expect(mockAddToast).toHaveBeenCalledWith(
        'Account created! Check your email to verify - we\'ll see you soon! 🎉',
        'success'
      )
    })

    it('handles registration error', async () => {
      mockRegister.mockRejectedValue({
        response: {
          data: {
            message: 'Email already exists',
            errors: [{ field: 'email', message: 'Email already exists' }],
          },
        },
      })

      const { result } = renderHook(() => useRegisterForm())

      // Fill form
      act(() => {
        result.current.handleChange({
          target: { name: 'firstName', value: 'John' },
        })
        result.current.handleChange({
          target: { name: 'lastName', value: 'Doe' },
        })
        result.current.handleChange({
          target: { name: 'email', value: 'john@example.com' },
        })
        result.current.handleChange({
          target: { name: 'password', value: 'Password123!' },
        })
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'Password123!' },
        })
      })

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        })
      })

      expect(mockAddToast).toHaveBeenCalled()
      expect(result.current.formErrors.email).toBe('Email already exists')
    })

  })

  describe('validation', () => {
    it('validates first name length', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'firstName', value: 'J' },
        })
      })

      expect(result.current.formErrors.firstName).toBe('Name must be at least 2 characters')
    })

    it('validates email format', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'email', value: 'invalid-email' },
        })
      })

      expect(result.current.formErrors.email).toBe('Please enter a valid email address')
    })

    it('validates password requirements', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'short' },
        })
      })

      expect(result.current.formErrors.password).toBe('Password must be at least 8 characters')
    })

    it('validates password match', () => {
      const { result } = renderHook(() => useRegisterForm())

      act(() => {
        result.current.handleChange({
          target: { name: 'password', value: 'Password123!' },
        })
        result.current.handleChange({
          target: { name: 'confirmPassword', value: 'Different123!' },
        })
      })

      expect(result.current.formErrors.confirmPassword).toBe('Passwords do not match')
    })
  })
})

