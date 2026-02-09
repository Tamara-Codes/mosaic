import '../../themes/minimal-theme-v1.css'

interface MenuItem {
  id: string
  name_hr: string
  description_hr?: string
  price: number
  image_path?: string
  category?: string
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
  translations?: Array<{
    language_code: string
    name: string
  }>
}

interface MinimalMenuLayoutProps {
  restaurant: {
    name: string
    description?: string
    address?: string
    phone?: string
    email?: string
  }
  menuItems: MenuItem[]
  categories: Category[]
  language: string
}

export function MinimalMenuLayout({ restaurant, menuItems, categories, language }: MinimalMenuLayoutProps) {
  const getTranslatedName = (item: MenuItem): string => {
    if (language === 'hr') return item.name_hr
    const translation = item.translations?.find(t => t.language_code === language)
    return translation?.name || item.name_hr
  }

  const getTranslatedDescription = (item: MenuItem): string | undefined => {
    if (language === 'hr') return item.description_hr
    const translation = item.translations?.find(t => t.language_code === language)
    return translation?.description || item.description_hr
  }

  const getTranslatedCategoryName = (category: Category): string => {
    if (language === 'hr') return category.name
    const translation = category.translations?.find(t => t.language_code === language)
    return translation?.name || category.name
  }

  const itemsByCategory: Record<string, MenuItem[]> = {}
  menuItems.forEach(item => {
    const cat = item.category || 'Other'
    if (!itemsByCategory[cat]) itemsByCategory[cat] = []
    itemsByCategory[cat].push(item)
  })

  return (
    <div className="theme-minimal-v1 menu-container">
      <div className="menu-header">
        <h1 className="menu-title">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="menu-description">{restaurant.description}</p>
        )}
      </div>

      {categories
        .sort((a, b) => a.order_index - b.order_index)
        .map(category => {
          const items = itemsByCategory[category.name] || []
          if (items.length === 0) return null

          return (
            <div key={category.id}>
              <h2 className="category-title">{getTranslatedCategoryName(category)}</h2>
              {items.map(item => (
                <div key={item.id} className="menu-item">
                  <div>
                    <h3 className="menu-item-name">{getTranslatedName(item)}</h3>
                    {getTranslatedDescription(item) && (
                      <p className="menu-item-description">{getTranslatedDescription(item)}</p>
                    )}
                    <div className="menu-item-price">{item.price.toFixed(2)} €</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
    </div>
  )
}

