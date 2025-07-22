"use client"

import { create } from "zustand"
import type { Lead } from "./mock-data"

export interface RealtimeActivity {
  id: string
  action: string
  leadId?: string
  leadName?: string
  fromStatus?: string
  toStatus?: string
  timestamp: Date
  type: "lead_move" | "lead_update" | "note_add" | "label_add" | "status_change"
}

interface RealtimeStore {
  leads: Lead[]
  activities: RealtimeActivity[]

  // Actions
  addActivity: (activity: Omit<RealtimeActivity, "id" | "timestamp">) => void
  updateLead: (lead: Lead, action: string) => void
  moveLeadRealtime: (leadId: string, fromStatus: string, toStatus: string) => void
  setLeads: (leads: Lead[]) => void
  simulateActivity: () => void
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  leads: [],
  activities: [],

  addActivity: (activity) => {
    const newActivity: RealtimeActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    }

    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 20), // Keep last 20 activities
    }))
  },

  updateLead: (lead: Lead, action: string) => {
    const { addActivity } = get()

    set((state) => ({
      leads: state.leads.map((l) => (l.id === lead.id ? lead : l)),
    }))

    // Add activity
    addActivity({
      action,
      leadId: lead.id,
      leadName: lead.name,
      type: "lead_update",
    })
  },

  moveLeadRealtime: (leadId: string, fromStatus: string, toStatus: string) => {
    const { leads, addActivity } = get()
    const lead = leads.find((l) => l.id === leadId)

    if (lead && lead.status !== toStatus) {
      const updatedLead = {
        ...lead,
        status: toStatus as Lead["status"],
        timeline: [
          ...lead.timeline,
          {
            action: `Status changed from ${fromStatus} to ${toStatus}`,
            timestamp: new Date().toISOString(),
            user: "User",
          },
        ],
      }

      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      }))

      // Add activity
      addActivity({
        action: `Moved ${lead.name} from ${fromStatus} to ${toStatus}`,
        leadId: lead.id,
        leadName: lead.name,
        fromStatus,
        toStatus,
        type: "lead_move",
      })
    }
  },

  setLeads: (leads: Lead[]) => {
    set({ leads })
  },

  simulateActivity: () => {
    const { leads } = get()

    if (leads.length === 0) return

    const randomLead = leads[Math.floor(Math.random() * leads.length)]
    const statuses = ["New", "Contacted", "Follow-Up", "Demo Scheduled", "Converted", "Lost"]
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)]

    // Simulate random activity every 15-45 seconds
    setTimeout(
      () => {
        if (Math.random() > 0.8) {
          // 20% chance of activity
          get().moveLeadRealtime(randomLead.id, randomLead.status, newStatus)
        }
        get().simulateActivity() // Continue simulation
      },
      Math.random() * 30000 + 15000,
    ) // 15-45 seconds
  },
}))
