import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { MenuItem } from '../lib/api'

export interface BurgerCustomization {
  breadType?: 'pecivo' | 'lepinja'
  ingredients?: {
    [key: string]: boolean
  }
}

interface CartItem {
  menu_item: MenuItem
  quantity: number
  customization?: BurgerCustomization
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: MenuItem, quantity?: number, customization?: BurgerCustomization) => void
  removeItem: (itemId: string, customization?: BurgerCustomization) => void
  updateQuantity: (itemId: string, quantity: number, customization?: BurgerCustomization) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (menu_item: MenuItem, quantity: number = 1, customization?: BurgerCustomization) => {
    setItems((prevItems) => {
      // For items with customization, always create a new cart item
      if (customization) {
        return [...prevItems, { menu_item, quantity, customization }]
      }
      
      // For items without customization, check if exact same item exists
      const existingItem = prevItems.find(
        (item) => item.menu_item.id === menu_item.id && !item.customization
      )
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.menu_item.id === menu_item.id && !item.customization
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      return [...prevItems, { menu_item, quantity }]
    })
  }

  const removeItem = (itemId: string, customization?: BurgerCustomization) => {
    setItems((prevItems) => {
      if (customization) {
        // Remove specific customized item
        return prevItems.filter((item) => 
          !(item.menu_item.id === itemId && 
            JSON.stringify(item.customization) === JSON.stringify(customization))
        )
      }
      // Remove all items with this ID (including customized)
      return prevItems.filter((item) => item.menu_item.id !== itemId)
    })
  }

  const updateQuantity = (itemId: string, quantity: number, customization?: BurgerCustomization) => {
    if (quantity <= 0) {
      removeItem(itemId, customization)
      return
    }
    
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (customization) {
          // Update specific customized item
          const matchesCustomization = JSON.stringify(item.customization) === JSON.stringify(customization)
          if (item.menu_item.id === itemId && matchesCustomization) {
            return { ...item, quantity }
          }
          return item
        } else {
          // Update non-customized item
          if (item.menu_item.id === itemId && !item.customization) {
            return { ...item, quantity }
          }
          return item
        }
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      return total + item.menu_item.price * item.quantity
    }, 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

