"use client"

import { useRef, useEffect } from "react"
import { CheckCircle, Camera, BarChart3, Dumbbell, Apple, FileText, Droplet } from "lucide-react"
import type { Task, TaskType } from "@/app/page"

interface AddTaskDropdownProps {
  isOpen: boolean
  onClose: () => void
  onAddTask: (task: Task) => void
  selectedDay: number | null
}

export function AddTaskDropdown({ isOpen, onClose, onAddTask, selectedDay }: AddTaskDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  const taskTypes = [
    { type: "checkin" as TaskType, label: "Check-in", icon: CheckCircle, color: "bg-green-600" },
    { type: "picture" as TaskType, label: "Picture Upload", icon: Camera, color: "bg-purple-600" },
    { type: "metric" as TaskType, label: "Weight check in", icon: BarChart3, color: "bg-red-600" },
    { type: "hydration" as TaskType, label: "Hydration", icon: Droplet, color: "bg-cyan-600" },
    { type: "workout" as TaskType, label: "Workout", icon: Dumbbell, color: "bg-blue-600" },
    { type: "nutrition" as TaskType, label: "Nutrition", icon: Apple, color: "bg-orange-600" },
    { type: "note" as TaskType, label: "Note", icon: FileText, color: "bg-gray-600" },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleTaskSelect = (type: TaskType, label: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      type,
      title: label,
      description: `${label} for Day ${selectedDay}`,
    }

    onAddTask(newTask)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        ref={dropdownRef}
        className="bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg shadow-xl p-2 min-w-[200px] animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <div className="p-2 border-b border-[#2B2B2B] mb-2">
          <h3 className="text-sm font-semibold text-[#F0F0F0]">Add Task to Day {selectedDay}</h3>
        </div>

        <div className="space-y-1">
          {taskTypes.map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => handleTaskSelect(type, label)}
              className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-[#2B2B2B] transition-colors text-left"
            >
              <div className={`w-8 h-8 rounded flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#F0F0F0] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
