"use client"
import { useState } from "react"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { createWorkspace, deleteWorkspace } from "@/lib/workspace-service"
import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  FolderOpen,
  BarChart3,
  Shield,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  ChevronDown,
  Check,
  Home,
  Plus,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AdminSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const { signOut, user } = useAuth()
  const { selectedWorkspace, setSelectedWorkspace, workspaces, setWorkspaces, isLoading } = useWorkspace()
  const pathname = usePathname()

  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("")
  const [editWorkspaceName, setEditWorkspaceName] = useState("")
  const [editWorkspaceDesc, setEditWorkspaceDesc] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      title: "Form Builder",
      icon: FileText,
      href: "/admin/forms",
      active: pathname.startsWith("/admin/forms"),
    },
    {
      title: "Workflows",
      icon: GitBranch,
      href: "/admin/workflows",
      active: pathname.startsWith("/admin/workflows"),
    },
    {
      title: "Documents",
      icon: FolderOpen,
      href: "/admin/documents",
      active: pathname.startsWith("/admin/documents"),
    },
    {
      title: "Reports",
      icon: BarChart3,
      href: "/admin/reports",
      active: pathname.startsWith("/admin/reports"),
    },
    {
      title: "Audit",
      icon: Shield,
      href: "/admin/audit",
      active: pathname.startsWith("/admin/audit"),
    },
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      active: pathname.startsWith("/admin/users"),
    },
    {
      title: "Archived Submissions",
      icon: Archive,
      href: "/admin/archived-submissions",
      active: pathname.startsWith("/admin/archived-submissions"),
    },
  ]

  const handleWorkspaceSelect = (workspace: any) => {
    setSelectedWorkspace(workspace)
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user?.id) return

    setIsCreating(true)
    try {
      const newWorkspace = await createWorkspace(
        {
          name: newWorkspaceName.trim(),
          description: newWorkspaceDesc.trim(),
        },
        user.id,
      )

      if (newWorkspace) {
        const updatedWorkspaces = [...workspaces, newWorkspace]
        setWorkspaces(updatedWorkspaces)
        setSelectedWorkspace(newWorkspace)
        setNewWorkspaceName("")
        setNewWorkspaceDesc("")
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditWorkspace = (workspace: any) => {
    setEditingWorkspace(workspace)
    setEditWorkspaceName(workspace.name)
    setEditWorkspaceDesc(workspace.description || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateWorkspace = async () => {
    if (!editWorkspaceName.trim() || !editingWorkspace?.id) return

    setIsEditing(true)
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .update({
          name: editWorkspaceName.trim(),
          description: editWorkspaceDesc.trim(),
        })
        .eq("id", editingWorkspace.id)
        .select()

      if (error) throw error

      if (data && data[0]) {
        const updatedWorkspace = data[0]
        const updatedWorkspaces = workspaces.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w))
        setWorkspaces(updatedWorkspaces)

        if (selectedWorkspace?.id === updatedWorkspace.id) {
          setSelectedWorkspace(updatedWorkspace)
        }

        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating workspace:", error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const success = await deleteWorkspace(workspaceId)
      if (success) {
        const remainingWorkspaces = workspaces.filter((w) => w.id !== workspaceId)
        setWorkspaces(remainingWorkspaces)
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null)
        }
      } else {
        console.error("Failed to delete workspace")
      }
    } catch (error) {
      console.error("Error deleting workspace:", error)
    }
  }

  return (
    <div
      className={`relative bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        style={{ color: "#042841" }}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: "#042841" }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-semibold" style={{ color: "#001623" }}>
                Admin Panel
              </span>
            </div>
          )}
          {isCollapsed && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white mx-auto"
              style={{ backgroundColor: "#042841" }}
            >
              <Building2 className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Workspace Selector */}
        <div className="border-b border-gray-200 p-4">
          {!isCollapsed ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Workspace</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left hover:bg-gray-100"
                    style={{ color: "#042841" }}
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {isLoading ? "Loading..." : selectedWorkspace?.name || "Select Workspace"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      className="flex items-center hover:bg-gray-100 px-2 py-1.5"
                      onClick={() => handleWorkspaceSelect(workspace)}
                    >
                      <div className="flex items-center flex-1 min-w-0 mr-2">
                        <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate flex-1">{workspace.name}</span>
                        {selectedWorkspace?.id === workspace.id && (
                          <Check className="h-4 w-4 ml-2 flex-shrink-0" style={{ color: "#042841" }} />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditWorkspace(workspace)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the workspace{" "}
                                <span className="font-semibold">{workspace.name}</span> and all its associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWorkspace(workspace.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="flex items-center justify-center text-center hover:bg-gray-100"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create New Workspace</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedWorkspace && (
                <p className="mt-2 text-xs text-center font-medium" style={{ color: "#042841" }}>
                  Currently viewing: {selectedWorkspace.name}
                </p>
              )}

              {/* Create Workspace Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newWorkspaceDesc}
                        onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                        placeholder="Enter workspace description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWorkspace}
                      disabled={isCreating || !newWorkspaceName.trim()}
                      style={{ backgroundColor: "#042841" }}
                    >
                      {isCreating ? "Creating..." : "Create Workspace"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Workspace Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Workspace</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Workspace Name</Label>
                      <Input
                        id="edit-name"
                        value={editWorkspaceName}
                        onChange={(e) => setEditWorkspaceName(e.target.value)}
                        placeholder="Enter workspace name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description (Optional)</Label>
                      <Textarea
                        id="edit-description"
                        value={editWorkspaceDesc}
                        onChange={(e) => setEditWorkspaceDesc(e.target.value)}
                        placeholder="Enter workspace description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateWorkspace}
                      disabled={isEditing || !editWorkspaceName.trim()}
                      style={{ backgroundColor: "#042841" }}
                    >
                      {isEditing ? "Updating..." : "Update Workspace"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-gray-100"
                  style={{ borderColor: "#042841", color: "#042841" }}
                  disabled={isLoading}
                >
                  <Building2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    className="flex items-center justify-between hover:bg-gray-100 px-2 py-1.5"
                    onClick={() => handleWorkspaceSelect(workspace)}
                  >
                    <div className="flex items-center flex-1">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{workspace.name}</span>
                      {selectedWorkspace?.id === workspace.id && (
                        <Check className="h-4 w-4 ml-2" style={{ color: "#042841" }} />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start ${item.active ? "text-white" : "text-gray-700 hover:bg-gray-100"}`}
                  style={item.active ? { backgroundColor: "#042841" } : {}}
                >
                  <Icon className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
                  {!isCollapsed && item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4">
          <Link href="/dashboard">
            <Button
              variant="default"
              className="w-full justify-start text-white mb-2"
              style={{ backgroundColor: "#083e5c" }}
            >
              <Home className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
              {!isCollapsed && "Go To Workspaces"}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
            onClick={async () => {
              try {
                await signOut()
                window.location.href = "/login"
              } catch (error) {
                console.error("Logout failed:", error)
              }
            }}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </div>
  )
}
