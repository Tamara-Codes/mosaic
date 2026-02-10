import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

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

      {/* Pricing Section */}
      <PricingSection />

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

