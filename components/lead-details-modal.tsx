"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, MessageSquare, Phone, Mail, Clock, Plus, X, Edit, Trash2, CalendarDays, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePusher } from "@/hooks/use-pusher"
import { useRealtimeStore } from "@/lib/realtime-store"
import { cn } from "@/lib/utils"
import type { Lead } from "@/lib/mock-data"

interface Note {
  id: string
  content: string
  userId: string
  userName: string
  createdAt: string
}

interface FollowUp {
  id: string
  scheduledAt: string
  notes?: string
  completed: boolean
  createdAt: string
}

interface LeadDetailsModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (leadId: string, updates: any) => void
}

export function LeadDetailsModal({ lead, isOpen, onClose, onUpdate }: LeadDetailsModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [newNote, setNewNote] = useState("")
  const [newFollowUp, setNewFollowUp] = useState({ date: "", time: "", notes: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false)
  const { toast } = useToast()
  
  const { currentUser } = useRealtimeStore()
  const pusher = usePusher({
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
    onLeadUpdated: useRealtimeStore.getState().handleLeadUpdated,
    onLeadMoved: useRealtimeStore.getState().handleLeadMoved,
    onNoteAdded: (data) => {
      if (data.leadId === lead?.id) {
        fetchNotes()
      }
      useRealtimeStore.getState().handleNoteAdded(data)
    },
    onNoteUpdated: useRealtimeStore.getState().handleNoteUpdated,
    onNoteDeleted: useRealtimeStore.getState().handleNoteDeleted,
    onLabelAdded: useRealtimeStore.getState().handleLabelAdded,
    onLabelRemoved: useRealtimeStore.getState().handleLabelRemoved,
    onFollowUpScheduled: (data) => {
      if (data.leadId === lead?.id) {
        fetchFollowUps()
      }
      useRealtimeStore.getState().handleFollowUpScheduled(data)
    },
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

  useEffect(() => {
    if (lead && isOpen) {
      fetchNotes()
      fetchFollowUps()
    }
  }, [lead, isOpen])

  const fetchNotes = async () => {
    if (!lead) return
    
    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`)
      const data = await response.json()
      if (data.notes) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const fetchFollowUps = async () => {
    if (!lead) return
    
    try {
      const response = await fetch(`/api/leads/${lead.id}/follow-ups`)
      const data = await response.json()
      if (data.followUps) {
        setFollowUps(data.followUps)
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error)
    }
  }

  const addNote = async () => {
    if (!lead || !newNote.trim()) return
    
    setIsAddingNote(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          userId: currentUser.id,
          userName: currentUser.name
        })
      })

      if (response.ok) {
        setNewNote("")
        await fetchNotes()
        
        // Emit real-time event
        if (pusher.isConnected) {
          pusher.emitAddNote(lead.id, newNote)
          pusher.emitUserAction('added_note', lead.id)
        }
        
        toast({
          title: 'Note Added',
          description: 'Note has been added successfully',
        })
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      })
    } finally {
      setIsAddingNote(false)
    }
  }

  const addFollowUp = async () => {
    if (!lead || !newFollowUp.date || !newFollowUp.time) return
    
    setIsAddingFollowUp(true)
    try {
      const scheduledAt = new Date(`${newFollowUp.date}T${newFollowUp.time}`)
      
      const response = await fetch(`/api/leads/${lead.id}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          notes: newFollowUp.notes || null
        })
      })

      if (response.ok) {
        setNewFollowUp({ date: "", time: "", notes: "" })
        await fetchFollowUps()
        
        // Emit real-time event
        if (pusher.isConnected) {
          pusher.emitScheduleFollowUp(lead.id, scheduledAt.toISOString())
          pusher.emitUserAction('scheduled_follow_up', lead.id)
        }
        
        toast({
          title: 'Follow-up Scheduled',
          description: 'Follow-up has been scheduled successfully',
        })
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
      toast({
        title: 'Error',
        description: 'Failed to schedule follow-up',
        variant: 'destructive',
      })
    } finally {
      setIsAddingFollowUp(false)
    }
  }

  const updateLeadStatus = async (newStatus: string) => {
    if (!lead) return
    
    try {
      await onUpdate(lead.id, { status: newStatus })
      
      // Emit real-time event
      if (pusher.isConnected) {
        pusher.emitLeadUpdate(lead.id, { status: newStatus })
        pusher.emitUserAction('updated_status', lead.id)
      }
      
      toast({
        title: 'Status Updated',
        description: `Lead status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const addLabel = async (label: string) => {
    if (!lead) return
    
    try {
      const updatedLabels = [...lead.labels, label]
      await onUpdate(lead.id, { labels: updatedLabels })
      
      // Emit real-time event
      if (pusher.isConnected) {
        pusher.emitAddLabel(lead.id, label)
        pusher.emitUserAction('added_label', lead.id)
      }
      
      toast({
        title: 'Label Added',
        description: `Label "${label}" added successfully`,
      })
    } catch (error) {
      console.error('Error adding label:', error)
      toast({
        title: 'Error',
        description: 'Failed to add label',
        variant: 'destructive',
      })
    }
  }

  const removeLabel = async (label: string) => {
    if (!lead) return
    
    try {
      const updatedLabels = lead.labels.filter(l => l !== label)
      await onUpdate(lead.id, { labels: updatedLabels })
      
      // Emit real-time event
      if (pusher.isConnected) {
        pusher.emitRemoveLabel(lead.id, label)
        pusher.emitUserAction('removed_label', lead.id)
      }
      
      toast({
        title: 'Label Removed',
        description: `Label "${label}" removed successfully`,
      })
    } catch (error) {
      console.error('Error removing label:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove label',
        variant: 'destructive',
      })
    }
  }

  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold">
                {lead.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{lead.name}</h2>
              <p className="text-sm text-gray-500">{lead.form_name || 'Lead Form'}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Lead Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{lead.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Created {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <div className="flex flex-wrap gap-2">
                {["New", "Contacted", "Follow-Up", "Demo Scheduled", "Converted", "Lost"].map((status) => (
                  <Button
                    key={status}
                    variant={lead.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateLeadStatus(status)}
                    className="text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Labels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {lead.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="flex items-center gap-1">
                    {label}
                    <button
                      onClick={() => removeLabel(label)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const label = prompt("Enter new label:")
                    if (label) addLabel(label)
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Label
                </Button>
              </div>
            </div>

            {/* Service Interest */}
            {lead.form_data && Object.keys(lead.form_data).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Form Data</h3>
                <div className="space-y-2">
                  {Object.entries(lead.form_data).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="ml-2 text-gray-600">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Notes & Follow-ups */}
          <div className="space-y-6">
            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Notes ({notes.length})
              </h3>
              
              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={addNote}
                  disabled={!newNote.trim() || isAddingNote}
                  size="sm"
                  className="w-full"
                >
                  {isAddingNote ? "Adding..." : "Add Note"}
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{note.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="font-medium">{note.userName}</span>
                          <span>•</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No notes yet. Add the first note above.
                  </p>
                )}
              </div>
            </div>

            {/* Follow-ups */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Follow-ups ({followUps.length})
              </h3>
              
              {/* Add Follow-up */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={newFollowUp.date}
                    onChange={(e) => setNewFollowUp(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="Date"
                  />
                  <Input
                    type="time"
                    value={newFollowUp.time}
                    onChange={(e) => setNewFollowUp(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="Time"
                  />
                </div>
                <Textarea
                  placeholder="Follow-up notes (optional)"
                  value={newFollowUp.notes}
                  onChange={(e) => setNewFollowUp(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[60px]"
                />
                <Button
                  onClick={addFollowUp}
                  disabled={!newFollowUp.date || !newFollowUp.time || isAddingFollowUp}
                  size="sm"
                  className="w-full"
                >
                  {isAddingFollowUp ? "Scheduling..." : "Schedule Follow-up"}
                </Button>
              </div>

              {/* Follow-ups List */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {followUps.map((followUp) => (
                  <div key={followUp.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {new Date(followUp.scheduledAt).toLocaleString()}
                          </span>
                          {followUp.completed && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {followUp.notes && (
                          <p className="text-sm text-gray-600 mt-1">{followUp.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {followUps.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No follow-ups scheduled. Add one above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 