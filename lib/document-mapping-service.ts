import { supabase } from "./supabase"
import type { Document, DocumentMapping, Json } from "./database.types"
import type { UniqueIdentifier } from "@dnd-kit/core"

// Define the structure for a document mapping element
export interface DocumentMappingElement {
  id: string
  type: string // "text", "signature", "date", "checkbox", etc.
  label: string
  position: { x: number; y: number } // Position on PDF page
  size: { width: number; height: number } // Size of the element
  page: number // PDF page number (0-indexed)
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
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    [key: string]: any
  }
}

export interface DocumentMappingProperties {
  label: string
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  inputType?: "text" | "email" | "password" | "url" | "tel"
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  [key: string]: any
}

/**
 * Saves a document mapping to the database.
 * If a mappingId is provided, it updates the existing mapping.
 * @param documentId The ID of the document to map.
 * @param elements The array of mapping elements to save.
 * @param mappingId Optional: The ID of the mapping to update. If not provided, a new mapping is created.
 * @returns The saved or updated document mapping object, or null if an error occurred.
 */
export async function saveDocumentMapping(
  documentId: string,
  elements: DocumentMappingElement[],
  mappingId?: string,
): Promise<DocumentMapping | null> {
  try {
    // Ensure all elements have proper labels and structure
    const enhancedElements = elements.map((el) => ({
      ...el,
      label: el.label || el.properties?.label || "Untitled Field",
      properties: {
        ...el.properties,
        label: el.properties?.label || el.label || "Untitled Field",
      },
    }))

    if (mappingId) {
      // Update existing mapping
      const { data, error } = await supabase
        .from("document_mappings")
        .update({
          elements_json: enhancedElements as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mappingId)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new mapping
      const { data, error } = await supabase
        .from("document_mappings")
        .insert({
          document_id: documentId,
          elements_json: enhancedElements as Json,
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error("Error saving document mapping:", error)
    return null
  }
}

/**
 * Loads a document mapping from the database.
 * @param documentId The ID of the document to load mappings for.
 * @returns The document mapping with its elements, or null if not found or an error occurred.
 */
export async function loadDocumentMapping(
  documentId: string,
): Promise<(DocumentMapping & { elements: DocumentMappingElement[] }) | null> {
  try {
    const { data: mappingData, error: mappingError } = await supabase
      .from("document_mappings")
      .select("*")
      .eq("document_id", documentId)
      .maybeSingle()  // Use maybeSingle() to handle no results gracefully

    if (mappingError) throw mappingError
    if (!mappingData) return null

    const elements: DocumentMappingElement[] = mappingData.elements_json as DocumentMappingElement[]

    return { ...mappingData, elements }
  } catch (error) {
    console.error("Error loading document mapping:", error)
    return null
  }
}

/**
 * Deletes a document mapping.
 * @param mappingId The ID of the mapping to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export async function deleteDocumentMapping(mappingId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("document_mappings").delete().eq("id", mappingId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting document mapping:", error)
    return false
  }
}

/**
 * Gets all documents with their mappings for a workspace.
 * @param workspaceId The ID of the workspace.
 * @returns Array of documents with their mappings.
 */
export async function getDocumentsWithMappingsForWorkspace(workspaceId: string): Promise<(Document & { mapping?: DocumentMapping })[]> {
  try {
    // First, get all documents for the workspace
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (documentsError) throw documentsError
    if (!documents || documents.length === 0) return []

    // Then, get all mappings for these documents
    const documentIds = documents.map((doc: Document) => doc.id)
    const { data: mappings, error: mappingsError } = await supabase
      .from("document_mappings")
      .select("*")
      .in("document_id", documentIds)

    if (mappingsError) {
      console.warn("Error fetching mappings:", mappingsError)
      // If mappings table doesn't exist yet, just return documents without mappings
      return documents.map((doc: Document) => ({ ...doc, mapping: null }))
    }

    // Combine documents with their mappings
    return documents.map((doc: Document) => {
      const mapping = mappings?.find((m: DocumentMapping) => m.document_id === doc.id) || null
      return { ...doc, mapping }
    })
  } catch (error) {
    console.error("Error fetching documents with mappings:", error)
    return []
  }
}

/**
 * Creates a form from a document mapping.
 * @param documentMapping The document mapping to convert to a form.
 * @param formTitle The title for the new form.
 * @param formDescription The description for the new form.
 * @param ownerId The ID of the user who owns the form.
 * @param workspaceId The ID of the workspace.
 * @returns The created form object, or null if an error occurred.
 */
export async function createFormFromDocumentMapping(
  documentMapping: DocumentMapping & { elements: DocumentMappingElement[] },
  formTitle: string,
  formDescription: string,
  ownerId: string,
  workspaceId: string,
): Promise<any | null> {
  try {
    // Convert document mapping elements to form elements
    const formElements = documentMapping.elements.map((element) => ({
      id: element.id,
      type: element.type,
      label: element.label,
      size: 1, // Default size
      properties: {
        ...element.properties,
        documentMapping: {
          position: element.position,
          size: element.size,
          page: element.page,
        },
      },
    }))

    // Create the form
    const { data: formData, error: formError } = await supabase
      .from("forms")
      .insert({
        title: formTitle,
        description: formDescription,
        owner_id: ownerId,
        workspace_id: workspaceId,
      })
      .select()
      .single()

    if (formError) throw formError

    // Insert form elements
    const elementsToInsert = formElements.map((el) => ({
      form_id: formData.id,
      elements_json: el as Json,
    }))

    const { error: insertError } = await supabase.from("form_elements").insert(elementsToInsert)

    if (insertError) throw insertError

    return formData
  } catch (error) {
    console.error("Error creating form from document mapping:", error)
    return null
  }
} 