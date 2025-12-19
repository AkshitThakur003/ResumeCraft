/**
 * Axios Client Instance
 * Configured axios instance for API requests
 * @module api/client
 */

import axios from 'axios'
import { ACCESS_TOKEN_KEY } from './tokenManagement'

/** @constant {number} Default API timeout in milliseconds (30 seconds) */
const API_TIMEOUT_MS = 30000

/** @constant {boolean} Whether code is running in browser environment */
const isBrowser = typeof window !== 'undefined'

/**
 * Axios instance configured for API requests
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

/**
 * Request interceptor to automatically add authentication token to requests.
 * Retrieves token from localStorage or sessionStorage and adds it to Authorization header.
 * 
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request config
 * @returns {import('axios').InternalAxiosRequestConfig} Modified config with auth header
 */
api.interceptors.request.use(
  (config) => {
    let token = null
    if (isBrowser) {
      token = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY)
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api

