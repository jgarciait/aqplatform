import { supabase } from "./supabase"
import { FileText, GitBranch, FolderOpen, Users } from "lucide-react"

// This is a simplified activity service that would normally fetch from a dedicated activity log table
// For now, we'll combine recent activities from different tables
export async function getRecentActivityForWorkspace(workspaceId: string) {
  try {
    // Get recent forms
    const { data: forms, error: formsError } = await supabase
      .from("forms")
      .select(`
        id,
        title,
        created_at,
        owner_id,
        profiles:owner_id (first_name, last_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (formsError) throw formsError

    // Get recent workflows
    const { data: workflows, error: workflowsError } = await supabase
      .from("workflows")
      .select(`
        id,
        name,
        updated_at,
        owner_id,
        profiles:owner_id (first_name, last_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(3)

    if (workflowsError) throw workflowsError

    // Get recent documents
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(`
        id,
        name,
        created_at,
        owner_id,
        profiles:owner_id (first_name, last_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (documentsError) throw documentsError

    // Get recent workspace users
    const { data: workspaceUsers, error: workspaceUsersError } = await supabase
      .from("workspace_users")
      .select(`
        id,
        created_at,
        user_id,
        profiles:user_id (first_name, last_name)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(3)

    if (workspaceUsersError) throw workspaceUsersError

    // Combine and format activities
    const activities = [
      ...(forms || []).map((form) => ({
        action: `New form created: ${form.title}`,
        user: `${form.profiles?.first_name || ""} ${form.profiles?.last_name || ""}`,
        time: formatTimeAgo(new Date(form.created_at)),
        icon: FileText,
        date: new Date(form.created_at),
      })),
      ...(workflows || []).map((workflow) => ({
        action: `Workflow updated: ${workflow.name}`,
        user: `${workflow.profiles?.first_name || ""} ${workflow.profiles?.last_name || ""}`,
        time: formatTimeAgo(new Date(workflow.updated_at)),
        icon: GitBranch,
        date: new Date(workflow.updated_at),
      })),
      ...(documents || []).map((document) => ({
        action: `Document uploaded: ${document.name}`,
        user: `${document.profiles?.first_name || ""} ${document.profiles?.last_name || ""}`,
        time: formatTimeAgo(new Date(document.created_at)),
        icon: FolderOpen,
        date: new Date(document.created_at),
      })),
      ...(workspaceUsers || []).map((workspaceUser) => ({
        action: `User added to workspace`,
        user: `${workspaceUser.profiles?.first_name || ""} ${workspaceUser.profiles?.last_name || ""}`,
        time: formatTimeAgo(new Date(workspaceUser.created_at)),
        icon: Users,
        date: new Date(workspaceUser.created_at),
      })),
    ]

    // Sort by date (newest first) and take the top 4
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4)
      .map(({ date, ...rest }) => rest) // Remove the date property used for sorting
  } catch (error) {
    console.error("Error fetching recent activity for workspace:", error)
    return []
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date) {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return `${diffSecs} seconds ago`
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

  return date.toLocaleDateString()
}
