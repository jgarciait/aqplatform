"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Type, 
  Hash, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  PenTool, 
  Save, 
  Eye, 
  Trash2,
  Plus,
  X,
  Move,
  Maximize2,
  Copy
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getDocument, getDocumentSignedUrl } from "@/lib/document-service"
import { 
  saveDocumentMapping, 
  loadDocumentMapping,
  createFormFromDocumentMapping,
  type DocumentMappingElement 
} from "@/lib/document-mapping-service"
import type { Document } from "@/lib/database.types"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "date-fns"
import dynamic from 'next/dynamic'

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import('@/components/pdf-viewer').then(mod => ({ default: mod.PDFViewer })), {
  ssr: false,
  loading: () => (
    <div className="relative flex items-center justify-center bg-gray-100" style={{ minHeight: '800px' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading PDF viewer...</p>
      </div>
    </div>
  )
})

export default function DocumentMappingBuilderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const documentId = searchParams.get("documentId")
  const workspaceId = searchParams.get("workspace")
  const { toast } = useToast()

  const [document, setDocument] = useState<Document | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [mappingElements, setMappingElements] = useState<DocumentMappingElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [mappingId, setMappingId] = useState<string | null>(null)
  const [selectedFieldType, setSelectedFieldType] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragElement, setDragElement] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // New states for element interaction
  const [isMovingElement, setIsMovingElement] = useState(false)
  const [movingElementId, setMovingElementId] = useState<string | null>(null)
  const [elementDragStart, setElementDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizingElementId, setResizingElementId] = useState<string | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  
  // Grid and snap states
  const [gridEnabled, setGridEnabled] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [guidesEnabled, setGuidesEnabled] = useState(true)
  
  // Alignment guides states
  const [activeGuides, setActiveGuides] = useState<{
    horizontal: number[]
    vertical: number[]
  }>({ horizontal: [], vertical: [] })
  
  // Default heights for field types
  const [defaultHeights, setDefaultHeights] = useState<Record<string, number>>({
    text: 40,
    number: 40,
    date: 40,
    checkbox: 24,
    dropdown: 40,
    signature: 100
  })
  
  const pdfViewerRef = useRef<HTMLDivElement>(null)

  const fieldTypes = [
    { id: "text", label: "Text Field", icon: Type },
    { id: "number", label: "Number", icon: Hash },
    { id: "date", label: "Date", icon: Calendar },
    { id: "checkbox", label: "Checkbox", icon: CheckSquare },
    { id: "dropdown", label: "Dropdown", icon: ChevronDown },
    { id: "signature", label: "Signature", icon: PenTool },
  ]

  // Grid configuration
  const GRID_SIZE = 12 // 12px grid
  const GUIDE_TOLERANCE = 3 // 3px tolerance for alignment detection
  
  // Helper function to snap values to grid
  const snapToGrid = (value: number): number => {
    if (!snapEnabled) return value
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }
  
  // Helper function to snap position to grid
  const snapPositionToGrid = (x: number, y: number): { x: number; y: number } => {
    return {
      x: snapToGrid(x),
      y: snapToGrid(y)
    }
  }
  
  // Helper function to snap size to grid
  const snapSizeToGrid = (width: number, height: number): { width: number; height: number } => {
    return {
      width: snapToGrid(width),
      height: snapToGrid(height)
    }
  }
  
  // Helper function to detect alignment guides
  const detectAlignmentGuides = (movingElement: any, newX: number, newY: number) => {
    if (!guidesEnabled || !movingElement) return { horizontal: [], vertical: [] }
    
    const otherElements = mappingElements.filter(el => 
      el.id !== movingElement.id && el.page === currentPage
    )
    
    const horizontalGuides: number[] = []
    const verticalGuides: number[] = []
    
    otherElements.forEach(element => {
      // Check vertical alignment (same X coordinate)
      const elementCenterX = element.position.x + element.size.width / 2
      const movingCenterX = newX + movingElement.size.width / 2
      
      if (Math.abs(elementCenterX - movingCenterX) <= GUIDE_TOLERANCE) {
        verticalGuides.push(elementCenterX)
      }
      
      // Check left edge alignment
      if (Math.abs(element.position.x - newX) <= GUIDE_TOLERANCE) {
        verticalGuides.push(element.position.x)
      }
      
      // Check right edge alignment
      const elementRightX = element.position.x + element.size.width
      const movingRightX = newX + movingElement.size.width
      if (Math.abs(elementRightX - movingRightX) <= GUIDE_TOLERANCE) {
        verticalGuides.push(elementRightX)
      }
      
      // Check horizontal alignment (same Y coordinate)
      const elementCenterY = element.position.y + element.size.height / 2
      const movingCenterY = newY + movingElement.size.height / 2
      
      if (Math.abs(elementCenterY - movingCenterY) <= GUIDE_TOLERANCE) {
        horizontalGuides.push(elementCenterY)
      }
      
      // Check top edge alignment
      if (Math.abs(element.position.y - newY) <= GUIDE_TOLERANCE) {
        horizontalGuides.push(element.position.y)
      }
      
      // Check bottom edge alignment
      const elementBottomY = element.position.y + element.size.height
      const movingBottomY = newY + movingElement.size.height
      if (Math.abs(elementBottomY - movingBottomY) <= GUIDE_TOLERANCE) {
        horizontalGuides.push(elementBottomY)
      }
    })
    
    return {
      horizontal: [...new Set(horizontalGuides)], // Remove duplicates
      vertical: [...new Set(verticalGuides)] // Remove duplicates
    }
  }
  
  // Helper function to apply snap to alignment guides
  const snapToGuides = (element: any, newX: number, newY: number, guides: any) => {
    if (!guidesEnabled || !element) return { x: newX, y: newY }
    
    let snappedX = newX
    let snappedY = newY
    
    // Snap to vertical guides
    if (guides.vertical.length > 0) {
      const elementCenterX = newX + element.size.width / 2
      const closestVerticalGuide = guides.vertical.reduce((prev: number, curr: number) => 
        Math.abs(curr - elementCenterX) < Math.abs(prev - elementCenterX) ? curr : prev
      )
      
      // Check if we should snap to center, left edge, or right edge
      const leftEdgeDiff = Math.abs(closestVerticalGuide - newX)
      const centerDiff = Math.abs(closestVerticalGuide - elementCenterX)
      const rightEdgeDiff = Math.abs(closestVerticalGuide - (newX + element.size.width))
      
      if (centerDiff <= GUIDE_TOLERANCE) {
        snappedX = closestVerticalGuide - element.size.width / 2
      } else if (leftEdgeDiff <= GUIDE_TOLERANCE) {
        snappedX = closestVerticalGuide
      } else if (rightEdgeDiff <= GUIDE_TOLERANCE) {
        snappedX = closestVerticalGuide - element.size.width
      }
    }
    
    // Snap to horizontal guides
    if (guides.horizontal.length > 0) {
      const elementCenterY = newY + element.size.height / 2
      const closestHorizontalGuide = guides.horizontal.reduce((prev: number, curr: number) => 
        Math.abs(curr - elementCenterY) < Math.abs(prev - elementCenterY) ? curr : prev
      )
      
      // Check if we should snap to center, top edge, or bottom edge
      const topEdgeDiff = Math.abs(closestHorizontalGuide - newY)
      const centerDiff = Math.abs(closestHorizontalGuide - elementCenterY)
      const bottomEdgeDiff = Math.abs(closestHorizontalGuide - (newY + element.size.height))
      
      if (centerDiff <= GUIDE_TOLERANCE) {
        snappedY = closestHorizontalGuide - element.size.height / 2
      } else if (topEdgeDiff <= GUIDE_TOLERANCE) {
        snappedY = closestHorizontalGuide
      } else if (bottomEdgeDiff <= GUIDE_TOLERANCE) {
        snappedY = closestHorizontalGuide - element.size.height
      }
    }
    
    return { x: snappedX, y: snappedY }
  }

  // Load document and mapping on mount
  useEffect(() => {
    if (documentId && user?.id) {
      loadDocumentAndMapping()
    }
  }, [documentId, user?.id])

  // Keyboard navigation for pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        handlePageChange(currentPage - 1)
      } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
        handlePageChange(currentPage + 1)
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElementId) {
        // Ctrl+D or Cmd+D to duplicate selected element
        e.preventDefault()
        duplicateElement(selectedElementId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, selectedElementId])

  // Global mouse up handler for drag operations
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMovingElement || isResizing) {
        handleMouseUp()
      }
    }

    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isMovingElement, isResizing])

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

      // Get signed URL for the PDF file
      console.log("📄 Document data:", documentData)
      if (documentData.file_url) {
        console.log("📁 File URL found:", documentData.file_url)
        const signedUrl = await getDocumentSignedUrl(documentData.file_url, 3600) // 1 hour expiry
        console.log("🔗 Generated signed URL:", signedUrl)
        if (signedUrl) {
          setDocumentUrl(signedUrl)
          // Total pages will be set by PDFViewer component onPageCountChange
        } else {
          console.error("❌ Failed to generate signed URL")
          toast({
            title: "Warning",
            description: "Could not load PDF preview.",
            variant: "destructive",
          })
        }
      } else {
        console.error("❌ No file URL found in document")
      }

      // Load existing mapping if it exists
      const mapping = await loadDocumentMapping(documentId)
      if (mapping) {
        setMappingElements(mapping.elements || [])
        setMappingId(mapping.id)
        setLastUpdated(new Date(mapping.updated_at))
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

  const handleFieldTypeSelect = (fieldType: any) => {
    setSelectedFieldType(fieldType)
    toast({
      title: "Field Selected",
      description: `Click on the PDF to place a ${fieldType.label} or drag and drop`,
    })
  }

  const handleDragStart = (e: React.DragEvent, fieldType: any) => {
    setIsDragging(true)
    setDragElement(fieldType)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragElement(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!dragElement || !pdfViewerRef.current) return

    const rect = pdfViewerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    createMappingElement(dragElement, x, y)
    setIsDragging(false)
    setDragElement(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  const handlePdfClick = (e: React.MouseEvent) => {
    if (!selectedFieldType || !pdfViewerRef.current) return

    const rect = pdfViewerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    createMappingElement(selectedFieldType, x, y)
    setSelectedFieldType(null) // Clear selection after placing
  }

  const createMappingElement = (fieldType: any, x: number, y: number) => {
    // Center the element on the click point
    const elementWidth = fieldType.id === 'signature' ? 300 : 200 // Larger width for signature
    const elementHeight = defaultHeights[fieldType.id] || 40 // Use configurable default height
    const centeredX = x - (elementWidth / 2)
    const centeredY = y - (elementHeight / 2)
    
    // Apply snap to grid if enabled
    const snappedPosition = snapPositionToGrid(centeredX, centeredY)
    const snappedSize = snapSizeToGrid(elementWidth, elementHeight)
    
    // Create new mapping element
    const newElement: DocumentMappingElement = {
      id: `element-${Date.now()}`,
      type: fieldType.id,
      label: fieldType.label,
      position: { x: snappedPosition.x, y: snappedPosition.y },
      size: { width: snappedSize.width, height: snappedSize.height },
      page: currentPage, // Use current page
      properties: {
        label: fieldType.label,
        placeholder: fieldType.id === 'signature' ? 'Click to sign here' : `Enter ${fieldType.label.toLowerCase()}`,
        required: false,
      },
    }

    setMappingElements([...mappingElements, newElement])
    setSelectedElementId(newElement.id)
    
    toast({
      title: "Field Added",
      description: `${fieldType.label} added to page ${currentPage + 1}`,
    })
  }

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
      setSelectedElementId(null) // Clear selection when changing pages
    }
  }, [totalPages])

  const handlePageCountChange = useCallback((pageCount: number) => {
    setTotalPages(pageCount)
    // If current page is beyond total pages, reset to first page
    if (currentPage >= pageCount) {
      setCurrentPage(0)
    }
  }, [currentPage])

  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId)
  }

  const handleRemoveElement = (elementId: string) => {
    setMappingElements(mappingElements.filter(el => el.id !== elementId))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const handleUpdateElement = (elementId: string, updates: Partial<DocumentMappingElement>) => {
    setMappingElements(mappingElements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ))
  }

  // Element movement handlers
  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (selectedFieldType || isDragging || isResizing) return
    
    e.stopPropagation()
    const rect = pdfViewerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsMovingElement(true)
    setMovingElementId(elementId)
    setSelectedElementId(elementId)
    setElementDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!pdfViewerRef.current) return
    const rect = pdfViewerRef.current.getBoundingClientRect()

    if (isMovingElement && movingElementId && elementDragStart) {
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const deltaX = currentX - elementDragStart.x
      const deltaY = currentY - elementDragStart.y

      const element = mappingElements.find(el => el.id === movingElementId)
      if (element) {
        const rawNewX = Math.max(0, Math.min(900 - element.size.width, element.position.x + deltaX))
        const rawNewY = Math.max(0, element.position.y + deltaY)
        
        // Detect alignment guides
        const guides = detectAlignmentGuides(element, rawNewX, rawNewY)
        setActiveGuides(guides)
        
        // Apply snap to guides first (higher priority), then grid
        let finalPosition = snapToGuides(element, rawNewX, rawNewY, guides)
        
        // If no guide snapping occurred, apply grid snap
        if (finalPosition.x === rawNewX && finalPosition.y === rawNewY) {
          finalPosition = snapPositionToGrid(rawNewX, rawNewY)
        }
        
        handleUpdateElement(movingElementId, {
          position: { x: finalPosition.x, y: finalPosition.y }
        })
      }
      
      setElementDragStart({ x: currentX, y: currentY })
    }

    if (isResizing && resizingElementId && elementDragStart && resizeHandle) {
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const element = mappingElements.find(el => el.id === resizingElementId)
      
      if (element) {
        let newSize = { ...element.size }
        let newPosition = { ...element.position }

        switch (resizeHandle) {
          case 'se': // Southeast (bottom-right)
            newSize.width = Math.max(50, currentX - element.position.x)
            newSize.height = Math.max(20, currentY - element.position.y)
            break
          case 'sw': // Southwest (bottom-left)
            const newWidth = Math.max(50, element.position.x + element.size.width - currentX)
            newPosition.x = element.position.x + element.size.width - newWidth
            newSize.width = newWidth
            newSize.height = Math.max(20, currentY - element.position.y)
            break
          case 'ne': // Northeast (top-right)
            newSize.width = Math.max(50, currentX - element.position.x)
            const newHeight = Math.max(20, element.position.y + element.size.height - currentY)
            newPosition.y = element.position.y + element.size.height - newHeight
            newSize.height = newHeight
            break
          case 'nw': // Northwest (top-left)
            const newWidthNW = Math.max(50, element.position.x + element.size.width - currentX)
            const newHeightNW = Math.max(20, element.position.y + element.size.height - currentY)
            newPosition.x = element.position.x + element.size.width - newWidthNW
            newPosition.y = element.position.y + element.size.height - newHeightNW
            newSize.width = newWidthNW
            newSize.height = newHeightNW
            break
        }

        // Apply snap to grid if enabled
        const snappedSize = snapSizeToGrid(newSize.width, newSize.height)
        const snappedPosition = snapPositionToGrid(newPosition.x, newPosition.y)

        handleUpdateElement(resizingElementId, {
          size: snappedSize,
          position: snappedPosition
        })
      }
    }
  }

  const handleMouseUp = () => {
    setIsMovingElement(false)
    setMovingElementId(null)
    setElementDragStart(null)
    setIsResizing(false)
    setResizingElementId(null)
    setResizeHandle(null)
    // Clear alignment guides when stopping movement
    setActiveGuides({ horizontal: [], vertical: [] })
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.stopPropagation()
    const rect = pdfViewerRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsResizing(true)
    setResizingElementId(elementId)
    setResizeHandle(handle)
    setElementDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleSaveMapping = async () => {
    if (!documentId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing document ID or user authentication.",
        variant: "destructive",
      })
      return
    }

    try {
      const savedMapping = await saveDocumentMapping(documentId, mappingElements, mappingId || undefined)
      
      if (savedMapping) {
        setMappingId(savedMapping.id)
        setLastUpdated(new Date(savedMapping.updated_at))
        toast({
          title: "Success",
          description: "Document mapping saved successfully!",
        })
      } else {
        throw new Error("Failed to save mapping")
      }
    } catch (error) {
      console.error("Error saving mapping:", error)
      toast({
        title: "Error",
        description: "Failed to save document mapping.",
        variant: "destructive",
      })
    }
  }

  const handleCreateForm = async () => {
    if (!document || !mappingId || !user?.id || !workspaceId) {
      toast({
        title: "Error",
        description: "Please save the mapping first before creating a form.",
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

  // Duplicate element function
  const duplicateElement = (elementId: string) => {
    const element = mappingElements.find(el => el.id === elementId)
    if (!element) return
    
    // Create duplicate with offset position
    const offset = 20 // 20px offset
    let newX = element.position.x + offset
    let newY = element.position.y + offset
    
    // Apply snap to grid if enabled
    const snappedPosition = snapPositionToGrid(newX, newY)
    
    // Ensure it stays within bounds
    newX = Math.max(0, Math.min(900 - element.size.width, snappedPosition.x))
    newY = Math.max(0, snappedPosition.y)
    
    const duplicatedElement: DocumentMappingElement = {
      ...element,
      id: `element-${Date.now()}`, // New unique ID
      position: { x: newX, y: newY },
      properties: {
        ...element.properties
      }
    }
    
    setMappingElements([...mappingElements, duplicatedElement])
    setSelectedElementId(duplicatedElement.id)
    
    toast({
      title: "Field Duplicated",
      description: `${element.label} has been duplicated`,
    })
  }

  const selectedElement = mappingElements.find(el => el.id === selectedElementId)

  if (!documentId || !workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600 mt-2">Document ID and Workspace ID are required.</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-normal text-gray-700">
              Document Mapping Builder
            </h1>
            {lastUpdated && (
              <Badge variant="outline" className="text-xs">
                Last saved {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleSaveMapping}
              size="sm"
              className="text-white text-xs"
              style={{ backgroundColor: "#042841" }}
            >
              <Save className="w-3 h-3 mr-1" />
              Save Mapping
            </Button>
            
            {mappingId && (
              <Button
                onClick={handleCreateForm}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create Electronic Form
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Field Types */}
        <div className="w-64 border-r bg-white p-4 flex-shrink-0 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Field Types</h3>
          <div className="space-y-2">
            {fieldTypes.map((fieldType) => (
              <div
                key={fieldType.id}
                draggable
                onDragStart={(e) => handleDragStart(e, fieldType)}
                onDragEnd={handleDragEnd}
                onClick={() => handleFieldTypeSelect(fieldType)}
                className={`flex items-center p-3 border rounded-lg cursor-grab hover:bg-gray-50 active:cursor-grabbing transition-colors ${
                  selectedFieldType?.id === fieldType.id ? 'bg-blue-100 border-blue-300' : ''
                }`}
              >
                <fieldType.icon className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-sm font-medium">{fieldType.label}</span>
              </div>
            ))}
          </div>
          
          {/* Grid and Snap Controls */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Grid & Snap</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={gridEnabled}
                  onChange={(e) => setGridEnabled(e.target.checked)}
                  className="w-3 h-3 text-blue-600 rounded"
                />
                <span>Show Grid (12px)</span>
              </label>
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                  className="w-3 h-3 text-blue-600 rounded"
                />
                <span>Snap to Grid</span>
              </label>
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={guidesEnabled}
                  onChange={(e) => setGuidesEnabled(e.target.checked)}
                  className="w-3 h-3 text-blue-600 rounded"
                />
                <span>Alignment Guides</span>
              </label>
            </div>
          </div>
          
          {/* Default Heights Configuration */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Default Heights</h4>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => (
                <div key={fieldType.id} className="flex items-center justify-between">
                  <label className="text-xs text-gray-600 flex items-center">
                    <fieldType.icon className="w-3 h-3 mr-1" />
                    {fieldType.label}
                  </label>
                  <input
                    type="number"
                    value={defaultHeights[fieldType.id] || 40}
                    onChange={(e) => setDefaultHeights(prev => ({
                      ...prev,
                      [fieldType.id]: parseInt(e.target.value) || 40
                    }))}
                    className="w-12 h-6 text-xs px-1 border border-gray-300 rounded"
                    min="20"
                    max="200"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {selectedFieldType && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedFieldType.label}</strong> selected. Click on the PDF (center placement) or drag and drop to place it.
              </p>
            </div>
          )}

          {!selectedFieldType && !isMovingElement && !isResizing && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-medium">💡 Tips:</p>
                <p>• Select a field type above</p>
                <p>• Click = center placement on PDF</p>
                <p>• Drag placed fields to move them</p>
                <p>• Use corner handles to resize</p>
                <p>• Click red × to delete</p>
              </div>
            </div>
          )}

          {(isMovingElement || isResizing) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center">
                {isMovingElement && <Move className="w-4 h-4 mr-1" />}
                {isResizing && <Maximize2 className="w-4 h-4 mr-1" />}
                {isMovingElement ? 'Moving field...' : 'Resizing field...'}
              </p>
            </div>
          )}
          
          {mappingElements.length > 0 && (
            <div className="mt-6 flex-1 flex flex-col">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Mapped Fields ({mappingElements.length})
              </h3>
              <div className="space-y-1 flex-1 max-h-60 overflow-y-auto">
                {mappingElements.map((element) => (
                  <div
                    key={element.id}
                    className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      selectedElementId === element.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                    } ${element.page === currentPage ? 'border-l-2 border-blue-400' : 'border border-transparent'}`}
                    onClick={() => {
                      handleElementClick(element.id)
                      if (element.page !== currentPage) {
                        handlePageChange(element.page)
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block font-medium">{element.label}</span>
                      <div className="flex items-center text-xs text-gray-500 space-x-2">
                        <span>Page {element.page + 1}</span>
                        <span>•</span>
                        <span>{element.size.width}×{element.size.height}</span>
                        {selectedElementId === element.id && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Selected</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveElement(element.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="flex-1 bg-gray-100 flex flex-col overflow-hidden">
          {/* Fixed Navigation Header */}
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex-shrink-0 shadow-sm">
            {/* Page Navigation */}
            <div className="flex items-center justify-center mb-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="text-xs px-2 py-1 h-7"
              >
                ← Previous
              </Button>
              
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border text-xs">
                <span className="text-gray-600">Page</span>
                <span className="font-medium">{currentPage + 1}</span>
                <span className="text-gray-600">of</span>
                <span className="font-medium">{totalPages}</span>
                {mappingElements.filter(el => el.page === currentPage).length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                    {mappingElements.filter(el => el.page === currentPage).length} fields
                  </Badge>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="text-xs px-2 py-1 h-7"
              >
                Next →
              </Button>
            </div>
          </div>

          {/* Scrollable PDF Container */}
          <div className="flex-1 overflow-auto p-4 pb-20">

          <div
            ref={pdfViewerRef}
            onClick={handlePdfClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`relative bg-white border rounded-lg mx-auto ${
              isMovingElement || isResizing ? 'cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{ 
              width: '900px', 
              maxWidth: '100%',
              minHeight: 'fit-content' // Allow natural height based on PDF content
            }}
          >
            {/* PDF Background */}
            {documentUrl ? (
              <PDFViewer
                url={documentUrl}
                currentPage={currentPage}
                onPageCountChange={handlePageCountChange}
                className="w-full h-auto"
                style={{ minHeight: 'auto' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">404</p>
                  <p>This page could not be found.</p>
                  {document?.file_url && (
                    <p className="text-sm mt-2 text-gray-400">Loading PDF preview...</p>
                  )}
                </div>
              </div>
            )}

            {/* Grid Overlay */}
            {gridEnabled && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                <svg
                  className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(100, 116, 139, 0.25) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(100, 116, 139, 0.25) 1px, transparent 1px)
                    `,
                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                  }}
                />
              </div>
            )}

            {/* Alignment Guides Overlay */}
            {guidesEnabled && isMovingElement && (activeGuides.horizontal.length > 0 || activeGuides.vertical.length > 0) && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
                {/* Horizontal guides */}
                {activeGuides.horizontal.map((y, index) => (
                  <div
                    key={`h-${index}`}
                    className="absolute border-t border-blue-400"
                    style={{
                      left: 0,
                      right: 0,
                      top: y,
                      borderColor: 'rgba(59, 130, 246, 0.8)',
                      borderWidth: '1px',
                      boxShadow: '0 0 3px rgba(59, 130, 246, 0.4)'
                    }}
                  />
                ))}
                {/* Vertical guides */}
                {activeGuides.vertical.map((x, index) => (
                  <div
                    key={`v-${index}`}
                    className="absolute border-l border-blue-400"
                    style={{
                      left: x,
                      top: 0,
                      bottom: 0,
                      borderColor: 'rgba(59, 130, 246, 0.8)',
                      borderWidth: '1px',
                      boxShadow: '0 0 3px rgba(59, 130, 246, 0.4)'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Mapping Elements Overlay - Only show elements for current page */}
            {mappingElements
              .filter(element => element.page === currentPage)
              .map((element) => (
                <div
                  key={element.id}
                  className={`absolute border-2 bg-blue-50/80 ${
                    selectedFieldType || isDragging ? 'pointer-events-none' : ''
                  } ${
                    selectedElementId === element.id 
                      ? 'border-blue-500 bg-blue-100/80' 
                      : 'border-blue-300 hover:border-blue-400'
                  } ${
                    isMovingElement && movingElementId === element.id ? 'shadow-lg' : ''
                  }`}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    cursor: isMovingElement || isResizing ? 'grabbing' : 'grab',
                    zIndex: 20 // Above grid overlay
                  }}
                  onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!selectedFieldType && !isDragging && !isMovingElement) {
                      handleElementClick(element.id)
                    }
                  }}
                >
                  {/* Element Content */}
                  {element.type === 'signature' ? (
                    <div className="relative w-full h-full bg-gray-50 border border-dashed border-gray-400 rounded flex items-center justify-center">
                      {/* Signature indicator */}
                      <div className="flex flex-col items-center justify-center text-gray-600">
                        <div className="w-8 h-8 bg-gray-400 rounded-full mb-2 flex items-center justify-center">
                          <PenTool className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium">Signature</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 text-xs font-medium text-blue-800 truncate pointer-events-none">
                      {element.label}
                    </div>
                  )}
                  
                  {/* Delete Button - Only show when selected */}
                  {selectedElementId === element.id && !isMovingElement && !isResizing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      style={{ fontSize: '12px' }}
                    >
                      ×
                    </button>
                  )}
                  
                  {/* Resize Handles - Only show when selected */}
                  {selectedElementId === element.id && !isMovingElement && !selectedFieldType && !isDragging && (
                    <>
                      {/* Corner resize handles */}
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"
                        onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                      />
                    </>
                  )}
                </div>
              ))}

            {/* Drop zone and click indicator for field placement */}
            {(isDragging || selectedFieldType) && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50/20 pointer-events-none flex items-center justify-center" style={{ zIndex: 16 }}>
                <div className="text-blue-600 font-medium">
                  {isDragging && dragElement ? 
                    `Drop to place ${dragElement.label}` : 
                    selectedFieldType ? `Click to place ${selectedFieldType.label}` : ''
                  }
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l bg-white p-4 flex-shrink-0 overflow-y-auto">
          {/* Document Info */}
          {document && (
            <div className="mb-4 pb-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Document</h3>
              <p className="text-sm text-gray-900 font-medium">{document.name}</p>
              {document.description && (
                <p className="text-xs text-gray-500 mt-1">{document.description}</p>
              )}
            </div>
          )}
          
          <h3 className="text-sm font-medium text-gray-700 mb-3">Properties</h3>
          
          {selectedElement ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={selectedElement.label}
                                     onChange={(e) => handleUpdateElement(selectedElement.id, { 
                     label: e.target.value,
                     properties: { ...selectedElement.properties, label: e.target.value }
                   })}
                />
              </div>
              
              <div>
                <Label htmlFor="placeholder">Placeholder</Label>
                <Input
                  id="placeholder"
                  value={selectedElement.properties.placeholder || ''}
                                     onChange={(e) => handleUpdateElement(selectedElement.id, {
                     properties: { ...selectedElement.properties, placeholder: e.target.value }
                   })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={selectedElement.properties.required || false}
                                     onChange={(e) => handleUpdateElement(selectedElement.id, {
                     properties: { ...selectedElement.properties, required: e.target.checked }
                   })}
                />
                <Label htmlFor="required">Required field</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={selectedElement.size.width}
                                         onChange={(e) => handleUpdateElement(selectedElement.id, {
                       size: { ...selectedElement.size, width: parseInt(e.target.value) || 200 }
                     })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={selectedElement.size.height}
                                         onChange={(e) => handleUpdateElement(selectedElement.id, {
                       size: { ...selectedElement.size, height: parseInt(e.target.value) || 40 }
                     })}
                  />
                </div>
              </div>

              {/* Duplicate and Delete controls */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateElement(selectedElement.id)}
                  className="w-full text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate Field
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveElement(selectedElement.id)}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Field
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Select a field to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  )
} 