"use client"

import { Plus, Dumbbell, CheckCircle, Apple, Camera, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Task, TaskType } from "@/app/page"

interface MonthCardProps {
  day: number
  date: number
  dayName: string
  tasks: Task[]
  onAddTask: () => void
}

const getTaskIcon = (type: TaskType) => {
  switch (type) {
    case "workout":
      return <Dumbbell className="w-2 h-2" />
    case "checkin":
      return <CheckCircle className="w-2 h-2" />
    case "nutrition":
      return <Apple className="w-2 h-2" />
    case "picture":
      return <Camera className="w-2 h-2" />
    case "metric":
      return <BarChart3 className="w-2 h-2" />
    case "note":
      return <FileText className="w-2 h-2" />
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

export function MonthCard({ day, date, dayName, tasks, onAddTask }: MonthCardProps) {
  return (
    <div className="h-24 bg-[#1A1A1A] border border-[#2B2B2B] rounded hover:border-[#39FF14] transition-colors p-1 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-[#F0F0F0] font-medium">{dayName}</div>
        <div className="text-sm font-bold text-[#39FF14]">{date}</div>
      </div>

      <div className="flex-1 space-y-0.5 mb-1 overflow-hidden">
        {tasks.slice(0, 2).map((task) => (
          <div key={task.id} className="flex items-center gap-1">
            <div className={`p-0.5 rounded ${getTaskColor(task.type)}`}>{getTaskIcon(task.type)}</div>
            <div className="text-xs text-[#F0F0F0] truncate flex-1">{task.title}</div>
          </div>
        ))}
        {tasks.length > 2 && <div className="text-xs text-[#666] text-center">+{tasks.length - 2}</div>}
      </div>

      <Button
        onClick={onAddTask}
        size="sm"
        className="w-full h-5 bg-[#39FF14] hover:bg-[#32E012] text-black font-medium text-xs p-0 transition-all duration-200"
      >
        <Plus className="w-2 h-2 mr-0.5" />
        Add
      </Button>
    </div>
  )
}
