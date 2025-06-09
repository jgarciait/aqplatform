"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { deleteForm, getFormsForWorkspace } from "@/lib/form-service"
import type { Form } from "@/lib/database.types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { useWorkspace } from "@/contexts/workspace-context"
import { archiveSubmissionsForForm } from "@/lib/submission-service"

// Add these imports at the top of the file
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function FormsPage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)

  const { selectedWorkspace } = useWorkspace()

  // Add these state variables after the existing useState declarations
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<Form | null>(null)
  const [confirmName, setConfirmName] = useState("")
  const [deleteSubmissions, setDeleteSubmissions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchForms = async () => {
    if (!user?.id) return
    setLoading(true)

    let fetchedForms = []
    if (selectedWorkspace?.id) {
      // Get forms for the selected workspace
      fetchedForms = await getFormsForWorkspace(selectedWorkspace.id)
    } else {
      // If no workspace selected, show empty array
      fetchedForms = []
    }

    setForms(fetchedForms)
    setLoading(false)
  }

  useEffect(() => {
    fetchForms()
  }, [user?.id, selectedWorkspace?.id])

  // Replace the existing handleDelete function with this new implementation
  const handleDelete = (form: Form) => {
    setFormToDelete(form)
    setConfirmName("")
    setDeleteSubmissions(false)
    setDeleteDialogOpen(true)
  }

  // Add this new function after handleDelete
  const confirmDelete = async () => {
    if (!formToDelete || isDeleting) return

    setIsDeleting(true)

    try {
      // If not deleting submissions, archive them first
      if (!deleteSubmissions) {
        console.log("Archiving submissions for form:", formToDelete.id)
        await archiveSubmissionsForForm(formToDelete.id, `Form "${formToDelete.title}" was deleted by user ${user?.id}`)
        console.log("Submissions archived successfully")
      }

      // Then delete the form (and submissions if requested)
      console.log("Deleting form:", formToDelete.id)
      const success = await deleteForm(formToDelete.id, deleteSubmissions)

      if (success) {
        alert("Form deleted successfully!")
        setDeleteDialogOpen(false)
        fetchForms() // Re-fetch forms after deletion
      } else {
        alert("Failed to delete form.")
      }
    } catch (error) {
      console.error("Error during form deletion:", error)
      alert(`An error occurred while deleting the form: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Form Builder
          </h1>
          <p className="text-gray-600 mt-2">Create and manage your E-Forms with our drag-and-drop builder.</p>
        </div>
        <Link
          href={
            selectedWorkspace?.id ? `/admin/forms/builder?workspace=${selectedWorkspace.id}` : "/admin/forms/builder"
          }
        >
          <Button className="text-white" style={{ backgroundColor: "#042841" }}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Form
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" style={{ color: "#001623" }}>
            <FileText className="w-5 h-5 mr-2" />
            Your Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading forms...</div>
          ) : !selectedWorkspace ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspace selected</h3>
              <p className="text-gray-500 mb-4">Please select a workspace from the sidebar to view its forms.</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first form.</p>
              <Link
                href={
                  selectedWorkspace?.id
                    ? `/admin/forms/builder?workspace=${selectedWorkspace.id}`
                    : "/admin/forms/builder"
                }
              >
                <Button className="text-white" style={{ backgroundColor: "#042841" }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell>{form.description || "No description"}</TableCell>
                    <TableCell>{format(new Date(form.created_at), "PPP")}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/forms/builder?formId=${form.id}${selectedWorkspace?.id ? `&workspace=${selectedWorkspace.id}` : ""}`}
                      >
                        <Button variant="ghost" size="icon" className="mr-2">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      {/* Update the Button onClick to pass the entire form object */}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(form)} disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Add this Dialog component before the closing </div> of the main component */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the form "{formToDelete?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmName">
                Please type <span className="font-semibold">delete</span> to confirm
              </Label>
              <Input
                id="confirmName"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Type 'delete' to confirm"
                disabled={isDeleting}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteSubmissions"
                checked={deleteSubmissions}
                onCheckedChange={(checked) => setDeleteSubmissions(checked as boolean)}
                disabled={isDeleting}
              />
              <Label htmlFor="deleteSubmissions" className="text-sm">
                Permanently delete all submissions related to this form
              </Label>
            </div>
            {!deleteSubmissions && (
              <div className="text-sm text-gray-500 pl-6">
                If unchecked, submissions will be moved to the Archived Submissions section
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={confirmName.toLowerCase() !== "delete" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Form"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
