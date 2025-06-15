"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dumbbell, CheckCircle, Apple } from "lucide-react"
import type { Task, TaskType } from "@/app/page"

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: Task) => void
  selectedDay: number | null
}

export function AddTaskModal({ isOpen, onClose, onAddTask, selectedDay }: AddTaskModalProps) {
  const [selectedType, setSelectedType] = useState<TaskType | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const taskTypes = [
    { type: "workout" as TaskType, label: "Workout", icon: Dumbbell, color: "bg-blue-600" },
    { type: "checkin" as TaskType, label: "Check-in", icon: CheckCircle, color: "bg-purple-600" },
    { type: "nutrition" as TaskType, label: "Nutrition", icon: Apple, color: "bg-orange-600" },
  ]

  const handleSubmit = () => {
    if (!selectedType || !title.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      type: selectedType,
      title: title.trim(),
      description: description.trim() || undefined,
    }

    onAddTask(newTask)

    // Reset form
    setSelectedType(null)
    setTitle("")
    setDescription("")
  }

  const handleClose = () => {
    setSelectedType(null)
    setTitle("")
    setDescription("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Task to Day {selectedDay}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Task Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {taskTypes.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedType === type
                      ? "border-[#39FF14] bg-[#39FF14]/10"
                      : "border-[#2B2B2B] hover:border-[#39FF14]/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs font-medium">{label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Task Details */}
          {selectedType && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title" className="text-sm font-medium mb-2 block">
                  Task Title
                </Label>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  className="bg-[#121212] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14]"
                />
              </div>

              <div>
                <Label htmlFor="task-description" className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </Label>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                  className="bg-[#121212] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14] resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-[#2B2B2B] text-[#F0F0F0] hover:bg-[#2B2B2B]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || !title.trim()}
              className="flex-1 bg-[#39FF14] hover:bg-[#32E012] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
