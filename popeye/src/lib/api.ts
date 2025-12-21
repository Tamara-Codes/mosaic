import axios from 'axios'
import type { AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface MenuItem {
  id: string
  name_hr: string
  name_en: string
  description_hr: string | null
  description_en: string | null
  price: number
  image_path: string | null
  category: string | null
  is_available: boolean
  is_vegetarian: boolean
  is_vegan: boolean
  contains_gluten: boolean
  contains_dairy: boolean
  contains_nuts: boolean
  contains_fish: boolean
  contains_shellfish: boolean
  contains_eggs: boolean
  is_spicy: boolean
  translations?: Translation[]
}

export interface Translation {
  id: string
  menu_item_id: string
  language_code: string
  language_name: string
  name: string
  description: string | null
  is_ai_generated: boolean
}

export interface Category {
  id: string
  name: string
  order_index: number
  translations?: CategoryTranslation[]
}

export interface CategoryTranslation {
  id: string
  category_id: string
  language_code: string
  language_name: string
  name: string
  is_ai_generated: boolean
}

export interface DailyMenu {
  id: string
  restaurant_id: string
  menu_date: string
  name: string
  description: string | null
  is_active: boolean
  is_preview: boolean
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  theme_identifier: string
}

export interface OrderItem {
  menu_item_id: string
  quantity: number
  unit_price: number
  customization?: {
    breadType?: 'pecivo' | 'lepinja'
    ingredients?: {
      [key: string]: boolean
    }
  }
}

export interface CreateOrderRequest {
  restaurant_slug: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address?: string
  order_type: 'delivery' | 'pickup'
  items: OrderItem[]
  notes?: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: string | null
  order_type: 'delivery' | 'pickup'
  status: string
  total_price: number
  notes: string | null
  created_at: string
}

export interface ContactFormRequest {
  restaurant_slug: string
  name: string
  email: string
  phone?: string
  message: string
}

// API Functions
export const api = {
  // Get today's menu for a restaurant
  getTodayMenu: async (restaurantSlug: string): Promise<{ 
    restaurant: Restaurant
    menu: DailyMenu
    menu_items: MenuItem[]
    categories: Category[]
  }> => {
    const response = await apiClient.get(`/v1/menu/${restaurantSlug}`)
    return response.data
  },

  // Preview menu for a specific date
  previewMenu: async (restaurantSlug: string, date: string): Promise<{ restaurant: Restaurant; menu: DailyMenu }> => {
    const response = await apiClient.get(`/v1/menu/${restaurantSlug}/preview/${date}`)
    return response.data
  },

  // Create an order
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post('/v1/orders', orderData)
    return response.data
  },

  // Get restaurant info
  getRestaurant: async (restaurantSlug: string): Promise<Restaurant> => {
    const response = await apiClient.get(`/v1/restaurant/${restaurantSlug}`)
    return response.data
  },

  // Submit contact form
  submitContactForm: async (contactData: ContactFormRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/v1/contact', contactData)
    return response.data
  },
}

