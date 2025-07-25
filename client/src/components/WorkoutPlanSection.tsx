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
import { Clock, Dumbbell, Target, Bug, Sparkles, BarChart3, Edit, PieChart, Save, Trash2, Plus, Cpu, Brain, FileText, Utensils } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan"
import AIDebugPopup from "@/components/AIDebugPopup"
import FitnessPlanOverview from "@/components/FitnessPlanOverview"
import { SidePopup } from "@/components/ui/side-popup"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "./overview/TrainingPreferencesSection"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { WorkoutPlanTable } from './WorkoutPlanTable';

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

interface WeekDay {
  date: string
  dayName: string
  workouts: any[]
}

interface WeeklyWorkoutPlan {
  weekDates: WeekDay[]
  allWorkouts: any[]
  hasAnyWorkouts: boolean
  planStartDate: string
  planEndDate: string
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
  client?: any;
  lastAIRecommendation?: any;
  trainerNotes?: string;
  setTrainerNotes?: (notes: string) => void;
  handleSaveTrainerNotes?: () => void;
  isSavingNotes?: boolean;
  isEditingNotes?: boolean;
  setIsEditingNotes?: (editing: boolean) => void;
  notesDraft?: string;
  setNotesDraft?: (draft: string) => void;
  notesError?: string | null;
  setNotesError?: (error: string | null) => void;
  isGeneratingAnalysis?: boolean;
  handleSummarizeNotes?: () => void;
  isSummarizingNotes?: boolean;
}

