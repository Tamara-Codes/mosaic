import { useState, useEffect } from 'react'
import { useApiClient } from '@/lib/apiHelpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Mail, Phone, MapPin, Clock, CheckCircle2, Loader2 } from 'lucide-react'
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

interface ContactMessage {
  id: string
  restaurant_id: string
  name: string
  email: string
  phone?: string
  message: string
  created_at: string
  read: boolean
}

export function MessagesPage() {
  const apiClient = useApiClient()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/contact-messages')
      setMessages(response.data)
    } catch (error: any) {
      console.error('Failed to load messages:', error)
      toast.error('Greška pri učitavanju poruka')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(loadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (messageId: string) => {
    try {
      setMarkingRead(messageId)
      await apiClient.put(`/contact-messages/${messageId}/read`)
      toast.success('Poruka označena kao pročitana')
      await loadMessages()
    } catch (error: any) {
      console.error('Failed to mark message as read:', error)
      toast.error('Greška pri označavanju poruke')
    } finally {
      setMarkingRead(null)
    }
  }

  const unreadCount = messages.filter(m => !m.read).length

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
          <h1 className="text-3xl font-bold text-gray-900">Poruke</h1>
          <p className="text-gray-500 mt-1">Upravljajte porukama kupaca</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {unreadCount} {unreadCount === 1 ? 'nepročitana' : 'nepročitanih'}
          </Badge>
        )}
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Nema poruka</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                !message.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{message.name}</CardTitle>
                      {!message.read && (
                        <Badge variant="default" className="bg-blue-500">Nova</Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {message.email}
                      </span>
                      {message.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {message.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </span>
                    </CardDescription>
                  </div>
                  {!message.read && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(message.id)
                      }}
                      disabled={markingRead === message.id}
                    >
                      {markingRead === message.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Označi kao pročitano
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 line-clamp-2">{message.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMessage.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedMessage.email}
                    </span>
                    {selectedMessage.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedMessage.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(selectedMessage.created_at)}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Poruka:</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              {!selectedMessage.read && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      handleMarkAsRead(selectedMessage.id)
                      setSelectedMessage(null)
                    }}
                    disabled={markingRead === selectedMessage.id}
                  >
                    {markingRead === selectedMessage.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Označi kao pročitano
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

