import { supabase } from "./supabase"
import type { FormSubmission, Json } from "./database.types"

export async function createFormSubmission(
  formId: string,
  workspaceId: string,
  userId: string,
  submissionData: any,
): Promise<FormSubmission | null> {
  try {
    // First, get the form structure to store with the submission
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .select(`
        title,
        description,
        form_elements (
          elements_json
        )
      `)
      .eq("id", formId)
      .single()

    if (formError) {
      console.warn("Could not fetch form structure for submission:", formError)
    }

    // Extract ALL form elements and ensure they have labels
    const formElements = formData?.form_elements?.map((el) => el.elements_json) || []

    // Create enhanced submission data that includes form structure
    const enhancedSubmissionData = {
      ...submissionData,
      _form_metadata: {
        formId,
        formTitle: formData?.title || "Unknown Form",
        formDescription: formData?.description || "",
        formElements: formElements, // Store the complete form structure
        submittedAt: new Date().toISOString(),
      },
    }

    const { data, error } = await supabase
      .from("form_submissions")
      .insert([
        {
          form_id: formId,
          workspace_id: workspaceId,
          submitted_by: userId,
          submission_data: enhancedSubmissionData as Json,
          status: "submitted",
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating form submission:", error)
    return null
  }
}

export async function getFormSubmissionsForWorkspace(workspaceId: string): Promise<FormSubmission[]> {
  try {
    const { data, error } = await supabase
      .from("form_submissions")
      .select(`
        *,
        forms (
          id,
          title,
          description,
          form_elements (
            elements_json
          )
        )
      `)
      .eq("workspace_id", workspaceId)
      .eq("status", "submitted") // Only get active submissions
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching form submissions for workspace:", error)
    return []
  }
}

export async function getFormSubmissionsForForm(formId: string): Promise<FormSubmission[]> {
  try {
    const { data, error } = await supabase
      .from("form_submissions")
      .select(`
        *,
        forms (
          id,
          title,
          description,
          form_elements (
            elements_json
          )
        )
      `)
      .eq("form_id", formId)
      .eq("status", "submitted") // Only get active submissions
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching form submissions for form:", error)
    return []
  }
}

export async function getArchivedSubmissions(): Promise<FormSubmission[]> {
  try {
    const { data, error } = await supabase
      .from("form_submissions")
      .select(`
        *,
        forms (
          id,
          title,
          description
        )
      `)
      .eq("status", "archived")
      .order("updated_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching archived submissions:", error)
    return []
  }
}

export async function archiveSubmissionsForForm(formId: string, reason: string): Promise<boolean> {
  try {
    // Get all submissions for this form first
    const { data: submissions, error: fetchError } = await supabase
      .from("form_submissions")
      .select("id, submission_data")
      .eq("form_id", formId)
      .eq("status", "submitted")

    if (fetchError) throw fetchError

    if (!submissions || submissions.length === 0) {
      console.log("No submissions found to archive for form:", formId)
      return true
    }

    // Update each submission individually to preserve original data and add archive info
    for (const submission of submissions) {
      const submissionData = submission.submission_data as any

      // Get form metadata from the submission itself (if available) or try to fetch it
      let formMetadata = submissionData._form_metadata

      if (!formMetadata) {
        // Fallback: try to get form data if not stored in submission
        const { data: formData, error: formError } = await supabase
          .from("forms")
          .select(`
            title, 
            description,
            form_elements (
              elements_json
            )
          `)
          .eq("id", formId)
          .single()

        if (!formError && formData) {
          formMetadata = {
            formId,
            formTitle: formData.title,
            formDescription: formData.description,
            formElements: formData.form_elements?.map((el) => el.elements_json) || [],
          }
        }
      }

      // Create archive metadata
      const archiveInfo = {
        reason,
        archivedAt: new Date().toISOString(),
        formTitle: formMetadata?.formTitle || "Unknown Form",
        formDescription: formMetadata?.formDescription || "",
        formElements: formMetadata?.formElements || [],
      }

      // Remove form metadata and add archive metadata
      const updatedData = { ...submissionData }
      delete updatedData._form_metadata
      updatedData._archive_metadata = archiveInfo

      const { error: updateError } = await supabase
        .from("form_submissions")
        .update({
          status: "archived",
          updated_at: new Date().toISOString(),
          submission_data: updatedData as Json,
          form_id: null, // Remove form reference to avoid FK constraint
        })
        .eq("id", submission.id)

      if (updateError) {
        console.error("Error updating submission:", submission.id, updateError)
        throw updateError
      }
    }

    console.log(`Successfully archived ${submissions.length} submissions for form:`, formId)
    return true
  } catch (error) {
    console.error("Error archiving submissions for form:", error)
    return false
  }
}

export async function updateSubmissionStatus(submissionId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("form_submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", submissionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error updating submission status:", error)
    return false
  }
}

export async function deleteSubmission(submissionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("form_submissions").delete().eq("id", submissionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting submission:", error)
    return false
  }
}

export async function getFormDetails(formId: string) {
  try {
    const { data, error } = await supabase.from("forms").select("title, description").eq("id", formId).single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching form details:", error)
    return null
  }
}

export async function restoreArchivedSubmission(submissionId: string): Promise<boolean> {
  try {
    // Get the current submission data
    const { data: submission, error: fetchError } = await supabase
      .from("form_submissions")
      .select("submission_data")
      .eq("id", submissionId)
      .single()

    if (fetchError) throw fetchError

    // Remove archive metadata from submission data
    const submissionData = submission.submission_data as any
    if (submissionData && submissionData._archive_metadata) {
      delete submissionData._archive_metadata
    }

    const { error } = await supabase
      .from("form_submissions")
      .update({
        status: "submitted",
        updated_at: new Date().toISOString(),
        submission_data: submissionData as Json,
      })
      .eq("id", submissionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error restoring archived submission:", error)
    return false
  }
}
