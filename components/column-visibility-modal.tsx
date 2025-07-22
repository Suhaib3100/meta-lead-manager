"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Columns } from "lucide-react"

interface ColumnVisibilityModalProps {
  isOpen: boolean
  onClose: () => void
}

const defaultColumns = [
  { id: "lead", name: "Lead", visible: true, required: true },
  { id: "contact", name: "Contact Info", visible: true, required: false },
  { id: "ai_insights", name: "AI Insights", visible: true, required: false },
  { id: "labels", name: "Labels", visible: true, required: false },
  { id: "status", name: "Status", visible: true, required: true },
  { id: "source", name: "Source", visible: true, required: false },
  { id: "created", name: "Created Date", visible: true, required: false },
  { id: "actions", name: "Actions", visible: true, required: true },
]

export function ColumnVisibilityModal({ isOpen, onClose }: ColumnVisibilityModalProps) {
  const [columns, setColumns] = useState(defaultColumns)

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map((col) => (col.id === columnId && !col.required ? { ...col, visible: !col.visible } : col)))
  }

  const showAll = () => {
    setColumns(columns.map((col) => ({ ...col, visible: true })))
  }

  const hideOptional = () => {
    setColumns(columns.map((col) => (col.required ? col : { ...col, visible: false })))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Columns className="w-5 h-5 text-white" />
            </div>
            Column Visibility
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base text-white">Table Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columns.map((column) => (
                <div key={column.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={() => toggleColumn(column.id)}
                      disabled={column.required}
                      className="border-gray-600 data-[state=checked]:bg-white data-[state=checked]:border-white"
                    />
                    <label className={`text-sm ${column.required ? "text-gray-400" : "text-white"}`}>
                      {column.name}
                      {column.required && <span className="text-xs text-gray-500 ml-1">(required)</span>}
                    </label>
                  </div>
                  {column.visible ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={showAll}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Show All
            </Button>
            <Button
              variant="outline"
              onClick={hideOptional}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Hide Optional
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={onClose} className="bg-white text-black hover:bg-gray-100">
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
