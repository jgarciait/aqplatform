"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
import { useSearchParams } from "next/navigation" // Import useSearchParams
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type UniqueIdentifier,
  closestCenter,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  X,
  Search,
  Type,
  Hash,
  Calendar,
  CalendarDays,
  CheckCircle,
  ListChecks,
  ToggleRight,
  ChevronDown,
  Paperclip,
  ImageIcon,
  SlidersHorizontal,
  User,
  Grid,
  Table,
  Eye,
  Save,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea" // Renamed to avoid conflict

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

import { useAuth } from "@/contexts/auth-context" // Import useAuth
import { saveForm, loadForm, type FormElementData, type FormElementProperties } from "@/lib/form-service" // Import form service functions and types
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatDistanceToNow } from "date-fns"

// --- Component Definitions ---

// Palette Item (Clickable to Add, not Draggable to Canvas)
interface PaletteItemProps {
  id: UniqueIdentifier
  label: string
  icon: React.ElementType
  onClick: (item: { id: UniqueIdentifier; label: string; type: string }) => void
}

function PaletteItem({ id, label, icon: Icon, onClick }: PaletteItemProps) {
  return (
    <Button
      variant="outline"
      className="flex flex-col items-center justify-center h-20 w-full text-gray-700 hover:bg-gray-100 border-gray-200"
      onClick={() => onClick({ id, label, type: id.toString() })}
    >
      <span className="text-xs">{label}</span>
    </Button>
  )
}

// Rendered Form Element on the Canvas (Sortable)
interface SortableFormElementProps extends FormElementData {
  onRemove: (id: UniqueIdentifier) => void
  onSelect: (id: UniqueIdentifier) => void
  isSelected: boolean
}

function SortableFormElement({ id, type, properties, size, onRemove, onSelect, isSelected }: SortableFormElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.5 : 1,
  }

  const renderInput = () => {
    const currentLabel = properties.label || "Untitled Field"
    const currentPlaceholder = properties.placeholder || ""

    switch (type) {
      case "single-line":
        return (
          <Input
            placeholder={currentPlaceholder || "Enter text"}
            className="mt-1"
            type={properties.inputType || "text"} // Use inputType
            minLength={properties.minLength} // Use minLength
            maxLength={properties.maxLength} // Use maxLength
          />
        )
      case "multiline":
        return (
          <ShadcnTextarea
            placeholder={currentPlaceholder || "Enter multiline text"}
            className="mt-1"
            minLength={properties.minLength} // Use minLength
            maxLength={properties.maxLength} // Use maxLength
          />
        )
      case "number":
        return (
          <Input
            type="number"
            placeholder={currentPlaceholder || "Enter number"}
            className="mt-1"
            min={properties.min} // Ensure min/max are passed for number type
            max={properties.max}
          />
        )
      case "date":
        return <Input type="date" className="mt-1" />
      case "date-time":
        return <Input type="datetime-local" className="mt-1" />
      case "yes-no":
        return (
          <div className="flex items-center space-x-4 mt-1">
            <Label className="flex items-center space-x-2">
              <Input type="radio" name={`radio-${id}`} value="yes" />
              <span>Yes</span>
            </Label>
            <Label className="flex items-center space-x-2">
              <Input type="radio" name={`radio-${id}`} value="no" />
              <span>No</span>
            </Label>
          </div>
        )
      case "checkbox":
        return (
          <Label className="flex items-center space-x-2 mt-1">
            <Checkbox />
            <span>{currentLabel}</span>
          </Label>
        )
      case "dropdown":
        return (
          <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {properties.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {properties.options?.length === 0 && <option>No options defined</option>}
          </select>
        )
      case "profile":
        return <Input placeholder={currentPlaceholder || "Select Profile"} className="mt-1" />
      case "attachment":
        return <Input type="file" className="mt-1" />
      case "image":
        return <Input type="file" accept="image/*" className="mt-1" />
      case "slider":
        return <Input type="range" className="mt-1" min={properties.min} max={properties.max} step={properties.step} />
      case "section":
        return (
          <div className="border border-dashed border-gray-300 p-4 rounded-md mt-2">
            <h4 className="font-semibold text-gray-700 mb-2">{currentLabel}</h4>
            <p className="text-sm text-gray-500">{currentPlaceholder || "This is a section."}</p>
          </div>
        )
      case "table":
        return (
          <div className="border border-dashed border-gray-300 p-4 rounded-md mt-2">
            <h4 className="font-semibold text-gray-700 mb-2">{currentLabel}</h4>
            <p className="text-sm text-gray-500">{currentPlaceholder || "This is a table."}</p>
          </div>
        )
      default:
        return null
    }
  }

  // Get the appropriate grid column span class based on size
  const getColumnSpanClass = () => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(id)}
      className={`relative bg-white border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${getColumnSpanClass()} ${
        isSelected ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200"
      }`}
    >
      <div className="absolute top-2 right-2 flex space-x-1">
        {/* Size indicator */}
        <div className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
          {size === 1 ? "1/3" : size === 2 ? "2/3" : "Full"}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent selecting the element when clicking remove
            onRemove(id)
          }}
          className="text-gray-400 hover:text-red-500 focus:outline-none"
          aria-label="Remove element"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {type !== "checkbox" && type !== "yes-no" && (
        <Label className="block text-sm font-medium text-gray-700 mb-1">{properties.label || "Untitled Field"}</Label>
      )}
      {renderInput()}
    </div>
  )
}

