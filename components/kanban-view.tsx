"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Calendar, MessageSquare, Phone, Mail, Clock, Plus, MoreHorizontal, CheckCircle, Star, Zap, Maximize2, Minimize2, Filter, Search } from "lucide-react"
import type { Lead, KanbanColumn } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { usePusher } from "@/hooks/use-pusher"
import { useRealtimeStore } from "@/lib/realtime-store"

interface KanbanViewProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: string) => void
  columns: KanbanColumn[]
  onAddColumn: (title: string) => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-500"
    case "Contacted":
      return "bg-yellow-500"
    case "Follow-Up":
      return "bg-orange-500"
    case "Demo Scheduled":
      return "bg-purple-500"
    case "Converted":
      return "bg-green-500"
    case "Lost":
      return "bg-gray-500"
    default:
      return "bg-gray-400"
  }
}

// Get the main service interest from form data or fallback
const getServiceInterest = (lead: Lead): string => {
  // Check form_data first - try multiple possible field names
  if (lead.form_data) {
    const formData = lead.form_data;
    
    // Common field names for service interest - updated based on actual data
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
        // Format the service name for better display
        if (value === 'web-development') return 'Web Development';
        if (value === 'digital-marketing') return 'Digital Marketing';
        if (value === 'app-development') return 'App Development';
        if (value === 'graphics-designing') return 'Graphics Design';
        if (value === 'व्हेज कॅटरिंग') return 'Veg Catering';
        if (value === 'Yes') return 'General Inquiry';
        return value;
      }
    }
    
    // If no specific service field, look for any field that might contain service info
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && (
        value.toLowerCase().includes('web') ||
        value.toLowerCase().includes('development') ||
        value.toLowerCase().includes('design') ||
        value.toLowerCase().includes('seo') ||
        value.toLowerCase().includes('marketing') ||
        value.toLowerCase().includes('app') ||
        value.toLowerCase().includes('mobile')
      )) {
        return value;
      }
    }
  }
  
  // Fallback to analyzing labels or source
  if (lead.labels.includes("Web Development")) return "Web Development"
  if (lead.labels.includes("Design")) return "UI/UX Design"
  if (lead.labels.includes("SEO")) return "SEO"
  
  // Default fallback
  return "General Inquiry"
}

