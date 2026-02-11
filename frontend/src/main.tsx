import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './components/LoginPage'
import { LandingPage } from './pages/LandingPage'
import PublicMenuPage from './pages/PublicMenuPage'
import { LanguageProvider } from './contexts/LanguageContext'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is required but not set. Please configure Clerk.')
}

const routes = (
  <BrowserRouter>
    <LanguageProvider>
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
        
        {/* Public menu - clean URL (/:restaurantSlug) */}
        <Route path="/:restaurantSlug" element={<PublicMenuPage />} />
        
        {/* Legacy support for /menu/:restaurantSlug */}
        <Route path="/menu/:restaurantSlug" element={<PublicMenuPage />} />
      </Routes>
      <Toaster />
    </LanguageProvider>
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
