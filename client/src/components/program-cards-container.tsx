"use client"

import { ProgramCard } from "@/components/program-card"
import { MonthCard } from "@/components/month-card"
import type { ViewMode, Task, StartDay } from "@/app/page"

interface ProgramCardsContainerProps {
  viewMode: ViewMode
  tasks: Record<number, Task[]>
  onAddTask: (day: number) => void
  onRemoveTask: (day: number, taskId: string) => void
  startDay: StartDay
}

// Utility functions
const getStartDate = (startDay: StartDay): Date => {
  const today = new Date()
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const targetDayIndex = dayNames.indexOf(startDay)
  const currentDayIndex = today.getDay()

  const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + daysToAdd)

  return startDate
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const getDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "long" })
}

const getShortDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function ProgramCardsContainer({ viewMode, tasks, onAddTask, onRemoveTask, startDay }: ProgramCardsContainerProps) {
  const startDate = getStartDate(startDay)

  if (viewMode === "day") {
    // Single day view
    return (
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-[#F0F0F0] mb-6">Today's Program</h2>
        <div className="flex justify-center">
          <ProgramCard
            day={1}
            label={getDayName(startDate)}
            date={formatDate(startDate)}
            tasks={tasks[1] || []}
            onAddTask={() => onAddTask(1)}
            onRemoveTask={(taskId) => onRemoveTask(1, taskId)}
            size="large"
          />
        </div>
      </div>
    )
  }

  if (viewMode === "week") {
    // Week view - 7 days horizontally
    return (
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-[#F0F0F0] mb-6">Weekly Program</h2>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, index) => {
            const currentDate = new Date(startDate)
            currentDate.setDate(startDate.getDate() + index)

            return (
              <ProgramCard
                key={index}
                day={index + 1}
                label={getDayName(currentDate)}
                date={formatDate(currentDate)}
                tasks={tasks[index + 1] || []}
                onAddTask={() => onAddTask(index + 1)}
                onRemoveTask={(taskId) => onRemoveTask(index + 1, taskId)}
                size="medium"
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (viewMode === "month") {
    // Month view - full month grid
    const daysInMonth = getDaysInMonth(startDate)
    const firstDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const startDayOfWeek = firstDayOfMonth.getDay()

    return (
      <div className="bg-[#121212] border border-[#2B2B2B] rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-[#F0F0F0] mb-6">
          Monthly Program - {firstDayOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-[#39FF14] py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startDayOfWeek }, (_, index) => (
            <div key={`empty-${index}`} className="h-24"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const currentDate = new Date(firstDayOfMonth)
            currentDate.setDate(index + 1)

            return (
              <MonthCard
                key={index}
                day={index + 1}
                date={currentDate.getDate()}
                dayName={getShortDayName(currentDate)}
                tasks={tasks[index + 1] || []}
                onAddTask={() => onAddTask(index + 1)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return null
}
