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
}

interface LanguageSelectorProps {
  availableLanguages?: string[]
}

export default function LanguageSelector({ availableLanguages }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  // Build list of available languages with metadata
  const languages = (availableLanguages || ['hr']).map(code => ({
    code,
    flagCode: LANGUAGE_METADATA[code]?.flagCode || code,
    name: LANGUAGE_METADATA[code]?.name || code
  }))

  const currentLang = languages.find(l => l.code === language)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-12 h-12 bg-white border border-[#d4c4a8] rounded-lg hover:bg-[#fdfbf7] transition-colors shadow-sm overflow-hidden"
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
          <div className="absolute top-full mt-2 left-0 bg-white border border-[#d4c4a8] rounded-lg shadow-lg z-50 min-w-[200px]">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#fdfbf7] transition-colors ${
                  language === lang.code ? 'bg-[#f5f0e8]' : ''
                }`}
              >
                <span className={`fi fi-${lang.flagCode}`} style={{ fontSize: '24px' }}></span>
                <span className="font-serif text-[#2c2416]">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

