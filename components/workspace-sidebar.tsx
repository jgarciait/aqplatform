"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Eye, Send, ChevronLeft, ChevronRight, Star, Home, LogOut, Search, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { getFavoriteForms, toggleFormFavorite, isFormFavorite } from "@/lib/favorite-forms-service"
import type { Form, Workspace } from "@/lib/database.types"
import { signOut } from "next-auth/react"
import { Input } from "@/components/ui/input"

interface WorkspaceSidebarProps {
  workspace: Workspace
  forms: Form[]
  onFormSelect: (formId: string) => void
  selectedFormId: string | null
  mode: string
  isCollapsed: boolean
  onToggle: () => void
}

export function WorkspaceSidebar({
  workspace,
  forms,
  onFormSelect,
  selectedFormId,
  mode,
  isCollapsed,
  onToggle,
}: WorkspaceSidebarProps) {
  const { user } = useAuth()
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState("")
  const [favoriteForms, setFavoriteForms] = useState<any[]>([])
  const [formFavoriteStatus, setFormFavoriteStatus] = useState<Record<string, boolean>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const filteredDropdownForms = forms.filter((form) =>
    form.title.toLowerCase().includes(dropdownSearchQuery.toLowerCase()),
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  // Load favorite forms and favorite status
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) return

      // Load favorite forms for this workspace
      const favorites = await getFavoriteForms(user.id, workspace.id)
      setFavoriteForms(favorites)

      // Load favorite status for all forms
      const favoriteStatus: Record<string, boolean> = {}
      for (const form of forms) {
        favoriteStatus[form.id] = await isFormFavorite(user.id, form.id)
      }
      setFormFavoriteStatus(favoriteStatus)
    }

    loadFavorites()
  }, [user?.id, workspace.id, forms])

  const handleToggleFavorite = async (formId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!user?.id) return

    const newStatus = await toggleFormFavorite(user.id, formId)
    setFormFavoriteStatus((prev) => ({
      ...prev,
      [formId]: newStatus,
    }))

    // Refresh favorites list
    const favorites = await getFavoriteForms(user.id, workspace.id)
    setFavoriteForms(favorites)
  }

  const handleFormSelectFromDropdown = (formId: string) => {
    onFormSelect(formId)
  }

  return (
    <div
      className={`relative bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        style={{ color: "#042841" }}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b border-gray-200 px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: mode === "sender" ? "#1e40af" : "#059669" }}
              >
                {mode === "sender" ? <Send className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <span className="font-semibold truncate" style={{ color: "#001623" }}>
                  {workspace.name}
                </span>
                <p className="text-xs text-gray-500 capitalize">{mode} Mode</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white mx-auto"
              style={{ backgroundColor: mode === "sender" ? "#1e40af" : "#059669" }}
            >
              {mode === "sender" ? <Send className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </div>
          )}
        </div>

        {/* Combined Form Search and Selection */}
        {!isCollapsed && (
          <div className="p-2 border-b border-gray-200">
          {/* Show form count */}
            <div className="text-xs text-gray-600">
            {forms.length} {forms.length === 1 ? "form" : "forms"} in this workspace
          </div>
            <div className="relative" ref={searchRef}>
              {/* Search input that looks like a selector */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400 z-10" />
                <Input
                  placeholder={
                    !isCollapsed && selectedFormId
                      ? `${forms.find(f => f.id === selectedFormId)?.title}`
                      : 'Search Forms'
                  }
                  className={`pl-9 pr-10 h-10 text-sm border border-gray-300 rounded-md ${selectedFormId ? 'placeholder-blue-500' : ''}`}
                  value={dropdownSearchQuery}
                  onChange={(e) => {
                    setDropdownSearchQuery(e.target.value)
                    if (e.target.value.trim()) {
                      setIsDropdownOpen(true)
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                {(dropdownSearchQuery || selectedFormId) && (
                  <button
                    onClick={() => {
                      setDropdownSearchQuery("")
                      setIsDropdownOpen(false)
                      if (selectedFormId) {
                        onFormSelect("")
                      }
                    }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    <span className="text-gray-600 text-xs font-medium">×</span>
                  </button>
                )}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Backdrop */}
              {isDropdownOpen && (
                <div
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                  aria-hidden="true"
                />
              )}
              {/* Dropdown results */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredDropdownForms.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      {dropdownSearchQuery ? "No forms found." : "No forms available."}
                    </div>
                  )}
                  {filteredDropdownForms.map((form) => (
                    <div
                      key={form.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between ${
                        selectedFormId === form.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                      }`}
                      onClick={() => {
                        handleFormSelectFromDropdown(form.id)
                        setIsDropdownOpen(false)
                        setDropdownSearchQuery("")
                      }}
                    >
                      <span className="truncate text-sm">{form.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(form.id, e)
                        }}
                        className="ml-2 text-gray-400 hover:text-yellow-400"
                      >
                        <Star
                          className="w-4 h-4"
                          fill={formFavoriteStatus[form.id] ? "currentColor" : "none"}
                          stroke={formFavoriteStatus[form.id] ? "none" : "currentColor"}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Favorite Forms Section */}
        {!isCollapsed && favoriteForms.length > 0 && (
          <div className="flex-1 border-b border-gray-200">
            <div className="p-4 pb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                <Star className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" />
                Favorite Forms
              </h3>
            </div>
            <ScrollArea className="h-32 px-2">
              <div className="space-y-1 pb-2">
                {favoriteForms.map((favorite) => (
                  <Button
                    key={favorite.form_id}
                    variant={selectedFormId === favorite.form_id ? "default" : "ghost"}
                    className={`w-full justify-start text-xs ${
                      selectedFormId === favorite.form_id ? "text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={selectedFormId === favorite.form_id ? { backgroundColor: "#042841" } : {}}
                    onClick={() => onFormSelect(favorite.form_id)}
                  >
                    <Star className="h-3 w-3 mr-2 text-yellow-400" fill="currentColor" />
                    <span className="truncate">{favorite.forms?.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      
        {/* Footer */}
        <div className="mt-auto border-t border-gray-200 p-4">
       
          {!isCollapsed && (
            <>
              <Link href="/dashboard">
                <Button
                  variant="default"
                  className="w-full justify-start text-white mb-2"
                  style={{ backgroundColor: "#083e5c" }}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go To Workspaces
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
                onClick={async () => {
                  try {
                    await signOut()
                    window.location.href = "/login"
                  } catch (error) {
                    console.error("Logout failed:", error)
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
