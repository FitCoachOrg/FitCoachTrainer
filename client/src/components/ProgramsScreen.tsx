"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval, addDays, subDays, isSameDay, parseISO } from "date-fns"
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Edit3, 
  Save, 
  X,
  Filter,
  Grid,
  List,
  Calendar,
  Target,
  Brain,
  Utensils,
  Dumbbell,
  Plus
} from "lucide-react"
import { SidePopup } from "@/components/ui/side-popup"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "./overview/TrainingPreferencesSection"
import { AddCustomTaskModal } from "./add-custom-task-modal"
import { convertUTCToLocalTime, convertLocalTimeToUTC } from "@/lib/timezone-utils"


interface ScheduleItem {
  id: number
  client_id: number
  for_date: string
  type: string
  summary: string
  coach_tip?: string
  details_json: any
  for_time: string
  icon?: string
  task?: string // Added task field for correct typing
}

interface ProgramsScreenProps {
  clientId?: number
  client?: any
  onGoalsSaved?: () => void
  lastAIRecommendation?: string
  onViewFullAnalysis?: () => void
}

type ViewMode = "daily" | "weekly" | "monthly"

export function ProgramsScreen({ 
  clientId, 
  client, 
  onGoalsSaved, 
  lastAIRecommendation, 
  onViewFullAnalysis 
}: ProgramsScreenProps) {
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("weekly")
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState("all")
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [editForm, setEditForm] = useState({
    summary: "",
    coach_tip: "",
    for_time: ""
  })
  
  // Side popup states
  const [showFitnessGoals, setShowFitnessGoals] = useState(false)
  const [showAICoachInsights, setShowAICoachInsights] = useState(false)
  const [showTrainerNotes, setShowTrainerNotes] = useState(false)
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false)
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false)

  // Add state for meal edit dialog
  const [editingMeal, setEditingMeal] = useState<ScheduleItem | null>(null)
  const [mealEditForm, setMealEditForm] = useState<any>({})

  // Add state for workout edit dialog
  const [editingWorkout, setEditingWorkout] = useState<ScheduleItem | null>(null)
  const [workoutEditForm, setWorkoutEditForm] = useState<any[]>([])

  // Add state for custom task modal
  const [isCustomTaskModalOpen, setIsCustomTaskModalOpen] = useState(false)

  // Get schedule types for filter
  const scheduleTypes = ["all", "meal", "workout", "assessment", "consultation", "hydration", "wakeup", "weight", "progresspicture", "other"]

  // Fetch schedule data from Supabase
  const fetchScheduleData = async () => {
    if (!clientId) return

    setLoading(true)
    try {
      let query = supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)

      // Apply type filter
      if (selectedType !== "all") {
        query = query.eq('type', selectedType)
      }

      // Apply date range based on view mode
      const startDate = getViewStartDate()
      const endDate = getViewEndDate()
      
      query = query
        .gte('for_date', format(startDate, 'yyyy-MM-dd'))
        .lte('for_date', format(endDate, 'yyyy-MM-dd'))

      const { data, error } = await query

      if (error) throw error

      setScheduleItems(data || [])
    } catch (error: any) {
      console.error("Error fetching schedule data:", error)
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchScheduleData()
  }, [clientId, currentDate, viewMode, selectedType])

  // After scheduleItems is loaded, log the array
  useEffect(() => {
    console.log('[ProgramsScreen] scheduleItems loaded:', scheduleItems);
  }, [scheduleItems]);

  // Get start date for current view
  const getViewStartDate = () => {
    switch (viewMode) {
      case "daily":
        return currentDate
      case "weekly":
        return startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
      case "monthly":
        return startOfMonth(currentDate)
      default:
        return currentDate
    }
  }

  // Get end date for current view
  const getViewEndDate = () => {
    switch (viewMode) {
      case "daily":
        return currentDate
      case "weekly":
        return endOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
      case "monthly":
        return endOfMonth(currentDate)
      default:
        return currentDate
    }
  }

  // Convert UTC time to local timezone for display
  const convertToLocalTime = (utcTime: string) => {
    return convertUTCToLocalTime(utcTime)
  }

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return scheduleItems.filter(item => item.for_date === dateStr)
  }

  // Handle edit item
  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item)
    setEditForm({
      summary: item.summary,
      coach_tip: item.coach_tip || "",
      for_time: convertUTCToLocalTime(item.for_time) // Convert UTC to local for display
    })
  }

  // Handle save edited item
  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          summary: editForm.summary,
          coach_tip: editForm.coach_tip,
          for_time: convertLocalTimeToUTC(editForm.for_time) // Convert local to UTC for storage
        })
        .eq('id', editingItem.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Schedule item updated successfully"
      })

      setEditingItem(null)
      fetchScheduleData() // Refresh data
    } catch (error: any) {
      console.error("Error updating schedule item:", error)
      toast({
        title: "Error",
        description: "Failed to update schedule item",
        variant: "destructive"
      })
    }
  }

  // Navigation functions
  const goToPrevious = () => {
    switch (viewMode) {
      case "daily":
        setCurrentDate(subDays(currentDate, 1))
        break
      case "weekly":
        setCurrentDate(subDays(currentDate, 7))
        break
      case "monthly":
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        break
    }
  }

  const goToNext = () => {
    switch (viewMode) {
      case "daily":
        setCurrentDate(addDays(currentDate, 1))
        break
      case "weekly":
        setCurrentDate(addDays(currentDate, 7))
        break
      case "monthly":
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchScheduleData()
  }, [clientId, viewMode, currentDate, selectedType])

  // Helper: Get tasks for a date in the required fixed order
  const getOrderedTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    // Only include relevant types and tasks, in the specified order
    const order = [
      { type: 'meal', task: 'Breakfast' },
      { type: 'meal', task: 'Lunch' },
      { type: 'meal', task: 'Snacks' },
      { type: 'workout' },
      { type: 'meal', task: 'Dinner' },
    ]
    // Filter out assessment and consultation, but include custom tasks
    const items = scheduleItems.filter(item =>
      item.for_date === dateStr &&
      item.type !== 'assessment' &&
      item.type !== 'consultation'
    )
    
    // Get ordered items first
    const orderedItems = order
      .map(({ type, task }) => {
        if (task) {
          return items.find(item => item.type === type && item.task === task)
        } else {
          // For workout, just match type
          return items.find(item => item.type === type)
        }
      })
      .filter((item): item is ScheduleItem => !!item) // Type guard: remove undefined
    
    // Add custom tasks at the end
    const customItems = items.filter(item => item.task === "custom")
    
    return [...orderedItems, ...customItems]
  }

  // Helper to open meal edit dialog
  const handleEditMeal = (item: ScheduleItem) => {
    setEditingMeal(item)
    setMealEditForm({
      task: item.task || '',
      meal: item.summary?.split(':')[1]?.trim() || '',
      amount: item.details_json?.amount || '',
      calories: item.details_json?.calories || '',
      protein: item.details_json?.protein || '',
      fats: item.details_json?.fats || '',
      carbs: item.details_json?.carbs || '',
      ...item.details_json
    })
  }

  // Helper to save meal edit (update schedule table)
  const handleSaveMealEdit = async () => {
    if (!editingMeal) return
    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          summary: `${mealEditForm.task}: ${mealEditForm.meal}`,
          details_json: {
            ...editingMeal.details_json,
            amount: mealEditForm.amount,
            calories: mealEditForm.calories,
            protein: mealEditForm.protein,
            fats: mealEditForm.fats,
            carbs: mealEditForm.carbs,
            ...mealEditForm
          }
        })
        .eq('id', editingMeal.id)
      if (error) throw error
      toast({ title: 'Success', description: 'Meal updated successfully.' })
      setEditingMeal(null)
      fetchScheduleData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Helper to open workout edit dialog
  const handleEditWorkout = (item: ScheduleItem) => {
    setEditingWorkout(item)
    // Try both possible keys for exercises array
    const exercises = item.details_json?.exercises || item.details_json?.main_workout || []
    setWorkoutEditForm(exercises.map((ex: any) => ({ ...ex })))
  }

  // Helper to save workout edit (update schedule table)
  const handleSaveWorkoutEdit = async () => {
    if (!editingWorkout) return
    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          details_json: {
            ...editingWorkout.details_json,
            exercises: workoutEditForm,
            main_workout: workoutEditForm // for compatibility
          }
        })
        .eq('id', editingWorkout.id)
      if (error) throw error
      toast({ title: 'Success', description: 'Workout updated successfully.' })
      setEditingWorkout(null)
      fetchScheduleData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Helper to get an icon for each meal type
  const getMealIcon = (task: string | undefined) => {
    switch ((task || '').toLowerCase()) {
      case 'breakfast': return '☀️';
      case 'lunch': return '🥪';
      case 'snacks': return '🍎';
      case 'dinner': return '🌙';
      default: return '��️';
    }
  }

  // Helper to get custom task icon
  const getCustomTaskIcon = (type: string) => {
    switch (type) {
      case 'hydration': return '💧';
      case 'wakeup': return '🛏️';
      case 'weight': return '⚖️';
      case 'progresspicture': return '📸';
      case 'other': return '🔔';
      default: return '📝';
    }
  }

  // --- TASK CARD COMPONENT ---
  // This component centralizes the rendering logic for all task types.
  const TaskCard = ({ item }: { item: ScheduleItem }) => {
    if (!item) return null;

    // Handle custom tasks
    if (item.task === "custom") {
      return (
        <div
          key={item.id}
          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg mb-3 cursor-pointer border border-purple-100 dark:border-purple-900 hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
          onClick={() => handleEditItem(item)}
          style={{ minHeight: 100 }}
        >
          {/* Custom Task Type as Title */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getCustomTaskIcon(item.type)}</span>
            <span className="font-extrabold text-sm md:text-base text-purple-700 dark:text-purple-200 tracking-wide uppercase break-words whitespace-normal leading-tight" style={{ fontSize: '0.7em' }}>
              {item.type.toUpperCase()}
            </span>
          </div>
          <div className="border-b border-dashed border-purple-200 dark:border-purple-700 my-2" />
          
          {/* Summary */}
          {item.summary && (
            <div className="font-medium text-sm text-purple-900 dark:text-purple-100 mb-2 break-words whitespace-normal leading-tight">
              {item.summary}
            </div>
          )}
          
          {/* Coach Tip */}
          {item.coach_tip && (
            <div className="text-xs text-gray-600 dark:text-gray-400 italic mb-2 break-words whitespace-normal leading-tight">
              💡 {item.coach_tip}
            </div>
          )}
          
          {/* Time */}
          {item.for_time && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              ⏰ {convertToLocalTime(item.for_time)}
            </div>
          )}
        </div>
      );
    }

    switch (item.type) {
      case 'meal':
        return (
          <div
            key={item.id}
            className="p-4 bg-gradient-to-br from-yellow-50 to-green-50 dark:from-yellow-900/20 dark:to-green-900/20 rounded-2xl shadow-lg mb-3 cursor-pointer border border-yellow-100 dark:border-yellow-900 hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
            onClick={() => handleEditMeal(item)}
            style={{ minHeight: 120 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-sm md:text-base text-yellow-700 dark:text-yellow-200 tracking-wide uppercase break-words whitespace-normal leading-tight" style={{ fontSize: '0.7em' }}>{item.task}</span>
            </div>
            <div className="border-b border-dashed border-yellow-200 dark:border-yellow-700 my-1" />
            {/* Meal name - now same as title */}
            <div className="font-extrabold text-sm md:text-base text-green-900 dark:text-green-200 mb-1 break-words whitespace-normal leading-tight" style={{ fontSize: '0.7em' }}>
              {item.summary?.split(':')[1]?.trim() || ''}
            </div>
            {item.details_json?.amount && (
              <div className="text-xs text-gray-700 dark:text-gray-300 mb-1 italic break-words whitespace-normal leading-tight" style={{ fontSize: '0.8em' }}>
                {item.details_json.amount}
              </div>
            )}
            <div className="border-b border-dashed border-green-200 dark:border-green-700 my-1" />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold dark:bg-orange-900 dark:text-orange-200">Cal: {item.details_json?.calories || 0}</span>
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold dark:bg-blue-900 dark:text-blue-200">P: {item.details_json?.protein || 0}g</span>
              <span className="px-2 py-1 rounded-full bg-pink-100 text-pink-800 text-xs font-bold dark:bg-pink-900 dark:text-pink-200">F: {item.details_json?.fats || 0}g</span>
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold dark:bg-green-900 dark:text-green-200">C: {item.details_json?.carbs || 0}g</span>
            </div>
          </div>
        );
      
      case 'workout':
        return (
          <div
            key={item.id}
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg mb-3 cursor-pointer border border-yellow-100 dark:border-yellow-900 hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
            onClick={() => handleEditWorkout(item)}
            style={{ minHeight: 100 }}
          >
            {/* Focus/Title - all caps, same as meal card */}
            <div className="mb-3 font-extrabold text-sm md:text-base text-blue-900 dark:text-blue-100 tracking-wide uppercase break-words whitespace-normal leading-tight" style={{ fontSize: '0.7em' }}>
              {(item.details_json?.focus || item.summary || 'Workout').toUpperCase()}
            </div>
            {/* Divider */}
            <div className="border-b border-dashed border-yellow-200 dark:border-yellow-700 my-2" />
            {/* List of exercises (no numbers) */}
            <div className="space-y-1 text-blue-900 dark:text-blue-100 font-normal">
              {item.details_json && item.details_json.exercises && item.details_json.exercises.length > 0 ? (
                item.details_json.exercises.map((ex: any, idx: number) => (
                  <div key={idx} className="break-words whitespace-normal leading-tight">
                    {/* Exercise name - now same as title */}
                    <span className="font-extrabold text-sm md:text-base text-green-900 dark:text-green-200 break-words whitespace-normal leading-tight" style={{ fontSize: '0.7em' }}>
                      {ex.exercise || ''}
                    </span>
                    {/* Body part - same as amount on meal card */}
                    {ex.body_part && (
                      <span className="text-xs text-gray-700 dark:text-gray-300 mb-1 italic ml-1" style={{ fontSize: '0.8em' }}>
                        {ex.body_part}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No exercises listed.</div>
              )}
            </div>
          </div>
        );

      default:
        // Fallback for any other type
        return (
          <div key={item.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm mb-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {item.summary}
              </div>
              <Badge variant="secondary" className="ml-auto">{item.type}</Badge>
            </div>
          </div>
        );
    }
  };

  // --- DAILY VIEW ---
  const renderDailyView = () => {
    const orderedItems = getOrderedTasksForDate(currentDate);
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
        <div className="space-y-2">
          {orderedItems.length === 0 ? (
            <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
              No tasks scheduled for this day.
            </div>
          ) : (
            orderedItems.map((item) => <TaskCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    );
  };

  // --- WEEKLY VIEW ---
  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const orderedItems = getOrderedTasksForDate(day);
            return (
              <div key={day.toString()} className="min-h-[200px] bg-white dark:bg-gray-900/50 rounded-lg p-2 shadow flex flex-col gap-2">
                <div className="text-center font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  {format(day, 'EEE, MMM d')}
                </div>
                {orderedItems.length === 0 ? (
                  <div className="text-center text-gray-400 dark:text-gray-500 text-xs p-4">No tasks</div>
                ) : (
                  orderedItems.map((item) => <TaskCard key={item.id} item={item} />)
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- MONTHLY VIEW ---
  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {eachDayOfInterval({ start: week, end: addDays(week, 6) }).map((day) => {
                const orderedItems = getOrderedTasksForDate(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toString()} className="min-h-[120px] p-1">
                    <div className={`text-center p-1 rounded ${
                      isToday
                        ? 'bg-blue-500 text-white'
                        : isCurrentMonth
                          ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      <div className="text-sm font-medium">{format(day, 'd')}</div>
                    </div>
                    <div className="mt-1 space-y-1">
                      {orderedItems.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center p-2">No tasks</div>
                      ) : (
                        orderedItems.map((item) => <TaskCard key={item.id} item={item} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} />
      </div>

      {/* Calendar Section */}
      <Card className="bg-white/95 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                {/* Extract cl_name for the title. Fallback order: cl_name > cl_prefer_name > 'Client' */}
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {`Program View for ${client?.cl_name || client?.cl_prefer_name || 'Client'}`}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and manage client schedule
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Navigation */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Custom Task Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCustomTaskModalOpen(true)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Tasks
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="min-h-[600px]">
              {viewMode === "daily" && renderDailyView()}
              {viewMode === "weekly" && renderWeeklyView()}
              {viewMode === "monthly" && renderMonthlyView()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Schedule Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Summary</label>
              <Input
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                placeholder="Event summary"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Coach Tip</label>
              <Textarea
                value={editForm.coach_tip}
                onChange={(e) => setEditForm({ ...editForm, coach_tip: e.target.value })}
                placeholder="Optional coach tip"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={editForm.for_time}
                onChange={(e) => setEditForm({ ...editForm, for_time: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal Edit Dialog */}
      <Dialog open={!!editingMeal} onOpenChange={() => setEditingMeal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Task</label>
              <Input value={mealEditForm.task} onChange={e => setMealEditForm({ ...mealEditForm, task: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Meal</label>
              <Input value={mealEditForm.meal} onChange={e => setMealEditForm({ ...mealEditForm, meal: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount</label>
              <Input value={mealEditForm.amount} onChange={e => setMealEditForm({ ...mealEditForm, amount: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Calories</label>
              <Input value={mealEditForm.calories} onChange={e => setMealEditForm({ ...mealEditForm, calories: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Protein (g)</label>
              <Input value={mealEditForm.protein} onChange={e => setMealEditForm({ ...mealEditForm, protein: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fats (g)</label>
              <Input value={mealEditForm.fats} onChange={e => setMealEditForm({ ...mealEditForm, fats: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Carbs (g)</label>
              <Input value={mealEditForm.carbs} onChange={e => setMealEditForm({ ...mealEditForm, carbs: e.target.value })} />
            </div>
            {/* Add more fields as needed from details_json */}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingMeal(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMealEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout Edit Dialog */}
      <Dialog open={!!editingWorkout} onOpenChange={() => setEditingWorkout(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="sticky top-0 bg-blue-50 dark:bg-blue-900/20 z-10">
                <tr>
                  <th className="p-3 border-b">Exercise</th>
                  <th className="p-3 border-b">Body Part</th>
                  <th className="p-3 border-b">Sets</th>
                  <th className="p-3 border-b">Reps</th>
                  <th className="p-3 border-b">Rest</th>
                  <th className="p-3 border-b">Weight</th>
                  <th className="p-3 border-b">Duration</th>
                  <th className="p-3 border-b">Coach Tip</th>
                </tr>
              </thead>
              <tbody>
                {workoutEditForm.map((ex, idx) => (
                  <tr key={idx}>
                    {/* EXERCISE NAME FIELD (make this wider) */}
                    <td className="p-3 border-b">
                      <input
                        className="bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1"
                        style={{ width: '125%' }} // <--- Adjust width here
                        value={ex.exercise || ''}
                        onChange={e => setWorkoutEditForm(f => {
                          const arr = [...f];
                          arr[idx].exercise = e.target.value;
                          return arr;
                        })}
                      />
                    </td>
                    {/* OTHER FIELDS */}
                    <td className="p-3 border-b">
                      <input
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1"
                        value={ex.body_part || ''}
                        onChange={e => setWorkoutEditForm(f => {
                          const arr = [...f];
                          arr[idx].body_part = e.target.value;
                          return arr;
                        })}
                      />
                    </td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.sets || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].sets = e.target.value; return arr; })} /></td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.reps || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].reps = e.target.value; return arr; })} /></td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.rest || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].rest = e.target.value; return arr; })} /></td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.weight || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].weight = e.target.value; return arr; })} /></td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.duration || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].duration = e.target.value; return arr; })} /></td>
                    <td className="p-3 border-b"><input className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 px-1 py-1" value={ex.coach_tip || ''} onChange={e => setWorkoutEditForm(f => { const arr = [...f]; arr[idx].coach_tip = e.target.value; return arr; })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingWorkout(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWorkoutEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Side Popups */}
      <SidePopup
        isOpen={showFitnessGoals}
        onClose={() => setShowFitnessGoals(false)}
        title="Fitness Goals"
        icon={<Target className="h-5 w-5 text-white" />}
      >
        <FitnessGoalsSection client={client} onGoalsSaved={onGoalsSaved} />
      </SidePopup>

      <SidePopup
        isOpen={showAICoachInsights}
        onClose={() => setShowAICoachInsights(false)}
        title="AI Coach Insights"
        icon={<Brain className="h-5 w-5 text-white" />}
      >
        <AICoachInsightsSection 
          lastAIRecommendation={lastAIRecommendation}
          onViewFullAnalysis={onViewFullAnalysis || (() => {})}
        />
      </SidePopup>

      <SidePopup
        isOpen={showTrainerNotes}
        onClose={() => setShowTrainerNotes(false)}
        title="Trainer Notes"
        icon={<Edit3 className="h-5 w-5 text-white" />}
      >
        <TrainerNotesSection 
          client={client}
          trainerNotes=""
          setTrainerNotes={() => {}}
          handleSaveTrainerNotes={() => {}}
          isSavingNotes={false}
          isEditingNotes={false}
          setIsEditingNotes={() => {}}
          notesDraft=""
          setNotesDraft={() => {}}
          notesError={null}
          setNotesError={() => {}}
          isGeneratingAnalysis={false}
          handleSummarizeNotes={() => {}}
          isSummarizingNotes={false}
          lastAIRecommendation={lastAIRecommendation}
        />
      </SidePopup>

      <SidePopup
        isOpen={showNutritionalPreferences}
        onClose={() => setShowNutritionalPreferences(false)}
        title="Nutritional Preferences"
        icon={<Utensils className="h-5 w-5 text-white" />}
      >
        <NutritionalPreferencesSection client={client} />
      </SidePopup>

      <SidePopup
        isOpen={showTrainingPreferences}
        onClose={() => setShowTrainingPreferences(false)}
        title="Training Preferences"
        icon={<Dumbbell className="h-5 w-5 text-white" />}
      >
        <TrainingPreferencesSection client={client} />
      </SidePopup>

      {/* Custom Task Modal */}
      <AddCustomTaskModal
        clientId={clientId || 1}
        clientName={client?.cl_name || client?.cl_prefer_name || "Client"}
        isOpen={isCustomTaskModalOpen}
        onClose={() => setIsCustomTaskModalOpen(false)}
        onTaskAdded={() => {
          // Refresh schedule data
          fetchScheduleData()
          toast({
            title: "Custom Task Added",
            description: "Your custom task has been successfully added to the schedule.",
          })
        }}
      />
    </div>
  )
} 