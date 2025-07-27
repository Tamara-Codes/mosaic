import "./global.css";
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import { ReactNode } from "react"

const inter = Inter({ subsets: ["latin"] })


export const metadata = {
  title: 'mosAIc',
  description: 'A mosaic of AI tools',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        {children}
       <footer className="bg-gray-800 text-white text-center py-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} mosAIc. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  </ClerkProvider>
);
}