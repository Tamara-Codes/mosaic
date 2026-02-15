import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApiClient } from '@/lib/apiHelpers'
import { supabase } from '@/lib/supabase'
import { useRestaurantId } from '@/hooks/useRestaurantId'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bok! 👋 Ja sam tvoj Ferros AI asistent. Samo mi reci što trebaš!'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiClient = useApiClient()
  const restaurantId = useRestaurantId()

  // Fetch restaurant slug on mount (only once)
  useEffect(() => {
    const fetchRestaurantSlug = async () => {
      try {
        const response = await apiClient.get('/restaurant-info')
        if (response.data?.slug) {
          setRestaurantSlug(response.data.slug)
        }
      } catch (error) {
        console.error('Failed to fetch restaurant slug:', error)
      }
    }
    fetchRestaurantSlug()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount - apiClient is now memoized

  // Listen for open chatbot event from sidebar
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true)
    }
    window.addEventListener('openChatbot', handleOpenChatbot)
    return () => {
      window.removeEventListener('openChatbot', handleOpenChatbot)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    if (!restaurantSlug) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Restaurant slug nije dostupan. Provjeri postavke restorana.'
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to UI immediately
    const newUserMessage: Message = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await apiClient.post('/chatbot/message', {
        message: userMessage,
        restaurant_slug: restaurantSlug,
        conversation_history: conversationHistory
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationHistory(response.data.conversation_history || [])

      // If tools were called, send broadcast to refresh UI
      console.log('[CHATBOT] Checking broadcast conditions:', {
        tools_were_called: response.data.tools_were_called,
        restaurantId: restaurantId,
        hasSupabase: !!supabase
      })
      
      if (response.data.tools_were_called && restaurantId && supabase) {
        // Use a fire-and-forget approach to avoid blocking
        const channelName = `menu-updates-${restaurantId}`
        console.log('[CHATBOT] Sending broadcast to channel:', channelName)
        
        // Create and subscribe to channel asynchronously
        const sendBroadcast = async () => {
          try {
            const channel = supabase.channel(channelName, {
              config: {
                broadcast: { self: true, ack: false }
              }
            })

            // Subscribe without waiting - just start it
            channel.subscribe((status, err) => {
              if (err) {
                console.error('[CHATBOT] Channel subscription error:', err)
                return
              }
              console.log('[CHATBOT] Channel subscription status:', status)
              
              // Once subscribed, send the message
              if (status === 'SUBSCRIBED') {
                channel.send({
                  type: 'broadcast',
                  event: 'menu_changed',
                  payload: {
                    timestamp: Date.now(),
                    restaurantId: restaurantId,
                    source: 'chatbot'
                  }
                }).then(() => {
                  console.log('✅ [CHATBOT] Broadcast sent successfully')
                  // Clean up after a delay
                  setTimeout(() => {
                    supabase.removeChannel(channel)
                    console.log('[CHATBOT] Removed channel:', channelName)
                  }, 2000)
                }).catch((sendError) => {
                  console.error('[CHATBOT] Error sending broadcast:', sendError)
                  supabase.removeChannel(channel)
                })
              }
            })
          } catch (error) {
            console.error('[CHATBOT] Failed to set up broadcast:', error)
          }
        }
        
        // Start the broadcast process (don't await - fire and forget)
        sendBroadcast()
      } else {
        console.log('[CHATBOT] Skipping broadcast - conditions not met')
      }
    } catch (error: any) {
      console.error('Chatbot error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Ups, nešto je pošlo po zlu! 😅 Pokušaj ponovno za trenutak.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-96 h-[500px] bg-[#18181b] border border-orange-500/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-orange-500 border-b border-orange-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/ferros-logo.png" 
                alt="Ferros AI" 
                className="w-10 h-10 object-contain"
              />
              <h3 className="text-white font-semibold">Ferros AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-orange-100 transition-colors"
              aria-label="Close chatbot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-800/50 text-zinc-200 border border-orange-500/10'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/50 text-zinc-200 border border-orange-500/10 rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-orange-500/20 p-4 bg-zinc-900/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pitaj me bilo što..."
                className="flex-1 bg-zinc-800/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

