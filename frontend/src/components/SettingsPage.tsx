import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { useApiClient } from '@/lib/apiHelpers'

interface SettingsPageProps {
  onRestaurantCreated?: () => void
}

export function SettingsPage({ onRestaurantCreated }: SettingsPageProps = {}) {
  const apiClient = useApiClient()
  const [restaurantName, setRestaurantName] = useState('Restaurant Menu')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRestaurantInfo()
  }, [])

  const loadRestaurantInfo = async () => {
    try {
      const response = await apiClient.get('/restaurant-info')
      const info = response.data
      setRestaurantName(info.name || 'Restaurant Menu')
      setRestaurantDescription(info.description || '')
      setAddress(info.address || '')
      setPhone(info.phone || '')
      setEmail(info.email || '')
      setWhatsappPhone(info.whatsapp_phone || '')
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const errorMessage = error?.response?.data?.detail || 'Restaurant not found'
        toast.error(
          errorMessage.includes('contact') 
            ? errorMessage 
            : 'Restoran nije pronađen. Molimo kontaktirajte administratora.'
        )
      } else {
        console.error('Failed to load restaurant info:', error)
        toast.error('Greška pri učitavanju informacija o restoranu')
      }
    }
  }

  const handleSaveRestaurantInfo = async () => {
    if (!restaurantName.trim()) {
      toast.error('Unesite naziv restorana')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', restaurantName)
      formData.append('description', restaurantDescription)
      formData.append('address', address)
      formData.append('phone', phone)
      formData.append('email', email)
      formData.append('whatsapp_phone', whatsappPhone)
      await apiClient.post('/restaurant-info', formData)
      toast.success('Informacije o restoranu su spremljene')
      // Notify parent that restaurant was created/updated
      if (onRestaurantCreated) {
        onRestaurantCreated()
      }
    } catch (error: any) {
      console.error('Failed to save restaurant info:', error)
      toast.error('Greška pri spremanju informacija')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Restaurant Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Informacije o Restoranu</CardTitle>
          </div>
          <CardDescription>
            Osnovne informacije o vašem restoranu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Naziv Restorana</Label>
            <Input
              id="restaurantName"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Unesite naziv restorana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurantDescription">Opis</Label>
            <Input
              id="restaurantDescription"
              value={restaurantDescription}
              onChange={(e) => setRestaurantDescription(e.target.value)}
              placeholder="Kratak opis restorana"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Unesite adresu"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+385 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="restaurant@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappPhone">WhatsApp broj</Label>
            <Input
              id="whatsappPhone"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="+385 XX XXX XXXX"
            />
            <p className="text-sm text-muted-foreground">
              Broj za WhatsApp chatbot integraciju. Poruke s ovog broja će biti obrađene od strane AI asistenta.
            </p>
          </div>
          <Button onClick={handleSaveRestaurantInfo} disabled={loading}>
            {loading ? 'Spremanje...' : 'Spremi Informacije'}
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}

