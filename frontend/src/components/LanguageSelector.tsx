import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const LANGUAGE_METADATA: Record<string, { flagCode: string; name: string }> = {
  'hr': { flagCode: 'hr', name: 'Hrvatski' },
  'en': { flagCode: 'gb', name: 'English' },
  'de': { flagCode: 'de', name: 'Deutsch' },
  'it': { flagCode: 'it', name: 'Italiano' },
  'fr': { flagCode: 'fr', name: 'Français' },
  'es': { flagCode: 'es', name: 'Español' },
  'sl': { flagCode: 'si', name: 'Slovenščina' },
  'cs': { flagCode: 'cz', name: 'Čeština' },
  'pl': { flagCode: 'pl', name: 'Polski' },
  'hu': { flagCode: 'hu', name: 'Magyar' },
  'zh': { flagCode: 'cn', name: '中文' },
  'sq': { flagCode: 'al', name: 'Shqip' },
  'ar': { flagCode: 'sa', name: 'العربية' },
  'by': { flagCode: 'by', name: 'Беларуская' },
  'bs': { flagCode: 'ba', name: 'Bosanski' },
  'bg': { flagCode: 'bg', name: 'Български' },
  'da': { flagCode: 'dk', name: 'Dansk' },
  'et': { flagCode: 'ee', name: 'Eesti' },
  'fi': { flagCode: 'fi', name: 'Suomi' },
  'el': { flagCode: 'gr', name: 'Ελληνικά' },
  'ga': { flagCode: 'ie', name: 'Gaeilge' },
  'is': { flagCode: 'is', name: 'Íslenska' },
  'ja': { flagCode: 'jp', name: '日本語' },
  'ko': { flagCode: 'kr', name: '한국어' },
  'lv': { flagCode: 'lv', name: 'Latviešu' },
  'lt': { flagCode: 'lt', name: 'Lietuvių' },
  'mk': { flagCode: 'mk', name: 'Македонски' },
  'mt': { flagCode: 'mt', name: 'Malti' },
  'nl': { flagCode: 'nl', name: 'Nederlands' },
  'no': { flagCode: 'no', name: 'Norsk' },
  'pt': { flagCode: 'pt', name: 'Português' },
  'ro': { flagCode: 'ro', name: 'Română' },
  'ru': { flagCode: 'ru', name: 'Русский' },
  'sk': { flagCode: 'sk', name: 'Slovenčina' },
  'sr': { flagCode: 'rs', name: 'Српски' },
  'sv': { flagCode: 'se', name: 'Svenska' },
  'tr': { flagCode: 'tr', name: 'Türkçe' },
  'uk': { flagCode: 'ua', name: 'Українська' },
}

interface LanguageSelectorProps {
  availableLanguages?: string[]
  variant?: 'light' | 'dark'
}

export default function LanguageSelector({ availableLanguages, variant = 'light' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  // Build list of available languages with metadata
  const languages = (availableLanguages || ['hr']).map(code => ({
    code,
    flagCode: LANGUAGE_METADATA[code]?.flagCode || code,
    name: LANGUAGE_METADATA[code]?.name || code
  }))

  const currentLang = languages.find(l => l.code === language) || languages[0]
  
  const isDark = variant === 'dark'
  
  const buttonClasses = isDark
    ? "flex items-center justify-center w-12 h-12 bg-zinc-800/80 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/80 hover:border-orange-500/50 transition-colors shadow-sm overflow-hidden"
    : "flex items-center justify-center w-12 h-12 bg-white border border-[#d4c4a8] rounded-lg hover:bg-[#fdfbf7] transition-colors shadow-sm overflow-hidden"
  
  const dropdownClasses = isDark
    ? "absolute top-full mt-2 left-0 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-lg z-50 min-w-[200px]"
    : "absolute top-full mt-2 left-0 bg-white border border-[#d4c4a8] rounded-lg shadow-lg z-50 min-w-[200px]"
  
  const itemClasses = (isSelected: boolean) => isDark
    ? `w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors ${
        isSelected ? 'bg-zinc-800/50' : ''
      }`
    : `w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fdfbf7] transition-colors ${
        isSelected ? 'bg-[#f5f0e8]' : ''
      }`
  
  const textClasses = isDark
    ? "font-serif text-zinc-300"
    : "font-serif text-[#2c2416]"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
        title={currentLang?.name}
      >
        <span
          className={`fi fi-${currentLang?.flagCode} text-2xl`}
          style={{ fontSize: '24px', lineHeight: '24px' }}
        ></span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={dropdownClasses}>
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={itemClasses(language === lang.code)}
              >
                <span className={`fi fi-${lang.flagCode}`} style={{ fontSize: '24px' }}></span>
                <span className={textClasses}>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

