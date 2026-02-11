import { useState, useEffect } from 'react'
import { useApiClient } from '@/lib/apiHelpers'

export function useRestaurantId() {
  const apiClient = useApiClient()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    const loadRestaurantInfo = async () => {
      try {
        const response = await apiClient.get('/restaurant-info')
        setRestaurantId(response.data.id)
      } catch (error) {
        console.error('Failed to load restaurant info:', error)
      }
    }

    loadRestaurantInfo()
  }, [apiClient])

  return restaurantId
}
