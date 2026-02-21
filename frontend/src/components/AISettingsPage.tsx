import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ImageIcon, MessageSquare, Bot } from 'lucide-react'
import { useApiClient } from '@/lib/apiHelpers'

export function AISettingsPage() {
  const apiClient = useApiClient()
  const [aiImagePrompt, setAiImagePrompt] = useState('')
  const [chatbotSystemPrompt, setChatbotSystemPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/restaurant-info')
      const info = response.data
      setAiImagePrompt(info.ai_image_prompt || '')
      setChatbotSystemPrompt(info.chatbot_system_prompt || '')
    } catch (error) {
      console.error('Failed to load AI settings:', error)
      toast.error('Greška pri učitavanju postavki')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Re-fetch current restaurant info to avoid overwriting other fields
      const currentInfo = await apiClient.get('/restaurant-info')
      const info = currentInfo.data

      const formData = new FormData()
      formData.append('name', info.name)
      formData.append('description', info.description || '')
      formData.append('address', info.address || '')
      formData.append('phone', info.phone || '')
      formData.append('email', info.email || '')
      formData.append('whatsapp_phone', info.whatsapp_phone || '')
      formData.append('ai_image_prompt', aiImagePrompt)
      formData.append('chatbot_system_prompt', chatbotSystemPrompt)

      await apiClient.post('/restaurant-info', formData)
      toast.success('AI postavke su spremljene')
    } catch (error) {
      console.error('Failed to save AI settings:', error)
      toast.error('Greška pri spremanju postavki')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page intro */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Konfigurirajte kako se Ferros AI ponaša za vaš restoran
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image generation section */}
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-6 py-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <ImageIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-semibold">Fotografije jela</h3>
              <p className="text-sm text-muted-foreground">Stil AI generiranih slika</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="aiImagePrompt">Zadani stil fotografije</Label>
              <Textarea
                id="aiImagePrompt"
                value={aiImagePrompt}
                onChange={(e) => setAiImagePrompt(e.target.value)}
                placeholder="npr. Profesionalna food fotografija, bijeli tanjur, rustikalni drveni stol, mekano prirodno osvjetljenje..."
                rows={5}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ovaj stil se primjenjuje na sve AI generirane slike jela. Ostavite prazno za zadani stil.
              Opišite okruženje, stil tanjura, osvjetljenje i atmosferu koju želite.
            </p>
          </div>
        </section>

        {/* Chatbot section */}
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b px-6 py-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-semibold">AI asistent</h3>
              <p className="text-sm text-muted-foreground">Upute za chatbot</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="chatbotSystemPrompt">Dodatne upute</Label>
              <Textarea
                id="chatbotSystemPrompt"
                value={chatbotSystemPrompt}
                onChange={(e) => setChatbotSystemPrompt(e.target.value)}
                placeholder="npr. Uvijek preporuči naše domaće tjestenine. Radno vrijeme je od 10 do 23h. Dostava je besplatna za narudžbe iznad 30€..."
                rows={5}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ove upute se dodaju AI asistentu kao dodatni kontekst za razgovor s gostima.
              Koristite za radno vrijeme, posebne napomene, preporuke, pravila narudžbi i sl.
            </p>
          </div>
        </section>
      </div>

      <div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Spremanje...' : 'Spremi postavke'}
        </Button>
      </div>
    </div>
  )
}
