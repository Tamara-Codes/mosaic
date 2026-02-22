import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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

// Landing page translations
const LANDING_TRANSLATIONS: Record<string, Record<string, string>> = {
  hr: {
    // Navigation
    'nav.login': 'Prijava',
    'nav.tagline': 'Iskovan za vrhunsku uslugu',
    
    // Hero Section
    'hero.title': 'AI jelovnik kojim upravljate putem WhatsAppa',
    'hero.title.ai': 'AI',
    'hero.subtitle.line1': 'AI prevodi na <span class="text-orange-400 font-normal">100+ jezika</span> i generira profesionalne <span class="text-orange-400 font-normal">fotografije jela</span>.',
    'hero.subtitle.line2': '<span class="text-orange-400 font-normal">Unikatan dizajn</span> kreiran za Vaš restoran, bez generičkih šablona.',
    'hero.subtitle.line3': 'Upravljajte ponudom u stvarnom vremenu – od promjene cijena do micanja jela - preko <span class="text-orange-400 font-normal">WhatsAppa</span>.',
    'hero.cta.vip': 'Postani VIP partner',
    'hero.cta.demo': 'Pogledaj Ferros u akciji',
    
    // Features Section
    'features.badge': 'Revolucionaran pristup',
    'features.title': 'Ovo nije još jedan generički jelovnik.',
    'features.ai_assistant.title': 'Ferros AI asistent',
    'features.ai_assistant.desc': 'Upravljajte ponudom u hodu preko WhatsAppa. Pošaljite "Makni sva jela sa kozicama s jelovnika" i Ferros AI asistent odmah izvršava naredbu.',
    'features.custom_design.title': '100% personalizirani dizajn',
    'features.custom_design.desc': 'Dizajn koji prati karakter Vašeg restorana. Bez generičkih predložaka, Vaš digitalni meni odražava Vaš identitet.',
    'features.ai_photos.title': 'AI generirane fotografije jela',
    'features.ai_photos.desc': 'Pretvorite sastojke u umjetnost bez angažiranja fotografa. Jela sa slikama prodaju se do 30% više. Idealno za sezonske promjene i dnevne ponude.',
    'features.ai_translation.title': 'AI prijevodi na 100+ jezika',
    'features.ai_translation.desc': 'Napredni AI modeli razumiju gastronomski kontekst i održavaju profesionalnost na svakom jeziku.',
    
    // Benefits Section
    'benefits.title': 'Budućnost ugostiteljstva u jednom QR kodu',
    'benefits.subtitle': 'Sve što Vam je potrebno za brže poslovanje i veću zaradu.',
    'benefits.languages.title': 'Jezici bez barijera',
    'benefits.languages.desc': 'Automatski prijevodi na 100+ jezika. Turist više ne pogađa što je "buzara" – on naručuje s povjerenjem.',
    'benefits.updates.title': 'Ažuriranja u sekundi',
    'benefits.updates.desc': 'Nestalo je škampa? Nova cijena ribe? Promijenite ponudu odmah, bez križanja kemijskom ili ponovnog tiska.',
    'benefits.allergens.title': '14 alergena, 0 nagađanja',
    'benefits.allergens.desc': 'Jasno istaknuti alergeni uz svako jelo. Gost se osjeća sigurno, a konobar ne mora pamtiti svaki sastojak.',
    'benefits.promotions.title': 'Istaknite dnevnu ponudu',
    'benefits.promotions.desc': 'Pop-up obavijest koja dočekuje goste. Savršeno za promociju ulova dana ili sezonskih akcija čim otvore meni.',
    'benefits.identity.title': 'Premium vizualni identitet',
    'benefits.identity.desc': 'Svaki jelovnik dizajniramo od nule. Boje i tipografija koji savršeno prate stil Vašeg restorana.',
    'benefits.contactless.title': 'Elegantno i beskontaktno',
    'benefits.contactless.desc': 'Uključeni premium QR držači. Gosti skeniraju vlastitim mobitelom – higijenski i bez masnih papira.',
    
    // Contact Section
    'contact.badge': 'VIP program',
    'contact.title': 'Postanite',
    'contact.title.vip': 'VIP partner',
    'contact.subtitle': 'Pomozite nam oblikovati budućnost digitalnih jelovnika.',
    'contact.intro': 'Tražimo 5 restorana koji će nam pomoći u razvoju Ferrosa. Vaš feedback oblikuje proizvod, a vi dobivate',
    'contact.intro.vip': 'VIP benefite',
    'contact.intro.colon': ':',
    'contact.benefit1.title': 'Besplatan e-jelovnik na godinu dana',
    'contact.benefit1.desc': 'Vaš digitalni jelovnik je potpuno besplatan prvu godinu. Bez skrivenih troškova.',
    'contact.benefit2.title': 'Ključ u ruke',
    'contact.benefit2.desc': 'Pošaljite nam PDF ili sliku svog cjenika, mi unosimo sve stavke i opise.',
    'contact.benefit3.title': 'Vaš feedback oblikuje proizvod',
    'contact.benefit3.desc': 'Vaše ideje i prijedlozi direktno utječu na razvoj. Vi ste naši suradnici, ne samo korisnici.',
    'contact.benefit4.title': 'Vaš logo na našoj web stranici',
    'contact.benefit4.desc': 'Iskazujemo zahvalnost prikazivanjem vašeg logotipa kao VIP partnera.',
    'contact.spots': 'mjesta preostalo',
    
    // FAQ Section
    'faq.title': 'Često postavljana pitanja',
    'faq.q1': '1. Što ako moji gosti ne znaju koristiti QR kod?',
    'faq.a1': 'Vaš papirnati cjenik i dalje ostaje na stolu (zakonska obveza!), ali digitalni jelovnik preuzima 90% posla. On je tu za turiste koji žele vidjeti slike, razumjeti sastojke na svom jeziku i naručiti više.',
    'faq.q2': '2. Što ako konobari misle da je sustav previše kompliciran?',
    'faq.a2': 'Konobari će Vas obožavati. Više ne moraju 50 puta dnevno objašnjavati što su "pljukanci" na njemačkom ili nabrajati alergene. Sustav radi taj dosadni dio posla, a oni se fokusiraju na bržu uslugu i veće napojnice.',
    'faq.q3': '3. Moram li kupovati nove tablete ili uređaje za restoran?',
    'faq.a3': 'Ne. Vaši gosti koriste vlastite mobitele, a Vi sustavom upravljate sa svog mobitela, tableta ili računala koje već imate.',
    'faq.q4': '4. Kako funkcionira prijevod na 100+ jezika? Je li to Google Translate?',
    'faq.a4': 'Koristimo napredne AI modele specijalizirane za gastronomiju koji razumiju kontekst (npr. razliku između "plate" kao tanjura i "plate" kao hladne plate). Vaš jelovnik će zvučati profesionalno na njemačkom, talijanskom, poljskom ili bilo kojem drugom jeziku.',
    'faq.q5': '5. Mogu li stvarno promijeniti cijenu usred radnog vremena?',
    'faq.a5': 'Da. Promjena je vidljiva istog trenutka čim kliknete "Spremi". Nema više križanja cijena kemijskom olovkom pred gostima.',
    'faq.q6': '6. Koliko mi vremena treba da postavim cijeli jelovnik?',
    'faq.a6.part1': 'Točno',
    'faq.a6.minutes': '0 minuta',
    'faq.a6.part2': '. Mi postavljamo jelovnik umjesto Vas. Vi nam samo pošaljete PDF ili sliku.',
    
    // Footer
    'footer.tagline': 'Iskovan za vrhunsku uslugu.',
    'footer.copyright': '© 2026 Sva prava pridržana.',
    'footer.legal': 'Pravno',
    'footer.terms': 'Opći uvjeti poslovanja',
    'footer.privacy': 'Izjava o privatnosti',
    'footer.cookies': 'Kolačići',
    'footer.contact': 'Kontakt',
    
    // Modal
    'modal.video.placeholder': 'Video u pripremi',
    'modal.badge': 'Demo',
    'modal.title': 'Vaš jelovnik, na svim jezicima svijeta.',
    'modal.text1': 'Naš AI prevodi Vaša jela i generira profesionalne opise koji prodaju.',
    'modal.text2': 'Gosti skeniraju, biraju na svom jeziku i naručuju s povjerenjem.',
    'modal.text3': 'Vi samo šaljete poruku',
    'modal.text3.ai': 'Ferros AI asistentu',
    'modal.text3.rest': ', on radi sve ostalo.',
    
    // SEO
    'seo.title': 'QR menu',
    'seo.description': 'QR jelovnik koji automatski prevodi na 100+ jezika. Mijenjajte cijene, sakrijte nedostupna jela, istaknite alergene — instant, bez tiskanja. Besplatno postavljanje za restorane.',
    
    // Contact Form
    // Questions Section
    'questions.title': 'Imate pitanja?',
    'questions.subtitle': 'Za sve upite slobodno nam se javite na',

    // Contact Form
    'form.title': 'Prijavi se kao VIP partner',
    'form.restaurant_name': 'Ime restorana',
    'form.restaurant_name.placeholder': 'Ime restorana',
    'form.restaurant_name.error': 'Ime restorana mora imati barem 2 slova.',
    'form.email': 'Email adresa',
    'form.email.placeholder': 'restoran@primjer.hr',
    'form.email.error': 'Unesite valjanu email adresu.',
    'form.mobile': 'Vaš broj mobitela (opcionalno)',
    'form.mobile.placeholder': '091 123 4567',
    'form.menu': 'Jelovnik (opcionalno)',
    'form.menu.upload': 'Kliknite za upload',
    'form.menu.drag': 'ili povucite datoteku',
    'form.menu.types': 'PDF ili slika (JPG, PNG, WEBP)',
    'form.submit': 'Pošalji zahtjev',
    'form.submitting': 'Šalje se...',
    'form.success.title': 'Zahtjev poslan!',
    'form.success.description': 'Javit ćemo vam se uskoro.',
    'form.error.title': 'Greška pri slanju zahtjeva',
    'form.error.description': 'Molimo pokušajte ponovno kasnije.',
  },
  en: {
    // Navigation
    'nav.login': 'Login',
    'nav.tagline': 'Forged for excellence',
    
    // Hero Section
    'hero.title': 'The AI menu<br />managed via WhatsApp',
    'hero.title.ai': 'AI',
    'hero.subtitle.line1': 'AI translates to <span class="text-orange-400 font-normal">100+ languages</span> and generates professional <span class="text-orange-400 font-normal">food photos</span>.',
    'hero.subtitle.line2': '<span class="text-orange-400 font-normal">Unique design</span> created for your restaurant, without generic templates.',
    'hero.subtitle.line3': 'Manage your menu in real-time – from changing prices to removing items – via <span class="text-orange-400 font-normal">WhatsApp</span>.',
    'hero.cta.vip': 'Become a VIP Partner',
    'hero.cta.demo': 'See Ferros in action',
    
    // Features Section
    'features.badge': 'Revolutionary approach',
    'features.title': 'This is not just another generic menu.',
    'features.ai_assistant.title': 'Ferros AI assistant',
    'features.ai_assistant.desc': 'Manage your menu on the go via WhatsApp. Send "Remove all dishes with shrimp from the menu" and the Ferros AI assistant executes the command immediately.',
    'features.custom_design.title': '100% personalized design',
    'features.custom_design.desc': 'Design that follows your restaurant\'s character. No generic templates, your digital menu reflects your identity.',
    'features.ai_photos.title': 'AI-generated food photos',
    'features.ai_photos.desc': 'Turn ingredients into art without hiring a photographer. Dishes with photos sell up to 30% more. Perfect for seasonal changes and daily specials.',
    'features.ai_translation.title': 'AI translations in 100+ languages',
    'features.ai_translation.desc': 'Advanced AI models understand gastronomic context and maintain professionalism in every language.',
    
    // Benefits Section
    'benefits.title': 'The future of hospitality in one QR code',
    'benefits.subtitle': 'Everything you need for faster business and higher revenue.',
    'benefits.languages.title': 'Languages without barriers',
    'benefits.languages.desc': 'Automatic translations to 100+ languages. Tourist no longer has to guess what a dish is, they order with confidence.',
    'benefits.updates.title': 'Updates in seconds',
    'benefits.updates.desc': 'Ran out of shrimp? New fish price? Change your menu immediately, without crossing out with a pen or reprinting.',
    'benefits.allergens.title': '14 allergens, 0 guessing',
    'benefits.allergens.desc': 'Clearly highlighted allergens with every dish. Guests feel safe, and waiters don\'t need to remember every ingredient.',
    'benefits.promotions.title': 'Highlight daily specials',
    'benefits.promotions.desc': 'Pop-up notification that greets guests. Perfect for promoting the catch of the day or seasonal promotions as soon as they open the menu.',
    'benefits.identity.title': 'Premium visual identity',
    'benefits.identity.desc': 'We design every menu from scratch. Colors and typography that perfectly match your restaurant\'s style.',
    'benefits.contactless.title': 'Elegant and contactless',
    'benefits.contactless.desc': 'Premium QR holders included. Guests scan with their own phones – hygienic and without greasy papers.',
    
    // Contact Section
    'contact.badge': 'VIP Partner Program',
    'contact.title': 'Become a',
    'contact.title.vip': 'VIP Partner',
    'contact.subtitle': 'Help us shape the future of digital menus.',
    'contact.intro': 'We\'re looking for 5 restaurants to help us develop Ferros. Your feedback shapes the product, and you get',
    'contact.intro.vip': 'VIP partner benefits',
    'contact.intro.colon': ':',
    'contact.benefit1.title': 'Free e-menu for 1 year',
    'contact.benefit1.desc': 'Your digital menu is completely free for the first year. No hidden costs.',
    'contact.benefit2.title': 'Turnkey setup',
    'contact.benefit2.desc': 'Send us a PDF or image of your menu, we enter all items and descriptions.',
    'contact.benefit3.title': 'Your feedback shapes the product',
    'contact.benefit3.desc': 'Your ideas and suggestions directly influence development. You\'re our collaborators, not just users.',
    'contact.benefit4.title': 'Your logo on our website',
    'contact.benefit4.desc': 'We show our appreciation by displaying your logo as a VIP partner.',
    'contact.spots': 'spots remaining',
    
    // FAQ Section
    'faq.title': 'Frequently asked questions',
    'faq.q1': '1. What if my guests don\'t know how to use a QR code?',
    'faq.a1': 'Your paper menu still stays on the table (legal requirement!), but the digital menu takes over 90% of the work. It\'s there for tourists who want to see pictures, understand ingredients in their language, and order more.',
    'faq.q2': '2. What if waiters think the system is too complicated?',
    'faq.a2': 'Waiters will love you. They no longer have to explain 50 times a day what "pljukanci" is in German or list allergens. The system does that boring part of the job, and they focus on faster service and bigger tips.',
    'faq.q3': '3. Do I need to buy new tablets or devices for the restaurant?',
    'faq.a3': 'No. Your guests use their own phones, and you manage the system from your phone, tablet, or computer that you already have.',
    'faq.q4': '4. How does translation to 100+ languages work? Is it Google Translate?',
    'faq.a4': 'We use advanced AI models specialized for gastronomy that understand context (e.g., the difference between "plate" as a dish and "plate" as a cold plate). Your menu will sound professional in German, Italian, Polish, or any other language.',
    'faq.q5': '5. Can I really change the price in the middle of service hours?',
    'faq.a5': 'Yes. The change is visible immediately as soon as you click "Save". No more crossing out prices with a pen in front of guests.',
    'faq.q6': '6. How much time do I need to set up the entire menu?',
    'faq.a6.part1': 'Exactly',
    'faq.a6.minutes': '0 minutes',
    'faq.a6.part2': '. We set up the menu for you. You just send us a PDF or image.',
    
    // Footer
    'footer.tagline': 'Forged for excellence.',
    'footer.copyright': '© 2026 All rights reserved.',
    'footer.legal': 'Legal',
    'footer.terms': 'Terms of Service',
    'footer.privacy': 'Privacy Policy',
    'footer.cookies': 'Cookies',
    'footer.contact': 'Contact',
    
    // Modal
    'modal.video.placeholder': 'Video coming soon',
    'modal.badge': 'Demo',
    'modal.title': 'Your menu, in all languages of the world.',
    'modal.text1': 'Our AI translates your dishes and generates professional descriptions that sell.',
    'modal.text2': 'Guests scan, choose in their language, and order with confidence.',
    'modal.text3': 'You just send a message to',
    'modal.text3.ai': 'Ferros AI assistant',
    'modal.text3.rest': ', it does everything else.',
    
    // SEO
    'seo.title': 'QR menu',
    'seo.description': 'QR menu that automatically translates to 100+ languages. Change prices, hide unavailable dishes, highlight allergens — instantly, without printing. Free setup for restaurants.',
    
    // Questions Section
    'questions.title': 'Have questions?',
    'questions.subtitle': 'For any inquiries, feel free to reach us at',

    // Contact Form
    'form.title': 'Apply as a VIP partner',
    'form.restaurant_name': 'Restaurant name',
    'form.restaurant_name.placeholder': 'Restaurant name',
    'form.restaurant_name.error': 'Restaurant name must be at least 2 characters.',
    'form.email': 'Email address',
    'form.email.placeholder': 'restaurant@example.com',
    'form.email.error': 'Please enter a valid email address.',
    'form.mobile': 'Your mobile number (optional)',
    'form.mobile.placeholder': '+1 234 567 8900',
    'form.menu': 'Menu (optional)',
    'form.menu.upload': 'Click to upload',
    'form.menu.drag': 'or drag and drop',
    'form.menu.types': 'PDF or image (JPG, PNG, WEBP)',
    'form.submit': 'Send request',
    'form.submitting': 'Sending...',
    'form.success.title': 'Request sent!',
    'form.success.description': 'We will contact you soon.',
    'form.error.title': 'Error sending request',
    'form.error.description': 'Please try again later.',
  },
}

