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
        await apiClient.get('/api/restaurant-info')
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
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-2xl">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">Dobrodošli! 👋</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Vaš račun još nije povezan s restoranom. Kako biste počeli, trebate kontaktirati našu podršku.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center mb-8">
              <p className="text-blue-900 font-semibold mb-6">
                Kontaktirajte nas na:
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-800 text-sm mb-2">📧 Email:</p>
                  <a 
                    href="mailto:info@ferros.menu"
                    className="inline-block px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 transition-colors font-semibold"
                  >
                    info@ferros.menu
                  </a>
                </div>
                <div>
                  <p className="text-blue-800 text-sm mb-2">ili ispunite obrazac:</p>
                  <a 
                    href="https://ferros.menu#contact"
                    className="inline-block px-6 py-2 bg-blue-200 text-blue-900 rounded hover:bg-blue-300 transition-colors font-semibold"
                  >
                    Obrazac za kontakt
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Odjavi se
            </button>
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
