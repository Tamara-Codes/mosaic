import { SignIn, SignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export function LoginPage() {
  const location = useLocation()
  const isSignUp = location.pathname === '/sign-up'

  return (
    <div className="min-h-screen flex bg-[#18181b]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#18181b] text-white p-12 flex-col justify-center items-center relative border-r border-white/10">
        <div className="relative z-10 max-w-md space-y-8 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <img 
              src="/ferros-logo.png" 
              alt="Ferros Logo" 
              className="w-48 h-48 object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]"
            />
            <h1 className="text-7xl font-bold tracking-tight font-serif">
              <span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">F</span>erros
            </h1>
          </div>

          {/* Punchline */}
          <div className="space-y-4">
            <p className="text-zinc-400 text-lg">
              Vaš elektronski jelovnik, preveden globalno.
            </p>
          </div>

        </div>
      </div>

      {/* Right Side - Authentication */}
      <div className="w-full lg:w-1/2 bg-[#18181b] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {isSignUp ? (
            <SignUp 
              routing="virtual"
              signInUrl="/sign-in"
              afterSignUpUrl="/dashboard"
              afterSignInUrl="/dashboard"
            />
          ) : (
            <SignIn 
              routing="virtual"
              signUpUrl="/sign-up"
              afterSignInUrl="/dashboard"
              afterSignUpUrl="/dashboard"
            />
          )}
        </div>
      </div>
    </div>
  )
}

