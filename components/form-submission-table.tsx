"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { FileText, MoreVertical, Eye, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { updateSubmissionStatus, deleteSubmission } from "@/lib/submission-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FormSubmissionTableProps {
  submissions: any[]
  showFormColumn?: boolean
  allowStatusUpdate?: boolean
  selectedFormId?: string | null
}

export function FormSubmissionTable({
  submissions,
  showFormColumn = false,
  allowStatusUpdate = false,
  selectedFormId = null,
}: FormSubmissionTableProps) {
  const [viewingSubmission, setViewingSubmission] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null)
  const [localSubmissions, setLocalSubmissions] = useState<any[]>(submissions)

  useEffect(() => {
    setLocalSubmissions(submissions)
  }, [submissions])

  const handleStatusUpdate = async (submissionId: string, status: string) => {
    setIsUpdating(true)
    try {
      const success = await updateSubmissionStatus(submissionId, status)
      if (success) {
        // Update the local state to reflect the change
        submissions = submissions.map((submission) =>
          submission.id === submissionId ? { ...submission, status } : submission,
        )
      }
    } catch (error) {
      console.error("Error updating submission status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSubmission = async (submissionId: string) => {
    setIsUpdating(true)
    try {
      const success = await deleteSubmission(submissionId)
      if (success) {
        // Update the local state to remove the deleted submission
        setLocalSubmissions((prevSubmissions) => prevSubmissions.filter((submission) => submission.id !== submissionId))
        setDeletingSubmissionId(null)
      }
    } catch (error) {
      console.error("Error deleting submission:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Submitted
          </Badge>
        )
      case "processed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Processed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleWorkflowDecision = async (submissionId: string, decision: string) => {
    setIsUpdating(true)
    try {
      // TODO: Implement workflow decision logic
      // This should:
      // 1. Update submission with the decision
      // 2. Move submission to next workflow level if approved
      // 3. Update workflow state in database
      // 4. Notify relevant users
      // 5. Check if workflow is complete

      console.log(`Workflow decision: ${decision} for submission: ${submissionId}`)

      // Placeholder implementation - update submission status
      const success = await updateSubmissionStatus(submissionId, decision === "approve" ? "approved" : decision)
      if (success) {
        // Update local state
        setLocalSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, status: decision === "approve" ? "approved" : decision }
              : submission,
          ),
        )
      }
    } catch (error) {
      console.error("Error processing workflow decision:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Form Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Filter submissions by selected form if a form is selected
            const filteredSubmissions = selectedFormId
              ? localSubmissions.filter((submission) => submission.form_id === selectedFormId)
              : localSubmissions

            // TODO: Implement workflow-based filtering
            // This should filter submissions based on:
            // 1. Current user's workflow level permissions
            // 2. Submission's current workflow state
            // 3. Whether user has permission to see submissions at current level

            // For now, we'll show all submissions but add workflow decision buttons
            // In a real implementation, you'd need to:
            // - Get current user's workflow permissions
            // - Check submission's workflow state
            // - Filter based on user's level access

            return filteredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">
                  {selectedFormId ? "No submissions for selected form" : "No submissions yet"}
                </h3>
                <p className="mt-2 text-gray-500">
                  {selectedFormId
                    ? "This form hasn't received any submissions yet."
                    : "Submissions will appear here once forms are filled out."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {showFormColumn && <TableHead>Form</TableHead>}
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    // TODO: Get workflow information for this submission
                    // This should determine:
                    // - Current workflow level
                    // - Available decisions at this level
                    // - Whether current user can make decisions

                    const currentWorkflowLevel = submission.workflow_level || "Level 1" // Placeholder
                    const canMakeDecision = true // Placeholder - should check user permissions
                    const availableDecisions = ["approve", "reject", "request_changes"] // Placeholder

                    return (
                      <TableRow key={submission.id}>
                        {showFormColumn && <TableCell>{submission.forms?.title || "Unknown Form"}</TableCell>}
                        <TableCell>{submission.submitted_by || "Unknown User"}</TableCell>
                        <TableCell>{format(new Date(submission.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {currentWorkflowLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Workflow Decision Buttons */}
                            {canMakeDecision && submission.status === "submitted" && (
                              <div className="flex gap-1 mr-2">
                                {availableDecisions.includes("approve") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => handleWorkflowDecision(submission.id, "approve")}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                )}
                                {availableDecisions.includes("reject") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleWorkflowDecision(submission.id, "reject")}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Reject
                                  </Button>
                                )}
                                {availableDecisions.includes("request_changes") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                    onClick={() => handleWorkflowDecision(submission.id, "request_changes")}
                                  >
                                    Request Changes
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Regular Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setViewingSubmission(submission)
                                    setIsDialogOpen(true)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => setDeletingSubmissionId(submission.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Submission
                                </DropdownMenuItem>

                                {allowStatusUpdate && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(submission.id, "processed")}
                                      disabled={submission.status === "processed" || isUpdating}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      Mark as Processed
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handleStatusUpdate(submission.id, "rejected")}
                                      disabled={submission.status === "rejected" || isUpdating}
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      Mark as Rejected
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )
          })()}
        </CardContent>
      </Card>

      {/* Submission Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>

          {viewingSubmission && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Form</p>
                  <p className="font-medium">{viewingSubmission.forms?.title || "Unknown Form"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(viewingSubmission.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted By</p>
                  <p>{viewingSubmission.submitted_by || "Unknown User"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p>{format(new Date(viewingSubmission.created_at), "PPpp")}</p>
                </div>
              </div>

              <div className="border rounded-md p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-500 mb-4">Submitted Form Data</p>

                {/* Render the form in readonly mode */}
                <div className="grid grid-cols-3 gap-4 auto-rows-min bg-white p-4 rounded border">
                  {(() => {
                    // Extract elements from form_elements array
                    const formElements =
                      viewingSubmission.forms?.form_elements?.map((fe: any) => fe.elements_json) || []

                    if (formElements.length === 0) {
                      return (
                        <div className="col-span-3 text-center py-8">
                          <p className="text-gray-500">No form elements available</p>
                        </div>
                      )
                    }

                    return formElements.map((element: any) => {
                      const value = viewingSubmission.submission_data?.[element.id]

                      // Get the appropriate grid column span class based on size
                      const getColumnSpanClass = (size: 1 | 2 | 3) => {
                        switch (size) {
                          case 1:
                            return "col-span-1"
                          case 2:
                            return "col-span-2"
                          case 3:
                            return "col-span-3"
                          default:
                            return "col-span-1"
                        }
                      }

                      const renderReadonlyElement = () => {
                        const { type, properties } = element
                        const displayValue =
                          value === null || value === undefined || value === "" ? "No response" : value

                        switch (type) {
                          case "single-line":
                          case "multiline":
                          case "number":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                                  {displayValue === "No response" ? (
                                    <span className="text-gray-400 italic">{displayValue}</span>
                                  ) : (
                                    String(displayValue)
                                  )}
                                </div>
                              </div>
                            )

                          case "date":
                          case "date-time":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                                  {displayValue === "No response" ? (
                                    <span className="text-gray-400 italic">{displayValue}</span>
                                  ) : (
                                    format(new Date(String(displayValue)), type === "date" ? "PPP" : "PPpp")
                                  )}
                                </div>
                              </div>
                            )

                          case "yes-no":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 ${value === "yes" ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                                    >
                                      {value === "yes" && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                    </div>
                                    <span className="text-sm">Yes</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 ${value === "no" ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                                    >
                                      {value === "no" && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                    </div>
                                    <span className="text-sm">No</span>
                                  </div>
                                </div>
                              </div>
                            )

                          case "checkbox":
                            return (
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-4 h-4 border-2 rounded ${value ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}
                                >
                                  {value && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <label className="text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                              </div>
                            )

                          case "dropdown":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                                  {displayValue === "No response" ? (
                                    <span className="text-gray-400 italic">{displayValue}</span>
                                  ) : (
                                    // Find the label for the selected value
                                    properties.options?.find((opt: any) => opt.value === value)?.label ||
                                    String(displayValue)
                                  )}
                                </div>
                              </div>
                            )

                          case "slider":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="space-y-2">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{
                                        width: `${((Number(value) - (properties.min || 0)) / ((properties.max || 100) - (properties.min || 0))) * 100}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <div className="text-sm text-gray-600">Value: {displayValue}</div>
                                </div>
                              </div>
                            )

                          case "section":
                            return (
                              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                                <h4 className="font-semibold text-gray-700 mb-2">{properties.label}</h4>
                                <p className="text-sm text-gray-500">
                                  {properties.placeholder || "This is a section."}
                                </p>
                              </div>
                            )

                          case "table":
                            return (
                              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                                <h4 className="font-semibold text-gray-700 mb-2">{properties.label}</h4>
                                <p className="text-sm text-gray-500">{properties.placeholder || "This is a table."}</p>
                              </div>
                            )

                          case "attachment":
                          case "image":
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  {properties.label}
                                  {properties.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                                  {displayValue === "No response" ? (
                                    <span className="text-gray-400 italic">No file uploaded</span>
                                  ) : (
                                    <span className="text-blue-600">
                                      📎 {typeof value === "object" ? value?.name || "File uploaded" : "File uploaded"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )

                          default:
                            return (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">{properties.label}</label>
                                <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
                                  <span className="text-gray-400 italic">Unsupported element type: {type}</span>
                                </div>
                              </div>
                            )
                        }
                      }

                      return (
                        <div key={element.id} className={getColumnSpanClass(element.size || 1)}>
                          {renderReadonlyElement()}
                        </div>
                      )
                    })
                  })()}
                </div>

                {/* Raw data toggle for debugging */}
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Show raw data (for debugging)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-48 p-2 bg-white border rounded mt-2">
                    {JSON.stringify(viewingSubmission.submission_data, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSubmissionId} onOpenChange={(open) => !open && setDeletingSubmissionId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete this submission? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingSubmissionId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingSubmissionId && handleDeleteSubmission(deletingSubmissionId)}
              disabled={isUpdating}
            >
              {isUpdating ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
