import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

import { ContactForm } from '@/components/ContactForm'
import { SEO } from '@/components/SEO'
import { BorderBeam } from '@/components/magicui/border-beam'
import { Pointer } from '@/components/magicui/pointer'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Globe, Zap, Utensils, Rocket, Sparkles, Smartphone, Facebook, Twitter, Instagram, Linkedin, X } from 'lucide-react'

export function LandingPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)

  // Remove padding from root element for full-width landing page
  useEffect(() => {
    const rootElement = document.getElementById('root')
    if (rootElement) {
      const originalPadding = rootElement.style.padding
      const originalMaxWidth = rootElement.style.maxWidth
      const originalMargin = rootElement.style.margin
      rootElement.style.padding = '0'
      rootElement.style.maxWidth = '100%'
      rootElement.style.margin = '0'
      
      return () => {
        // Restore original styles when component unmounts
        rootElement.style.padding = originalPadding
        rootElement.style.maxWidth = originalMaxWidth
        rootElement.style.margin = originalMargin
      }
    }
  }, [])

  const toggleItem = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }
  return (
    <>
      <SEO
        title="QR menu"
        description="QR jelovnik koji automatski prevodi na 100+ jezika. Mijenjajte cijene, sakrijte nedostupna jela, istaknite alergene — instant, bez tiskanja. Besplatno postavljanje za restorane."
        url="/"
        type="website"
      />
    <div className="min-h-screen bg-[#18181b] text-white font-sans selection:bg-orange-500/30">
      <Pointer className="fill-orange-500 text-orange-500 hidden md:block" />
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#18181b]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight text-white font-serif">
                <span className="text-orange-500 font-black">F</span>erros
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-zinc-400 hover:text-orange-500 hover:bg-white/5">
                  Prijava
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-8 sm:pt-32 sm:pb-12 lg:pt-32 lg:pb-32 bg-gradient-to-b from-[#18181b] via-zinc-950 to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Left side - Content */}
            <div className="flex flex-col items-center lg:items-start">
              {/* Logo */}
              <div className="mb-6 sm:mb-8 animate-in fade-in zoom-in duration-700 text-center lg:text-left">
                <img src="/ferros-logo.png" alt="Ferros Logo" className="h-24 w-24 sm:h-32 sm:w-32 md:h-48 md:w-48 object-contain drop-shadow-[0_0_50px_rgba(249,115,22,0.3)] mx-auto lg:mx-0" />
                <p className="text-sm sm:text-base md:text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400 mt-4 sm:mt-6">
                  Iskovan za vrhunsku uslugu
                </p>
              </div>

              {/* Title Section */}
              <div className="text-center lg:text-left w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 px-2 sm:px-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Prvi <span className="text-orange-500">AI</span> jelovnik kojim upravljate putem WhatsAppa
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-zinc-300 font-light tracking-normal leading-6 sm:leading-7 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-2 sm:px-0">
                  AI prevodi na <span className="text-orange-400 font-normal">100+ jezika</span> i generira profesionalne <span className="text-orange-400 font-normal">fotografije jela</span>.<br className="hidden sm:block" /><span className="text-orange-400 font-normal"> Unikatan dizajn</span> kreiran za Vaš restoran, bez generičkih šablona.<br className="hidden sm:block" /> Upravljajte ponudom u stvarnom vremenu – od promjene cijena do micanja jela - preko <span className="text-orange-400 font-normal">WhatsAppa</span>.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 px-2 sm:px-0">
                  <a href="#contact" className="w-auto sm:w-auto">
                    <ShimmerButton
                      background="rgba(249, 115, 22, 1)"
                      shimmerColor="#fff"
                      className="w-auto sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl"
                    >
                      Postani VIP korisnik
                    </ShimmerButton>
                  </a>
                  <Button 
                    size="lg" 
                    className="w-auto sm:w-auto bg-orange-400/10 hover:bg-orange-400/15 text-orange-300 border border-orange-400/20 px-6 sm:px-8 !h-auto py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full"
                    onClick={() => setIsDemoModalOpen(true)}
                  >
                    Pogledaj Ferros u akciji
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right side - Phone Mockup */}
            <div className="overflow-visible animate-in fade-in duration-700 mt-8 sm:mt-12 lg:mt-[2cm] flex justify-center lg:ml-[3cm]">
              <img src="/phone-mockup.png?v=3" alt="Ferros digitalni jelovnik na mobitelu" className="w-full max-w-sm sm:max-w-md lg:w-[145%] lg:max-w-none object-contain drop-shadow-2xl -ml-4 sm:-ml-2 lg:ml-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different - AI Features */}
      <section className="pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-12 lg:pb-12 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4 sm:mb-6">
              <span className="text-orange-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Revolucionaran pristup
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2 sm:px-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Ovo nije još jedan generički jelovnik.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* WhatsApp AI Chatbot */}
            <div className="group relative bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden flex items-start justify-center bg-gradient-to-br from-zinc-950 via-orange-950/30 to-zinc-900">
                <img src="/ferros-asistent.png" alt="WhatsApp AI chat" className="w-[170%] h-[170%] object-contain object-top" />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">Ferros AI asistent</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Upravljajte ponudom u hodu preko WhatsAppa. Pošaljite <span className="text-orange-300 italic">"Makni sva jela sa kozicama s jelovnika"</span> i Ferros AI asistent odmah izvršava naredbu.
                </p>
              </div>
            </div>

            {/* Custom Design */}
            <div className="group relative bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
                <img src="/bento-custom-menu.png" alt="Unikatan dizajn" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">100% personalizirani dizajn</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Dizajn koji prati karakter Vašeg restorana. Bez generičkih predložaka, Vaš digitalni meni odražava Vaš identitet.
                </p>
              </div>
            </div>

            {/* AI Image Generation */}
            <div className="group relative bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
                <img src="/bento-ai-photo.png" alt="AI fotografije jela" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">AI generirane fotografije jela</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Pretvorite sastojke u umjetnost bez angažiranja fotografa. Jela sa slikama prodaju se do 30% više. Idealno za sezonske promjene i dnevne ponude.
                </p>
              </div>
            </div>

            {/* AI Translation */}
            <div className="group relative bg-zinc-900/50 border border-white/5 rounded-xl sm:rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
                <img src="/bento-ai-translation.png" alt="AI prijevodi" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">AI prijevodi na 100+ jezika</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Napredni AI modeli razumiju gastronomski kontekst i održavaju profesionalnost na svakom jeziku.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-16 sm:mt-20 lg:mt-24 flex justify-center px-4">
            <a href="#contact" className="w-auto sm:w-auto">
              <ShimmerButton
                background="rgba(249, 115, 22, 1)"
                shimmerColor="#fff"
                className="w-auto sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl"
              >
                Postani VIP korisnik
              </ShimmerButton>
            </a>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 bg-gradient-to-b from-zinc-950 via-zinc-950 to-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight px-2 sm:px-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Budućnost ugostiteljstva u jednom QR kodu
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto px-2 sm:px-0">
              Sve što Vam je potrebno za brže poslovanje i veću zaradu.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Jezične barijere */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">Jezici bez barijera</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Automatski prijevodi na 100+ jezika. Turist više ne pogađa što je "buzara" – on naručuje s povjerenjem.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Ažuriranja u sekundi */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">Ažuriranja u sekundi</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Nestalo je škampa? Nova cijena ribe? Promijenite ponudu odmah, bez križanja kemijskom ili ponovnog tiska.
                </CardDescription>
              </CardContent>
            </Card>

            {/* 14 alergena, 0 nagađanja */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">14 alergena, 0 nagađanja</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Jasno istaknuti alergeni uz svako jelo. Gost se osjeća sigurno, a konobar ne mora pamtiti svaki sastojak.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Istaknite dnevnu ponudu */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">Istaknite dnevnu ponudu</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Pop-up obavijest koja dočekuje goste. Savršeno za promociju ulova dana ili sezonskih akcija čim otvore meni.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Premium vizualni identitet */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">Premium vizualni identitet</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Svaki jelovnik dizajniramo od nule. Boje i tipografija koji savršeno prate stil Vašeg restorana.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Elegantno i beskontaktno */}
            <Card className="group relative bg-zinc-900/50 border border-white/5 hover:border-orange-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">Elegantno i beskontaktno</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Uključeni premium QR držači. Gosti skeniraju vlastitim mobitelom – higijenski i bez masnih papira.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-[#18181b] relative overflow-hidden" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900/90 to-zinc-800/60 border border-orange-500/20 rounded-3xl p-8 lg:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* FOMO Section */}
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                  <span className="text-orange-400 text-sm font-semibold">Ekskluzivna ponuda</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                  Postanite jedan od <span className="hidden md:inline"><br /></span><span className="whitespace-nowrap">10 VIP partnera</span>
                </h2>
                <p className="text-lg text-orange-400 mb-8 font-medium">
                  Posebna ponuda za prve korisnike u sezoni 2026.
                </p>
                
                <p className="text-zinc-300 text-base mb-8 leading-relaxed">
                  Zaboravite na postavljanje sustava. Mi radimo sve za vas. Prvih 10 restorana dobiva <span className="text-orange-400 font-semibold">VIP tretman</span>:
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Ključ u ruke:</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">Pošaljite nam PDF ili sliku svog cjenika, mi unosimo sve stavke i opise.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Prioritetna podrška pri pokretanju:</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">Izravna pomoć dok god vaš prvi gost ne skenira kod.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Bez troškova postavljanja:</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">Troškovi postavljanja su u potpunosti ukinuti za VIP partnere.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-orange-500/20">
                  <p className="text-center">
                    <span className="text-orange-400 text-3xl font-bold">7/10</span>
                    <span className="text-zinc-300 text-base ml-2">mjesta preostalo</span>
                  </p>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="flex justify-center lg:justify-end">
                <ContactForm />
              </div>
            </div>
            <BorderBeam duration={8} size={100} colorFrom="#f97316" colorTo="#fb923c" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#18181b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-orange-500 mb-12 text-center">Često postavljana pitanja</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                question: "1. Što ako moji gosti ne znaju koristiti QR kod?",
                answer: "Vaš papirnati cjenik i dalje ostaje na stolu (zakonska obveza!), ali digitalni jelovnik preuzima 90% posla. On je tu za turiste koji žele vidjeti slike, razumjeti sastojke na svom jeziku i naručiti više."
              },
              {
                question: '2. Što ako konobari misle da je sustav previše kompliciran?',
                answer: "Konobari će Vas obožavati. Više ne moraju 50 puta dnevno objašnjavati što su \"pljukanci\" na njemačkom ili nabrajati alergene. Sustav radi taj dosadni dio posla, a oni se fokusiraju na bržu uslugu i veće napojnice."
              },
              {
                question: "3. Moram li kupovati nove tablete ili uređaje za restoran?",
                answer: "Ne. Vaši gosti koriste vlastite mobitele, a Vi sustavom upravljate sa svog mobitela, tableta ili računala koje već imate."
              },
              {
                question: "4. Kako funkcionira prijevod na 100+ jezika? Je li to Google Translate?",
                answer: "Koristimo napredne AI modele specijalizirane za gastronomiju koji razumiju kontekst (npr. razliku između \"plate\" kao tanjura i \"plate\" kao hladne plate). Vaš jelovnik će zvučati profesionalno na njemačkom, talijanskom, poljskom ili bilo kojem drugom jeziku."
              },
              {
                question: "5. Mogu li stvarno promijeniti cijenu usred radnog vremena?",
                answer: "Da. Promjena je vidljiva istog trenutka čim kliknete \"Spremi\". Nema više križanja cijena kemijskom olovkom pred gostima."
              },
              {
                question: "6. Koliko mi vremena treba da postavim cijeli jelovnik?",
                answer: (
                  <>
                    Točno <span className="text-orange-400 font-semibold">0 minuta</span>. Mi postavljamo jelovnik umjesto Vas. Vi nam samo pošaljete PDF ili sliku.
                  </>
                )
              }
            ].map((faq, index) => {
              const isOpen = openItems.has(index)
              return (
                <div
                  key={index}
                  className="bg-zinc-900/50 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full p-6 flex items-center justify-between text-left gap-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <h3 className="text-white font-semibold text-lg pr-4">{faq.question}</h3>
                    <svg
                      className={`w-5 h-5 text-orange-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-0">
                      {typeof faq.answer === 'string' ? (
                        <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
                      ) : (
                        <div className="text-zinc-400 leading-relaxed">{faq.answer}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-8 pb-20 lg:pt-8 lg:pb-20 bg-[#18181b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-orange-400/10 hover:bg-orange-400/15 text-orange-300 border border-orange-400/20 px-8 !h-auto py-4 text-lg font-semibold rounded-full"
              onClick={() => setIsDemoModalOpen(true)}
            >
              Pogledaj Ferros u akciji
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#18181b] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-20 lg:gap-32">
            {/* Left Column - Brand */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <img src="/ferros-logo.png" alt="Ferros Logo" className="h-10 w-10 object-contain" />
                <span className="text-lg font-bold text-white">Ferros</span>
              </div>
              <p className="text-orange-400 text-sm mb-4">Iskovan za vrhunsku uslugu.</p>
              <p className="text-zinc-500 text-xs md:mt-auto mt-6">© 2026 Sva prava pridržana.</p>
            </div>

            {/* Middle Column - Legal */}
            <div className="flex flex-col md:mx-auto">
              <h4 className="text-white font-semibold text-sm mb-4">Pravno</h4>
              <div className="space-y-3">
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  Opći uvjeti poslovanja
                </a>
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  Izjava o privatnosti
                </a>
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  Kolačići
                </a>
              </div>
            </div>

            {/* Right Column - Contact */}
            <div className="flex flex-col md:ml-auto">
              <h4 className="text-white font-semibold text-sm mb-4">Kontakt</h4>
              <div className="space-y-3">
                <a href="mailto:info@ferros.menu" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  info@ferros.menu
                </a>
                <div className="flex items-center gap-4 mt-4">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>

    {/* Demo Modal */}
    <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} maxWidth="max-w-6xl">
      <DialogContent 
        onClose={() => setIsDemoModalOpen(false)}
        className="max-w-6xl w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-orange-500/30 p-0 overflow-hidden shadow-2xl rounded-2xl"
      >
        <div className="relative">
          <button
            onClick={() => setIsDemoModalOpen(false)}
            className="absolute right-6 top-6 z-10 w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-orange-500/50 flex items-center justify-center transition-all text-zinc-400 hover:text-white backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left side - Video placeholder */}
            <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 lg:p-12 flex items-center justify-center border-r border-orange-500/10">
              <div className="relative w-full max-w-lg">
                <div className="relative aspect-video bg-gradient-to-br from-zinc-800/50 via-zinc-900/80 to-zinc-950 rounded-xl border-2 border-orange-500/30 overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)]">
                  {/* Video placeholder content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <button className="group relative w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] transition-all hover:scale-110">
                        <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <div className="absolute inset-0 rounded-full bg-orange-400/20 animate-ping opacity-75"></div>
                      </button>
                      <p className="text-zinc-400 text-sm font-medium">Video u pripremi</p>
                    </div>
                  </div>
                  
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Right side - Text content */}
            <div className="p-10 lg:p-14 flex flex-col justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
              <div className="mb-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
                  <span className="text-orange-400 text-sm font-semibold">Demo</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Vaš jelovnik, na svim jezicima svijeta.
                </h2>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-lg text-zinc-300 leading-relaxed">
                  Naš AI prevodi Vaša jela i generira profesionalne opise koji prodaju.
                </p>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  Gosti skeniraju, biraju na svom jeziku i naručuju s povjerenjem.
                </p>
                <p className="text-lg text-zinc-300 leading-relaxed">
                  Vi samo šaljete poruku <span className="text-orange-400 font-semibold">Ferros AI asistentu</span>, on radi sve ostalo.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <a href="#contact" onClick={() => setIsDemoModalOpen(false)}>
                  <ShimmerButton
                    background="rgba(249, 115, 22, 1)"
                    shimmerColor="#fff"
                    className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-2xl"
                  >
                    Postani VIP korisnik
                  </ShimmerButton>
                </a>
              </div>
            </div>
          </div>
          
          <BorderBeam duration={8} size={100} colorFrom="#f97316" colorTo="#fb923c" />
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}