// Default Croatian translations (for menu pages)
const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'food': 'Hrana',
  'drink': 'Pića',
  'intro_text_2': 'Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta.',
  'vegetarian': 'Vegetarijansko',
  'vegan': 'Vegansko',
  'spicy': 'Ljuto',
  'contains_gluten': 'Gluten',
  'contains_dairy': 'Mliječno',
  'contains_nuts': 'Orašasti plodovi',
  'contains_fish': 'Riba',
  'contains_shellfish': 'Školjke',
  'contains_eggs': 'Jaja',
  'gluten_free': 'Bez glutena',
  'dairy_free': 'Bez mliječnih proizvoda',
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
    // First check landing page translations
    if (LANDING_TRANSLATIONS[language] && LANDING_TRANSLATIONS[language][key]) {
      return LANDING_TRANSLATIONS[language][key]
    }
    
    // For Croatian, use default translations
    if (language === 'hr') {
      return DEFAULT_TRANSLATIONS[key] || LANDING_TRANSLATIONS['hr']?.[key] || key
    }

    // For other languages, find in ui_translations data
    const translation = uiTranslationsData.find(
      t => t.language_code === language && t.translation_key === key
    )
    return translation?.translation_value || LANDING_TRANSLATIONS['en']?.[key] || DEFAULT_TRANSLATIONS[key] || key
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

