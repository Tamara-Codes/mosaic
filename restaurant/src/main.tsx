import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import MenuPage from './pages/MenuPage'
import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Clean URL for public menu: /:restaurantSlug */}
          <Route path="/:restaurantSlug" element={<MenuPage />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<div className="p-8 text-center text-gray-600">Restaurant menu not found</div>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
