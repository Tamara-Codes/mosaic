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
          <Route path="/menu/:restaurantSlug" element={<MenuPage />} />
          <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
