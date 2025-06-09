"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Workspace } from "@/lib/database.types" // Corrected import for Workspace type
import { getFormsForWorkspace, type Form } from "@/lib/form-service" // Corrected import for Form type
import { getFormSubmissionsForWorkspace, getFormSubmissionsForForm } from "@/lib/submission-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ArrowLeft, Inbox, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { WorkspaceSidebar } from "@/components/workspace-sidebar"
import { FormSubmissionTable } from "@/components/form-submission-table"
import { FormFillView } from "@/components/form-fill-view"
import { ModeSwitcher } from "@/components/mode-switcher"

export default function WorkspacePage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()

  const workspaceId = id as string
  const mode = searchParams.get("mode") || "sender" // default to sender

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [forms, setForms] = useState<Form[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("forms")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const fetchWorkspaceData = useCallback(async () => {
    if (!user || !workspaceId) return

    setIsLoading(true)
    try {
      // Fetch workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single()

      if (workspaceError) throw workspaceError
      setWorkspace(workspaceData)

      // Fetch forms for this workspace
      const workspaceForms = await getFormsForWorkspace(workspaceId)
      setForms(workspaceForms)

      // Fetch submissions for this workspace (for overall view or sender's submissions)
      const workspaceSubmissions = await getFormSubmissionsForWorkspace(workspaceId)
      setSubmissions(workspaceSubmissions)

      // Record workspace visit
      await supabase.from("workspace_visits").insert([
        {
          workspace_id: workspaceId,
          user_id: user.id,
        },
      ])
    } catch (error) {
      console.error("Error fetching workspace data:", error)
      router.push("/dashboard") // Redirect if workspace not found or error
    } finally {
      setIsLoading(false)
    }
  }, [user, workspaceId, router])

  useEffect(() => {
    fetchWorkspaceData()
  }, [fetchWorkspaceData])

  const handleFormSelect = useCallback(
    async (formId: string) => {
      setSelectedFormId(formId)

      if (mode === "recipient") {
        // For recipient workspaces, fetch submissions for the selected form
        const formSubmissions = await getFormSubmissionsForForm(formId)
        setSubmissions(formSubmissions)
      }
    },
    [mode],
  )

  const handleFormSubmissionComplete = useCallback(() => {
    setSelectedFormId(null)
    setActiveTab("submissions")
    // Re-fetch submissions after a new one is created
    fetchWorkspaceData()
  }, [fetchWorkspaceData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#042841] mx-auto mb-4"></div>
          <p className="text-[#042841]">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Workspace Not Found</h2>
          <p className="text-gray-600 mb-6">
            The workspace you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <WorkspaceSidebar
        workspace={workspace}
        forms={forms}
        onFormSelect={handleFormSelect}
        selectedFormId={selectedFormId}
        mode={mode}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#001623" }}>
              {workspace.name} - {mode === "sender" ? "Sender Area" : "Recipient Area"}
            </h1>
            <p className="text-gray-600 mt-1">
              {mode === "sender" ? "Fill and send forms" : "View and manage form submissions"}
            </p>
          </div>
          <ModeSwitcher workspaceId={workspace.id} currentMode={mode} />
        </div>

        {mode === "sender" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="forms">
                <FileText className="mr-2 h-4 w-4" />
                Forms
              </TabsTrigger>
              <TabsTrigger value="submissions">
                <Inbox className="mr-2 h-4 w-4" />
                My Submissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forms" className="mt-6">
              {selectedFormId ? (
                <FormFillView
                  formId={selectedFormId}
                  workspaceId={workspace.id}
                  onSubmissionComplete={handleFormSubmissionComplete}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Select a Form to Fill</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Please select a form from the sidebar to fill out and send.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="submissions" className="mt-6">
              <FormSubmissionTable submissions={submissions} showFormColumn={true} selectedFormId={selectedFormId} />
            </TabsContent>
          </Tabs>
        ) : (
          // Recipient mode - view all submissions
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Form Submissions Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                          <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                            {submissions.length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                          <Inbox className="w-6 h-6" style={{ color: "#042841" }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">New Today</p>
                          <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                            {
                              submissions.filter(
                                (s) => new Date(s.created_at).toDateString() === new Date().toDateString(),
                              ).length
                            }
                          </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                          <Clock className="w-6 h-6" style={{ color: "#042841" }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Processed</p>
                          <p className="text-2xl font-bold" style={{ color: "#001623" }}>
                            {submissions.filter((s) => s.status === "processed").length}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: "#04284120" }}>
                          <CheckCircle className="w-6 h-6" style={{ color: "#042841" }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {selectedFormId ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Submissions for {forms.find((f) => f.id === selectedFormId)?.title || "Selected Form"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormSubmissionTable
                    submissions={submissions.filter((s) => s.form_id === selectedFormId)}
                    showFormColumn={false}
                    allowStatusUpdate={true}
                    selectedFormId={selectedFormId}
                  />
                </CardContent>
              </Card>
            ) : (
              <FormSubmissionTable
                submissions={submissions}
                showFormColumn={true}
                allowStatusUpdate={true}
                selectedFormId={selectedFormId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
