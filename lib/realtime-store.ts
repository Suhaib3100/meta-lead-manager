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
  type: "lead_move" | "lead_update" | "note_add" | "label_add" | "status_change" | "user_joined" | "user_left" | "cursor_move"
  userId?: string
  userName?: string
  userColor?: string
}

interface ConnectedUser {
  id: string
  name: string
  color: string
  isOnline: boolean
  lastActivity: Date
}

interface CursorPosition {
  userId: string
  userName: string
  userColor: string
  x: number
  y: number
  timestamp: Date
}

interface RealtimeStore {
  leads: Lead[]
  activities: RealtimeActivity[]
  connectedUsers: ConnectedUser[]
  cursors: CursorPosition[]
  currentUser: ConnectedUser

  // Actions
  addActivity: (activity: Omit<RealtimeActivity, "id" | "timestamp">) => void
  updateLead: (lead: Lead, action: string) => void
  moveLeadRealtime: (leadId: string, fromStatus: string, toStatus: string) => void
  setLeads: (leads: Lead[]) => void
  
  // User management
  addConnectedUser: (user: ConnectedUser) => void
  removeConnectedUser: (userId: string) => void
  updateUserActivity: (userId: string) => void
  setCurrentUser: (user: ConnectedUser) => void
  
  // Cursor management
  updateCursor: (userId: string, x: number, y: number, userName: string, userColor: string) => void
  removeCursor: (userId: string) => void
  
  // Real-time event handlers
  handleLeadUpdated: (data: { leadId: string; updates: any; userId: string }) => void
  handleLeadMoved: (data: { leadId: string; fromStatus: string; toStatus: string; userId: string }) => void
  handleNoteAdded: (data: { leadId: string; note: string; userId: string; userName: string }) => void
  handleNoteUpdated: (data: { leadId: string; noteId: string; note: string; userId: string }) => void
  handleNoteDeleted: (data: { leadId: string; noteId: string; userId: string }) => void
  handleLabelAdded: (data: { leadId: string; label: string; userId: string }) => void
  handleLabelRemoved: (data: { leadId: string; label: string; userId: string }) => void
  handleFollowUpScheduled: (data: { leadId: string; date: string; userId: string }) => void
  handleFollowUpUpdated: (data: { leadId: string; date: string; userId: string }) => void
  handleFollowUpCancelled: (data: { leadId: string; userId: string }) => void
  handleUserJoined: (data: { userId: string; userName: string; userColor: string }) => void
  handleUserLeft: (data: { userId: string }) => void
  handleUserActivity: (data: { userId: string; action: string; leadId?: string }) => void
  handleCursorMoved: (data: { userId: string; x: number; y: number; userName: string; userColor: string }) => void
  handleLeadsSynced: (data: { count: number; userId: string }) => void
  handleColumnAdded: (data: { column: any; userId: string }) => void
  handleColumnUpdated: (data: { columnId: string; updates: any; userId: string }) => void
  handleColumnDeleted: (data: { columnId: string; userId: string }) => void
}

