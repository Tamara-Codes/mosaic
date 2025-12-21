import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { MenuItemsPage } from './MenuItemsPage'
import { SettingsPage } from './SettingsPage'
import { QRCodePage } from './QRCodePage'
import { OrdersPage } from './OrdersPage'
import { MessagesPage } from './MessagesPage'
import { useApiClient } from '@/lib/apiHelpers'
import { toast } from 'sonner'

interface AdminDashboardProps {
  onViewChange?: (view: 'menu' | 'admin' | 'login' | 'qr') => void
}

export function AdminDashboard({ onViewChange: _onViewChange }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<'menu-items' | 'orders' | 'messages' | 'qr' | 'settings'>('menu-items')
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null) // null = checking
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const apiClient = useApiClient()

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

  const handleViewChange = (view: 'menu-items' | 'orders' | 'messages' | 'qr' | 'settings') => {
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Restoran nije pronađen</h2>
            <p className="text-muted-foreground">
              Vaš račun nije povezan s restoranom. Restorani se kreiraju ručno od strane administratora.
            </p>
          </div>
        </div>
      )
    }

    switch (currentView) {
      case 'menu-items':
        return hasRestaurant ? <MenuItemsPage /> : null
      case 'orders':
        return hasRestaurant ? <OrdersPage /> : null
      case 'messages':
        return hasRestaurant ? <MessagesPage /> : null
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
        <SiteHeader currentView={currentView === 'menu-items' ? 'menu-items' : currentView === 'settings' ? 'settings' : currentView === 'qr' ? 'qr' : 'dashboard'} />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
