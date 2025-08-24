"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Dumbbell, Target, Bug, Sparkles, BarChart3, Edit, PieChart, Save, Trash2, Plus, Cpu, Brain, FileText, Utensils, CheckCircle, CalendarDays, Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

// Import the real AI workout plan generator
import { generateAIWorkoutPlanForReview } from "@/lib/ai-fitness-plan"
import { checkProviderHealth, getCurrentProvider } from "@/lib/llm-service"
import AIDebugPopup from "@/components/AIDebugPopup"
import FitnessPlanOverview from "@/components/FitnessPlanOverview"
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost"
import { type PopupKey } from "@/components/popups/trainer-popups.config"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "./overview/TrainingPreferencesSection"
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkoutPlanTable } from './WorkoutPlanTable';
import WeeklyPlanHeader from './WeeklyPlanHeader';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for universal UUID generation
import WorkoutExportButton from './WorkoutExportButton';
import WorkoutImportButton from './WorkoutImportButton';
import { normalizeDateForStorage, createDateFromString } from '../lib/date-utils';
import { generateSearchBasedWorkoutPlanForReview, warmupExerciseCache } from "@/lib/search-based-workout-plan"
import { SimpleWorkoutGenerator } from "@/lib/simple-workout-generator"
import { EnhancedWorkoutGenerator } from "@/lib/enhanced-workout-generator"

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
  timeBreakdown?: {
    warmup: number;
    exercises: number;
    rest: number;
    cooldown: number;
    total: number;
  };
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
    
    // Sets variations - ensure we preserve the actual value
    sets: ex.sets !== undefined && ex.sets !== null ? String(ex.sets) : String(ex.set_count ?? ex.number_of_sets ?? ''),
    
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
    
    // Enhanced generator specific fields
    timeBreakdown: ex.timeBreakdown || null,
    experience: ex.experience || 'Beginner',
    rpe_target: ex.rpe_target || 'RPE 7-8',
    phase: ex.phase || 1,
    session_id: ex.session_id || '',
    
    // Preserve any other properties that might be useful
    ...ex
  };
  
  // Ensure all required fields have fallback values
  return {
    ...normalized,
    exercise: normalized.exercise || 'Unknown Exercise',
    category: normalized.category || 'Strength',
    body_part: normalized.body_part || 'Full Body',
    sets: normalized.sets && String(normalized.sets).trim() !== '' ? String(normalized.sets) : '3',
    reps: normalized.reps || '10',
    duration: normalized.duration || '15',
    weight: normalized.weight || 'Bodyweight',
    equipment: normalized.equipment || 'None',
    coach_tip: normalized.coach_tip || 'Focus on proper form',
    rest: normalized.rest || '60',
    video_link: normalized.video_link || '',
    experience: normalized.experience || 'Beginner',
    rpe_target: normalized.rpe_target || 'RPE 7-8',
    phase: normalized.phase || 1,
    session_id: normalized.session_id || '',
    timeBreakdown: normalized.timeBreakdown
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
  onDateChange?: (newDate: Date) => void;
}

