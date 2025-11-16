import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { MenuItemsPage } from './MenuItemsPage'
import { SettingsPage } from './SettingsPage'
import { QRCodePage } from './QRCodePage'

interface AdminDashboardProps {
  onViewChange?: (view: 'menu' | 'admin' | 'login' | 'qr') => void
}

export function AdminDashboard({ onViewChange: _onViewChange }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState<'menu-items' | 'qr' | 'settings'>('menu-items')
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleViewChange = (view: 'menu-items' | 'qr' | 'settings') => {
    setCurrentView(view)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'menu-items':
        return <MenuItemsPage />
      case 'qr':
        return <QRCodePage />
      case 'settings':
        return <SettingsPage />
      default:
        return <MenuItemsPage />
    }
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
