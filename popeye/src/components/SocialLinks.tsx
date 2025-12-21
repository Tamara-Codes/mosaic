import { Instagram, Facebook } from 'lucide-react'

interface SocialLinksProps {
  className?: string
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

export function SocialLinks({ className = '' }: SocialLinksProps) {
  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/profile.php?id=100094160501765',
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/bistro.popeye',
      color: 'text-pink-600 hover:bg-pink-50'
    },
    {
      name: 'TikTok',
      icon: TikTokIcon,
      url: 'https://tiktok.com/@bistropopeye',
      color: 'text-black hover:bg-gray-50'
    },
  ]

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {socialLinks.map((social) => {
        const Icon = social.icon
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 rounded-full border-2 border-gray-200 ${social.color} transition-all hover:scale-110`}
            aria-label={social.name}
          >
            <Icon className="w-6 h-6" />
          </a>
        )
      })}
    </div>
  )
}

