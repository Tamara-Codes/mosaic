/**
 * API client with Clerk authentication
 */
import axios, { type AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Create an axios instance with Clerk token interceptor
 * This should be used inside components that have access to useAuth hook
 */
export function createApiClient(getToken: () => Promise<string | null>): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
  })

  // Add token to all requests
  client.interceptors.request.use(
    async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Default axios instance for public endpoints
 */
export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
})

