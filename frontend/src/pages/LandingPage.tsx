import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sparkles, Globe, DollarSign, Clock, Plus, QrCode, Smartphone } from 'lucide-react'

import { ContactForm } from '@/components/ContactForm'
import { PricingSection } from '@/components/PricingSection'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#18181b] text-white font-sans selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#18181b]/80 backdrop-blur-md border-b border-white/10 z-50">
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
      <section className="pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-12 animate-in fade-in zoom-in duration-700">
              <img src="/ferros-logo.png" alt="Ferros Logo" className="h-48 w-48 md:h-64 md:w-64 object-contain drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 border border-orange-500/20">
              <Sparkles className="h-4 w-4" />
              <span>Pokreće AI tehnologija</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
              Iskovan za <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                vrhunsku uslugu.
              </span>
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              QR jelovnik koji govori 100+ jezika. Mijenjajte cijene, sakrijte nedostupna jela, istaknite alergene — instant, bez tiskanja.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#18181b] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4 group-hover:bg-purple-500/20 transition-colors">
                <Globe className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">100+</div>
              <p className="text-zinc-400 text-lg">jezika podržano</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4 group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">0€</div>
              <p className="text-zinc-400 text-lg">za tiskanje</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4 group-hover:bg-orange-500/20 transition-colors">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <div className="text-5xl font-bold text-white mb-2">5 min</div>
              <p className="text-zinc-400 text-lg">za postavljanje</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-16 bg-[#18181b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Zašto Ferros?</h2>
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Nema škampa danas?</h3>
                <p className="text-zinc-400 leading-relaxed">Nema problema! Jednim klikom sva jela koja sadrže škampe nestaju s jelovnika.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Govorite jezikom svakog gosta</h3>
                <p className="text-zinc-400 leading-relaxed">Automatski prijevod na 100+ jezika. Nema više jezičnih barijera — svaki turist se osjeća dobrodošlim i razumije vašu ponudu u potpunosti.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">AI generacija slika</h3>
                <p className="text-zinc-400 leading-relaxed">Nemate fotografije? AI će vam generirati privlačne slike jela za sekundu.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                4
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Ažurirajte cijene u sekundi</h3>
                <p className="text-zinc-400 leading-relaxed">Zaboravite nalijepnice i korektor. Ažurirajte cijene instant na svim jelovnicima odjednom — uredno i točno.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                5
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Transparentni alergeni</h3>
                <p className="text-zinc-400 leading-relaxed">Gosti jasno vide sve alergene za svako jelo. Sigurnost na prvom mjestu.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                6
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Higijena je prioritet</h3>
                <p className="text-zinc-400 leading-relaxed">Zaboravite na prljave, pocijepane jelovnike. Digitalno rješenje je uvijek čisto.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                7
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Jednostavno skeniranje</h3>
                <p className="text-zinc-400 leading-relaxed">Gost skenira QR kod i odmah vidi jelovnik. Brzo, moderno, beskontaktno.</p>
              </div>
            </div>
            
            <div className="flex gap-4 bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-600 to-red-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                8
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">WhatsApp chatbot</h3>
                <p className="text-zinc-400 leading-relaxed">Upravljajte svim s mobitela preko WhatsAppa. Sve postaje još lakše!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-[#18181b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Kako funkcionira?</h2>
            <p className="text-zinc-400 text-lg">Tri jednostavna koraka do vašeg digitalnog jelovnika</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-orange-500 font-bold text-sm mb-2">KORAK 1</div>
                  <h3 className="text-white font-semibold text-xl mb-3">Dodajte jela i cijene</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Jednostavno unesite nazive jela, cijene i opise. AI automatski prevodi na sve jezike.
                  </p>
                </div>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-8 text-orange-500/50">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M8 32 L48 32 M48 32 L36 20 M48 32 L36 44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative">
              <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-purple-500 font-bold text-sm mb-2">KORAK 2</div>
                  <h3 className="text-white font-semibold text-xl mb-3">Dobivate QR kod i držače</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Mi vam besplatno dostavljamo QR kod i elegantne držače za stolove. Vi samo postavite — bez brige, bez dodatnih troškova.
                  </p>
                </div>
              </div>
              {/* Arrow for desktop */}
              <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-8 text-purple-500/50">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M8 32 L48 32 M48 32 L36 20 M48 32 L36 44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {/* Step 3 */}
            <div>
              <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-green-500 font-bold text-sm mb-2">KORAK 3</div>
                  <h3 className="text-white font-semibold text-xl mb-3">Gosti skeniraju i pregledavaju</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Gost skenira kod, vidi fotografije dezerta i naručuje. Sve na svom jeziku, instant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Dashboard Preview */}
      <section className="py-20 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Jednostavan i moćan dashboard</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Intuitivno sučelje dizajnirano za vlasnike restorana. Sve što vam treba na jednom mjestu.
            </p>
          </div>
          
          <div className="space-y-8">
            {/* Main Dashboard Screenshot */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 aspect-video flex items-center justify-center">
                {/* Placeholder - replace with actual screenshot */}
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-orange-500" />
                  </div>
                  <p className="text-zinc-500 text-sm">
                    Dashboard screenshot će biti dodan ovdje
                  </p>
                  <p className="text-zinc-600 text-xs mt-2">
                    Možete dodati pravi screenshot kasnije u /public/dashboard-screenshot.png
                  </p>
                </div>
                {/* When you have a screenshot, replace the above div with: */}
                {/* <img src="/dashboard-screenshot.png" alt="Ferros Dashboard" className="w-full h-full object-cover" /> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-[#18181b] relative overflow-hidden" id="contact">
        <div className="absolute inset-0 bg-orange-500/5 blur-3xl rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Spremni za <br />
              <span className="text-orange-500">digitalnu budućnost?</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              Pridružite se restoranima koji već koriste Ferros za poboljšanje iskustva svojih gostiju. Kontaktirajte nas i odaberite plan koji najbolje odgovara vašem restoranu.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#18181b] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/ferros-logo.png" alt="Ferros Logo" className="h-10 w-10 object-contain" />
            <span className="text-lg font-bold text-white">Ferros</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2026 Ferros. Sva prava pridržana.
          </p>
        </div>
      </footer>
    </div>
  )
}

