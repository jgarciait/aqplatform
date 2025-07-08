"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Download,
  MapPin,
  FormInput
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getDocumentsForWorkspace, uploadDocument, uploadDocumentFile, deleteDocument } from "@/lib/document-service"
import { getDocumentsWithMappingsForWorkspace } from "@/lib/document-mapping-service"
import type { Document } from "@/lib/database.types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "date-fns"

export default function MappingPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspace")
  const { toast } = useToast()

  const [documents, setDocuments] = useState<(Document & { mapping?: any })[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    file: null as File | null,
  })

  // Load documents when component mounts
  useEffect(() => {
    if (workspaceId && user?.id) {
      loadDocuments()
    }
  }, [workspaceId, user?.id])

  const loadDocuments = async () => {
    if (!workspaceId) return

    try {
      const documentsWithMappings = await getDocumentsWithMappingsForWorkspace(workspaceId)
      setDocuments(documentsWithMappings)
    } catch (error) {
      console.error("Error loading documents:", error)
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !workspaceId || !user?.id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload file to storage
      const fileUrl = await uploadDocumentFile(uploadForm.file)
      if (!fileUrl) {
        throw new Error("Failed to upload file")
      }

      // Create document record
      const newDocument = await uploadDocument({
        name: uploadForm.name,
        description: uploadForm.description,
        file_url: fileUrl,
        workspace_id: workspaceId,
        owner_id: user.id,
      })

      if (newDocument) {
        toast({
          title: "Success",
          description: "Document uploaded successfully!",
        })
        setIsUploadDialogOpen(false)
        setUploadForm({ name: "", description: "", file: null })
        loadDocuments()
      } else {
        throw new Error("Failed to create document record")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    try {
      const success = await deleteDocument(documentId)
      if (success) {
        toast({
          title: "Success",
          description: "Document deleted successfully.",
        })
        loadDocuments()
      } else {
        throw new Error("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      })
    }
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600 mt-2">Workspace ID is required to access document mapping.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#001623" }}>
            Document Mapping
          </h1>
          <p className="text-gray-600 mt-2">
            Upload PDF documents and map form fields to create interactive electronic forms.
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-white" style={{ backgroundColor: "#042841" }}>
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload PDF Document</DialogTitle>
              <DialogDescription>
                Upload a PDF document to create field mappings and generate electronic forms.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Document Name</Label>
                <Input
                  id="name"
                  placeholder="Enter document name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Enter document description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleFileUpload}
                disabled={isUploading}
                className="text-white"
                style={{ backgroundColor: "#042841" }}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-4">
                  Upload your first PDF document to start creating field mappings.
                </p>
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="text-white"
                  style={{ backgroundColor: "#042841" }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          documents.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1" style={{ color: "#001623" }}>
                      {document.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                    </p>
                    {document.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{document.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  {document.mapping ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <MapPin className="w-3 h-3 mr-1" />
                      Mapped
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      Not Mapped
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {document.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(document.file_url!, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View PDF
                    </Button>
                  )}
                  
                  <Link
                    href={`/admin/mapping/builder?documentId=${document.id}&workspace=${workspaceId}`}
                  >
                    <Button size="sm" className="text-white" style={{ backgroundColor: "#042841" }}>
                      {document.mapping ? (
                        <>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Mapping
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Create Mapping
                        </>
                      )}
                    </Button>
                  </Link>

                  {document.mapping && (
                    <Link
                      href={`/admin/mapping/form-preview?documentId=${document.id}&workspace=${workspaceId}`}
                    >
                      <Button size="sm" variant="outline">
                        <FormInput className="w-4 h-4 mr-1" />
                        Form Preview
                      </Button>
                    </Link>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDocument(document.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Toaster />
    </div>
  )
} 