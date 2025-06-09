"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { loadForm } from "@/lib/form-service"
import { createFormSubmission } from "@/lib/submission-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FormFillViewProps {
  formId: string
  workspaceId: string
  onSubmissionComplete: () => void
}

export function FormFillView({ formId, workspaceId, onSubmissionComplete }: FormFillViewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState<any | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchForm = async () => {
      setIsLoading(true)
      try {
        const loadedForm = await loadForm(formId)
        if (loadedForm) {
          setForm(loadedForm)

          // Initialize form data with empty values
          const initialData: Record<string, any> = {}
          loadedForm.elements.forEach((element: any) => {
            initialData[element.id] = ""
          })
          setFormData(initialData)
        }
      } catch (error) {
        console.error("Error loading form:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [formId])

  const handleInputChange = (elementId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [elementId]: value,
    }))

    // Clear error for this field if it exists
    if (errors[elementId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[elementId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    form.elements.forEach((element: any) => {
      if (element.properties.required) {
        const value = formData[element.id]
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[element.id] = "This field is required"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to submit a form.",
        variant: "destructive",
      })
      return
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const submission = await createFormSubmission(formId, workspaceId, user.id, formData)

      if (submission) {
        toast({
          title: "Success",
          description: "Form submitted successfully!",
        })
        onSubmissionComplete()
      } else {
        toast({
          title: "Error",
          description: "Failed to submit form.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const renderFormElement = (element: any) => {
    const { id, type, properties, size } = element
    const value = formData[id] || ""
    const error = errors[id]

    const inputElement = (() => {
      switch (type) {
        case "single-line":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                placeholder={properties.placeholder}
                type={properties.inputType || "text"}
                minLength={properties.minLength}
                maxLength={properties.maxLength}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "multiline":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={id}
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                placeholder={properties.placeholder}
                minLength={properties.minLength}
                maxLength={properties.maxLength}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "number":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="number"
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                placeholder={properties.placeholder}
                min={properties.min}
                max={properties.max}
                step={properties.step}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "date":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="date"
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "date-time":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="datetime-local"
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "yes-no":
          return (
            <div className="space-y-2">
              <Label className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="flex items-center space-x-4">
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`radio-${id}`}
                    value="yes"
                    checked={value === "yes"}
                    onChange={(e) => handleInputChange(id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>Yes</span>
                </Label>
                <Label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`radio-${id}`}
                    value="no"
                    checked={value === "no"}
                    onChange={(e) => handleInputChange(id, e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>No</span>
                </Label>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "checkbox":
          return (
            <div className="flex items-center space-x-2">
              <Checkbox id={id} checked={!!value} onCheckedChange={(checked) => handleInputChange(id, checked)} />
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {error && <p className="text-xs text-red-500 ml-2">{error}</p>}
            </div>
          )

        case "dropdown":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <select
                id={id}
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  error ? "border-red-500" : ""
                }`}
              >
                <option value="">Select an option</option>
                {properties.options?.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "slider":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="range"
                value={value}
                onChange={(e) => handleInputChange(id, e.target.value)}
                min={properties.min}
                max={properties.max}
                step={properties.step}
                className={error ? "border-red-500" : ""}
              />
              <div className="text-sm text-gray-500">Value: {value}</div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "attachment":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="file"
                onChange={(e) => handleInputChange(id, e.target.files?.[0] || "")}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "image":
          return (
            <div className="space-y-2">
              <Label htmlFor={id} className={error ? "text-red-500" : ""}>
                {properties.label}
                {properties.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={id}
                type="file"
                accept="image/*"
                onChange={(e) => handleInputChange(id, e.target.files?.[0] || "")}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )

        case "section":
          return (
            <div className="border border-dashed border-gray-300 p-4 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">{properties.label}</h4>
              <p className="text-sm text-gray-500">{properties.placeholder || "This is a section."}</p>
            </div>
          )

        case "table":
          return (
            <div className="border border-dashed border-gray-300 p-4 rounded-md">
              <h4 className="font-semibold text-gray-700 mb-2">{properties.label}</h4>
              <p className="text-sm text-gray-500">{properties.placeholder || "This is a table."}</p>
            </div>
          )

        default:
          return (
            <div className="p-2 border border-gray-300 rounded">
              <p>Unsupported element type: {type}</p>
            </div>
          )
      }
    })()

    return <div className={getColumnSpanClass(size || 1)}>{inputElement}</div>
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium">Form Not Found</h3>
            <p className="text-gray-500 mt-2">The form you're looking for doesn't exist or has been deleted.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && <p className="text-gray-500 mt-1">{form.description}</p>}
      </CardHeader>
      <CardContent>
        {/* Use the same 3-column grid system as the form builder */}
        <div className="grid grid-cols-3 gap-4 auto-rows-min">
          {form.elements.map((element: any) => (
            <React.Fragment key={element.id}>{renderFormElement(element)}</React.Fragment>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#042841] hover:bg-[#0a4a6b] text-white">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Form
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
