import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
}

export function getImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  
  const baseUrl = getApiUrl()
  const cleanBase = baseUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${cleanBase}${cleanPath}`
}

