import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApiClient } from '@/lib/apiHelpers'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
// Simple time formatter
const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'upravo sada'
    if (diffMins < 60) return `prije ${diffMins} ${diffMins === 1 ? 'minute' : 'minuta'}`
    if (diffHours < 24) return `prije ${diffHours} ${diffHours === 1 ? 'sata' : 'sati'}`
    if (diffDays < 7) return `prije ${diffDays} ${diffDays === 1 ? 'dana' : 'dana'}`
    
    // Format as date if older
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  } catch {
    return 'nedavno'
  }
}

interface Notification {
  id: string
  type: 'message' | 'order'
  title: string
  message: string
  timestamp: string
  read: boolean
  link: string
  messageId?: string
}

export function NotificationBell() {
  const apiClient = useApiClient()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // Fetch messages and orders in parallel
      const [messagesResponse, ordersResponse] = await Promise.all([
        apiClient.get('/contact-messages').catch(() => ({ data: [] })),
        apiClient.get('/orders').catch(() => ({ data: [] }))
      ])

      const messages = messagesResponse.data || []
      const orders = ordersResponse.data || []

      // Convert to notifications
      const messageNotifications: Notification[] = messages
        .filter((msg: any) => !msg.read)
        .map((msg: any) => ({
          id: `msg-${msg.id}`,
          type: 'message' as const,
          title: 'Nova poruka',
          message: `${msg.name}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`,
          timestamp: msg.created_at,
          read: msg.read,
          link: `/dashboard?view=messages&messageId=${msg.id}`,
          messageId: msg.id
        }))

      const orderNotifications: Notification[] = orders
        .filter((order: any) => order.status === 'pending' || order.status === 'confirmed')
        .map((order: any) => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          title: 'Nova narudžba',
          message: `Narudžba #${order.order_number} - ${order.customer_name}`,
          timestamp: order.created_at,
          read: false,
          link: '/dashboard?view=orders'
        }))

      // Combine and sort by timestamp (newest first)
      const allNotifications = [...messageNotifications, ...orderNotifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10) // Show only latest 10

      setNotifications(allNotifications)
      setUnreadCount(allNotifications.length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load notifications on mount
    loadNotifications()

    // Set up Supabase real-time subscriptions
    let restaurantId: string | null = null
    let messageChannel: any = null
    let orderChannel: any = null

    const setupRealtime = async () => {
      if (!supabase) {
        console.warn('Supabase client not available for real-time')
        return
      }

      try {
        // Get restaurant ID
        const restaurantResponse = await apiClient.get('/restaurant-info')
        restaurantId = restaurantResponse.data?.id

        if (!restaurantId) {
          console.warn('No restaurant ID found for real-time subscriptions')
          return
        }

        // Subscribe to contact_messages changes
        messageChannel = supabase
          .channel(`contact_messages_${restaurantId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'contact_messages',
              filter: `restaurant_id=eq.${restaurantId}`
            },
            (payload) => {
              console.log('[REALTIME] Message change detected:', payload.eventType)
              loadNotifications()
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('Real-time subscription error:', err)
            }
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time: Subscribed to contact_messages')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Real-time: Channel error')
            }
          })

        // Subscribe to orders changes
        orderChannel = supabase
          .channel(`orders_${restaurantId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurantId}`
            },
            (payload) => {
              console.log('[REALTIME] Order change detected:', payload.eventType)
              loadNotifications()
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('Real-time subscription error:', err)
            }
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time: Subscribed to orders')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Real-time: Channel error')
            }
          })
      } catch (error) {
        console.error('Failed to set up real-time subscriptions:', error)
      }
    }

    setupRealtime()

    // Listen for message read events (local updates)
    const handleMessageRead = () => {
      loadNotifications()
    }

    window.addEventListener('message:markedRead', handleMessageRead)

    return () => {
      if (messageChannel && supabase) {
        supabase.removeChannel(messageChannel)
      }
      if (orderChannel && supabase) {
        supabase.removeChannel(orderChannel)
      }
      window.removeEventListener('message:markedRead', handleMessageRead)
    }
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    // Dispatch custom event to change view
    const view = notification.type === 'message' ? 'messages' : 'orders'
    const detail: any = { view }
    
    // If it's a message notification, include the message ID
    if (notification.type === 'message' && notification.messageId) {
      detail.messageId = notification.messageId
    }
    
    window.dispatchEvent(new CustomEvent('dashboard:changeView', { detail }))
    
    // Also navigate in case we're not on dashboard
    navigate('/dashboard', { state: detail })
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-600"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Obavijesti</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Učitavanje...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nema novih obavijesti
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{notification.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('dashboard:changeView', { detail: { view: 'messages' } }))
            navigate('/dashboard', { state: { view: 'messages' } })
          }}
        >
          Pregledaj sve poruke
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-center justify-center"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('dashboard:changeView', { detail: { view: 'orders' } }))
            navigate('/dashboard', { state: { view: 'orders' } })
          }}
        >
          Pregledaj sve narudžbe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

