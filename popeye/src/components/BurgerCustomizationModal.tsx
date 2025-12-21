import { useState } from 'react'
import type { MenuItem } from '../lib/api'
import { X } from 'lucide-react'

interface BurgerCustomization {
  breadType: 'pecivo' | 'lepinja'
  ingredients: {
    [key: string]: boolean
  }
}

interface BurgerCustomizationModalProps {
  item: MenuItem
  isOpen: boolean
  onClose: () => void
  onAdd: (customization: BurgerCustomization) => void
}

// Extract ingredients from burger description
function extractIngredients(description: string): string[] {
  const commonIngredients = [
    'zelena salata',
    'pomidor',
    'kiseli krastavci',
    'sir',
    'jaje',
    'crispy kapula',
    'umaci',
    'tartar umak',
    'bbq umak'
  ]
  
  const found: string[] = []
  const lowerDesc = description.toLowerCase()
  
  commonIngredients.forEach(ing => {
    if (lowerDesc.includes(ing)) {
      found.push(ing)
    }
  })
  
  return found
}

export function BurgerCustomizationModal({
  item,
  isOpen,
  onClose,
  onAdd
}: BurgerCustomizationModalProps) {
  const [breadType, setBreadType] = useState<'pecivo' | 'lepinja'>('pecivo')
  const [ingredients, setIngredients] = useState<{ [key: string]: boolean }>(() => {
    const defaultIngredients = extractIngredients(item.description_hr || '')
    const initial: { [key: string]: boolean } = {}
    defaultIngredients.forEach(ing => {
      initial[ing] = true // All ingredients selected by default
    })
    return initial
  })

  if (!isOpen) return null

  const availableIngredients = extractIngredients(item.description_hr || '')
  
  const toggleIngredient = (ingredient: string) => {
    setIngredients(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }))
  }

  const handleAdd = () => {
    onAdd({
      breadType,
      ingredients
    })
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Prilagodi {item.name_hr}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Zatvori"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Bread Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Vrsta peciva
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBreadType('pecivo')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    breadType === 'pecivo'
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Hamburger pecivo
                </button>
                <button
                  type="button"
                  onClick={() => setBreadType('lepinja')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                    breadType === 'lepinja'
                      ? 'border-red-600 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lepinja
                </button>
              </div>
            </div>

            {/* Ingredients Selection */}
            {availableIngredients.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Sastojci
                </label>
                <div className="space-y-2">
                  {availableIngredients.map((ingredient) => (
                    <label
                      key={ingredient}
                      className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={ingredients[ingredient] || false}
                        onChange={() => toggleIngredient(ingredient)}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="ml-3 text-gray-700">
                        {ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Display */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Cijena:</span>
                <span className="text-2xl font-bold text-red-600">
                  {item.price.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4">
            <button
              onClick={handleAdd}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Dodaj u košaricu ({item.price.toFixed(2)} €)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

