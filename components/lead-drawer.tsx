"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Tag,
  X,
  User,
  Activity,
  Edit3,
  Trash2,
  CalendarDays,
  Bell,
  Zap,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import type { Lead } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/use-socket"
import { useRealtimeStore } from "@/lib/realtime-store"

interface LeadDrawerProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (leadId: string, updates: any) => void
}

const getLabelColor = (label: string) => {
  switch (label) {
    case "Hot":
      return "bg-red-600 text-white border-red-500"
    case "Cold":
      return "bg-blue-600 text-white border-blue-500"
    case "High Priority":
      return "bg-orange-600 text-white border-orange-500"
    case "Qualified":
      return "bg-green-600 text-white border-green-500"
    case "VIP":
      return "bg-purple-600 text-white border-purple-500"
    case "Demo":
      return "bg-indigo-600 text-white border-indigo-500"
    default:
      return "bg-gray-600 text-white border-gray-500"
  }
}

const getServiceColor = (service: string) => {
  const serviceLower = service.toLowerCase();
  
  if (serviceLower.includes('web') || serviceLower.includes('development')) {
    return 'bg-blue-600 text-white border-blue-500';
  }
  if (serviceLower.includes('digital') || serviceLower.includes('marketing')) {
    return 'bg-green-600 text-white border-green-500';
  }
  if (serviceLower.includes('app') || serviceLower.includes('mobile')) {
    return 'bg-purple-600 text-white border-purple-500';
  }
  if (serviceLower.includes('design') || serviceLower.includes('graphics')) {
    return 'bg-pink-600 text-white border-pink-500';
  }
  if (serviceLower.includes('catering') || serviceLower.includes('कॅटरिंग')) {
    return 'bg-orange-600 text-white border-orange-500';
  }
  if (serviceLower.includes('seo')) {
    return 'bg-yellow-600 text-white border-yellow-500';
  }
  if (serviceLower.includes('general') || serviceLower.includes('inquiry') || serviceLower === 'yes') {
    return 'bg-gray-600 text-white border-gray-500';
  }
  
  return 'bg-gray-600 text-white border-gray-500';
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatDateShort = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Get the main service interest from form data
const getServiceInterest = (lead: Lead): string => {
  if (lead.form_data) {
    const formData = lead.form_data;
    
    const serviceFields = [
      'what_service_are_you_interested_in?',
      'service',
      'service_interest', 
      'What service are you interested in?',
      'service_interest_question',
      'interest',
      'service_type',
      'service_category',
      'business_type',
      'service_needed'
    ];
    
    for (const field of serviceFields) {
      if (formData[field]) {
        const value = formData[field];
        if (value === 'web-development') return 'Web Development';
        if (value === 'digital-marketing') return 'Digital Marketing';
        if (value === 'app-development') return 'App Development';
        if (value === 'graphics-designing') return 'Graphics Design';
        if (value === 'व्हेज कॅटरिंग') return 'Veg Catering';
        if (value === 'Yes') return 'General Inquiry';
        return value;
      }
    }
  }
  
  if (lead.labels.includes("Web Development")) return "Web Development"
  if (lead.labels.includes("Design")) return "UI/UX Design"
  if (lead.labels.includes("SEO")) return "SEO"
  
  return "General Inquiry"
}

const quickFollowUpOptions = [
  { label: "Today", value: 0, icon: Clock },
  { label: "Tomorrow", value: 1, icon: Calendar },
  { label: "Next Week", value: 7, icon: CalendarDays },
  { label: "Next Monday", value: "monday", icon: CalendarDays },
  { label: "Custom", value: "custom", icon: Edit3 },
]

export function LeadDrawer({ lead, isOpen, onClose, onUpdate }: LeadDrawerProps) {
  const [newNote, setNewNote] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [editNoteText, setEditNoteText] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const { currentUser } = useRealtimeStore()
  
  // Initialize socket connection
  const socket = useSocket({
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
    onLeadUpdated: (data) => {
      if (data.leadId === lead?.id) {
        // Update the lead in real-time
        onUpdate(data.leadId, data.updates)
      }
    },
    onNoteAdded: (data) => {
      if (data.leadId === lead?.id) {
        // Refresh the lead to get updated notes
        // This will be handled by the parent component
      }
    },
    onNoteUpdated: (data) => {
      if (data.leadId === lead?.id) {
        // Refresh the lead to get updated notes
      }
    },
    onNoteDeleted: (data) => {
      if (data.leadId === lead?.id) {
        // Refresh the lead to get updated notes
      }
    },
    onLabelAdded: (data) => {
      if (data.leadId === lead?.id) {
        // Update labels in real-time
        onUpdate(data.leadId, { labels: [...(lead?.labels || []), data.label] })
      }
    },
    onLabelRemoved: (data) => {
      if (data.leadId === lead?.id) {
        // Update labels in real-time
        onUpdate(data.leadId, { labels: (lead?.labels || []).filter(l => l !== data.label) })
      }
    },
    onFollowUpScheduled: (data) => {
      if (data.leadId === lead?.id) {
        // Update follow-up in real-time
        onUpdate(data.leadId, { next_follow_up: data.date })
      }
    },
    onFollowUpUpdated: (data) => {
      if (data.leadId === lead?.id) {
        // Update follow-up in real-time
        onUpdate(data.leadId, { next_follow_up: data.date })
      }
    },
    onFollowUpCancelled: (data) => {
      if (data.leadId === lead?.id) {
        // Clear follow-up in real-time
        onUpdate(data.leadId, { next_follow_up: null })
      }
    },
  })

  if (!lead) return null

  const serviceInterest = getServiceInterest(lead)

  // Real-time update functions
  const updateField = (field: keyof Lead, value: any) => {
    setIsUpdating(true)
    const updates = { [field]: value }
    
    // Emit real-time update
    socket.emitLeadUpdate(lead.id, updates)
    
    // Update locally
    onUpdate(lead.id, updates)
    
    // Add to timeline
    const timelineUpdate = {
      timeline: [
        ...(lead.timeline || []),
        {
          action: `${field} updated`,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
        },
      ]
    }
    onUpdate(lead.id, timelineUpdate)
    
    setIsUpdating(false)
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    setIsUpdating(true)
    
    try {
      // Add note via API
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });

      if (response.ok) {
        // Emit real-time note addition
        socket.emitAddNote(lead.id, newNote)
        
        // Refresh the lead to get updated notes
        // This will be handled by the parent component
        setNewNote("")
      } else {
        console.error('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updateNote = async (index: number) => {
    if (!editNoteText.trim()) return

    setIsUpdating(true)
    
    try {
      // Get the note ID from the current notes
      const currentNotes = lead.notes
      const noteToUpdate = currentNotes[index]
      
      if (typeof noteToUpdate === 'object' && noteToUpdate.id) {
        // Update note via API
        const response = await fetch(`/api/leads/${lead.id}/notes/${noteToUpdate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: editNoteText,
          }),
        });

        if (response.ok) {
          // Emit real-time note update
          socket.emitUpdateNote(lead.id, noteToUpdate.id, editNoteText)
          
          setEditingNote(null)
          setEditNoteText("")
        } else {
          console.error('Failed to update note')
        }
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteNote = async (index: number) => {
    setIsUpdating(true)
    
    try {
      // Get the note ID from the current notes
      const currentNotes = lead.notes
      const noteToDelete = currentNotes[index]
      
      if (typeof noteToDelete === 'object' && noteToDelete.id) {
        // Delete note via API
        const response = await fetch(`/api/leads/${lead.id}/notes/${noteToDelete.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Emit real-time note deletion
          socket.emitDeleteNote(lead.id, noteToDelete.id)
        } else {
          console.error('Failed to delete note')
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const addLabel = () => {
    if (!newLabel.trim() || lead.labels.includes(newLabel)) return

    setIsUpdating(true)
    
    // Emit real-time label addition
    socket.emitAddLabel(lead.id, newLabel)
    
    const updatedLabels = [...lead.labels, newLabel]
    const updates = {
      labels: updatedLabels,
      timeline: [
        ...(lead.timeline || []),
        {
          action: `Label "${newLabel}" added`,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
        },
      ]
    }

    onUpdate(lead.id, updates)
    setNewLabel("")
    setIsUpdating(false)
  }

  const removeLabel = (labelToRemove: string) => {
    setIsUpdating(true)
    
    // Emit real-time label removal
    socket.emitRemoveLabel(lead.id, labelToRemove)
    
    const updatedLabels = lead.labels.filter((label) => label !== labelToRemove)
    const updates = {
      labels: updatedLabels,
      timeline: [
        ...(lead.timeline || []),
        {
          action: `Label "${labelToRemove}" removed`,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
        },
      ]
    }

    onUpdate(lead.id, updates)
    setIsUpdating(false)
  }

  const handleQuickFollowUp = (option: any) => {
    const followUpDate = new Date()

    if (typeof option.value === "number") {
      followUpDate.setDate(followUpDate.getDate() + option.value)
    } else if (option.value === "monday") {
      const daysUntilMonday = (8 - followUpDate.getDay()) % 7 || 7
      followUpDate.setDate(followUpDate.getDate() + daysUntilMonday)
    } else if (option.value === "custom") {
      setShowCustomDate(true)
      return
    }

    setIsUpdating(true)
    
    // Emit real-time follow-up scheduling
    socket.emitScheduleFollowUp(lead.id, followUpDate.toISOString())
    
    const updates = {
      next_follow_up: followUpDate.toISOString(),
      timeline: [
        ...(lead.timeline || []),
        {
          action: `Follow-up scheduled for ${option.label}`,
          timestamp: new Date().toISOString(),
          user: currentUser.name,
        },
      ]
    }

    onUpdate(lead.id, updates)
    setIsUpdating(false)
  }

  const clearFollowUp = () => {
    setIsUpdating(true)
    
    // Emit real-time follow-up cancellation
    socket.emitCancelFollowUp(lead.id)
    
    const updates = {
      next_follow_up: null,
      timeline: [
        ...(lead.timeline || []),
        {
          action: "Follow-up cancelled",
          timestamp: new Date().toISOString(),
          user: currentUser.name,
        },
      ]
    }

    onUpdate(lead.id, updates)
    setIsUpdating(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#0A0B0F] border-gray-800 text-white">
        <SheetHeader className="space-y-4 pb-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold text-white">Lead Details</SheetTitle>
            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Updating...
              </div>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#1C1D21] border-gray-800">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <MessageSquare className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Lead Profile */}
            <Card className="bg-[#1C1D21] border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg font-semibold">
                      {lead.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{lead.name}</h3>
                    <p className="text-sm text-gray-400">Lead ID: {lead.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn("text-sm", getLabelColor(lead.status))}>
                        {lead.status}
                      </Badge>
                      <Badge className="text-sm bg-green-600 text-white border-green-500">
                        <Zap className="w-3 h-3 mr-1" />
                        High Intent
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Service Interest */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <Label className="text-sm font-medium text-gray-300 mb-2 block">Service Interest</Label>
                  <Badge className={cn("text-sm font-semibold px-3 py-1", getServiceColor(serviceInterest))}>
                    {serviceInterest}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                        Email Address
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          value={lead.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className="flex-1 bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-300">
                        Phone Number
                      </Label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={lead.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className="flex-1 bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                        Status
                      </Label>
                      <Select value={lead.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="bg-[#0A0B0F] border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1D21] border-gray-700">
                          <SelectItem value="new">Intake</SelectItem>
                          <SelectItem value="Contacted">Connected</SelectItem>
                          <SelectItem value="Follow-Up">Callback Required</SelectItem>
                          <SelectItem value="Demo Scheduled">Qualified</SelectItem>
                          <SelectItem value="Converted">Non Qualified</SelectItem>
                          <SelectItem value="Lost">Call Back After</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-300">Lead Source</Label>
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                        <div className="text-sm">
                          <span className="font-medium text-gray-300">Form:</span>{" "}
                          <span className="text-white">{lead.form_name}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="font-medium text-gray-300">Created:</span>{" "}
                          <span className="text-white">{formatDateTime(lead.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Labels Management */}
            <Card className="bg-[#1C1D21] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Tag className="w-5 h-5" />
                  Labels & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {lead.labels.map((label, index) => (
                    <Badge key={index} className={cn("text-sm", getLabelColor(label))}>
                      {label}
                      <button onClick={() => removeLabel(label)} className="ml-2 hover:bg-white/10 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add new label..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLabel()}
                    className="flex-1 bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addLabel} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6 mt-6">
            <Card className="bg-[#1C1D21] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addNote} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {lead.notes.map((note, index) => {
                    // Handle both string notes and database note objects
                    const noteData = typeof note === 'string' 
                      ? { text: note, timestamp: lead.created_at, user: currentUser.name }
                      : { 
                          text: (note as any).content || (note as any).text || String(note), 
                          timestamp: (note as any).createdAt || (note as any).timestamp || lead.created_at, 
                          user: (note as any).userName || (note as any).user || currentUser.name,
                          id: (note as any).id
                        };
                    
                    return (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        {editingNote === index ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              rows={3}
                              className="bg-[#0A0B0F] border-gray-700 text-white"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateNote(index)}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingNote(null)
                                  setEditNoteText("")
                                }}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-white leading-relaxed">{noteData.text}</p>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-gray-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {formatDateTime(noteData.timestamp)}
                                <span className="text-gray-500">•</span>
                                <span>{noteData.user}</span>
                              </p>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingNote(index)
                                    setEditNoteText(noteData.text)
                                  }}
                                  className="text-gray-400 hover:text-white hover:bg-gray-700 h-6 w-6 p-0"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => deleteNote(index)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-gray-700 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {lead.notes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notes yet. Add your first note above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6 mt-6">
            <Card className="bg-[#1C1D21] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5" />
                  Follow-up Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {lead.next_follow_up && (
                  <div className="flex items-center gap-3 bg-orange-600/20 p-4 rounded-lg border border-orange-600/30">
                    <Bell className="w-5 h-5 text-orange-400" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-300">Next Follow-up</p>
                      <p className="text-sm text-orange-200">{formatDateTime(lead.next_follow_up)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={clearFollowUp}
                      className="border-orange-600 text-orange-400 hover:bg-orange-600/20"
                    >
                      Clear
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-300">Quick Schedule</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {quickFollowUpOptions.map((option, index) => {
                      const IconComponent = option.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          onClick={() => handleQuickFollowUp(option)}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-12"
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {showCustomDate && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-300">Custom Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={
                        lead.next_follow_up
                          ? new Date(lead.next_follow_up).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value).toISOString() : null;
                        if (date) {
                          socket.emitScheduleFollowUp(lead.id, date);
                          onUpdate(lead.id, { next_follow_up: date });
                        }
                      }}
                      className="bg-[#0A0B0F] border-gray-700 text-white"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowCustomDate(false)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-[#1C1D21] border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(lead.timeline || []).map((activity, index) => (
                    <div key={index} className="flex gap-3 pb-4 border-b border-gray-800 last:border-b-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">{formatDateTime(activity.timestamp)}</p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-400">by {activity.user}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(lead.timeline || []).length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
