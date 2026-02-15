/**
 * Helper functions to create authenticated API calls
 * These can be used in components that have access to useAuth
 */
import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import axios from 'axios'

// Use proxy in dev - always use '/api/v1' which goes through Vite proxy to backend
// In production, use full URL if VITE_API_BASE_URL is set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Get axios instance with Clerk token automatically included
 * Memoized to prevent infinite loops in useEffect hooks
 */
export function useApiClient() {
  const { getToken } = useAuth()

  // Memoize the axios client to prevent recreating it on every render
  // Note: getToken is not in dependencies because the interceptor calls it dynamically
  // on each request, ensuring we always get the latest token
  const client = useMemo(() => {
    const axiosClient = axios.create({
      baseURL: API_BASE_URL,
    })
    
    // SECURITY: Removed API base URL logging (even in dev)
    // API endpoints should not be exposed in client logs

    // Add token interceptor - getToken is captured in closure and called on each request
    axiosClient.interceptors.request.use(
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

    return axiosClient
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps - getToken is captured in closure and called dynamically

  return client
}

