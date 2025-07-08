"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Archive, RotateCcw, Trash2, Eye, ChevronDown, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getArchivedSubmissions, restoreArchivedSubmission, deleteSubmission } from "@/lib/submission-service"
import type { FormSubmission } from "@/lib/database.types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export default function ArchivedSubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmission | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showRawData, setShowRawData] = useState(false)

  const fetchArchivedSubmissions = async () => {
    if (!user?.id) return
    setLoading(true)

    try {
      const archivedSubmissions = await getArchivedSubmissions()
      setSubmissions(archivedSubmissions)
    } catch (error) {
      console.error("Error fetching archived submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedSubmissions()
  }, [user?.id])

  const handleRestore = async (submissionId: string) => {
    if (confirm("Are you sure you want to restore this submission?")) {
      const success = await restoreArchivedSubmission(submissionId)
      if (success) {
        alert("Submission restored successfully!")
        fetchArchivedSubmissions() // Refresh the list
      } else {
        alert("Failed to restore submission.")
      }
    }
  }

  const handleDelete = async (submissionId: string) => {
    if (confirm("Are you sure you want to permanently delete this submission? This action cannot be undone.")) {
      const success = await deleteSubmission(submissionId)
      if (success) {
        alert("Submission deleted permanently!")
        fetchArchivedSubmissions() // Refresh the list
      } else {
        alert("Failed to delete submission.")
      }
    }
  }

  const getArchiveMetadata = (submission: FormSubmission) => {
    const data = submission.submission_data as any
    return data?._archive_metadata || null
  }

  const renderFormElement = (element: any, value: any) => {
    const displayValue = value === null || value === undefined || value === "" ? "No response" : value

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

    const renderInput = () => {
      switch (element.type) {
        case "single-line":
        case "multiline":
        case "number":
        case "text":
          return (
            <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {displayValue === "No response" ? (
                <span className="text-gray-400 italic">{displayValue}</span>
              ) : (
                String(displayValue)
              )}
            </div>
          )

        case "date":
        case "date-time":
          return (
            <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {displayValue === "No response" ? (
                <span className="text-gray-400 italic">{displayValue}</span>
              ) : (
                format(new Date(String(displayValue)), element.type === "date" ? "PPP" : "PPpp")
              )}
            </div>
          )

        case "yes-no":
          return (
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
          )

        case "checkbox":
          return (
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 border-2 rounded ${value ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
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
              <span className="text-sm">{value ? "Checked" : "Unchecked"}</span>
            </div>
          )

        case "dropdown":
          return (
            <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {displayValue === "No response" ? (
                <span className="text-gray-400 italic">{displayValue}</span>
              ) : (
                // Find the label for the selected value
                element.properties?.options?.find((opt: any) => opt.value === value)?.label || String(displayValue)
              )}
            </div>
          )

        case "slider":
          return (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${((Number(value) - (element.properties?.min || 0)) / ((element.properties?.max || 100) - (element.properties?.min || 0))) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">Value: {displayValue}</div>
            </div>
          )

        case "section":
          return (
            <div className="border border-dashed border-gray-300 p-4 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">{element.properties?.label}</h4>
              <p className="text-sm text-gray-500">{element.properties?.placeholder || "This is a section."}</p>
            </div>
          )

        case "table":
          return (
            <div className="border border-dashed border-gray-300 p-4 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">{element.properties?.label}</h4>
              <p className="text-sm text-gray-500">{element.properties?.placeholder || "This is a table."}</p>
            </div>
          )

        case "signature":
          return (
            <div className="min-h-[120px] border border-gray-300 rounded-md bg-white p-2">
              {displayValue === "No response" || !value ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-gray-400 italic">No signature provided</span>
                </div>
              ) : (
                <img 
                  src={value} 
                  alt="Signature" 
                  className="max-w-full max-h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
          )

        case "attachment":
        case "image":
          return (
            <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {displayValue === "No response" ? (
                <span className="text-gray-400 italic">No file uploaded</span>
              ) : (
                <span className="text-blue-600">
                  📎 {typeof value === "object" ? value?.name || "File uploaded" : "File uploaded"}
                </span>
              )}
            </div>
          )

        default:
          return (
            <div className="min-h-[40px] px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              <span className="text-gray-400 italic">Unsupported element type: {element.type}</span>
            </div>
          )
      }
    }

    return (
      <div className={getColumnSpanClass(element.size || 1)}>
        <div className="space-y-2">
          {element.type !== "checkbox" && element.type !== "section" && element.type !== "table" && (
            <Label className="block text-sm font-medium text-gray-700">
              {element.properties?.label || element.label || "Untitled Field"}
              {element.properties?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {renderInput()}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Archived Submissions
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage submissions from deleted forms. You can restore or permanently delete them.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: "#001623" }}>
            <Archive className="w-5 h-5 mr-2" />
            Archived Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading archived submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No archived submissions</h3>
              <p className="text-gray-500">Submissions from deleted forms will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Title</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const archiveMetadata = getArchiveMetadata(submission)
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {archiveMetadata?.formTitle || (submission as any).forms?.title || "Unknown Form"}
                      </TableCell>
                      <TableCell>{submission.submitted_by}</TableCell>
                      <TableCell>
                        {archiveMetadata?.archivedAt
                          ? format(new Date(archiveMetadata.archivedAt), "PPP")
                          : format(new Date(submission.updated_at), "PPP")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{archiveMetadata?.reason || "Form deleted"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Archived</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => {
                            setViewingSubmission(submission)
                            setIsDialogOpen(true)
                            setShowRawData(false)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          onClick={() => handleRestore(submission.id)}
                        >
                          <RotateCcw className="h-4 w-4 text-green-600" />
                          <span className="sr-only">Restore</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(submission.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete Permanently</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>

          {viewingSubmission && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Form</h4>
                  <p className="text-base font-medium">
                    {getArchiveMetadata(viewingSubmission)?.formTitle || "Unknown Form"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                  <Badge variant="secondary">Archived</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h4>
                  <p className="text-sm text-gray-700">{viewingSubmission.submitted_by}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                  <p className="text-sm text-gray-700">
                    {format(new Date(viewingSubmission.created_at), "MMM d, yyyy, h:mm:ss a")}
                  </p>
                </div>
              </div>

              {/* Submitted Form Data */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Submitted Form Data</h4>

                {(() => {
                  const submissionData = { ...(viewingSubmission.submission_data as any) }
                  const archiveMetadata = submissionData._archive_metadata
                  delete submissionData._archive_metadata // Remove internal metadata

                  const formElements = archiveMetadata?.formElements || []

                  if (formElements.length > 0) {
                    return (
                      <div className="bg-white p-6 rounded-lg border">
                        <div className="grid grid-cols-3 gap-4 auto-rows-min">
                          {formElements.map((element: any, index: number) => {
                            const value = submissionData[element.id]
                            return renderFormElement(element, value)
                          })}
                        </div>
                      </div>
                    )
                  }

                  // Enhanced fallback: try to match submission data keys with potential labels
                  return (
                    <div className="bg-white p-6 rounded-lg border">
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(submissionData).map(([key, value], index) => {
                          // Create a pseudo-element for rendering
                          const pseudoElement = {
                            id: key,
                            type: "single-line", // Default type
                            size: 1,
                            properties: {
                              label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
                            },
                          }
                          return renderFormElement(pseudoElement, value)
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> This submission was created before form structure preservation was
                          implemented. Field types and layouts may not be accurate.
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* Show raw data toggle */}
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {showRawData ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                    Show raw data (for debugging)
                  </Button>

                  {showRawData && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-md border">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(
                          (() => {
                            const data = { ...(viewingSubmission.submission_data as any) }
                            delete data._archive_metadata
                            return data
                          })(),
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {viewingSubmission && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    handleRestore(viewingSubmission.id)
                    setIsDialogOpen(false)
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(viewingSubmission.id)
                    setIsDialogOpen(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
