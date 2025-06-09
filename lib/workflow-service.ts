import { supabase } from "./supabase"

export async function getWorkflowsForWorkspace(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching workflows for workspace:", error)
    return []
  }
}

export async function createWorkflow(workflow: any) {
  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    // Add the owner_id to the workflow data
    const workflowData = {
      ...workflow,
      owner_id: user.id,
    }

    const { data, error } = await supabase.from("workflows").insert([workflowData]).select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error creating workflow:", error)
    throw error
  }
}

export async function updateWorkflow(id: string, updates: any) {
  try {
    const { data, error } = await supabase.from("workflows").update(updates).eq("id", id).select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error updating workflow:", error)
    return null
  }
}

export async function deleteWorkflow(id: string) {
  try {
    // Get the current user to ensure they can delete this workflow
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase.from("workflows").delete().eq("id", id).eq("owner_id", user.id) // Only allow deletion by owner

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting workflow:", error)
    return false
  }
}

export async function getWorkflowById(id: string) {
  try {
    const { data, error } = await supabase.from("workflows").select("*").eq("id", id).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching workflow:", error)
    return null
  }
}
