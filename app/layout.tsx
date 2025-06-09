import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { DebugSupabase } from "@/components/debug-supabase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AQPlatform",
  description: "Build forms, workflows, and manage documents with ease",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            {children}
            <DebugSupabase />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
