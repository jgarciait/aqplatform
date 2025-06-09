"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Save,
  Play,
  Pause,
  Trash2,
  GitBranch,
  Users,
  XCircle,
  ArrowDown,
  Settings,
  AlertTriangle,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { updateWorkflow } from "@/lib/workflow-service"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface WorkflowNode {
  id: string
  type: "start" | "form_trigger" | "approval_level" | "condition" | "decision" | "end" | "action" | "end_flow"
  title: string
  data: any
  position: { x: number; y: number }
  parentId?: string
  path?: string // For tracking which decision path this node belongs to
}

interface WorkflowBuilderProps {
  workflow: any
  forms: any[]
  isOpen: boolean
  onClose: () => void
  onSave: (workflow: any) => void
}

const FLOW_OPTIONS = [
  {
    category: "Approval",
    items: [
      {
        id: "approval_level",
        title: "Add Approval Level",
        icon: Users,
        description: "Add a level of approval with assigned users",
      },
      {
        id: "decision",
        title: "Add Decision Point",
        icon: GitBranch,
        description: "Add custom approval/rejection buttons",
      },
    ],
  },
  {
    category: "Conditions",
    items: [
      {
        id: "field_condition",
        title: "Field Value Condition",
        icon: AlertTriangle,
        description: "Branch based on form field values",
      },
      {
        id: "user_condition",
        title: "User Role Condition",
        icon: Users,
        description: "Branch based on user roles or permissions",
      },
    ],
  },
  {
    category: "Actions",
    items: [
      {
        id: "notification",
        title: "Send Notification",
        icon: FileText,
        description: "Send email or system notification",
      },
      { id: "update_status", title: "Update Status", icon: Settings, description: "Change submission status" },
      { id: "end_flow", title: "End Workflow", icon: XCircle, description: "Complete the workflow" },
    ],
  },
]

