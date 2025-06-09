"use client"

import type { Workspace } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import Link from "next/link"

interface WorkspaceCardProps {
  workspace: Workspace
  onToggleFavorite: () => void
}

export function WorkspaceCard({ workspace, onToggleFavorite }: WorkspaceCardProps) {
  return (
    <Link href={`/workspace/${workspace.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center flex-1">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                {workspace.logo_url ? (
                  <img
                    src={workspace.logo_url || "/placeholder.svg"}
                    alt={workspace.name}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-500">{workspace.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{workspace.name}</h3>
                <p className="text-xs text-gray-500">{workspace.description || "No description"}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleFavorite()
              }}
              className="text-gray-400 hover:text-yellow-400 ml-2"
            >
              <Star
                className="w-5 h-5"
                fill={workspace.is_favorite ? "currentColor" : "none"}
                stroke={workspace.is_favorite ? "none" : "currentColor"}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
