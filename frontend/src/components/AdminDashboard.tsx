import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { MenuItemsPage } from './MenuItemsPage'
import { SettingsPage } from './SettingsPage'
import { QRCodePage } from './QRCodePage'
import { useApiClient } from '@/lib/apiHelpers'
import { toast } from 'sonner'

interface AdminDashboardProps {
  onViewChange?: (view: 'menu' | 'admin' | 'login' | 'qr') => void
}

export function AdminDashboard({ onViewChange: _onViewChange }: AdminDashboardProps) {
  const location = useLocation()
  const [currentView, setCurrentView] = useState<'menu-items' | 'qr' | 'settings'>('menu-items')
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null) // null = checking
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const apiClient = useApiClient()

  // Check for view in location state
  useEffect(() => {
    if (location.state?.view) {
      setCurrentView(location.state.view)
      // Clear the state so it doesn't persist
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Check if user has a restaurant on mount
  useEffect(() => {
    const checkRestaurant = async () => {
      try {
        await apiClient.get('/restaurant-info')
        setHasRestaurant(true)
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setHasRestaurant(false)
          toast.error('Restoran nije pronađen')
        } else {
          console.error('Error checking restaurant:', error)
          setHasRestaurant(false)
          toast.error('Greška pri provjeri restorana. Molimo kontaktirajte podršku.')
        }
      }
    }
    checkRestaurant()
  }, [])

  const handleViewChange = (view: 'menu-items' | 'qr' | 'settings') => {
    setCurrentView(view)
  }

  // Handle restaurant creation from settings
  const handleRestaurantCreated = () => {
    setHasRestaurant(true)
    setCurrentView('menu-items')
    toast.success('Restoran je uspješno kreiran!')
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const renderContent = () => {
    // Show loading state while checking for restaurant
    if (hasRestaurant === null) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Učitavanje...</p>
          </div>
        </div>
      )
    }

    // If no restaurant, show message (without sidebar)
    if (!hasRestaurant) {
      return (
        <div className="min-h-screen bg-[#18181b] flex items-center justify-center px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="bg-zinc-900/50 rounded-2xl border border-white/10 px-8 py-12 md:px-16 md:py-20">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img src="/ferros-logo.png" alt="Ferros Logo" className="h-24 w-24 object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Račun nije povezan
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed">
                Vaš račun još nije povezan s restoranom.
              </p>

              <div className="bg-zinc-800/50 rounded-xl border border-white/5 p-8 mb-8">
                <p className="text-white font-semibold text-lg mb-6">
                  Kako biste počeli, kontaktirajte našu podršku:
                </p>
                
                <a 
                  href="mailto:info@ferros.menu"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg shadow-lg hover:shadow-orange-500/20 mb-6"
                >
                  <span>info@ferros.menu</span>
                </a>
              </div>

              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>
      )
    }

    switch (currentView) {
      case 'menu-items':
        return hasRestaurant ? <MenuItemsPage /> : null
      case 'qr':
        return hasRestaurant ? <QRCodePage /> : null
      case 'settings':
        return hasRestaurant ? <SettingsPage onRestaurantCreated={handleRestaurantCreated} /> : null
      default:
        return hasRestaurant ? <MenuItemsPage /> : null
    }
  }

  // If no restaurant, don't show sidebar/header
  if (!hasRestaurant) {
    return <>{renderContent()}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        onLogout={handleLogout}
      />
      <SidebarInset>
        <SiteHeader currentView={currentView} />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
