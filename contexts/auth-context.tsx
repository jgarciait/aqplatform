"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Global flag to prevent multiple auth providers
let authProviderInitialized = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const subscriptionRef = useRef<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    // Prevent multiple auth providers
    if (authProviderInitialized) {
      console.warn("AuthProvider already initialized, skipping...")
      return
    }
    authProviderInitialized = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        if (mountedRef.current) {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Session initialization error:", error)
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Set up auth state listener only if not already set
    if (!subscriptionRef.current) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (mountedRef.current) {
          console.log("Auth state changed:", event)
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)

          // Handle navigation with proper checks
          if (event === "SIGNED_IN" && session?.user) {
            // No automatic redirect here. Let the middleware and specific page logic handle routing.
            // For example, app/page.tsx already redirects from '/' to '/dashboard' if logged in.
            // If /admin requires specific roles, implement that check within /admin/page.tsx or its layout.
          } else if (event === "SIGNED_OUT") {
            setTimeout(() => {
              if (window.location.pathname !== "/login") {
                router.push("/login")
              }
            }, 100)
          }
        }
      })

      subscriptionRef.current = subscription
    }

    return () => {
      mountedRef.current = false
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      authProviderInitialized = false
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
