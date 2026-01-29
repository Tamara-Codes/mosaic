import { useState, useEffect } from 'react'
import { useApiClient } from '@/lib/apiHelpers'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ShoppingCart, Clock, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react'
// Date formatting helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  item_name: string
  item_description?: string
  customization?: {
    breadType?: 'pecivo' | 'lepinja'
    ingredients?: { [key: string]: boolean }
  }
  menu_items?: {
    name_hr: string
    description_hr?: string
  }
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address?: string
  order_type: 'delivery' | 'pickup'
  status: string
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Na čekanju', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Potvrđeno', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  preparing: { label: 'U pripremi', color: 'bg-orange-100 text-orange-800', icon: Package },
  ready: { label: 'Spremno', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Završeno', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Otkazano', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function OrdersPage() {
  const apiClient = useApiClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/orders')
      setOrders(response.data)
    } catch (error: any) {
      console.error('Failed to load orders:', error)
      toast.error('Greška pri učitavanju narudžbi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    
    // Set up Supabase real-time subscription
    let restaurantId: string | null = null
    let orderChannel: any = null

    const setupRealtime = async () => {
      if (!supabase) {
        console.warn('Supabase not available')
        return
      }

      try {
        // Get restaurant ID
        const restaurantResponse = await apiClient.get('/api/restaurant-info')
        restaurantId = restaurantResponse.data?.id

        if (!restaurantId) {
          console.warn('No restaurant ID found')
          return
        }

        // Subscribe to orders changes
        orderChannel = supabase
          .channel(`orders_page_${restaurantId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurantId}`
            },
            (payload) => {
              console.log('[REALTIME] Order change:', payload.eventType)
              loadOrders()
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('Real-time subscription error:', err)
            }
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time: Subscribed to orders')
            }
          })
      } catch (error) {
        console.error('Failed to set up real-time subscription:', error)
      }
    }

    setupRealtime()

    return () => {
      if (orderChannel && supabase) {
        supabase.removeChannel(orderChannel)
      }
    }
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus })
      toast.success('Status narudžbe ažuriran')
      await loadOrders()
    } catch (error: any) {
      console.error('Failed to update order status:', error)
      toast.error('Greška pri ažuriranju statusa')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return <Icon className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500">Upravljajte narudžbama kupaca</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {orders.length} {orders.length === 1 ? 'narudžba' : 'narudžbi'}
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nema narudžbi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.pending
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {statusInfo.label}
                        </span>
                      </Badge>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={updatingStatus === order.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Na čekanju</SelectItem>
                          <SelectItem value="confirmed">Potvrđeno</SelectItem>
                          <SelectItem value="preparing">U pripremi</SelectItem>
                          <SelectItem value="ready">Spremno</SelectItem>
                          <SelectItem value="completed">Završeno</SelectItem>
                          <SelectItem value="cancelled">Otkazano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Kupac</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Ime:</span> {order.customer_name}</p>
                        <p><span className="font-medium">Telefon:</span> {order.customer_phone}</p>
                        {order.customer_email && (
                          <p><span className="font-medium">Email:</span> {order.customer_email}</p>
                        )}
                        <p>
                          <span className="font-medium">Tip:</span>{' '}
                          <Badge variant="outline">
                            {order.order_type === 'delivery' ? 'Dostava' : 'Preuzimanje'}
                          </Badge>
                        </p>
                        {order.delivery_address && (
                          <p><span className="font-medium">Adresa:</span> {order.delivery_address}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.item_name || item.menu_items?.name_hr || 'Nepoznata stavka'}
                              </p>
                              {item.customization && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.customization.breadType && (
                                    <span>Kruh: {item.customization.breadType === 'pecivo' ? 'Pecivo' : 'Lepinja'}</span>
                                  )}
                                  {item.customization.ingredients && Object.keys(item.customization.ingredients).length > 0 && (
                                    <span className="ml-2">
                                      Sastojci: {Object.entries(item.customization.ingredients)
                                        .filter(([_, included]) => included)
                                        .map(([ingredient]) => ingredient)
                                        .join(', ')}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-gray-500">x{item.quantity}</p>
                            </div>
                            <p className="font-medium">{item.unit_price.toFixed(2)} €</p>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t font-bold">
                          <span>Ukupno:</span>
                          <span>{order.total_amount.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {order.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm"><span className="font-medium">Napomena:</span> {order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

