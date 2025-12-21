import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'
import { PublicMenuPage } from './components/PublicMenuPage'
import { LoginPage } from './components/LoginPage'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is required but not set. Please configure Clerk.')
}

const routes = (
  <BrowserRouter>
    <Routes>
      <Route path="/menu/:restaurantSlug" element={<PublicMenuPage />} />
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
