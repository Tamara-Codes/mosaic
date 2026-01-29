import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

interface MenuItem {
  id: string
  name_hr: string
  name_en: string
  description_hr?: string
  description_en?: string
  price: number
  image_path?: string
  category_id?: string
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
}

export default function MenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>()
  const [menuData, setMenuData] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convert slug to display name (e.g., "restaurant" -> "Restaurant", "my-cafe" -> "My Cafe")
  const getDisplayName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    const fetchMenu = async () => {
      if (!restaurantSlug) {
        setError('Restaurant not specified')
        setLoading(false)
        return
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const response = await fetch(`${apiBaseUrl}/v1/menu/${restaurantSlug}`)

        if (!response.ok) {
          throw new Error('Restaurant not found')
        }

        const data = await response.json()
        setMenuData(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu')
        setLoading(false)
      }
    }

    fetchMenu()
  }, [restaurantSlug])

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
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="border border-[#d4c4a8] bg-white px-12 py-16">
            <h2 className="font-serif text-3xl text-[#2c2416] mb-4">Menu Unavailable</h2>
            <p className="text-[#5c5043]">{error || 'Unable to load menu'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { restaurant, menu_items, categories } = menuData

  // Create a map of category IDs to category names
  const categoryMap: Record<string, string> = {}
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name
  })

  // Group items by category
  const categorizedItems: Record<string, MenuItem[]> = {}
  menu_items.forEach(item => {
    const categoryName = item.category_id ? categoryMap[item.category_id] : 'Other'
    if (!categorizedItems[categoryName]) {
      categorizedItems[categoryName] = []
    }
    categorizedItems[categoryName].push(item)
  })

  // Sort categories by their order_index
  const sortedCategories = categories
    .sort((a, b) => a.order_index - b.order_index)
    .map(cat => cat.name)

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Elegant Header */}
      <header className="border-b border-[#d4c4a8] bg-white">
        <div className="max-w-4xl mx-auto px-12 py-16 text-center">
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

          {/* Croatian intro text about fresh ingredients */}
          <div className="max-w-2xl mx-auto">
            <p className="font-serif text-2xl text-[#5c5043] italic leading-relaxed mb-4">
              Sve naše specijalitete pripremamo od najsvježijih sastojaka, pažljivo odabranih iz lokalnih izvora.
            </p>
            <p className="font-serif text-xl text-[#6b5d4f] leading-relaxed">
              Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta.
            </p>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-12 py-16">
        {sortedCategories.map((category, categoryIndex) => {
          const items = categorizedItems[category]
          if (!items || items.length === 0) return null

          return (
            <section key={category} className={categoryIndex > 0 ? "mt-32" : ""}>
              {/* Category Title with Ornamental Line */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4c4a8] to-transparent max-w-xs"></div>
                </div>
                <h2 className="font-serif text-3xl text-[#2c2416] tracking-widest uppercase">
                  {category}
                </h2>
                <div className="flex items-center justify-center mt-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#d4c4a8] to-transparent max-w-xs"></div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-10">
                {items.map((item, itemIndex) => (
                  <article key={item.id} className={itemIndex > 0 ? "pt-10 border-t border-[#e8e1d5]" : ""}>
                    <div className="flex items-start justify-between gap-8">
                      <div className="flex-1 min-w-0">
                        {/* Item Name */}
                        <h3 className="font-serif text-2xl text-[#2c2416] mb-3 leading-tight">
                          {item.name_en || item.name_hr}
                        </h3>

                        {/* Description */}
                        {(item.description_en || item.description_hr) && (
                          <p className="text-[#5c5043] leading-relaxed text-base">
                            {item.description_en || item.description_hr}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex-shrink-0">
                        <span className="font-serif text-2xl text-[#8b6f47] tracking-wide">
                          €{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Item Image (if exists) */}
                    {item.image_path && (
                      <div className="mt-6">
                        <img
                          src={item.image_path}
                          alt={item.name_en || item.name_hr}
                          className="w-full max-w-md mx-auto h-48 object-cover"
                        />
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

      {/* Footer */}
      <footer className="border-t border-[#d4c4a8] bg-white mt-24">
        <div className="max-w-5xl mx-auto px-12 py-12">
          {/* Contact Information - Horizontal Layout */}
          <div className="flex flex-wrap items-center justify-between gap-6 text-[#5c5043]">
            <div className="text-left">
              <h3 className="font-serif text-xl text-[#2c2416] mb-1 tracking-wide">
                {restaurant.name}
              </h3>
              {restaurant.address && (
                <p className="text-sm tracking-wide">
                  {restaurant.address}
                </p>
              )}
            </div>

            <div className="text-right space-y-1">
              {restaurant.phone && (
                <p className="text-sm tracking-wide">
                  {restaurant.phone}
                </p>
              )}
              {restaurant.email && (
                <p className="text-sm tracking-wide">
                  {restaurant.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
