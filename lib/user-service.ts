import { supabase } from "./supabase"

export async function getUsersForWorkspace(workspaceId: string) {
  try {
    // Simply get the workspace_users entries for the given workspace
    const { data, error } = await supabase.from("workspace_users").select("*").eq("workspace_id", workspaceId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching users for workspace:", error)
    return []
  }
}

export async function addUserToWorkspace(workspaceId: string, userId: string, role = "member") {
  try {
    const { data, error } = await supabase
      .from("workspace_users")
      .insert([
        {
          workspace_id: workspaceId,
          user_id: userId,
          role,
        },
      ])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error adding user to workspace:", error)
    return null
  }
}

export async function removeUserFromWorkspace(workspaceId: string, userId: string) {
  try {
    const { error } = await supabase
      .from("workspace_users")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error removing user from workspace:", error)
    return false
  }
}
