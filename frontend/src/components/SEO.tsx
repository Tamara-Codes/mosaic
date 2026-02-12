import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'restaurant'
  restaurantName?: string
  restaurantDescription?: string
  menuItems?: Array<{ name: string; price: number; description?: string }>
}

export function SEO({
  title,
  description,
  image = '/ferros-logo.png',
  url,
  type = 'website',
  restaurantName,
  restaurantDescription,
  menuItems,
}: SEOProps) {
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ferros.menu'
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl
    const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

    // Update title
    if (title) {
      document.title = title
    }

    // Helper function to set or update meta tag
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${property}"]`)
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    // Primary meta tags
    if (title) {
      setMetaTag('title', title)
    }
    if (description) {
      setMetaTag('description', description)
    }

    // Open Graph tags
    setMetaTag('og:type', type, true)
    setMetaTag('og:url', fullUrl, true)
    if (title) {
      setMetaTag('og:title', title, true)
    }
    if (description) {
      setMetaTag('og:description', description, true)
    }
    setMetaTag('og:image', fullImageUrl, true)
    setMetaTag('og:image:width', '1200', true)
    setMetaTag('og:image:height', '630', true)

    // Twitter tags
    setMetaTag('twitter:card', 'summary_large_image', true)
    setMetaTag('twitter:url', fullUrl, true)
    if (title) {
      setMetaTag('twitter:title', title, true)
    }
    if (description) {
      setMetaTag('twitter:description', description, true)
    }
    setMetaTag('twitter:image', fullImageUrl, true)

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', fullUrl)

    // Structured data (JSON-LD)
    const structuredData: any = {
      '@context': 'https://schema.org',
    }

    if (type === 'restaurant' && restaurantName) {
      structuredData['@type'] = 'Restaurant'
      structuredData.name = restaurantName
      if (restaurantDescription) {
        structuredData.description = restaurantDescription
      }
      if (menuItems && menuItems.length > 0) {
        structuredData.hasMenu = {
          '@type': 'Menu',
          hasMenuSection: menuItems.map((item) => ({
            '@type': 'MenuItem',
            name: item.name,
            description: item.description || '',
            offers: {
              '@type': 'Offer',
              price: item.price.toString(),
              priceCurrency: 'EUR',
            },
          })),
        }
      }
    } else {
      structuredData['@type'] = 'WebSite'
      structuredData.name = 'Ferros'
      structuredData.url = baseUrl
      structuredData.description = description || 'QR jelovnik koji automatski prevodi na 100+ jezika'
    }

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new structured data
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }, [title, description, image, url, type, restaurantName, restaurantDescription, menuItems])

  return null
}

