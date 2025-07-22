"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, Users, Wifi, WifiOff } from "lucide-react"
import { useRealtimeStore } from "@/lib/realtime-store"
import { useSocket } from "@/hooks/use-socket"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

export function RealtimeIndicator() {
  const { activities, connectedUsers, currentUser } = useRealtimeStore()
  const recentActivities = activities.slice(0, 3)
  const otherUsers = connectedUsers.filter(user => user.id !== currentUser.id)

  // Initialize socket connection
  const socket = useSocket({
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
    onLeadUpdated: useRealtimeStore.getState().handleLeadUpdated,
    onLeadMoved: useRealtimeStore.getState().handleLeadMoved,
    onNoteAdded: useRealtimeStore.getState().handleNoteAdded,
    onNoteUpdated: useRealtimeStore.getState().handleNoteUpdated,
    onNoteDeleted: useRealtimeStore.getState().handleNoteDeleted,
    onLabelAdded: useRealtimeStore.getState().handleLabelAdded,
    onLabelRemoved: useRealtimeStore.getState().handleLabelRemoved,
    onFollowUpScheduled: useRealtimeStore.getState().handleFollowUpScheduled,
    onFollowUpUpdated: useRealtimeStore.getState().handleFollowUpUpdated,
    onFollowUpCancelled: useRealtimeStore.getState().handleFollowUpCancelled,
    onUserJoined: useRealtimeStore.getState().handleUserJoined,
    onUserLeft: useRealtimeStore.getState().handleUserLeft,
    onUserActivity: useRealtimeStore.getState().handleUserActivity,
    onCursorMoved: useRealtimeStore.getState().handleCursorMoved,
    onLeadsSynced: useRealtimeStore.getState().handleLeadsSynced,
    onColumnAdded: useRealtimeStore.getState().handleColumnAdded,
    onColumnUpdated: useRealtimeStore.getState().handleColumnUpdated,
    onColumnDeleted: useRealtimeStore.getState().handleColumnDeleted,
  })

  // Track cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (socket.isConnected) {
        socket.emitCursorMove(e.clientX, e.clientY)
      }
    }

    if (socket.isConnected) {
      document.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [socket.isConnected, socket.emitCursorMove])

  if (!socket.isConnected && !socket.isConnecting) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {/* Connection Status */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {socket.isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Connected</span>
              </>
            ) : socket.isConnecting ? (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <Wifi className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">Disconnected</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connected Users */}
      {otherUsers.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Online ({otherUsers.length})</span>
            </div>
            <div className="space-y-1">
              {otherUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", user.color)} />
                  <span className="text-xs text-slate-300">{user.name}</span>
                </div>
              ))}
              {otherUsers.length > 3 && (
                <span className="text-xs text-slate-400">+{otherUsers.length - 3} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm max-w-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Recent Updates</span>
            </div>
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="text-xs">
                  <p className="text-white font-medium leading-tight">{activity.action}</p>
                  <p className="text-slate-400">{activity.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
