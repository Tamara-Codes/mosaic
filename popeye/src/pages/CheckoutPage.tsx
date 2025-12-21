import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api, type Restaurant } from '../lib/api'
import { ArrowLeft, Loader2 } from 'lucide-react'

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, getTotalPrice, clearCart } = useCart()
  const restaurant = (location.state?.restaurant as Restaurant) || null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/')
    }
  }, [items, navigate, orderPlaced])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!customerName.trim()) {
      setError('Ime je obavezno')
      return
    }
    if (!customerPhone.trim()) {
      setError('Telefon je obavezan')
      return
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Adresa dostave je obavezna')
      return
    }
    if (!restaurant) {
      setError('Restoran nije pronađen')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        restaurant_slug: restaurant.slug,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
        order_type: orderType,
        items: items.map((item) => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          unit_price: item.menu_item.price,
          customization: item.customization || undefined,
        })),
        notes: notes.trim() || undefined,
      }

      const order = await api.createOrder(orderData)
      setOrderNumber(order.order_number)
      setOrderPlaced(true)
      clearCart()
    } catch (err: any) {
      console.error('Failed to create order:', err)
      setError(err.response?.data?.detail || 'Greška pri kreiranju narudžbe. Pokušajte ponovno.')
    } finally {
      setLoading(false)
    }
  }

  if (orderPlaced && orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Narudžba je primljena!</h1>
          <p className="text-gray-600 mb-4">
            Vaša narudžba broj <span className="font-semibold text-blue-600">{orderNumber}</span> je uspješno kreirana.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {orderType === 'delivery'
              ? 'Vaša narudžba će biti dostavljena na navedenu adresu.'
              : 'Vaša narudžba će biti spremna za preuzimanje.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Povratak na jelovnik
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Natrag"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Narudžba</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sažetak narudžbe</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.menu_item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.menu_item.name_hr} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {(item.menu_item.price * item.quantity).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
            <span>Ukupno:</span>
            <span className="text-blue-600">{getTotalPrice().toFixed(2)} €</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Podaci za narudžbu</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Ime i prezime <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ivan Horvat"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+385 91 123 4567"
            />
          </div>

          {/* Customer Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email (opcionalno)
            </label>
            <input
              type="email"
              id="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ivan@example.com"
            />
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip narudžbe <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  orderType === 'pickup'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Preuzimanje
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  orderType === 'delivery'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                Dostava
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          {orderType === 'delivery' && (
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Adresa dostave <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required={orderType === 'delivery'}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ulica i broj, Grad, Poštanski broj"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Napomene (opcionalno)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dodatne napomene za vašu narudžbu..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kreiranje narudžbe...
              </>
            ) : (
              `Naruči (${getTotalPrice().toFixed(2)} €)`
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Plaćanje se vrši prilikom preuzimanja/dostave
          </p>
        </form>
      </main>

      {/* Copyright */}
      <div className="border-t border-gray-200 mt-20 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bistro Popeye. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  )
}

