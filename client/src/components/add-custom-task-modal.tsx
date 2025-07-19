"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Droplet, Bed, Camera, Bell, Clock } from "lucide-react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWeightScale } from '@fortawesome/free-solid-svg-icons'
import { format, addDays, addWeeks, addMonths, addQuarters, setDay, setDate } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { convertLocalTimeToUTC } from "@/lib/timezone-utils"

// Task type definitions
interface CustomTask {
  taskType: "water" | "sleep" | "weight" | "progress" | "other"
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
  time: string
  dayOfWeek?: number // 0-6 (Sunday-Saturday)
  dayOfMonth?: number // 1-31
  otherDetails?: string
  programName: string
  coachMessage?: string
}

// Weight icon component using Font Awesome
const WeightIcon = () => (
  <FontAwesomeIcon icon={faWeightScale} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
)

// Task type options with icons and descriptions
const taskTypeOptions = [
  { value: "water", label: "Water Intake", icon: Droplet, description: "Track daily water consumption" },
  { value: "sleep", label: "Sleep Data", icon: Bed, description: "Monitor sleep patterns and quality" },
  { value: "weight", label: "Weight", icon: WeightIcon, description: "Track weight measurements" },
  { value: "progress", label: "Progress Picture", icon: Camera, description: "Take progress photos" },
  { value: "other", label: "Other Event/Notification", icon: Bell, description: "Custom reminder or event" }
]

// Frequency options
const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" }
]

// Day of week options
const dayOfWeekOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" }
]

interface AddCustomTaskModalProps {
  clientId: number
  clientName?: string
  isOpen: boolean
  onClose: () => void
  onTaskAdded: () => void
}

/**
 * AddCustomTaskModal Component
 * 
 * This component provides a comprehensive workflow for adding custom tasks:
 * 1. Task Type Selection - Choose from predefined task types or custom events
 * 2. Frequency Selection - Daily, Weekly, Monthly, or Quarterly
 * 3. Time Selection - Pick specific time for the task
 * 4. Additional Configuration - Day of week for weekly, date for monthly/quarterly
 * 5. Program Name - Name the custom program
 * 6. Database Storage - Save to schedule table with proper recurrence logic
 * 
 * Features:
 * - Step-by-step workflow with clear progression
 * - Validation at each step
 * - Proper date/time handling for different frequencies
 * - Integration with Supabase schedule table
 * - User-friendly error handling and success feedback
 */
