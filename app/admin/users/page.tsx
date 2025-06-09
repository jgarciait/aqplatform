"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Mail, User, Briefcase } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  position?: string
  created_at: string
  last_sign_in_at?: string
}

export default function UserManagementPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    position: "",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.position || "").toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)

      // Get all profiles with user data from a view or join
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
        id,
        first_name,
        last_name,
        position,
        created_at,
        updated_at,
        email
      `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform the data to match our UserProfile interface
      const userProfiles: UserProfile[] =
        profiles?.map((profile) => ({
          id: profile.id,
          email: profile.email || "",
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          position: profile.position || "",
          created_at: profile.created_at,
          last_sign_in_at: profile.updated_at, // Using updated_at as proxy for activity
        })) || []

      setUsers(userProfiles)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user)
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      position: user.position || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return

    setIsSaving(true)
    try {
      // Update or insert profile data
      const { error } = await supabase.from("profiles").upsert({
        id: selectedUser.id,
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        position: editForm.position.trim(),
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...editForm } : user)))

      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Error updating user:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getFullName = (user: UserProfile) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim()
    return fullName || "No name set"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#042841" }}>
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage user profiles and information</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">With Positions</p>
                <p className="text-2xl font-bold">{users.filter((u) => u.position).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage user profile information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading users...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{getFullName(user)}</p>
                          {!user.first_name && !user.last_name && (
                            <Badge variant="outline" className="text-xs">
                              Incomplete Profile
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.position ? (
                        <Badge variant="secondary">{user.position}</Badge>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input id="email" value={selectedUser?.email || ""} disabled className="bg-gray-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                placeholder="Enter position/job title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving} style={{ backgroundColor: "#042841" }}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
