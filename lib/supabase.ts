import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Global singleton with strict enforcement
class SupabaseClientSingleton {
  private static instance: ReturnType<typeof createBrowserClient> | null = null
  private static isCreating = false

  public static getInstance() {
    // Prevent concurrent creation
    if (this.isCreating) {
      return this.instance
    }

    if (!this.instance) {
      this.isCreating = true

      // Check if instance already exists globally (for hot reload scenarios)
      if (typeof window !== "undefined" && (window as any).__supabase_singleton) {
        this.instance = (window as any).__supabase_singleton
        this.isCreating = false
        return this.instance
      }

      this.instance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })

      // Store globally to prevent recreation during hot reloads
      if (typeof window !== "undefined") {
        ;(window as any).__supabase_singleton = this.instance
      }

      this.isCreating = false
    }

    return this.instance
  }

  public static reset() {
    this.instance = null
    this.isCreating = false
    if (typeof window !== "undefined") {
      delete (window as any).__supabase_singleton
    }
  }
}

// Export the singleton instance
export const supabase = SupabaseClientSingleton.getInstance()

// Type definitions
export type Workspace = {
  id: string
  name: string
  description?: string
  created_at: string
  owner_id: string
  logo_url?: string
  is_favorite?: boolean
  type?: "sender" | "recipient" | null
}

export type WorkspaceUser = {
  id: string
  workspace_id: string
  user_id: string
  role: "owner" | "admin" | "member"
  created_at: string
}

// Debug utilities
export function getSupabaseInstanceCount() {
  if (typeof window !== "undefined") {
    return (window as any).__supabase_singleton ? 1 : 0
  }
  return 0
}

export function resetSupabaseInstance() {
  SupabaseClientSingleton.reset()
}
