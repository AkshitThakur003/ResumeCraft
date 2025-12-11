import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthReducer, AUTH_ACTIONS } from './useAuthReducer'

// Mock tokenStorage
vi.mock('../utils/tokenStorage', () => ({
  getStoredAccessToken: () => ({
    rememberMe: false,
    expiresAt: null,
  }),
}))

describe('useAuthReducer', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [state] = result.current

    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
    expect(state.rememberMe).toBe(false)
    expect(state.sessionExpiresAt).toBeNull()
  })

  it('handles SET_LOADING action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    })

    expect(result.current[0].loading).toBe(false)
  })

  it('handles SET_USER action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    const mockUser = { id: '1', email: 'test@example.com' }

    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: mockUser })
    })

    expect(result.current[0].user).toEqual(mockUser)
    expect(result.current[0].isAuthenticated).toBe(true)
    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].error).toBeNull()
  })

  it('handles SET_USER with null (logout)', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    // First set a user
    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { id: '1' } })
    })

    // Then set to null
    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null })
    })

    expect(result.current[0].user).toBeNull()
    expect(result.current[0].isAuthenticated).toBe(false)
  })

  it('handles SET_ERROR action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Error message' })
    })

    expect(result.current[0].error).toBe('Error message')
    expect(result.current[0].loading).toBe(false)
  })

  it('handles LOGIN_SUCCESS action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    const mockUser = { id: '1', email: 'test@example.com' }

    act(() => {
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user: mockUser } })
    })

    expect(result.current[0].user).toEqual(mockUser)
    expect(result.current[0].isAuthenticated).toBe(true)
    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].error).toBeNull()
  })

  it('handles LOGOUT action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    // First login
    act(() => {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: { id: '1' } },
      })
    })

    // Then logout
    act(() => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    })

    expect(result.current[0].user).toBeNull()
    expect(result.current[0].isAuthenticated).toBe(false)
    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].sessionExpiresAt).toBeNull()
  })

  it('handles CLEAR_ERROR action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    // First set an error
    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: 'Error message' })
    })

    // Then clear it
    act(() => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
    })

    expect(result.current[0].error).toBeNull()
  })

  it('handles UPDATE_PROFILE action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    const initialUser = { id: '1', email: 'old@example.com' }
    const updatedUser = { id: '1', email: 'new@example.com' }

    // First set a user
    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: initialUser })
    })

    // Then update profile
    act(() => {
      dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: updatedUser })
    })

    expect(result.current[0].user).toEqual(updatedUser)
  })

  it('handles SET_REMEMBER_ME action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: true })
    })

    expect(result.current[0].rememberMe).toBe(true)
  })

  it('handles SET_SESSION_EXPIRY action', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    const expiryDate = new Date('2024-12-31')

    act(() => {
      dispatch({
        type: AUTH_ACTIONS.SET_SESSION_EXPIRY,
        payload: expiryDate,
      })
    })

    expect(result.current[0].sessionExpiresAt).toEqual(expiryDate)
  })

  it('preserves rememberMe on logout', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    // Set rememberMe
    act(() => {
      dispatch({ type: AUTH_ACTIONS.SET_REMEMBER_ME, payload: true })
    })

    // Login
    act(() => {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: { id: '1' } },
      })
    })

    // Logout
    act(() => {
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    })

    expect(result.current[0].rememberMe).toBe(true)
  })

  it('handles unknown action type', () => {
    const { result } = renderHook(() => useAuthReducer())
    const [, dispatch] = result.current

    const initialState = { ...result.current[0] }

    act(() => {
      dispatch({ type: 'UNKNOWN_ACTION' })
    })

    expect(result.current[0]).toEqual(initialState)
  })
})

