import { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { Toaster } from '@/components/ui/sonner'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load route components for code splitting
const App = lazy(() => import('./App.tsx'))
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })))
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const PublicMenuPage = lazy(() => import('./pages/PublicMenuPage'))

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is required but not set. Please configure Clerk.')
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
    <div className="text-center">
      <div className="mb-8">
        <div className="inline-block w-12 h-12 border-2 border-[#d4c4a8] border-t-[#8b6f47] rounded-full animate-spin"></div>
      </div>
      <p className="font-serif text-xl text-[#5c5043] italic">Loading...</p>
    </div>
  </div>
)

const routes = (
  <BrowserRouter>
    <LanguageProvider>
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
      <Toaster />
    </LanguageProvider>
  </BrowserRouter>
)

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <ErrorBoundary>
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
  </ErrorBoundary>,
)
