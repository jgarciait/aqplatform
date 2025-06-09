import { supabase } from "./supabase"

export interface Group {
  id: string
  name: string
  description: string | null
  workspace_id: string
  group_type: "sender" | "requester" | "approver"
  created_at: string
  created_by?: string
  member_count?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  added_at: string
  user?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    position: string | null
  }
}

export interface CreateGroupData {
  name: string
  description: string | null
  workspace_id: string
  group_type: "sender" | "requester" | "approver"
}

export interface UpdateGroupData {
  name?: string
  description?: string | null
}

export async function getGroupsForWorkspace(workspaceId: string): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from("groups")
      .select(`
        *,
        group_members(count)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((group) => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching groups:", error)
    throw error
  }
}

export async function createGroup(groupData: CreateGroupData): Promise<Group> {
  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("groups")
      .insert([
        {
          ...groupData,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

export async function updateGroup(groupId: string, updateData: UpdateGroupData): Promise<Group> {
  try {
    const { data, error } = await supabase.from("groups").update(updateData).eq("id", groupId).select().single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating group:", error)
    throw error
  }
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  try {
    // First delete all group members
    await supabase.from("group_members").delete().eq("group_id", groupId)

    // Then delete the group
    const { error } = await supabase.from("groups").delete().eq("id", groupId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting group:", error)
    return false
  }
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    // First get group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("added_at", { ascending: false })

    if (membersError) throw membersError

    if (!members || members.length === 0) {
      return []
    }

    const userIds = members.map((m) => m.user_id)

    // Then get profiles for those users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, position")
      .in("id", userIds)

    if (profilesError) throw profilesError

    // Combine the data
    return members.map((member) => ({
      ...member,
      user: profiles?.find((p) => p.id === member.user_id) || null,
    }))
  } catch (error) {
    console.error("Error fetching group members:", error)
    return []
  }
}

export async function addUserToGroup(groupId: string, userId: string): Promise<GroupMember> {
  try {
    // Get the current user for added_by field if it exists
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    const insertData: any = {
      group_id: groupId,
      user_id: userId,
    }

    // Add added_by field if user is authenticated (in case the table has this field)
    if (!userError && user) {
      insertData.added_by = user.id
    }

    const { data, error } = await supabase.from("group_members").insert([insertData]).select().single()

    if (error) throw error

    // Get the user profile separately
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, position")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    return {
      ...data,
      user: profile,
    }
  } catch (error) {
    console.error("Error adding user to group:", error)
    throw error
  }
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error removing user from group:", error)
    return false
  }
}

export async function getUserGroups(userId: string, workspaceId: string): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        groups!inner(*)
      `)
      .eq("user_id", userId)
      .eq("groups.workspace_id", workspaceId)

    if (error) throw error

    return data?.map((member) => member.groups) || []
  } catch (error) {
    console.error("Error fetching user groups:", error)
    throw error
  }
}

export async function getGroupsByType(
  workspaceId: string,
  groupType: "sender" | "requester" | "approver",
): Promise<Group[]> {
  try {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("group_type", groupType)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error fetching ${groupType} groups:`, error)
    return []
  }
}

export async function getUserWorkspaceRole(userId: string, workspaceId: string): Promise<string | null> {
  try {
    // Get user's groups in this workspace
    const { data: userGroups, error } = await supabase
      .from("group_members")
      .select(`
        groups!inner(group_type)
      `)
      .eq("user_id", userId)
      .eq("groups.workspace_id", workspaceId)

    if (error) throw error

    // Determine highest privilege level
    const groupTypes = userGroups?.map((ug) => ug.groups.group_type) || []

    if (groupTypes.includes("approver")) return "approver"
    if (groupTypes.includes("requester")) return "requester"
    if (groupTypes.includes("sender")) return "sender"

    return null
  } catch (error) {
    console.error("Error getting user workspace role:", error)
    return null
  }
}

export async function ensureUserWorkspaceAccess(
  userId: string,
  workspaceId: string,
  role = "member",
): Promise<boolean> {
  try {
    // Check if user already has workspace access
    const { data: existingAccess, error: checkError } = await supabase
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .single()

    // If user doesn't have access, add them
    if (checkError && checkError.code === "PGRST116") {
      const { error: addError } = await supabase.from("workspace_users").insert([
        {
          workspace_id: workspaceId,
          user_id: userId,
          role: role,
        },
      ])

      if (addError) {
        console.error("Error adding user to workspace:", addError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error ensuring workspace access:", error)
    return false
  }
}
