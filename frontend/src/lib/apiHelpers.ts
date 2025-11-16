/**
 * Helper functions to create authenticated API calls
 * These can be used in components that have access to useAuth
 */
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Get axios instance with Clerk token automatically included
 */
export function useApiClient() {
  const { getToken } = useAuth()

  const client = axios.create({
    baseURL: API_BASE_URL,
  })

  // Add token interceptor
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get token:', error)
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  return client
}

