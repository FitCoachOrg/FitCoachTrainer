"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  Target, 
  Save, 
  Edit, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  CheckCircle, 
  X,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Filter,
  Calendar as CalendarIcon,
  Table,
  List,
  Grid3X3
} from "lucide-react"
import { generateAIWorkoutPlanForReview, saveReviewedWorkoutPlanToDatabase } from "@/lib/ai-fitness-plan"

// Types
interface WorkoutExercise {
  id?: string
  workout: string
  day?: string
  sets: number
  reps: string
  duration: number
  weights: string
  for_date: string
  for_time: string
  body_part: string
  category: string
  coach_tip: string
  icon: string
  workout_yt_link?: string
  progression_notes?: string
}

interface FitnessPlanData {
  overview?: string
  split?: string
  progression_model?: string
  weekly_breakdown?: Record<string, string>
  workout_plan: WorkoutExercise[]
  clientInfo?: any
  generatedAt?: string
}

interface FitnessPlanOverviewProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  initialPlanData?: FitnessPlanData | null
  onPlanSaved?: (success: boolean, message: string) => void
  embedded?: boolean // New prop to control embedded vs popup rendering
}

const FitnessPlanOverview: React.FC<FitnessPlanOverviewProps> = ({
  isOpen,
  onClose,
  clientId,
  initialPlanData,
  onPlanSaved,
  embedded = false
}) => {
  const { toast } = useToast()
  
  // State management
  const [planData, setPlanData] = useState<FitnessPlanData | null>(initialPlanData || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedPlan, setEditedPlan] = useState<WorkoutExercise[]>([])
  const [currentView, setCurrentView] = useState<'table' | 'calendar' | 'weekly' | 'daily'>('table')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedWeek, setSelectedWeek] = useState<string>('Week 1')
  
  // Metric toggles
  const [visibleMetrics, setVisibleMetrics] = useState({
    sets: true,
    reps: true,
    duration: true,
    weights: true,
    bodyPart: true,
    category: true,
    coachTip: true,
    date: true,
    time: true
  })
  
  // Draft management
  const [isDraft, setIsDraft] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [savedDrafts, setSavedDrafts] = useState<string[]>([])

  // Initialize plan data
  useEffect(() => {
    if (initialPlanData) {
      setPlanData(initialPlanData)
      setEditedPlan(initialPlanData.workout_plan.map((exercise, index) => ({
        ...exercise,
        id: exercise.id || `exercise-${index}`
      })))
    }
  }, [initialPlanData])

  // Load saved drafts from localStorage
  useEffect(() => {
    const drafts = localStorage.getItem('fitness-plan-drafts')
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts))
    }
  }, [])

  // Generate new AI plan
  const handleGenerateNewPlan = async () => {
    setIsLoading(true)
    try {
      const result = await generateAIWorkoutPlanForReview(clientId)
      
      if (result.success && result.workoutPlan) {
        const newPlanData: FitnessPlanData = {
          overview: result.workoutPlan.overview,
          split: result.workoutPlan.split,
          progression_model: result.workoutPlan.progression_model,
          weekly_breakdown: result.workoutPlan.weekly_breakdown,
          workout_plan: result.workoutPlan.workout_plan,
          clientInfo: result.clientInfo,
          generatedAt: result.generatedAt
        }
        
        setPlanData(newPlanData)
        setEditedPlan(newPlanData.workout_plan.map((exercise, index) => ({
          ...exercise,
          id: exercise.id || `exercise-${index}`
        })))
        
        toast({
          title: "Plan Generated Successfully",
          description: "Your AI fitness plan is ready for review and customization.",
        })
      } else {
        toast({
          title: "Generation Failed",
          description: result.message || "Failed to generate fitness plan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the plan.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save plan to Supabase
  const handleSavePlan = async () => {
    if (!editedPlan.length) {
      toast({
        title: "No Plan to Save",
        description: "Please generate or edit a fitness plan first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await saveReviewedWorkoutPlanToDatabase(editedPlan, clientId)
      
      if (result.success) {
        toast({
          title: "Plan Saved Successfully",
          description: `Saved ${editedPlan.length} exercises to the database.`,
        })
        
        // Clear draft if it was saved
        if (isDraft && draftName) {
          handleDeleteDraft(draftName)
        }
        
        onPlanSaved?.(true, result.message)
        onClose()
      } else {
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save fitness plan.",
          variant: "destructive",
        })
        onPlanSaved?.(false, result.message)
      }
    } catch (error: any) {
      console.error('Error saving plan:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the plan.",
        variant: "destructive",
      })
      onPlanSaved?.(false, "Unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  // Save as draft
  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      toast({
        title: "Draft Name Required",
        description: "Please enter a name for your draft.",
        variant: "destructive",
      })
      return
    }

    const draftData = {
      name: draftName,
      planData: planData,
      editedPlan: editedPlan,
      savedAt: new Date().toISOString(),
      clientId: clientId
    }

    const existingDrafts = JSON.parse(localStorage.getItem('fitness-plan-drafts') || '{}')
    existingDrafts[draftName] = draftData
    localStorage.setItem('fitness-plan-drafts', JSON.stringify(existingDrafts))

    setSavedDrafts(Object.keys(existingDrafts))
    setIsDraft(true)
    
    toast({
      title: "Draft Saved",
      description: `Draft "${draftName}" has been saved locally.`,
    })
  }

  // Load draft
  const handleLoadDraft = (draftName: string) => {
    const existingDrafts = JSON.parse(localStorage.getItem('fitness-plan-drafts') || '{}')
    const draft = existingDrafts[draftName]
    
    if (draft) {
      setPlanData(draft.planData)
      setEditedPlan(draft.editedPlan)
      setDraftName(draftName)
      setIsDraft(true)
      
      toast({
        title: "Draft Loaded",
        description: `Draft "${draftName}" has been loaded.`,
      })
    }
  }

  // Delete draft
  const handleDeleteDraft = (draftName: string) => {
    const existingDrafts = JSON.parse(localStorage.getItem('fitness-plan-drafts') || '{}')
    delete existingDrafts[draftName]
    localStorage.setItem('fitness-plan-drafts', JSON.stringify(existingDrafts))
    
    setSavedDrafts(Object.keys(existingDrafts))
    
    if (isDraft && draftName === draftName) {
      setIsDraft(false)
      setDraftName('')
    }
    
    toast({
      title: "Draft Deleted",
      description: `Draft "${draftName}" has been deleted.`,
    })
  }

  // Exercise editing functions
  const handleExerciseEdit = (index: number, field: string, value: any) => {
    const updatedPlan = [...editedPlan]
    updatedPlan[index] = { ...updatedPlan[index], [field]: value }
    setEditedPlan(updatedPlan)
  }

  const handleAddExercise = () => {
    const newExercise: WorkoutExercise = {
      id: `exercise-${Date.now()}`,
      workout: "New Exercise",
      sets: 3,
      reps: "10",
      duration: 15,
      weights: "bodyweight",
      for_date: selectedDate,
      for_time: "08:00:00",
      body_part: "Full Body",
      category: "Strength",
      coach_tip: "Focus on proper form",
      icon: "💪",
      workout_yt_link: ""
    }
    
    setEditedPlan([...editedPlan, newExercise])
  }

  const handleRemoveExercise = (index: number) => {
    setEditedPlan(editedPlan.filter((_, i) => i !== index))
  }

  // Get exercises for selected date (daily view)
  const getExercisesForDate = (date: string) => {
    return editedPlan.filter(exercise => exercise.for_date === date)
  }

  // Get exercises grouped by week
  const getExercisesByWeek = () => {
    const weeks: Record<string, WorkoutExercise[]> = {}
    editedPlan.forEach(exercise => {
      const exerciseDate = new Date(exercise.for_date)
      const weekKey = `Week ${Math.ceil(exerciseDate.getDate() / 7)}`
      if (!weeks[weekKey]) weeks[weekKey] = []
      weeks[weekKey].push(exercise)
    })
    return weeks
  }

  // Get unique dates from plan
  const getUniqueDates = () => {
    const dates = [...new Set(editedPlan.map(ex => ex.for_date))]
    return dates.sort()
  }

  // Toggle metric visibility
  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }))
  }

  // Render different views
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="text-left p-3 font-semibold">Exercise</th>
            {visibleMetrics.sets && <th className="text-left p-3 font-semibold">Sets</th>}
            {visibleMetrics.reps && <th className="text-left p-3 font-semibold">Reps</th>}
            {visibleMetrics.duration && <th className="text-left p-3 font-semibold">Duration</th>}
            {visibleMetrics.weights && <th className="text-left p-3 font-semibold">Weight</th>}
            {visibleMetrics.bodyPart && <th className="text-left p-3 font-semibold">Body Part</th>}
            {visibleMetrics.category && <th className="text-left p-3 font-semibold">Category</th>}
            {visibleMetrics.date && <th className="text-left p-3 font-semibold">Date</th>}
            {visibleMetrics.time && <th className="text-left p-3 font-semibold">Time</th>}
            {visibleMetrics.coachTip && <th className="text-left p-3 font-semibold">Coach Tip</th>}
            {isEditing && <th className="text-left p-3 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {editedPlan.map((exercise, index) => (
            <tr key={exercise.id || index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{exercise.icon}</span>
                  {isEditing ? (
                    <Input
                      value={exercise.workout}
                      onChange={(e) => handleExerciseEdit(index, 'workout', e.target.value)}
                      className="font-medium"
                    />
                  ) : (
                    <span className="font-medium">{exercise.workout}</span>
                  )}
                </div>
              </td>
              
              {visibleMetrics.sets && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseEdit(index, 'sets', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  ) : (
                    <Badge variant="secondary">{exercise.sets}</Badge>
                  )}
                </td>
              )}
              
              {visibleMetrics.reps && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      value={exercise.reps}
                      onChange={(e) => handleExerciseEdit(index, 'reps', e.target.value)}
                      className="w-20"
                    />
                  ) : (
                    <Badge variant="outline">{exercise.reps}</Badge>
                  )}
                </td>
              )}
              
              {visibleMetrics.duration && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={exercise.duration}
                      onChange={(e) => handleExerciseEdit(index, 'duration', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  ) : (
                    <Badge variant="outline">{exercise.duration}min</Badge>
                  )}
                </td>
              )}
              
              {visibleMetrics.weights && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      value={exercise.weights}
                      onChange={(e) => handleExerciseEdit(index, 'weights', e.target.value)}
                      className="w-24"
                    />
                  ) : (
                    <span className="text-sm">{exercise.weights}</span>
                  )}
                </td>
              )}
              
              {visibleMetrics.bodyPart && (
                <td className="p-3">
                  {isEditing ? (
                    <Select
                      value={exercise.body_part}
                      onValueChange={(value) => handleExerciseEdit(index, 'body_part', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Body">Full Body</SelectItem>
                        <SelectItem value="Upper Body">Upper Body</SelectItem>
                        <SelectItem value="Lower Body">Lower Body</SelectItem>
                        <SelectItem value="Core">Core</SelectItem>
                        <SelectItem value="Arms">Arms</SelectItem>
                        <SelectItem value="Legs">Legs</SelectItem>
                        <SelectItem value="Chest">Chest</SelectItem>
                        <SelectItem value="Back">Back</SelectItem>
                        <SelectItem value="Shoulders">Shoulders</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{exercise.body_part}</Badge>
                  )}
                </td>
              )}
              
              {visibleMetrics.category && (
                <td className="p-3">
                  {isEditing ? (
                    <Select
                      value={exercise.category}
                      onValueChange={(value) => handleExerciseEdit(index, 'category', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strength">Strength</SelectItem>
                        <SelectItem value="Cardio">Cardio</SelectItem>
                        <SelectItem value="Flexibility">Flexibility</SelectItem>
                        <SelectItem value="Balance">Balance</SelectItem>
                        <SelectItem value="Endurance">Endurance</SelectItem>
                        <SelectItem value="HIIT">HIIT</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{exercise.category}</Badge>
                  )}
                </td>
              )}
              
              {visibleMetrics.date && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      type="date"
                      value={exercise.for_date}
                      onChange={(e) => handleExerciseEdit(index, 'for_date', e.target.value)}
                      className="w-32"
                    />
                  ) : (
                    <span className="text-sm">{exercise.for_date}</span>
                  )}
                </td>
              )}
              
              {visibleMetrics.time && (
                <td className="p-3">
                  {isEditing ? (
                    <Input
                      type="time"
                      value={exercise.for_time}
                      onChange={(e) => handleExerciseEdit(index, 'for_time', e.target.value)}
                      className="w-24"
                    />
                  ) : (
                    <span className="text-sm">{exercise.for_time}</span>
                  )}
                </td>
              )}
              
              {visibleMetrics.coachTip && (
                <td className="p-3 max-w-xs">
                  {isEditing ? (
                    <Textarea
                      value={exercise.coach_tip}
                      onChange={(e) => handleExerciseEdit(index, 'coach_tip', e.target.value)}
                      className="text-xs"
                      rows={2}
                    />
                  ) : (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {exercise.coach_tip}
                    </span>
                  )}
                </td>
              )}
              
              {isEditing && (
                <td className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveExercise(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderCalendarView = () => {
    const uniqueDates = getUniqueDates()
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold p-2 bg-gray-100 dark:bg-gray-800 rounded">
            {day}
          </div>
        ))}
        
        {uniqueDates.map(date => {
          const exercises = getExercisesForDate(date)
          const dateObj = new Date(date)
          
          return (
            <div
              key={date}
              className={`p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                date === selectedDate ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' : ''
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-sm font-medium">{dateObj.getDate()}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {exercises.length} exercises
              </div>
              <div className="mt-1 space-y-1">
                {exercises.slice(0, 2).map((exercise, index) => (
                  <div key={index} className="text-xs truncate">
                    {exercise.icon} {exercise.workout}
                  </div>
                ))}
                {exercises.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{exercises.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeeklyView = () => {
    const weeklyExercises = getExercisesByWeek()
    
    return (
      <div className="space-y-6">
        {Object.entries(weeklyExercises).map(([week, exercises]) => (
          <Card key={week}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {week}
                <Badge variant="secondary">{exercises.length} exercises</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((exercise, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{exercise.icon}</span>
                        <h4 className="font-medium">{exercise.workout}</h4>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div>Sets: {exercise.sets} | Reps: {exercise.reps}</div>
                        <div>Duration: {exercise.duration}min</div>
                        <div>Body Part: {exercise.body_part}</div>
                        <div>Date: {exercise.for_date}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderDailyView = () => {
    const dailyExercises = getExercisesForDate(selectedDate)
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Exercises for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
        
        {dailyExercises.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No exercises scheduled for this date
          </div>
        ) : (
          <div className="space-y-4">
            {dailyExercises.map((exercise, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{exercise.icon}</span>
                      <div>
                        <h4 className="font-semibold text-lg">{exercise.workout}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.body_part} • {exercise.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{exercise.for_time}</div>
                      <div className="text-sm text-gray-500">{exercise.duration}min</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-4">
                    <Badge variant="secondary">Sets: {exercise.sets}</Badge>
                    <Badge variant="secondary">Reps: {exercise.reps}</Badge>
                    <Badge variant="secondary">Weight: {exercise.weights}</Badge>
                  </div>
                  
                  {exercise.coach_tip && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm">
                        <strong>Coach Tip:</strong> {exercise.coach_tip}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

    // Render the main content
  const renderContent = () => (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateNewPlan}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Plan
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "default" : "outline"}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Stop Editing" : "Edit Plan"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSavePlan}
            disabled={isSaving || !editedPlan.length}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save to Database
              </>
            )}
          </Button>
          
          {!embedded && (
            <Button onClick={onClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Plan Content - Table View First */}
      <Card>
        <CardContent className="p-6">
          {editedPlan.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Plan Generated</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Generate an AI fitness plan to get started.
              </p>
              <Button onClick={handleGenerateNewPlan} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Always show table view first */}
              {renderTableView()}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
          <TabsList>
            <TabsTrigger value="table">
              <Table className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="daily">
              <List className="h-4 w-4 mr-2" />
              Daily
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metric Toggles */}
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <Label>Show:</Label>
          
          {Object.entries(visibleMetrics).map(([key, visible]) => (
            <div key={key} className="flex items-center gap-1">
              <Switch
                checked={visible}
                onCheckedChange={() => toggleMetric(key as keyof typeof visibleMetrics)}
                id={key}
              />
              <Label htmlFor={key} className="text-xs capitalize">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Add Exercise Button (when editing) */}
      {isEditing && (
        <div className="flex justify-center">
          <Button onClick={handleAddExercise} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      )}

      {/* Alternative Views */}
      {editedPlan.length > 0 && currentView !== 'table' && (
        <Card>
          <CardContent className="p-6">
            {currentView === 'calendar' && renderCalendarView()}
            {currentView === 'weekly' && renderWeeklyView()}
            {currentView === 'daily' && renderDailyView()}
          </CardContent>
        </Card>
      )}

      {/* Plan Summary */}
      {planData && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {planData.overview && (
              <div>
                <Label className="font-semibold">Overview:</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{planData.overview}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planData.split && (
                <div>
                  <Label className="font-semibold">Split:</Label>
                  <p className="text-sm">{planData.split}</p>
                </div>
              )}
              
              {planData.progression_model && (
                <div>
                  <Label className="font-semibold">Progression Model:</Label>
                  <p className="text-sm">{planData.progression_model}</p>
                </div>
              )}
              
              <div>
                <Label className="font-semibold">Total Exercises:</Label>
                <p className="text-sm">{editedPlan.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Draft Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Enter draft name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveDraft} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
          
          {savedDrafts.length > 0 && (
            <div>
              <Label className="font-semibold mb-2 block">Saved Drafts:</Label>
              <div className="flex flex-wrap gap-2">
                {savedDrafts.map(draft => (
                  <div key={draft} className="flex items-center gap-1">
                    <Button
                      onClick={() => handleLoadDraft(draft)}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {draft}
                    </Button>
                    <Button
                      onClick={() => handleDeleteDraft(draft)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
    
    // Return embedded or dialog version
    if (embedded) {
      return (
        <div className="h-full overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              <h2 className="text-xl font-bold">Fitness Plan Overview</h2>
              {isDraft && (
                <Badge variant="outline" className="ml-2">
                  Draft: {draftName}
                </Badge>
              )}
            </div>
          </div>
          {renderContent()}
        </div>
      )
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Fitness Plan Overview
              {isDraft && (
                <Badge variant="outline" className="ml-2">
                  Draft: {draftName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    )
  }

export default FitnessPlanOverview 