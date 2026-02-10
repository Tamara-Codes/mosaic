import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './components/LoginPage'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is required but not set. Please configure Clerk.')
}

// Redirect component for menu pages to public menu frontend
function MenuRedirect() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>()

  useEffect(() => {
    const menuUrl = import.meta.env.VITE_MENU_URL
      ? `${import.meta.env.VITE_MENU_URL}/menu/${restaurantSlug || ''}`
      : `http://localhost:5181/menu/${restaurantSlug || ''}`
    window.location.href = menuUrl
  }, [restaurantSlug])

  return <div>Redirecting to menu...</div>
}

const routes = (
  <BrowserRouter>
    <Routes>
      <Route path="/menu/:restaurantSlug" element={<MenuRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sign-in" element={<LoginPage />} />
      <Route path="/sign-up" element={<LoginPage />} />
      <Route path="/dashboard" element={<App />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
