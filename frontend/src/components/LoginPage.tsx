import { SignIn, SignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'

export function LoginPage() {
  const location = useLocation()
  const isSignUp = location.pathname === '/sign-up'

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 text-white p-12 flex-col justify-center items-center relative">
        <div className="relative z-10 max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <UtensilsCrossed className="w-20 h-20 text-white" />
            <h1 className="text-7xl font-bold tracking-tight">
              mos<span className="text-indigo-300">AI</span>c
            </h1>
          </div>

          {/* Punchline */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">
              Vaš elektronski jelovnik,
              <br />
              <span className="text-indigo-300">Preveden globalno</span>
            </h2>
          </div>

        </div>
      </div>

      {/* Right Side - Authentication */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
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

