import { useReducer } from 'react'
import { notificationsReducer, initialState } from './notificationsReducer'

export const useNotificationsReducer = () => {
  const [state, dispatch] = useReducer(notificationsReducer, initialState)
  return { state, dispatch }
}