export function WorkflowBuilder({ workflow, forms, isOpen, onClose, onSave }: WorkflowBuilderProps) {
  const [selectedForm, setSelectedForm] = useState<string>(workflow.form_id || "")
  const [workflowName, setWorkflowName] = useState(workflow.name || "")
  const [workflowDescription, setWorkflowDescription] = useState(workflow.description || "")
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [isActive, setIsActive] = useState(workflow.is_active || false)
  const [showFlowOptions, setShowFlowOptions] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [flowSearchQuery, setFlowSearchQuery] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLevelConfig, setShowLevelConfig] = useState(false)
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1)
  const [currentTimeoutHours, setCurrentTimeoutHours] = useState(24)
  const [showActionConfig, setShowActionConfig] = useState(false)
  const [currentActionPath, setCurrentActionPath] = useState<string | null>(null)

  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [isProcessingAccess, setIsProcessingAccess] = useState(false)

  const [showDecisionConfig, setShowDecisionConfig] = useState(false)
  const [currentDecisionButtons, setCurrentDecisionButtons] = useState<any[]>([])
  const [newButtonLabel, setNewButtonLabel] = useState("")
  const [newButtonValue, setNewButtonValue] = useState("")
  const [newButtonColor, setNewButtonColor] = useState("blue")

  const [viewMode, setViewMode] = useState<"visual" | "list">("visual")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragMode, setIsDragMode] = useState(false)

  // Add state for group selection
  const [availableGroups, setAvailableGroups] = useState<any[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  // Add useEffect to fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      if (!workflow.workspace_id) return

      try {
        const { data, error } = await supabase
          .from("groups")
          .select("id, name, group_type, description")
          .eq("workspace_id", workflow.workspace_id)
          .eq("group_type", "approver")
          .order("name", { ascending: true })

        if (error) throw error
        setAvailableGroups(data || [])
      } catch (error) {
        console.error("Error fetching groups:", error)
        setAvailableGroups([])
      }
    }
    fetchGroups()
  }, [workflow.workspace_id])

  // Add useEffect to fetch real users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, position, created_at")
          .order("first_name", { ascending: true })

        if (error) throw error
        setAvailableUsers(data || [])
      } catch (error) {
        console.error("Error fetching users:", error)
        setAvailableUsers([])
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    // Initialize with start node if no nodes exist
    if (workflow.workflow_data?.nodes?.length > 0) {
      setNodes(workflow.workflow_data.nodes)
    } else {
      setNodes([
        {
          id: "start",
          type: "start",
          title: "Form Submitted",
          data: {},
          position: { x: 400, y: 50 },
        },
      ])
    }
  }, [workflow])

  // Track changes to detect unsaved changes
  useEffect(() => {
    const hasChanges =
      workflowName !== (workflow.name || "") ||
      workflowDescription !== (workflow.description || "") ||
      selectedForm !== (workflow.form_id || "") ||
      isActive !== (workflow.is_active || false) ||
      JSON.stringify(nodes) !== JSON.stringify(workflow.workflow_data?.nodes || [])

    setHasUnsavedChanges(hasChanges)
  }, [workflowName, workflowDescription, selectedForm, isActive, nodes, workflow])

  const handleSave = async () => {
    if (!selectedForm) {
      alert("Please select a form for this workflow")
      return
    }

    setIsSaving(true)
    try {
      const updatedWorkflow = await updateWorkflow(workflow.id, {
        name: workflowName,
        description: workflowDescription,
        form_id: selectedForm,
        workflow_data: { nodes, connections: [] },
        is_active: isActive,
      })

      if (updatedWorkflow) {
        onSave(updatedWorkflow)
        setHasUnsavedChanges(false)
        alert("Workflow saved successfully!")
      }
    } catch (error) {
      console.error("Error saving workflow:", error)
      alert("Error saving workflow")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndClose = async () => {
    await handleSave()
    if (!isSaving) {
      onClose()
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true)
    } else {
      onClose()
    }
  }

  const addFlowNode = (nodeType: string) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType as any,
      title: getNodeTitle(nodeType),
      data: getDefaultNodeData(nodeType),
      position: { x: 400, y: nodes.length * 150 + 200 },
    }

    setNodes((prev) => [...prev, newNode])
    setShowFlowOptions(false)
  }

  const addActionNode = (parentId: string, path: string) => {
    const newNode: WorkflowNode = {
      id: `action_${Date.now()}`,
      type: "action",
      title: "Action",
      data: {
        actionType: "notification",
        config: {},
      },
      position: { x: 0, y: 0 }, // Position will be calculated during rendering
      parentId,
      path,
    }

    setNodes((prev) => [...prev, newNode])
  }

  const getNodeTitle = (nodeType: string): string => {
    const option = FLOW_OPTIONS.flatMap((cat) => cat.items).find((item) => item.id === nodeType)
    return option?.title || nodeType
  }

  const getDefaultNodeData = (nodeType: string): any => {
    switch (nodeType) {
      case "approval_level":
        return {
          level: 1,
          approvers: [],
          requireAll: false,
          timeoutHours: 24,
        }
      case "decision":
        return {
          buttons: [
            { id: "approve", label: "Approve", value: "approved", color: "green" },
            { id: "reject", label: "Reject", value: "rejected", color: "red" },
          ],
          paths: {
            approved: [],
            rejected: [],
          },
        }
      case "field_condition":
        return {
          fieldId: "",
          operator: "equals",
          value: "",
          paths: {
            true: [],
            false: [],
          },
        }
      case "end":
        return {
          message: "Workflow completed",
        }
      default:
        return {}
    }
  }

  const removeNode = (nodeId: string) => {
    if (nodeId === "start") return // Can't remove start node

    // Remove the node and any child nodes
    setNodes((prev) => {
      // First, find the node to be removed
      const nodeToRemove = prev.find((node) => node.id === nodeId)
      if (!nodeToRemove) return prev

      // If it's a decision or condition node, we need to remove all nodes in its paths
      if (nodeToRemove.type === "decision" || nodeToRemove.type === "field_condition") {
        // Get all nodes that have this node as parent
        const childNodes = prev.filter((node) => node.parentId === nodeId)
        const childNodeIds = childNodes.map((node) => node.id)

        // Remove the node and all its children
        return prev.filter((node) => node.id !== nodeId && !childNodeIds.includes(node.id))
      }

      // For regular nodes, just remove the node itself
      return prev.filter((node) => node.id !== nodeId)
    })
  }

  const ensureWorkspaceAccess = async (userId: string, workspaceId: string, level: number) => {
    try {
      // Check if user already has access to this workspace
      const { data: existingAccess, error: checkError } = await supabase
        .from("workspace_users")
        .select("id, role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" error
        console.error("Error checking workspace access:", checkError)
        return false
      }

      // If user doesn't have access, add them with "approver" role
      if (!existingAccess) {
        const { error: addError } = await supabase.from("workspace_users").insert([
          {
            workspace_id: workspaceId,
            user_id: userId,
            role: "approver", // Special role for workflow approvers
            created_at: new Date().toISOString(),
          },
        ])

        if (addError) {
          console.error("Error adding user to workspace:", addError)
          return false
        }

        return true
      } else if (existingAccess.role !== "approver") {
        // If user already has access but not as approver, update their role
        const { error: updateError } = await supabase
          .from("workspace_users")
          .update({
            role: existingAccess.role, // Keep existing role if it's higher privilege
          })
          .eq("workspace_id", workspaceId)
          .eq("user_id", userId)

        if (updateError) {
          console.error("Error updating user workspace role:", updateError)
          return false
        }

        return true
      }

      return true
    } catch (error) {
      console.error("Error managing workspace access:", error)
      return false
    }
  }

  // Update the handleSaveLevelConfiguration function
  const handleSaveLevelConfiguration = async () => {
    if (selectedNodeId) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  approverGroups: selectedGroups,
                  level: currentLevelNumber,
                  timeoutHours: currentTimeoutHours,
                },
              }
            : node,
        ),
      )

      setShowLevelConfig(false)
      setSelectedNodeId(null)
    }
  }

  const handleSaveDecisionConfiguration = () => {
    if (selectedNodeId) {
      setNodes((prevNodes) => {
        // Get the current node
        const currentNode = prevNodes.find((node) => node.id === selectedNodeId)
        if (!currentNode) return prevNodes

        // Get existing paths from the node data
        const existingPaths = currentNode.data.paths || {}

        // Create a new paths object with existing paths preserved
        const newPaths: Record<string, any[]> = {}

        // Process buttons - replace gray with blue for "returned" value
        const processedButtons = currentDecisionButtons.map((button) => {
          if (button.value === "returned" && button.color === "gray") {
            return { ...button, color: "blue" }
          }
          return button
        })

        // For each button, ensure there's a corresponding path
        processedButtons.forEach((button) => {
          newPaths[button.value] = existingPaths[button.value] || []
        })

        // Update the node with new buttons and paths
        return prevNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  buttons: processedButtons,
                  paths: newPaths,
                },
              }
            : node,
        )
      })
    }
    setShowDecisionConfig(false)
    setSelectedNodeId(null)
  }

  const handleZoomChange = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      if (direction === "in" && prev < 150) return prev + 10
      if (direction === "out" && prev > 50) return prev - 10
      return prev
    })
  }

  const renderWorkflow = () => {
    // Start with the start node
    const startNode = nodes.find((node) => node.type === "start")
    if (!startNode) return null

    return (
      <div className="flex flex-col items-center h-full">
        {/* Control buttons at the top */}
        <div className="flex justify-between w-full mb-4 bg-white p-4 pr-16 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handleZoomChange("out")} disabled={zoomLevel <= 50}>
                -
              </Button>
              <span className="text-sm font-medium">{zoomLevel}%</span>
              <Button variant="outline" size="sm" onClick={() => handleZoomChange("in")} disabled={zoomLevel >= 150}>
                +
              </Button>
            </div>

            <Button
              variant={isDragMode ? "default" : "outline"}
              size="sm"
              className={`px-3 py-2 flex items-center space-x-2 ${isDragMode ? "text-white" : ""}`}
              style={isDragMode ? { backgroundColor: "#042841" } : {}}
              onClick={() => setIsDragMode(!isDragMode)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                />
              </svg>
              <span className="text-xs">{isDragMode ? "Drag Active" : "Click to Drag"}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "visual" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("visual")}
              className={viewMode === "visual" ? "text-white" : ""}
              style={viewMode === "visual" ? { backgroundColor: "#042841" } : {}}
            >
              Visual Flow
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "text-white" : ""}
              style={viewMode === "list" ? { backgroundColor: "#042841" } : {}}
            >
              List View
            </Button>
          </div>
        </div>

        {/* Workflow canvas below the buttons */}
        <div className="flex-1 w-full overflow-auto flex justify-center items-start">
          <div
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
              cursor: isDragMode ? "grab" : "default",
              minHeight: "100%",
            }}
            className="border border-gray-200 rounded-lg p-6 bg-white inline-block"
            onMouseDown={
              isDragMode
                ? (e) => {
                    e.preventDefault()
                    const startX = e.clientX - panPosition.x
                    const startY = e.clientY - panPosition.y

                    const handleMouseMove = (e: MouseEvent) => {
                      setPanPosition({
                        x: e.clientX - startX,
                        y: e.clientY - startY,
                      })
                    }

                    const handleMouseUp = () => {
                      document.removeEventListener("mousemove", handleMouseMove)
                      document.removeEventListener("mouseup", handleMouseUp)
                    }

                    document.addEventListener("mousemove", handleMouseMove)
                    document.addEventListener("mouseup", handleMouseUp)
                  }
                : undefined
            }
          >
            {viewMode === "visual" ? (
              renderNodeWithChildren(startNode)
            ) : (
              <div className="w-full max-w-2xl">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Workflow Structure</h3>
                    {renderListView(nodes)}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderNodeWithChildren = (node: WorkflowNode) => {
    if (node.type === "decision") {
      return renderDecisionNode(node)
    } else if (node.type === "field_condition") {
      return renderConditionNode(node)
    } else {
      return (
        <div key={node.id} className="flex flex-col items-center mb-8">
          {renderSingleNode(node)}

          {/* Find the next node in the main flow */}
          {renderNextNode(node)}
        </div>
      )
    }
  }

  const renderNextNode = (currentNode: WorkflowNode) => {
    // Don't show "Add Flow Step" for decision or condition nodes as they have their own paths
    if (currentNode.type === "decision" || currentNode.type === "field_condition") {
      return null
    }

    // Check if there's an end workflow node in the flow
    const hasEndWorkflowNode = nodes.some((node) => node.type === "end")

    // Find nodes that aren't part of any decision/condition path
    const mainFlowNodes = nodes.filter((node) => !node.parentId && node.id !== currentNode.id && node.type !== "start")

    // Sort by position to find the next node
    const nextNodes = mainFlowNodes.sort((a, b) => a.position.y - b.position.y)

    const nextNode = nextNodes.find((node) => node.position.y > currentNode.position.y)

    if (nextNode) {
      return (
        <>
          <div className="h-8 w-px bg-gray-300"></div>
          {renderNodeWithChildren(nextNode)}
        </>
      )
    }

    // If this is the last node and there's no end workflow node, show the "Add Flow Step" button
    // unless the current node is already an end workflow node
    if (!hasEndWorkflowNode && currentNode.type !== "end") {
      return (
        <>
          <div className="h-8 w-px bg-gray-300"></div>
          <Popover open={showFlowOptions} onOpenChange={setShowFlowOptions}>
            <PopoverTrigger asChild>
              <Button
                variant="dashed"
                className="w-64 h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Flow Step
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="center">
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search flow options..."
                    className="pl-9"
                    value={flowSearchQuery}
                    onChange={(e) => setFlowSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {FLOW_OPTIONS.filter((category) =>
                    category.items.some(
                      (item) =>
                        item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                    ),
                  ).map((category) => (
                    <div key={category.category} className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                        {category.category}
                      </h4>
                      <div className="space-y-1">
                        {category.items
                          .filter(
                            (item) =>
                              item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                              item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                          )
                          .map((item) => (
                            <Button
                              key={item.id}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50"
                              onClick={() => {
                                addFlowNode(item.id)
                                setFlowSearchQuery("")
                                setShowFlowOptions(false)
                              }}
                            >
                              <item.icon className="w-4 h-4 mr-3 flex-shrink-0 text-gray-600" />
                              <div>
                                <div className="font-medium text-sm">{item.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                              </div>
                            </Button>
                          ))}
                      </div>
                    </div>
                  ))}
                  {FLOW_OPTIONS.every(
                    (category) =>
                      !category.items.some(
                        (item) =>
                          item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                      ),
                  ) &&
                    flowSearchQuery && (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No flow options found</p>
                      </div>
                    )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )
    }

    return null
  }

  const renderDecisionNode = (node: WorkflowNode) => {
    const buttons = node.data.buttons || []

    return (
      <div key={node.id} className="flex flex-col items-center mb-8">
        {/* Main Node */}
        <Card key={node.id} className="w-64 mb-4 relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded text-white" style={{ backgroundColor: "#8b5cf6" }}>
                  <GitBranch className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">{node.title}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeNode(node.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">{renderNodeContent(node)}</CardContent>
        </Card>

        {/* Branching Paths */}
        <div
          className={`flex items-start justify-center w-full gap-4 ${buttons.length > 2 ? "max-w-6xl" : "max-w-4xl"}`}
        >
          {buttons.map((button: any) => {
            // Find nodes for this path
            const pathNodes = nodes
              .filter((n) => n.parentId === node.id && n.path === button.value)
              .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))

            const lastNode = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null
            const showAddButton = !lastNode || (lastNode.type !== "end" && lastNode.type !== "end_flow")

            return (
              <div key={button.id} className="flex flex-col items-center flex-1 min-w-48">
                <div
                  className={`text-sm font-medium mb-2 ${
                    button.value === "approved"
                      ? "text-green-600"
                      : button.value === "rejected"
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {button.label}
                </div>
                <div className="w-px h-8 bg-gray-300"></div>

                {pathNodes.map((pathNode, index) => (
                  <div key={pathNode.id} className="flex flex-col items-center">
                    {renderSingleNode(pathNode)}
                    {/* Show Add Flow Step after each node in the path unless it's the last node and it's an end node */}
                    {(index < pathNodes.length - 1 || pathNode.type !== "end") && (
                      <div className="h-8 w-px bg-gray-300"></div>
                    )}
                  </div>
                ))}

                {showAddButton && (
                  <>
                    {pathNodes.length > 0 && <div className="h-8 w-px bg-gray-300"></div>}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Card className="w-48 border-dashed border-gray-300 cursor-pointer hover:border-gray-400">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-500 mb-2">Add Flow Step</div>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Plus className="w-4 h-4 mr-1" />
                              Click to add
                            </Button>
                          </CardContent>
                        </Card>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="center">
                        <div className="p-4">
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search flow options..."
                              className="pl-9"
                              value={flowSearchQuery}
                              onChange={(e) => setFlowSearchQuery(e.target.value)}
                            />
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {FLOW_OPTIONS.filter((category) =>
                              category.items.some(
                                (item) =>
                                  item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                  item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                              ),
                            ).map((category) => (
                              <div key={category.category} className="mb-4">
                                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                                  {category.category}
                                </h4>
                                <div className="space-y-1">
                                  {category.items
                                    .filter(
                                      (item) =>
                                        item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                        item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                    )
                                    .map((item) => (
                                      <Button
                                        key={item.id}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50"
                                        onClick={() => {
                                          const newNode: WorkflowNode = {
                                            id: `node_${Date.now()}`,
                                            type: item.id as any,
                                            title: item.title,
                                            data: getDefaultNodeData(item.id),
                                            position: { x: 0, y: 0 },
                                            parentId: node.id,
                                            path: button.value,
                                          }
                                          setNodes((prev) => [...prev, newNode])
                                          setFlowSearchQuery("")
                                        }}
                                      >
                                        <item.icon className="w-4 h-4 mr-3 flex-shrink-0 text-gray-600" />
                                        <div>
                                          <div className="font-medium text-sm">{item.title}</div>
                                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                        </div>
                                      </Button>
                                    ))}
                                </div>
                              </div>
                            ))}
                            {FLOW_OPTIONS.every(
                              (category) =>
                                !category.items.some(
                                  (item) =>
                                    item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                    item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                ),
                            ) &&
                              flowSearchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>No flow options found</p>
                                </div>
                              )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </>
                )}

                <div className="w-px h-8 bg-gray-300 mt-4"></div>
              </div>
            )
          })}
        </div>

        {/* Convergence Point */}
        <div className="flex items-center justify-center mt-4">
          <div className="w-32 h-px bg-gray-300"></div>
          <ArrowDown className="w-4 h-4 text-gray-400 mx-2" />
          <div className="w-32 h-px bg-gray-300"></div>
        </div>

        {/* Next node after the decision */}
        {renderNextNode(node)}
      </div>
    )
  }

  const renderConditionNode = (node: WorkflowNode) => {
    return (
      <div key={node.id} className="flex flex-col items-center mb-8">
        {/* Main Node */}
        <Card key={node.id} className="w-64 mb-4 relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded text-white" style={{ backgroundColor: "#f59e0b" }}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <CardTitle className="text-sm">{node.title}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeNode(node.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">{renderNodeContent(node)}</CardContent>
        </Card>

        {/* True/False Paths */}
        <div className="flex items-start justify-center w-full max-w-4xl gap-8">
          {/* True Path */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-sm font-medium text-green-600 mb-2">True</div>
            <div className="w-px h-8 bg-gray-300"></div>

            {/* Find nodes for true path */}
            {(() => {
              const pathNodes = nodes
                .filter((n) => n.parentId === node.id && n.path === "true")
                .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))

              const lastNode = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null
              const showAddButton = !lastNode || (lastNode.type !== "end" && lastNode.type !== "end_flow")

              return (
                <>
                  {pathNodes.map((pathNode, index) => (
                    <div key={pathNode.id} className="flex flex-col items-center">
                      {renderSingleNode(pathNode)}
                      {/* Show Add Flow Step after each node in the path unless it's the last node and it's an end node */}
                      {(index < pathNodes.length - 1 || pathNode.type !== "end") && (
                        <div className="h-8 w-px bg-gray-300"></div>
                      )}
                    </div>
                  ))}

                  {showAddButton && (
                    <>
                      {pathNodes.length > 0 && <div className="h-8 w-px bg-gray-300"></div>}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Card className="w-48 border-dashed border-gray-300 cursor-pointer hover:border-gray-400">
                            <CardContent className="p-4 text-center">
                              <div className="text-sm text-gray-500 mb-2">Add Flow Step</div>
                              <Button size="sm" variant="outline" className="text-xs">
                                <Plus className="w-4 h-4 mr-1" />
                                Click to add
                              </Button>
                            </CardContent>
                          </Card>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="center">
                          <div className="p-4">
                            <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search flow options..."
                                className="pl-9"
                                value={flowSearchQuery}
                                onChange={(e) => setFlowSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                              {FLOW_OPTIONS.filter((category) =>
                                category.items.some(
                                  (item) =>
                                    item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                    item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                ),
                              ).map((category) => (
                                <div key={category.category} className="mb-4">
                                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                                    {category.category}
                                  </h4>
                                  <div className="space-y-1">
                                    {category.items
                                      .filter(
                                        (item) =>
                                          item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                          item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                      )
                                      .map((item) => (
                                        <Button
                                          key={item.id}
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50"
                                          onClick={() => {
                                            const newNode: WorkflowNode = {
                                              id: `node_${Date.now()}`,
                                              type: item.id as any,
                                              title: item.title,
                                              data: getDefaultNodeData(item.id),
                                              position: { x: 0, y: 0 },
                                              parentId: node.id,
                                              path: "true",
                                            }
                                            setNodes((prev) => [...prev, newNode])
                                            setFlowSearchQuery("")
                                          }}
                                        >
                                          <item.icon className="w-4 h-4 mr-3 flex-shrink-0 text-gray-600" />
                                          <div>
                                            <div className="font-medium text-sm">{item.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                          </div>
                                        </Button>
                                      ))}
                                  </div>
                                </div>
                              ))}
                              {FLOW_OPTIONS.every(
                                (category) =>
                                  !category.items.some(
                                    (item) =>
                                      item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                      item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                  ),
                              ) &&
                                flowSearchQuery && (
                                  <div className="text-center py-8 text-gray-500">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No flow options found</p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </>
              )
            })()}

            <div className="w-px h-8 bg-gray-300 mt-4"></div>
          </div>

          {/* False Path */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-sm font-medium text-red-600 mb-2">False</div>
            <div className="w-px h-8 bg-gray-300"></div>

            {/* Find nodes for false path */}
            {(() => {
              const pathNodes = nodes
                .filter((n) => n.parentId === node.id && n.path === "false")
                .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))

              const lastNode = pathNodes.length > 0 ? pathNodes[pathNodes.length - 1] : null
              const showAddButton = !lastNode || (lastNode.type !== "end" && lastNode.type !== "end_flow")

              return (
                <>
                  {pathNodes.map((pathNode, index) => (
                    <div key={pathNode.id} className="flex flex-col items-center">
                      {renderSingleNode(pathNode)}
                      {/* Show Add Flow Step after each node in the path unless it's the last node and it's an end node */}
                      {(index < pathNodes.length - 1 || pathNode.type !== "end") && (
                        <div className="h-8 w-px bg-gray-300"></div>
                      )}
                    </div>
                  ))}

                  {showAddButton && (
                    <>
                      {pathNodes.length > 0 && <div className="h-8 w-px bg-gray-300"></div>}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Card className="w-48 border-dashed border-gray-300 cursor-pointer hover:border-gray-400">
                            <CardContent className="p-4 text-center">
                              <div className="text-sm text-gray-500 mb-2">Add Flow Step</div>
                              <Button size="sm" variant="outline" className="text-xs">
                                <Plus className="w-4 h-4 mr-1" />
                                Click to add
                              </Button>
                            </CardContent>
                          </Card>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="center">
                          <div className="p-4">
                            <div className="relative mb-4">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search flow options..."
                                className="pl-9"
                                value={flowSearchQuery}
                                onChange={(e) => setFlowSearchQuery(e.target.value)}
                              />
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                              {FLOW_OPTIONS.filter((category) =>
                                category.items.some(
                                  (item) =>
                                    item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                    item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                ),
                              ).map((category) => (
                                <div key={category.category} className="mb-4">
                                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">
                                    {category.category}
                                  </h4>
                                  <div className="space-y-1">
                                    {category.items
                                      .filter(
                                        (item) =>
                                          item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                          item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                      )
                                      .map((item) => (
                                        <Button
                                          key={item.id}
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-left h-auto p-3 hover:bg-gray-50"
                                          onClick={() => {
                                            const newNode: WorkflowNode = {
                                              id: `node_${Date.now()}`,
                                              type: item.id as any,
                                              title: item.title,
                                              data: getDefaultNodeData(item.id),
                                              position: { x: 0, y: 0 },
                                              parentId: node.id,
                                              path: "false",
                                            }
                                            setNodes((prev) => [...prev, newNode])
                                            setFlowSearchQuery("")
                                          }}
                                        >
                                          <item.icon className="w-4 h-4 mr-3 flex-shrink-0 text-gray-600" />
                                          <div>
                                            <div className="font-medium text-sm">{item.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                          </div>
                                        </Button>
                                      ))}
                                  </div>
                                </div>
                              ))}
                              {FLOW_OPTIONS.every(
                                (category) =>
                                  !category.items.some(
                                    (item) =>
                                      item.title.toLowerCase().includes(flowSearchQuery.toLowerCase()) ||
                                      item.description.toLowerCase().includes(flowSearchQuery.toLowerCase()),
                                  ),
                              ) &&
                                flowSearchQuery && (
                                  <div className="text-center py-8 text-gray-500">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>No flow options found</p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </>
              )
            })()}

            <div className="w-px h-8 bg-gray-300 mt-4"></div>
          </div>
        </div>

        {/* Convergence Point */}
        <div className="flex items-center justify-center mt-4">
          <div className="w-32 h-px bg-gray-300"></div>
          <ArrowDown className="w-4 h-4 text-gray-400 mx-2" />
          <div className="w-32 h-px bg-gray-300"></div>
        </div>

        {/* Next node after the condition */}
        {renderNextNode(node)}
      </div>
    )
  }

  const renderSingleNode = (node: WorkflowNode) => {
    const getNodeIcon = () => {
      switch (node.type) {
        case "start":
          return <Play className="w-5 h-5" />
        case "approval_level":
          return <Users className="w-5 h-5" />
        case "decision":
          return <GitBranch className="w-5 h-5" />
        case "condition":
        case "field_condition":
          return <AlertTriangle className="w-5 h-5" />
        case "end":
        case "end_flow":
          return <XCircle className="w-5 h-5" />
        case "action":
          return <Settings className="w-5 h-5" />
        default:
          return <Settings className="w-5 h-5" />
      }
    }

    const getNodeColor = () => {
      switch (node.type) {
        case "start":
          return "#059669"
        case "approval_level":
          return "#0ea5e9"
        case "decision":
          return "#8b5cf6"
        case "condition":
        case "field_condition":
          return "#f59e0b"
        case "end":
        case "end_flow":
          return "#ef4444"
        case "action":
          return "#6b7280"
        default:
          return "#6b7280"
      }
    }

    const width = node.parentId ? "w-48" : "w-64"

    return (
      <Card key={node.id} className={`${width} mb-4 relative`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded text-white" style={{ backgroundColor: getNodeColor() }}>
                {getNodeIcon()}
              </div>
              <CardTitle className="text-sm">{node.title}</CardTitle>
            </div>
            {node.type !== "start" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeNode(node.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">{renderNodeContent(node)}</CardContent>
      </Card>
    )
  }

  const renderListView = (nodes: WorkflowNode[]) => {
    // Start with the start node, then follow the workflow sequence
    const startNode = nodes.find((node) => node.type === "start")
    const orderedNodes: WorkflowNode[] = []

    if (startNode) {
      orderedNodes.push(startNode)

      // Add main flow nodes (nodes without parentId, excluding start)
      const mainFlowNodes = nodes
        .filter((node) => !node.parentId && node.type !== "start")
        .sort((a, b) => (a.position.y || 0) - (b.position.y || 0))

      orderedNodes.push(...mainFlowNodes)

      // Add child nodes grouped by their parent
      const childNodes = nodes.filter((node) => node.parentId)
      const groupedChildren = childNodes.reduce(
        (acc, node) => {
          if (!acc[node.parentId!]) acc[node.parentId!] = []
          acc[node.parentId!].push(node)
          return acc
        },
        {} as Record<string, WorkflowNode[]>,
      )

      // Sort child nodes within each group by path and position
      Object.values(groupedChildren).forEach((group) => {
        group.sort((a, b) => {
          if (a.path !== b.path) return (a.path || "").localeCompare(b.path || "")
          return (a.position.y || 0) - (b.position.y || 0)
        })
        orderedNodes.push(...group)
      })
    }

    return (
      <div className="space-y-2">
        {orderedNodes.map((node) => {
          // Find child nodes
          const childNodes = nodes.filter((n) => n.parentId === node.id)

          return (
            <div key={node.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded text-white" style={{ backgroundColor: getNodeColor(node.type) }}>
                    {getNodeIcon(node.type)}
                  </div>
                  <div>
                    <div className="font-medium">{node.title}</div>
                    {node.path && <div className="text-xs text-gray-500">Path: {node.path}</div>}
                    {node.parentId && (
                      <div className="text-xs text-blue-500">
                        Child of: {nodes.find((n) => n.id === node.parentId)?.title}
                      </div>
                    )}
                  </div>
                </div>
                {node.type !== "start" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeNode(node.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {childNodes.length > 0 && (
                <div className="pl-4 mt-2 border-l-2 border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Child nodes:</div>
                  {childNodes.map((childNode) => (
                    <div key={childNode.id} className="text-sm py-1">
                      {childNode.title}{" "}
                      {childNode.path && <span className="text-xs text-gray-500">(Path: {childNode.path})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "start":
        return <Play className="w-4 h-4" />
      case "approval_level":
        return <Users className="w-4 h-4" />
      case "decision":
        return <GitBranch className="w-4 h-4" />
      case "condition":
      case "field_condition":
        return <AlertTriangle className="w-4 h-4" />
      case "end":
      case "end_flow":
        return <XCircle className="w-4 h-4" />
      case "action":
        return <Settings className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getNodeColor = (nodeType: string) => {
    switch (nodeType) {
      case "start":
        return "#059669"
      case "approval_level":
        return "#0ea5e9"
      case "decision":
        return "#8b5cf6"
      case "condition":
        return "#f59e0b"
      case "field_condition":
        return "#f59e0b"
      case "end":
        return "#ef4444"
      case "end_flow":
        return "#ef4444"
      case "action":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  // Update the approval level configuration section
  const renderApprovalLevelConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="level-number">Level Number</Label>
        <Input
          id="level-number"
          type="number"
          min="1"
          value={currentLevelNumber}
          onChange={(e) => setCurrentLevelNumber(Number.parseInt(e.target.value))}
          placeholder="Enter level number"
        />
      </div>
      <div>
        <Label htmlFor="approver-groups">Approver Groups</Label>
        <div className="space-y-2">
          {/* Selected Groups */}
          {selectedGroups.map((groupId) => {
            const group = availableGroups.find((g) => g.id === groupId)
            return (
              <Badge key={groupId} variant="secondary" className="flex items-center gap-1">
                {group?.name || "Unknown Group"}
                <button
                  type="button"
                  onClick={() => setSelectedGroups((prev) => prev.filter((id) => id !== groupId))}
                  className="ml-1 text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            )
          })}

          {/* Group Selection */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add Approver Groups
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3">
                <div className="max-h-48 overflow-y-auto">
                  {availableGroups
                    .filter((group) => !selectedGroups.includes(group.id))
                    .map((group) => (
                      <Button
                        key={group.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-2 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedGroups((prev) => [...prev, group.id])
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{group.name}</div>
                          <div className="text-xs text-gray-500">{group.description}</div>
                        </div>
                      </Button>
                    ))}
                  {availableGroups.filter((group) => !selectedGroups.includes(group.id)).length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {availableGroups.length === 0 ? "No approver groups found" : "All groups selected"}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div>
        <Label htmlFor="timeout">Timeout (hours)</Label>
        <Input
          id="timeout"
          type="number"
          min="1"
          value={currentTimeoutHours}
          onChange={(e) => setCurrentTimeoutHours(Number.parseInt(e.target.value))}
          placeholder="24"
        />
      </div>
    </div>
  )

  const renderNodeContent = (node: WorkflowNode) => {
    switch (node.type) {
      case "start":
        return <div className="text-sm text-gray-600">Triggered when form is submitted</div>
      case "approval_level":
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>Level:</strong> {node.data.level || 1}
            </div>
            <div className="text-sm">
              <strong>Groups:</strong> {node.data.approverGroups?.length || 0} assigned
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedNodeId(node.id)
                setSelectedGroups(node.data.approverGroups || [])
                setCurrentLevelNumber(node.data.level || 1)
                setCurrentTimeoutHours(node.data.timeoutHours || 24)
                setShowLevelConfig(true)
              }}
            >
              Configure Level
            </Button>
          </div>
        )
      case "decision":
        return (
          <div className="space-y-2">
            <div className="text-sm">Decision buttons:</div>
            <div className="flex flex-wrap gap-1">
              {node.data.buttons?.map((button: any) => (
                <Badge
                  key={button.id}
                  variant="outline"
                  className={
                    button.value === "approved"
                      ? "text-green-600"
                      : button.value === "rejected"
                        ? "text-red-600"
                        : "text-blue-600"
                  }
                >
                  {button.label}
                </Badge>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedNodeId(node.id)
                setCurrentDecisionButtons(node.data.buttons || [])
                setShowDecisionConfig(true)
              }}
            >
              Configure Buttons
            </Button>
          </div>
        )
      case "field_condition":
        return (
          <div className="space-y-2">
            <div className="text-sm">
              If field <strong>{node.data.fieldId || "..."}</strong> {node.data.operator}{" "}
              <strong>{node.data.value || "..."}</strong>
            </div>
            <div className="text-xs text-gray-500">Creates True/False paths</div>
            <Button size="sm" variant="outline" className="w-full">
              Configure Condition
            </Button>
          </div>
        )
      case "action":
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Click to configure</div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedNodeId(node.id)
                setCurrentActionPath(node.path || null)
                setShowActionConfig(true)
              }}
            >
              Configure Action
            </Button>
          </div>
        )
      case "end":
      case "end_flow":
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">{node.data.message || "Workflow completed"}</div>
          </div>
        )
      default:
        return <div className="text-sm text-gray-600">Configure this step</div>
    }
  }

  if (forms.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Forms Available</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">You need to create a form before setting up a workflow.</p>
            <Link href="/admin/forms/builder">
              <Button className="text-white" style={{ backgroundColor: "#042841" }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[98vw] h-[98vh] max-w-none overflow-hidden p-0 [&>button]:hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              <DialogTitle className="text-lg font-semibold">Workflow Builder</DialogTitle>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved Changes
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsActive(!isActive)}
                className={cn("flex items-center space-x-2", isActive ? "text-green-600" : "text-gray-600")}
              >
                {isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isActive ? "Active" : "Inactive"}</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="text-white flex items-center space-x-2"
                style={{ backgroundColor: "#042841" }}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Workflow"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-gray-600 hover:text-red-600 hover:border-red-600 hover:bg-white"
              >
                Close
              </Button>
            </div>
          </div>

          <div className="flex h-[calc(98vh-80px)]">
            {/* Main Workflow Canvas */}
            <div className={cn("flex-grow transition-all duration-300", isSidebarOpen ? "mr-[320px]" : "mr-0")}>
              <div className="h-full bg-gray-50 rounded-lg overflow-y-auto">{renderWorkflow()}</div>
            </div>

            {/* Right Sidebar - Configuration Panel */}
            <div
              className={cn(
                "fixed top-[80px] right-0 h-[calc(98vh-80px)] w-[320px] bg-white border-l border-gray-200 transition-all duration-300 z-10",
                isSidebarOpen ? "translate-x-0" : "translate-x-full",
              )}
            >
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute -left-10 top-4 bg-white border border-gray-200 rounded-l-md h-10 w-10"
              >
                {isSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>

              <div className="p-4 h-full overflow-y-auto">
                <Card className="border-0 shadow-none">
                  <CardHeader>
                    <CardTitle className="text-sm">Workflow Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="workflow-name">Name</Label>
                      <Input
                        id="workflow-name"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workflow-description">Description</Label>
                      <Textarea
                        id="workflow-description"
                        value={workflowDescription}
                        onChange={(e) => setWorkflowDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="form-select">Target Form</Label>
                      <Select value={selectedForm} onValueChange={setSelectedForm}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a form..." />
                        </SelectTrigger>
                        <SelectContent>
                          {forms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your workflow. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowCloseConfirmation(false)}
              className="hover:text-orange-600 hover:border-orange-600 hover:bg-white"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseConfirmation(false)
                onClose()
              }}
              className="hover:bg-white"
            >
              Close Without Saving
            </Button>
            <AlertDialogAction
              onClick={handleSaveAndClose}
              className="text-white"
              style={{ backgroundColor: "#042841" }}
            >
              Save & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Level Configuration Dialog */}
      <Dialog open={showLevelConfig} onOpenChange={setShowLevelConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Approval Level</DialogTitle>
          </DialogHeader>
          <div className="py-4">{renderApprovalLevelConfig()}</div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowLevelConfig(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLevelConfiguration}
              className="text-white"
              style={{ backgroundColor: "#042841" }}
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decision Configuration Dialog */}
      <Dialog open={showDecisionConfig} onOpenChange={setShowDecisionConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Decision Buttons</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Existing Buttons */}
            <div>
              <Label>Current Buttons</Label>
              <div className="space-y-2 mt-2">
                {currentDecisionButtons.map((button, index) => (
                  <div key={button.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={
                          button.value === "approved"
                            ? "text-green-600"
                            : button.value === "rejected"
                              ? "text-red-600"
                              : "text-blue-600"
                        }
                      >
                        {button.label}
                      </Badge>
                      <span className="text-sm text-gray-500">→ {button.value}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCurrentDecisionButtons((prev) => prev.filter((_, i) => i !== index))
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Button */}
            <div className="border-t pt-4">
              <Label>Add New Button</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="button-label">Button Label</Label>
                  <Input
                    id="button-label"
                    value={newButtonLabel}
                    onChange={(e) => setNewButtonLabel(e.target.value)}
                    placeholder="e.g., Approve, Reject, Review"
                  />
                </div>
                <div>
                  <Label htmlFor="button-value">Button Value</Label>
                  <Input
                    id="button-value"
                    value={newButtonValue}
                    onChange={(e) => setNewButtonValue(e.target.value)}
                    placeholder="e.g., approved, rejected, review"
                  />
                </div>
                <div>
                  <Label htmlFor="button-color">Button Color</Label>
                  <Select value={newButtonColor} onValueChange={setNewButtonColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Green (Success)</SelectItem>
                      <SelectItem value="red">Red (Danger)</SelectItem>
                      <SelectItem value="blue">Blue (Primary)</SelectItem>
                      <SelectItem value="yellow">Yellow (Warning)</SelectItem>
                      <SelectItem value="gray">Gray (Neutral)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    if (newButtonLabel && newButtonValue) {
                      const newButton = {
                        id: `btn_${Date.now()}`,
                        label: newButtonLabel,
                        value: newButtonValue,
                        color: newButtonColor,
                      }
                      setCurrentDecisionButtons((prev) => [...prev, newButton])
                      setNewButtonLabel("")
                      setNewButtonValue("")
                      setNewButtonColor("blue")
                    }
                  }}
                  className="w-full"
                  disabled={!newButtonLabel || !newButtonValue}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Button
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDecisionConfig(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDecisionConfiguration}
              className="text-white"
              style={{ backgroundColor: "#042841" }}
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Configuration Dialog */}
      <Dialog open={showActionConfig} onOpenChange={setShowActionConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="action-type">Action Type</Label>
              <Select defaultValue="notification">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Send Notification</SelectItem>
                  <SelectItem value="update_status">Update Status</SelectItem>
                  <SelectItem value="assign_user">Assign User</SelectItem>
                  <SelectItem value="end_flow">End Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action specific configuration would go here */}
            <div>
              <Label htmlFor="action-name">Action Name</Label>
              <Input id="action-name" placeholder="Enter a name for this action" />
            </div>

            <div>
              <Label htmlFor="action-description">Description</Label>
              <Textarea id="action-description" placeholder="Describe what this action does" rows={2} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowActionConfig(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Save action configuration
                setShowActionConfig(false)
              }}
              className="text-white"
              style={{ backgroundColor: "#042841" }}
            >
              Save Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
