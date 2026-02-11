import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface UITranslation {
  language_code: string
  translation_key: string
  translation_value: string
}

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
  updateUITranslations: (translations: UITranslation[]) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const SUPPORTED_LANGUAGES = ['hr', 'en', 'de', 'it', 'fr', 'es', 'sl', 'cs', 'pl', 'hu', 'zh']

// Default Croatian translations
const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'food': 'Hrana',
  'drink': 'Pića',
  'intro_text_1': 'Sve naše specijalitete pripremamo od najsvježijih sastojaka, pažljivo odabranih iz lokalnih izvora.',
  'intro_text_2': 'Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta.'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>('hr')
  const [uiTranslationsData, setUiTranslationsData] = useState<UITranslation[]>([])

  // Detect browser language on first mount
  useEffect(() => {
    const stored = localStorage.getItem('menu-language')
    if (stored) {
      setLanguageState(stored)
    } else {
      const browserLang = navigator.language.split('-')[0]
      if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        setLanguageState(browserLang)
      }
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('menu-language', lang)
  }

  const updateUITranslations = useCallback((translations: UITranslation[]) => {
    setUiTranslationsData(translations)
  }, [])

  const t = useCallback((key: string) => {
    // For Croatian, use default translations
    if (language === 'hr') {
      return DEFAULT_TRANSLATIONS[key] || key
    }

    // For other languages, find in ui_translations data
    const translation = uiTranslationsData.find(
      t => t.language_code === language && t.translation_key === key
    )
    return translation?.translation_value || DEFAULT_TRANSLATIONS[key] || key
  }, [language, uiTranslationsData])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, updateUITranslations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

