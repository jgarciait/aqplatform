"use client"

import type { Workspace } from "@/lib/supabase"
import { Star, Send, Eye } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface WorkspaceListProps {
  workspaces: Workspace[]
  onToggleFavorite: (workspace: Workspace) => void
}

export function WorkspaceList({ workspaces, onToggleFavorite }: WorkspaceListProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Workspace
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Users
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Line of Business
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User Count
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              App & Services
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data & Assets
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Favorite
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workspaces.map((workspace) => (
            <tr key={workspace.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {workspace.logo_url ? (
                      <img className="h-6 w-6 object-contain" src={workspace.logo_url || "/placeholder.svg"} alt="" />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">{workspace.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link
                      href={`/workspace/${workspace.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-purple-600"
                    >
                      {workspace.name}
                    </Link>
                    <div className="text-xs text-gray-500">{workspace.description || "No description"}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {workspace.type ? (
                  <Badge
                    variant="outline"
                    className={
                      workspace.type === "sender"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }
                  >
                    {workspace.type === "sender" ? (
                      <>
                        <Send className="w-3 h-3 mr-1" />
                        Sender
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Recipient
                      </>
                    )}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Technology</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">05</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">03</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">08</td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onToggleFavorite(workspace)
                  }}
                  className="text-gray-400 hover:text-yellow-400"
                >
                  <Star
                    className="w-5 h-5 inline"
                    fill={workspace.is_favorite ? "currentColor" : "none"}
                    stroke={workspace.is_favorite ? "none" : "currentColor"}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
