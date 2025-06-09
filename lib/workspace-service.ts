import { supabase, type Workspace } from "./supabase"

export async function getWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from("workspaces")
    .select(`
      *,
      workspace_users!inner(user_id)
    `)
    .eq("workspace_users.user_id", userId)

  if (error) {
    console.error("Error fetching workspaces:", error)
    return []
  }

  return data as Workspace[]
}

export async function getFavoriteWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from("workspace_users")
    .select(`
      workspaces(*)
    `)
    .eq("user_id", userId)
    .eq("is_favorite", true)

  if (error) {
    console.error("Error fetching favorite workspaces:", error)
    return []
  }

  return (data?.map((item) => item.workspaces) as Workspace[]) || []
}

export async function getRecentWorkspaces(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from("workspace_visits")
    .select(`
      workspace_id,
      workspaces(*)
    `)
    .eq("user_id", userId)
    .order("visited_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent workspaces:", error)
    return []
  }

  // Filter out any null or undefined workspaces (those that have been deleted)
  return (data?.map((item) => item.workspaces).filter((workspace) => workspace !== null) as Workspace[]) || []
}

export async function createWorkspace(workspace: Partial<Workspace>, userId: string) {
  // First create the workspace
  const { data, error } = await supabase
    .from("workspaces")
    .insert([
      {
        name: workspace.name,
        description: workspace.description,
        owner_id: userId,
        logo_url: workspace.logo_url,
        type: workspace.type || "sender", // Default to sender if not specified
      },
    ])
    .select()

  if (error || !data) {
    console.error("Error creating workspace:", error)
    return null
  }

  const newWorkspace = data[0]

  // Then add the creator as an owner
  const { error: userError } = await supabase.from("workspace_users").insert([
    {
      workspace_id: newWorkspace.id,
      user_id: userId,
      role: "owner",
    },
  ])

  if (userError) {
    console.error("Error adding user to workspace:", userError)
  }

  return newWorkspace
}

export async function toggleFavorite(workspaceId: string, userId: string, isFavorite: boolean) {
  const { error } = await supabase
    .from("workspace_users")
    .update({ is_favorite: isFavorite })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error toggling favorite:", error)
    return false
  }

  return true
}

export async function deleteWorkspace(workspaceId: string) {
  try {
    // First, delete all forms associated with this workspace
    const { error: formsDeleteError } = await supabase.from("forms").delete().eq("workspace_id", workspaceId)

    if (formsDeleteError) {
      console.error("Error deleting workspace forms:", formsDeleteError)
      return false
    }

    // Then, delete related entries in workspace_users
    const { error: userDeleteError } = await supabase.from("workspace_users").delete().eq("workspace_id", workspaceId)

    if (userDeleteError) {
      console.error("Error deleting workspace users:", userDeleteError)
      return false
    }

    // Finally, delete the workspace itself
    const { error } = await supabase.from("workspaces").delete().eq("id", workspaceId)

    if (error) {
      console.error("Error deleting workspace:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting workspace:", error)
    return false
  }
}
