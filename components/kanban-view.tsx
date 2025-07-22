"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Calendar, MessageSquare, Phone, Mail, Clock, Plus, MoreHorizontal } from "lucide-react"
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
      return "bg-red-500 text-white"
    case "Cold":
      return "bg-blue-500 text-white"
    case "High Priority":
      return "bg-orange-500 text-white"
    case "Qualified":
      return "bg-green-500 text-white"
    case "VIP":
      return "bg-purple-500 text-white"
    case "Demo":
      return "bg-indigo-500 text-white"
    default:
      return "bg-slate-600 text-white"
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function KanbanView({ leads, onLeadClick, onStatusChange, columns, onAddColumn }: KanbanViewProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [showAddColumn, setShowAddColumn] = useState(false)

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedLead && draggedLead.status !== newStatus) {
      onStatusChange(draggedLead.id, newStatus)
    }
    setDraggedLead(null)
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
    <div className="flex gap-6 overflow-x-auto pb-6">
      {columns.map((column) => {
        const columnLeads = getLeadsByStatus(column.id)

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 min-h-[600px] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white text-lg">{column.title}</h3>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700">
                    {columnLeads.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={cn(
                      "cursor-pointer hover:bg-slate-800/50 bg-slate-800/30 border-slate-700 transition-all duration-200 backdrop-blur-sm",
                      draggedLead?.id === lead.id ? "opacity-50 scale-95" : "",
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    onClick={() => onLeadClick(lead)}
                  >
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                              {lead.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-white text-sm">{lead.name}</h4>
                            <p className="text-xs text-slate-400">{lead.form_name}</p>
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>

                      {/* Labels */}
                      {lead.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.labels.slice(0, 2).map((label, index) => (
                            <Badge key={index} className={cn("text-xs px-2 py-1", getLabelColor(label))}>
                              {label}
                            </Badge>
                          ))}
                          {lead.labels.length > 2 && (
                            <Badge className="text-xs px-2 py-1 bg-slate-600 text-white">
                              +{lead.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(lead.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {lead.notes.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{lead.notes.length}</span>
                            </div>
                          )}
                          {lead.next_follow_up && <Badge className="text-xs bg-orange-500 text-white">Due</Badge>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                        >
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* Add Column */}
      <div className="flex-shrink-0 w-80">
        {showAddColumn ? (
          <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-4 backdrop-blur-sm">
            <div className="space-y-3">
              <Input
                placeholder="Column name..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddColumn()}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColumn} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                  Add Column
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddColumn(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-20 border-2 border-dashed border-slate-700 hover:border-slate-600 bg-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-900/30"
            onClick={() => setShowAddColumn(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Column
          </Button>
        )}
      </div>
    </div>
  )
}
