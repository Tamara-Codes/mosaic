"use client"

import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center relative px-4">
      <div className="absolute top-6 left-6">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.png" 
            alt="mosAIc logo"
            width={100}
            height={50}
          />
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-handwriting text-blue-600 leading-snug">
          Automate the repetitive.<br />
          Streamline the essential.
        </h1>
        <p className="mt-6 max-w-md mx-auto text-center text-base text-gray-700 font-handwriting">
          Whether you are a solo entrepreneur or scaling a business,<br />
          mosAIc gives you the power to use custom workflows that work while you rest.
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl bg-white shadow p-8 flex flex-col items-center space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Sign up</h2>

        <button
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 hover:bg-gray-100 transition"
        >
          <span className="text-gray-700 font-medium">Sign up with Google</span>
        </button>

        <p className="text-xs text-center text-gray-500">
          By creating your account, you agree to the{" "}
          <Link href="/terms" className="text-blue-500 underline">Terms of Service</Link>{" "}
        </p>

        {/* Sign in link */}
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 underline">Click here to sign in.</Link>
        </p>
      </div>
    </div>
  )
}
