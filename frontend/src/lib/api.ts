/**
 * Type definitions for API responses
 * Use useApiClient from @/lib/apiHelpers for making authenticated API calls
 */

export interface RestaurantInfo {
  id: number
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
}

export interface Translation {
  id: number
  menu_item_id: number
  language_code: string
  language_name: string
  name: string
  description: string | null
  is_ai_generated: boolean
}

export interface MenuItem {
  id: number
  name_hr: string
  description_hr: string | null
  price: number
  category_id: string | null
  image_path: string | null
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

export interface CategoryTranslation {
  id: number
  category_id: number
  language_code: string
  language_name: string
  name: string
  is_ai_generated: boolean
}

export interface Category {
  id: number
  name: string
  order?: number
  translations?: CategoryTranslation[]
}

export interface Analytics {
  total_items: number
  available_items: number
  unavailable_items: number
  categories: Record<string, number>
  allergen_counts: {
    vegetarian: number
    vegan: number
    gluten: number
    dairy: number
    nuts: number
    fish: number
    shellfish: number
    eggs: number
    spicy: number
  }
  total_categories: number
}

