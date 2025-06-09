"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { createWorkspace } from "@/lib/workspace-service"
import type { Workspace } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkspaceCreated: (workspace: Workspace) => void
}

export function CreateWorkspaceDialog({ open, onOpenChange, onWorkspaceCreated }: CreateWorkspaceDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"sender" | "recipient">("sender")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to create a workspace")
      return
    }

    if (!name.trim()) {
      setError("Workspace name is required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newWorkspace = await createWorkspace(
        {
          name,
          description: description || undefined,
          owner_id: user.id,
          type,
        },
        user.id,
      )

      if (newWorkspace) {
        onWorkspaceCreated(newWorkspace)
        onOpenChange(false)
        setName("")
        setDescription("")
        setType("sender")
      } else {
        setError("Failed to create workspace")
      }
    } catch (err) {
      console.error("Error creating workspace:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your forms, workflows, and documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this workspace"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Workspace Type</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as "sender" | "recipient")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sender" id="sender" />
                  <Label htmlFor="sender" className="cursor-pointer">
                    Sender - Create and send forms
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recipient" id="recipient" />
                  <Label htmlFor="recipient" className="cursor-pointer">
                    Recipient - View form submissions
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#04293f] hover:bg-[#04293f]/90 text-white">
              {isLoading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
