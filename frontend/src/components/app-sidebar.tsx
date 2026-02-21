import * as React from "react"
import {
  UtensilsIcon,
  QrCodeIcon,
  SettingsIcon,
  LogOut,
  Sparkles,
  Bot,
  MessageSquareIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView?: string
  onViewChange?: (view: 'menu-items' | 'daily-special' | 'ai-settings' | 'qr' | 'settings' | 'feedback') => void
  onLogout?: () => void
}

// Restaurant logo component
function RestaurantLogo() {
  return (
    <div className="flex items-center justify-center h-24">
      <img
        src="/logo.png"
        alt="Restaurant Logo"
        className="h-full w-auto max-w-[200px] object-contain"
        onError={(e) => {
          console.error('Failed to load logo:', e);
          // Fallback to text if image fails
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.parentElement;
          if (fallback && !fallback.querySelector('.logo-fallback')) {
            const textFallback = document.createElement('div');
            textFallback.className = 'logo-fallback text-xl font-bold';
            textFallback.textContent = 'Ferros';
            fallback.appendChild(textFallback);
          }
        }}
      />
    </div>
  )
}

const data = {
  navMain: [
    {
      title: "Jelovnik",
      url: "#",
      icon: UtensilsIcon,
      action: "menu-items",
    },
    {
      title: "Dnevna ponuda",
      url: "#",
      icon: Sparkles,
      action: "daily-special",
    },
    {
      title: "Ferros AI",
      url: "#",
      icon: Bot,
      action: "ai-settings",
    },
    {
      title: "Recenzije",
      url: "#",
      icon: MessageSquareIcon,
      action: "feedback",
    },
  ],
  navSecondary: [
    {
      title: "QR Kod",
      url: "#",
      icon: QrCodeIcon,
      action: "qr",
    },
    {
      title: "Postavke",
      url: "#",
      icon: SettingsIcon,
      action: "settings",
    },
  ],
}

export function AppSidebar({ currentView, onViewChange, onLogout, ...props }: AppSidebarProps) {
  const handleNavClick = (action: string) => {
    if (onViewChange) {
      onViewChange(action as 'menu-items' | 'daily-special' | 'ai-settings' | 'qr' | 'settings' | 'feedback')
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <RestaurantLogo />
      </SidebarHeader>
      <SidebarContent className="px-3 py-4 flex flex-col">
        <NavMain
          items={data.navMain.map(item => ({
            ...item,
            onClick: () => handleNavClick(item.action),
          }))}
          currentView={currentView}
        />
        <div className="mt-8 pt-4 border-t border-sidebar-border">
          <NavMain
            items={data.navSecondary.map(item => ({
              ...item,
              onClick: () => handleNavClick(item.action),
            }))}
            currentView={currentView}
          />
          {/* Chatbot Button - Centered below Postavke */}
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openChatbot'))
              }}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-50/50 transition-colors"
              aria-label="Open Ferros AI"
            >
              <img
                src="/ferros-logo.png"
                alt="Ferros AI"
                className="w-32 h-32 object-contain"
              />
            </button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Odjava
        </Button>
        <div className="text-xs text-muted-foreground">
          © 2026 Ferros
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