// --- Properties Panel Component ---
interface PropertiesPanelProps {
  selectedElement: FormElementData | null
  onUpdateElement: (id: UniqueIdentifier, newProperties: FormElementProperties) => void
  onUpdateElementSize: (id: UniqueIdentifier, newSize: 1 | 2 | 3) => void
}

function PropertiesPanel({ selectedElement, onUpdateElement, onUpdateElementSize }: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-4">
        <p>Select an element on the form to edit its properties.</p>
      </div>
    )
  }

  const handlePropertyChange = (key: keyof FormElementProperties, value: any) => {
    onUpdateElement(selectedElement.id, {
      ...selectedElement.properties,
      [key]: value,
    })
  }

  const handleSizeChange = (newSize: 1 | 2 | 3) => {
    onUpdateElementSize(selectedElement.id, newSize)
  }

  const handleOptionChange = (index: number, newLabel: string, newValue: string) => {
    const updatedOptions = [...(selectedElement.properties.options || [])]
    updatedOptions[index] = { label: newLabel, value: newValue }
    onUpdateElement(selectedElement.id, {
      ...selectedElement.properties,
      options: updatedOptions,
    })
  }

  const handleAddOption = () => {
    const newOption = { value: `option-${Date.now()}`, label: `New Option` }
    onUpdateElement(selectedElement.id, {
      ...selectedElement.properties,
      options: [...(selectedElement.properties.options || []), newOption],
    })
  }

  const handleRemoveOption = (index: number) => {
    const updatedOptions = (selectedElement.properties.options || []).filter((_, i) => i !== index)
    onUpdateElement(selectedElement.id, {
      ...selectedElement.properties,
      options: updatedOptions,
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Properties: {selectedElement.properties.label || selectedElement.type}
      </h3>
      <Separator />

      {/* Element Size */}
      <div className="space-y-2">
        <Label>Element Width</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedElement.size === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => handleSizeChange(1)}
            className="text-xs"
          >
            1/3 Width
          </Button>
          <Button
            variant={selectedElement.size === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => handleSizeChange(2)}
            className="text-xs"
          >
            2/3 Width
          </Button>
          <Button
            variant={selectedElement.size === 3 ? "default" : "outline"}
            size="sm"
            onClick={() => handleSizeChange(3)}
            className="text-xs"
          >
            Full Width
          </Button>
        </div>
      </div>

      <Separator />

      {/* Common Properties */}
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={selectedElement.properties.label || ""}
          onChange={(e) => handlePropertyChange("label", e.target.value)}
          placeholder="Field Label"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          value={selectedElement.properties.placeholder || ""}
          onChange={(e) => handlePropertyChange("placeholder", e.target.value)}
          placeholder="Field Placeholder"
        />
      </div>

      {/* Required Checkbox (for relevant types) */}
      {[
        "single-line",
        "multiline",
        "number",
        "date",
        "date-time",
        "dropdown",
        "checkbox",
        "profile",
        "attachment",
        "image",
      ].includes(selectedElement.type) && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="required"
            checked={selectedElement.properties.required || false}
            onCheckedChange={(checked) => handlePropertyChange("required", checked)}
          />
          <Label htmlFor="required">Required</Label>
        </div>
      )}

      {/* New: Input Type, Min/Max Length for text-based fields */}
      {["single-line", "multiline"].includes(selectedElement.type) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="inputType">Input Type</Label>
            <select
              id="inputType"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedElement.properties.inputType || "text"}
              onChange={(e) => handlePropertyChange("inputType", e.target.value as FormElementProperties["inputType"])}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="password">Password</option>
              <option value="url">URL</option>
              <option value="tel">Telephone</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">Min Length</Label>
              <Input
                id="minLength"
                type="number"
                value={selectedElement.properties.minLength || ""}
                onChange={(e) => handlePropertyChange("minLength", Number.parseInt(e.target.value) || undefined)}
                placeholder="Min"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Length</Label>
              <Input
                id="maxLength"
                type="number"
                value={selectedElement.properties.maxLength || ""}
                onChange={(e) => handlePropertyChange("maxLength", Number.parseInt(e.target.value) || undefined)}
                placeholder="Max"
              />
            </div>
          </div>
        </>
      )}

      {/* Type-specific properties */}
      {selectedElement.type === "dropdown" || selectedElement.type === "checklist" ? (
        <div className="space-y-2">
          <Label>Options</Label>
          {selectedElement.properties.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={option.label}
                onChange={(e) => handleOptionChange(index, e.target.value, option.value)}
                placeholder={`Option ${index + 1} Label`}
              />
              <Input
                value={option.value}
                onChange={(e) => handleOptionChange(index, option.label, e.target.value)}
                placeholder={`Option ${index + 1} Value`}
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddOption}>
            <Plus className="h-4 w-4 mr-1" /> Add Option
          </Button>
        </div>
      ) : null}

      {selectedElement.type === "number" || selectedElement.type === "slider" ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min">Min Value</Label>
            <Input
              id="min"
              type="number"
              value={selectedElement.properties.min || ""}
              onChange={(e) => handlePropertyChange("min", Number.parseFloat(e.target.value))}
              placeholder="Min"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max">Max Value</Label>
            <Input
              id="max"
              type="number"
              value={selectedElement.properties.max || ""}
              onChange={(e) => handlePropertyChange("max", Number.parseFloat(e.target.value))}
              placeholder="Max"
            />
          </div>
          {selectedElement.type === "slider" && (
            <div className="space-y-2 col-span-2">
              <Label htmlFor="step">Step</Label>
              <Input
                id="step"
                type="number"
                value={selectedElement.properties.step || ""}
                onChange={(e) => handlePropertyChange("step", Number.parseFloat(e.target.value))}
                placeholder="Step"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Add more type-specific properties here as needed */}
    </div>
  )
}

