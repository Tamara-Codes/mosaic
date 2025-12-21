import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, type DailyMenu, type Restaurant, type MenuItem, type Category } from '../lib/api'
import { MenuItemCard } from '../components/MenuItemCard'
import { ShoppingCart } from '../components/ShoppingCart'
import { Navigation } from '../components/Navigation'
import { Utensils } from 'lucide-react'

export function MenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug?: string }>()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menu, setMenu] = useState<DailyMenu | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const slug = restaurantSlug || import.meta.env.VITE_RESTAURANT_SLUG
    if (slug) {
      loadMenu(slug)
    } else {
      setError('Restoran nije naveden. Molimo koristite URL: /menu/restaurant-slug ili postavite VITE_RESTAURANT_SLUG u .env.local')
      setLoading(false)
    }
  }, [restaurantSlug])

  const loadMenu = async (slug: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getTodayMenu(slug)
      setRestaurant(data.restaurant)
      setMenu(data.menu)
      setMenuItems(data.menu_items || [])
      setCategories(data.categories || [])
    } catch (err: any) {
      console.error('Failed to load menu:', err)
      setError(err.response?.data?.detail || 'Greška pri učitavanju menija')
    } finally {
      setLoading(false)
    }
  }

  // Custom category order
  const categoryOrder = ['Glavna jela', 'Hamburgeri', 'Prilozi', 'Umaci', 'Deserti', 'Pića']
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.name)
    const indexB = categoryOrder.indexOf(b.name)
    if (indexA === -1 && indexB === -1) return a.order_index - b.order_index
    if (indexA === -1) return 1
    if (indexB === -1) return 1
    return indexA - indexB
  })

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems

  // Group items by category for display
  const groupedItems = sortedCategories.reduce((acc, category) => {
    const items = filteredItems.filter((item) => item.category === category.name)
    if (items.length > 0) {
      acc.push({ category, items })
    }
    return acc
  }, [] as { category: Category; items: MenuItem[] }[])

  // Add uncategorized items
  const uncategorizedItems = filteredItems.filter((item) => !item.category || !categories.find((c) => c.name === item.category))
  if (uncategorizedItems.length > 0 && !selectedCategory) {
    groupedItems.push({ category: { id: 'other', name: 'Ostalo', order_index: 999 }, items: uncategorizedItems })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Učitavanje jelovnika...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ups!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => restaurant && loadMenu(restaurant.slug)}
            className="px-6 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
          >
            Pokušaj ponovno
          </button>
        </div>
      </div>
    )
  }

  if (!restaurant || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <p className="text-gray-600">Restoran nije pronađen</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[716px] mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-gray-800">Dnevni </span>
            <span className="text-red-500">jelovnik</span>
          </h1>
          {menu.menu_date && (
            <p className="text-gray-500 font-medium">
              {new Date(menu.menu_date).toLocaleDateString('hr-HR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="max-w-[716px] mx-auto px-4 py-3">
            <div 
              className="flex gap-2 overflow-x-auto hide-scrollbar" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === null
                    ? 'bg-yellow-400 text-red-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sve
              </button>
              {sortedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-yellow-400 text-red-900 shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <main className="max-w-[716px] mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Nema dostupnih stavki</p>
          </div>
        ) : selectedCategory ? (
          // Flat list when category is selected
          <div>
            {selectedCategory === 'Glavna jela' && (
              <p className="text-sm text-gray-500 mb-3 px-1 italic">
                * Jela s oznakom + PRILOG imaju jedan prilog po izboru uključen u cijenu.
              </p>
            )}
            {selectedCategory === 'Umaci' && (
              <p className="text-sm text-gray-500 mb-3 px-1">
                Kod nas: 0.50€ | Za dostavu: 1.00€
              </p>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          // Grouped by category when showing all
          <div className="space-y-6">
            {groupedItems.map(({ category, items }) => (
              <div key={category.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-2 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                  {category.name}
                </h2>
                {category.name === 'Glavna jela' && (
                  <p className="text-sm text-gray-500 mb-3 px-1 italic">
                    Jela s oznakom + PRILOG imaju jedan prilog po izboru uključen u cijenu. 
                  </p>
                )}
                {category.name === 'Umaci' && (
                  <p className="text-sm text-gray-500 mb-3 px-1">
                    Kod nas: 0.50€ | Za dostavu: 1.00€
                  </p>
                )}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Shopping Cart */}
      <ShoppingCart restaurant={restaurant} />

      {/* Copyright */}
      <div className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-[716px] mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bistro Popeye. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  )
}
