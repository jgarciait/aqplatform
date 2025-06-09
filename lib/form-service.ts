import { supabase } from "./supabase"
import type { Form, FormElementDB, Json } from "./database.types"
import type { UniqueIdentifier } from "@dnd-kit/core"

// Define the structure for a form element in our application
export interface FormElementData {
  id: UniqueIdentifier // Unique ID for DND-kit and React keys
  type: string // e.g., "single-line", "multiline", "section"
  label: string // Display label for the element
  placeholder?: string // Placeholder text for input fields
  size: 1 | 2 | 3 // Element width: 1 = 1/3, 2 = 2/3, 3 = full width
  // Add more properties as needed, e.g., required, options for dropdowns, min/max for numbers
  properties: {
    label: string
    placeholder?: string
    required?: boolean
    options?: { value: string; label: string }[]
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    inputType?: "text" | "email" | "password" | "url" | "tel"
    step?: number
    // Add other specific properties based on element type
    [key: string]: any // Allow for arbitrary additional properties
  }
}

export interface FormElementProperties {
  label: string
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  inputType?: "text" | "email" | "password" | "url" | "tel"
  step?: number
  [key: string]: any
}

/**
 * Saves a new form and its elements to the database.
 * If a formId is provided, it updates the existing form and its elements.
 * @param formId Optional: The ID of the form to update. If not provided, a new form is created.
 * @param title The title of the form.
 * @param description The description of the form.
 * @param ownerId The ID of the user who owns the form.
 * @param elements The array of form elements to save.
 * @param workspaceId Optional: The ID of the workspace this form belongs to.
 * @returns The saved or updated form object, or null if an error occurred.
 */
export async function saveForm(
  formId: string | null,
  title: string,
  description: string | null,
  ownerId: string,
  elements: FormElementData[],
  workspaceId: string | null = null,
): Promise<Form | null> {
  try {
    // Validate that workspaceId is provided
    if (!workspaceId) {
      throw new Error("Workspace ID is required to save a form")
    }

    let currentForm: Form | null = null

    if (formId) {
      // Update existing form
      const { data, error } = await supabase
        .from("forms")
        .update({
          title,
          description,
          updated_at: new Date().toISOString(),
          workspace_id: workspaceId,
        })
        .eq("id", formId)
        .select()
        .single()

      if (error) throw error
      currentForm = data
    } else {
      // Create new form
      const { data, error } = await supabase
        .from("forms")
        .insert({
          title,
          description,
          owner_id: ownerId,
          workspace_id: workspaceId,
        })
        .select()
        .single()

      if (error) throw error
      currentForm = data
    }

    if (!currentForm) {
      console.error("Form not found or created.")
      return null
    }

    // Delete existing elements for this form to replace them
    const { error: deleteError } = await supabase.from("form_elements").delete().eq("form_id", currentForm.id)

    if (deleteError) throw deleteError

    // Ensure all elements have proper labels and structure for future submissions
    const enhancedElements = elements.map((el) => ({
      ...el,
      // Ensure label exists either in properties or at root level
      label: el.label || el.properties?.label || "Untitled Field",
      properties: {
        ...el.properties,
        // Ensure label is in properties for consistency
        label: el.properties?.label || el.label || "Untitled Field",
      },
    }))

    // Insert new elements
    const elementsToInsert = enhancedElements.map((el) => ({
      form_id: currentForm!.id,
      elements_json: el as Json, // Cast FormElementData to Json
    }))

    const { error: insertError } = await supabase.from("form_elements").insert(elementsToInsert)

    if (insertError) throw insertError

    return currentForm
  } catch (error) {
    console.error("Error saving form:", error)
    return null
  }
}

/**
 * Loads a form and its elements from the database.
 * @param formId The ID of the form to load.
 * @returns The form object with its elements, or null if not found or an error occurred.
 */
export async function loadForm(formId: string): Promise<(Form & { elements: FormElementData[] }) | null> {
  try {
    const { data: formData, error: formError } = await supabase.from("forms").select("*").eq("id", formId).single()

    if (formError) throw formError
    if (!formData) return null

    const { data: elementsData, error: elementsError } = await supabase
      .from("form_elements")
      .select("elements_json")
      .eq("form_id", formId)
      .order("created_at", { ascending: true }) // Order by creation to maintain original order

    if (elementsError) throw elementsError

    const elements: FormElementData[] = (elementsData || []).map((el: FormElementDB) => {
      const element = el.elements_json as FormElementData
      // Ensure size property exists for backward compatibility
      if (!element.size) {
        element.size = 1
      }
      return element
    })

    return { ...formData, elements }
  } catch (error) {
    console.error("Error loading form:", error)
    return null
  }
}

/**
 * Deletes a form and optionally its associated submissions.
 * @param formId The ID of the form to delete.
 * @param deleteSubmissions Whether to also delete associated submissions.
 * @returns True if deletion was successful, false otherwise.
 */
export async function deleteForm(formId: string, deleteSubmissions = false): Promise<boolean> {
  try {
    if (deleteSubmissions) {
      // Delete associated submissions permanently
      const { error: submissionsError } = await supabase.from("form_submissions").delete().eq("form_id", formId)

      if (submissionsError) throw submissionsError
    } else {
      // Check if there are any non-archived submissions that would prevent deletion
      const { data: activeSubmissions, error: checkError } = await supabase
        .from("form_submissions")
        .select("id")
        .eq("form_id", formId)
        .is("archive_metadata", null)

      if (checkError) throw checkError

      if (activeSubmissions && activeSubmissions.length > 0) {
        throw new Error("Cannot delete form: there are still active submissions. Please archive them first.")
      }
    }

    // Delete associated elements
    const { error: elementsError } = await supabase.from("form_elements").delete().eq("form_id", formId)

    if (elementsError) throw elementsError

    // Delete the form itself
    const { error: formError } = await supabase.from("forms").delete().eq("id", formId)

    if (formError) throw formError

    return true
  } catch (error) {
    console.error("Error deleting form:", error)
    return false
  }
}

/**
 * Fetches all forms owned by a specific user.
 * @param ownerId The ID of the user whose forms to fetch.
 * @returns An array of forms, or an empty array if none found or an error occurred.
 */
export async function getFormsForUser(ownerId: string): Promise<Form[]> {
  try {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching forms for user:", error)
    return []
  }
}

/**
 * Fetches all forms within a specific workspace.
 * @param workspaceId The ID of the workspace whose forms to fetch.
 * @returns An array of forms, or an empty array if none found or an error occurred.
 */
export async function getFormsForWorkspace(workspaceId: string): Promise<Form[]> {
  try {
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching forms for workspace:", error)
    return []
  }
}
