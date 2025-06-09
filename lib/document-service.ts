import { supabase } from "./supabase"

export async function getDocumentsForWorkspace(workspaceId: string) {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching documents for workspace:", error)
    return []
  }
}

export async function uploadDocument(document: any) {
  try {
    const { data, error } = await supabase.from("documents").insert([document]).select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error uploading document:", error)
    return null
  }
}

export async function deleteDocument(id: string) {
  try {
    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting document:", error)
    return false
  }
}
