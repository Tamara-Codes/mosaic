import { useState, useEffect } from 'react'
import { type MenuItem } from '@/lib/api'
import { useApiClient } from '@/lib/apiHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/clerk-react'
import { Utensils, Coffee } from 'lucide-react'

interface MenuItemFormProps {
  item?: MenuItem | null
  presetCategory?: string // When set, category is locked to this value
  onSuccess: () => void
  onCancel: () => void
}

export function MenuItemForm({ item, presetCategory, onSuccess, onCancel }: MenuItemFormProps) {
  const apiClient = useApiClient()
  const { userId } = useAuth()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name_hr: item?.name_hr || '',
    description_hr: item?.description_hr || '',
    price: item?.price || 0,
    category_id: presetCategory || item?.category_id || '',
    item_type: item?.item_type || 'food',
    is_available: item?.is_available ?? true,
    is_vegetarian: item?.is_vegetarian ?? false,
    is_vegan: item?.is_vegan ?? false,
    contains_gluten: item?.contains_gluten ?? false,
    contains_dairy: item?.contains_dairy ?? false,
    contains_nuts: item?.contains_nuts ?? false,
    contains_fish: item?.contains_fish ?? false,
    contains_shellfish: item?.contains_shellfish ?? false,
    contains_eggs: item?.contains_eggs ?? false,
    is_spicy: item?.is_spicy ?? false,
  })
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{id: number, name: string}[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [useCustomCategory, setUseCustomCategory] = useState(false)

  useEffect(() => {
    loadCategories()
    loadRestaurantInfo()
  }, [])

  // Reload categories when form opens/closes or when item changes
  useEffect(() => {
    if (item) {
      loadCategories()
    }
  }, [item])

  const loadRestaurantInfo = async () => {
    try {
      const response = await apiClient.get('/api/restaurant-info')
      setRestaurantId(response.data.id)
    } catch (error) {
      console.error('Failed to load restaurant info:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories')
      const data = response.data
      setCategories(data.categories_with_ids || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Greška pri učitavanju kategorija')
      setCategories([]) // Set empty array on error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate category
    const categoryValue = presetCategory || formData.category_id
    if (!categoryValue) {
      toast.error('Molimo odaberite kategoriju')
      setLoading(false)
      return
    }

    try {
      // If creating a new category, save it first
      let finalCategoryId = categoryValue
      if (!presetCategory && useCustomCategory && categoryInput.trim()) {
        try {
          const formDataCategory = new FormData()
          formDataCategory.append('name', categoryInput.trim())
          const response = await apiClient.post('/api/categories', formDataCategory)
          finalCategoryId = response.data.id
          await loadCategories() // Reload categories list
          toast.success('Nova kategorija je dodana')
        } catch (error: any) {
          console.error('Failed to create category:', error)
          toast.error('Greška pri kreiranju kategorije')
          setLoading(false)
          return
        }
      }

      const formDataToSend = new FormData()
      formDataToSend.append('name_hr', formData.name_hr)
      formDataToSend.append('description_hr', formData.description_hr)
      formDataToSend.append('price', formData.price.toString())
      formDataToSend.append('category_id', finalCategoryId.toString())
      formDataToSend.append('item_type', formData.item_type)
      formDataToSend.append('is_available', formData.is_available.toString())
      formDataToSend.append('is_vegetarian', formData.is_vegetarian.toString())
      formDataToSend.append('is_vegan', formData.is_vegan.toString())
      formDataToSend.append('contains_gluten', formData.contains_gluten.toString())
      formDataToSend.append('contains_dairy', formData.contains_dairy.toString())
      formDataToSend.append('contains_nuts', formData.contains_nuts.toString())
      formDataToSend.append('contains_fish', formData.contains_fish.toString())
      formDataToSend.append('contains_shellfish', formData.contains_shellfish.toString())
      formDataToSend.append('contains_eggs', formData.contains_eggs.toString())
      formDataToSend.append('is_spicy', formData.is_spicy.toString())
      
      if (image) {
        formDataToSend.append('image', image)
      }

      if (item) {
        await apiClient.put(`/api/menu-items/${item.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Stavka je ažurirana')
      } else {
        await apiClient.post('/api/menu-items', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Stavka je dodana')
      }

      // Broadcast menu change to trigger real-time updates on public menu
      if (restaurantId && supabase) {
        try {
          const channelName = `menu-updates-${restaurantId}`
          const channel = supabase!.channel(channelName, {
            config: {
              broadcast: { self: true, ack: false }
            }
          })

          // Subscribe first, then send
          await new Promise<void>((resolve, reject) => {
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                resolve()
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                reject(new Error(`Channel ${status}`))
              }
            })
          })

          await channel.send({
            type: 'broadcast',
            event: 'menu_changed',
            payload: {
              timestamp: Date.now(),
              userId: userId,
              restaurantId: restaurantId
            }
          })

          console.log('✅ Broadcast sent to channel:', channelName)

          // Clean up
          setTimeout(() => channel.unsubscribe(), 100)
        } catch (error) {
          console.error('Failed to broadcast menu change:', error)
        }
      }

      onSuccess()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Greška pri spremanju stavke'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name_hr">Naziv</Label>
        <Input
          id="name_hr"
          value={formData.name_hr}
          onChange={(e) => setFormData({ ...formData, name_hr: e.target.value })}
          placeholder="Naziv jela"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_hr">Opis</Label>
        <Textarea
          id="description_hr"
          value={formData.description_hr}
          onChange={(e) => setFormData({ ...formData, description_hr: e.target.value })}
          placeholder="Opis jela (sastojci, priprema, itd.)"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Cijena (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price === 0 ? '' : formData.price}
            onChange={(e) => {
              const value = e.target.value
              setFormData({ ...formData, price: value === '' ? 0 : parseFloat(value) })
            }}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item_type">Tip</Label>
          <Select
            value={formData.item_type}
            onValueChange={(value) => setFormData({ ...formData, item_type: value as 'food' | 'drink' })}
          >
            <SelectTrigger id="item_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="food">
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  <span>Hrana</span>
                </div>
              </SelectItem>
              <SelectItem value="drink">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  <span>Piće</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategorija <span className="text-destructive">*</span></Label>
          {presetCategory ? (
            <Input
              value={categories.find(c => c.id.toString() === presetCategory)?.name || presetCategory}
              disabled
              className="bg-muted"
            />
          ) : !useCustomCategory ? (
            <div className="space-y-2">
              <Select
                value={formData.category_id || undefined}
                onValueChange={(value) => {
                  if (value === "__custom__") {
                    setUseCustomCategory(true)
                    setCategoryInput('')
                    setFormData({ ...formData, category_id: '' })
                  } else {
                    setFormData({ ...formData, category_id: value })
                  }
                }}
                required
              >
                <SelectTrigger id="category" className={`w-full ${!formData.category_id ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder={categories.length > 0 ? "Odaberi kategoriju" : "Kliknite za dodavanje kategorije"} />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {categories.length > 0 ? (
                    <>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">
                        + Dodaj novu kategoriju
                      </SelectItem>
                    </>
                  ) : (
                    <SelectItem value="__custom__">
                      + Dodaj novu kategoriju
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {/* Fallback: Direct input option */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseCustomCategory(true)}
                className="w-full"
              >
                Ili unesite kategoriju direktno
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="category-custom"
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value)
                }}
                placeholder="Unesite novu kategoriju"
                required
                className={!categoryInput.trim() ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (categoryInput.trim()) {
                    try {
                      const formDataCategory = new FormData()
                      formDataCategory.append('name', categoryInput.trim())
                      const response = await apiClient.post('/api/categories', formDataCategory)
                      await loadCategories()
                      // Set the newly created category ID
                      if (response.data?.id) {
                        setFormData({ ...formData, category_id: String(response.data.id) })
                      }
                      setUseCustomCategory(false)
                      setCategoryInput('')
                      toast.success('Kategorija je dodana')
                    } catch (error: any) {
                      const errorMessage = error.response?.data?.detail || 'Greška pri dodavanju kategorije'
                      toast.error(errorMessage)
                    }
                  } else {
                    setUseCustomCategory(false)
                    setCategoryInput('')
                  }
                }}
              >
                Spremi kategoriju
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUseCustomCategory(false)
                  setCategoryInput('')
                }}
              >
                Odustani
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Slika</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image')?.click()}
            className="w-fit"
          >
            Odaberi datoteku
          </Button>
          <span className="text-sm text-muted-foreground">
            {image ? image.name : 'Nema odabrane datoteke'}
          </span>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_available"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="is_available" className="cursor-pointer">
          Dostupno
        </Label>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-base font-semibold">Alergeni i Posebne Opcije</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_vegetarian"
              checked={formData.is_vegetarian}
              onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_vegetarian" className="cursor-pointer">Vegetarijansko</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_vegan"
              checked={formData.is_vegan}
              onChange={(e) => setFormData({ ...formData, is_vegan: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_vegan" className="cursor-pointer">Vegansko</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_gluten"
              checked={formData.contains_gluten}
              onChange={(e) => setFormData({ ...formData, contains_gluten: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_gluten" className="cursor-pointer">Sadrži gluten</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_dairy"
              checked={formData.contains_dairy}
              onChange={(e) => setFormData({ ...formData, contains_dairy: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_dairy" className="cursor-pointer">Sadrži mliječne proizvode</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_nuts"
              checked={formData.contains_nuts}
              onChange={(e) => setFormData({ ...formData, contains_nuts: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_nuts" className="cursor-pointer">Sadrži orašaste plodove</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_fish"
              checked={formData.contains_fish}
              onChange={(e) => setFormData({ ...formData, contains_fish: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_fish" className="cursor-pointer">Sadrži ribu</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_shellfish"
              checked={formData.contains_shellfish}
              onChange={(e) => setFormData({ ...formData, contains_shellfish: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_shellfish" className="cursor-pointer">Sadrži školjke</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="contains_eggs"
              checked={formData.contains_eggs}
              onChange={(e) => setFormData({ ...formData, contains_eggs: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="contains_eggs" className="cursor-pointer">Sadrži jaja</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_spicy"
              checked={formData.is_spicy}
              onChange={(e) => setFormData({ ...formData, is_spicy: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_spicy" className="cursor-pointer">Ljuto</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Odustani
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Spremanje...' : 'Spremi'}
        </Button>
      </div>
    </form>
  )
}

