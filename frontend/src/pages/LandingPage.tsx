import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

import { ContactForm } from '@/components/ContactForm'
import { SEO } from '@/components/SEO'
import { BorderBeam } from '@/components/magicui/border-beam'
import { Pointer } from '@/components/magicui/pointer'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Zap, Utensils, Rocket, Sparkles, Smartphone, Facebook, Twitter, Linkedin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export function LandingPage() {
  const { language, t } = useLanguage()
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

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
        title={t('seo.title')}
        description={t('seo.description')}
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
              <LanguageSelector availableLanguages={['hr', 'en']} variant="dark" />
              <Link to="/login">
                <Button variant="ghost" className="text-zinc-400 hover:text-orange-500 hover:bg-white/5">
                  {t('nav.login')}
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
                  {t('nav.tagline')}
                </p>
              </div>

              {/* Title Section */}
              <div className="text-center lg:text-left w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 px-2 sm:px-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {(() => {
                    const title = t('hero.title')
                    const parts = title.split('AI')
                    if (parts.length === 2) {
                      const hasLineBreak = title.includes('<br />')
                      const firstPart = parts[0]
                      const secondPart = parts[1]
                      
                      if (hasLineBreak) {
                        // Handle line break - split on <br /> and render accordingly
                        const firstLineParts = firstPart.split('<br />')
                        const secondLineParts = secondPart.split('<br />')
                        
                        if (firstLineParts.length > 1) {
                          // <br /> is in first part
                          return (
                            <>
                              {firstLineParts[0]}
                              <br />
                              <span className="text-orange-500">AI</span>
                              {firstLineParts[1]}{secondPart}
                            </>
                          )
                        } else if (secondLineParts.length > 1) {
                          // <br /> is in second part
                          return (
                            <>
                              {firstPart}
                              <span className="text-orange-500">AI</span>
                              {secondLineParts[0]}
                              <br />
                              {secondLineParts[1]}
                            </>
                          )
                        }
                      }
                      
                      return (
                        <>
                          {firstPart}
                          <span className="text-orange-500">AI</span>
                          {secondPart}
                        </>
                      )
                    }
                    // If no AI split, check for line break
                    if (title.includes('<br />')) {
                      const lines = title.split('<br />')
                      return (
                        <>
                          {lines[0]}
                          <br />
                          {lines[1]}
                        </>
                      )
                    }
                    return title
                  })()}
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-zinc-300 font-light tracking-normal leading-6 sm:leading-7 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-2 sm:px-0">
                  <span dangerouslySetInnerHTML={{ __html: t('hero.subtitle.line1') }} />{' '}
                  {language === 'hr' && <><br className="hidden sm:block" /></>}
                  <span dangerouslySetInnerHTML={{ __html: t('hero.subtitle.line2') }} />
                  {language === 'hr' && <><br className="hidden sm:block" /></>}
                  {' '}<span dangerouslySetInnerHTML={{ __html: t('hero.subtitle.line3') }} />
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 px-2 sm:px-0">
                  <a href="#contact" className="w-auto sm:w-auto">
                    <ShimmerButton
                      background="rgba(249, 115, 22, 1)"
                      shimmerColor="#fff"
                      className="w-auto sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl"
                    >
                      {t('hero.cta.vip')}
                    </ShimmerButton>
                  </a>
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
                {t('features.badge')}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2 sm:px-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {t('features.title')}
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
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">{t('features.ai_assistant.title')}</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('features.ai_assistant.desc')}
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
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">{t('features.custom_design.title')}</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('features.custom_design.desc')}
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
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">{t('features.ai_photos.title')}</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('features.ai_photos.desc')}
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
                <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-2 sm:mb-3">{t('features.ai_translation.title')}</h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('features.ai_translation.desc')}
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
                {t('hero.cta.vip')}
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
              {t('benefits.title')}
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto px-2 sm:px-0">
              {t('benefits.subtitle')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.languages.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.languages.desc')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.updates.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.updates.desc')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.allergens.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.allergens.desc')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.promotions.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.promotions.desc')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.identity.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.identity.desc')}
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
                  <CardTitle className="text-orange-500 text-lg sm:text-xl">{t('benefits.contactless.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {t('benefits.contactless.desc')}
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
                  <span className="text-orange-400 text-sm font-semibold">{t('contact.badge')}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                  {t('contact.title')} <span className="hidden md:inline"><br /></span><span className="whitespace-nowrap">{t('contact.title.vip')}</span>
                </h2>
                <p className="text-lg text-orange-400 mb-8 font-medium">
                  {t('contact.subtitle')}
                </p>
                
                <p className="text-zinc-300 text-base mb-8 leading-relaxed">
                  {t('contact.intro')} <span className="text-orange-400 font-semibold">{t('contact.intro.vip')}</span>{t('contact.intro.colon')}
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">{t('contact.benefit1.title')}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t('contact.benefit1.desc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">{t('contact.benefit2.title')}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t('contact.benefit2.desc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">{t('contact.benefit3.title')}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t('contact.benefit3.desc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-1">
                      <span className="text-orange-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">{t('contact.benefit4.title')}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed">{t('contact.benefit4.desc')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-orange-500/20">
                  <p className="text-center">
                    <span className="text-orange-400 text-3xl font-bold">3/5</span>
                    <span className="text-zinc-300 text-base ml-2">{t('contact.spots')}</span>
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
          <h2 className="text-4xl font-bold text-orange-500 mb-12 text-center">{t('faq.title')}</h2>
          <div className="flex flex-col gap-4">
            {[
              {
                question: t('faq.q1'),
                answer: t('faq.a1')
              },
              {
                question: t('faq.q2'),
                answer: t('faq.a2')
              },
              {
                question: t('faq.q3'),
                answer: t('faq.a3')
              },
              {
                question: t('faq.q4'),
                answer: t('faq.a4')
              },
              {
                question: t('faq.q5'),
                answer: t('faq.a5')
              },
              {
                question: t('faq.q6'),
                answer: (
                  <>
                    {t('faq.a6.part1')} <span className="text-orange-400 font-semibold">{t('faq.a6.minutes')}</span>{t('faq.a6.part2')}
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
              <p className="text-orange-400 text-sm mb-4">{t('footer.tagline')}</p>
              <p className="text-zinc-500 text-xs md:mt-auto mt-6">{t('footer.copyright')}</p>
            </div>

            {/* Middle Column - Legal */}
            <div className="flex flex-col md:mx-auto">
              <h4 className="text-white font-semibold text-sm mb-4">{t('footer.legal')}</h4>
              <div className="space-y-3">
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  {t('footer.terms')}
                </a>
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  {t('footer.privacy')}
                </a>
                <a href="#" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  {t('footer.cookies')}
                </a>
              </div>
            </div>

            {/* Right Column - Contact */}
            <div className="flex flex-col md:ml-auto">
              <h4 className="text-white font-semibold text-sm mb-4">{t('footer.contact')}</h4>
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

    </>
  )
}

