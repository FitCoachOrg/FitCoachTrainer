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
import { Plus, Trash2, Save, X, Clock, Dumbbell, Calendar, Target, Bug } from "lucide-react"

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

const AIResponsePopup = ({ isOpen, onClose, aiResponse, clientName, onShowMetrics }: any) => {
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
  const [parsedResponse, setParsedResponse] = useState<any>(null);

  useEffect(() => {
    if (aiResponse?.response) {
      try {
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setParsedResponse(parsed);
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
      }
    }
  }, [aiResponse]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
              🤖
            </div>
            AI Generated Workout Plan{clientName ? ` for ${clientName}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Your personalized workout plan has been generated using AI. The exercises have been added to your workout list and can be edited as needed.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('formatted')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'formatted'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Formatted View
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Raw JSON
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'formatted' && parsedResponse && (
            <div className="space-y-6">
              {/* Overview */}
              {parsedResponse.overview && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Plan Overview</h3>
                  <p className="text-gray-700 dark:text-gray-300">{parsedResponse.overview}</p>
                </div>
              )}

              {/* Split and Progression */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedResponse.split && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Training Split</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{parsedResponse.split}</p>
                  </div>
                )}
                
                {parsedResponse.progression_model && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Progression Model</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">{parsedResponse.progression_model}</p>
                  </div>
                )}
              </div>

              {/* Weekly Breakdown */}
              {parsedResponse.weekly_breakdown && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Weekly Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(parsedResponse.weekly_breakdown).map(([day, description]: [string, any]) => (
                      <div key={day} className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">{day}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Plan */}
              {parsedResponse.workout_plan && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Exercise Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Exercise</th>
                          <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Sets</th>
                          <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Reps</th>
                          <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Body Part</th>
                          <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Coach Tip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedResponse.workout_plan.map((exercise: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span>{exercise.icon || '💪'}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{exercise.workout}</span>
                              </div>
                            </td>
                            <td className="p-2 text-gray-700 dark:text-gray-300">{exercise.sets}</td>
                            <td className="p-2 text-gray-700 dark:text-gray-300">{exercise.reps}</td>
                            <td className="p-2 text-gray-700 dark:text-gray-300">{exercise.body_part}</td>
                            <td className="p-2 text-gray-600 dark:text-gray-400 text-xs">{exercise.coach_tip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {aiResponse?.response || 'No response data available'}
              </pre>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={onShowMetrics} variant="outline">
              View Metrics
            </Button>
            <Button onClick={onClose}>
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