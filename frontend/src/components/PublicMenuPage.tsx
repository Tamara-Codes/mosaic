import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { DefaultMenuLayout } from './themes/DefaultMenuLayout'
import { MinimalMenuLayout } from './themes/MinimalMenuLayout'
import { FancyMenuLayout } from './themes/FancyMenuLayout'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Theme registry - maps theme_identifier to component
const THEME_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'default-theme': DefaultMenuLayout,
  'minimal-theme-v1': MinimalMenuLayout,
  'fancy-theme-v2': FancyMenuLayout,
}

export function PublicMenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>()
  const [menuData, setMenuData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('hr')

  useEffect(() => {
    if (!restaurantSlug) {
      setError('Restaurant slug is required')
      setLoading(false)
      return
    }

    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/menu/${restaurantSlug}`)
        setMenuData(response.data)
        setLoading(false)
      } catch (err: any) {
        console.error('Failed to load menu:', err)
        setError(err.response?.data?.detail || 'Failed to load menu')
        setLoading(false)
      }
    }

    fetchMenu()
  }, [restaurantSlug])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading menu...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: '2rem', color: '#dc2626' }}>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!menuData) {
    return null
  }

  // Get theme component
  const themeIdentifier = menuData.restaurant?.theme_identifier || 'default-theme'
  const ThemeComponent = THEME_COMPONENTS[themeIdentifier] || DefaultMenuLayout

  // Get available languages from menu data
  const availableLanguages = menuData.menu_items?.flatMap((item: any) => 
    item.translations?.map((t: any) => t.language_code) || []
  ).filter((code: string, index: number, self: string[]) => 
    self.indexOf(code) === index
  ) || ['hr'] // Default to Croatian if no translations

  // Add base language (Croatian)
  if (!availableLanguages.includes('hr')) {
    availableLanguages.unshift('hr')
  }

  const getLanguageFlag = (code: string) => {
    const countryCode = code === 'en' ? 'gb' : code === 'cs' ? 'cz' : code === 'sl' ? 'si' : code
    return `https://flagcdn.com/w40/${countryCode}.png`
  }

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      'hr': 'HR',
      'en': 'EN',
      'de': 'DE',
      'it': 'IT',
      'fr': 'FR',
      'es': 'ES',
      'sl': 'SL',
      'cs': 'CS',
      'pl': 'PL',
      'hu': 'HU'
    }
    return names[code] || code.toUpperCase()
  }

  return (
    <div>
      {/* Language selector */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        maxWidth: '300px',
        justifyContent: 'flex-end'
      }}>
        {availableLanguages.map((langCode: string) => (
          <button
            key={langCode}
            onClick={() => setLanguage(langCode)}
            style={{
              padding: '0.5rem',
              border: language === langCode ? '2px solid #333' : '1px solid #ccc',
              borderRadius: '4px',
              background: language === langCode ? '#333' : 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.2s'
            }}
            title={getLanguageName(langCode)}
          >
            <img 
              src={getLanguageFlag(langCode)} 
              alt={getLanguageName(langCode)}
              style={{
                width: '24px',
                height: '18px',
                objectFit: 'cover',
                borderRadius: '2px'
              }}
            />
          </button>
        ))}
      </div>

      <ThemeComponent
        restaurant={menuData.restaurant}
        menuItems={menuData.menu_items || []}
        categories={menuData.categories || []}
        language={language}
      />
    </div>
  )
}

