import { Navigation } from '../components/Navigation'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-gray-700">O </span>
            <span className="text-red-500">Nama</span>
          </h1>
          <div className="w-24 h-1 bg-red-500 mx-auto"></div>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Naša priča</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dobrodošli u <span className="text-red-500 font-semibold">Bistro Popeye</span>, mjesto gdje se tradicija susreće s modernim okusima. 
              Naša strast je pripremanje svježih, kvalitetnih jela koja zadovoljavaju sva Vaša osjetila.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Svaki dan pripremamo <span className="text-red-500 font-semibold">dnevni jelovnik</span> s pažljivo odabranim jelima, koristeći samo najsvježije 
              namirnice i lokalne proizvode. Naša filozofija je jednostavna - <span className="text-red-500 font-semibold">kvaliteta, svježina i 
              ljubav prema hrani</span>.
            </p>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Naša misija</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Naša misija je pružiti vam <span className="text-red-500 font-semibold">nezaboravno kulinarsko iskustvo</span> u prijateljskoj i opuštenoj 
              atmosferi. Vjerujemo da dobra hrana spaja ljude i stvara uspomene koje traju zauvijek.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Svaki gost je za nas poseban, i trudimo se da svaki obrok bude <span className="text-red-500 font-semibold">savršenstvo</span> koje ćete 
              željeti ponovno iskusiti.
            </p>
          </section>

          <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Zašto odabrati nas?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✓</span>
                <span>Svježe pripremljena jela svaki dan</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✓</span>
                <span>Kvalitetni lokalni proizvodi</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✓</span>
                <span>Dnevni jelovnik koji se mijenja</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✓</span>
                <span>Prijateljsko osoblje i ugodna atmosfera</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✓</span>
                <span>Dostava i preuzimanje narudžbi</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Copyright */}
      <div className="border-t border-gray-200 mt-20 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bistro Popeye. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  )
}

