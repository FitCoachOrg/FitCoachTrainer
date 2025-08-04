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
import { Clock, Dumbbell, Target, Bug, Sparkles, BarChart3, Edit, PieChart, Save, Trash2, Plus, Cpu, Brain, FileText, Utensils, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan"
import { checkProviderHealth, getCurrentProvider } from "@/lib/llm-service"
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
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for universal UUID generation

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

// 1. Update WeeklyWorkoutPlan and WeekDay interfaces to match new schema
interface WeekDay {
  date: string;
  focus: string;
  exercises: any[];
}

interface WeeklyWorkoutPlan {
  week: WeekDay[];
  hasAnyWorkouts: boolean;
  planStartDate: string;
  planEndDate: string;
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
                sets: String(workout.sets ?? '3'),
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
      sets: "3", // string
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

// --- Comprehensive Normalization function for all AI models ---
function normalizeExercise(ex: any): any {
  // Handle all possible variations of property names from different AI models
  const normalized = {
    // Exercise name variations
    exercise: ex.exercise || ex.exercise_name || ex.name || ex.workout || ex.title || '',
    
    // Category variations
    category: ex.category || ex.type || ex.exercise_type || ex.workout_type || '',
    
    // Body part variations
    body_part: ex.body_part || ex.bodyPart || ex.body_parts || ex.target_area || ex.muscle_group || '',
    
    // Sets variations
    sets: String(ex.sets ?? ex.set_count ?? ex.number_of_sets ?? ''),
    
    // Reps variations
    reps: ex.reps ?? ex.repetitions ?? ex.rep_count ?? ex.number_of_reps ?? '',
    
    // Duration variations
    duration: ex.duration ?? ex.time ?? ex.exercise_duration ?? ex.minutes ?? '',
    
    // Weight variations
    weight: ex.weight ?? ex.weights ?? ex.weight_amount ?? ex.load ?? ex.resistance ?? '',
    
    // Equipment variations
    equipment: ex.equipment ?? ex.equipment_needed ?? ex.tools ?? ex.machines ?? '',
    
    // Coach tip variations
    coach_tip: ex.coach_tip ?? ex.tips ?? ex.tip ?? ex.instruction ?? ex.notes ?? ex.cue ?? '',
    
    // Rest variations
    rest: ex.rest ?? ex.rest_time ?? ex.rest_period ?? ex.rest_duration ?? '',
    
    // Video link variations
    video_link: ex.video_link ?? ex.videoLink ?? ex.video_url ?? ex.video ?? ex.link ?? '',
    
    // Preserve any other properties that might be useful
    ...ex
  };
  
  // Ensure all required fields have fallback values
  return {
    ...normalized,
    exercise: normalized.exercise || 'Unknown Exercise',
    category: normalized.category || 'Strength',
    body_part: normalized.body_part || 'Full Body',
    sets: normalized.sets || '3',
    reps: normalized.reps || '10',
    duration: normalized.duration || '15',
    weight: normalized.weight || 'Bodyweight',
    equipment: normalized.equipment || 'None',
    coach_tip: normalized.coach_tip || 'Focus on proper form',
    rest: normalized.rest || '60',
    video_link: normalized.video_link || ''
  };
}
// ---

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

// Helper to build the payload for schedule_preview
function buildSchedulePreviewRows(planWeek: WeekDay[], clientId: number, for_time: string, workout_id: string) {
  return planWeek.map((day) => ({
    client_id: clientId,
    type: 'workout',
    task: 'workout',
    icon: 'dumbell',
    summary: day.focus,
    for_date: day.date, // Ensure this is a string in YYYY-MM-DD format
    for_time, // Ensure this is a string in HH:MM:SS or HH:MM:SS+TZ format
    workout_id, // Always a valid UUID
    details_json: {
      focus: day.focus,
      exercises: (day.exercises || []).map((ex: any, idx: number) => ({
        exercise: String(ex.exercise || ex.exercise_name || ex.name || ex.workout || ''),
        body_part: String(ex.body_part || 'Full Body'),
        sets: String(ex.sets || '3'),
        reps: String(ex.reps || '10'),
        rest: String(ex.rest || ex.rest_sec || '60'),
        weight: String(ex.weight || ex.weights || 'Bodyweight'),
        duration: String(ex.duration || ex.duration_sec || '15'),
        equipment: String(ex.equipment || 'None'),
        coach_tip: String(ex.coach_tip || 'Focus on proper form'),
        video_link: String(ex.video_link || ex.youtube_video_id || ''),
        tempo: String(ex.tempo || ''),
        order: idx + 1
      }))
    },
    is_approved: false
  }));
}

// Add approvePlan implementation to copy from schedule_preview to schedule
async function approvePlan(clientId: number, planStartDate: Date) {
  try {
    // 1. Get the week range
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // 2. Fetch all rows from schedule_preview for this client/week/type
    const { data: previewRows, error: fetchError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    if (fetchError) {
      console.error('[approvePlan] Error fetching from schedule_preview:', fetchError);
      return { success: false, error: fetchError.message };
    }
    if (!previewRows || previewRows.length === 0) {
      return { success: false, error: 'No draft plan found to approve.' };
    }

    // 3. Delete any existing rows in schedule for this client/week/type
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    if (deleteError) {
      console.error('[approvePlan] Error deleting old schedule rows:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // 4. Insert the preview rows into schedule (remove id, created_at, is_approved fields)
    const rowsToInsert = previewRows.map(({ id, created_at, is_approved, ...rest }) => rest);
    const { error: insertError } = await supabase
      .from('schedule')
      .insert(rowsToInsert);
    if (insertError) {
      console.error('[approvePlan] Error inserting into schedule:', insertError);
      return { success: false, error: insertError.message };
    }
    // After successful insert, set is_approved=true for all affected days in schedule_preview
    try {
      await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
    } catch (updateErr) {
      console.warn('[approvePlan] Warning: Could not update is_approved to true after approval.', updateErr);
    }
    return { success: true };
  } catch (err: any) {
    console.error('[approvePlan] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

// Helper to save plan to schedule_preview
async function savePlanToSchedulePreview(planWeek: WeekDay[], clientId: number, planStartDate: Date) {
  console.log('[savePlanToSchedulePreview] Initiating save.', { clientId, planWeek });
  try {
    // Fetch client's preferred workout_time. Fallback to a default if not set.
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('workout_time')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('[savePlanToSchedulePreview] Error fetching client workout time:', clientError);
    }
    const for_time = clientData?.workout_time || '08:00:00';
    console.log(`[savePlanToSchedulePreview] Using workout time: ${for_time}`);

    // Always use a valid UUID for workout_id
    const workout_id = uuidv4();

    // Build the payload using the helper
    const rows = buildSchedulePreviewRows(planWeek, clientId, for_time, workout_id);
    // Log the outgoing payload for debugging
    console.log('[savePlanToSchedulePreview] Prepared rows for database (payload):', JSON.stringify(rows, null, 2));

    // Delete any existing preview for this client and week
    const firstDate = planWeek[0]?.date;
    const lastDate = planWeek[planWeek.length - 1]?.date;
    if (!firstDate || !lastDate) {
      console.error('[savePlanToSchedulePreview] Invalid date range in planWeek.', {firstDate, lastDate});
      return { success: false, error: 'Invalid date range' };
    }
    
    console.log(`[savePlanToSchedulePreview] Deleting existing preview for client ${clientId} between ${firstDate} and ${lastDate}`);
    const { error: deleteError } = await supabase
      .from('schedule_preview')
      .delete()
      .eq('client_id', clientId)
      .gte('for_date', firstDate)
      .lte('for_date', lastDate);

    if (deleteError) {
      console.error('[savePlanToSchedulePreview] Error deleting old preview:', deleteError);
      // Don't stop; try to insert anyway, as it might be a non-critical issue (e.g., nothing to delete)
    } else {
      console.log('[savePlanToSchedulePreview] Successfully deleted old preview entries.');
    }

    // Insert new rows
    console.log('[savePlanToSchedulePreview] Inserting new rows into schedule_preview.');
    const { error, data } = await supabase
      .from('schedule_preview')
      .insert(rows)
      .select(); // Use .select() to get the inserted data back

    if (error) {
      console.error('[savePlanToSchedulePreview] CRITICAL: Error saving to schedule_preview:', error);
      return { success: false, error };
    }
    // After insert, ensure all rows for this client/week are set to is_approved: false (in case of partial updates)
    try {
      await supabase
        .from('schedule_preview')
        .update({ is_approved: false })
        .eq('client_id', clientId)
        .gte('for_date', firstDate)
        .lte('for_date', lastDate);
    } catch (updateErr) {
      console.warn('[savePlanToSchedulePreview] Warning: Could not update is_approved to false after insert.', updateErr);
    }
    
    console.log('[savePlanToSchedulePreview] SUCCESS: Successfully inserted to schedule_preview. Rows inserted:', data?.length);
    return { success: true, data };
  } catch (err: any) {
    console.error('[savePlanToSchedulePreview] CATCH BLOCK: An unexpected error occurred:', err);
    return { success: false, error: err.message };
  }
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
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showFitnessGoals, setShowFitnessGoals] = useState(false);
  const [showAICoachInsights, setShowAICoachInsights] = useState(false);
  const [showTrainerNotes, setShowTrainerNotes] = useState(false);
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false);
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false);
  const [hasAIGeneratedPlan, setHasAIGeneratedPlan] = useState(false); // Add this flag
  const [isDraftPlan, setIsDraftPlan] = useState(false); // Indicates if plan is from preview (draft)
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [planApprovalStatus, setPlanApprovalStatus] = useState<'approved' | 'partial_approved' | 'pending'>('pending');

  // Ensure clientId is a number and not undefined
  const numericClientId = clientId ? (typeof clientId === 'string' ? parseInt(clientId) : clientId) : 0;

  const fetchPlan = async () => {
    console.log('[WorkoutPlanSection] fetchPlan triggered.');
    if (!numericClientId) {
      console.log('[WorkoutPlanSection] No numericClientId, aborting fetch.');
      return;
    }

    setIsFetchingPlan(true);
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    console.log(`[WorkoutPlanSection] Fetching plan for client ${numericClientId} from ${startDateStr} to ${endDateStr}`);

    // 1. Try schedule_preview first
    let { data, error } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr)
      .order('for_date', { ascending: true });
    
    console.log('[WorkoutPlanSection] Fetched from schedule_preview. Data length:', data?.length, 'Error:', error);

    if (data && data.length > 0) {
      setIsDraftPlan(true);
    } else {
      // 2. Fallback to schedule
      console.log('[WorkoutPlanSection] No data in schedule_preview, falling back to schedule.');
      ({ data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', numericClientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr)
        .order('for_date', { ascending: true }));
      setIsDraftPlan(false);
      console.log('[WorkoutPlanSection] Fetched from schedule. Data length:', data?.length, 'Error:', error);
    }
    if (error) {
      toast({ title: 'Error fetching plan', description: error.message, variant: 'destructive' });
      setWorkoutPlan(null);
    } else {
      // Build week structure, ensuring exercises are normalized
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        const dayData = data?.find(workout => workout.for_date === dateStr);
        let planDay = {
            date: dateStr,
            focus: 'Rest Day',
            exercises: []
        };
        if (dayData && dayData.details_json?.exercises) {
            planDay.focus = dayData.summary || 'Workout';
            // Use the comprehensive normalizeExercise function here
            planDay.exercises = dayData.details_json.exercises.map(normalizeExercise);
        }
        weekDates.push(planDay);
      }
      const dbWorkoutPlan = {
        week: weekDates,
        hasAnyWorkouts: weekDates.some(day => day.exercises && day.exercises.length > 0),
        planStartDate: startDateStr,
        planEndDate: endDateStr
      };
      setWorkoutPlan(dbWorkoutPlan);
      console.log('[WorkoutPlanSection] Successfully processed and set workout plan:', dbWorkoutPlan);
    }
    setIsFetchingPlan(false);
  };

  // Debounced save function for autosaving inline edits
  const debouncedSave = debounce(async (updatedPlan: WeekDay[]) => {
    console.log('[WorkoutPlanSection] Debounced save triggered with updated plan:', updatedPlan);
    setIsSavingEdits(true);
    const result = await savePlanToSchedulePreview(updatedPlan, numericClientId, planStartDate);
    setIsSavingEdits(false);
    if (result.success) {
      toast({ title: 'Changes saved', description: 'Your edits have been saved to the draft.' });
      // DO NOT REFETCH HERE. The local state is the source of truth during editing.
      // fetchPlan(); 
    } else {
      toast({ title: 'Save Failed', description: 'Could not save changes.', variant: 'destructive' });
    }
  }, 1500); // 1.5-second debounce delay

  const handlePlanChange = (updatedWeek: WeekDay[]) => {
    console.log('[WorkoutPlanSection] handlePlanChange received updated week:', updatedWeek);
    // Update the state immediately for a responsive UI
    setWorkoutPlan(currentPlan => {
      if (!currentPlan) return null;
      return { ...currentPlan, week: updatedWeek };
    });
    // Trigger the debounced save
    debouncedSave(updatedWeek);
  };

  // Fetch workout plan for client and date
  useEffect(() => {
    if (hasAIGeneratedPlan) {
      console.log('[WorkoutPlanSection] Skipping database fetch because AI-generated plan is active.');
      return;
    }
    fetchPlan();
  }, [numericClientId, planStartDate, hasAIGeneratedPlan]);

  // Reset AI generated plan flag when client changes
  useEffect(() => {
    setHasAIGeneratedPlan(false);
  }, [numericClientId]);

  // Clear workout plan when client changes (but not when we have AI data)
  useEffect(() => {
    if (!hasAIGeneratedPlan) {
      console.log('🗑️ Clearing workout plan due to client change');
      setWorkoutPlan(null);
    }
  }, [numericClientId, hasAIGeneratedPlan]);

  // AI generation handler
  const handleGeneratePlan = async () => {
    setAiError(null); // Clear previous error
    if (!numericClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client.', variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    setCurrentModel('Checking provider health...');
    setRetryCount(0);
    
    try {
      // Check LLM provider health before making request
      const currentProvider = getCurrentProvider();
      const isHealthy = await checkProviderHealth(currentProvider);
      
      if (!isHealthy) {
        setCurrentModel('Provider unavailable');
        throw new Error(`LLM provider (${currentProvider}) is not available. Please check your configuration in the Admin panel.`);
      }
      
      setCurrentModel('Using selected provider');
      let result;
      let lastError = null;
      
      // Use the unified LLM service with the selected provider's default model
      try {
        result = await generateAIWorkoutPlanForReview(numericClientId);
        setCurrentModel('Success');
      } catch (err) {
        lastError = err;
        throw err;
      }
      if (!result) throw lastError;
      if (result.success) {
        toast({ title: 'AI Plan Generated', description: 'The new plan is ready for review.' });
        const aiWorkoutPlan = result.workoutPlan;
        const aiDays = aiWorkoutPlan.days || [];
        
        console.log('🔍 === DEBUGGING AI RESPONSE MAPPING ===');
        console.log('🔍 AI Workout Plan:', aiWorkoutPlan);
        console.log('🔍 AI Days:', aiDays);
        console.log('🔍 First day sample:', aiDays[0]);
        console.log('🔍 First day exercises:', aiDays[0]?.exercises);
        console.log('🔍 First exercise sample:', aiDays[0]?.exercises?.[0]);
        
        // Build week array starting from planStartDate, assigning each LLM day to a date
        const week = [];
        for (let i = 0; i < aiDays.length; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          const normalizedExercises = (aiDays[i].exercises || []).map(normalizeExercise);
          console.log(`🔍 Day ${i} exercises before normalization:`, aiDays[i].exercises);
          console.log(`🔍 Day ${i} exercises after normalization:`, normalizedExercises);
          
          week.push({
            date: dateStr,
            focus: aiDays[i].focus,
            exercises: normalizedExercises,
          });
        }
        
        console.log('🔍 Final week structure:', week);
        console.log('🔍 First week day sample:', week[0]);
        console.log('🔍 First week day exercises:', week[0]?.exercises);
        
        const newWorkoutPlan = {
          week,
          hasAnyWorkouts: week.some((day: WeekDay) => day.exercises && day.exercises.length > 0),
          planStartDate: week[0]?.date || '',
          planEndDate: week[week.length - 1]?.date || ''
        };
        console.log('✅ Setting AI-generated workout plan:', newWorkoutPlan);
        setWorkoutPlan(newWorkoutPlan);
        if (week.length > 0) {
          setPlanStartDate(new Date(week[0].date));
        }
        setHasAIGeneratedPlan(true); // Mark that AI generated data is now available
        // Immediately save to schedule_preview
        console.log('[DEBUG] Calling savePlanToSchedulePreview...');
        const saveResult = await savePlanToSchedulePreview(week, numericClientId, planStartDate);
        if (!saveResult.success) {
          toast({ title: 'Error', description: 'Failed to save plan to schedule_preview.', variant: 'destructive' });
        } else {
          setIsDraftPlan(true);
        }
        // Refresh approval status after generating and saving plan
        await checkPlanApprovalStatus();
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error: any) {
      setAiError('AI response was invalid or could not be parsed. Please try again or check the console for details.');
      console.error('Full AI response error:', error);
      toast({ title: 'AI Generation Failed', description: error.message || 'Could not generate workout plan.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
      setCurrentModel(null);
      setRetryCount(0);
    }
  };

  // Helper to check approval status for the week
  const checkPlanApprovalStatus = async () => {
    if (!numericClientId || !planStartDate) return;
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    // Fetch is_approved for all days in schedule_preview
    const { data, error } = await supabase
      .from('schedule_preview')
      .select('for_date, is_approved')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    if (error || !data) {
      setPlanApprovalStatus('pending');
      return;
    }
    // Debug: Log which dates are approved and which are not
    const approvedDates = data.filter((row: any) => row.is_approved === true).map((row: any) => row.for_date);
    const notApprovedDates = data.filter((row: any) => row.is_approved !== true).map((row: any) => row.for_date);
    console.log('[Plan Approval Debug] Approved dates:', approvedDates);
    console.log('[Plan Approval Debug] Not approved dates:', notApprovedDates);
    const total = data.length;
    const approvedCount = approvedDates.length;
    if (total === 0) {
      setPlanApprovalStatus('pending');
    } else if (approvedCount === total) {
      setPlanApprovalStatus('approved');
    } else if (approvedCount > 0) {
      setPlanApprovalStatus('partial_approved');
    } else {
      setPlanApprovalStatus('pending');
    }
  };

  // Re-check approval status whenever plan, client, or date changes
  useEffect(() => {
    checkPlanApprovalStatus();
  }, [numericClientId, planStartDate, workoutPlan]);

  return (
    <div className="space-y-4">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} client={client} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} client={client} />
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
                Generating{currentModel ? ` (${currentModel}${retryCount > 0 ? `, Retry ${retryCount}` : ''})` : '...'}
              </>
            ) : (
              "Generate with AI"
            )}
          </Button>
        </div>
      </div>
      {/* Plan Table or Empty State */}
      <div>
        {/* Show plan source status */}
        {workoutPlan && (
          <div className="mb-2 flex items-center gap-4">
            {/* Status badge based on is_approved values - Updated to match Nutrition Plan UI */}
            {planApprovalStatus === 'approved' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-300 dark:border-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ✅ Approved Plan
              </div>
            )}
            {planApprovalStatus === 'partial_approved' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-300 dark:border-yellow-700">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                📝 Partial Approval
              </div>
            )}
            {planApprovalStatus === 'pending' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-300 dark:border-yellow-700">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                📝 Draft Plan (Not Approved)
              </div>
            )}
            {/* Approve button for draft plans */}
            {isDraftPlan && (
              <Button
                onClick={async () => {
                  setIsApproving(true);
                  const result = await approvePlan(numericClientId, planStartDate);
                  setIsApproving(false);
                  if (result.success) {
                    toast({ title: 'Plan Approved', description: 'The plan has been moved to production.', variant: 'default' });
                    setIsDraftPlan(false); // UI update: now approved
                    // Refresh approval status after successful approval
                    await checkPlanApprovalStatus();
                  } else {
                    toast({ title: 'Approval Failed', description: 'Could not approve plan.', variant: 'destructive' });
                  }
                }}
                disabled={isApproving}
                className="ml-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isApproving ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Plan
                  </>
                )}
              </Button>
            )}
            </div>
        )}
        {workoutPlan && isDraftPlan && (
          <div className="mb-2 flex items-center gap-4">
            <Button
              onClick={async () => {
                setIsSavingEdits(true);
                const saveResult = await savePlanToSchedulePreview(workoutPlan.week, numericClientId, planStartDate);
                if (saveResult.success) {
                  // Refetch the plan from schedule_preview to ensure UI is up-to-date
                  const startDateStr = format(planStartDate, 'yyyy-MM-dd');
                  const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
                  const endDateStr = format(endDate, 'yyyy-MM-dd');
                  let { data, error } = await supabase
                    .from('schedule_preview')
                    .select('*')
                    .eq('client_id', numericClientId)
                    .eq('type', 'workout')
                    .gte('for_date', startDateStr)
                    .lte('for_date', endDateStr)
                    .order('for_date', { ascending: true });
                  console.log('[Save Changes] Data fetched from schedule_preview after save:', data);
                  if (!error && data) {
                    // Build week structure as before, always mapping from details_json.exercises
                    const weekDates = [];
                    for (let i = 0; i < 7; i++) {
                      const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
                      const dateStr = format(currentDate, 'yyyy-MM-dd');
                      const dayRow = data.find(workout => workout.for_date === dateStr);
                      let exercises = [];
                      let focus = 'Rest Day';
                      if (dayRow && dayRow.details_json && Array.isArray(dayRow.details_json.exercises)) {
                        exercises = dayRow.details_json.exercises;
                        focus = dayRow.summary || 'Workout';
                      }
                      weekDates.push({
                        date: dateStr,
                        focus,
                        exercises
                      });
                    }
                    const dbWorkoutPlan = {
                      week: weekDates,
                      hasAnyWorkouts: weekDates.some(day => day.exercises && day.exercises.length > 0),
                      planStartDate: startDateStr,
                      planEndDate: endDateStr
                    };
                    console.log('[Save Changes] Setting workout plan in UI to:', dbWorkoutPlan);
                    setWorkoutPlan(dbWorkoutPlan);
                    // Refresh approval status after saving changes
                    await checkPlanApprovalStatus();
                  } else {
                    console.warn('[Save Changes] Error or no data after save:', error, data);
                  }
                  toast({ title: 'Changes Saved', description: 'Your edits have been saved to the draft and UI updated.', variant: 'default' });
                } else {
                  toast({ title: 'Save Failed', description: 'Could not save changes to the draft.', variant: 'destructive' });
                }
                setIsSavingEdits(false);
              }}
              disabled={isSavingEdits}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingEdits ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
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
                {workoutPlan.week?.map((day: WeekDay, index: number) => (
                  <div key={day.date} className={`p-2 rounded text-center ${
                    day.exercises.length > 0 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    <div className="font-medium">{day.focus}</div>
                    <div className="text-xs">{format(new Date(day.date), "MMM d")}</div>
                    <div className="text-xs mt-1">
                      {day.exercises.length > 0 
                        ? `${day.exercises.length} exercise${day.exercises.length > 1 ? 's' : ''}` 
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
                week={workoutPlan.week}
                clientId={numericClientId}
                onPlanChange={handlePlanChange}
                planStartDate={planStartDate} // Pass planStartDate as required by WorkoutPlanTable
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