"use client"

import { useEffect, useState } from "react"
import { getSupabaseInstanceCount } from "@/lib/supabase"

export function DebugSupabase() {
  const [instanceCount, setInstanceCount] = useState(0)

  useEffect(() => {
    const checkInstances = () => {
      const count = getSupabaseInstanceCount()
      setInstanceCount(count)
      if (count > 1) {
        console.warn(`⚠️ Multiple Supabase instances detected: ${count}`)
      }
    }

    // Check immediately
    checkInstances()

    // Check every 5 seconds
    const interval = setInterval(checkInstances, 5000)

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
      Supabase Instances: {instanceCount}
      {instanceCount > 1 && <span className="text-red-400 ml-2">⚠️</span>}
    </div>
  )
}
