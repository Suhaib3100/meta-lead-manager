"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Tag, Edit3, Trash2, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface LabelManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const defaultLabels = [
  { id: "1", name: "Hot", color: "red", count: 12 },
  { id: "2", name: "Cold", color: "blue", count: 8 },
  { id: "3", name: "High Priority", color: "orange", count: 15 },
  { id: "4", name: "Qualified", color: "green", count: 23 },
  { id: "5", name: "VIP", color: "purple", count: 5 },
  { id: "6", name: "Demo", color: "indigo", count: 9 },
]

const colorOptions = [
  { name: "Red", value: "red", class: "bg-red-900 text-red-300 border-red-800" },
  { name: "Blue", value: "blue", class: "bg-blue-900 text-blue-300 border-blue-800" },
  { name: "Green", value: "green", class: "bg-green-900 text-green-300 border-green-800" },
  { name: "Orange", value: "orange", class: "bg-orange-900 text-orange-300 border-orange-800" },
  { name: "Purple", value: "purple", class: "bg-purple-900 text-purple-300 border-purple-800" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-900 text-indigo-300 border-indigo-800" },
  { name: "Gray", value: "gray", class: "bg-gray-800 text-gray-300 border-gray-700" },
]

export function LabelManagementModal({ isOpen, onClose }: LabelManagementModalProps) {
  const [labels, setLabels] = useState(defaultLabels)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("blue")
  const [editingLabel, setEditingLabel] = useState<string | null>(null)

  const getLabelColorClass = (color: string) => {
    return colorOptions.find((option) => option.value === color)?.class || "bg-gray-800 text-gray-300 border-gray-700"
  }

  const addLabel = () => {
    if (!newLabelName.trim()) return

    const newLabel = {
      id: Date.now().toString(),
      name: newLabelName.trim(),
      color: newLabelColor,
      count: 0,
    }

    setLabels([...labels, newLabel])
    setNewLabelName("")
    setNewLabelColor("blue")
  }

  const deleteLabel = (labelId: string) => {
    setLabels(labels.filter((label) => label.id !== labelId))
  }

  const updateLabel = (labelId: string, name: string, color: string) => {
    setLabels(labels.map((label) => (label.id === labelId ? { ...label, name, color } : label)))
    setEditingLabel(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            Label Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Add New Label */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Plus className="w-5 h-5" />
                Create New Label
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="labelName" className="text-gray-300">
                    Label Name
                  </Label>
                  <Input
                    id="labelName"
                    placeholder="Enter label name..."
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLabel()}
                    className="bg-black border-gray-700 text-white placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labelColor" className="text-gray-300">
                    Color
                  </Label>
                  <Select value={newLabelColor} onValueChange={setNewLabelColor}>
                    <SelectTrigger className="bg-black border-gray-700 text-white">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getLabelColorClass(newLabelColor))}></div>
                          {colorOptions.find((c) => c.value === newLabelColor)?.name}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", color.class)}></div>
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Preview:</span>
                <Badge variant="outline" className={cn("text-sm", getLabelColorClass(newLabelColor))}>
                  {newLabelName || "Label Name"}
                </Badge>
              </div>

              <Button
                onClick={addLabel}
                disabled={!newLabelName.trim()}
                className="w-full bg-white text-black hover:bg-gray-100"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Label
              </Button>
            </CardContent>
          </Card>

          {/* Existing Labels */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Palette className="w-5 h-5" />
                Existing Labels ({labels.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("text-sm", getLabelColorClass(label.color))}>
                        {label.name}
                      </Badge>
                      <span className="text-sm text-gray-400">{label.count} leads</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingLabel(label.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLabel(label.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {labels.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No labels created yet. Create your first label above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Close
            </Button>
            <Button className="bg-white text-black hover:bg-gray-100">Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