// Generate a random user ID and color for demo purposes
const generateUserId = () => `user_${Math.random().toString(36).substr(2, 9)}`
const generateUserColor = () => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']
  return colors[Math.floor(Math.random() * colors.length)]
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  leads: [],
  activities: [],
  connectedUsers: [],
  cursors: [],
  currentUser: {
    id: generateUserId(),
    name: `User ${Math.floor(Math.random() * 1000)}`,
    color: generateUserColor(),
    isOnline: true,
    lastActivity: new Date()
  },

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
          ...(lead.timeline || []),
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

  addConnectedUser: (user: ConnectedUser) => {
    set((state) => ({
      connectedUsers: [...state.connectedUsers.filter(u => u.id !== user.id), user]
    }))
  },

  removeConnectedUser: (userId: string) => {
    set((state) => ({
      connectedUsers: state.connectedUsers.filter(u => u.id !== userId),
      cursors: state.cursors.filter(c => c.userId !== userId)
    }))
  },

  updateUserActivity: (userId: string) => {
    set((state) => ({
      connectedUsers: state.connectedUsers.map(u => 
        u.id === userId ? { ...u, lastActivity: new Date() } : u
      )
    }))
  },

  setCurrentUser: (user: ConnectedUser) => {
    set({ currentUser: user })
  },

  updateCursor: (userId: string, x: number, y: number, userName: string, userColor: string) => {
    set((state) => ({
      cursors: [
        ...state.cursors.filter(c => c.userId !== userId),
        {
          userId,
          userName,
          userColor,
          x,
          y,
          timestamp: new Date()
        }
      ]
    }))
  },

  removeCursor: (userId: string) => {
    set((state) => ({
      cursors: state.cursors.filter(c => c.userId !== userId)
    }))
  },

  // Real-time event handlers
  handleLeadUpdated: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Lead updated by ${data.userId}`,
      leadId: data.leadId,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleLeadMoved: (data) => {
    const { moveLeadRealtime, addActivity } = get()
    moveLeadRealtime(data.leadId, data.fromStatus, data.toStatus)
    addActivity({
      action: `Lead moved by ${data.userId}`,
      leadId: data.leadId,
      fromStatus: data.fromStatus,
      toStatus: data.toStatus,
      type: "lead_move",
      userId: data.userId
    })
  },

  handleNoteAdded: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `${data.userName} added a note`,
      leadId: data.leadId,
      type: "note_add",
      userId: data.userId,
      userName: data.userName
    })
  },

  handleNoteUpdated: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Note updated by ${data.userId}`,
      leadId: data.leadId,
      type: "note_add",
      userId: data.userId
    })
  },

  handleNoteDeleted: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Note deleted by ${data.userId}`,
      leadId: data.leadId,
      type: "note_add",
      userId: data.userId
    })
  },

  handleLabelAdded: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Label added by ${data.userId}`,
      leadId: data.leadId,
      type: "label_add",
      userId: data.userId
    })
  },

  handleLabelRemoved: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Label removed by ${data.userId}`,
      leadId: data.leadId,
      type: "label_add",
      userId: data.userId
    })
  },

  handleFollowUpScheduled: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Follow-up scheduled by ${data.userId}`,
      leadId: data.leadId,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleFollowUpUpdated: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Follow-up updated by ${data.userId}`,
      leadId: data.leadId,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleFollowUpCancelled: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Follow-up cancelled by ${data.userId}`,
      leadId: data.leadId,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleUserJoined: (data) => {
    const { addConnectedUser, addActivity } = get()
    addConnectedUser({
      id: data.userId,
      name: data.userName,
      color: data.userColor,
      isOnline: true,
      lastActivity: new Date()
    })
    addActivity({
      action: `${data.userName} joined`,
      type: "user_joined",
      userId: data.userId,
      userName: data.userName,
      userColor: data.userColor
    })
  },

  handleUserLeft: (data) => {
    const { removeConnectedUser, addActivity } = get()
    const user = get().connectedUsers.find(u => u.id === data.userId)
    removeConnectedUser(data.userId)
    if (user) {
      addActivity({
        action: `${user.name} left`,
        type: "user_left",
        userId: data.userId,
        userName: user.name
      })
    }
  },

  handleUserActivity: (data) => {
    const { updateUserActivity, addActivity } = get()
    updateUserActivity(data.userId)
    addActivity({
      action: `User activity: ${data.action}`,
      leadId: data.leadId,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleCursorMoved: (data) => {
    const { updateCursor } = get()
    updateCursor(data.userId, data.x, data.y, data.userName, data.userColor)
  },

  handleLeadsSynced: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Leads synced by ${data.userId} (${data.count} leads)`,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleColumnAdded: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Column added by ${data.userId}`,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleColumnUpdated: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Column updated by ${data.userId}`,
      type: "lead_update",
      userId: data.userId
    })
  },

  handleColumnDeleted: (data) => {
    const { addActivity } = get()
    addActivity({
      action: `Column deleted by ${data.userId}`,
      type: "lead_update",
      userId: data.userId
    })
  }
}))
