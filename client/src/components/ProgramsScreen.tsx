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
  Dumbbell
} from "lucide-react"
import { SidePopup } from "@/components/ui/side-popup"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "./overview/TrainingPreferencesSection"



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

  // Get schedule types for filter
  const scheduleTypes = ["all", "meal", "workout", "assessment", "consultation"]

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

  // Convert UTC time to local timezone
  const convertToLocalTime = (utcTime: string) => {
    try {
      const [hours, minutes] = utcTime.split(':')
      const date = new Date()
      date.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0)
      return format(date, 'HH:mm')
    } catch {
      return utcTime
    }
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
      for_time: item.for_time
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
          for_time: editForm.for_time
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

  // Render daily view
  const renderDailyView = () => {
    const items = getItemsForDate(currentDate)
    
    // Generate time slots from 6 AM to 10 PM
    const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
        
        <div className="space-y-2">
          {/* Timeline header */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              Time
            </div>
            <div className="text-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              Events
            </div>
          </div>
          
          {/* Timeline slots */}
          {timeSlots.map((hour) => {
            const hourItems = items.filter(item => {
              if (!item.for_time) return false
              const itemHour = parseInt(item.for_time.split(':')[0])
              return itemHour === hour
            })
            
            return (
              <div key={hour} className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                <div className="text-center p-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  {format(new Date().setHours(hour), 'HH:mm')}
                </div>
                <div className="p-2">
                  {hourItems.map((item) => (
                    <div key={item.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg text-sm mb-2 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 shadow-sm" onClick={() => handleEditItem(item)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="font-medium text-blue-900 dark:text-blue-100">
                          {item.summary}
                        </div>
                        <Badge variant="outline" className="ml-auto">{item.type}</Badge>
                      </div>
                      {item.coach_tip && (
                        <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                          💡 {item.coach_tip}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {convertToLocalTime(item.for_time)}
                      </div>
                    </div>
                  ))}
                  {hourItems.length === 0 && (
                    <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                      No events
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render weekly view
  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    // Generate time slots from 6 AM to 10 PM
    const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6) // 6 AM to 10 PM
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
        </div>
        
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1">
            <div className="text-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              Time
            </div>
            {weekDays.map((day) => (
              <div key={day.toString()} className="text-center p-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="font-bold">{format(day, 'EEE')}</div>
                <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>
          
          {/* Time slots with timeline */}
          {timeSlots.map((hour) => {
            const timeSlots = weekDays.map(day => {
              const items = getItemsForDate(day).filter(item => {
                if (!item.for_time) return false
                const itemHour = parseInt(item.for_time.split(':')[0])
                return itemHour === hour
              })
              return items
            })
            
            return (
              <div key={hour} className="grid grid-cols-8 gap-1 border-b border-gray-100 dark:border-gray-800">
                <div className="text-center p-2 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  {format(new Date().setHours(hour), 'HH:mm')}
                </div>
                {timeSlots.map((items, dayIndex) => (
                  <div key={dayIndex} className="p-1 min-h-[80px] border-r border-gray-100 dark:border-gray-800">
                    {items.map((item) => (
                      <div key={item.id} className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg text-xs mb-1 cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 shadow-sm" onClick={() => handleEditItem(item)}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="font-medium text-blue-900 dark:text-blue-100 truncate">
                            {item.summary}
                          </div>
                        </div>
                        {item.coach_tip && (
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2 italic">
                            💡 {item.coach_tip}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {convertToLocalTime(item.for_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render monthly view
  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

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
                const items = getItemsForDate(day)
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                const isToday = isSameDay(day, new Date())
                
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
                      {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="p-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded text-xs cursor-pointer hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200" onClick={() => handleEditItem(item)}>
                          <div className="font-medium text-blue-900 dark:text-blue-100 truncate">
                            {item.summary}
                          </div>
                          {item.coach_tip && (
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-1 italic">
                              💡 {item.coach_tip}
                            </div>
                          )}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

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
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Schedule Calendar
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
    </div>
  )
} 