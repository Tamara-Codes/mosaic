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

// SECURITY: Removed console.log in production
// Only log in development mode
if (import.meta.env.DEV) {
  console.log('Supabase client initialized')
}

// Helper function to get image URL from Supabase Storage
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '/placeholder.png'
  if (imagePath.startsWith('http')) return imagePath
  
  const bucketName = 'menu-images'
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${imagePath}`
}
