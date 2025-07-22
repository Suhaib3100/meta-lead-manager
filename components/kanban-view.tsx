"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Calendar, MessageSquare, Phone, Mail, Clock, Plus, MoreHorizontal, CheckCircle, Star, Zap } from "lucide-react"
import type { Lead, KanbanColumn } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface KanbanViewProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: string) => void
  columns: KanbanColumn[]
  onAddColumn: (title: string) => void
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
  switch (service?.toLowerCase()) {
    case "web development":
    case "web-development":
      return "bg-blue-500 text-white border-blue-400"
    case "mobile app":
    case "app development":
      return "bg-green-500 text-white border-green-400"
    case "ui/ux design":
    case "design":
      return "bg-purple-500 text-white border-purple-400"
    case "seo":
    case "marketing":
      return "bg-orange-500 text-white border-orange-400"
    case "consulting":
      return "bg-indigo-500 text-white border-indigo-400"
    default:
      return "bg-gray-500 text-white border-gray-400"
  }
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
    
    // Common field names for service interest
    const serviceFields = [
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
        return formData[field];
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

export function KanbanView({ leads, onLeadClick, onStatusChange, columns, onAddColumn }: KanbanViewProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (columnId: string) => {
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedLead && draggedLead.status !== newStatus) {
      onStatusChange(draggedLead.id, newStatus)
    }
    setDraggedLead(null)
    setDragOverColumn(null)
  }

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status)
  }

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      onAddColumn(newColumnTitle.trim())
      setNewColumnTitle("")
      setShowAddColumn(false)
    }
  }

  return (
    <div className="h-full flex bg-[#0A0B0F]">
      {/* Fixed height container with horizontal scroll */}
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden h-[calc(100vh-280px)] min-h-[600px] pb-4">
        {columns.map((column) => {
          const columnLeads = getLeadsByStatus(column.id)
          const isDragOver = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-[340px] h-full"
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Container */}
              <div className={cn(
                "h-full bg-[#1C1D21] rounded-lg border transition-all duration-200 flex flex-col shadow-lg",
                isDragOver ? "border-blue-500 bg-blue-500/5 shadow-blue-500/20" : "border-gray-800"
              )}>
                {/* Column Header - Fixed */}
                <div className="flex-shrink-0 p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full shadow-sm", getStatusColor(column.id))} />
                      <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-800 text-gray-300 border-gray-700 text-xs h-5 px-2 font-medium"
                      >
                        {columnLeads.length}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 custom-scrollbar">
                  {columnLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-3 shadow-inner">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-center">No leads in this stage</p>
                      <p className="text-xs text-center text-gray-600 mt-1">Drag leads here</p>
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      const serviceInterest = getServiceInterest(lead)
                      
                      // Debug: Log form data for troubleshooting
                      if (lead.form_data && Object.keys(lead.form_data).length > 0) {
                        console.log(`Lead ${lead.name} form data:`, lead.form_data);
                      }
                      
                      return (
                        <Card
                          key={lead.id}
                          className={cn(
                            "cursor-pointer hover:shadow-xl transition-all duration-200 bg-[#0A0B0F] border-gray-800 hover:border-gray-700 group",
                            draggedLead?.id === lead.id ? "opacity-50 scale-95 rotate-1" : "hover:scale-[1.02] hover:shadow-blue-500/10"
                          )}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onClick={() => onLeadClick(lead)}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Lead Header */}
                            <div className="flex items-start gap-3">
                              <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-gray-800 group-hover:ring-blue-600/30 transition-all">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-semibold">
                                  {lead.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white text-sm truncate group-hover:text-blue-100 transition-colors">{lead.name}</h4>
                                <p className="text-xs text-gray-400 truncate">{lead.form_name || 'Lead Form'}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm" />
                                {lead.labels.includes("Hot") && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full shadow-sm animate-pulse" />
                                )}
                                {lead.labels.includes("VIP") && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                )}
                              </div>
                            </div>

                            {/* Service Interest - PROMINENT DISPLAY */}
                            <div className="bg-gray-800/50 rounded-md p-2.5 border border-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-400 mb-1">Service Interest</p>
                                  <Badge className={cn("text-xs font-medium", getServiceColor(serviceInterest))}>
                                    {serviceInterest}
                                  </Badge>
                                </div>
                                <Zap className="w-4 h-4 text-blue-400 opacity-70" />
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-gray-300">
                                <Mail className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="truncate font-medium">{lead.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-300">
                                <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="truncate font-medium">{lead.phone}</span>
                              </div>
                            </div>

                            {/* Labels */}
                            {lead.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {lead.labels.slice(0, 3).map((label, index) => (
                                  <Badge 
                                    key={index} 
                                    className={cn("text-xs px-2 py-0.5 h-5 font-medium", getLabelColor(label))}
                                  >
                                    {label}
                                  </Badge>
                                ))}
                                {lead.labels.length > 3 && (
                                  <Badge className="text-xs px-2 py-0.5 h-5 bg-gray-700 text-gray-300 border-gray-600 font-medium">
                                    +{lead.labels.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{formatDate(lead.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {lead.notes.length > 0 && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="font-medium">{lead.notes.length}</span>
                                  </div>
                                )}
                                {lead.next_follow_up && (
                                  <Badge className="text-xs h-4 px-1.5 bg-orange-600 text-white border-orange-500 font-medium animate-pulse">
                                    Due
                                  </Badge>
                                )}
                                {column.id === "Converted" && (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>

                {/* Column Footer - Optional Add Button */}
                <div className="flex-shrink-0 p-3 border-t border-gray-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-600 transition-all rounded-md"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add lead
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Column */}
        <div className="flex-shrink-0 w-[280px] h-full">
          {showAddColumn ? (
            <div className="h-full bg-[#1C1D21] rounded-lg border border-gray-800 p-4 shadow-lg">
              <div className="space-y-3">
                <Input
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddColumn()}
                  className="bg-[#0A0B0F] border-gray-700 text-white placeholder:text-gray-400 text-sm h-9 focus:border-blue-500 transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAddColumn} 
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-8 text-xs font-medium transition-colors"
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddColumn(false)}
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 h-8 text-xs transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-full border-2 border-dashed border-gray-700 hover:border-gray-600 bg-transparent text-gray-400 hover:text-gray-300 hover:bg-[#1C1D21] flex flex-col gap-2 transition-all rounded-lg"
              onClick={() => setShowAddColumn(true)}
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">Add Column</span>
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
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1C1D21;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  )
}
