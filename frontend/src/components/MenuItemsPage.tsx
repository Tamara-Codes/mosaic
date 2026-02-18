import { useState, useEffect, useCallback, useRef } from 'react'
import { type MenuItem } from '@/lib/api'
import { useApiClient } from '@/lib/apiHelpers'
import { getImageUrl } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Search, Languages, Sparkles, Loader2, CheckCircle2, GripVertical } from 'lucide-react'
import { MenuItemForm } from './MenuItemForm'
import { supabase } from '@/lib/supabase'
import { useRestaurantId } from '@/hooks/useRestaurantId'

interface Translation {
  id: number
  menu_item_id: number
  language_code: string
  language_name: string
  name: string
  description: string
  is_ai_generated: boolean
}

interface MenuItemWithTranslations extends MenuItem {
  translations: Translation[]
}

interface Language {
  code: string
  name: string
}

export function MenuItemsPage() {
  const apiClient = useApiClient()
  const restaurantId = useRestaurantId()
  const [items, setItems] = useState<MenuItemWithTranslations[]>([])
  const [allCategories, setAllCategories] = useState<{id: number, name: string, category_type?: 'food' | 'drink'}[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('sve')
  const [selectedItemType, setSelectedItemType] = useState<'all' | 'food' | 'drink'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  
  // Translation state
  const [showTranslateDialog, setShowTranslateDialog] = useState(false)
  const [showEditTranslationDialog, setShowEditTranslationDialog] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedItemForTranslation] = useState<MenuItemWithTranslations | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTranslation] = useState<Translation | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [editTranslationName, setEditTranslationName] = useState('')
  const [editTranslationDescription, setEditTranslationDescription] = useState('')
  
  // Category management state
  const [showEditCategoriesDialog, setShowEditCategoriesDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState<'food' | 'drink'>('food')
  const [categoryToDelete, setCategoryToDelete] = useState<{id: number, name: string} | null>(null)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  const [showTranslateCategoryDialog, setShowTranslateCategoryDialog] = useState(false)
  const [selectedCategoryForTranslation] = useState<{id: number, name: string, translations?: any[]} | null>(null)

  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Language management state
  const [showLanguageManagementDialog, setShowLanguageManagementDialog] = useState(false)
  const [languageToRemove, setLanguageToRemove] = useState<{code: string, name: string} | null>(null)
  const [showRemoveLanguageConfirm, setShowRemoveLanguageConfirm] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([])

  // Category reordering state (used in edit categories dialog)
  const [draggedCategory, setDraggedCategory] = useState<number | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  // Define loadItems before it's used in useEffect hooks
  const loadItems = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const [itemsData, langsData, categoriesData, availableLangsData] = await Promise.all([
        apiClient.get('/menu-items-with-translations').then(r => r.data),
        apiClient.get('/supported-languages').then(r => r.data),
        apiClient.get('/categories').then(r => r.data),
        apiClient.get('/available-languages').then(r => r.data)
      ])
      setItems(itemsData)
      setLanguages(langsData.languages)
      setAllCategories(categoriesData.categories_with_ids || [])
      setAvailableLanguages(availableLangsData.languages || [])
      if (showLoading) {
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Failed to load items:', error)
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error'

      if (error?.response?.status === 404) {
        if (errorMessage.includes('Restaurant not found')) {
          toast.error('Restoran nije pronađen. Provjerite je li vaš račun povezan s restoranom u postavkama.')
        } else {
          toast.error('Restoran nije pronađen. Molimo kontaktirajte podršku.')
        }
      } else if (error?.response?.status === 401) {
        toast.error('Neautorizirani pristup. Molimo se ponovno prijavite.')
      } else {
        toast.error(`Greška pri učitavanju stavki: ${errorMessage}`)
      }
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [apiClient])

  useEffect(() => {
    loadItems() // Initial load should show loading state
  }, [loadItems])

  // Set up broadcast listener for menu items changes (e.g., price updates from chatbot)
  useEffect(() => {
    if (!restaurantId || !supabase) {
      console.log('[BROADCAST] Skipping subscription - restaurantId:', restaurantId, 'supabase:', !!supabase)
      return
    }

    const channelName = `menu-updates-${restaurantId}`
    console.log('[BROADCAST] Setting up broadcast listener for restaurant:', restaurantId)

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true, ack: false }
        }
      })
      .on('broadcast', { event: 'menu_changed' }, (payload) => {
        console.log('[BROADCAST] Menu change broadcast received!', payload)
        loadItems(false)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [BROADCAST] Subscribed to menu changes for restaurant:', restaurantId)
          broadcastChannelRef.current = channel
        } else {
          console.log('[BROADCAST] Channel status:', status)
        }
      })

    return () => {
      console.log('[BROADCAST] Cleaning up broadcast listener')
      broadcastChannelRef.current = null
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [restaurantId, loadItems, supabase])

  // Reset category selection when item type changes
  useEffect(() => {
    setSelectedCategory('sve')
  }, [selectedItemType])

  // Category drag and drop handlers (used in edit categories dialog)
  const handleDragStart = (e: React.DragEvent, categoryId: number) => {
    e.dataTransfer!.effectAllowed = 'move'
    setDraggedCategory(categoryId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault()
    
    if (draggedCategory === null || draggedCategory === targetCategoryId) {
      setDraggedCategory(null)
      return
    }

    const draggedIdx = allCategories.findIndex(c => c.id === draggedCategory)
    const targetIdx = allCategories.findIndex(c => c.id === targetCategoryId)

    if (draggedIdx === -1 || targetIdx === -1) {
      setDraggedCategory(null)
      return
    }

    // Create new array with swapped items
    const newCategories = [...allCategories]
    const temp = newCategories[draggedIdx]
    newCategories[draggedIdx] = newCategories[targetIdx]
    newCategories[targetIdx] = temp

    setAllCategories(newCategories)
    setDraggedCategory(null)
    setIsReordering(true)

    try {
      await apiClient.put('/categories/reorder', newCategories)
      toast.success('Redoslijed kategorija je promijenjen')
    } catch (error) {
      console.error('Error reordering categories:', error)
      toast.error('Greška pri promjeni redoslijeda')
      // Reload to get correct order
      loadItems(false)
    } finally {
      setIsReordering(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    try {
      await apiClient.delete(`/menu-items/${itemToDelete}`)
      toast.success('Stavka je obrisana')

      // Broadcast menu change
      if (broadcastChannelRef.current) {
        try {
          await broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'menu_changed',
            payload: { timestamp: Date.now(), restaurantId }
          })
          console.log('✅ Broadcast sent')
        } catch (error) {
          console.error('Failed to broadcast:', error)
        }
      }

      loadItems(false)
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    } catch (error) {
      toast.error('Greška pri brisanju stavke')
      setDeleteConfirmOpen(false)
      setItemToDelete(null)
    }
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false)
    setEditingItem(null)
    // Toast is already shown by MenuItemForm, no need to show it again
    // Refresh without showing loading state to avoid UI flash
    loadItems(false)
  }

  // Translation handlers
  const getLanguageFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'en': 'gb',
      'cs': 'cz',
      'sl': 'si',
      'el': 'gr',
      'zh': 'cn',
      'ja': 'jp',
      'ko': 'kr',
      'ar': 'sa',
      'sv': 'se',
      'da': 'dk',
      'uk': 'ua',
      'by': 'by',
      'sq': 'al',
      'sr': 'rs',
      'bs': 'ba',
      'ga': 'ie',
      'et': 'ee',  // Estonia flag
    }
    const countryCode = flagMap[code] || code
    return `https://flagcdn.com/w40/${countryCode}.png`
  }

  // Unused function - kept for potential future use
  // const getTranslationProgress = (item: MenuItemWithTranslations) => {
  //   const total = languages.length
  //   const completed = item.translations?.length || 0
  //   return { completed, total, percentage: Math.round((completed / total) * 100) }
  // }

  // Unused but kept for potential future use

  const handleGenerateTranslations = async () => {
    if (!selectedItemForTranslation || selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await apiClient.post(`/translations/generate/${selectedItemForTranslation.id}`, selectedLanguages)
      const data = response.data
      
      if (data.success) {
        toast.success(`Generirano ${data.translations.length} prijevoda`)
        loadItems(false)
        setShowTranslateDialog(false)
        setSelectedLanguages([])
      } else {
        toast.error(data.errors.join(', '))
      }
    } catch (error) {
      console.error('Error generating translations:', error)
      toast.error("Neuspješno generiranje prijevoda")
    } finally {
      setGenerating(false)
    }
  }

  const handleEditTranslation = async () => {
    if (!selectedTranslation) return

    try {
      const formData = new FormData()
      formData.append('name', editTranslationName)
      formData.append('description', editTranslationDescription)
      
      await apiClient.put(`/translations/${selectedTranslation.id}`, formData)
      toast.success("Prijevod je ažuriran")
      loadItems(false)
      setShowEditTranslationDialog(false)
    } catch (error) {
      console.error('Error updating translation:', error)
      toast.error("Neuspješno ažuriranje prijevoda")
    }
  }

  // Category handlers
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Unesite naziv kategorije")
      return
    }

    try {
      const formData = new FormData()
      formData.append('name', newCategoryName.trim())
      formData.append('category_type', newCategoryType)

      await apiClient.post('/categories', formData)
      toast.success("Kategorija je dodana")
      setNewCategoryName('')

      // Switch main page to the type of category that was just added
      if (newCategoryType === 'drink' && selectedItemType !== 'drink') {
        setSelectedItemType('drink')
      } else if (newCategoryType === 'food' && selectedItemType !== 'food') {
        setSelectedItemType('food')
      }

      loadItems(false) // Reload to get updated categories
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error("Neuspješno dodavanje kategorije")
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      await apiClient.delete(`/categories/${categoryToDelete.id}`)
      toast.success("Kategorija je obrisana")
      setShowDeleteCategoryDialog(false)
      setCategoryToDelete(null)
      // If we were viewing the deleted category, switch to "sve"
      if (selectedCategory === String(categoryToDelete.id)) {
        setSelectedCategory('sve')
      }
      loadItems(false) // Reload to get updated categories
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error("Neuspješno brisanje kategorije")
    }
  }

  // Removed unused functions openDeleteCategoryDialog and openTranslateCategoryDialog
  // If needed in the future, they can be restored from git history

  const handleGenerateCategoryTranslations = async () => {
    if (!selectedCategoryForTranslation || selectedLanguages.length === 0) {
      toast.error("Molimo odaberite barem jedan jezik")
      return
    }

    try {
      setGenerating(true)
      const response = await apiClient.post(`/category-translations/generate/${selectedCategoryForTranslation.id}`, selectedLanguages)
      const data = response.data
      
      if (data.success) {
        toast.success(`Generirano ${data.translations.length} prijevoda kategorije`)
        loadItems(false)
        setShowTranslateCategoryDialog(false)
        setSelectedLanguages([])
      } else {
        toast.error(data.errors?.join(', ') || 'Greška pri generiranju')
      }
    } catch (error) {
      console.error('Error generating category translations:', error)
      toast.error("Neuspješno generiranje prijevoda")
    } finally {
      setGenerating(false)
    }
  }

  // Unused functions - kept for potential future use
  // const handleEditCategoryTranslation = async (translationId: number, newName: string) => {
  //   try {
  //     const formData = new FormData()
  //     formData.append('name', newName)
  //     
  //     await apiClient.put(`/api/category-translations/${translationId}`, formData)
  //     toast.success("Prijevod kategorije je ažuriran")
  //     loadItems(false)
  //   } catch (error) {
  //     console.error('Error updating category translation:', error)
  //     toast.error("Neuspješno ažuriranje prijevoda")
  //   }
  // }

  // const handleDeleteCategoryTranslation = async (translationId: number) => {
  //   if (!confirm('Jeste li sigurni da želite obrisati ovaj prijevod kategorije?')) return

  //   try {
  //     await apiClient.delete(`/api/category-translations/${translationId}`)
  //     toast.success("Prijevod kategorije je obrisan")
  //     loadItems(false)
  //   } catch (error) {
  //     console.error('Error deleting category translation:', error)
  //     toast.error("Neuspješno brisanje prijevoda")
  //   }
  // }

  // Use all categories from database
  // const categories = allCategories.map(c => c.name) // Unused - kept for reference
  
  // Check if there are uncategorized items
  // Filter items by type first
  const itemsByType = selectedItemType === 'all'
    ? items
    : items.filter(item => (item.item_type || 'food') === selectedItemType)

  const uncategorizedCount = itemsByType.filter(item => !item.category_id).length
  const hasUncategorized = uncategorizedCount > 0

  // Filter categories by type to match selected item type
  const filteredCategories = selectedItemType === 'all'
    ? allCategories
    : allCategories.filter(category => (category.category_type || 'food') === selectedItemType)

  // Filter items
  const filteredItems = itemsByType.filter(item => {
    const matchesCategory = selectedCategory === 'sve'
      || (selectedCategory === 'uncategorized' && !item.category_id)
      || item.category_id === selectedCategory
    const matchesSearch = searchQuery === '' ||
      item.name_hr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description_hr && item.description_hr.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowLanguageManagementDialog(true)}
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          Upravljaj jezicima
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setNewCategoryType(selectedItemType === 'drink' ? 'drink' : 'food')
            setShowEditCategoriesDialog(true)
          }}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Uredi kategorije
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži stavke..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Item Type Filter */}
      <div className="flex gap-2 items-center">
        <Button
          variant={selectedItemType === 'food' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedItemType('food')
            setNewCategoryType('food')
          }}
        >
          Hrana
        </Button>
        <Button
          variant={selectedItemType === 'drink' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedItemType('drink')
            setNewCategoryType('drink')
          }}
        >
          Pića
        </Button>
        <Button onClick={() => {
          setEditingItem(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj Novu Stavku
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-4">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="sve">Sve</TabsTrigger>
            {filteredCategories.map(category => (
              <TabsTrigger key={category.id} value={category.id.toString()}>
                {category.name}
              </TabsTrigger>
            ))}
            {hasUncategorized && (
              <TabsTrigger value="uncategorized" className="border-2 border-amber-400 border-dashed">
                ⚠️ Bez kategorije ({uncategorizedCount})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="hidden"></div>

          <TabsContent value={selectedCategory} className="mt-6">
          {selectedCategory === 'uncategorized' && hasUncategorized && (
            <Card className="mb-6 border-amber-400 border-2 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-400 p-2">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">Stavke bez kategorije</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      Ove stavke su izgubile kategoriju (možda je kategorija obrisana). 
                      Kliknite "Uredi" na stavci i dodijelite joj novu kategoriju.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filteredItems.length === 0 && items.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <p className="text-lg font-semibold">Dobrodošli! Vaš jelovnik je prazan.</p>
                  <p className="text-muted-foreground">
                    Dodajte svoju prvu stavku klikom na gumb "Dodaj Novu Stavku" iznad.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? 'Nema rezultata za vašu pretragu.' : 'Nema stavki u ovoj kategoriji. Dodajte prvu stavku!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  {item.image_path ? (
                    <img
                      src={getImageUrl(item.image_path)}
                      alt={item.name_hr}
                      className="w-full h-48 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-muted-foreground">Nema slike</span>
                    </div>
                  )}
                  <CardHeader className="flex-shrink-0 pb-2">
                    <div className="flex items-start justify-between h-[52px]">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{item.name_hr}</CardTitle>
                      </div>
                      <Badge variant={item.is_available ? 'default' : 'secondary'} className="flex-shrink-0 ml-2">
                        {item.is_available ? 'Dostupno' : 'Nedostupno'}
                      </Badge>
                    </div>
                    <div className="h-[60px] mt-1">
                      {item.description_hr ? (
                        <CardDescription className="line-clamp-3">{item.description_hr}</CardDescription>
                      ) : (
                        <CardDescription className="text-transparent">.</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-shrink-0 pt-0 mt-auto pb-4">
                    <div className="space-y-3">
                      {/* Price and Allergen Tags on same line */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl font-semibold">{item.price.toFixed(2)} €</span>
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          {item.is_vegan && <span className="text-2xl" title="Vegansko">🌱</span>}
                          {!item.is_vegan && item.is_vegetarian && <span className="text-2xl" title="Vegetarijansko">🥬</span>}
                          {item.is_spicy && <span className="text-2xl" title="Ljuto">🌶️</span>}
                          {item.contains_gluten && <span className="text-2xl" title="Gluten">🌾</span>}
                          {item.contains_dairy && <span className="text-2xl" title="Mliječni">🥛</span>}
                          {item.contains_nuts && <span className="text-2xl" title="Orašasti">🥜</span>}
                          {item.contains_fish && <span className="text-2xl" title="Riba">🐟</span>}
                          {item.contains_shellfish && <span className="text-2xl" title="Školjke">🦐</span>}
                          {item.contains_eggs && <span className="text-2xl" title="Jaja">🥚</span>}
                        </div>
                      </div>

                      {/* Category */}
                      {item.category_id && (
                        <span className="text-sm text-muted-foreground block">
                          Kategorija: {allCategories.find(c => c.id.toString() === item.category_id)?.name || 'N/A'}
                        </span>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setEditingItem(item)
                            setIsFormOpen(true)
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Uredi
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className="max-w-xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Uredi Stavku' : 'Dodaj Novu Stavku'}
            </DialogTitle>
          </DialogHeader>
          <MenuItemForm
            item={editingItem}
            presetCategory={!editingItem && selectedCategory !== 'sve' && selectedCategory !== 'uncategorized' ? selectedCategory : undefined}
            onSuccess={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Obriši stavku"
        description="Jeste li sigurni da želite obrisati ovu stavku? Ova akcija se ne može poništiti."
        onConfirm={handleDelete}
        confirmText="Obriši"
        cancelText="Odustani"
      />

      {/* Translate Dialog */}
      <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Generiraj prijevode
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedItemForTranslation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <span className="font-semibold">{selectedItemForTranslation.name_hr}</span>
                  {selectedItemForTranslation.description_hr && (
                    <p className="text-sm mt-1">{selectedItemForTranslation.description_hr}</p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Odaberite jezike za prijevod</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {languages.map((lang) => {
                  const hasTranslation = selectedItemForTranslation?.translations?.some(
                    t => t.language_code === lang.code
                  )
                  const isChecked = selectedLanguages.includes(lang.code)
                  return (
                    <div
                      key={lang.code}
                      className={`
                        relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                        ${hasTranslation ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => {
                        if (!hasTranslation) {
                          if (isChecked) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          }
                        }
                      }}
                    >
                      <Checkbox
                        id={`lang-${lang.code}`}
                        checked={isChecked}
                        disabled={hasTranslation}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          }
                        }}
                      />
                      <img
                        src={getLanguageFlag(lang.code)}
                        alt={lang.code}
                        className="w-8 h-6 object-cover rounded border"
                      />
                      <label
                        htmlFor={`lang-${lang.code}`}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {lang.name}
                      </label>
                      {hasTranslation && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Postoji
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTranslateDialog(false)} size="lg">
              Odustani
            </Button>
            <Button 
              onClick={handleGenerateTranslations} 
              disabled={generating || selectedLanguages.length === 0}
              className="gap-2"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiranje...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generiraj {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Dialog */}
      <Dialog open={showEditTranslationDialog} onOpenChange={setShowEditTranslationDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Edit className="h-6 w-6 text-primary" />
              Uredi prijevod
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedTranslation && (
                <div className="flex items-center gap-3 mt-2 p-3 bg-muted rounded-lg">
                  <img
                    src={getLanguageFlag(selectedTranslation.language_code)}
                    alt={selectedTranslation.language_code}
                    className="w-10 h-7 object-cover rounded border-2"
                  />
                  <div>
                    <span className="font-semibold">{selectedTranslation.language_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({selectedTranslation.language_code.toUpperCase()})
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-trans-name" className="text-base font-semibold">
                Naziv
              </Label>
              <Input
                id="edit-trans-name"
                value={editTranslationName}
                onChange={(e) => setEditTranslationName(e.target.value)}
                className="text-base"
                placeholder="Unesite naziv..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-trans-description" className="text-base font-semibold">
                Opis
              </Label>
              <Textarea
                id="edit-trans-description"
                value={editTranslationDescription}
                onChange={(e) => setEditTranslationDescription(e.target.value)}
                rows={5}
                className="text-base resize-none"
                placeholder="Unesite opis..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditTranslationDialog(false)} size="lg">
              Odustani
            </Button>
            <Button onClick={handleEditTranslation} size="lg" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Spremi promjene
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Categories Dialog */}
      <Dialog open={showEditCategoriesDialog} onOpenChange={setShowEditCategoriesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Uredi kategorije
            </DialogTitle>
            <DialogDescription>
              Dodaj nove kategorije, promijeni redoslijed ili obriši postojeće
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Add New Category Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm">Dodaj novu kategoriju</h3>
              <div className="flex gap-2 items-end">
                {/* Category Type Selector */}
                <div className="space-y-2 w-32 flex-shrink-0">
                  <Label htmlFor="category-type">Tip</Label>
                  <Select value={newCategoryType} onValueChange={(value: 'food' | 'drink') => setNewCategoryType(value)}>
                    <SelectTrigger id="category-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Hrana</SelectItem>
                      <SelectItem value="drink">Pića</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Name Input */}
                <div className="space-y-2 flex-1">
                  <Label htmlFor="category-name">Naziv</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="npr. Pizze, Vina..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCategory()
                      }
                    }}
                  />
                </div>

                {/* Add Button */}
                <Button onClick={handleAddCategory} size="sm" className="gap-2 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  Dodaj
                </Button>
              </div>
            </div>

            {/* Existing Categories - Reorderable List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Postojeće kategorije</h3>
              <p className="text-sm text-muted-foreground">Povuci za promjenu redoslijeda</p>
              <div className="space-y-2">
                {allCategories
                  .filter(category => (category.category_type || 'food') === newCategoryType)
                  .map((category) => (
                  <Card
                    key={category.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, category.id)}
                    onDragOver={(e) => handleDragOver(e)}
                    onDrop={(e) => handleDrop(e, category.id)}
                    onDragEnd={() => setDraggedCategory(null)}
                    className={`transition-all cursor-grab active:cursor-grabbing ${
                      draggedCategory === category.id ? 'opacity-30 bg-blue-100 scale-95' : 'bg-white'
                    } ${
                      isReordering ? 'pointer-events-none' : ''
                    } ${draggedCategory !== null && draggedCategory !== category.id ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'} hover:shadow-md`}
                  >
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="flex items-center justify-between gap-4 text-base">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GripVertical className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <span className="truncate font-medium">{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(category.category_type || 'food') === 'food' ? 'Hrana' : 'Pića'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const count = items.filter(item => item.category_id === String(category.id)).length
                              const lastDigit = count % 10
                              const lastTwoDigits = count % 100
                              if (count === 1) return '1 stavka'
                              if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} stavki`
                              if (lastDigit >= 2 && lastDigit <= 4) return `${count} stavke`
                              return `${count} stavki`
                            })()}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCategoryToDelete({ id: category.id, name: category.name })
                              setShowDeleteCategoryDialog(true)
                            }}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setShowEditCategoriesDialog(false)
              setNewCategoryName('')
            }}>
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteCategoryDialog}
        onOpenChange={setShowDeleteCategoryDialog}
        title="Obriši kategoriju"
        description={
          categoryToDelete 
            ? `Jeste li sigurni da želite obrisati kategoriju "${categoryToDelete.name}"? \n\nStavke u ovoj kategoriji NEĆE biti obrisane - pojavit će se u tabu "⚠️ Bez kategorije" gdje ih možete ponovno kategorizirati.`
            : ''
        }
        onConfirm={handleDeleteCategory}
        confirmText="Obriši"
        cancelText="Odustani"
      />

      {/* Translate Category Dialog */}
      <Dialog open={showTranslateCategoryDialog} onOpenChange={setShowTranslateCategoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Prijevodi kategorije
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedCategoryForTranslation && (
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <span className="font-semibold text-lg">{selectedCategoryForTranslation.name}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Odaberite jezike za prijevod</Label>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {languages.map((lang) => {
                  const hasTranslation = selectedCategoryForTranslation?.translations?.some(
                    (t: any) => t.language_code === lang.code
                  )
                  const isChecked = selectedLanguages.includes(lang.code)
                  return (
                    <div
                      key={lang.code}
                      className={`
                        relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                        ${isChecked ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                        ${hasTranslation ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => {
                        if (!hasTranslation) {
                          if (isChecked) {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          } else {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          }
                        }
                      }}
                    >
                      <Checkbox
                        id={`cat-lang-${lang.code}`}
                        checked={isChecked}
                        disabled={hasTranslation}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLanguages([...selectedLanguages, lang.code])
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code))
                          }
                        }}
                      />
                      <img
                        src={getLanguageFlag(lang.code)}
                        alt={lang.code}
                        className="w-8 h-6 object-cover rounded border"
                      />
                      <label
                        htmlFor={`cat-lang-${lang.code}`}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {lang.name}
                      </label>
                      {hasTranslation && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Postoji
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTranslateCategoryDialog(false)} size="lg">
              Odustani
            </Button>
            <Button 
              onClick={handleGenerateCategoryTranslations} 
              disabled={generating || selectedLanguages.length === 0}
              className="gap-2"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generiranje...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generiraj {selectedLanguages.length > 0 && `(${selectedLanguages.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Language Management Dialog */}
      <Dialog open={showLanguageManagementDialog} onOpenChange={setShowLanguageManagementDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Languages className="h-5 w-5" />
              Upravljanje jezicima
            </DialogTitle>
            <DialogDescription className="text-sm">
              Omogućite ili onemogućite jezike za vaš restoran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {availableLanguages.map((lang) => {
                const isActive = languages.some(l => l.code === lang.code)
                return (
                  <div
                    key={lang.code}
                    className={`
                      relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer group
                      ${isActive
                        ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }
                    `}
                    onClick={async () => {
                      if (isActive) {
                        // Remove language - show confirmation dialog
                        setLanguageToRemove(lang)
                        setShowRemoveLanguageConfirm(true)
                      } else {
                        // Add language
                        const loadingToast = toast.loading(`Dodajem ${lang.name} i prevodim sve stavke...`)
                        try {
                          const response = await apiClient.post('/languages/add', {
                            code: lang.code,
                            name: lang.name
                          })
                          toast.dismiss(loadingToast)
                          const data = response.data
                          toast.success(
                            `${lang.name} dodan! ✓\n` +
                            `Prevedeno ${data.items_translated} stavki i ${data.categories_translated} kategorija`,
                            { duration: 5000 }
                          )
                          loadItems(false)

                          // Broadcast menu change
                          if (broadcastChannelRef.current) {
                            try {
                              await broadcastChannelRef.current.send({
                                type: 'broadcast',
                                event: 'menu_changed',
                                payload: { timestamp: Date.now(), restaurantId }
                              })
                              console.log('✅ Broadcast sent')
                            } catch (error) {
                              console.error('Failed to broadcast:', error)
                            }
                          } else {
                            console.warn('[BROADCAST] No channel available to send broadcast')
                          }
                        } catch (error: any) {
                          toast.dismiss(loadingToast)
                          const errorMsg = error?.response?.data?.detail || 'Greška pri dodavanju'
                          toast.error(errorMsg)
                        }
                      }
                    }}
                  >
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <img
                      src={getLanguageFlag(lang.code)}
                      alt={lang.code}
                      className="w-12 h-8 object-cover rounded border"
                    />
                    <div className="text-center">
                      <div className="text-xs font-medium">{lang.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={() => setShowLanguageManagementDialog(false)} variant="outline">
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Language Confirmation Dialog */}
      <ConfirmDialog
        open={showRemoveLanguageConfirm}
        onOpenChange={setShowRemoveLanguageConfirm}
        title={`Ukloniti ${languageToRemove?.name}?`}
        description={
          <div className="space-y-2">
            <p>
              Jeste li sigurni da želite ukloniti jezik <strong>{languageToRemove?.name}</strong>?
            </p>
            <p className="text-destructive font-semibold">
              ⚠️ Svi prijevodi za ovaj jezik će biti trajno obrisani za sve stavke menija i kategorije!
            </p>
            <p className="text-sm text-muted-foreground">
              Ova akcija se ne može poništiti.
            </p>
          </div>
        }
        onConfirm={async () => {
          if (languageToRemove) {
            try {
              await apiClient.delete(`/languages/remove/${languageToRemove.code}`)
              toast.success(`Jezik ${languageToRemove.name} je uklonjen`)
              loadItems(false)
              setShowRemoveLanguageConfirm(false)
              setLanguageToRemove(null)

              // Broadcast menu change
              if (broadcastChannelRef.current) {
                try {
                  await broadcastChannelRef.current.send({
                    type: 'broadcast',
                    event: 'menu_changed',
                    payload: { timestamp: Date.now(), restaurantId }
                  })
                  console.log('✅ Broadcast sent')
                } catch (error) {
                  console.error('Failed to broadcast:', error)
                }
              }
            } catch (error: any) {
              const errorMsg = error?.response?.data?.detail || 'Greška pri uklanjanju'
              toast.error(errorMsg)
            }
          }
        }}
        confirmText="Da, ukloni"
        cancelText="Odustani"
        variant="destructive"
      />
    </div>
  )
}

