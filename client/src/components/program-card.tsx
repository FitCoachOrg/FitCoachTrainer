"use client"

import { Plus, Dumbbell, CheckCircle, Apple, Camera, BarChart3, FileText, Droplet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task, TaskType } from "@/app/page"

interface ProgramCardProps {
  day: number
  label: string
  date: string
  tasks: Task[]
  onAddTask: () => void
  onRemoveTask: (taskId: string) => void
  size?: "small" | "medium" | "large"
}

const getTaskIcon = (type: TaskType) => {
  switch (type) {
    case "workout":
      return <Dumbbell className="w-3 h-3" />
    case "checkin":
      return <CheckCircle className="w-3 h-3" />
    case "nutrition":
      return <Apple className="w-3 h-3" />
    case "picture":
      return <Camera className="w-3 h-3" />
    case "metric":
      return <BarChart3 className="w-3 h-3" />
    case "note":
      return <FileText className="w-3 h-3" />
    case "hydration":
      return <Droplet className="w-3 h-3" />
  }
}

const getTaskColor = (type: TaskType) => {
  switch (type) {
    case "workout":
      return "bg-blue-600"
    case "checkin":
      return "bg-green-600"
    case "nutrition":
      return "bg-orange-600"
    case "picture":
      return "bg-purple-600"
    case "metric":
      return "bg-red-600"
    case "note":
      return "bg-gray-600"
  }
}

export function ProgramCard({ day, label, date, tasks, onAddTask, onRemoveTask, size = "medium" }: ProgramCardProps) {
  const sizeClasses = {
    small: "w-full h-32 p-2",
    medium: "w-full h-48 p-3",
    large: "w-80 h-64 p-4",
  }

  const buttonSizeClasses = {
    small: "text-xs py-1 px-2",
    medium: "text-sm py-2 px-3",
    large: "text-sm py-2 px-4",
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-[#1A1A1A] border border-[#2B2B2B] rounded-lg hover:border-[#39FF14] transition-colors flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h3
            className={`font-semibold text-[#F0F0F0] ${size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-lg"}`}
          >
            {size === "large" ? label : label.slice(0, 3)}
          </h3>
          <p className={`text-[#39FF14] ${size === "small" ? "text-xs" : "text-sm"}`}>{date}</p>
        </div>
        <div
          className={`font-bold text-[#39FF14] ${size === "small" ? "text-lg" : size === "medium" ? "text-xl" : "text-2xl"}`}
        >
          {day}
        </div>
      </div>

      <div
        className={`flex-1 space-y-1 mb-2 ${size === "small" ? "min-h-[40px]" : size === "medium" ? "min-h-[80px]" : "min-h-[120px]"}`}
      >
        {tasks.slice(0, size === "small" ? 2 : size === "medium" ? 4 : 6).map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-1 p-1 bg-[#121212] rounded border border-[#2B2B2B] ${size === "small" ? "text-xs" : "text-sm"}`}
          >
            <div className={`p-0.5 rounded ${getTaskColor(task.type)}`}>{getTaskIcon(task.type)}</div>
            <div className="flex-1 truncate">
              <div className="font-medium text-[#F0F0F0] truncate">{task.title}</div>
            </div>
            <button
              onClick={() => onRemoveTask(task.id)}
              className="ml-1 p-1 rounded hover:bg-[#2B2B2B] text-[#F87171] hover:text-red-500 transition"
              title="Remove task"
              style={{ lineHeight: 0 }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {tasks.length > (size === "small" ? 2 : size === "medium" ? 4 : 6) && (
          <div className="text-xs text-[#666] text-center">
            +{tasks.length - (size === "small" ? 2 : size === "medium" ? 4 : 6)} more
          </div>
        )}
      </div>

      <Button
        onClick={onAddTask}
        className={`w-full bg-[#39FF14] hover:bg-[#32E012] text-black font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#39FF14]/25 ${buttonSizeClasses[size]}`}
      >
        <Plus className={`${size === "small" ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
        {size === "small" ? "Add" : "Add Task"}
      </Button>
    </div>
  )
}
