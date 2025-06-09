import { createClient } from "@supabase/supabase-js"

// Ensure these environment variables are set in your Vercel project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY // Use service role key for server-side operations

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Supabase environment variables are not set.")
  process.exit(1)
}

// Create a Supabase client with the service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createGeneralWorkspace(userId) {
  if (!userId) {
    console.error("User ID is required to create a general workspace.")
    return
  }

  try {
    // Check if a general workspace already exists for this user
    const { data: existingWorkspaces, error: fetchError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .eq("name", "General Workspace")
      .limit(1)

    if (fetchError) {
      console.error("Error checking for existing general workspace:", fetchError)
      return
    }

    if (existingWorkspaces && existingWorkspaces.length > 0) {
      console.log(`General Workspace already exists for user ${userId}. ID: ${existingWorkspaces[0].id}`)
      return existingWorkspaces[0].id
    }

    // If no general workspace exists, create one
    const { data: newWorkspace, error: insertError } = await supabase
      .from("workspaces")
      .insert([
        {
          owner_id: userId,
          name: "General Workspace",
          description: "Default workspace for general use.",
          logo_url: null, // You can set a default logo URL here if desired
        },
      ])
      .select("id")
      .single()

    if (insertError) {
      console.error("Error creating general workspace:", insertError)
      return
    }

    console.log(`Successfully created General Workspace for user ${userId}. ID: ${newWorkspace.id}`)
    return newWorkspace.id
  } catch (error) {
    console.error("An unexpected error occurred:", error)
  }
}

// Example usage: Replace 'your-user-id-here' with the actual user ID
// You would typically call this function when a new user signs up or logs in for the first time.
// For demonstration, you can run this script with a hardcoded user ID.
// createGeneralWorkspace('your-user-id-here');
