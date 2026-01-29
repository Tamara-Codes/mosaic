import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { useApiClient } from "@/lib/apiHelpers"

interface SiteHeaderProps {
  currentView?: 'dashboard' | 'menu-items' | 'categories' | 'qr' | 'settings'
}

const viewTitles: Record<string, string> = {
  dashboard: 'Analitika',
  'menu-items': 'Jelovnik',
  categories: 'Kategorije',
  qr: 'QR Kod',
  settings: 'Postavke'
}

export function SiteHeader({ currentView = 'menu-items' }: SiteHeaderProps) {
  const title = viewTitles[currentView] || viewTitles.dashboard
  const apiClient = useApiClient()
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null)

  useEffect(() => {
    // Fetch restaurant info to get the slug
    const fetchRestaurantInfo = async () => {
      try {
        const response = await apiClient.get('/api/restaurant-info')
        if (response.data?.slug) {
          setRestaurantSlug(response.data.slug)
        }
      } catch (error) {
        console.error('Failed to fetch restaurant info:', error)
      }
    }
    fetchRestaurantInfo()
  }, [])

  const handlePreviewClick = () => {
    if (restaurantSlug) {
      const menuUrl = `/menu/${restaurantSlug}`
      window.open(menuUrl, "_blank")
    } else {
      alert('Restaurant slug not available. Please check your restaurant settings.')
    }
  }

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="flex-1 text-base font-medium">{title}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewClick}
            disabled={!restaurantSlug}
          >
            <Eye className="w-4 h-4 mr-2" />
            Pregled Menija
          </Button>
        </div>
      </div>
    </header>
  )
}
