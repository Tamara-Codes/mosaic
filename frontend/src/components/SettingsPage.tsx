import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Building2, Lock, Sparkles } from 'lucide-react'
import { useApiClient } from '@/lib/apiHelpers'
import { useUser } from '@clerk/clerk-react'

interface SettingsPageProps {
  onRestaurantCreated?: () => void
}

export function SettingsPage({ onRestaurantCreated }: SettingsPageProps = {}) {
  const apiClient = useApiClient()
  const { user } = useUser()
  const [restaurantName, setRestaurantName] = useState('Restaurant Menu')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [aiImagePrompt, setAiImagePrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

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
      setAiImagePrompt(info.ai_image_prompt || '')
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
      formData.append('ai_image_prompt', aiImagePrompt)
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

  const handleChangePassword = async () => {
    if (!user) {
      toast.error('Korisnik nije prijavljen')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Lozinke se ne podudaraju')
      return
    }
    
    if (newPassword.length < 8) {
      toast.error('Lozinka mora imati najmanje 8 znakova')
      return
    }

    setPasswordLoading(true)
    try {
      // Use Clerk's updatePassword method
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
        signOutOfOtherSessions: false,
      })
      
      toast.success('Lozinka je promijenjena')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to change password:', error)
      
      // Handle specific Clerk errors
      if (error.errors) {
        const errorMessage = error.errors[0]?.message || 'Greška pri promjeni lozinke'
        toast.error(errorMessage)
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Greška pri promjeni lozinke. Provjerite da li je trenutna lozinka ispravna.')
      }
    } finally {
      setPasswordLoading(false)
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
          <Button onClick={handleSaveRestaurantInfo} disabled={loading}>
            {loading ? 'Spremanje...' : 'Spremi Informacije'}
          </Button>
        </CardContent>
      </Card>

      {/* AI Image Generation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle>AI Generiranje Slika</CardTitle>
          </div>
          <CardDescription>
            Zadani stil za AI generirane slike jela
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aiImagePrompt">Zadani stil fotografije</Label>
            <Textarea
              id="aiImagePrompt"
              value={aiImagePrompt}
              onChange={(e) => setAiImagePrompt(e.target.value)}
              placeholder="npr. Profesionalna food fotografija, bijeli tanjur, rustikalni drveni stol, mekano prirodno osvjetljenje..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Ovaj stil se primjenjuje na sve AI generirane slike. Ostavite prazno za zadani stil.
            </p>
          </div>
          <Button onClick={handleSaveRestaurantInfo} disabled={loading}>
            {loading ? 'Spremanje...' : 'Spremi Postavke'}
          </Button>
        </CardContent>
      </Card>

      {/* Admin Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Admin Postavke</CardTitle>
          </div>
          <CardDescription>
            Promijenite lozinku za pristup admin panelu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Trenutna Lozinka</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Unesite trenutnu lozinku"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Lozinka</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Unesite novu lozinku"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potvrdi Novu Lozinku</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Potvrdite novu lozinku"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={passwordLoading}>
            {passwordLoading ? 'Promjena...' : 'Promijeni Lozinku'}
          </Button>
        </CardContent>
      </Card>

    </div>
  )
}