// --- Main Form Builder Component ---

export default function FormBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFormId = searchParams.get("formId") // Get formId from URL
  const workspaceId = searchParams.get("workspace")

  const { user } = useAuth() // Get user from AuthContext

  const [formId, setFormId] = useState<string | null>(initialFormId)
  const [formTitle, setFormTitle] = useState("Untitled Form")
  const [formDescription, setFormDescription] = useState("Add a description for your form.")
  const [formElements, setFormElements] = useState<FormElementData[]>([]) // Changed to flat array
  const [selectedElementId, setSelectedElementId] = useState<UniqueIdentifier | null>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null) // For DND overlay
  const { toast } = useToast()
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 }, // Reduced distance for easier drag
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  )

  const formElementsPalette = [
    { id: "section", label: "Sections", icon: Grid, type: "section" },
    { id: "table", label: "Tables", icon: Table, type: "table" },
    { id: "single-line", label: "Single line", icon: Type, type: "single-line" },
    { id: "multiline", label: "Multiline", icon: ShadcnTextarea, type: "multiline" },
    { id: "number", label: "Number", icon: Hash, type: "number" },
    { id: "date", label: "Date", icon: Calendar, type: "date" },
    { id: "date-time", label: "Date & Time", icon: CalendarDays, type: "date-time" },
    { id: "yes-no", label: "Yes/No", icon: ToggleRight, type: "yes-no" },
    { id: "dropdown", label: "Dropdown", icon: ChevronDown, type: "dropdown" },
    { id: "checkbox", label: "Checkbox", icon: CheckCircle, type: "checkbox" },
    { id: "checklist", label: "Checklist", icon: ListChecks, type: "checklist" },
    { id: "profile", label: "Profiles", icon: User, type: "profile" },
    { id: "attachment", label: "Attachments", icon: Paperclip, type: "attachment" },
    { id: "image", label: "Image", icon: ImageIcon, type: "image" },
    { id: "slider", label: "Slider", icon: SlidersHorizontal, type: "slider" },
  ]

  // Function to load form data
  const handleLoadForm = async (id: string) => {
    const loadedForm = await loadForm(id)
    if (loadedForm) {
      setFormTitle(loadedForm.title)
      setFormDescription(loadedForm.description || "")
      setFormElements(loadedForm.elements)
      setLastUpdated(new Date(loadedForm.updated_at))

      console.log("Form loaded successfully:", loadedForm)
    } else {
      console.error("Failed to load form or form not found.")
      setFormTitle("Untitled Form")
      setFormDescription("Add a description for your form.")
      setFormElements([])
      setFormId(null)
      setLastUpdated(null)
    }
  }

  // Effect to load form on component mount or formId change
  useEffect(() => {
    if (formId) {
      handleLoadForm(formId)
    }
  }, [formId]) // Depend on formId

  const handleAddElement = (item: { id: UniqueIdentifier; label: string; type: string }) => {
    const newElement: FormElementData = {
      id: `form-element-${Date.now()}`,
      type: item.type,
      size: 1, // Default to 1/3 width
      label: item.label,
      properties: {
        label: item.label,
        placeholder: `Enter ${item.label.toLowerCase()}`,
        required: false,
        ...(item.type === "dropdown" || item.type === "checklist" ? { options: [] } : {}),
        ...(item.type === "number" || item.type === "slider" ? { min: 0, max: 100, step: 1 } : {}),
        ...(item.type === "single-line" || item.type === "multiline"
          ? { inputType: "text", minLength: undefined, maxLength: undefined }
          : {}),
      },
    }

    setFormElements((prev) => [...prev, newElement])
    setSelectedElementId(newElement.id)
  }

  const handleRemoveElement = (id: UniqueIdentifier) => {
    setFormElements((prev) => prev.filter((item) => item.id !== id))

    if (selectedElementId === id) {
      setSelectedElementId(null)
    }
  }

  const handleUpdateElementProperties = (id: UniqueIdentifier, newProperties: FormElementProperties) => {
    setFormElements((prev) => prev.map((item) => (item.id === id ? { ...item, properties: newProperties } : item)))
  }

  const handleUpdateElementSize = (id: UniqueIdentifier, newSize: 1 | 2 | 3) => {
    setFormElements((prev) => prev.map((item) => (item.id === id ? { ...item, size: newSize } : item)))
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
    console.log("Drag started:", event.active.id)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    console.log("Drag ended:", {
      activeId: active?.id,
      overId: over?.id,
    })

    if (active.id !== over?.id) {
      setFormElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        if (oldIndex !== -1 && newIndex !== -1) {
          console.log(`Reordering from index ${oldIndex} to ${newIndex}`)
          return arrayMove(items, oldIndex, newIndex)
        }
        return items
      })
    }
    setActiveId(null)
  }

  // Find the active item data for the drag overlay
  const selectedElement = formElements.find((item) => item.id === selectedElementId)
  const activeItemData = activeId ? formElements.find((item) => item.id === activeId) : null

  const handleSaveForm = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save a form.",
        variant: "destructive",
      })
      return
    }

    const savedForm = await saveForm(formId, formTitle, formDescription, user.id, formElements, workspaceId)

    if (savedForm) {
      setFormId(savedForm.id)
      setLastUpdated(new Date(savedForm.updated_at))
      toast({
        title: "Success",
        description: "Form saved successfully!",
      })
      console.log("Form saved:", savedForm)
      if (!formId) {
        router.replace(`/admin/forms/builder?formId=${savedForm.id}&workspace=${workspaceId}`)
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to save form.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar - Component Palette */}
      <div className="w-72 border-r bg-white p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                <X className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to close the form builder?</AlertDialogTitle>
                <AlertDialogDescription>Any unsaved changes will be lost.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    onClick={() => router.push("/admin/forms")}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Close Builder
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <h2 className="text-lg font-semibold text-gray-800">Form Builder</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Click to add, then drag to reorder elements</p>

        <div className="relative mb-4">
          <Input placeholder="Search Components" className="pl-8" />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <Separator className="mb-4" />

        <div className="flex-1 overflow-y-auto pr-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Layout Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter((item) => item.type === "section" || item.type === "table")
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Text Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter((item) => item.type === "single-line" || item.type === "multiline")
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Number Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter((item) => item.type === "number")
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Date Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter((item) => item.type === "date" || item.type === "date-time")
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Multi Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter(
                (item) =>
                  item.type === "yes-no" ||
                  item.type === "dropdown" ||
                  item.type === "checkbox" ||
                  item.type === "checklist" ||
                  item.type === "profile",
              )
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Media Elements</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {formElementsPalette
              .filter((item) => item.type === "attachment" || item.type === "image" || item.type === "slider")
              .map((item) => (
                <PaletteItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  onClick={handleAddElement}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Main Content - Form Canvas */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center space-x-4">
            <Tabs defaultValue="fields">
              <TabsList>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-sm text-gray-500">
              {lastUpdated
                ? `Last updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
                : formId
                  ? "Loading..."
                  : "Not saved yet"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button onClick={handleSaveForm} className="bg-[#042841] hover:bg-[#0a4a6b] text-white" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save Form
            </Button>
          </div>
        </div>

        {/* Form Canvas Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <Input
              className="text-2xl font-bold text-gray-800 mb-2 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <ShadcnTextarea
              className="text-gray-500 text-sm mb-6 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto resize-none"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={1}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="min-h-[400px] rounded-lg p-4 transition-all duration-200 border-2 border-dashed border-gray-300 bg-white">
                {formElements.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <p>Click elements from the left palette to add them here.</p>
                    <p>Drag elements to reorder them vertically.</p>
                    <p>Use the properties panel to adjust element width (1/3, 2/3, or full width).</p>
                  </div>
                ) : (
                  <SortableContext items={formElements.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-3 gap-4 auto-rows-min">
                      {formElements.map((item) => (
                        <SortableFormElement
                          key={item.id}
                          id={item.id}
                          type={item.type}
                          properties={item.properties}
                          size={item.size}
                          onRemove={handleRemoveElement}
                          onSelect={setSelectedElementId}
                          isSelected={selectedElementId === item.id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </div>

              {/* Drag Overlay for reordering */}
              <DragOverlay>
                {activeItemData ? (
                  <div className="relative bg-white border border-gray-200 rounded-md p-4 shadow-md opacity-80 max-w-sm">
                    <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-100 px-1 rounded">
                      {activeItemData.size === 1 ? "1/3" : activeItemData.size === 2 ? "2/3" : "Full"}
                    </div>
                    {activeItemData.type !== "checkbox" && activeItemData.type !== "yes-no" && (
                      <Label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeItemData.properties.label || "Untitled Field"}
                      </Label>
                    )}
                    {/* Render a simplified input for the overlay */}
                    {activeItemData.type === "single-line" && (
                      <Input placeholder={activeItemData.properties.placeholder} />
                    )}
                    {activeItemData.type === "multiline" && (
                      <ShadcnTextarea placeholder={activeItemData.properties.placeholder} />
                    )}
                    {activeItemData.type === "number" && (
                      <Input type="number" placeholder={activeItemData.properties.placeholder} />
                    )}
                    {activeItemData.type === "date" && <Input type="date" />}
                    {activeItemData.type === "date-time" && <Input type="datetime-local" />}
                    {activeItemData.type === "yes-no" && (
                      <div className="flex items-center space-x-4 mt-1">
                        <Label className="flex items-center space-x-2">
                          <Input type="radio" name={`radio-overlay`} value="yes" />
                          <span>Yes</span>
                        </Label>
                        <Label className="flex items-center space-x-2">
                          <Input type="radio" name={`radio-overlay`} value="no" />
                          <span>No</span>
                        </Label>
                      </div>
                    )}
                    {activeItemData.type === "checkbox" && (
                      <Label className="flex items-center space-x-2 mt-1">
                        <Checkbox />
                        <span>{activeItemData.properties.label}</span>
                      </Label>
                    )}
                    {activeItemData.type === "dropdown" && (
                      <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option>Option 1</option>
                      </select>
                    )}
                    {activeItemData.type === "profile" && <Input placeholder={activeItemData.properties.placeholder} />}
                    {activeItemData.type === "attachment" && <Input type="file" />}
                    {activeItemData.type === "image" && <Input type="file" accept="image/*" />}
                    {activeItemData.type === "slider" && <Input type="range" />}
                    {activeItemData.type === "section" && (
                      <div className="border border-dashed border-gray-300 p-4 rounded-md mt-2">
                        <h4 className="font-semibold text-gray-700 mb-2">{activeItemData.properties.label}</h4>
                        <p className="text-sm text-gray-500">{activeItemData.properties.placeholder}</p>
                      </div>
                    )}
                    {activeItemData.type === "table" && (
                      <div className="border border-dashed border-gray-300 p-4 rounded-md mt-2">
                        <h4 className="font-semibold text-gray-700 mb-2">{activeItemData.properties.label}</h4>
                        <p className="text-sm text-gray-500">{activeItemData.properties.placeholder}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties Panel */}
      <div className="w-72 border-l bg-white p-4 flex flex-col">
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElementProperties}
          onUpdateElementSize={handleUpdateElementSize}
        />
      </div>
      <Toaster />
    </div>
  )
}
