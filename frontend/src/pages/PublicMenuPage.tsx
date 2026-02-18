import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, getImageUrl } from '../lib/supabase'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import { SEO } from '../components/SEO'

interface MenuItem {
  id: string
  name_hr: string
  description?: string
  description_hr?: string
  price: number
  image_path?: string
  category_id?: string
  item_type?: 'food' | 'drink'
  is_vegetarian?: boolean
  is_vegan?: boolean
  contains_gluten?: boolean
  contains_dairy?: boolean
  contains_nuts?: boolean
  contains_fish?: boolean
  contains_shellfish?: boolean
  contains_eggs?: boolean
  is_spicy?: boolean
  translations?: Array<{
    language_code: string
    name: string
    description?: string
  }>
}

interface Category {
  id: string
  name: string
  order_index: number
  category_translations?: Array<{
    language_code: string
    name: string
  }>
}

interface Restaurant {
  id: string
  name: string
  description?: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
}

interface MenuData {
  restaurant: Restaurant
  menu_items: MenuItem[]
  categories: Category[]
  theme_identifier?: string
  ui_translations?: Array<{
    language_code: string
    translation_key: string
    translation_value: string
  }>
}

export default function MenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>()
  const { language, t, updateUITranslations } = useLanguage()
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'food' | 'drink'>('food')

  const getDisplayName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getTranslatedText = (
    item: MenuItem,
    field: 'name' | 'description',
    fallbackHr: string
  ) => {
    if (language === 'hr') return fallbackHr

    const translation = item.translations?.find(trans => trans.language_code === language)
    if (translation) {
      return field === 'name' ? translation.name : (translation.description || '')
    }

    return fallbackHr
  }

  const getTranslatedCategory = (
    category: Category,
    fallbackName: string
  ) => {
    if (language === 'hr') return fallbackName

    const translation = category.category_translations?.find(trans => trans.language_code === language)
    return translation?.name || fallbackName
  }

  const getUITranslation = (key: string) => {
    const defaultValues: Record<string, string> = {
      'food': 'Hrana',
      'drink': 'Pića'
    }

    if (language === 'hr') return defaultValues[key] || key

    const translation = menuData?.ui_translations?.find(
      trans => trans.language_code === language && trans.translation_key === key
    )
    return translation?.translation_value || defaultValues[key] || key
  }

  useEffect(() => {
    const fetchMenu = async () => {
      if (!restaurantSlug) {
        setError('Restaurant not specified')
        setLoading(false)
        return
      }

      // Exclude reserved static file names from being treated as restaurant slugs
      const reservedPaths = ['robots.txt', 'sitemap.xml', 'favicon.ico', 'ferros-logo.png']
      if (reservedPaths.includes(restaurantSlug.toLowerCase())) {
        setLoading(false)
        return
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
        const response = await fetch(`${apiBaseUrl}/api/v1/menu/${restaurantSlug}`)

        if (!response.ok) {
          throw new Error('Restaurant not found')
        }

        const data = await response.json()
        setMenuData(data)

        if (data.ui_translations) {
          updateUITranslations(data.ui_translations)
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu')
        setLoading(false)
      }
    }

    fetchMenu()
  }, [restaurantSlug, updateUITranslations])

  useEffect(() => {
    console.log('🔍 PublicMenuPage effect ran, restaurant id:', menuData?.restaurant?.id)
    if (!menuData?.restaurant?.id) return

    const restaurantId = menuData.restaurant.id

    const refetchMenu = () => {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
      fetch(`${apiBaseUrl}/api/v1/menu/${restaurantSlug}`)
        .then(res => res.json())
        .then(data => {
          setMenuData(data)
          if (data.ui_translations) {
            updateUITranslations(data.ui_translations)
          }
        })
        .catch(err => console.error('❌ Failed to refetch menu:', err))
    }

    console.log('🔌 Setting up language listener for restaurant:', restaurantId)

    const channel = supabase
      .channel(`menu-lang-updates-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurant_languages',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('🎉 restaurant_languages UPDATE received:', payload)
          if (payload.new?.translations_complete === true) {
            refetchMenu()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'restaurant_languages',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => refetchMenu()
      )
      .subscribe((status) => {
        console.log('📡 Language listener status:', status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [menuData?.restaurant?.id, restaurantSlug, updateUITranslations])

  if (loading) {
    const displayName = restaurantSlug ? getDisplayName(restaurantSlug) : 'Restaurant'

    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-block w-12 h-12 border-2 border-[#d4c4a8] border-t-[#8b6f47] rounded-full animate-spin"></div>
          </div>
          <p className="font-serif text-xl text-[#5c5043] italic">
            Loading {displayName} Menu
          </p>
        </div>
      </div>
    )
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-[#18181b] flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="bg-zinc-900/50 rounded-2xl border border-white/10 px-8 py-12 md:px-16 md:py-20">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src="/ferros-logo.png" alt="Ferros Logo" className="h-24 w-24 object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Jelovnik nije dostupan
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
              Ovaj restoran nema aktivan račun.
            </p>

            <div className="bg-zinc-800/50 rounded-xl border border-white/5 p-8 mb-8">
              <p className="text-white font-semibold text-lg mb-6">
                Želite li stvoriti jelovnik za svoj restoran?
              </p>
              
              <p className="text-zinc-400 text-sm mb-6">Kontaktirajte nas izravno:</p>
              
              <a 
                href="mailto:info@ferros.menu"
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg shadow-lg hover:shadow-orange-500/20"
              >
                <span>info@ferros.menu</span>
              </a>
            </div>

            <p className="text-zinc-500 text-sm">
              Pomoći ćemo vam postaviti digitalni jelovnik u tren oka!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { restaurant, menu_items, categories } = menuData

  const availableLanguages = ['hr']
  if (menuData.ui_translations) {
    const uniqueLangCodes = new Set(menuData.ui_translations.map(t => t.language_code))
    uniqueLangCodes.forEach(code => {
      if (!availableLanguages.includes(code)) {
        availableLanguages.push(code)
      }
    })
  }

  const categoryMap: Record<string, string> = {}
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name
  })

  const filteredByType = menu_items.filter(item => (item.item_type || 'food') === selectedType)

  const categorizedItems: Record<string, MenuItem[]> = {}
  filteredByType.forEach(item => {
    const categoryName = item.category_id ? categoryMap[item.category_id] : 'Other'
    if (!categorizedItems[categoryName]) {
      categorizedItems[categoryName] = []
    }
    categorizedItems[categoryName].push(item)
  })

  const sortedCategories = categories
    .sort((a, b) => a.order_index - b.order_index)
    .map(cat => cat.name)

  const getAllergenIcons = (item: MenuItem) => {
    const icons: { icon: string; label: string; type: 'dietary' | 'allergen' }[] = []

    if (item.is_vegan === true) icons.push({ icon: '🌱', label: t('vegan'), type: 'dietary' })
    else if (item.is_vegetarian === true) icons.push({ icon: '🥬', label: t('vegetarian'), type: 'dietary' })

    if (item.is_spicy === true) icons.push({ icon: '🌶️', label: t('spicy'), type: 'allergen' })
    if (item.contains_gluten === true) icons.push({ icon: '🌾', label: t('contains_gluten') || 'Contains gluten', type: 'allergen' })
    if (item.contains_dairy === true) icons.push({ icon: '🥛', label: t('contains_dairy') || 'Contains dairy', type: 'allergen' })
    if (item.contains_nuts === true) icons.push({ icon: '🥜', label: t('contains_nuts'), type: 'allergen' })
    if (item.contains_fish === true) icons.push({ icon: '🐟', label: t('contains_fish'), type: 'allergen' })
    if (item.contains_shellfish === true) icons.push({ icon: '🦐', label: t('contains_shellfish'), type: 'allergen' })
    if (item.contains_eggs === true) icons.push({ icon: '🥚', label: t('contains_eggs'), type: 'allergen' })

    return icons
  }

  // Prepare menu items for structured data
  const menuItemsForSEO = menu_items.slice(0, 10).map(item => ({
    name: getTranslatedText(item, 'name', item.name_hr),
    price: item.price,
    description: getTranslatedText(item, 'description', item.description_hr || item.description || ''),
  }))

  return (
    <>
      <SEO
        title={`${restaurant.name} - Jelovnik | Ferros`}
        description={restaurant.description || `Pregledajte jelovnik restorana ${restaurant.name}. Sve jela dostupna na više jezika.`}
        image={restaurant.logo_url || '/ferros-logo.png'}
        url={`/${restaurantSlug}`}
        type="restaurant"
        restaurantName={restaurant.name}
        restaurantDescription={restaurant.description}
        menuItems={menuItemsForSEO}
      />
    <div className="min-h-screen bg-[#fdfbf7] text-[#2c2416]" data-lang={language}>
      <header className="border-b border-[#d4c4a8] bg-white">
        <div className="max-w-4xl mx-auto px-12 py-16 text-center relative">
          <div className="absolute top-4 left-4">
            <LanguageSelector availableLanguages={availableLanguages} />
          </div>

          <div className="mb-8">
            <img
              src={restaurant.logo_url || '/logo.png'}
              alt={restaurant.name}
              className="h-24 mx-auto object-contain"
            />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-[#2c2416] mb-6 tracking-wide">
            {restaurant.name}
          </h1>

          <div className="max-w-2xl mx-auto">
            <p className="font-serif text-xl text-[#6b5d4f] leading-relaxed">
              {t('intro_text_2')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-12 py-16">
        <div className="flex justify-center mb-16">
          <div className="inline-flex rounded-lg border border-[#d4c4a8] bg-white p-1">
            <button
              onClick={() => setSelectedType('food')}
              className={`px-10 py-3 rounded-md font-serif text-lg tracking-wide transition-all ${
                selectedType === 'food'
                  ? 'bg-[#8b6f47] text-white shadow-md'
                  : 'text-[#5c5043] hover:text-[#2c2416]'
              }`}
            >
              {getUITranslation('food')}
            </button>
            <button
              onClick={() => setSelectedType('drink')}
              className={`px-10 py-3 rounded-md font-serif text-lg tracking-wide transition-all ${
                selectedType === 'drink'
                  ? 'bg-[#8b6f47] text-white shadow-md'
                  : 'text-[#5c5043] hover:text-[#2c2416]'
              }`}
            >
              {getUITranslation('drink')}
            </button>
          </div>
        </div>

        {sortedCategories.map((categoryName, categoryIndex) => {
          const items = categorizedItems[categoryName]
          if (!items || items.length === 0) return null

          const categoryObj = categories.find(cat => cat.name === categoryName)

          return (
            <section key={categoryName} className={categoryIndex > 0 ? "mt-32" : ""}>
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4c4a8] to-transparent max-w-xs"></div>
                </div>
                <h2 className="font-serif text-3xl text-[#2c2416] tracking-widest uppercase">
                  {categoryObj ? getTranslatedCategory(categoryObj, categoryName) : categoryName}
                </h2>
                <div className="flex items-center justify-center mt-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4c4a8] to-transparent max-w-xs"></div>
                </div>
              </div>

              <div className="space-y-10">
                {items.map((item, itemIndex) => (
                  <article key={item.id} className={itemIndex > 0 ? "pt-10 border-t border-[#e8e1d5]" : ""}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.image_path && (
                          <div className="flex-shrink-0 group relative">
                            <img
                              src={getImageUrl(item.image_path)}
                              alt={item.name_hr}
                              onClick={() => setZoomedImage(item.id)}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#d4c4a8] transition-all duration-300 cursor-pointer group-hover:scale-110 group-hover:shadow-lg group-hover:border-[#8b6f47]"
                            />
                          </div>
                        )}

                        <h3 className="font-serif text-lg sm:text-2xl text-[#2c2416] leading-tight">
                          {getTranslatedText(item, 'name', item.name_hr)}
                        </h3>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="font-serif text-lg sm:text-2xl text-[#8b6f47] tracking-wide">
                          €{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const translatedDesc = getTranslatedText(item, 'description', item.description_hr || item.description || '')
                      return translatedDesc ? (
                        <p className="text-[#5c5043] leading-relaxed text-sm sm:text-base mb-3">
                          {translatedDesc}
                        </p>
                      ) : null
                    })()}

                    {getAllergenIcons(item).length > 0 && (
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                        {getAllergenIcons(item).map((iconInfo, idx) => {
                          const tooltipId = `${item.id}-${idx}`
                          const isActive = activeTooltip === tooltipId
                          return (
                            <div
                              key={idx}
                              className="group relative cursor-help"
                              onClick={() => setActiveTooltip(isActive ? null : tooltipId)}
                              onMouseLeave={() => setActiveTooltip(null)}
                            >
                              <span
                                className={`text-xl sm:text-2xl transition-transform hover:scale-125 inline-block select-none ${
                                  iconInfo.type === 'dietary' ? 'filter' : ''
                                }`}
                                title={iconInfo.label}
                              >
                                {iconInfo.icon}
                              </span>
                              <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2c2416] text-white text-xs rounded whitespace-nowrap transition-opacity pointer-events-none z-10 ${
                                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                                {iconInfo.label}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2c2416]"></span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        {menu_items.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif text-xl text-[#5c5043] italic">
              Menu items coming soon
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-[#d4c4a8] bg-white mt-24">
        <div className="max-w-4xl mx-auto px-12 py-8 text-center">
          <p className="font-serif text-2xl text-[#2c2416] mb-2">
            {restaurant.name}
          </p>
          <p className="text-xs text-[#5c5043]">
            © 2026 Ferros
          </p>
        </div>
      </footer>

      {zoomedImage && (() => {
        const zoomedItem = menu_items.find(item => item.id === zoomedImage)
        if (!zoomedItem?.image_path) return null

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <img
                src={getImageUrl(zoomedItem.image_path)}
                alt={zoomedItem.name_hr}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg text-[#2c2416] font-bold text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )
      })()}
    </div>
    </>
  )
}

