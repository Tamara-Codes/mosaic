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
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey || ''}>
      <BrowserRouter>
        <Routes>
          <Route path="/menu/:restaurantSlug" element={<PublicMenuPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-in" element={<LoginPage />} />
          <Route path="/sign-up" element={<LoginPage />} />
          <Route path="/dashboard" element={<App />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
