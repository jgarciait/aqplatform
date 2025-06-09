"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Plus, Edit, Trash2, MoreVertical, UserPlus, UserMinus, Search, AlertCircle } from "lucide-react"
import { useWorkspace } from "@/contexts/workspace-context"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import {
  getGroupsForWorkspace,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addUserToGroup,
  removeUserFromGroup,
  type Group,
  type GroupMember,
} from "@/lib/groups-service"

interface GroupsManagementProps {
  isOpen: boolean
  onClose: () => void
}

export function GroupsManagement({ isOpen, onClose }: GroupsManagementProps) {
  const { selectedWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Form states
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [newGroupType, setNewGroupType] = useState<"sender" | "requester" | "approver">("requester")

  const [editGroupName, setEditGroupName] = useState("")
  const [editGroupDescription, setEditGroupDescription] = useState("")

  useEffect(() => {
    if (selectedWorkspace && isOpen) {
      loadGroups()
      loadAvailableUsers()
    }
  }, [selectedWorkspace, isOpen])

  const loadGroups = async () => {
    if (!selectedWorkspace) return

    setIsLoading(true)
    try {
      const groupsData = await getGroupsForWorkspace(selectedWorkspace.id)
      setGroups(groupsData)
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableUsers = async () => {
    try {
      console.log("Loading all users for group management")

      // Get ALL users from profiles table - groups manage workspace access
      const { data: allUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, position")
        .order("first_name", { ascending: true })

      if (usersError) {
        console.error("Error fetching users:", usersError)
        throw usersError
      }

      console.log(`Found ${allUsers?.length || 0} total users in system`)
      setAvailableUsers(allUsers || [])
    } catch (error) {
      console.error("Error loading available users:", error)
      setAvailableUsers([])
    }
  }

  const loadGroupMembers = async (groupId: string) => {
    try {
      const members = await getGroupMembers(groupId)
      setGroupMembers(members)
    } catch (error) {
      console.error("Error loading group members:", error)
    }
  }

  const handleCreateGroup = async () => {
    if (!selectedWorkspace || !newGroupName.trim()) return

    try {
      const newGroup = await createGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        workspace_id: selectedWorkspace.id,
        group_type: newGroupType,
      })

      setGroups((prev) => [newGroup, ...prev])
      setShowCreateDialog(false)
      setNewGroupName("")
      setNewGroupDescription("")
      setNewGroupType("requester")
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group")
    }
  }

  const handleEditGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) return

    try {
      const updatedGroup = await updateGroup(selectedGroup.id, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim() || null,
      })

      setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)))
      setShowEditDialog(false)
      setSelectedGroup(null)
    } catch (error) {
      console.error("Error updating group:", error)
      alert("Failed to update group")
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This will remove all members and workflow assignments."))
      return

    try {
      const success = await deleteGroup(groupId)
      if (success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
      }
    } catch (error) {
      console.error("Error deleting group:", error)
      alert("Failed to delete group")
    }
  }

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup || !selectedWorkspace) return

    try {
      // First, ensure the user has access to this workspace
      const { data: existingAccess, error: checkError } = await supabase
        .from("workspace_users")
        .select("id")
        .eq("workspace_id", selectedWorkspace.id)
        .eq("user_id", userId)
        .single()

      // If user doesn't have workspace access, add them
      if (checkError && checkError.code === "PGRST116") {
        console.log("Adding user to workspace automatically")
        const { error: addWorkspaceError } = await supabase.from("workspace_users").insert([
          {
            workspace_id: selectedWorkspace.id,
            user_id: userId,
            role: "member", // Default role, can be updated later
          },
        ])

        if (addWorkspaceError) {
          console.error("Error adding user to workspace:", addWorkspaceError)
          throw addWorkspaceError
        }
      }

      // Then add them to the group
      await addUserToGroup(selectedGroup.id, userId)
      await loadGroupMembers(selectedGroup.id)
      setUserSearchQuery("")
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member to group")
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return

    try {
      const success = await removeUserFromGroup(selectedGroup.id, userId)
      if (success) {
        await loadGroupMembers(selectedGroup.id)
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member from group")
    }
  }

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case "sender":
        return "bg-blue-100 text-blue-800"
      case "requester":
        return "bg-green-100 text-green-800"
      case "approver":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = availableUsers.filter((user) => {
    // Get current member user IDs
    const memberUserIds = groupMembers.map((m) => m.user_id)

    // Check if user is not already a member
    const isNotMember = !memberUserIds.includes(user.id)

    // Check if user matches search query (more permissive search)
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase()
    const email = (user.email || "").toLowerCase()
    const query = userSearchQuery.toLowerCase()

    const matchesSearch = userSearchQuery === "" || fullName.includes(query) || email.includes(query)

    return isNotMember && matchesSearch
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Groups Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {!selectedWorkspace ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workspace selected</h3>
              <p className="text-gray-500">Please select a workspace to manage groups.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Workspace Groups</h2>
                  <p className="text-gray-600">Organize users into groups for workflow permissions</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading groups...</p>
                </div>
              ) : groups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                    <p className="text-gray-500 mb-4">Create groups to organize users for workflow permissions.</p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Group
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => (
                    <Card key={group.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <Badge className={`mt-1 ${getGroupTypeColor(group.group_type)}`}>{group.group_type}</Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroup(group)
                                  loadGroupMembers(group.id)
                                  setShowMembersDialog(true)
                                }}
                              >
                                <Users className="w-4 h-4 mr-2" />
                                Manage Members
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroup(group)
                                  setEditGroupName(group.name)
                                  setEditGroupDescription(group.description || "")
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Group
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteGroup(group.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {group.description || "No description provided"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{group.member_count || 0} members</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGroup(group)
                              loadGroupMembers(group.id)
                              setShowMembersDialog(true)
                            }}
                          >
                            View Members
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="group-type">Group Type</Label>
              <Select value={newGroupType} onValueChange={(value: any) => setNewGroupType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">Sender</SelectItem>
                  <SelectItem value="requester">Requester</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this group"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="edit-group-description">Description</Label>
              <Textarea
                id="edit-group-description"
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this group"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGroup} disabled={!editGroupName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Manage Members - {selectedGroup?.name}</span>
              <Button size="sm" onClick={() => setShowAddMemberDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {groupMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
                <p className="text-gray-500 mb-4">Add users to this group to assign workflow permissions.</p>
                <Button onClick={() => setShowAddMemberDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        {member.user?.first_name && member.user?.last_name
                          ? `${member.user.first_name} ${member.user.last_name}`
                          : member.user?.email || "Unknown User"}
                      </TableCell>
                      <TableCell>{member.user?.email}</TableCell>
                      <TableCell>{member.user?.position || "-"}</TableCell>
                      <TableCell>{new Date(member.added_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Member to {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span>Total system users: {availableUsers.length}</span>
                <span>Current group members: {groupMembers.length}</span>
              </div>
              <div className="mt-1">
                <span>Available to add: {filteredUsers.length}</span>
                {userSearchQuery && <span className="ml-4 text-blue-600">Search: "{userSearchQuery}"</span>}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  <strong>Note:</strong> Adding users to groups automatically grants them workspace access.
                </p>
                <p>
                  Groups define user roles: Senders (submit forms), Recipients (receive/evaluate), Approvers
                  (approve/reject).
                </p>
              </div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[40vh] overflow-y-auto space-y-2 border rounded-md">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {userSearchQuery
                    ? "No users found matching your search"
                    : "All users are already members of this group"}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.position && <div className="text-xs text-blue-600">{user.position}</div>}
                    </div>
                    <Button size="sm" onClick={() => handleAddMember(user.id)}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
