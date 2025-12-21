import { Link } from 'react-router-dom'
import { Navigation } from '../components/Navigation'
import { SocialLinks } from '../components/SocialLinks'
import { useParams } from 'react-router-dom'
import { Truck, Star, Soup, UtensilsCrossed } from 'lucide-react'

export function HomePage() {
  const { restaurantSlug } = useParams<{ restaurantSlug?: string }>()
  const slug = restaurantSlug || import.meta.env.VITE_RESTAURANT_SLUG

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-10">
              <span className="text-gray-700">Dobrodošli u </span>
              <span className="text-yellow-500">Bistro </span>
              <span className="text-red-500">Popeye</span>
            </h1>

            <p className="text-xl text-gray-600 mb-16 max-w-2xl mx-auto">
              Online narudžba i besplatna dostava.
              <br />
              Svježa hrana i dobar okus svaki dan.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={slug ? `/menu/${slug}` : '/'}
                className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-lg"
              >
                Pogledaj jelovnik
              </Link>
              <Link
                to="/about"
                className="px-8 py-3 bg-white text-red-500 border-2 border-red-500 rounded-lg font-semibold hover:bg-yellow-400 hover:border-yellow-400 hover:text-red-900 transition-colors"
              >
                Saznaj više
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pt-20 pb-32 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
                <Soup className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Marende</h3>
              <p className="text-gray-600">
                Svaki dan nešto novo i fino
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dnevni jelovnik</h3>
              <p className="text-gray-600">
                Svježa jela s novim okusima
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
                <Truck className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dostava</h3>
              <p className="text-gray-600">
                Naručite online i uživajte kod kuće
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
                <Star className="w-10 h-10 text-white fill-white" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kvaliteta</h3>
              <p className="text-gray-600">
                Najsvježije i najkvalitetnije namirnice
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Spremni za narudžbu?</h2>
          <p className="text-xl mb-8 text-red-50">
            Pregledajte naš dnevni jelovnik i naručite svoja omiljena jela
          </p>
          <Link
            to={slug ? `/menu/${slug}` : '/'}
            className="inline-block px-8 py-3 bg-white text-red-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Naruči sada
          </Link>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pratite Nas</h2>
          <p className="text-gray-600 mb-8">
            Budite u toku s našim najnovijim vijestima i ponudama
          </p>
          <SocialLinks />
        </div>
      </section>

      {/* Copyright */}
      <div className="border-t border-gray-200 mt-8 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Bistro Popeye. Sva prava pridržana.</p>
        </div>
      </div>
    </div>
  )
}

