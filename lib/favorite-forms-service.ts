import { supabase } from "./supabase"

export async function getFavoriteForms(userId: string, workspaceId?: string): Promise<any[]> {
  try {
    let query = supabase
      .from("favorite_forms")
      .select(`
        *,
        forms (
          id,
          title,
          description,
          workspace_id
        )
      `)
      .eq("user_id", userId)
      .eq("favorite", true)

    if (workspaceId) {
      // Filter by workspace through the forms relation
      query = query.eq("forms.workspace_id", workspaceId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw error
    return data?.filter((item) => item.forms !== null) || []
  } catch (error) {
    console.error("Error fetching favorite forms:", error)
    return []
  }
}

export async function toggleFormFavorite(userId: string, formId: string): Promise<boolean> {
  try {
    // Check if favorite already exists
    const { data: existing, error: checkError } = await supabase
      .from("favorite_forms")
      .select("*")
      .eq("user_id", userId)
      .eq("form_id", formId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found"
      throw checkError
    }

    if (existing) {
      // Toggle the favorite status
      const { error: updateError } = await supabase
        .from("favorite_forms")
        .update({ favorite: !existing.favorite })
        .eq("id", existing.id)

      if (updateError) throw updateError
      return !existing.favorite
    } else {
      // Create new favorite
      const { error: insertError } = await supabase.from("favorite_forms").insert([
        {
          user_id: userId,
          form_id: formId,
          favorite: true,
        },
      ])

      if (insertError) throw insertError
      return true
    }
  } catch (error) {
    console.error("Error toggling form favorite:", error)
    return false
  }
}

export async function isFormFavorite(userId: string, formId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("favorite_forms")
      .select("favorite")
      .eq("user_id", userId)
      .eq("form_id", formId)
      .eq("favorite", true)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error checking if form is favorite:", error)
    return false
  }
}