const WorkoutPlanSection = ({
  clientId,
  client,
  ...props
}: WorkoutPlanSectionProps) => {
  const { toast } = useToast();
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date());
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showFitnessGoals, setShowFitnessGoals] = useState(false);
  const [showAICoachInsights, setShowAICoachInsights] = useState(false);
  const [showTrainerNotes, setShowTrainerNotes] = useState(false);
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false);
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false);

  // Ensure clientId is a number and not undefined
  const numericClientId = clientId ? (typeof clientId === 'string' ? parseInt(clientId) : clientId) : 0;

  // Fetch workout plan for client and date
  useEffect(() => {
    setAiError(null); // Clear AI error on new fetch
    if (numericClientId) {
      const fetchPlan = async () => {
        setIsFetchingPlan(true);
        setWorkoutPlan(null);
        
        console.log('📅 Fetching workout plan for 7 days starting from:', format(planStartDate, 'yyyy-MM-dd'));
        
        // Calculate end date (6 days after start date for a full 7-day week)
        const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const { data, error } = await supabase
          .from('schedule')
          .select('*')
          .eq('client_id', numericClientId)
          .eq('type', 'workout')
          .gte('for_date', format(planStartDate, 'yyyy-MM-dd'))
          .lte('for_date', format(endDate, 'yyyy-MM-dd'))
          .order('for_date', { ascending: true });
          
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          setWorkoutPlan(null);
        } else {
          // Create a 7-day structure with all dates, even if no workouts exist for some days
          const weekDates = [];
          for (let i = 0; i < 7; i++) {
            const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
            weekDates.push({
              date: format(currentDate, 'yyyy-MM-dd'),
              dayName: format(currentDate, 'EEEE'),
              workouts: data?.filter(workout => workout.for_date === format(currentDate, 'yyyy-MM-dd')) || []
            });
          }
          
          console.log('📊 7-day workout plan structure:', weekDates);
          
          // Always set the workout plan - either with data or empty structure
          setWorkoutPlan({
            weekDates,
            allWorkouts: data || [],
            hasAnyWorkouts: data && data.length > 0,
            planStartDate: format(planStartDate, 'yyyy-MM-dd'),
            planEndDate: format(endDate, 'yyyy-MM-dd')
          });
        }
        
        setIsFetchingPlan(false);
      };
      fetchPlan();
    }
  }, [numericClientId, planStartDate]);

  // AI generation handler
  const handleGeneratePlan = async () => {
    setAiError(null); // Clear previous error
    if (!numericClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateAIWorkoutPlanForReview(numericClientId);
      if (result.success) {
        toast({ title: 'AI Plan Generated', description: 'The new plan is ready for review.' });
        
        // Convert AI plan structure to WeeklyWorkoutPlan format
        const aiWorkoutPlan = result.workoutPlan;
        const workoutExercises = aiWorkoutPlan.workout_plan || [];
        
        // Create 7-day structure with AI workouts
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          weekDates.push({
            date: dateStr,
            dayName: format(currentDate, 'EEEE'),
            workouts: workoutExercises.filter((workout: any) => workout.for_date === dateStr) || []
          });
        }
        
        // Convert workout exercises to the format expected by WorkoutPlanTable
        const convertedWorkouts = workoutExercises.map((workout: any, index: number) => ({
          id: `new-${new Date().getTime()}-${index}`,
          workout: workout.workout || workout.exercise_name,
          summary: workout.workout || workout.exercise_name,
          category: workout.category,
          body_part: workout.body_part,
          sets: workout.sets,
          reps: workout.reps,
          duration: workout.duration,
          weights: workout.weights,
          equipment: workout.equipment,
          for_date: workout.for_date,
          coach_tip: workout.coach_tip,
          icon: workout.icon,
          details_json: {
            category: workout.category,
            body_part: workout.body_part,
            main_workout: [{
              exercise_name: workout.workout || workout.exercise_name,
              sets: workout.sets,
              reps: workout.reps,
              duration: workout.duration,
              weight: workout.weights,
              equipment: workout.equipment,
              coach_tip: workout.coach_tip,
              other_details: ''
            }]
          }
        }));
        
        setWorkoutPlan({
          weekDates,
          allWorkouts: convertedWorkouts,
          hasAnyWorkouts: convertedWorkouts.length > 0,
          planStartDate: format(planStartDate, 'yyyy-MM-dd'),
          planEndDate: format(new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        });
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error: any) {
      setAiError('AI response was invalid or could not be parsed. Please try again or check the console for details.');
      console.error('Full AI response error:', error);
      toast({ title: 'AI Generation Failed', description: error.message || 'Could not generate workout plan.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} />
      </div>

      {/* Date Picker at the top */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="grid gap-2 w-full sm:w-auto">
          <Label htmlFor="date-select">Plan Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(planStartDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={planStartDate}
                onSelect={(date) => date && setPlanStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="ml-auto pt-4 sm:pt-0">
          <Button onClick={handleGeneratePlan} disabled={isGenerating || !numericClientId}>
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate with AI"
            )}
          </Button>
        </div>
      </div>
      {/* Plan Table or Empty State */}
      <div>
        {aiError && (
          <Card className="flex flex-col items-center justify-center h-32 text-center bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-700">AI Response Error</h3>
            <p className="text-red-600 mt-2">{aiError}</p>
          </Card>
        )}
        {isFetchingPlan ? (
          <Card className="flex items-center justify-center h-64">
            <span>Loading workout plan...</span>
          </Card>
        ) : workoutPlan ? (
          <div className="space-y-4">
            {/* 7-Day Overview Header */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">
                7-Day Workout Plan: {format(planStartDate, "MMM d")} - {format(new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
              </h3>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {workoutPlan.weekDates?.map((day: WeekDay, index: number) => (
                  <div key={day.date} className={`p-2 rounded text-center ${
                    day.workouts.length > 0 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    <div className="font-medium">{day.dayName}</div>
                    <div className="text-xs">{format(new Date(day.date), "MMM d")}</div>
                    <div className="text-xs mt-1">
                      {day.workouts.length > 0 
                        ? `${day.workouts.length} exercise${day.workouts.length > 1 ? 's' : ''}` 
                        : 'Rest day'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Workout Plan Table */}
            {workoutPlan.hasAnyWorkouts ? (
              <WorkoutPlanTable 
                initialPlanData={workoutPlan.allWorkouts} 
                clientId={numericClientId} 
              />
            ) : (
              <Card className="flex flex-col items-center justify-center h-32 text-center">
                <h3 className="text-lg font-semibold">No Workout Plans Available</h3>
                <p className="text-muted-foreground mt-2">
                  No workout plans found for the week of {format(planStartDate, "MMM d, yyyy")}
                </p>
                <Button onClick={handleGeneratePlan} disabled={isGenerating} className="mt-4">
                  {isGenerating ? 'Generating...' : 'Generate a new plan with AI'}
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-semibold">Select a Date to View Workout Plan</h3>
            <p className="text-muted-foreground mt-2">Choose a start date to view the 7-day workout plan.</p>
          </Card>
        )}
      </div>

      {/* Side Popups */}
      <SidePopup
        isOpen={showFitnessGoals}
        onClose={() => setShowFitnessGoals(false)}
        title="Fitness Goals"
        icon={<Target className="h-5 w-5 text-white" />}
      >
        <FitnessGoalsSection client={client} onGoalsSaved={() => {}} />
      </SidePopup>

      <SidePopup
        isOpen={showAICoachInsights}
        onClose={() => setShowAICoachInsights(false)}
        title="AI Coach Insights"
        icon={<Brain className="h-5 w-5 text-white" />}
      >
        <AICoachInsightsSection 
          lastAIRecommendation={props.lastAIRecommendation}
          onViewFullAnalysis={() => {}}
        />
      </SidePopup>

      <SidePopup
        isOpen={showTrainerNotes}
        onClose={() => setShowTrainerNotes(false)}
        title="Trainer Notes"
        icon={<FileText className="h-5 w-5 text-white" />}
      >
        <TrainerNotesSection 
          client={client}
          trainerNotes={props.trainerNotes || ""}
          setTrainerNotes={props.setTrainerNotes || (() => {})}
          handleSaveTrainerNotes={props.handleSaveTrainerNotes || (() => {})}
          isSavingNotes={props.isSavingNotes || false}
          isEditingNotes={props.isEditingNotes || false}
          setIsEditingNotes={props.setIsEditingNotes || (() => {})}
          notesDraft={props.notesDraft || ""}
          setNotesDraft={props.setNotesDraft || (() => {})}
          notesError={props.notesError || null}
          setNotesError={props.setNotesError || (() => {})}
          isGeneratingAnalysis={props.isGeneratingAnalysis || false}
          handleSummarizeNotes={props.handleSummarizeNotes || (() => {})}
          isSummarizingNotes={props.isSummarizingNotes || false}
          lastAIRecommendation={props.lastAIRecommendation}
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
  );
};

export default WorkoutPlanSection; 