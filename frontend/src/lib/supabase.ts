import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false
  }
})

// Log connection info for debugging
console.log('Supabase client initialized:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
})

// Helper function to get image URL from Supabase Storage
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.png'
  if (imagePath.startsWith('http')) return imagePath
  
  const bucketName = 'menu-images'
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imagePath}`
}