const KanbanCard = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
  const serviceInterest = getServiceInterest(lead)
  const hasFollowUp = lead.next_follow_up && new Date(lead.next_follow_up) > new Date()
  const isOverdue = lead.next_follow_up && new Date(lead.next_follow_up) < new Date()

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#1C1D21] border border-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-[#1C1D21]/80"
    >
      {/* Priority Indicator */}
      {lead.labels.includes("High Priority") && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Follow-up Indicator */}
      {hasFollowUp && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        </div>
      )}

      {isOverdue && (
        <div className="absolute top-2 left-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Lead Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-blue-300 transition-colors">
            {lead.name}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            {lead.labels.includes("VIP") && (
              <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-black font-bold">★</span>
              </div>
            )}
            {lead.labels.includes("Hot") && (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Service Interest Badge */}
        <div className="mb-3">
          <Badge className={cn("text-xs font-medium px-2 py-1", getServiceColor(serviceInterest))}>
            {serviceInterest}
          </Badge>
        </div>
      </div>

      {/* Contact Info - Improved Visibility */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate font-medium">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-200">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{lead.phone}</span>
        </div>
      </div>

      {/* Labels */}
      {lead.labels.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {lead.labels.slice(0, 2).map((label, index) => (
              <Badge
                key={index}
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 border-opacity-50",
                  getLabelColor(label).replace("bg-", "border-").replace("text-white", "text-gray-300")
                )}
              >
                {label}
              </Badge>
            ))}
            {lead.labels.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-600 text-gray-400">
                +{lead.labels.length - 2}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Footer - Improved Visibility */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {lead.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-300 font-medium">
            {formatDateShort(lead.created_at)}
          </div>
        </div>

        {/* Status Indicator - Improved Visibility */}
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            lead.status === "new" && "bg-blue-500",
            lead.status === "Contacted" && "bg-yellow-500",
            lead.status === "Follow-Up" && "bg-orange-500",
            lead.status === "Demo Scheduled" && "bg-purple-500",
            lead.status === "Converted" && "bg-green-500",
            lead.status === "Lost" && "bg-red-500"
          )}></div>
          <span className="text-sm text-gray-300 font-medium capitalize">
            {lead.status === "new" ? "Intake" : lead.status}
          </span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
    </div>
  )
}

export function KanbanView({ 
  leads, 
  onLeadClick, 
  onStatusChange, 
  columns, 
  onAddColumn,
  isFullScreen = false,
  onToggleFullScreen
}: KanbanViewProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverCard, setDragOverCard] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Real-time pusher connection
  const { currentUser } = useRealtimeStore()
  const pusher = usePusher({
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

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = "move"
    
    // Set a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.transform = 'rotate(5deg) scale(0.95)'
    dragImage.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)'
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // Remove the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (columnId: string, cardId?: string) => {
    setDragOverColumn(columnId)
    if (cardId) {
      setDragOverCard(cardId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null)
      setDragOverCard(null)
    }
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedLead && draggedLead.status !== newStatus) {
      const fromStatus = draggedLead.status
      onStatusChange(draggedLead.id, newStatus)
      
      // Emit real-time event for lead movement
      if (pusher.isConnected) {
        pusher.emitLeadMove(draggedLead.id, fromStatus, newStatus)
        pusher.emitUserAction('moved_lead', draggedLead.id)
      }
    }
    setDraggedLead(null)
    setDragOverColumn(null)
    setDragOverCard(null)
    setIsDragging(false)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
    setDragOverColumn(null)
    setDragOverCard(null)
    setIsDragging(false)
  }

  const getLeadsByStatus = (status: string) => {
    let filteredLeads = leads.filter((lead) => lead.status === status)
    
    // Apply search filter
    if (searchQuery) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.phone && lead.phone.includes(searchQuery))
      )
    }
    
    return filteredLeads
  }

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      onAddColumn(newColumnTitle.trim())
      setNewColumnTitle("")
      setShowAddColumn(false)
    }
  }

  const columnWidth = isFullScreen ? "w-[380px]" : "w-[320px]"
  const cardPadding = isFullScreen ? "p-4" : "p-3"
  const avatarSize = isFullScreen ? "w-10 h-10" : "w-8 h-8"
  const textSize = isFullScreen ? "text-sm" : "text-sm"

  return (
    <div className={cn(
      "flex flex-col bg-[#0A0B0F]",
      isFullScreen ? "h-screen" : "h-full"
    )}>
      {/* Professional Header for Full Screen */}
      {isFullScreen && (
        <div className="flex-shrink-0 bg-[#1C1D21] border-b border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Lead Kanban Board</h1>
                  <p className="text-gray-400">Professional lead management workspace</p>
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0A0B0F] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow-Up">Follow-Up</option>
                  <option value="Demo Scheduled">Demo Scheduled</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullScreen}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Exit Full Screen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className={cn(
        "flex gap-4 overflow-x-auto overflow-y-hidden pb-6",
        isFullScreen ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-280px)] min-h-[600px]"
      )}>
        {columns.map((column) => {
          const columnLeads = getLeadsByStatus(column.id)
          const isDragOver = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              className={cn("flex-shrink-0 h-full", columnWidth)}
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Column Container */}
              <div className={cn(
                "h-full bg-[#1C1D21] rounded-xl border transition-all duration-200 flex flex-col shadow-xl",
                isDragOver ? "border-blue-500 bg-blue-500/5 shadow-blue-500/20" : "border-gray-800"
              )}>
                {/* Column Header - Enhanced */}
                <div className="flex-shrink-0 p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-4 h-4 rounded-full shadow-sm", getStatusColor(column.id))} />
                      <div>
                        <h3 className={cn("font-bold text-white", isFullScreen ? "text-lg" : "text-base")}>
                          {column.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {columnLeads.length} leads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-800 text-gray-300 border-gray-700 text-xs h-6 px-3 font-medium"
                      >
                        {columnLeads.length}
                      </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 custom-scrollbar">
                  {columnLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4 shadow-inner">
                        <Plus className="w-8 h-8" />
                      </div>
                      <p className="text-sm text-center font-medium">No leads in this stage</p>
                      <p className="text-xs text-center text-gray-600 mt-1">Drag leads here to organize</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <KanbanCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => onLeadClick(lead)}
                      />
                    ))
                  )}
                </div>

                {/* Column Footer - Enhanced */}
                <div className="flex-shrink-0 p-3 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-10 text-sm text-gray-400 hover:text-white hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-600 transition-all rounded-lg font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add lead
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Column - Enhanced */}
        <div className={cn("flex-shrink-0 h-full", columnWidth)}>
          {showAddColumn ? (
            <div className="h-full bg-[#1C1D21] rounded-xl border border-gray-800 p-6 shadow-xl">
              <div className="space-y-4">
                <Input
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddColumn()}
                  className="bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400 text-sm h-12 focus:border-blue-500 transition-colors"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button 
                    size="sm" 
                    onClick={handleAddColumn} 
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-10 text-sm font-semibold transition-colors"
                  >
                    Add Column
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddColumn(false)}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-10 text-sm transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-full border-2 border-dashed border-gray-700 hover:border-gray-600 bg-transparent text-gray-400 hover:text-gray-300 hover:bg-[#1C1D21] flex flex-col gap-3 transition-all rounded-xl"
              onClick={() => setShowAddColumn(true)}
            >
              <Plus className="w-8 h-8" />
              <span className="text-base font-semibold">Add Column</span>
            </Button>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #374151 #1C1D21;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1C1D21;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  )
}
