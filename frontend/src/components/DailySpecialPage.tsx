import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Sparkles, UtensilsCrossed, Pencil, Wand2, Upload, Loader2, X } from 'lucide-react'
import { useApiClient } from '@/lib/apiHelpers'

interface MenuItem {
  id: string
  name_hr: string
  description_hr?: string
  price: number
  image_path?: string
}

interface Promotion {
  id?: string
  title: string
  menu_item_id: string | null
  custom_name: string | null
  custom_description: string | null
  custom_price: number | null
  image_url: string | null
  is_active: boolean
  menu_item?: MenuItem
}

const TITLE_PRESETS = ['Dnevna ponuda', 'Ulov dana', 'Preporuka kuhara']

export function DailySpecialPage() {
  const apiClient = useApiClient()
  const [promotion, setPromotion] = useState<Promotion>({
    title: 'Dnevna ponuda',
    menu_item_id: null,
    custom_name: null,
    custom_description: null,
    custom_price: null,
    image_url: null,
    is_active: false,
  })
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [sourceType, setSourceType] = useState<'menu-item' | 'custom'>('menu-item')
  const [customTitle, setCustomTitle] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [promoRes, itemsRes] = await Promise.all([
        apiClient.get('/promotion'),
        apiClient.get('/menu-items'),
      ])

      if (promoRes.data) {
        setPromotion(promoRes.data)
        if (promoRes.data.custom_name) {
          setSourceType('custom')
        }
        if (!TITLE_PRESETS.includes(promoRes.data.title)) {
          setCustomTitle(true)
        }
      }

      setMenuItems(itemsRes.data || [])
    } catch (error) {
      console.error('Failed to load promotion data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        title: promotion.title,
        menu_item_id: sourceType === 'menu-item' ? promotion.menu_item_id : null,
        custom_name: sourceType === 'custom' ? promotion.custom_name : null,
        custom_description: sourceType === 'custom' ? promotion.custom_description : null,
        custom_price: sourceType === 'custom' ? promotion.custom_price : null,
        image_url: promotion.image_url,
        is_active: promotion.is_active,
      }

      const response = await apiClient.post('/promotion', payload)
      setPromotion(response.data)
      toast.success('Dnevna ponuda je spremljena')
    } catch (error) {
      console.error('Failed to save promotion:', error)
      toast.error('Greška pri spremanju')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateImage = async () => {
    const dishName = sourceType === 'menu-item' ? selectedMenuItem?.name_hr : promotion.custom_name
    if (!dishName) {
      toast.error('Prvo odaberite ili unesite jelo')
      return
    }

    setGeneratingImage(true)
    try {
      const dishDesc = sourceType === 'menu-item' ? selectedMenuItem?.description_hr : promotion.custom_description
      const response = await apiClient.post('/generate-image', {
        dish_name: dishName,
        dish_description: dishDesc || '',
      })

      if (response.data?.image_url) {
        setPromotion(prev => ({ ...prev, image_url: response.data.image_url }))
        toast.success('Slika je generirana')
      }
    } catch (error) {
      console.error('Failed to generate image:', error)
      toast.error('Greška pri generiranju slike')
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Dozvoljeni formati: JPEG, PNG, WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maksimalna veličina slike je 5MB')
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await apiClient.post('/promotion/upload-image', formData)
      if (response.data?.image_url) {
        setPromotion(prev => ({ ...prev, image_url: response.data.image_url }))
        toast.success('Slika je učitana')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      toast.error('Greška pri učitavanju slike')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedMenuItem = menuItems.find(i => i.id === promotion.menu_item_id)

  // Derive display values for the preview
  const previewName = sourceType === 'menu-item' ? selectedMenuItem?.name_hr : promotion.custom_name
  const previewDesc = sourceType === 'menu-item' ? selectedMenuItem?.description_hr : promotion.custom_description
  const previewPrice = sourceType === 'menu-item' ? selectedMenuItem?.price : promotion.custom_price
  const previewImage = promotion.image_url || (sourceType === 'menu-item' ? selectedMenuItem?.image_path : null)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${promotion.is_active ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">
              {promotion.is_active ? 'Ponuda je aktivna' : 'Ponuda je isključena'}
            </p>
            <p className="text-sm text-muted-foreground">
              {promotion.is_active
                ? 'Posjetitelji vašeg menija vide ovu ponudu'
                : 'Uključite da posjetitelji vide ponudu na javnom jelovniku'}
            </p>
          </div>
        </div>
        <Switch
          checked={promotion.is_active}
          onCheckedChange={(checked) =>
            setPromotion(prev => ({ ...prev, is_active: checked }))
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column — form */}
        <div className="lg:col-span-3 space-y-8">

          {/* Title section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Naslov</h3>
            <div className="flex flex-wrap gap-2">
              {TITLE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setCustomTitle(false)
                    setPromotion(prev => ({ ...prev, title: preset }))
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !customTitle && promotion.title === preset
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => setCustomTitle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  customTitle
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                Prilagođeno
              </button>
            </div>
            {customTitle && (
              <Input
                value={promotion.title}
                onChange={(e) => setPromotion(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Unesite naslov..."
                className="max-w-sm"
              />
            )}
          </section>

          {/* Source section */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Jelo</h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSourceType('menu-item')}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  sourceType === 'menu-item'
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted hover:bg-muted/80'
                }`}
              >
                <UtensilsCrossed className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Iz jelovnika</p>
                  <p className="text-xs text-muted-foreground">Odaberite postojeće jelo</p>
                </div>
              </button>
              <button
                onClick={() => setSourceType('custom')}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  sourceType === 'custom'
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted hover:bg-muted/80'
                }`}
              >
                <Pencil className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Prilagođeno</p>
                  <p className="text-xs text-muted-foreground">Unesite ručno</p>
                </div>
              </button>
            </div>

            {sourceType === 'menu-item' ? (
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                value={promotion.menu_item_id || ''}
                onChange={(e) =>
                  setPromotion(prev => ({ ...prev, menu_item_id: e.target.value || null }))
                }
              >
                <option value="">Odaberite jelo...</option>
                {menuItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name_hr} — €{item.price.toFixed(2)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-4 rounded-xl border bg-card p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="customName">Naziv jela</Label>
                  <Input
                    id="customName"
                    value={promotion.custom_name || ''}
                    onChange={(e) =>
                      setPromotion(prev => ({ ...prev, custom_name: e.target.value }))
                    }
                    placeholder="npr. Grill plata za dvoje"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customDescription">Opis</Label>
                  <Textarea
                    id="customDescription"
                    value={promotion.custom_description || ''}
                    onChange={(e) =>
                      setPromotion(prev => ({ ...prev, custom_description: e.target.value }))
                    }
                    placeholder="Kratak opis jela..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customPrice">Cijena (€)</Label>
                  <Input
                    id="customPrice"
                    type="number"
                    step="0.01"
                    value={promotion.custom_price ?? ''}
                    onChange={(e) =>
                      setPromotion(prev => ({
                        ...prev,
                        custom_price: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    placeholder="0.00"
                    className="max-w-[160px]"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Image section */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Slika</h3>
            {promotion.image_url ? (
              <div className="relative rounded-xl overflow-hidden border bg-muted w-fit">
                <img
                  src={promotion.image_url}
                  alt="Promotion"
                  className="h-40 w-auto object-cover"
                />
                <button
                  onClick={() => setPromotion(prev => ({ ...prev, image_url: null }))}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {sourceType === 'menu-item' && selectedMenuItem?.image_path
                  ? 'Slika s jelovnika se koristi automatski. Možete dodati drugu sliku.'
                  : 'Dodajte sliku za ponudu.'}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateImage}
                disabled={generatingImage || (!previewName)}
              >
                {generatingImage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                {generatingImage ? 'Generiranje...' : 'Generiraj AI sliku'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Učitaj sliku
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </section>

          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Spremanje...' : 'Spremi promjene'}
          </Button>
        </div>

        {/* Right column — live preview */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pregled</h3>
          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            {previewImage ? (
              <div className="h-40 overflow-hidden bg-muted">
                <img
                  src={previewImage}
                  alt={previewName || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-40 bg-muted flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="p-5 text-center space-y-1.5">
              <p className="text-xs font-medium text-primary uppercase tracking-wider">
                {promotion.title}
              </p>
              <p className="font-serif text-xl font-semibold">
                {previewName || <span className="text-muted-foreground italic">Naziv jela</span>}
              </p>
              {previewDesc && (
                <p className="text-sm text-muted-foreground">{previewDesc}</p>
              )}
              {previewPrice != null && (
                <p className="text-lg font-semibold text-primary">€{Number(previewPrice).toFixed(2)}</p>
              )}
              <div className="pt-3">
                <div className="inline-block rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                  Pogledaj jelovnik
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Ovako posjetitelji vide ponudu na javnom jelovniku
          </p>
        </div>
      </div>
    </div>
  )
}
