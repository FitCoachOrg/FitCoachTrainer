"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Save, X, Clock, Dumbbell, Calendar, Target, Bug, Sparkles, BarChart3, Edit, PieChart } from "lucide-react"

// Import the real AI workout plan generator
import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"
import AIDebugPopup from "@/components/AIDebugPopup"

// Types
interface Exercise {
  id: string
  name: string
  instructions: string
  sets: string
  reps: string
  duration: string
  equipment: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  createdAt: Date
}

interface WorkoutExercise {
  workout: string
  duration: number
  sets: number
  reps: string
  weights: string
  coach_tip: string
  icon: string
  category: string
  body_part: string
  workout_yt_link: string
}

interface WorkoutPlan {
  id: string
  name: string
  type: string
  duration: number
  difficulty: string
  color: string
  category: string
  body_part: string
  exercises: WorkoutExercise[]
}

// The real AI workout plan generator is now imported from ai-fitness-plan.ts 

// Mock popup components (replace with your actual implementations)
const ClientDataPopup = ({ isOpen, onClose, clientInfo }: any) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Client Data</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {clientInfo && (
          <div>
            <p>
              <strong>Name:</strong> {clientInfo.name}
            </p>
            <p>
              <strong>Age:</strong> {clientInfo.age}
            </p>
            <p>
              <strong>Fitness Level:</strong> {clientInfo.fitnessLevel}
            </p>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
)

const AIResponsePopup = ({
  isOpen,
  onClose,
  aiResponse,
  clientName,
  onShowMetrics,
}: {
  isOpen: boolean
  onClose: () => void
  aiResponse: any | null
  clientName?: string
  onShowMetrics?: () => void
}) => {
  const [activeTab, setActiveTab] = useState<"table" | "raw">("table")
  const [workoutPlan, setWorkoutPlan] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // Parse workout plan from AI response
  useEffect(() => {
    if (aiResponse?.response) {
      try {
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0])
          if (parsedData.workout_plan && Array.isArray(parsedData.workout_plan)) {
            // Clean and validate the workout plan data
            const cleanedWorkoutPlan = parsedData.workout_plan.map((workout: any) => {
              console.log('🧹 Cleaning workout in popup:', workout)
              
              // Helper function to extract numbers from strings
              const extractNumber = (value: any, defaultValue: number = 0): number => {
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                  const match = value.match(/(\d+)/);
                  return match ? parseInt(match[1]) : defaultValue;
                }
                return defaultValue;
              };
              
              // Clean reps field - common issue where duration ends up in reps
              let cleanReps = workout.reps;
              if (typeof cleanReps === 'string' && (cleanReps.includes('minute') || cleanReps.includes('min'))) {
                console.warn('⚠️ Found duration in reps field, fixing:', cleanReps);
                // Extract number and set as default reps
                const repsNumber = extractNumber(cleanReps, 10);
                cleanReps = repsNumber.toString();
                
                // If duration is missing or 0, set it from the extracted value
                if (!workout.duration || workout.duration === 0) {
                  workout.duration = extractNumber(cleanReps, 15);
                }
              }
              
              return {
                ...workout,
                sets: extractNumber(workout.sets, 3),
                reps: cleanReps?.toString() || '10',
                duration: extractNumber(workout.duration, 15),
                weights: workout.weights || 'bodyweight',
                body_part: workout.body_part || 'Full Body',
                category: workout.category || 'Strength',
                coach_tip: workout.coach_tip || 'Focus on proper form',
                icon: workout.icon || '💪',
                for_date: workout.for_date || new Date().toISOString().split('T')[0],
                for_time: workout.for_time || '08:00:00'
              };
            });
            
            console.log('✅ Cleaned workout plan for popup:', cleanedWorkoutPlan);
            setWorkoutPlan(cleanedWorkoutPlan)
          }
        }
      } catch (error) {
        console.error("Error parsing workout plan:", error)
      }
    }
  }, [aiResponse])

  const handleWorkoutChange = (index: number, field: string, value: any) => {
    const updatedPlan = [...workoutPlan]
    
    // Type validation and conversion
    let processedValue = value;
    
    if (field === 'sets' || field === 'duration') {
      // These should be numbers
      processedValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    } else if (field === 'reps') {
      // Reps should be string (can be "10-12", "10", etc.)
      processedValue = String(value);
      
      // If reps contains "minute" or time references, it's probably wrong
      if (processedValue.includes('minute') || processedValue.includes('min')) {
        console.warn('⚠️ Reps field contains duration value, cleaning:', processedValue);
        // Extract number and assume it was meant to be reps
        const match = processedValue.match(/(\d+)/);
        processedValue = match ? match[1] : '10';
      }
    }
    
    updatedPlan[index] = { ...updatedPlan[index], [field]: processedValue }
    setWorkoutPlan(updatedPlan)
  }

  const addNewWorkout = () => {
    const newWorkout = {
      workout: "New Exercise",
      sets: 3, // number
      reps: "10", // string (can be range like "8-12")
      duration: 15, // number (minutes)
      weights: "bodyweight",
      for_date: new Date().toISOString().split("T")[0],
      for_time: "08:00:00",
      body_part: "Full Body",
      category: "Strength",
      coach_tip: "Focus on proper form",
      icon: "💪",
      progression_notes: "Increase intensity when RPE ≤ 8",
    }
    console.log('➕ Adding new workout with correct types:', newWorkout)
    setWorkoutPlan([...workoutPlan, newWorkout])
  }

  const removeWorkout = (index: number) => {
    const updatedPlan = workoutPlan.filter((_, i) => i !== index)
    setWorkoutPlan(updatedPlan)
  }

  const saveChanges = () => {
    setIsEditing(false)
    console.log("Saved workout plan:", workoutPlan)
  }

  if (!isOpen || !aiResponse) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                AI Fitness Plan Generated
              </span>
              {clientName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                  Personalized plan for {clientName}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-gray-100/80 dark:bg-gray-800/80 p-2 rounded-2xl">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                activeTab === "table"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg scale-105"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Workout Table
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                activeTab === "raw"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg scale-105"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Edit className="w-4 h-4" />
              Raw Response
            </button>
          </div>
          {/* Workout Plan Table */}
          {activeTab === "table" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900 dark:text-white">Workout Plan</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workoutPlan.length} exercises • Personalized for your goals
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button onClick={saveChanges} className="bg-gradient-to-r from-green-500 to-emerald-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-2 border-blue-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Plan
                    </Button>
                  )}
                </div>
              </div>
              {workoutPlan.length > 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Exercise</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Sets</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Reps</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Duration</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Equipment</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Body Part</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Category</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Date</th>
                          <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Coach Tip</th>
                          {isEditing && <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {workoutPlan.map((workout, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{workout.icon}</span>
                                {isEditing ? (
                                  <Input
                                    value={workout.workout}
                                    onChange={(e) => handleWorkoutChange(index, "workout", e.target.value)}
                                    className="font-semibold"
                                  />
                                ) : (
                                  <span className="font-semibold">{workout.workout}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                                                              {isEditing ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={workout.sets}
                                    onChange={(e) =>
                                      handleWorkoutChange(index, "sets", Math.max(1, Number.parseInt(e.target.value) || 1))
                                    }
                                    className="w-20"
                                  />
                                ) : (
                                  <Badge variant="secondary">{workout.sets}</Badge>
                                )}
                            </td>
                            <td className="p-4">
                                                              {isEditing ? (
                                  <Input
                                    value={workout.reps}
                                    onChange={(e) => handleWorkoutChange(index, "reps", e.target.value)}
                                    className="w-24"
                                    placeholder="10"
                                    pattern="[0-9-]+"
                                    title="Enter number or range (e.g., 10 or 8-12)"
                                  />
                                ) : (
                                  <span>{workout.reps}</span>
                                )}
                            </td>
                            <td className="p-4">
                                                              {isEditing ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    max="180"
                                    value={workout.duration}
                                    onChange={(e) =>
                                      handleWorkoutChange(index, "duration", Math.max(1, Number.parseInt(e.target.value) || 15))
                                    }
                                    className="w-24"
                                    placeholder="15"
                                  />
                                ) : (
                                  <span>{workout.duration} min</span>
                                )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <Select
                                  value={workout.weights}
                                  onValueChange={(value) => handleWorkoutChange(index, "weights", value)}
                                >
                                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                                    <SelectItem value="Dumbbells">Dumbbells</SelectItem>
                                    <SelectItem value="Barbell">Barbell</SelectItem>
                                    <SelectItem value="Resistance Bands">Resistance Bands</SelectItem>
                                    <SelectItem value="Machine">Machine</SelectItem>
                                    <SelectItem value="Kettlebell">Kettlebell</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span>{workout.weights}</span>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <Select
                                  value={workout.body_part}
                                  onValueChange={(value) => handleWorkoutChange(index, "body_part", value)}
                                >
                                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
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
                                <Badge variant="outline">{workout.body_part}</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <Select
                                  value={workout.category}
                                  onValueChange={(value) => handleWorkoutChange(index, "category", value)}
                                >
                                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Strength">Strength</SelectItem>
                                    <SelectItem value="Cardio">Cardio</SelectItem>
                                    <SelectItem value="Flexibility">Flexibility</SelectItem>
                                    <SelectItem value="HIIT">HIIT</SelectItem>
                                    <SelectItem value="Endurance">Endurance</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge>{workout.category}</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={workout.for_date}
                                  onChange={(e) => handleWorkoutChange(index, "for_date", e.target.value)}
                                  className="w-40"
                                />
                              ) : (
                                <span className="text-sm">{new Date(workout.for_date).toLocaleDateString()}</span>
                              )}
                            </td>
                            <td className="p-4 max-w-xs">
                              {isEditing ? (
                                <Textarea
                                  value={workout.coach_tip}
                                  onChange={(e) => handleWorkoutChange(index, "coach_tip", e.target.value)}
                                  className="text-sm"
                                  rows={2}
                                />
                              ) : (
                                <span className="text-sm text-gray-600 dark:text-gray-400">{workout.coach_tip}</span>
                              )}
                            </td>
                            {isEditing && (
                              <td className="p-4">
                                <Button onClick={() => removeWorkout(index)} variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {isEditing && (
                    <div className="p-6 border-t bg-gray-50 dark:bg-gray-800/50">
                      <Button onClick={addNewWorkout} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Exercise
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dumbbell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No workout plan found in the AI response</p>
                </div>
              )}
            </div>
          )}
          {/* Raw Response Tab */}
          {activeTab === "raw" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border overflow-hidden">
              <div className="p-6">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                  {aiResponse.response}
                </pre>
              </div>
            </div>
          )}
          {/* Usage Statistics */}
          {aiResponse.usage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-6 rounded-2xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-green-500/10 dark:bg-green-400/10">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-xl text-green-900 dark:text-green-100">Usage Statistics</h4>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {aiResponse.model || "gpt-4"}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Model</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {aiResponse.usage.total_tokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Total Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {aiResponse.usage.prompt_tokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Input Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {aiResponse.usage.completion_tokens.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Output Tokens</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t">
            {onShowMetrics && aiResponse.usage && (
              <Button variant="outline" onClick={onShowMetrics}>
                <PieChart className="w-4 h-4 mr-2" />
                View Detailed Metrics
              </Button>
            )}
            <Button onClick={onClose} className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const AIMetricsPopup = ({ isOpen, onClose, metrics, clientName }: any) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>AI Generation Metrics</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {metrics && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Input Tokens:</strong> {metrics.inputTokens}
              </p>
              <p>
                <strong>Output Tokens:</strong> {metrics.outputTokens}
              </p>
              <p>
                <strong>Total Tokens:</strong> {metrics.totalTokens}
              </p>
            </div>
            <div>
              <p>
                <strong>Model:</strong> {metrics.model}
              </p>
              <p>
                <strong>Response Time:</strong> {metrics.responseTime}ms
              </p>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
) 

interface WorkoutPlanSectionProps {
  clientId?: string | number;
}

const WorkoutPlanSection = ({ clientId }: WorkoutPlanSectionProps) => {
  const { toast } = useToast()
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, WorkoutPlan>>({})
  const [scheduledWorkouts, setScheduledWorkouts] = useState<WorkoutPlan[][]>(() =>
    Array(7)
      .fill(null)
      .map(() => []),
  )
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showClientDataPopup, setShowClientDataPopup] = useState(false)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [showAIResponsePopup, setShowAIResponsePopup] = useState(false)
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [aiGeneratedPlans, setAiGeneratedPlans] = useState<WorkoutPlan[]>([])
  const [showAIMetricsPopup, setShowAIMetricsPopup] = useState(false)
  const [aiMetrics, setAiMetrics] = useState<{
    inputTokens: number
    outputTokens: number
    totalTokens: number
    model: string
    timestamp: string
    responseTime?: number
  } | null>(null)
  const [showDebugPopup, setShowDebugPopup] = useState(false)
  const [debugData, setDebugData] = useState<{
    rawResponse: any
    parsedData: any[]
  } | null>(null)
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [showEditPlanModal, setShowEditPlanModal] = useState(false)
  const [editedPlan, setEditedPlan] = useState<WorkoutPlan | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartTime, setDragStartTime] = useState(0)
  const [mouseDownTime, setMouseDownTime] = useState(0)
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 })

  const [newExercise, setNewExercise] = useState<Omit<Exercise, "id" | "createdAt">>({
    name: "",
    instructions: "",
    sets: "",
    reps: "",
    duration: "",
    equipment: "",
    difficulty: "Beginner",
  })
  const [showProfileCard, setShowProfileCard] = useState(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedExercises = localStorage.getItem("custom-exercises")
    const savedWeeklyPlan = localStorage.getItem("weekly-plan")

    if (savedExercises) {
      setCustomExercises(JSON.parse(savedExercises))
    }
    if (savedWeeklyPlan) {
      setWeeklyPlan(JSON.parse(savedWeeklyPlan))
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("custom-exercises", JSON.stringify(customExercises))
  }, [customExercises])

  useEffect(() => {
    localStorage.setItem("weekly-plan", JSON.stringify(weeklyPlan))
  }, [weeklyPlan])

  // New editable table state for workout plans
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string | number>("")
  const [allWorkoutPlans, setAllWorkoutPlans] = useState<any[]>([])

  // Initialize workout plans from recommended and AI generated
  useEffect(() => {
    const initialPlans = [
      // Convert AI generated plans to flat exercises
      ...aiGeneratedPlans.flatMap((plan) =>
        plan.exercises.map((exercise: any, index: number) => ({
          id: `${plan.id}-${index}`,
          day: "Monday", // Default day
          exercise: exercise.workout,
          sets: exercise.sets,
          reps: exercise.reps,
          duration: exercise.duration,
          weight: exercise.weights,
          coach_tip: exercise.coach_tip,
          category: exercise.category,
          body_part: exercise.body_part,
          icon: exercise.icon,
          source: "ai",
        })),
      ),
    ]
    setAllWorkoutPlans(initialPlans)
  }, [aiGeneratedPlans])

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const weightOptions = [
    "bodyweight",
    "5kg",
    "10kg",
    "15kg",
    "20kg",
    "25kg",
    "30kg",
    "Dumbbells",
    "Barbell",
    "Kettlebell",
    "Resistance Bands",
  ]

  const getDayColor = (day: string) => {
    const colors = {
      Monday: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
      Tuesday: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm",
      Wednesday: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm",
      Thursday: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm",
      Friday: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm",
      Saturday: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm",
      Sunday: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm",
    }
    return colors[day as keyof typeof colors] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm"
  }

  const handleCellClick = (workout: any, field: string) => {
    setEditingCell({ id: workout.id, field })
    setEditValue(workout[field])
  }

  const handleSave = () => {
    if (editingCell) {
      setAllWorkoutPlans((prev) =>
        prev.map((w) =>
          w.id === editingCell.id
            ? {
                ...w,
                [editingCell.field]:
                  editingCell.field === "sets" || editingCell.field === "duration" ? Number(editValue) : editValue,
              }
            : w,
        ),
      )
      setEditingCell(null)
      setEditValue("")
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleDeleteWorkout = (id: string) => {
    setAllWorkoutPlans((prev) => prev.filter((w) => w.id !== id))
  }

  const handleAddNewWorkout = () => {
    const newWorkout = {
      id: Date.now().toString(),
      day: "Monday",
      exercise: "New Exercise",
      sets: 3,
      reps: "10",
      duration: 30,
      weight: "bodyweight",
      coach_tip: "Focus on proper form",
      category: "strength",
      body_part: "full_body",
      icon: "💪",
      source: "custom",
    }
    setAllWorkoutPlans((prev) => [...prev, newWorkout])
  }

  // Function to parse AI response and convert to recommended plans format
  const parseAIResponseToPlans = (aiResponseText: string) => {
    try {
      // Extract JSON from the AI response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response")
      }

      const aiData = JSON.parse(jsonMatch[0])

      if (!aiData.workout_plan || !Array.isArray(aiData.workout_plan)) {
        throw new Error("Invalid workout plan format in AI response")
      }

      // Convert AI workout plan to recommended plans format
      const aiPlan: WorkoutPlan = {
        id: `ai-plan-${Date.now()}`,
        name: `AI Generated Plan`,
        type: "AI Generated",
        duration: aiData.workout_plan.reduce((total: number, exercise: any) => total + (exercise.duration || 0), 0),
        difficulty: "AI Recommended",
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        category: "ai_generated",
        body_part: "full_body",
        exercises: aiData.workout_plan.map((exercise: any) => ({
          workout: exercise.workout,
          duration: exercise.duration || 0,
          sets: exercise.sets || 1,
          reps: exercise.reps ? exercise.reps.toString() : "1",
          weights: exercise.weights || "bodyweight",
          coach_tip: exercise.coach_tip || "Follow proper form",
          icon: exercise.icon || "💪",
          category: exercise.category || "strength",
          body_part: exercise.body_part || "full_body",
          workout_yt_link: "",
        })),
      }

      return [aiPlan]
    } catch (error) {
      console.error("Error parsing AI response:", error)
      throw new Error("Failed to parse AI response")
    }
  }

  // Handle AI fitness plan generation
  const handleGenerateAIPlans = async () => {
    console.log("🚀 === AI GENERATION BUTTON CLICKED ===")
    console.log("🚀 Button clicked - Starting AI generation process")
    console.log("⏰ Timestamp:", new Date().toISOString())
    console.log("🔍 Component State - isGeneratingAI:", isGeneratingAI)

    setIsGeneratingAI(true)
    const startTime = Date.now() // Track response time

    try {
      // Use the actual client ID passed as prop, fallback to hardcoded for testing
      const actualClientId = clientId ? Number(clientId) : 34
      console.log("🎯 Using client ID:", actualClientId, clientId ? "(from props)" : "(fallback)")
      console.log("📞 CALLING generateAIWorkoutPlan function...")
      console.log("📞 Function will automatically attempt to save to database if successful")

      const result = await generateAIWorkoutPlan(actualClientId)
      console.log("📨 === FUNCTION CALL COMPLETED ===")
      console.log("📨 Full result object:", result)
      const responseTime = Date.now() - startTime // Calculate response time

      console.log("📬 Function Response:")
      console.log("  - Success:", result.success)
      console.log("  - Message:", result.message)
      console.log("  - Has Client Data:", !!result.clientData)

      if (result.success) {
        console.log("✅ SUCCESS - Data retrieval completed")

        // Log the client data to console for inspection
        if (result.clientData && result.clientInfo) {
          console.log("🎉 CLIENT DATA SUCCESSFULLY RETRIEVED:")
          console.log("📋 Data Format: JavaScript Object")
          console.log("🔢 Number of Properties:", Object.keys(result.clientData).length)
          console.log("🏷️ Property Names:", Object.keys(result.clientData))
          console.log("📊 Full Client Data Object:")
          console.table(result.clientData) // Display as table for better readability
          console.log("📄 JSON Format:")
          console.log(JSON.stringify(result.clientData, null, 2))
          console.log("💾 Organized Client Info:")
          console.log(result.clientInfo)

          // Set client info
          setClientInfo(result.clientInfo)

          // If AI response is available, parse and add to recommended plans
          if (result.aiResponse) {
            try {
              const aiPlans = parseAIResponseToPlans(result.aiResponse.response)
              setAiGeneratedPlans(aiPlans)
              setAiResponse(result.aiResponse)

              // Convert AI plan exercises to individual workout items and add to the main list
              if (aiPlans.length > 0 && aiPlans[0].exercises) {
                const aiWorkouts = aiPlans[0].exercises.map((exercise, index) => ({
                  id: `ai-${Date.now()}-${index}`,
                  day: "Monday", // Default day, user can edit
                  exercise: exercise.workout,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  duration: exercise.duration,
                  weights: exercise.weights,
                  coach_tip: exercise.coach_tip,
                  icon: exercise.icon,
                  category: exercise.category,
                  body_part: exercise.body_part,
                }))
                setAllWorkoutPlans(prev => [...prev, ...aiWorkouts])
              }

              // Always show the complete AI response first
              setShowAIResponsePopup(true)

              // Capture metrics for later display
              if (result.aiResponse.usage) {
                const metrics = {
                  inputTokens: result.aiResponse.usage.prompt_tokens || 0,
                  outputTokens: result.aiResponse.usage.completion_tokens || 0,
                  totalTokens: result.aiResponse.usage.total_tokens || 0,
                  model: result.aiResponse.model || "gpt-4",
                  timestamp: result.aiResponse.timestamp,
                  responseTime: responseTime,
                }
                setAiMetrics(metrics)
              }

              const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || "Client"
              
              // Capture debug data for successful generation
              if (result.debugData) {
                setDebugData(result.debugData)
                setShowDebugPopup(true)
              }
              
              // Log the complete AI response for debugging
              console.log("🎯 COMPLETE AI RESPONSE:")
              console.log("📄 Raw Response:", result.aiResponse.response)
              console.log("📊 Parsed Plans:", aiPlans)
              console.log("💪 Generated Workouts:", aiPlans[0]?.exercises)
              
              toast({
                title: "AI Workout Plan Generated",
                description: `Personalized plan created for ${clientName}. Click to view full response.`,
              })
            } catch (parseError) {
              console.error("Error parsing AI response:", parseError)
              // Show the raw response in popup (parsing failed)
              setAiResponse(result.aiResponse)
              setShowAIResponsePopup(true)

              // Capture debug data for parsing errors
              if (result.debugData) {
                setDebugData(result.debugData)
                setShowDebugPopup(true)
              }

              // Capture metrics for later display
              if (result.aiResponse.usage) {
                const metrics = {
                  inputTokens: result.aiResponse.usage.prompt_tokens || 0,
                  outputTokens: result.aiResponse.usage.completion_tokens || 0,
                  totalTokens: result.aiResponse.usage.total_tokens || 0,
                  model: result.aiResponse.model || "gpt-4",
                  timestamp: result.aiResponse.timestamp,
                  responseTime: responseTime,
                }
                setAiMetrics(metrics)
              }

              toast({
                title: "AI Response Generated",
                description: "View the complete AI response. Plans may need manual parsing.",
              })
            }
          } else {
            setShowClientDataPopup(true)
            const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || "Client"
            toast({
              title: "Client Data Retrieved",
              description: `Showing data for ${clientName}`,
            })
          }
        } else {
          console.warn("⚠️ Success reported but no client data in response")
          toast({
            title: "Client Data Retrieved",
            description: result.message,
          })
        }
      } else {
        console.log("❌ FAILURE - Data retrieval failed")
        console.log("💬 Error Message:", result.message)

        // Capture debug data for failures
        if (result.debugData) {
          setDebugData(result.debugData)
          setShowDebugPopup(true)
        }

        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("💥 EXCEPTION CAUGHT in handleGenerateAIPlans:")
      console.error("  - Error Type:", typeof err)
      console.error("  - Error:", err)
      console.error("  - Stack:", err instanceof Error ? err.stack : "No stack")

      toast({
        title: "Error",
        description: "Something went wrong while fetching client data.",
        variant: "destructive",
      })
    } finally {
      console.log("🏁 Process completed - Resetting loading state")
      setIsGeneratingAI(false)
    }
  }

  const renderEditableCell = (
    workout: any,
    field: string,
    type: "text" | "number" | "select" | "textarea" = "text",
  ) => {
    const isEditing = editingCell?.id === workout.id && editingCell?.field === field
    const value = workout[field]

    if (isEditing) {
      if (type === "select") {
        const options = field === "day" ? days : weightOptions
        return (
          <div className="flex items-center gap-1">
            <Select
              value={String(editValue)}
              onValueChange={setEditValue}
              onOpenChange={(open) => !open && handleSave()}
            >
              <SelectTrigger className="h-6 min-w-[70px] text-xs border-0 p-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs border-0 p-1"
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-4 w-4 p-0">
              <Save className="h-2 w-2" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-4 w-4 p-0">
              <X className="h-2 w-2" />
            </Button>
          </div>
        </div>
      )
    }

    const cellContent = () => {
      if (field === "day") {
        return (
          <Badge className={`${getDayColor(String(value))} font-medium cursor-pointer text-xs px-1 py-0.5 border-0`}>
            {String(value).slice(0, 3)}
          </Badge>
        )
      }
      if (field === "exercise") {
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm">{workout.icon || "💪"}</span>
            <span className="cursor-pointer hover:text-blue-600 font-medium text-xs text-gray-800 truncate">
              {String(value)}
            </span>
          </div>
        )
      }
      return <span className="cursor-pointer hover:text-blue-600 text-xs text-gray-700 truncate">{String(value)}</span>
    }

    return (
      <div
        onClick={() => handleCellClick(workout, field)}
        className="cursor-pointer hover:bg-blue-50 rounded transition-all duration-200 hover:shadow-sm w-full p-0.5"
        title="Click to edit"
      >
        {cellContent()}
      </div>
    )
  }

  // Sort workouts by day
  const sortedWorkouts = [...allWorkoutPlans].sort((a, b) => {
    const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
    return (dayOrder[a.day as keyof typeof dayOrder] || 8) - (dayOrder[b.day as keyof typeof dayOrder] || 8)
  })

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const handleDragOver = (e: any) => {
    e.preventDefault()
  }

  const handleDrop = (e: any, day: any) => {
    e.preventDefault()
    const planData = JSON.parse(e.dataTransfer.getData("application/json"))
    setWeeklyPlan((prev) => ({
      ...prev,
      [day]: planData,
    }))
  }

  const removeFromCalendar = (day: any) => {
    setWeeklyPlan((prev) => {
      const newPlan = { ...prev }
      delete newPlan[day]
      return newPlan
    })
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Weekly Schedule */}
      <div className="col-span-8 flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Schedule</h3>
            </div>
            <Badge variant="outline" className="text-sm">
              {Object.keys(weeklyPlan).length} days scheduled
            </Badge>
          </div>
        </div>

        {/* Calendar Grid - Simple version for now */}
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="min-h-0">
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-20 pb-3 mb-3">
                <h4 className="text-sm font-bold text-center text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {day}
                </h4>
              </div>
              <div
                className="space-y-3 min-h-[200px] p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {scheduledWorkouts[index]?.length === 0 && (
                  <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-8 flex flex-col items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-gray-300" />
                    <span>Drop workout here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout Plans */}
      <div className="col-span-4 flex flex-col h-full">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-6 w-6 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout Plans</h3>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNewWorkout} size="sm" variant="outline" className="text-sm font-medium flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
            <Button
              onClick={handleGenerateAIPlans}
              disabled={isGeneratingAI}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-medium flex-1"
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <div className="mr-2">🤖</div>
                  Generate AI Plan
                </>
              )}
            </Button>
            {debugData && (
              <Button
                onClick={() => setShowDebugPopup(true)}
                size="sm"
                variant="outline"
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                title="View AI Debug Data"
              >
                <Bug className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 h-full flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden">
                {sortedWorkouts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <Dumbbell className="h-16 w-16 text-gray-300 mb-4" />
                    <div className="text-center">
                      <p className="text-lg font-medium mb-2">No workout exercises yet</p>
                      <p className="text-sm">Click "Generate AI Plan" or "Add Exercise" to get started</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                        <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                          <TableHead className="font-bold text-xs w-[60px] text-center p-2">Day</TableHead>
                          <TableHead className="font-bold text-xs min-w-[140px] p-2">Exercise</TableHead>
                          <TableHead className="font-bold text-xs w-[50px] text-center p-2">Sets</TableHead>
                          <TableHead className="font-bold text-xs w-[60px] text-center p-2">Reps</TableHead>
                          <TableHead className="font-bold text-xs w-[50px] text-center p-2">Del</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedWorkouts.map((workout) => (
                          <TableRow
                            key={workout.id}
                            className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group border-b border-gray-100 dark:border-gray-800"
                          >
                            <TableCell className="py-2 px-2">{renderEditableCell(workout, "day", "select")}</TableCell>
                            <TableCell className="py-2 px-2">
                              {renderEditableCell(workout, "exercise", "text")}
                            </TableCell>
                            <TableCell className="py-2 px-2 text-center">
                              {renderEditableCell(workout, "sets", "number")}
                            </TableCell>
                            <TableCell className="py-2 px-2 text-center">
                              {renderEditableCell(workout, "reps", "text")}
                            </TableCell>
                            <TableCell className="py-2 px-2 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteWorkout(workout.id)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 rounded-full"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Popups */}
      <ClientDataPopup
        isOpen={showClientDataPopup}
        onClose={() => setShowClientDataPopup(false)}
        clientInfo={clientInfo}
      />

      <AIResponsePopup
        isOpen={showAIResponsePopup}
        onClose={() => setShowAIResponsePopup(false)}
        aiResponse={aiResponse}
        clientName={clientInfo?.name || clientInfo?.preferredName}
        onShowMetrics={() => {
          setShowAIResponsePopup(false)
          setShowAIMetricsPopup(true)
        }}
      />

      <AIMetricsPopup
        isOpen={showAIMetricsPopup}
        onClose={() => setShowAIMetricsPopup(false)}
        metrics={aiMetrics}
        clientName={clientInfo?.name || clientInfo?.preferredName}
      />

      <AIDebugPopup
        isOpen={showDebugPopup}
        onClose={() => setShowDebugPopup(false)}
        rawResponse={debugData?.rawResponse}
        parsedData={debugData?.parsedData || []}
        clientName={clientInfo?.name || clientInfo?.preferredName}
      />
    </div>
  )
}

export default WorkoutPlanSection 