"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Eye, 
  Edit, 
  Plus, 
  FormInput 
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDocument } from "@/lib/document-service"
import { 
  loadDocumentMapping,
  createFormFromDocumentMapping,
  type DocumentMappingElement 
} from "@/lib/document-mapping-service"
import type { Document } from "@/lib/database.types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"

export default function FormPreviewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get("documentId")
  const workspaceId = searchParams.get("workspace")
  const { toast } = useToast()

  const [document, setDocument] = useState<Document | null>(null)
  const [mappingElements, setMappingElements] = useState<DocumentMappingElement[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Load document and mapping on mount
  useEffect(() => {
    if (documentId && user?.id) {
      loadDocumentAndMapping()
    }
  }, [documentId, user?.id])

  const loadDocumentAndMapping = async () => {
    if (!documentId) return

    try {
      // Load document
      const documentData = await getDocument(documentId)
      if (!documentData) {
        toast({
          title: "Error",
          description: "Document not found.",
          variant: "destructive",
        })
        return
      }
      setDocument(documentData)

      // Load mapping
      const mapping = await loadDocumentMapping(documentId)
      if (mapping) {
        setMappingElements(mapping.elements || [])
      } else {
        toast({
          title: "Error",
          description: "No mapping found for this document.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading document and mapping:", error)
      toast({
        title: "Error",
        description: "Failed to load document.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (elementId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [elementId]: value
    }))
  }

  const handleCreateForm = async () => {
    if (!document || !user?.id || !workspaceId) {
      toast({
        title: "Error",
        description: "Missing required information to create form.",
        variant: "destructive",
      })
      return
    }

    try {
      const mapping = await loadDocumentMapping(document.id)
      if (!mapping) {
        throw new Error("Failed to load mapping")
      }

      const form = await createFormFromDocumentMapping(
        mapping,
        `${document.name} - Electronic Form`,
        `Electronic form generated from document: ${document.name}`,
        user.id,
        workspaceId
      )

      if (form) {
        toast({
          title: "Success",
          description: "Electronic form created successfully!",
        })
        router.push(`/admin/forms/builder?formId=${form.id}&workspace=${workspaceId}`)
      } else {
        throw new Error("Failed to create form")
      }
    } catch (error) {
      console.error("Error creating form:", error)
      toast({
        title: "Error",
        description: "Failed to create electronic form.",
        variant: "destructive",
      })
    }
  }

  const renderFormElement = (element: DocumentMappingElement) => {
    const value = formData[element.id] || ""

    switch (element.type) {
      case "text":
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type={element.properties.inputType || "text"}
              placeholder={element.properties.placeholder}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.properties.required}
            />
          </div>
        )

      case "number":
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="number"
              placeholder={element.properties.placeholder}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.properties.required}
              min={element.properties.min}
              max={element.properties.max}
            />
          </div>
        )

      case "date":
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.properties.required}
            />
          </div>
        )

      case "checkbox":
        return (
          <div key={element.id} className="flex items-center space-x-2">
            <Checkbox
              id={element.id}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(element.id, checked)}
            />
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        )

      case "dropdown":
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={element.id}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.properties.required}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an option</option>
              {element.properties.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case "signature":
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="min-h-[120px] border border-gray-300 rounded-md bg-gray-50 p-4 flex items-center justify-center">
              <p className="text-sm text-gray-500">✍️ Interactive signature canvas (available in actual form)</p>
            </div>
          </div>
        )

      default:
        return (
          <div key={element.id} className="space-y-2">
            <Label htmlFor={element.id}>
              {element.label}
              {element.properties.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={element.id}
              placeholder={element.properties.placeholder}
              value={value}
              onChange={(e) => handleInputChange(element.id, e.target.value)}
              required={element.properties.required}
            />
          </div>
        )
    }
  }

  if (!documentId || !workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600 mt-2">Document ID and Workspace ID are required.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/admin/mapping?workspace=${workspaceId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Mapping
              </Button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#001623" }}>
                Form Preview
              </h1>
              {document && (
                <p className="text-sm text-gray-600">{document.name}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/admin/mapping/builder?documentId=${documentId}&workspace=${workspaceId}`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Mapping
              </Button>
            </Link>
            
            <Button
              onClick={handleCreateForm}
              className="text-white"
              style={{ backgroundColor: "#042841" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Electronic Form
            </Button>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FormInput className="w-5 h-5" />
              Electronic Form Preview
            </CardTitle>
            <p className="text-sm text-gray-600">
              This is how the electronic form will look when generated from your document mapping.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {mappingElements.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mapped fields</h3>
                <p className="text-gray-500 mb-4">
                  Create field mappings to see the form preview.
                </p>
                <Link href={`/admin/mapping/builder?documentId=${documentId}&workspace=${workspaceId}`}>
                  <Button className="text-white" style={{ backgroundColor: "#042841" }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Create Mapping
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-6">
                  {mappingElements
                    .sort((a, b) => a.position.y - b.position.y) // Sort by vertical position
                    .map(renderFormElement)}
                </div>
                
                <div className="flex justify-end pt-6 border-t">
                  <Button 
                    type="submit" 
                    className="text-white" 
                    style={{ backgroundColor: "#059669" }}
                  >
                    Submit Form
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </div>
  )
} 