// Helper to build the payload for schedule_preview
function buildSchedulePreviewRows(planWeek: WeekDay[], clientId: number, for_time: string, workout_id: string) {
  return planWeek.map((day) => ({
    client_id: clientId,
    type: 'workout',
    task: 'workout',
    icon: 'dumbell',
    summary: day.focus,
    for_date: normalizeDateForStorage(day.date), // Normalize date for UTC storage
    for_time, // Ensure this is a string in HH:MM:SS or HH:MM:SS+TZ format
    workout_id, // Always a valid UUID
    details_json: {
      focus: day.focus,
      exercises: (day.exercises || []).map((ex: any, idx: number) => ({
        exercise: String(ex.exercise || ex.exercise_name || ex.name || ex.workout || ''),
        category: String(ex.category || ex.type || ex.exercise_type || ex.workout_type || ''),
        body_part: String(ex.body_part || 'Full Body'),
        sets: ex.sets && ex.sets.toString().trim() !== '' ? String(ex.sets) : '3',
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
    
    // Debug: Check sets values in the payload
    rows.forEach((row, rowIdx) => {
      if (row.details_json && row.details_json.exercises) {
        row.details_json.exercises.forEach((ex: any, exIdx: number) => {
          console.log(`[savePlanToSchedulePreview] Row ${rowIdx}, Exercise ${exIdx} sets value:`, ex.sets);
        });
      }
    });

    // Get the date range for this week
    const firstDate = planWeek[0]?.date;
    const lastDate = planWeek[planWeek.length - 1]?.date;
    if (!firstDate || !lastDate) {
      console.error('[savePlanToSchedulePreview] Invalid date range in planWeek.', {firstDate, lastDate});
      return { success: false, error: 'Invalid date range' };
    }

    // Get existing preview data for this client and week
    const { data: existingData, error: fetchError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', firstDate)
      .lte('for_date', lastDate);

    if (fetchError) {
      console.error('[savePlanToSchedulePreview] Error fetching existing data:', fetchError);
      return { success: false, error: fetchError.message };
    }

    console.log(`[savePlanToSchedulePreview] Found ${existingData?.length || 0} existing records`);

    // Prepare records for insertion and update
    const recordsToInsert: any[] = [];
    const recordsToUpdate: Array<any & { id: number }> = [];

    rows.forEach((newRow) => {
      // Check if record already exists for this date
      const existingRecord = existingData?.find(record => 
        record.for_date === newRow.for_date && 
        record.type === 'workout'
      );

      if (existingRecord) {
        // Update existing record
        recordsToUpdate.push({
          ...newRow,
          id: existingRecord.id
        });
      } else {
        // Insert new record
        recordsToInsert.push(newRow);
      }
    });

    // Update existing records
    if (recordsToUpdate.length > 0) {
      console.log(`[savePlanToSchedulePreview] Updating ${recordsToUpdate.length} existing records`);
      for (const record of recordsToUpdate) {
        const { id, ...updateData } = record;
        const { error: updateError } = await supabase
          .from('schedule_preview')
          .update(updateData)
          .eq('id', id);
        if (updateError) {
          console.error('[savePlanToSchedulePreview] Error updating record:', updateError);
          return { success: false, error: updateError.message };
        }
      }
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      console.log(`[savePlanToSchedulePreview] Inserting ${recordsToInsert.length} new records`);
      const { error: insertError } = await supabase
        .from('schedule_preview')
        .insert(recordsToInsert);
      if (insertError) {
        console.error('[savePlanToSchedulePreview] Error inserting new records:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    // Set is_approved to false for all affected days
    try {
      await supabase
        .from('schedule_preview')
        .update({ is_approved: false })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', firstDate)
        .lte('for_date', lastDate);
    } catch (updateErr) {
      console.warn('[savePlanToSchedulePreview] Warning: Could not update is_approved to false after save.', updateErr);
    }
    
    console.log('[savePlanToSchedulePreview] SUCCESS: Successfully saved to schedule_preview');
    return { success: true };
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
  // Plan start weekday persisted in client table; default Sunday
  const [planStartDay, setPlanStartDay] = useState<string>(client?.plan_start_day || 'Sunday');
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSearch, setIsGeneratingSearch] = useState(false);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<PopupKey | null>(null);
  const [hasAIGeneratedPlan, setHasAIGeneratedPlan] = useState(false); // Add this flag
  const [isDraftPlan, setIsDraftPlan] = useState(false); // Indicates if plan is from preview (draft)
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [planApprovalStatus, setPlanApprovalStatus] = useState<'approved' | 'partial_approved' | 'not_approved' | 'pending'>('pending');

  // Save Plan for Future (template) state
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [templateTagInput, setTemplateTagInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [generatedTemplateJson, setGeneratedTemplateJson] = useState<any | null>(null);
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const { trainer } = useAuth();
  // DnD sensors for reordering the 7-day header boxes
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sortable day box wrapper that preserves the existing UI but makes it draggable
  const SortableDayHeaderBox = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      opacity: isDragging ? 0.8 : 1,
      cursor: 'grab'
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  };

  const handleHeaderDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !workoutPlan) return;
    const activeIndex = parseInt(String(active.id).replace('hdr-', ''), 10);
    const overIndex = parseInt(String(over.id).replace('hdr-', ''), 10);

    // Reorder current week array according to the new order
    const currentWeek = workoutPlan.week || [];
    const reordered = arrayMove(currentWeek, activeIndex, overIndex);

    // Reassign dates sequentially from planStartDate to keep a continuous 7-day block
    const updatedWeek = reordered.map((day, idx) => {
      const newDate = new Date(planStartDate.getTime() + idx * 24 * 60 * 60 * 1000);
      const newDateStr = format(newDate, 'yyyy-MM-dd');
      return { ...day, date: newDateStr };
    });

    // Use existing handler to update state and persist
    handlePlanChange(updatedWeek as any);
  };

  // Add tag on Enter/comma
  const handleAddTemplateTag = () => {
    const value = templateTagInput.trim();
    if (!value) return;
    if (!templateTags.includes(value)) setTemplateTags(prev => [...prev, value]);
    setTemplateTagInput('');
  };

  const removeTemplateTag = (t: string) => setTemplateTags(prev => prev.filter(x => x !== t));

  const buildWeeklyTemplateJson = (week: WeekDay[], tags: string[]) => {
    const toWeekdayKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const idx = d.getDay(); // 0=Sun..6=Sat
      return ['sun','mon','tue','wed','thu','fri','sat'][idx] as 'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat';
    };
    const days_by_weekday: Record<'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat', any> = {
      sun: { focus: 'Workout', exercises: [] },
      mon: { focus: 'Workout', exercises: [] },
      tue: { focus: 'Workout', exercises: [] },
      wed: { focus: 'Workout', exercises: [] },
      thu: { focus: 'Workout', exercises: [] },
      fri: { focus: 'Workout', exercises: [] },
      sat: { focus: 'Workout', exercises: [] },
    };
    (week || []).forEach((day) => {
      const key = toWeekdayKey(day.date);
      days_by_weekday[key] = {
        focus: day.focus,
        exercises: (day.exercises || []).map((ex: any) => ({
          exercise: String(ex.exercise || ex.exercise_name || ex.name || ex.workout || ''),
          category: String(ex.category || ex.type || ex.exercise_type || ex.workout_type || ''),
          body_part: String(ex.body_part || 'Full Body'),
          sets: String(ex.sets ?? ''),
          reps: String(ex.reps ?? ''),
          duration: String(ex.duration ?? ex.time ?? ''),
          weight: String(ex.weight ?? ex.weights ?? ''),
          equipment: String(ex.equipment ?? ''),
          coach_tip: String(ex.coach_tip ?? ''),
          rest: String(ex.rest ?? ''),
          video_link: String(ex.video_link ?? '')
        }))
      };
    });
    return { tags, days_by_weekday };
  };

  const handleGenerateTemplate = () => {
    if (!workoutPlan?.week) return;
    const json = buildWeeklyTemplateJson(workoutPlan.week, templateTags);
    setGeneratedTemplateJson(json);
    setIsSaveTemplateOpen(false);
    setIsTemplatePreviewOpen(true);
    toast({ title: 'Template Ready', description: 'Weekly workout plan template generated.' });
  };

  const handleSaveTemplateToLibrary = async () => {
    try {
      if (!trainer?.id) {
        toast({ title: 'Not Signed In', description: 'Trainer account not detected. Please sign in again.', variant: 'destructive' });
        return;
      }
      if (!templateName.trim()) {
        toast({ title: 'Template Name Required', description: 'Please provide a name for this template.', variant: 'destructive' });
        return;
      }
      if (!workoutPlan?.week || workoutPlan.week.length === 0) {
        toast({ title: 'No Plan Found', description: 'Generate or load a plan before saving.', variant: 'destructive' });
        return;
      }
      const payload: any = {
        trainer_id: trainer.id,
        name: templateName.trim(),
        tags: templateTags,
        template_json: generatedTemplateJson ?? buildWeeklyTemplateJson(workoutPlan.week, templateTags),
      };

      setIsSavingTemplate(true);
      const { error } = await supabase.from('workout_plan_templates').insert(payload);
      if (error) {
        console.error('Error saving template:', error);
        toast({ title: 'Save Failed', description: error.message || 'Could not save template.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Template Saved', description: 'Plan template saved to your library.' });
      setTemplateName('');
      setTemplateTags([]);
      setGeneratedTemplateJson(null);
      setIsTemplatePreviewOpen(false);
      setIsSaveTemplateOpen(false);
    } catch (err: any) {
      console.error('Unexpected error saving template:', err);
      toast({ title: 'Save Failed', description: err.message || 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Ensure clientId is a number and not undefined
  const numericClientId = clientId ? (typeof clientId === 'string' ? parseInt(clientId) : clientId) : 0;

  // Sync planStartDay from client prop and keep planStartDate aligned
  useEffect(() => {
    const dayFromClient = client?.plan_start_day as string | undefined;
    if (dayFromClient && dayFromClient !== planStartDay) {
      setPlanStartDay(dayFromClient);
      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const targetIdx = weekdays.indexOf(dayFromClient);
      const now = new Date();
      const delta = (targetIdx - now.getDay() + 7) % 7;
      const aligned = new Date(now);
      aligned.setDate(now.getDate() + delta);
      setPlanStartDate(aligned);
    }
  }, [client?.plan_start_day]);

  // Always align selected date to the selected start weekday
  useEffect(() => {
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const targetIdx = weekdays.indexOf(planStartDay);
    if (targetIdx === -1) return;
    if (weekdays[planStartDate.getDay()] !== planStartDay) {
      const base = new Date();
      const delta = (targetIdx - base.getDay() + 7) % 7;
      const aligned = new Date(base);
      aligned.setDate(base.getDate() + delta);
      setPlanStartDate(aligned);
    }
  }, [planStartDay]);

  // --- Workout Target Edit Grid Component ---
  const WorkoutTargetEditGrid = () => {
    const [editingTarget, setEditingTarget] = useState<string | null>(null);
    const [targetEditValue, setTargetEditValue] = useState<string>('');
    const [isSavingTarget, setIsSavingTarget] = useState(false);
    
    // Parse workout days from client data
    const parseWorkoutDays = (workoutDays: any): string => {
      if (!workoutDays) return 'Not set';
      if (typeof workoutDays === 'string') {
        // Convert short day names to full names for better display
        const dayMapping: { [key: string]: string } = {
          'mon': 'Monday',
          'tue': 'Tuesday', 
          'wed': 'Wednesday',
          'thu': 'Thursday',
          'fri': 'Friday',
          'sat': 'Saturday',
          'sun': 'Sunday'
        };
        return workoutDays.split(',').map(day => {
          const trimmed = day.trim().toLowerCase();
          return dayMapping[trimmed] || day.trim();
        }).join(', ');
      }
      if (Array.isArray(workoutDays)) {
        return workoutDays.map(day => {
          const dayMapping: { [key: string]: string } = {
            'mon': 'Monday',
            'tue': 'Tuesday', 
            'wed': 'Wednesday',
            'thu': 'Thursday',
            'fri': 'Friday',
            'sat': 'Saturday',
            'sun': 'Sunday'
          };
          const trimmed = day.toLowerCase();
          return dayMapping[trimmed] || day;
        }).join(', ');
      }
      if (typeof workoutDays === 'object') {
        return Object.keys(workoutDays).filter(day => workoutDays[day]).join(', ');
      }
      return 'Not set';
    };

    // Format workout time for display
    const formatWorkoutTime = (workoutTime: any): string => {
      if (!workoutTime) return 'Not set';
      if (typeof workoutTime === 'string') {
        // Handle time format like "08:00:00" or "08:00"
        const timeMatch = workoutTime.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          const minute = timeMatch[2];
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          return `${displayHour}:${minute} ${ampm}`;
        }
        return workoutTime;
      }
      return 'Not set';
    };

    // Format training time per session for display
    const formatTrainingTime = (trainingTime: any): string => {
      if (!trainingTime) return 'Not set';
      if (typeof trainingTime === 'string' || typeof trainingTime === 'number') {
        const time = parseInt(trainingTime.toString());
        if (time === 1) return '1 minute';
        return `${time} minutes`;
      }
      return 'Not set';
    };

    // Save workout target to client table
    const saveWorkoutTarget = async (field: string, value: any) => {
      console.log(`[WorkoutTargetEditGrid] saveWorkoutTarget called with field: ${field}, value: ${value}`);
      if (!numericClientId) {
        console.log(`[WorkoutTargetEditGrid] No numericClientId, aborting save`);
        return;
      }
      setIsSavingTarget(true);
      try {
        console.log(`[WorkoutTargetEditGrid] Updating client ${numericClientId} with ${field}: ${value}`);
        const { error } = await supabase
          .from('client')
          .update({ [field]: value })
          .eq('client_id', numericClientId);
        
        if (error) {
          console.error(`[WorkoutTargetEditGrid] Database error:`, error);
          throw error;
        }
        console.log(`[WorkoutTargetEditGrid] Successfully saved ${field} to database`);
        toast({ title: 'Target Updated', description: `Workout ${field.replace('_', ' ')} updated successfully.` });
      } catch (error: any) {
        console.error('Error saving workout target:', error);
        toast({ title: 'Error', description: `Could not update workout ${field.replace('_', ' ')}. ${error?.message || JSON.stringify(error)}`, variant: 'destructive' });
      } finally {
        setIsSavingTarget(false);
        setEditingTarget(null);
      }
    };

    // Memoize the target meta to prevent unnecessary re-renders
    const targetMeta = useMemo(() => {
      // Defensive check for client
      if (!client) {
        return [];
      }
      
      return [
        { 
          key: 'workout_days', 
          label: 'Target Days of the Week', 
          value: parseWorkoutDays(client?.workout_days),
          icon: CalendarDays,
          color: 'from-blue-500 to-indigo-500',
          type: 'days'
        },
        { 
          key: 'cl_primary_goal', 
          label: 'Primary Goal', 
          value: client?.cl_primary_goal || 'Not set',
          icon: Target,
          color: 'from-green-500 to-emerald-500',
          type: 'text'
        },
        { 
          key: 'specific_outcome', 
          label: 'Specific Outcome', 
          value: client?.specific_outcome || 'Not set',
          icon: Target,
          color: 'from-purple-500 to-pink-500',
          type: 'text'
        },
        { 
          key: 'goal_timeline', 
          label: 'Timeline', 
          value: client?.goal_timeline || 'Not set',
          icon: Clock,
          color: 'from-orange-500 to-red-500',
          type: 'text'
        },
        { 
          key: 'injuries_limitations', 
          label: 'Limitations & Constraints', 
          value: client?.injuries_limitations || 'Not set',
          icon: FileText,
          color: 'from-yellow-500 to-orange-500',
          type: 'textarea'
        },
        { 
          key: 'training_time_per_session', 
          label: 'Minutes per Workout', 
          value: formatTrainingTime(client?.training_time_per_session),
          icon: Clock,
          color: 'from-indigo-500 to-purple-500',
          type: 'number'
        }
      ];
    }, [client?.workout_days, client?.cl_primary_goal, client?.specific_outcome, client?.goal_timeline, client?.injuries_limitations, client?.training_time_per_session]);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targetMeta && targetMeta.length > 0 ? (
          targetMeta.map(({ key, label, value, icon: Icon, color, type }) => (
          <div key={key} className={`rounded-xl shadow-md bg-gradient-to-br ${color} p-4 flex flex-col items-center relative`}>
            <div className="absolute top-2 right-2">
              {editingTarget === key ? (
                <button
                  className="text-white hover:text-gray-200"
                  onClick={() => setEditingTarget(null)}
                  title="Cancel Edit"
                >
                  ✖️
                </button>
              ) : (
                <button
                  className="text-white/80 hover:text-white"
                  onClick={() => {
                    console.log(`[WorkoutTargetEditGrid] Starting edit for ${key}`);
                    setEditingTarget(key);
                    if (key === 'workout_days') {
                      const value = parseWorkoutDays(client?.workout_days);
                      console.log(`[WorkoutTargetEditGrid] Setting workout_days value: ${value}`);
                      setTargetEditValue(value);
                    } else if (key === 'training_time_per_session') {
                      const value = client?.training_time_per_session?.toString() || '';
                      console.log(`[WorkoutTargetEditGrid] Setting training_time_per_session value: ${value}`);
                      setTargetEditValue(value);
                    } else if (key === 'cl_primary_goal') {
                      const value = client?.cl_primary_goal || '';
                      console.log(`[WorkoutTargetEditGrid] Setting cl_primary_goal value: ${value}`);
                      setTargetEditValue(value);
                    } else if (key === 'specific_outcome') {
                      const value = client?.specific_outcome || '';
                      console.log(`[WorkoutTargetEditGrid] Setting specific_outcome value: ${value}`);
                      setTargetEditValue(value);
                    } else if (key === 'goal_timeline') {
                      const value = client?.goal_timeline || '';
                      console.log(`[WorkoutTargetEditGrid] Setting goal_timeline value: ${value}`);
                      setTargetEditValue(value);
                    } else if (key === 'injuries_limitations') {
                      const value = client?.injuries_limitations || '';
                      console.log(`[WorkoutTargetEditGrid] Setting injuries_limitations value: ${value}`);
                      setTargetEditValue(value);
                    } else {
                      const value = client?.workout_time || '';
                      console.log(`[WorkoutTargetEditGrid] Setting workout_time value: ${value}`);
                      setTargetEditValue(value);
                    }
                  }}
                  title={`Edit ${label}`}
                >
                  ✏️
                </button>
              )}
            </div>
            {type !== 'days' && <Icon className="h-6 w-6 mb-2 text-white drop-shadow" />}
            <div className="text-sm font-bold text-white mb-2">{label}</div>
            {editingTarget === key ? (
              <div className="flex items-center gap-2 w-full">
                {type === 'time' ? (
                  <input
                    type="time"
                    value={targetEditValue}
                    onChange={e => setTargetEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveWorkoutTarget(key, targetEditValue);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      if (targetEditValue) saveWorkoutTarget(key, targetEditValue);
                      else setEditingTarget(null);
                    }}
                    className="w-full px-2 py-1 rounded border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold text-gray-900 bg-white shadow"
                    autoFocus
                    disabled={isSavingTarget}
                  />
                ) : type === 'number' ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      value={targetEditValue}
                      onChange={e => {
                        console.log(`[WorkoutTargetEditGrid] Number input changed for ${key}: ${e.target.value}`);
                        setTargetEditValue(e.target.value);
                      }}
                                          onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveWorkoutTarget(key, parseInt(targetEditValue) || 0);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingTarget(null);
                      }
                    }}
                      onBlur={() => {
                        if (targetEditValue) saveWorkoutTarget(key, parseInt(targetEditValue) || 0);
                        else setEditingTarget(null);
                      }}
                      className="w-20 px-2 py-1 rounded border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold text-gray-900 bg-white shadow"
                      autoFocus
                      disabled={isSavingTarget}
                      min="15"
                      max="180"
                      placeholder="45"
                    />
                    <span className="text-white text-sm font-semibold">min</span>
                  </div>
                ) : type === 'textarea' ? (
                  <textarea
                    value={targetEditValue}
                    onChange={e => {
                      console.log(`[WorkoutTargetEditGrid] Textarea changed for ${key}: ${e.target.value}`);
                      setTargetEditValue(e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        saveWorkoutTarget(key, targetEditValue);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      if (targetEditValue) saveWorkoutTarget(key, targetEditValue);
                      else setEditingTarget(null);
                    }}
                    className="w-full px-2 py-1 rounded border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold text-gray-900 bg-white shadow resize-none"
                    autoFocus
                    disabled={isSavingTarget}
                    placeholder="Enter limitations and constraints..."
                    rows={3}
                  />
                ) : type === 'days' ? (
                  <div className="w-full">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                        const isSelected = targetEditValue.toLowerCase().includes(day.toLowerCase());
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              const currentDays = targetEditValue.split(',').map(d => d.trim()).filter(d => d);
                              if (isSelected) {
                                const newDays = currentDays.filter(d => !d.toLowerCase().includes(day.toLowerCase()));
                                setTargetEditValue(newDays.join(', '));
                              } else {
                                const newDays = [...currentDays, day];
                                setTargetEditValue(newDays.join(', '));
                              }
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                              isSelected 
                                ? 'bg-white text-blue-600 shadow-lg' 
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      value={targetEditValue}
                      onChange={e => {
                        console.log(`[WorkoutTargetEditGrid] Days input changed for ${key}: ${e.target.value}`);
                        setTargetEditValue(e.target.value);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          saveWorkoutTarget(key, targetEditValue);
                        } else if (e.key === 'Escape') {
                          setEditingTarget(null);
                        }
                      }}
                      onBlur={() => {
                        if (targetEditValue) saveWorkoutTarget(key, targetEditValue);
                        else setEditingTarget(null);
                      }}
                      className="w-full px-2 py-1 rounded border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold text-gray-900 bg-white shadow"
                      autoFocus
                      disabled={isSavingTarget}
                      placeholder="e.g., Monday, Wednesday, Friday"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={targetEditValue}
                    onChange={e => {
                      console.log(`[WorkoutTargetEditGrid] Text input changed for ${key}: ${e.target.value}`);
                      setTargetEditValue(e.target.value);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveWorkoutTarget(key, targetEditValue);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      if (targetEditValue) saveWorkoutTarget(key, targetEditValue);
                      else setEditingTarget(null);
                    }}
                    className="w-full px-2 py-1 rounded border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-semibold text-gray-900 bg-white shadow"
                    autoFocus
                    disabled={isSavingTarget}
                    placeholder="e.g., Monday, Wednesday, Friday"
                  />
                )}
                {isSavingTarget && editingTarget === key && (
                  <div className="text-white text-sm">Saving...</div>
                )}
              </div>
            ) : (
              <div className="text-lg font-bold text-white text-center">
                {type === 'days' && value !== 'Not set' ? (
                  <div className="flex flex-wrap justify-center gap-1">
                    {value.split(',').map((day: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-white/20 rounded-full text-sm">
                        {day.trim()}
                      </span>
                    ))}
                  </div>
                ) : type === 'textarea' ? (
                  <div className="text-sm text-white text-left max-h-20 overflow-y-auto">
                    {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                  </div>
                ) : (
                  <div className="text-sm text-white text-center">
                    {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                  </div>
                )}
              </div>
            )}
          </div>
        ))) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No client data available
          </div>
        )}
      </div>
    );
  };

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

    // 1. Try schedule_preview first - but search for ANY data for this client, not just the fixed range
    let { data, error } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .order('for_date', { ascending: true });
    
    console.log('[WorkoutPlanSection] All schedule_preview data for client:', data?.map(d => ({ date: d.for_date, summary: d.summary })));
    
    console.log('[WorkoutPlanSection] Fetched from schedule_preview. Data length:', data?.length, 'Error:', error);

    if (data && data.length > 0) {
      setIsDraftPlan(true);
      // Filter data to the requested date range
      data = data.filter(workout => 
        workout.for_date >= startDateStr && workout.for_date <= endDateStr
      );
      console.log('[WorkoutPlanSection] Filtered data for date range. Data length:', data?.length);
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
        
        // Find matching data by comparing normalized dates
        const dayData = data?.find(workout => {
          const normalizedWorkoutDate = normalizeDateForStorage(workout.for_date);
          return normalizedWorkoutDate === dateStr;
        });
        let planDay = {
            date: dateStr,
            focus: 'Rest Day',
            exercises: []
        };
        if (dayData && dayData.details_json?.exercises) {
            planDay.focus = dayData.summary || 'Workout';
            // Use the comprehensive normalizeExercise function here
            planDay.exercises = dayData.details_json.exercises.map(normalizeExercise);
            
            // Debug: Check sets values after normalization
            planDay.exercises.forEach((ex: any, exIdx: number) => {
              console.log(`[fetchPlan] Day ${i}, Exercise ${exIdx} sets value after normalization:`, ex.sets);
            });
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
    
    // Debug: Check sets values before saving
    updatedPlan.forEach((day, dayIdx) => {
      day.exercises.forEach((ex, exIdx) => {
        if (ex.sets !== undefined) {
          console.log(`[WorkoutPlanSection] Before save - Day ${dayIdx}, Exercise ${exIdx} sets value:`, ex.sets);
        }
      });
    });
    
    setIsSavingEdits(true);
    const result = await savePlanToSchedulePreview(updatedPlan, numericClientId, planStartDate);
    setIsSavingEdits(false);
    if (result.success) {
      toast({ title: 'Changes saved', description: 'Your edits have been saved to the draft.' });
      // Check approval status after saving to update the approve button
      await checkPlanApprovalStatus();
      // DO NOT REFETCH HERE. The local state is the source of truth during editing.
      // fetchPlan(); 
    } else {
      toast({ title: 'Save Failed', description: 'Could not save changes.', variant: 'destructive' });
    }
  }, 1500); // 1.5-second debounce delay

  const handlePlanChange = (updatedWeek: WeekDay[]) => {
    console.log('[WorkoutPlanSection] handlePlanChange received updated week:', updatedWeek);
    
    // Debug: Check if sets values are being preserved
    updatedWeek.forEach((day, dayIdx) => {
      day.exercises.forEach((ex, exIdx) => {
        if (ex.sets !== undefined) {
          console.log(`[WorkoutPlanSection] Day ${dayIdx}, Exercise ${exIdx} sets value:`, ex.sets);
        }
      });
    });
    
    // Update the state immediately for a responsive UI
    setWorkoutPlan(currentPlan => {
      if (!currentPlan) return null;
      return { ...currentPlan, week: updatedWeek };
    });
    // Trigger the debounced save
    debouncedSave(updatedWeek);
  };

  const handleImportSuccess = async (weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>, dateRange: { start: string; end: string }) => {
    console.log('[WorkoutPlanSection] Import successful, updating workout plan:', weekData);
    console.log('[WorkoutPlanSection] Date range from CSV:', dateRange);
    
    // Save the imported plan to schedule_preview first
    try {
      // Use proper timezone handling for the start date
      const normalizedStartDate = createDateFromString(dateRange.start);
      await savePlanToSchedulePreview(weekData, numericClientId, normalizedStartDate);
      console.log('[WorkoutPlanSection] Successfully saved imported plan to database');
      
      // Update the workout plan with imported data immediately
      const hasAnyWorkouts = weekData.some(day => day.exercises && day.exercises.length > 0);
      console.log('[WorkoutPlanSection] Calculated hasAnyWorkouts:', hasAnyWorkouts);
      console.log('[WorkoutPlanSection] Week data for calculation:', weekData.map(day => ({ date: day.date, exerciseCount: day.exercises?.length || 0 })));
      
      const importedWorkoutPlan = {
        week: weekData,
        hasAnyWorkouts: hasAnyWorkouts,
        planStartDate: dateRange.start,
        planEndDate: dateRange.end
      };
      
      console.log('[WorkoutPlanSection] Setting workout plan state:', importedWorkoutPlan);
      setWorkoutPlan(importedWorkoutPlan);
      
      // Set as draft plan since it's imported
      setIsDraftPlan(true);
      
      // Check approval status after importing
      await checkPlanApprovalStatus();
      
      // Update the calendar to show the imported date range
      if (dateRange.start && dateRange.end) {
        const newStartDate = new Date(dateRange.start);
        console.log('[WorkoutPlanSection] Updating calendar to show imported date range:', dateRange.start, 'to', dateRange.end);
        // Update the parent component's date state if available
        if (props.onDateChange) {
          props.onDateChange(newStartDate);
        }
      }
      
      toast({ 
        title: 'Import Successful', 
        description: `Workout plan has been imported for ${dateRange.start} to ${dateRange.end}.` 
      });
      
    } catch (error) {
      console.error('Error saving imported plan:', error);
      toast({ 
        title: 'Import Warning', 
        description: 'Plan imported but failed to save to database. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Fetch workout plan for client and date
  useEffect(() => {
    if (hasAIGeneratedPlan) {
      console.log('[WorkoutPlanSection] Skipping database fetch because AI-generated plan is active.');
      return;
    }
    fetchPlan();
  }, [numericClientId, planStartDate, planStartDay, hasAIGeneratedPlan]);

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
        result = await generateAIWorkoutPlanForReview(numericClientId, undefined, planStartDate);
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
        // Don't override the user's selected plan start date
        // The plan start date should remain as the user selected it
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
    
    try {
      // Get all preview rows for the week
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('id, for_date, is_approved')
        .eq('client_id', numericClientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      
      if (previewError) {
        console.error('Preview check error:', previewError);
        setPlanApprovalStatus('pending');
        return;
      }
      
      // Get all schedule rows for the week
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('id')
        .eq('client_id', numericClientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      
      if (scheduleError) {
        console.error('Schedule check error:', scheduleError);
      }
      
      // Use the same logic as nutrition plan
      if (!previewData || previewData.length === 0) {
        setPlanApprovalStatus('pending');
        return;
      }
      
      // Get unique days from the rows (since there are multiple workout entries per day)
      const uniqueDays = Array.from(new Set(previewData.map(row => row.for_date)));
      const actualTotalDays = uniqueDays.length;
      
      // Debug logging
      console.log('[Workout Plan Approval Debug] Status calculation details:');
      console.log('Actual unique days in preview:', actualTotalDays);
      console.log('Unique days:', uniqueDays);
      console.log('Total rows (workout entries):', previewData.length);
      console.log('is_approved types:', previewData.map(r => typeof r.is_approved), 'values:', previewData.map(r => r.is_approved));
      
      // Check if all existing days are approved
      const approvedDays = uniqueDays.filter(day => {
        const dayRows = previewData.filter(row => row.for_date === day);
        const allApproved = dayRows.every(row => row.is_approved === true);
        console.log(`Day ${day}: ${dayRows.length} entries, all approved: ${allApproved}`);
        return allApproved;
      });
      
      console.log('Approved days:', approvedDays);
      console.log('Approved days count:', approvedDays.length);
      console.log('Total days count:', actualTotalDays);
      
      // If we have no approved days, it's not approved
      if (approvedDays.length === 0) {
        console.log('❌ Result: not_approved (no days are approved)');
        setPlanApprovalStatus('not_approved');
        return;
      }
      
      // If all available days are approved, it's approved (regardless of how many days)
      if (approvedDays.length === actualTotalDays) {
        console.log('✅ Result: approved (all available days are approved)');
        setPlanApprovalStatus('approved');
        return;
      }
      
      // If some days are approved but not all, it's partial approved
      console.log('⚠️ Result: partial_approved (some days approved, some not)');
      setPlanApprovalStatus('partial_approved');
      
    } catch (error) {
      console.error('Error checking approval status:', error);
      setPlanApprovalStatus('pending');
    }
  };

  // Re-check approval status whenever plan, client, or date changes
  useEffect(() => {
    if (numericClientId && planStartDate) {
      checkPlanApprovalStatus();
    }
  }, [numericClientId, planStartDate, workoutPlan]);

  // Enhanced search-based generation handler
  const handleGenerateSearchPlan = async () => {
    setAiError(null); // Clear previous error
    if (!numericClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client.', variant: 'destructive' });
      return;
    }
    
    setIsGeneratingSearch(true);
    
    try {
      console.log('🚀 Starting enhanced workout plan generation...');
      
      // Use the enhanced workout generator
      const result = await EnhancedWorkoutGenerator.generateWorkoutPlan(
        numericClientId,
        planStartDate
      );
      
      // Check if progression reset is needed
      if (!result.success && result.progressionConfirmation === false) {
        // This is a normal case for new clients with no previous workout data
        console.log('ℹ️ No previous workout data found - using baseline template');
        
        // Try again - the generator should handle this gracefully now
        const retryResult = await EnhancedWorkoutGenerator.generateWorkoutPlan(
          numericClientId,
          planStartDate
        );
        
        if (!retryResult.success) {
          throw new Error(retryResult.message || 'Failed to generate plan');
        }
        
        result = retryResult;
      }
      
      if (result.success && result.workoutPlan) {
        toast({ title: 'Enhanced Workout Plan Generated', description: 'The new plan is ready for review.' });
        
        const searchWorkoutPlan = result.workoutPlan;
        const searchDays = searchWorkoutPlan.days || [];
        
        console.log('🚀 === ENHANCED WORKOUT PLAN RESPONSE ===');
        console.log('🚀 Enhanced Workout Plan:', searchWorkoutPlan);
        console.log('🚀 Search Days:', searchDays);
        console.log('🚀 First day sample:', searchDays[0]);
        console.log('🚀 First day exercises:', searchDays[0]?.exercises);
        console.log('🚀 First day time breakdown:', searchDays[0]?.timeBreakdown);
        
        // Build week array starting from planStartDate, assigning each search day to a date
        const week = [];
        for (let i = 0; i < searchDays.length; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          const normalizedExercises = (searchDays[i].exercises || []).map(normalizeExercise);
          console.log(`🚀 Day ${i} exercises before normalization:`, searchDays[i].exercises);
          console.log(`🚀 Day ${i} exercises after normalization:`, normalizedExercises);
          
          week.push({
            date: dateStr,
            focus: searchDays[i].focus,
            exercises: normalizedExercises,
            timeBreakdown: searchDays[i].timeBreakdown || {
              warmup: 0,
              exercises: 0,
              rest: 0,
              cooldown: 0,
              total: 0
            }
          });
        }
        
        console.log('🚀 Final week structure:', week);
        console.log('🚀 First week day sample:', week[0]);
        console.log('🚀 First week day exercises:', week[0]?.exercises);
        
        const newWorkoutPlan = {
          week,
          hasAnyWorkouts: week.some((day: WeekDay) => day.exercises && day.exercises.length > 0),
          planStartDate: week[0]?.date || '',
          planEndDate: week[week.length - 1]?.date || ''
        };
        console.log('✅ Setting enhanced workout plan:', newWorkoutPlan);
        setWorkoutPlan(newWorkoutPlan);
        setHasAIGeneratedPlan(true); // Mark that plan data is now available
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
      setAiError('Enhanced workout generation failed. Please try again or check the console for details.');
      console.error('Full enhanced workout response error:', error);
      toast({ title: 'Enhanced Workout Generation Failed', description: error.message || 'Could not generate workout plan.', variant: 'destructive' });
    } finally {
      setIsGeneratingSearch(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setOpenPopup('fitnessGoals')} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setOpenPopup('trainingPreferences')} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
        <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
      </div>

      {/* Client Goals & Preferences Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-3">
          <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          {client?.name || 'Client'} Goals & Workout Preferences
        </h3>
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <WorkoutTargetEditGrid />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Header with AI Generation */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 whitespace-nowrap">Workout Planning and Management</h3>
            <p className="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI-powered workout planning and exercise tracking
            </p>
            {/* Approval Status Indicator */}
            <div className="flex items-center gap-2 mt-2">
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
              {planApprovalStatus === 'not_approved' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-300 dark:border-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  📝 Draft Plan (Not Approved)
                </div>
              )}
              {planApprovalStatus === 'pending' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  ⚪ No Plan
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import/Export Buttons - Moved to header area */}
        <div className="flex items-center gap-3">
          {/* Import Button - Always available */}
          <WorkoutImportButton
            clientId={numericClientId}
            clientName={client?.name}
            planStartDate={planStartDate}
            onImportSuccess={handleImportSuccess}
            disabled={isGenerating}
          />
          {/* Export Button - Only show when there's workout data */}
          {workoutPlan && workoutPlan.hasAnyWorkouts && (
            <WorkoutExportButton
              weekData={workoutPlan.week}
              clientId={numericClientId}
              planStartDate={planStartDate}
              clientName={client?.name}
              disabled={isGenerating}
            />
          )}
        </div>
      </div>

      {/* Step-by-Step Workflow */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Workout Plan Workflow
        </h4>
        
        <div className="flex flex-row flex-wrap gap-6 items-center">
          {/* Step 1: Select Plan Start Date */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </div>
            <div className="flex flex-row items-center gap-3">
              {/* Step 1: Plan Start Day */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-700 dark:text-gray-300">Plan Start Day</Label>
                <Select
                  value={planStartDay}
                  onValueChange={async (val) => {
                    try {
                      setPlanStartDay(val);
                      if (numericClientId) {
                        await supabase.from('client').update({ plan_start_day: val }).eq('client_id', numericClientId);
                      }
                      // Move planStartDate to the next occurrence of selected weekday
                      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      const targetIdx = weekdays.indexOf(val);
                      const d = new Date();
                      const delta = (targetIdx - d.getDay() + 7) % 7;
                      const next = new Date(d);
                      next.setDate(d.getDate() + delta);
                      setPlanStartDate(next);
                    } catch (e) {
                      console.error('Failed to save plan_start_day', e);
                      toast({ title: 'Save failed', description: 'Could not save Plan Start Day', variant: 'destructive' });
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Step 1: Plan Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full sm:w-[220px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(planStartDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={planStartDate}
                    // Disable all dates that are not the chosen weekday
                    disabled={(date: Date) => {
                      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      return weekdays[date.getDay()] !== planStartDay;
                    }}
                    onSelect={(date) => {
                      if (!date) return;
                      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      if (weekdays[date.getDay()] === planStartDay) {
                        setPlanStartDate(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Step 2: Generate Workout Plan */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleGeneratePlan}
                disabled={isGenerating || isGeneratingSearch || !numericClientId}
                size="lg"
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px]"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-3 animate-spin" />
                    <span className="ml-3">Generating{currentModel ? ` (${currentModel}${retryCount > 0 ? `, Retry ${retryCount}` : ''})` : '...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    AI Generate
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateSearchPlan}
                disabled={isGenerating || isGeneratingSearch || !numericClientId}
                size="lg"
                className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px]"
              >
                {isGeneratingSearch ? (
                  <>
                    <Search className="h-5 w-5 mr-3 animate-spin" />
                    <span className="ml-3">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-3" />
                    Enhanced Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step 3: Approve Plan */}
          {(planApprovalStatus === 'not_approved' || planApprovalStatus === 'partial_approved') && isDraftPlan && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                3
              </div>
              <Button
                onClick={async () => {
                  setIsApproving(true);
                  const result = await approvePlan(numericClientId, planStartDate);
                  setIsApproving(false);
                  if (result.success) {
                    toast({ title: 'Plan Approved', description: 'The workout plan has been approved and saved to the main schedule.', variant: 'default' });
                    setIsDraftPlan(false); // UI update: now approved
                    // Refresh approval status after successful approval
                    await checkPlanApprovalStatus();
                  } else {
                    toast({ title: 'Approval Failed', description: 'Could not approve plan.', variant: 'destructive' });
                  }
                }}
                disabled={isApproving}
                size="lg"
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-300 dark:border-green-700 min-w-[200px]"
              >
                {isApproving ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-3 animate-spin" />
                    <span className="ml-3">Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-3" />
                    ✅ Approve Plan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Plan Table or Empty State */}
      <div>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  7-Day Workout Plan: {format(planStartDate, "MMM d")} - {format(new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                </h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setTemplateTags([]); setTemplateTagInput(''); setIsSaveTemplateOpen(true); }}>
                  <Save className="h-4 w-4" /> Save Plan for Future
                </Button>
              </div>
              <WeeklyPlanHeader
                week={workoutPlan.week}
                planStartDate={planStartDate}
                onReorder={handlePlanChange}
                onPlanChange={handlePlanChange}
              />
            </Card>

            {/* Save Plan Template Modal */}
            <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Save Weekly Plan Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      placeholder="e.g., 4-Week Strength Kickoff"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Add Tags</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        placeholder="Type a tag (e.g., Strength, Goal, Client name)"
                        value={templateTagInput}
                        onChange={(e) => setTemplateTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTemplateTag();
                          }
                        }}
                      />
                      <Button onClick={handleAddTemplateTag} type="button" variant="secondary">Add</Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {templateTags.map(t => (
                        <Badge key={t} variant="secondary" className="flex items-center gap-1">
                          {t}
                          <button className="text-xs" onClick={() => removeTemplateTag(t)}>✕</button>
                        </Badge>
                      ))}
                      {templateTags.length === 0 && (
                        <span className="text-xs text-muted-foreground">No tags added</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateTemplate}>Preview JSON</Button>
                    <Button onClick={handleSaveTemplateToLibrary} disabled={isSavingTemplate}>
                      {isSavingTemplate ? 'Saving...' : 'Save to Library'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Workout Plan Table */}
            {workoutPlan.hasAnyWorkouts ? (
              <WorkoutPlanTable 
                week={workoutPlan.week}
                clientId={numericClientId}
                onPlanChange={handlePlanChange}
                planStartDate={planStartDate}
                clientName={client?.name}
                onImportSuccess={handleImportSuccess}
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

            {/* Template JSON Popup */}
            <Dialog open={isTemplatePreviewOpen} onOpenChange={setIsTemplatePreviewOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Weekly Plan Template (JSON)</DialogTitle>
                </DialogHeader>
                <div className="text-xs whitespace-pre-wrap break-words max-h-[70vh] overflow-auto">
                  {generatedTemplateJson ? JSON.stringify(generatedTemplateJson, null, 2) : ''}
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setIsTemplatePreviewOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center h-64 text-center">
            <h3 className="text-lg font-semibold">Select a Date to View Workout Plan</h3>
            <p className="text-muted-foreground mt-2">Choose a start date to view the 7-day workout plan.</p>
          </Card>
        )}
      </div>

      {/* Unified Popup Host */}
      <TrainerPopupHost
        openKey={openPopup}
        onClose={() => setOpenPopup(null)}
        context={{
          client,
          lastAIRecommendation: props.lastAIRecommendation,
          trainerNotes: props.trainerNotes || "",
          setTrainerNotes: props.setTrainerNotes || (() => {}),
          handleSaveTrainerNotes: props.handleSaveTrainerNotes || (() => {}),
          isSavingNotes: props.isSavingNotes || false,
          isEditingNotes: props.isEditingNotes || false,
          setIsEditingNotes: props.setIsEditingNotes || (() => {}),
          notesDraft: props.notesDraft || "",
          setNotesDraft: props.setNotesDraft || (() => {}),
          notesError: props.notesError || null,
          setNotesError: props.setNotesError || (() => {}),
          isGeneratingAnalysis: props.isGeneratingAnalysis || false,
          handleSummarizeNotes: props.handleSummarizeNotes || (() => {}),
          isSummarizingNotes: props.isSummarizingNotes || false
        }}
      />
    </div>
  );
};

export default WorkoutPlanSection; 