import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import type { Restaurant } from '../lib/api'
import { ShoppingBag, X, Trash2 } from 'lucide-react'

interface ShoppingCartProps {
  restaurant: Restaurant
}

export function ShoppingCart({ restaurant }: ShoppingCartProps) {
  const { items, getTotalPrice, getTotalItems, removeItem, updateQuantity, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const handleCheckout = () => {
    if (items.length === 0) return
    setIsOpen(false)
    navigate('/checkout', { state: { restaurant } })
  }

  if (totalItems === 0 && !isOpen) {
    return null
  }

  return (
    <>
      {/* Cart Button - More subtle design */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all z-50 flex items-center gap-2 hover:scale-105"
        aria-label="Košarica"
      >
        <ShoppingBag className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Košarica</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Zatvori"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Vaša košarica je prazna</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((cartItem, index) => (
                    <div
                      key={`${cartItem.menu_item.id}-${index}-${JSON.stringify(cartItem.customization)}`}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {cartItem.menu_item.name_hr}
                        </h3>
                        {cartItem.customization && (
                          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            {cartItem.customization.breadType && (
                              <p>• {cartItem.customization.breadType === 'pecivo' ? 'Hamburger pecivo' : 'Lepinja'}</p>
                            )}
                            {cartItem.customization.ingredients && (
                              <p className="text-gray-500">
                                {Object.entries(cartItem.customization.ingredients)
                                  .filter(([_, selected]) => selected)
                                  .map(([ing]) => ing)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {cartItem.menu_item.price.toFixed(2)} € × {cartItem.quantity}
                        </p>
                        <p className="text-sm font-semibold text-red-600 mt-1">
                          {(cartItem.menu_item.price * cartItem.quantity).toFixed(2)} €
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (cartItem.quantity > 1) {
                              updateQuantity(cartItem.menu_item.id, cartItem.quantity - 1)
                            } else {
                              removeItem(cartItem.menu_item.id, cartItem.customization)
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateQuantity(cartItem.menu_item.id, cartItem.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(cartItem.menu_item.id, cartItem.customization)}
                          className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
                          aria-label="Ukloni"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Ukupno:</span>
                  <span className="text-red-600">{totalPrice.toFixed(2)} €</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Nastavi na narudžbu
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Isprazni košaricu
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

