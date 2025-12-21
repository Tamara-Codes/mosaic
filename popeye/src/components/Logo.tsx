interface LogoProps {
  className?: string
}

export function Logo({ className = '' }: LogoProps) {
  // Try to load logo image, fallback to text
  const logoSrc = '/logo.png'
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSrc} 
        alt="Popeye Logo" 
        className="h-12 w-auto"
        onError={(e) => {
          // Fallback to text logo if image doesn't exist
          const target = e.currentTarget
          target.style.display = 'none'
          const textLogo = target.nextElementSibling as HTMLElement
          if (textLogo) {
            textLogo.style.display = 'flex'
          }
        }}
      />
      <div className="flex items-center gap-2" style={{ display: 'none' }}>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-700">Bistro</span>
          <div className="text-3xl font-bold">
            <span className="text-red-600 drop-shadow-sm">POP</span>
            <span className="text-yellow-500 drop-shadow-sm">EYE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

