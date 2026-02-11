import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './components/LoginPage'
import { LandingPage } from './pages/LandingPage'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is required but not set. Please configure Clerk.')
}

// Redirect component for catch-all menu pages (clean URLs without /menu prefix)
function PublicMenuRedirect() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>()

  useEffect(() => {
    if (!restaurantSlug) {
      window.location.href = '/'
      return
    }
    
    const menuUrl = import.meta.env.VITE_MENU_URL
      ? `${import.meta.env.VITE_MENU_URL}/${restaurantSlug}`
      : `http://localhost:5181/${restaurantSlug}`
    window.location.href = menuUrl
  }, [restaurantSlug])

  return <div className="p-8 text-center">Redirecting to menu...</div>
}

const routes = (
  <BrowserRouter>
    <Routes>
      {/* API routes - pass through to backend */}
      <Route path="/api/*" element={null} />
      
      {/* Authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-in" element={<LoginPage />} />
      <Route path="/sign-up" element={<LoginPage />} />
      
      {/* Dashboard route (protected) */}
      <Route path="/dashboard/*" element={<App />} />
      
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Catch-all: Clean URL public menu (/{restaurantSlug}) */}
      <Route path="/:restaurantSlug" element={<PublicMenuRedirect />} />
    </Routes>
    <Toaster />
  </BrowserRouter>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {routes}
      </ClerkProvider>
    ) : (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Configuration Error</h1>
        <p>VITE_CLERK_PUBLISHABLE_KEY is required but not set.</p>
        <p>Please configure Clerk in your environment variables.</p>
      </div>
    )}
  </StrictMode>,
)
