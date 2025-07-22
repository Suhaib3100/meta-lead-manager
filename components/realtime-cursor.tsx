"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRealtimeStore } from "@/lib/realtime-store"
import { cn } from "@/lib/utils"

export function RealtimeCursors() {
  const { cursors, currentUser } = useRealtimeStore()

  // Filter out current user's cursor and old cursors (older than 5 seconds)
  const otherCursors = cursors.filter(cursor => {
    const isNotCurrentUser = cursor.userId !== currentUser.id
    const isRecent = Date.now() - cursor.timestamp.getTime() < 5000
    return isNotCurrentUser && isRecent
  })

  if (otherCursors.length === 0) return null

  return (
    <>
      {otherCursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="fixed pointer-events-none z-50 transition-all duration-300 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 ring-2 ring-white shadow-lg">
              <AvatarFallback className={cn("text-white text-xs", cursor.userColor)}>
                {cursor.userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium shadow-lg border border-gray-700">
              {cursor.userName}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
