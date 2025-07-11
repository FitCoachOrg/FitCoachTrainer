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
import { Clock, Dumbbell, Calendar, Target, Bug, Sparkles, BarChart3, Edit, PieChart, Save, Trash2, Plus, Cpu } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan"
import AIDebugPopup from "@/components/AIDebugPopup"
import FitnessPlanOverview from "@/components/FitnessPlanOverview"

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
  day?: string
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
      day: undefined,
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
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Select equipment" />
                                  </SelectTrigger>
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
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Select body part" />
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
                                <Badge variant="outline">{workout.body_part}</Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <Select
                                  value={workout.category}
                                  onValueChange={(value) => handleWorkoutChange(index, "category", value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
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

  // Local LLM generation state
  const [isGeneratingLocalAI, setIsGeneratingLocalAI] = useState(false)
  const [selectedLocalModel, setSelectedLocalModel] = useState("deepseek-r1:latest")
  const [generationTime, setGenerationTime] = useState<number | null>(null)

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

  // Fitness Plan Overview state
  const [planOverviewData, setPlanOverviewData] = useState<any>(null)

  // === Persist last generated AI workout plan to localStorage ===
  // Load on mount
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem("last-ai-workout-plan")
      if (storedPlan) {
        const parsed = JSON.parse(storedPlan)
        if (parsed && typeof parsed === "object") {
          setPlanOverviewData(parsed)
        }
      }
    } catch (err) {
      console.error("Failed to parse stored workout plan:", err)
    }
  }, [])

  // Save whenever planOverviewData changes (but only if it exists)
  useEffect(() => {
    if (planOverviewData) {
      try {
        localStorage.setItem("last-ai-workout-plan", JSON.stringify(planOverviewData))
      } catch (err) {
        console.error("Failed to persist workout plan:", err)
      }
    }
  }, [planOverviewData])
  
  // Function to parse AI response and convert to recommended plans format
  const parseAIResponseToPlans = (aiResponseText: string) => {
    try {
      // Remove any <think>...</think> or similar annotation blocks that DeepSeek may prepend
      let cleaned = aiResponseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()

      // DeepSeek sometimes wraps JSON in ```json ... ``` fences – strip them
      cleaned = cleaned.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, "")).trim()

      // Attempt simple extraction: first '{' to last '}'
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error('Could not locate complete JSON object in AI response')
      }

      const jsonString = cleaned.substring(firstBrace, lastBrace + 1)

      const aiData = JSON.parse(jsonString)

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
          day: exercise.day || null,
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
    console.log("🔒 NEW WORKFLOW: Will generate plan for REVIEW, not auto-save")

    setIsGeneratingAI(true)
    const startTime = Date.now() // Track response time

    try {
      // Use the actual client ID passed as prop, fallback to hardcoded for testing
      const actualClientId = clientId ? Number(clientId) : 34
      console.log("🎯 Using client ID:", actualClientId, clientId ? "(from props)" : "(fallback)")
      console.log("📞 CALLING generateAIWorkoutPlanForReview function...")
      console.log("📞 Function will generate plan for REVIEW, NOT auto-save to database")

      const result = await generateAIWorkoutPlanForReview(actualClientId)
      console.log("📨 === FUNCTION CALL COMPLETED ===")
      console.log("📨 Full result object:", result)
      const responseTime = Date.now() - startTime // Calculate response time

      console.log("📬 Function Response:")
      console.log("  - Success:", result.success)
      console.log("  - Message:", result.message)
      console.log("  - Has Client Data:", !!result.clientData)

      if (result.success) {
        console.log("✅ SUCCESS - AI Plan generated for REVIEW")
        console.log("🔒 Plan is ready for review in FitnessPlanOverview component")

        // Set client info
        if (result.clientInfo) {
          setClientInfo(result.clientInfo)
        }

        // Prepare plan data for overview component
        if (result.workoutPlan) {
          const planData = {
            overview: result.workoutPlan.overview,
            split: result.workoutPlan.split,
            progression_model: result.workoutPlan.progression_model,
            weekly_breakdown: result.workoutPlan.weekly_breakdown,
            workout_plan: result.workoutPlan.workout_plan,
            clientInfo: result.clientInfo,
            generatedAt: result.generatedAt
          }
          
                  console.log("📋 Plan data prepared for overview:", planData)
        setPlanOverviewData(planData)

        const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || "Client"
        
        toast({
          title: "AI Fitness Plan Generated",
          description: `Plan ready for review for ${clientName}. Review and customize before saving.`,
        })
        } else {
          console.warn("⚠️ Success reported but no workout plan in response")
          toast({
            title: "Plan Generation Issue",
            description: result.message || "Plan generated but no workout data found.",
            variant: "destructive",
          })
        }
      } else {
        console.log("❌ FAILURE - Data retrieval failed")
        console.log("💬 Error Message:", result.message)

        // Capture debug data for failures (optional property)
        const errDebugData = (result as any).debugData
        if (errDebugData) {
          setDebugData(errDebugData)
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

  // === NEW: Generate plan using local LLM (qwen) running on http://localhost:11434 ===
  const handleGenerateLocalAIPlans = async () => {
    console.log("🤖 (Local LLM) === WORKOUT PLAN GENERATION STARTED ===")
    setIsGeneratingLocalAI(true)

    const startTime = Date.now()

    try {
      const actualClientId = clientId ? Number(clientId) : 34
      // ---------------------- Fetch client data for richer prompt ----------------------
      let clientPromptInfo = ""
      try {
        const { data: clientRow } = await supabase
          .from("client")
          .select("*")
          .eq("client_id", actualClientId)
          .single()

        if (clientRow) {
          clientPromptInfo = `\nInputs:\nGoal: ${clientRow.cl_primary_goal || 'N/A'}\nSpecific Outcome: ${clientRow.specific_outcome || 'N/A'}\nGoal Deadline: ${clientRow.goal_timeline || 'N/A'}\nConfidence Rating (1–10): ${clientRow.confidence_level || 'N/A'}\nChallenges/Obstacles: ${clientRow.obstacles || 'N/A'}\nTraining Experience: ${clientRow.training_experience || 'Beginner'}\nTraining History (Last 6 Months): ${clientRow.previous_training || 'Unknown'}\nTraining Frequency: ${clientRow.training_days_per_week || '3'}x/week\nSession Duration: ${clientRow.training_time_per_session || '30-45 min'}\nTraining Location: ${clientRow.training_location || 'Home'}\nAvailable Equipment: ${Array.isArray(clientRow.available_equipment) ? clientRow.available_equipment.join(', ') : clientRow.available_equipment || 'Bodyweight only'}\nLimitations/Injuries: ${clientRow.injuries_limitations || 'None'}\nBody Area Focus: ${Array.isArray(clientRow.focus_areas) ? clientRow.focus_areas.join(', ') : clientRow.focus_areas || 'None'}\n\nAdditional Client Information:\nName: ${clientRow.cl_name || clientRow.cl_prefer_name || 'N/A'}\nAge: ${clientRow.cl_age || 'N/A'}\nSex: ${clientRow.cl_sex || 'N/A'}\nHeight: ${clientRow.cl_height || 'N/A'} cm\nCurrent Weight: ${clientRow.cl_weight || 'N/A'} kg\nTarget Weight: ${clientRow.cl_target_weight || 'N/A'} kg\nSleep Hours: ${clientRow.sleep_hours || 'N/A'}\nStress Level: ${clientRow.cl_stress || 'N/A'}\nMotivation Style: ${clientRow.motivation_style || 'N/A'}\n`;
        }
      } catch (e) {
        console.warn("Could not fetch client info for prompt; proceeding with minimal prompt")
      }

      // Comprehensive prompt similar to ChatGPT version
      const prompt = `You are a world-class fitness coach. Based on the inputs below, create a personalized, evidence-based training program tailored to the client's goals, preferences, and constraints.${clientPromptInfo}\nGuidelines:\nUse the correct training philosophy based on the goal and training age.\nChoose appropriate progression models (linear, undulating, or block periodization) based on experience and timeline.\nStructure training based on available days and session duration.\nRespect equipment limitations and substitute intelligently.\nAdjust exercises based on injury/limitation info.\nEmphasize specified body areas without neglecting full-body balance.\nInclude progression triggers.\nInsert deload every 4–6 weeks with 40% volume reduction if program spans 8+ weeks.\nIf timeline is <6 weeks, consider a short cycle without deload.\n\nIMPORTANT: Create a complete weekly plan that includes every day of the week (Monday through Sunday). If a day is dedicated for rest, clearly indicate it as a rest day in the weekly_breakdown and include it in the workout_plan array with appropriate rest day information.\n\nOutput Format (in JSON):\n{\n  \"overview\": \"...\",\n  \"split\": \"...\",\n  \"progression_model\": \"...\",\n  \"weekly_breakdown\": {\n    \"Monday\": \"...\",\n    \"Tuesday\": \"...\",\n    \"Wednesday\": \"...\",\n    \"Thursday\": \"...\",\n    \"Friday\": \"...\",\n    \"Saturday\": \"...\",\n    \"Sunday\": \"...\"\n  },\n  \"workout_plan\": [\n    {\n      \"workout\": \"Glute Bridges\",\n      \"day\": \"Monday\",\n      \"sets\": 3,\n      \"reps\": 15,\n      \"duration\": 30,\n      \"weights\": \"bodyweight\",\n      \"for_time\": \"08:00:00\",\n      \"body_part\": \"Glutes\",\n      \"category\": \"Strength\",\n      \"coach_tip\": \"Push through the heels\"\n    },\n    {\n      \"workout\": \"Rest Day\",\n      \"day\": \"Wednesday\",\n      \"sets\": 0,\n      \"reps\": \"N/A\",\n      \"duration\": 0,\n      \"weights\": \"N/A\",\n      \"for_time\": \"00:00:00\",\n      \"body_part\": \"Recovery\",\n      \"category\": \"Rest\",\n      \"coach_tip\": \"Active recovery - light stretching or walking recommended\"\n    }\n  ]\n}\n\nReturn ONLY the JSON object described above — no markdown, no explanations.`

      console.log("📝 (Local LLM) Prompt being sent:", prompt)
      console.log("🤖 (Local LLM) Using model:", selectedLocalModel)
      const requestBody = JSON.stringify({ model: selectedLocalModel, prompt, stream: false, format: "json" })
      console.log("📤 (Local LLM) Request payload:", requestBody)

      console.log("📡 (Local LLM) Sending request to /ollama/api/generate via proxy...")
      const resp = await fetch("/ollama/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody
      })

      if (!resp.ok) {
        throw new Error(`Local LLM request failed: ${resp.status} ${resp.statusText}`)
      }

      console.log("✅ (Local LLM) Response received from server. Status:", resp.status)

      // Since we requested format:"json" and stream:false, the body should be a single JSON object
      const aiText = await resp.text()

      console.log("📥 (Local LLM) Raw AI response content:", aiText)

      let innerJSONText = aiText
      try {
        const outer = JSON.parse(aiText)
        if (outer && typeof outer === 'object' && outer.response) {
          innerJSONText = typeof outer.response === 'string' ? outer.response : JSON.stringify(outer.response)
        }
      } catch (e) {
        console.warn('Could not parse outer wrapper, assuming raw JSON is direct')
      }

      // Re-use existing parser to convert AI text into structured plan(s)
      let generatedPlans: any[] = []
      try {
        generatedPlans = parseAIResponseToPlans(innerJSONText)
        console.log("✨ (Local LLM) Successfully parsed workout plan.", generatedPlans.length, "plans generated.")
      } catch (parseErr) {
        console.error("Failed to parse local AI response:", parseErr)
      }

      if (generatedPlans.length === 0) {
        toast({
          title: "Local AI Generation Failed",
          description: "Could not parse workout plan from local model output.",
          variant: "destructive"
        })
        return
      }

      const firstPlan = generatedPlans[0]
      const planData = {
        overview: "Locally generated workout plan",
        split: "",
        progression_model: "",
        weekly_breakdown: undefined,
        workout_plan: firstPlan.exercises,
        clientInfo: null,
        generatedAt: new Date().toISOString()
      }

      const endTime = Date.now()
      const generationTimeSeconds = (endTime - startTime) / 1000
      
      setPlanOverviewData(planData)
      setGenerationTime(generationTimeSeconds) // Store generation time in seconds

      toast({
        title: "Local AI Plan Ready",
        description: `Generated ${firstPlan.exercises.length} exercises using ${selectedLocalModel} in ${generationTimeSeconds.toFixed(1)}s.`
      })
    } catch (err: any) {
      console.error("💥 Local LLM generation error:", err)
      toast({
        title: "Local LLM Error",
        description: err.message || "Unknown error",
        variant: "destructive"
      })
    } finally {
      const endTime = Date.now()
      console.log("🏁 (Local LLM) WORKOUT PLAN GENERATION COMPLETED in", (endTime - startTime) / 1000, "seconds.")
      setIsGeneratingLocalAI(false)
    }
  }


  return (
    <div className="h-full flex flex-col">
      {/* Workout Plan Overview - Full Width */}
      <div className="flex-1 overflow-hidden">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout Plan Overview</h3>
            </div>
            <div className="flex items-center gap-4">
              {planOverviewData && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {planOverviewData.workout_plan?.length || 0} exercises
                  </Badge>
                  {generationTime && (
                    <Badge variant="secondary" className="text-sm">
                      ⏱️ {generationTime.toFixed(1)}s
                    </Badge>
                  )}
                </div>
              )}
              {/* Cloud / remote generation */}
              <Button
                onClick={handleGenerateAIPlans}
                disabled={isGeneratingAI}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-medium"
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

                            {/* Local LLM Model Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Model:</span>
                <Select value={selectedLocalModel} onValueChange={setSelectedLocalModel}>
                  <SelectTrigger className="w-44 h-9 text-xs">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deepseek-r1:latest">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3 w-3" />
                        <span>DeepSeek R1</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="llama3:8b">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3 w-3" />
                        <span>Llama 3</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="qwen2.5:latest">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-3 w-3" />
                        <span>Qwen 2.5</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Local LLM generation */}
              <Button
                onClick={handleGenerateLocalAIPlans}
                disabled={isGeneratingLocalAI}
                size="sm"
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
              >
                {isGeneratingLocalAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 mr-2" />
                    {selectedLocalModel === "deepseek-r1:latest" ? "DeepSeek Plan" : 
                     selectedLocalModel === "llama3:8b" ? "Llama Plan" :
                     selectedLocalModel === "qwen2.5:latest" ? "Qwen Plan" : "Local LLM Plan"}
                    <span className="ml-1 text-xs opacity-70">
                      ({selectedLocalModel.split(':')[0]})
                    </span>
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
        </div>

        {/* Embedded Fitness Plan Overview */}
        <div className="h-full overflow-hidden">
          {planOverviewData ? (
            <div className="h-full">
              <FitnessPlanOverview
                isOpen={true}
                onClose={() => {}}
                clientId={clientId ? Number(clientId) : 34}
                initialPlanData={planOverviewData}
                embedded={true}
                onPlanSaved={(success, message) => {
                  if (success) {
                    toast({
                      title: "Plan Saved Successfully",
                      description: message,
                    })
                  } else {
                    toast({
                      title: "Failed to Save Plan",
                      description: message,
                      variant: "destructive",
                    })
                  }
                }}
              />
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <div>
                  <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                    No Workout Plan Generated
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Generate an AI workout plan to see the detailed overview here
                  </p>
                  <Button
                    onClick={handleGenerateAIPlans}
                    disabled={isGeneratingAI}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
                </div>
              </CardContent>
            </Card>
          )}
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