import { useState } from 'react'
import type { MenuItem } from '../lib/api'
import { useCart } from '../context/CartContext'
import { Plus, Minus } from 'lucide-react'
import { BurgerCustomizationModal } from './BurgerCustomizationModal'
import type { BurgerCustomization } from '../context/CartContext'

interface MenuItemCardProps {
  item: MenuItem
}

// Check if item is a burger
function isBurger(item: MenuItem): boolean {
  const name = item.name_hr.toLowerCase()
  return name.includes('burger') || name.includes('hamburger')
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addItem, removeItem, items, updateQuantity } = useCart()
  const [showCustomization, setShowCustomization] = useState(false)
  
  // Find items in cart (including customized versions)
  const cartItems = items.filter((i) => i.menu_item.id === item.id)
  const totalQuantity = cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
  
  // Find a non-customized item for quantity display
  const simpleCartItem = cartItems.find((i) => !i.customization)
  const simpleQuantity = simpleCartItem?.quantity || 0

  const handleAdd = () => {
    if (isBurger(item)) {
      setShowCustomization(true)
    } else {
      addItem(item, 1)
    }
  }

  const handleCustomizedAdd = (customization: BurgerCustomization) => {
    addItem(item, 1, customization)
  }

  const handleRemove = () => {
    if (simpleQuantity > 1) {
      updateQuantity(item.id, simpleQuantity - 1, undefined)
    } else if (simpleQuantity === 1) {
      removeItem(item.id, undefined)
    }
  }

  return (
    <>
      <div className="group relative bg-white border-b border-gray-100 transition-all duration-200">
        <div className="flex items-center gap-4 py-4 px-4">
          {/* Image - small thumbnail */}
          {item.image_path && (
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
              <img
                src={item.image_path}
                alt={item.name_hr}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors truncate">
              {item.name_hr}
            </h3>
            {item.description_hr && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {item.description_hr
                  .replace('Jelo s oznakom + PRILOG ima jedan prilog po izboru uključen u cijenu i besplatan.', '')
                  .replace('Prilog po izboru', '')
                  .replace('Dodatni prilog ili salata naplaćuju se 3–4 €.', '')
                  .replace(/Kod nas: 0\.50€ \| Za dostavu: 1\.00€/g, '')
                  .trim()}
              </p>
            )}
            {/* Allergen badges - inline */}
            <div className="flex gap-1 mt-1">
              {item.is_vegetarian && (
                <span className="text-xs text-green-600">V</span>
              )}
              {item.is_vegan && (
                <span className="text-xs text-green-600">VG</span>
              )}
              {item.contains_gluten && (
                <span className="text-xs text-amber-600">G</span>
              )}
              {item.is_spicy && (
                <span className="text-xs">🌶️</span>
              )}
            </div>
          </div>
          
          {/* Price */}
          <div className="flex-shrink-0">
            <span className="font-bold text-gray-900 text-base">
              {item.price.toFixed(2)} <span className="text-gray-500 font-normal">€</span>
            </span>
          </div>
          
          {/* Add/Quantity controls */}
          <div className="flex-shrink-0">
            {simpleQuantity > 0 ? (
              <div className="flex items-center gap-1 bg-yellow-400 rounded-full px-1 py-1 shadow-sm">
                <button
                  onClick={handleRemove}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                  aria-label="Smanji količinu"
                >
                  <Minus className="w-3.5 h-3.5 text-red-600" />
                </button>
                <span className="font-bold text-red-900 min-w-[24px] text-center text-sm">
                  {simpleQuantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                  aria-label="Povećaj količinu"
                >
                  <Plus className="w-3.5 h-3.5 text-red-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-yellow-400 text-white hover:text-red-900 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                aria-label="Dodaj u košaricu"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Show count if there are customized versions */}
        {totalQuantity > simpleQuantity && (
          <div className="absolute bottom-1 right-20 text-xs text-gray-400">
            +{totalQuantity - simpleQuantity} prilagođeno
          </div>
        )}
      </div>

      {/* Burger Customization Modal */}
      {isBurger(item) && (
        <BurgerCustomizationModal
          item={item}
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          onAdd={handleCustomizedAdd}
        />
      )}
    </>
  )
}
