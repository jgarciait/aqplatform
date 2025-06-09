"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { Workspace } from "@/lib/supabase"
import { getWorkspaces, getFavoriteWorkspaces, getRecentWorkspaces, toggleFavorite } from "@/lib/workspace-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, Search, Grid, List, Filter, User, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog"
import { WorkspaceCard } from "@/components/workspace-card"
import { WorkspaceList } from "@/components/workspace-list"

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [recentWorkspaces, setRecentWorkspaces] = useState<Workspace[]>([])
  const [favoriteWorkspaces, setFavoriteWorkspaces] = useState<Workspace[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const [isLocalLoading, setIsLocalLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      setIsLocalLoading(true)
      try {
        const [allWorkspaces, recentItems, favoriteItems] = await Promise.all([
          getWorkspaces(user.id),
          getRecentWorkspaces(user.id),
          getFavoriteWorkspaces(user.id),
        ])

        setWorkspaces(allWorkspaces)
        setRecentWorkspaces(recentItems)
        setFavoriteWorkspaces(favoriteItems)
      } catch (error) {
        console.error("Error loading workspaces:", error)
      } finally {
        setIsLocalLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleToggleFavorite = async (workspace: Workspace) => {
    if (!user) return

    const isFavorite = !workspace.is_favorite
    const success = await toggleFavorite(workspace.id, user.id, isFavorite)

    if (success) {
      // Update local state
      setWorkspaces(workspaces.map((w) => (w.id === workspace.id ? { ...w, is_favorite: isFavorite } : w)))

      // Update favorites list properly to prevent duplicates
      if (isFavorite) {
        // Only add if not already in favorites
        const isAlreadyFavorite = favoriteWorkspaces.some((w) => w.id === workspace.id)
        if (!isAlreadyFavorite) {
          setFavoriteWorkspaces([...favoriteWorkspaces, { ...workspace, is_favorite: true }])
        }
      } else {
        // Remove from favorites
        setFavoriteWorkspaces(favoriteWorkspaces.filter((w) => w.id !== workspace.id))
      }
    }
  }

  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (isLoading || isLocalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center aq-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // This should not happen due to middleware, but just in case
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with AQ Platform background */}
      <div className="relative aq-bg h-64 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-r4GZ09LhB8AUfXfgtdpDIDEGwTBdwa.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">AQPlatform</h1>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Admin Panel
                </Button>
              </Link>
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-sm">{user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await signOut()
                      // Force redirect after signOut
                      window.location.href = "/login"
                    } catch (error) {
                      console.error("Logout failed:", error)
                    }
                  }}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="search"
                placeholder="Search workspaces..."
                className="pl-10 bg-white/95 border-0 h-12 text-lg backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Recent Workspaces */}
        {!isLocalLoading && recentWorkspaces && recentWorkspaces.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "#001623" }}>
              Recently Viewed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentWorkspaces.map((workspace) => (
                <Link href={`/workspace/${workspace.id}`} key={workspace.id}>
                  <Card className="h-full aq-card">
                    <CardContent className="p-4 flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border"
                        style={{
                          background: "linear-gradient(135deg, #042841 0%, #0a4a6b 100%)",
                          borderColor: "#042841",
                        }}
                      >
                        {workspace.logo_url ? (
                          <img
                            src={workspace.logo_url || "/placeholder.svg"}
                            alt={workspace.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">{workspace.name.charAt(0)}</span>
                        )}
                      </div>
                      <h3 className="font-medium text-center" style={{ color: "#001623" }}>
                        {workspace.name}
                      </h3>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        {workspace.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Favorites */}
        {!isLocalLoading && favoriteWorkspaces && favoriteWorkspaces.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "#001623" }}>
              Favorites
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {favoriteWorkspaces.map((workspace) => (
                <div key={workspace.id} className="relative">
                  <Link href={`/workspace/${workspace.id}`}>
                    <Card className="h-full aq-card">
                      <CardContent className="p-4 flex flex-col items-center">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border"
                          style={{
                            background: "linear-gradient(135deg, #042841 0%, #0a4a6b 100%)",
                            borderColor: "#042841",
                          }}
                        >
                          {workspace.logo_url ? (
                            <img
                              src={workspace.logo_url || "/placeholder.svg"}
                              alt={workspace.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <span className="text-lg font-bold text-white">{workspace.name.charAt(0)}</span>
                          )}
                        </div>
                        <h3 className="font-medium text-center" style={{ color: "#001623" }}>
                          {workspace.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // Explicitly pass a workspace object with is_favorite set to true for favorites section
                      handleToggleFavorite({ ...workspace, is_favorite: true })
                    }}
                    className="absolute top-2 right-2 z-10 hover:scale-110 transition-transform"
                  >
                    <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Workspaces */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: "#001623" }}>
              My Workspaces
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`border-gray-300 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                style={{
                  borderColor: viewMode === "grid" ? "#042841" : undefined,
                  color: viewMode === "grid" ? "#042841" : undefined,
                }}
              >
                <Grid size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`border-gray-300 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                style={{
                  borderColor: viewMode === "list" ? "#042841" : undefined,
                  color: viewMode === "list" ? "#042841" : undefined,
                }}
              >
                <List size={16} />
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                <Filter size={16} />
                <span className="ml-1">Filter</span>
              </Button>
            </div>
          </div>

          {filteredWorkspaces.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No workspaces found</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="aq-btn-glow text-white">
                Create your first workspace
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onToggleFavorite={() => handleToggleFavorite(workspace)}
                />
              ))}
            </div>
          ) : (
            <WorkspaceList workspaces={filteredWorkspaces} onToggleFavorite={handleToggleFavorite} />
          )}
        </div>
      </div>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onWorkspaceCreated={(newWorkspace) => {
          setWorkspaces([...workspaces, newWorkspace])
          setRecentWorkspaces([newWorkspace, ...recentWorkspaces])
        }}
      />
    </div>
  )
}
