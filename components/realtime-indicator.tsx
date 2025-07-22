"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useRealtimeStore } from "@/lib/realtime-store"

export function RealtimeIndicator() {
  const { activities } = useRealtimeStore()
  const recentActivities = activities.slice(0, 3)

  if (recentActivities.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
    </div>
  )
}
