export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          logo_url: string | null
          created_at: string
          updated_at: string
          type: "sender" | "recipient" | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          type?: "sender" | "recipient" | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string
          type?: "sender" | "recipient" | null
        }
      }
      workspace_users: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: string
          is_favorite: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: string
          is_favorite?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: string
          is_favorite?: boolean | null
          created_at?: string
        }
      }
      workspace_visits: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          visited_at?: string
        }
      }
      // New tables for forms and form elements
      forms: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
          workspace_id?: string | null
        }
      }
      form_elements: {
        Row: {
          id: string
          form_id: string
          elements_json: Json // Use Json type for jsonb
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          elements_json: Json // Use Json type for jsonb
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          elements_json?: Json // Use Json type for jsonb
          created_at?: string
          updated_at?: string
        }
      }
      // New table for form submissions
      form_submissions: {
        Row: {
          id: string
          form_id: string
          workspace_id: string
          submitted_by: string
          submission_data: Json
          created_at: string
          updated_at: string
          status: string
        }
        Insert: {
          id?: string
          form_id: string
          workspace_id: string
          submitted_by: string
          submission_data: Json
          created_at?: string
          updated_at?: string
          status?: string
        }
        Update: {
          id?: string
          form_id?: string
          workspace_id?: string
          submitted_by?: string
          submission_data?: Json
          created_at?: string
          updated_at?: string
          status?: string
        }
      }
      // New table for favorite forms
      favorite_forms: {
        Row: {
          id: string
          user_id: string
          form_id: string
          favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          form_id: string
          favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          form_id?: string
          favorite?: boolean
          created_at?: string
        }
      }
      // New tables for groups system
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          workspace_id: string
          group_type: "sender" | "requester" | "approver"
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          workspace_id: string
          group_type: "sender" | "requester" | "approver"
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          workspace_id?: string
          group_type?: "sender" | "requester" | "approver"
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          added_by: string
          added_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          added_by?: string
          added_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          added_by?: string
          added_at?: string
        }
      }
      workflow_permissions: {
        Row: {
          id: string
          workflow_id: string
          permission_type: "requester" | "approver"
          assignment_type: "individual" | "group" | "all_non_approvers"
          target_id: string | null
          level_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          permission_type: "requester" | "approver"
          assignment_type: "individual" | "group" | "all_non_approvers"
          target_id?: string | null
          level_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          permission_type?: "requester" | "approver"
          assignment_type?: "individual" | "group" | "all_non_approvers"
          target_id?: string | null
          level_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Documents table
      documents: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          name: string
          description: string | null
          file_url: string | null
          document_type: "pdf" | "image" | "template" | "form" | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          owner_id: string
          name: string
          description?: string | null
          file_url?: string | null
          document_type?: "pdf" | "image" | "template" | "form" | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          owner_id?: string
          name?: string
          description?: string | null
          file_url?: string | null
          document_type?: "pdf" | "image" | "template" | "form" | null
          created_at?: string
          updated_at?: string
        }
      }
      // Document mappings table
      document_mappings: {
        Row: {
          id: string
          document_id: string
          elements_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          elements_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          elements_json?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper type for JSONB column
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Extend existing types for convenience
export type Form = Database["public"]["Tables"]["forms"]["Row"]
export type FormElementDB = Database["public"]["Tables"]["form_elements"]["Row"]
export type FormSubmission = Database["public"]["Tables"]["form_submissions"]["Row"]
export type FavoriteForm = Database["public"]["Tables"]["favorite_forms"]["Row"]
export type WorkspaceType = "sender" | "recipient" | null
export type Group = Database["public"]["Tables"]["groups"]["Row"]
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"]
export type WorkflowPermission = Database["public"]["Tables"]["workflow_permissions"]["Row"]
export type Document = Database["public"]["Tables"]["documents"]["Row"]
export type DocumentMapping = Database["public"]["Tables"]["document_mappings"]["Row"]
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"]
