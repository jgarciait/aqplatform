"use client"

import { useAuth } from "@/contexts/auth-context"
import { useWorkspace } from "@/contexts/workspace-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, GitBranch, FolderOpen, BarChart3, TrendingUp, Activity, Clock, Building2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getFormsForUser } from "@/lib/form-service"
import { getWorkflowsForWorkspace } from "@/lib/workflow-service"
import { getUsersForWorkspace } from "@/lib/user-service"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { selectedWorkspace, isLoading: workspaceLoading } = useWorkspace()

  const [formsCount, setFormsCount] = useState(0)
  const [workflowsCount, setWorkflowsCount] = useState(0)
  const [documentsCount, setDocumentsCount] = useState(156)
  const [usersCount, setUsersCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      setIsLoading(true)

      try {
        if (selectedWorkspace?.id) {
          // Fetch forms for the selected workspace
          const forms = await getFormsForUser(user.id)
          const workspaceForms = forms.filter((form) => form.workspace_id === selectedWorkspace.id)
          setFormsCount(workspaceForms.length)

          // Fetch workflows for the selected workspace
          const workflows = await getWorkflowsForWorkspace(selectedWorkspace.id)
          setWorkflowsCount(workflows.length)

          // Fetch users for the selected workspace
          const workspaceUsers = await getUsersForWorkspace(selectedWorkspace.id)
          setUsersCount(workspaceUsers.length)

          // Set mock recent activity
          setRecentActivity([
            {
              action: "New form created",
              user: "John Doe",
              time: "2 minutes ago",
              icon: FileText,
            },
            {
              action: "Workflow updated",
              user: "Jane Smith",
              time: "15 minutes ago",
              icon: GitBranch,
            },
            {
              action: "Document uploaded",
              user: "Mike Johnson",
              time: "1 hour ago",
              icon: FolderOpen,
            },
          ])
        } else {
          // Reset counts if no workspace is selected
          setFormsCount(0)
          setWorkflowsCount(0)
          setUsersCount(0)
          setRecentActivity([])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id, selectedWorkspace?.id])

  // Show loading state
  if (workspaceLoading || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#042841] mx-auto mb-4"></div>
          <p className="text-[#042841]">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  // Show message if no workspace is selected
  if (!selectedWorkspace) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#001623" }}>
            No Workspace Selected
          </h2>
          <p className="text-gray-600 mb-6">Please select a workspace from the sidebar to view its dashboard data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.email}. Here's what's happening with{" "}
          <span className="font-medium">{selectedWorkspace.name}</span>.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                  {formsCount}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                <FileText className="w-6 h-6" style={{ color: "#042841" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                  {workflowsCount}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5%
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#083e5c20" }}>
                <GitBranch className="w-6 h-6" style={{ color: "#083e5c" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                  {documentsCount}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +23%
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                <FolderOpen className="w-6 h-6" style={{ color: "#042841" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users</p>
                <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                  {usersCount}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8%
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#083e5c20" }}>
                <Users className="w-6 h-6" style={{ color: "#083e5c" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ color: "#001623" }}>
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                      <Icon className="w-4 h-4" style={{ color: "#042841" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "#001623" }}>
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">by {activity.user}</p>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                )
              })}

              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No recent activity in this workspace</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#001623" }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href={`/admin/forms/builder?workspace=${selectedWorkspace.id}`}>
                <Button
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 text-white"
                  style={{ backgroundColor: "#042841" }}
                >
                  <FileText className="w-6 h-6" />
                  <span>Create Form</span>
                </Button>
              </Link>
              <Link href={`/admin/workflows?workspace=${selectedWorkspace.id}`}>
                <Button
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 text-white"
                  style={{ backgroundColor: "#083e5c" }}
                >
                  <GitBranch className="w-6 h-6" />
                  <span>New Workflow</span>
                </Button>
              </Link>
              <Link href={`/admin/documents?workspace=${selectedWorkspace.id}`}>
                <Button
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 text-white"
                  style={{ backgroundColor: "#042841" }}
                >
                  <FolderOpen className="w-6 h-6" />
                  <span>Upload Document</span>
                </Button>
              </Link>
              <Link href={`/admin/reports?workspace=${selectedWorkspace.id}`}>
                <Button
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 text-white"
                  style={{ backgroundColor: "#083e5c" }}
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>View Reports</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
