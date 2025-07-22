"use client"

import { useState } from "react"
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
  Save,
  Tag,
  X,
  FileText,
  Upload,
  Download,
  User,
  Activity,
  Paperclip,
  Brain,
  Zap,
} from "lucide-react"
import type { Lead } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LeadDrawerProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (lead: Lead) => void
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

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const quickFollowUpOptions = [
  { label: "+1 Day", value: 1 },
  { label: "+3 Days", value: 3 },
  { label: "Next Monday", value: "monday" },
  { label: "Next Week", value: 7 },
  { label: "Custom", value: "custom" },
]

export function LeadDrawer({ lead, isOpen, onClose, onUpdate }: LeadDrawerProps) {
  const [editedLead, setEditedLead] = useState<Lead | null>(null)
  const [newNote, setNewNote] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showCustomDate, setShowCustomDate] = useState(false)

  if (!lead) return null

  const currentLead = editedLead || lead

  const handleSave = () => {
    if (editedLead) {
      onUpdate(editedLead)
      setEditedLead(null)
    }
  }

  const addNote = () => {
    if (!newNote.trim()) return

    const updatedLead = {
      ...currentLead,
      notes: [
        ...currentLead.notes,
        {
          text: newNote,
          timestamp: new Date().toISOString(),
        },
      ],
      timeline: [
        ...currentLead.timeline,
        {
          action: "Note added",
          timestamp: new Date().toISOString(),
          user: "User",
        },
      ],
    }

    setEditedLead(updatedLead)
    setNewNote("")
  }

  const addLabel = () => {
    if (!newLabel.trim() || currentLead.labels.includes(newLabel)) return

    const updatedLead = {
      ...currentLead,
      labels: [...currentLead.labels, newLabel],
      timeline: [
        ...currentLead.timeline,
        {
          action: `Label "${newLabel}" added`,
          timestamp: new Date().toISOString(),
          user: "User",
        },
      ],
    }

    setEditedLead(updatedLead)
    setNewLabel("")
  }

  const removeLabel = (labelToRemove: string) => {
    const updatedLead = {
      ...currentLead,
      labels: currentLead.labels.filter((label) => label !== labelToRemove),
      timeline: [
        ...currentLead.timeline,
        {
          action: `Label "${labelToRemove}" removed`,
          timestamp: new Date().toISOString(),
          user: "User",
        },
      ],
    }

    setEditedLead(updatedLead)
  }

  const updateField = (field: keyof Lead, value: any) => {
    setEditedLead({
      ...currentLead,
      [field]: value,
    })
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

    const updatedLead = {
      ...currentLead,
      next_follow_up: followUpDate.toISOString(),
      timeline: [
        ...currentLead.timeline,
        {
          action: `Follow-up scheduled for ${option.label}`,
          timestamp: new Date().toISOString(),
          user: "User",
        },
      ],
    }

    setEditedLead(updatedLead)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-black border-gray-800 text-white">
        <SheetHeader className="space-y-4 pb-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-semibold text-white">Lead Details</SheetTitle>
            {editedLead && (
              <Button onClick={handleSave} size="sm" className="bg-white text-black hover:bg-gray-100">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              <MessageSquare className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2 data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400"
            >
              <Paperclip className="w-4 h-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Lead Profile */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-gray-800 text-gray-300 text-lg font-medium">
                      {currentLead.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{currentLead.name}</h3>
                    <p className="text-sm text-gray-400">Lead ID: {currentLead.id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={cn("text-sm", getLabelColor(currentLead.status))}>
                        {currentLead.status}
                      </Badge>
                      <Badge variant="outline" className="text-sm bg-gray-800 border-gray-700 text-gray-300">
                        <Brain className="w-3 h-3 mr-1" />
                        <Zap className="w-3 h-3 mr-1 text-green-400" />
                        High Intent (92%)
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
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
                          value={currentLead.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className="flex-1 bg-black border-gray-700 text-white placeholder:text-gray-400"
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
                          value={currentLead.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          className="flex-1 bg-black border-gray-700 text-white placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                        Status
                      </Label>
                      <Select value={currentLead.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="bg-black border-gray-700 text-white">
                          <SelectValue />
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
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-300">Lead Source</Label>
                      <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <div className="text-sm">
                          <span className="font-medium text-gray-300">Form:</span>{" "}
                          <span className="text-white">{currentLead.form_name}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="font-medium text-gray-300">Page:</span>{" "}
                          <span className="text-white">{currentLead.page}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className="font-medium text-gray-300">Created:</span>{" "}
                          <span className="text-white">{formatDateTime(currentLead.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Labels Management */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Tag className="w-5 h-5" />
                  Labels & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {currentLead.labels.map((label, index) => (
                    <Badge key={index} variant="outline" className={cn("text-sm", getLabelColor(label))}>
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
                    className="flex-1 bg-black border-gray-700 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addLabel} size="sm" className="bg-white text-black hover:bg-gray-100">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Smart Scheduling */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5" />
                  Smart Scheduling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentLead.next_follow_up && (
                  <div className="flex items-center gap-2 text-sm bg-orange-900/20 p-3 rounded-lg border border-orange-800/30">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="font-medium text-orange-300">Next follow-up:</span>
                    <span className="text-orange-200">{formatDateTime(currentLead.next_follow_up)}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-300">Quick Follow-up Options</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickFollowUpOptions.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickFollowUp(option)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {showCustomDate && (
                  <div className="space-y-2">
                    <Label htmlFor="customFollowup" className="text-sm font-medium text-gray-300">
                      Custom Follow-up Date & Time
                    </Label>
                    <Input
                      id="customFollowup"
                      type="datetime-local"
                      value={
                        currentLead.next_follow_up
                          ? new Date(currentLead.next_follow_up).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateField("next_follow_up", e.target.value ? new Date(e.target.value).toISOString() : null)
                      }
                      className="bg-black border-gray-700 text-white"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {currentLead.timeline.map((activity, index) => (
                    <div key={index} className="flex gap-3 pb-4 border-b border-gray-800 last:border-b-0">
                      <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6 mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5" />
                  Notes & Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a detailed note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                    className="bg-black border-gray-700 text-white placeholder:text-gray-400"
                  />
                  <Button onClick={addNote} className="w-full bg-white text-black hover:bg-gray-100">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {currentLead.notes.map((note, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-white leading-relaxed">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(note.timestamp)}
                      </p>
                    </div>
                  ))}
                  {currentLead.notes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No notes yet. Add your first note above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6 mt-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Paperclip className="w-5 h-5" />
                  File Attachments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-800/20">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-300 mb-2">Drag and drop files here, or click to browse</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Mock file attachments */}
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <FileText className="w-8 h-8 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Lead_Qualification_Form.pdf</p>
                      <p className="text-xs text-gray-400">2.4 MB • Uploaded 2 days ago</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <FileText className="w-8 h-8 text-green-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Company_Profile.docx</p>
                      <p className="text-xs text-gray-400">1.8 MB • Uploaded 1 week ago</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-700">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
