"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, Eye } from "lucide-react"

interface ModeSwitcherProps {
  workspaceId: string
  currentMode: string
}

export function ModeSwitcher({ workspaceId, currentMode }: ModeSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const switchMode = (newMode: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("mode", newMode)
    router.push(`/workspace/${workspaceId}?${params.toString()}`)
  }

  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
      <Button
        variant={currentMode === "sender" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchMode("sender")}
        className={`${
          currentMode === "sender"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
        }`}
      >
        <Send className="w-4 h-4 mr-2" />
        Sender
      </Button>
      <Button
        variant={currentMode === "recipient" ? "default" : "ghost"}
        size="sm"
        onClick={() => switchMode("recipient")}
        className={`${
          currentMode === "recipient"
            ? "bg-green-600 text-white hover:bg-green-700"
            : "text-gray-600 hover:text-green-600 hover:bg-green-50"
        }`}
      >
        <Eye className="w-4 h-4 mr-2" />
        Recipient
      </Button>
    </div>
  )
}
