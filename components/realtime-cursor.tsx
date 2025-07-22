"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRealtimeStore } from "@/lib/realtime-store"
import { cn } from "@/lib/utils"

interface CursorPosition {
  x: number
  y: number
  userId: string
}

export function RealtimeCursors() {
  const { users, currentUser } = useRealtimeStore()
  const [cursors, setCursors] = useState<CursorPosition[]>([])

  useEffect(() => {
    // Simulate other users' cursor movements
    const interval = setInterval(() => {
      const otherUsers = users.filter((u) => u.id !== currentUser.id && u.isOnline)

      setCursors(
        otherUsers.map((user) => ({
          userId: user.id,
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
        })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [users, currentUser.id])

  return (
    <>
      {cursors.map((cursor) => {
        const user = users.find((u) => u.id === cursor.userId)
        if (!user) return null

        return (
          <div
            key={cursor.userId}
            className="fixed pointer-events-none z-50 transition-all duration-1000 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6 ring-2 ring-white shadow-lg">
                <AvatarFallback className={cn("text-white text-xs", user.color)}>{user.avatar}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium shadow-lg border border-gray-700">
                {user.name}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
