"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getWorkspaces } from "@/lib/workspace-service"

interface WorkspaceContextType {
  selectedWorkspace: any | null
  setSelectedWorkspace: (workspace: any) => void
  workspaces: any[]
  setWorkspaces: (workspaces: any[]) => void
  isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadWorkspaces = async () => {
      if (user?.id) {
        setIsLoading(true)
        const userWorkspaces = await getWorkspaces(user.id)
        setWorkspaces(userWorkspaces)

        // Auto-select first workspace if none selected
        if (userWorkspaces.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(userWorkspaces[0])
        }
        setIsLoading(false)
      }
    }
    loadWorkspaces()
  }, [user?.id])

  return (
    <WorkspaceContext.Provider
      value={{
        selectedWorkspace,
        setSelectedWorkspace,
        workspaces,
        setWorkspaces,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
