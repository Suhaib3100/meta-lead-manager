"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  Eye,
  MessageSquare,
  MoreHorizontal,
  TrendingUp,
  Edit3,
  Check,
  X,
  Brain,
  Zap,
  AlertCircle,
  Clock,
} from "lucide-react"
import type { Lead } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ListViewProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onStatusChange: (leadId: string, newStatus: string) => void
  selectedLeads: string[]
  onSelectLeads: (leadIds: string[]) => void
  onUpdateLead: (lead: Lead) => void
}

const getLabelColor = (label: string) => {
  switch (label) {
    case "Hot":
      return "bg-red-900 text-red-300 border-red-800"
    case "Cold":
      return "bg-blue-900 text-blue-300 border-blue-800"
    case "High Priority":
      return "bg-orange-900 text-orange-300 border-orange-800"
    case "Qualified":
      return "bg-green-900 text-green-300 border-green-800"
    case "VIP":
      return "bg-purple-900 text-purple-300 border-purple-800"
    case "Demo":
      return "bg-indigo-900 text-indigo-300 border-indigo-800"
    default:
      return "bg-gray-800 text-gray-300 border-gray-700"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "New":
      return "bg-blue-900 text-blue-300 border-blue-800"
    case "Contacted":
      return "bg-yellow-900 text-yellow-300 border-yellow-800"
    case "Follow-Up":
      return "bg-orange-900 text-orange-300 border-orange-800"
    case "Demo Scheduled":
      return "bg-purple-900 text-purple-300 border-purple-800"
    case "Converted":
      return "bg-green-900 text-green-300 border-green-800"
    case "Lost":
      return "bg-gray-800 text-gray-300 border-gray-700"
    default:
      return "bg-gray-800 text-gray-300 border-gray-700"
  }
}

const getAIInsight = (lead: Lead) => {
  const insights = [
    { label: "High Intent", confidence: 92, color: "text-green-400", icon: TrendingUp },
    { label: "Needs Follow-up", confidence: 78, color: "text-orange-400", icon: AlertCircle },
    { label: "Cold Lead", confidence: 65, color: "text-blue-400", icon: Clock },
    { label: "Hot Prospect", confidence: 88, color: "text-red-400", icon: Zap },
  ]

  if (lead.labels.includes("Hot") || lead.labels.includes("High Priority")) {
    return insights[0]
  } else if (lead.next_follow_up) {
    return insights[1]
  } else if (lead.labels.includes("Cold")) {
    return insights[2]
  } else {
    return insights[3]
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ListView({
  leads,
  onLeadClick,
  onStatusChange,
  selectedLeads,
  onSelectLeads,
  onUpdateLead,
}: ListViewProps) {
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectLeads(leads.map((lead) => lead.id))
    } else {
      onSelectLeads([])
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      onSelectLeads([...selectedLeads, leadId])
    } else {
      onSelectLeads(selectedLeads.filter((id) => id !== leadId))
    }
  }

  const startEditing = (leadId: string, field: string, currentValue: string) => {
    setEditingCell({ leadId, field })
    setEditValue(currentValue)
  }

  const saveEdit = () => {
    if (editingCell) {
      const lead = leads.find((l) => l.id === editingCell.leadId)
      if (lead) {
        const updatedLead = {
          ...lead,
          [editingCell.field]: editValue,
          timeline: [
            ...lead.timeline,
            {
              action: `${editingCell.field} updated to "${editValue}"`,
              timestamp: new Date().toISOString(),
              user: "User",
            },
          ],
        }
        onUpdateLead(updatedLead)
      }
    }
    setEditingCell(null)
    setEditValue("")
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 font-medium">
              {selectedLeads.length > 0 ? `${selectedLeads.length} selected` : `${leads.length} leads`}
            </span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-800 hover:bg-gray-800 border-gray-700">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedLeads.length === leads.length && leads.length > 0}
                onCheckedChange={handleSelectAll}
                className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
              />
            </TableHead>
            <TableHead className="font-medium text-gray-300">Lead</TableHead>
            <TableHead className="font-medium text-gray-300">Contact Info</TableHead>
            <TableHead className="font-medium text-gray-300">AI Insights</TableHead>
            <TableHead className="font-medium text-gray-300">Labels</TableHead>
            <TableHead className="font-medium text-gray-300">Status</TableHead>
            <TableHead className="font-medium text-gray-300">Source</TableHead>
            <TableHead className="font-medium text-gray-300">Created</TableHead>
            <TableHead className="text-right font-medium text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const aiInsight = getAIInsight(lead)
            const IconComponent = aiInsight.icon

            return (
              <TableRow key={lead.id} className="hover:bg-gray-800 border-gray-800">
                <TableCell>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gray-800 text-gray-300 text-xs font-medium">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {editingCell?.leadId === lead.id && editingCell?.field === "name" ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 w-40 bg-black border-gray-700 text-white"
                            onKeyPress={(e) => e.key === "Enter" && saveEdit()}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit} className="text-green-400 h-8 w-8 p-0">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-red-400 h-8 w-8 p-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <div className="font-medium text-white">{lead.name}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(lead.id, "name", lead.name)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-300"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <div className="text-sm text-gray-400">ID: {lead.id}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm text-white">{lead.email}</div>
                    <div className="text-sm text-gray-400">{lead.phone}</div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-xs bg-gray-800 border-gray-700">
                    <Brain className="w-3 h-3 mr-1" />
                    <IconComponent className={cn("w-3 h-3 mr-1", aiInsight.color)} />
                    {aiInsight.label}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.labels.slice(0, 2).map((label, index) => (
                      <Badge key={index} variant="outline" className={cn("text-xs", getLabelColor(label))}>
                        {label}
                      </Badge>
                    ))}
                    {lead.labels.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                        +{lead.labels.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Select value={lead.status} onValueChange={(value) => onStatusChange(lead.id, value)}>
                    <SelectTrigger className="w-36 h-8 bg-black border-gray-700">
                      <SelectValue>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(lead.status))}>
                          {lead.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Follow-Up">Follow-Up</SelectItem>
                      <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  <div className="text-sm text-white">{lead.form_name}</div>
                  <div className="text-xs text-gray-400">{lead.page}</div>
                </TableCell>

                <TableCell>
                  <div className="text-sm text-white">{formatDate(lead.created_at)}</div>
                  {lead.next_follow_up && (
                    <div className="text-xs text-orange-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Follow-up due
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onLeadClick(lead)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
