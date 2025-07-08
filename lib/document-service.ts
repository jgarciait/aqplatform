import { supabase } from "./supabase"
import type { Document } from "./database.types"

export async function getDocumentsForWorkspace(workspaceId: string): Promise<Document[]> {
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

export async function getDocument(id: string): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching document:", error)
    return null
  }
}

export async function uploadDocument(document: Partial<Document>): Promise<Document | null> {
  try {
    // Ensure document has proper type for mapping documents
    const documentWithType = {
      ...document,
      document_type: document.document_type || 'mapping'
    }

    const { data, error } = await supabase.from("documents").insert([documentWithType]).select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error("Error uploading document:", error)
    return null
  }
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating document:", error)
    return null
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("documents").delete().eq("id", id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting document:", error)
    return false
  }
}

export async function uploadDocumentFile(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('mapping')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // For private buckets, we store the file path and generate signed URLs when needed
    return filePath
  } catch (error) {
    console.error('Error uploading file:', error)
    return null
  }
}

export async function getDocumentSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    console.log('🔗 Creating signed URL for path:', filePath, 'in bucket: mapping')
    
    const { data, error } = await supabase.storage
      .from('mapping')
      .createSignedUrl(filePath, expiresIn)

    console.log('📤 Supabase storage response:', { data, error })

    if (error) {
      console.error('❌ Supabase storage error:', error)
      throw error
    }
    
    console.log('✅ Successfully created signed URL:', data.signedUrl)
    return data.signedUrl
  } catch (error) {
    console.error('❌ Error creating signed URL:', error)
    return null
  }
}

export async function deleteDocumentFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('mapping')
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
