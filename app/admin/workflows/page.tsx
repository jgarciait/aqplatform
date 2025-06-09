"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GitBranch, Plus, Play, Settings, Trash2, Edit, AlertCircle, Users } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { useAuth } from "@/contexts/auth-context"
import { getFormsForWorkspace } from "@/lib/form-service"
import { getWorkflowsForWorkspace, createWorkflow, deleteWorkflow } from "@/lib/workflow-service"
import { WorkflowBuilder } from "@/components/workflow-builder"
import { GroupsManagement } from "@/components/groups-management"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Workflow {
  id: string
  name: string
  description: string
  form_id: string | null
  form_title?: string
  workflow_data: any
  is_active: boolean
  owner_id: string
  created_at: string
  updated_at: string
}

export default function WorkflowsPage() {
  const { selectedWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGroupsManagementOpen, setIsGroupsManagementOpen] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState("")
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkflowsAndForms()
    }
  }, [selectedWorkspace])

  const loadWorkflowsAndForms = async () => {
    if (!selectedWorkspace) return

    setIsLoading(true)
    setError(null)
    try {
      const [workflowsData, formsData] = await Promise.all([
        getWorkflowsForWorkspace(selectedWorkspace.id),
        getFormsForWorkspace(selectedWorkspace.id),
      ])

      // Enhance workflows with form titles
      const enhancedWorkflows = workflowsData.map((workflow) => ({
        ...workflow,
        form_title: workflow.form_id
          ? formsData.find((form) => form.id === workflow.form_id)?.title || "Unknown Form"
          : "No form selected",
      }))

      setWorkflows(enhancedWorkflows)
      setForms(formsData)
    } catch (error) {
      console.error("Error loading workflows and forms:", error)
      setError("Failed to load workflows. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim() || !selectedWorkspace || !user) return

    setError(null)
    try {
      const newWorkflow = await createWorkflow({
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim(),
        workspace_id: selectedWorkspace.id,
        workflow_data: {
          nodes: [],
          connections: [],
        },
        is_active: false,
      })

      if (newWorkflow) {
        setWorkflows((prev) => [newWorkflow, ...prev])
        setSelectedWorkflow(newWorkflow)
        setIsBuilderOpen(true)
        setIsCreateDialogOpen(false)
        setNewWorkflowName("")
        setNewWorkflowDescription("")
      }
    } catch (error) {
      console.error("Error creating workflow:", error)
      setError("Failed to create workflow. Please make sure you're logged in and try again.")
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return

    setError(null)
    try {
      const success = await deleteWorkflow(workflowId)
      if (success) {
        setWorkflows((prev) => prev.filter((w) => w.id !== workflowId))
      } else {
        setError("Failed to delete workflow. You can only delete workflows you created.")
      }
    } catch (error) {
      console.error("Error deleting workflow:", error)
      setError("Failed to delete workflow. Please try again.")
    }
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsBuilderOpen(true)
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to manage workflows.</p>
        </div>
      </div>
    )
  }

  if (!selectedWorkspace) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workspace selected</h3>
          <p className="text-gray-500">Please select a workspace to manage workflows.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Workflows
          </h1>
          <p className="text-gray-600 mt-2">Design and automate your form approval processes.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setIsGroupsManagementOpen(true)}>
            <Users className="w-4 h-4 mr-2" />
            Manage Groups
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#042841" }}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Workflow
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading workflows...</p>
            </div>
          </CardContent>
        </Card>
      ) : workflows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: "#001623" }}>
              <GitBranch className="w-5 h-5 mr-2" />
              Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
              <p className="text-gray-500 mb-4">Start automating your form approval processes with workflows.</p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setIsGroupsManagementOpen(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Setup Groups First
                </Button>
                <Button
                  className="text-white"
                  style={{ backgroundColor: "#042841" }}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" style={{ color: "#001623" }}>
                      {workflow.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Form: {workflow.form_title}</p>
                    {workflow.owner_id === user.id && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${workflow.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                    <span className="text-xs text-gray-500">{workflow.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workflow.description || "No description provided"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditWorkflow(workflow)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {workflow.owner_id === user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="text-white"
                    style={{ backgroundColor: workflow.is_active ? "#059669" : "#042841" }}
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    {workflow.is_active ? (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Running
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description (Optional)</Label>
              <Textarea
                id="workflow-description"
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does"
                rows={3}
              />
            </div>
            <div className="text-sm text-gray-500">
              You'll be able to select a form and configure the workflow steps after creation.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={!newWorkflowName.trim()}
              style={{ backgroundColor: "#042841" }}
            >
              Create & Configure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Groups Management */}
      <GroupsManagement isOpen={isGroupsManagementOpen} onClose={() => setIsGroupsManagementOpen(false)} />

      {/* Workflow Builder */}
      {isBuilderOpen && selectedWorkflow && (
        <WorkflowBuilder
          workflow={selectedWorkflow}
          forms={forms}
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false)
            setSelectedWorkflow(null)
            loadWorkflowsAndForms() // Refresh the list
          }}
          onSave={(updatedWorkflow) => {
            setWorkflows((prev) => prev.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w)))
          }}
        />
      )}
    </div>
  )
}