export function AddCustomTaskModal({ 
  clientId, 
  clientName = "Client", 
  isOpen, 
  onClose, 
  onTaskAdded 
}: AddCustomTaskModalProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [taskData, setTaskData] = useState<CustomTask>({
    taskType: "water",
    frequency: "daily",
    time: "09:00",
    programName: "",
    coachMessage: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to get task icon
  const getTaskIcon = (taskType: string) => {
    const option = taskTypeOptions.find(opt => opt.value === taskType)
    return option ? option.icon : Bell
  }

  // Helper function to get task display name
  const getTaskDisplayName = (taskType: string) => {
    const option = taskTypeOptions.find(opt => opt.value === taskType)
    return option ? option.label : "Custom Task"
  }

  // Helper function to get task summary
  const getTaskSummary = (taskType: string, otherDetails?: string) => {
    switch (taskType) {
      case "water": return "custom"
      case "sleep": return "custom"
      case "weight": return "custom"
      case "progress": return "custom"
      case "other": return "custom"
      default: return "custom"
    }
  }

  // Helper function to get task type for database
  const getTaskType = (taskType: string) => {
    switch (taskType) {
      case "water": return "hydration"
      case "sleep": return "wakeup"
      case "weight": return "weight"
      case "progress": return "progresspicture"
      case "other": return "other"
      default: return "other"
    }
  }

  // Helper function to get task icon name
  const getTaskIconName = (taskType: string) => {
    switch (taskType) {
      case "water": return "droplet"
      case "sleep": return "bed"
      case "weight": return "weight-scale"
      case "progress": return "camera"
      case "other": return "bell"
      default: return "bell"
    }
  }

  // Generate dates for the next 3 months based on frequency
  const generateDates = (frequency: string, dayOfWeek?: number, dayOfMonth?: number) => {
    const dates: Date[] = []
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3) // 3 months from now

    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      let shouldAdd = false

      switch (frequency) {
        case "daily":
          shouldAdd = true
          break
        case "weekly":
          if (dayOfWeek !== undefined && currentDate.getDay() === dayOfWeek) {
            shouldAdd = true
          }
          break
        case "monthly":
          if (dayOfMonth !== undefined && currentDate.getDate() === dayOfMonth) {
            shouldAdd = true
          }
          break
        case "quarterly":
          if (dayOfMonth !== undefined && currentDate.getDate() === dayOfMonth) {
            const month = currentDate.getMonth()
            if (month === 0 || month === 3 || month === 6 || month === 9) { // Jan, Apr, Jul, Oct
              shouldAdd = true
            }
          }
          break
      }

      if (shouldAdd) {
        dates.push(new Date(currentDate))
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!taskData.programName.trim()) {
      toast({
        title: "Program Name Required",
        description: "Please enter a name for your custom program.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate dates for the next 3 months
      const dates = generateDates(
        taskData.frequency, 
        taskData.dayOfWeek, 
        taskData.dayOfMonth
      )

      if (dates.length === 0) {
        toast({
          title: "No Dates Generated",
          description: "No valid dates found for the selected frequency and configuration.",
          variant: "destructive"
        })
        return
      }

      // Prepare schedule entries
      const scheduleEntries = dates.map(date => ({
        client_id: clientId,
        task: getTaskSummary(taskData.taskType, taskData.otherDetails),
        summary: taskData.programName,
        type: getTaskType(taskData.taskType),
        for_date: format(date, 'yyyy-MM-dd'),
        for_time: convertLocalTimeToUTC(taskData.time), // Convert local time to UTC for storage
        icon: getTaskIconName(taskData.taskType),
        coach_tip: taskData.coachMessage || taskData.otherDetails || getTaskDisplayName(taskData.taskType),
        details_json: {
          task_type: taskData.taskType,
          frequency: taskData.frequency,
          program_name: taskData.programName,
          custom_details: taskData.otherDetails,
          original_local_time: taskData.time, // Store original local time for reference
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Store user's timezone
        }
      }))

      // Insert into database
      const { data, error } = await supabase
        .from('schedule')
        .insert(scheduleEntries)

      if (error) {
        console.error('Error inserting schedule entries:', error)
        throw new Error(error.message)
      }

      toast({
        title: "Custom Task Added Successfully",
        description: `Added ${scheduleEntries.length} entries for ${taskData.programName}`,
      })

      // Reset form and close modal
      setTaskData({
        taskType: "water",
        frequency: "daily",
        time: "09:00",
        programName: "",
        coachMessage: ""
      })
      setCurrentStep(1)
      onTaskAdded()
      onClose()

    } catch (error: any) {
      console.error('Error adding custom task:', error)
      toast({
        title: "Error Adding Custom Task",
        description: error.message || "Failed to add custom task. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1 && !taskData.taskType) {
      toast({
        title: "Task Type Required",
        description: "Please select a task type.",
        variant: "destructive"
      })
      return
    }

    if (currentStep === 2 && !taskData.frequency) {
      toast({
        title: "Frequency Required",
        description: "Please select a frequency.",
        variant: "destructive"
      })
      return
    }

    if (currentStep === 3 && !taskData.time) {
      toast({
        title: "Time Required",
        description: "Please select a time.",
        variant: "destructive"
      })
      return
    }

    if (currentStep === 4) {
      // Additional validation for weekly/monthly/quarterly
      if (taskData.frequency === "weekly" && taskData.dayOfWeek === undefined) {
        toast({
          title: "Day of Week Required",
          description: "Please select a day of the week.",
          variant: "destructive"
        })
        return
      }

      if ((taskData.frequency === "monthly" || taskData.frequency === "quarterly") && taskData.dayOfMonth === undefined) {
        toast({
          title: "Date Required",
          description: "Please select a date.",
          variant: "destructive"
        })
        return
      }
    }

    setCurrentStep(currentStep + 1)
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(Math.max(1, currentStep - 1))
  }

  // Handle modal close
  const handleClose = () => {
    setTaskData({
      taskType: "water",
      frequency: "daily",
      time: "09:00",
      programName: ""
    })
    setCurrentStep(1)
    onClose()
  }

  // Calculate total steps based on frequency
  const getTotalSteps = () => {
    if (taskData.frequency === "daily") {
      return 5 // Task type, frequency, time, coach message, program name
    } else {
      return 6 // Task type, frequency, day/date selection, time, coach message, program name
    }
  }

  // Check if we need day/date selection step
  const needsDayDateSelection = taskData.frequency === "weekly" || taskData.frequency === "monthly" || taskData.frequency === "quarterly"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Add Custom Task - Step {currentStep} of {getTotalSteps()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Task Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">What task do you want to add?</Label>
              <div className="space-y-2">
                {taskTypeOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                        taskData.taskType === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                      onClick={() => setTaskData(prev => ({ ...prev, taskType: option.value as any }))}
                    >
                      <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Other Event Details */}
              {taskData.taskType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="otherDetails">Event Details</Label>
                  <Textarea
                    id="otherDetails"
                    placeholder="Describe your custom event or notification..."
                    value={taskData.otherDetails || ""}
                    onChange={(e) => setTaskData(prev => ({ ...prev, otherDetails: e.target.value }))}
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Frequency Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">How often should this task occur?</Label>
              <div className="space-y-2">
                {frequencyOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      taskData.frequency === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                    onClick={() => setTaskData(prev => ({ ...prev, frequency: option.value as any }))}
                  >
                    <div className="flex-1 font-medium">{option.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Day/Date Selection for Weekly/Monthly/Quarterly */}
          {currentStep === 3 && needsDayDateSelection && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {taskData.frequency === "weekly" 
                  ? "What day of the week?" 
                  : "What date of the month?"}
              </Label>
              
              {taskData.frequency === "weekly" ? (
                <div className="space-y-2">
                  {dayOfWeekOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                        taskData.dayOfWeek === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                      onClick={() => setTaskData(prev => ({ ...prev, dayOfWeek: option.value }))}
                    >
                      <div className="flex-1 font-medium">{option.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    Select a date from the calendar below:
                  </Label>
                  <Calendar
                    mode="single"
                    selected={taskData.dayOfMonth ? new Date(2024, 0, taskData.dayOfMonth) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setTaskData(prev => ({ ...prev, dayOfMonth: date.getDate() }))
                      }
                    }}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                  {taskData.dayOfMonth && (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Selected: {taskData.dayOfMonth}th of each month
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3/4: Time Selection */}
          {((currentStep === 3 && !needsDayDateSelection) || (currentStep === 4 && needsDayDateSelection)) && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">What time should this task occur?</Label>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <Input
                  type="time"
                  value={taskData.time}
                  onChange={(e) => setTaskData(prev => ({ ...prev, time: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* Step 4/5: Coach Message */}
          {((currentStep === 4 && !needsDayDateSelection) || (currentStep === 5 && needsDayDateSelection)) && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Add a coach message (optional)</Label>
              <Textarea
                placeholder="Enter a motivational message or instruction for your client..."
                value={taskData.coachMessage || ""}
                onChange={(e) => setTaskData(prev => ({ ...prev, coachMessage: e.target.value }))}
                className="min-h-[100px]"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This message will appear as a coach tip to help guide your client.
              </p>
            </div>
          )}

          {/* Step 5/6: Program Name */}
          {((currentStep === 5 && !needsDayDateSelection) || (currentStep === 6 && needsDayDateSelection)) && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Name your custom program</Label>
              <Input
                placeholder="e.g., Water Intake, Sleep Tracking, Weight Monitoring..."
                value={taskData.programName}
                onChange={(e) => setTaskData(prev => ({ ...prev, programName: e.target.value }))}
              />
              
              {/* Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Task:</strong> {getTaskDisplayName(taskData.taskType)}</div>
                  <div><strong>Frequency:</strong> {taskData.frequency}</div>
                  {taskData.frequency === "weekly" && taskData.dayOfWeek !== undefined && (
                    <div><strong>Day:</strong> {dayOfWeekOptions.find(d => d.value === taskData.dayOfWeek)?.label}</div>
                  )}
                  {(taskData.frequency === "monthly" || taskData.frequency === "quarterly") && taskData.dayOfMonth && (
                    <div><strong>Date:</strong> {taskData.dayOfMonth}th of each month</div>
                  )}
                  <div><strong>Time:</strong> {taskData.time}</div>
                  {taskData.coachMessage && (
                    <div><strong>Coach Message:</strong> {taskData.coachMessage}</div>
                  )}
                  <div><strong>Program Name:</strong> {taskData.programName || "Not set"}</div>
                  {taskData.otherDetails && (
                    <div><strong>Details:</strong> {taskData.otherDetails}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              
              {currentStep < getTotalSteps() ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Custom Task"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 