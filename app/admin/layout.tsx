"use client"

import type React from "react"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { WorkspaceProvider } from "@/contexts/workspace-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </WorkspaceProvider>
  )
}
