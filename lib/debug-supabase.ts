// Debug utility to track Supabase client instances
export function debugSupabaseInstances() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const instances = (window as any).__supabaseInstances || []
    console.log(`Total Supabase instances: ${instances.length}`)
    return instances.length
  }
  return 0
}

// Call this in your main app component to monitor instances
export function monitorSupabaseInstances() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    setInterval(() => {
      const count = debugSupabaseInstances()
      if (count > 1) {
        console.warn(`⚠️ Multiple Supabase instances detected: ${count}`)
      }
    }, 5000)
  }
}
