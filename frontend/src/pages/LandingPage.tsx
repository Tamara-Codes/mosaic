import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

import { ContactForm } from '@/components/ContactForm'
import { SEO } from '@/components/SEO'
import { BorderBeam } from '@/components/magicui/border-beam'
import { Pointer } from '@/components/magicui/pointer'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { FocusCards } from '@/components/ui/focus-cards'
import { EyeOff, Globe, Camera, PencilLine, ShieldAlert, QrCode, Palette, Package } from 'lucide-react'

export function LandingPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

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
      <Pointer className="fill-orange-500 text-orange-500" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="flex flex-col items-start">
              {/* Logo - Left aligned */}
              <div className="mb-8 animate-in fade-in zoom-in duration-700">
                <img src="/ferros-logo.png" alt="Ferros Logo" className="h-32 w-32 md:h-48 md:w-48 object-contain drop-shadow-[0_0_50px_rgba(249,115,22,0.3)]" />
              </div>
              
              {/* Title Section - Left aligned */}
              <div className="text-left w-full">
                <p className="text-lg md:text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  Iskovan za vrhunsku uslugu
                </p>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Digitalni jelovnik koji prodaje više i štedi vaše vrijeme.
                </h1>
                <p className="text-lg md:text-xl text-zinc-300 font-light tracking-normal leading-7 mb-8 max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                  Integrirana AI tehnologija trenutno prevodi na 100+ jezika i generira fotografije jela. Upravljajte ponudom u stvarnom vremenu – od promjene cijena do micanja jela jednim klikom.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                  <a href="#contact">
                    <ShimmerButton
                      background="rgba(249, 115, 22, 1)"
                      shimmerColor="#fff"
                      className="px-8 py-4 text-lg font-semibold shadow-2xl"
                    >
                      Osiguraj VIP status
                    </ShimmerButton>
                  </a>
                  <Button size="lg" className="bg-orange-400/10 hover:bg-orange-400/15 text-orange-300 border border-orange-400/20 px-8 !h-auto py-4 text-lg font-semibold rounded-full">
                    Isprobaj demo
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right side - Phone Mockup */}
            <div className="overflow-visible animate-in fade-in duration-700 mt-[2cm]">
              <img src="/phone-mockup.png?v=3" alt="Ferros digitalni jelovnik na mobitelu" className="w-[160%] max-w-none object-contain drop-shadow-2xl ml-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Problems We Solve */}
      <section className="py-16 bg-[#18181b] mt-[2cm]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-orange-500 mb-16 text-center tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Zašto Ferros?</h2>
          <FocusCards cards={[
            { lucideIcon: EyeOff, title: "Nema škampa? Nema problema.", description: "Jedan klik i sva jela sa skampima nestaju s jelovnika u istom trenutku. Bez neugodnih \"nažalost, nemamo\" za stolom. Vaša ponuda je uvijek točno onakva kakva je danas." },
            { lucideIcon: Globe, title: "Jelovnik koji govori 100+ jezika", description: "Turist iz Njemačke ne bi trebao pogađati što je \"buzara\". Jelovnik se automatski prevodi na 100+ jezika — gosti razumiju svako jelo, naručuju sigurnije i naručuju više." },
            { lucideIcon: Camera, title: "Profesionalne slike jela — bez fotografa.", description: "Jela sa slikom prodaju se do 30% više. Naš AI generira visokokvalitetne fotografije za svaku stavku jelovnika." },
            { lucideIcon: PencilLine, title: "Zaboravite na korektore, naljepnice i tisak", description: "Nova cijena ribe? Sezonska akcija? Ažuriranje jelovnika nikada nije bilo lakše. Vaša ponuda je uvijek točna, a jelovnik uvijek izgleda profesionalno." },
            { lucideIcon: ShieldAlert, title: "14 alergena. 0 nagađanja.", description: "Alergeni su jasno označeni uz svako jelo. Gost s alergijom se osjeća sigurno, konobar ne mora pamtiti svaki sastojak." },
            { lucideIcon: QrCode, title: "Beskontaktno. Besprijekorno.", description: "QR kod umjesto papira. Bez masnih otisaka, bez pohabanih stranica. Gost skenira i čita. Čisto, moderno i beskontaktno." },
            { lucideIcon: Palette, title: "Svaki jelovnik je unikat.", description: "Svaki digitalni jelovnik dizajniramo u skladu s identitetom vašeg restorana — boje, fontovi i stil koji odražavaju vašu priču." },
            { lucideIcon: Package, title: "Dostavljamo QR stalke za stolove.", description: "Uz digitalni jelovnik dobivate i elegantne QR držače za stolove — spremni za korištenje od prvog dana, bez dodatnog troška." },
          ]} />
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
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
                  Postanite jedan od <br />10 VIP partnera
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
                      <p className="text-zinc-400 text-sm leading-relaxed">Pošaljite nam PDF ili sliku svog cjenika – mi unosimo sve stavke i opise.</p>
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
                    Točno <span className="text-orange-400 font-semibold">0 minuta</span>. Mi postavljamo jelovnik umjesto Vas - Vi samo nam pošaljete PDF ili sliku.
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
      <section className="py-20 bg-[#18181b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Button size="lg" className="bg-orange-400/10 hover:bg-orange-400/15 text-orange-300 border border-orange-400/20 px-8 !h-auto py-4 text-lg font-semibold rounded-full">
              Isprobaj demo
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
              <p className="text-zinc-400 text-sm mb-4">Iskovan za vrhunsku uslugu.</p>
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
                <a href="tel:+385912345678" className="block text-zinc-400 hover:text-orange-400 text-sm transition-colors">
                  +385 9X XXX XXXX
                </a>
                <p className="text-zinc-400 text-sm">
                  Adresa, Grad, OIB
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

