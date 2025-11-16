/**
 * Hook to get authenticated API client with Clerk token
 */
import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'
import { createApiClient } from '@/lib/apiClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export function useApi() {
  const { getToken } = useAuth()

  const apiClient = useMemo(() => {
    return createApiClient(async () => {
      try {
        return await getToken()
      } catch (error) {
        console.error('Failed to get Clerk token:', error)
        return null
      }
    })
  }, [getToken])

  return apiClient
}

/**
 * Hook for API calls that require authentication
 * Returns API methods with Clerk token automatically included
 */
export function useAuthenticatedApi() {
  const apiClient = useApi()

  return {
    getMenuItems: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/menu-items`)
      return response.data
    },
    getMenuItemsWithTranslations: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/menu-items-with-translations`)
      return response.data
    },
    createMenuItem: async (data: FormData) => {
      const response = await apiClient.post(`${API_BASE_URL}/api/menu-items`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    updateMenuItem: async (id: string, data: FormData) => {
      const response = await apiClient.put(`${API_BASE_URL}/api/menu-items/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    deleteMenuItem: async (id: string) => {
      await apiClient.delete(`${API_BASE_URL}/api/menu-items/${id}`)
    },
    getAnalytics: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/analytics`)
      return response.data
    },
    getCategories: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/categories`)
      return response.data
    },
    getCategoriesWithTranslations: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/categories-with-translations`)
      return response.data
    },
    createCategory: async (name: string, order?: number) => {
      const formData = new FormData()
      formData.append('name', name)
      if (order !== undefined) {
        formData.append('order', order.toString())
      }
      const response = await apiClient.post(`${API_BASE_URL}/api/categories`, formData)
      return response.data
    },
    updateCategory: async (id: string, name?: string, order?: number) => {
      const formData = new FormData()
      if (name) formData.append('name', name)
      if (order !== undefined) formData.append('order', order.toString())
      const response = await apiClient.put(`${API_BASE_URL}/api/categories/${id}`, formData)
      return response.data
    },
    deleteCategory: async (id: string) => {
      await apiClient.delete(`${API_BASE_URL}/api/categories/${id}`)
    },
    reorderCategories: async (categories: Array<{ id: string }>) => {
      await apiClient.put(`${API_BASE_URL}/api/categories/reorder`, categories)
    },
    getQrCode: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/qr-code`)
      return response.data
    },
    getRestaurantInfo: async () => {
      const response = await apiClient.get(`${API_BASE_URL}/api/restaurant-info`)
      return response.data
    },
    saveRestaurantInfo: async (info: {
      name: string
      description?: string
      address?: string
      phone?: string
      email?: string
      theme_identifier?: string
    }) => {
      const formData = new FormData()
      formData.append('name', info.name)
      if (info.description) formData.append('description', info.description)
      if (info.address) formData.append('address', info.address)
      if (info.phone) formData.append('phone', info.phone)
      if (info.email) formData.append('email', info.email)
      if (info.theme_identifier) formData.append('theme_identifier', info.theme_identifier)
      const response = await apiClient.post(`${API_BASE_URL}/api/restaurant-info`, formData)
      return response.data
    },
  }
}

