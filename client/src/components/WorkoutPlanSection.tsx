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
import { Clock, Dumbbell, Target, Bug, BarChart3, Edit, PieChart, Save, Trash2, Plus, Cpu, Brain, FileText, Utensils, CheckCircle, CalendarDays, Search, RefreshCw, Settings, AlertTriangle, Download, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

// AI generation removed - using search-based generation as default
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
import { format, parseISO, addWeeks } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkoutPlanTable } from './WorkoutPlanTable';
import WeeklyPlanHeader from './WeeklyPlanHeader';
import MonthlyPlanGenerator from './MonthlyPlanGenerator';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for universal UUID generation
import WorkoutExportButton from './WorkoutExportButton';
import WorkoutImportButton from './WorkoutImportButton';
import { normalizeDateForStorage, createDateFromString } from '../lib/date-utils';
import { generateSearchBasedWorkoutPlanForReview, warmupExerciseCache } from "@/lib/search-based-workout-plan"
import { SimpleWorkoutGenerator } from "@/lib/simple-workout-generator"
import { EnhancedWorkoutGenerator } from "@/lib/enhanced-workout-generator"
import { 
  checkWeeklyWorkoutStatus, 
  checkMonthlyWorkoutStatus, 
  compareWorkoutData,
  getStatusDisplay,
  type WorkoutStatusResult 
} from '@/utils/workoutStatusUtils';

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

// Enhanced state management for better UX
interface WorkoutPlanState {
  status: 'no_plan' | 'draft' | 'approved' | 'template';
  source: 'generated' | 'template' | 'database';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  templateDate?: string;
  isAutoSaving: boolean;
}

// Week-level approval status for monthly view
interface WeekApprovalStatus {
  weekNumber: number;
  status: 'approved' | 'draft' | 'no_plan';
  startDate: Date;
  endDate: Date;
  canApprove: boolean;
}

interface LoadingState {
  type: 'generating' | 'saving' | 'approving' | 'fetching' | null;
  message: string;
}

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
  setLastAIRecommendation?: (analysis: any) => void;
  onDateChange?: (newDate: Date) => void;
}

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
  const [aiWorkoutPlan, setAiWorkoutPlan] = useState<any[]>([])
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
            setAiWorkoutPlan(cleanedWorkoutPlan)
          }
        }
      } catch (error) {
        console.error("Error parsing workout plan:", error)
      }
    }
  }, [aiResponse])

  const handleWorkoutChange = (index: number, field: string, value: any) => {
    const updatedPlan = [...aiWorkoutPlan]
    
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
    setAiWorkoutPlan(updatedPlan)
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
    setAiWorkoutPlan([...aiWorkoutPlan, newWorkout])
  }

  const removeWorkout = (index: number) => {
    const updatedPlan = aiWorkoutPlan.filter((_, i) => i !== index)
    setAiWorkoutPlan(updatedPlan)
  }

  const saveChanges = () => {
    setIsEditing(false)
    console.log("Saved workout plan:", aiWorkoutPlan)
  }

  if (!isOpen || !aiResponse) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Brain className="h-6 w-6 text-white" />
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
                      {aiWorkoutPlan.length} exercises • Personalized for your goals
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
              {aiWorkoutPlan.length > 0 ? (
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
                        {aiWorkoutPlan.map((workout, index) => (
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

// Helper to build the payload for schedule_preview
function buildSchedulePreviewRows(planWeek: WeekDay[], clientId: number, for_time: string, workout_id: string) {
  return planWeek.map((day) => {
    // Format focus field properly - simple concatenation approach
    let formattedFocus = 'Rest Day';
    
    if (day.exercises && day.exercises.length > 0) {
      // If focus exists and is not "Rest Day", append " Workout" if not already present
      if (day.focus && day.focus !== 'Rest Day') {
        // Check if "Workout" is already at the end to prevent duplication
        const focusText = String(day.focus).trim();
        if (focusText.toLowerCase().endsWith(' workout')) {
          formattedFocus = focusText; // Already has "Workout" at the end
        } else {
          formattedFocus = `${focusText} Workout`;
        }
      } else {
        // Fallback: Get unique categories from exercises
        const categories = Array.from(new Set(day.exercises.map((ex: any) => {
          const category = ex.category || ex.type || ex.exercise_type || ex.workout_type || '';
          return category.trim();
        }).filter(Boolean)));
        
        if (categories.length > 0) {
          // Format as "Category Workout" or "Category1/Category2 Workout"
          if (categories.length === 1) {
            formattedFocus = `${categories[0]} Workout`;
          } else {
            // For multiple categories, use first 2 categories separated by "/"
            const displayCategories = categories.slice(0, 2);
            formattedFocus = `${displayCategories.join('/')} Workout`;
          }
        } else {
          // Final fallback
          formattedFocus = 'Full Body Workout';
        }
      }
    }
    
    return {
      client_id: clientId,
      type: 'workout',
      task: 'workout',
      icon: 'dumbell',
      summary: formattedFocus,
      for_date: normalizeDateForStorage(day.date), // Normalize date for UTC storage
      for_time, // Ensure this is a string in HH:MM:SS or HH:MM:SS+TZ format
      workout_id, // Always a valid UUID
      details_json: {
        focus: formattedFocus,
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
    };
  });
}

// Add approvePlan implementation to copy from schedule_preview to schedule
async function approvePlan(clientId: number, planStartDate: Date, viewMode: 'weekly' | 'monthly' = 'weekly') {
  const startTime = performance.now();
  
  try {
    // 1. Get the date range based on view mode
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const daysToAdd = viewMode === 'monthly' ? 27 : 6; // 28 days for monthly (0-27), 7 days for weekly (0-6)
    const endDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    console.log(`[approvePlan] Approving ${viewMode} plan: ${startDateStr} to ${endDateStr} (${daysToAdd + 1} days)`);

    // 2. Fetch all rows from schedule_preview for this client/week/type
    let previewRows: any[] = [];
    try {
      const fetchStart = performance.now();
      const { data, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const fetchEnd = performance.now();
      console.log('[Supabase] Fetch preview rows:', `${(fetchEnd - fetchStart).toFixed(2)}ms`);
      
      if (fetchError) {
        console.error('[Supabase] Fetch error:', fetchError);
        return { success: false, error: fetchError.message };
      }
      
      previewRows = data || [];
    } catch (fetchException) {
      console.error('[Supabase] Fetch exception:', fetchException);
      return { success: false, error: `Fetch exception: ${fetchException}` };
    }
    
    if (previewRows.length === 0) {
      return { success: false, error: 'No draft plan found to approve.' };
    }

    // 3. Delete any existing rows in schedule for this client/week/type
    try {
      const deleteStart = performance.now();
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const deleteEnd = performance.now();
      console.log('[Supabase] Delete schedule rows:', `${(deleteEnd - deleteStart).toFixed(2)}ms`);
      
      if (deleteError) {
        console.error('[Supabase] Delete error:', deleteError);
        return { success: false, error: deleteError.message };
      }
    } catch (deleteException) {
      console.error('[Supabase] Delete exception:', deleteException);
      return { success: false, error: `Delete exception: ${deleteException}` };
    }

    // 4. Insert the preview rows into schedule (remove id, created_at, is_approved fields)
    const rowsToInsert = previewRows.map(({ id, created_at, is_approved, ...rest }: any) => rest);
    
    try {
      const insertStart = performance.now();
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(rowsToInsert);
      const insertEnd = performance.now();
      console.log('[Supabase] Insert schedule rows:', `${(insertEnd - insertStart).toFixed(2)}ms`);
      
      if (insertError) {
        console.error('[Supabase] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    } catch (insertException) {
      console.error('[Supabase] Insert exception:', insertException);
      return { success: false, error: `Insert exception: ${insertException}` };
    }
    
    // After successful insert, set is_approved=true for all affected days in schedule_preview
    try {
      const updateStart = performance.now();
      const { error: updateError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const updateEnd = performance.now();
      console.log('[Supabase] Update approval flag:', `${(updateEnd - updateStart).toFixed(2)}ms`);
      
      if (updateError) {
        console.warn('[Supabase] Update warning:', updateError);
      }
    } catch (updateErr) {
      console.warn('[Supabase] Update exception:', updateErr);
    }
    
    const endTime = performance.now();
    console.log('[Approval] Total time:', `${(endTime - startTime).toFixed(2)}ms`);
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    console.error('[Approval] Error:', err, `(${(endTime - startTime).toFixed(2)}ms)`);
    return { success: false, error: err.message };
  }
}

/**
 * Approve individual week for monthly view
 */
async function approveWeek(clientId: number, weekStartDate: Date, weekNumber: number) {
  const startTime = performance.now();

  try {
    // 1. Get the week range (7 days)
    const startDateStr = format(weekStartDate, 'yyyy-MM-dd');
    const endDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // 2. Fetch all rows from schedule_preview for this client/week/type
    let previewRows: any[] = [];
    try {
      const fetchStart = performance.now();
      const { data, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const fetchEnd = performance.now();
      console.log(`[Supabase] Fetch preview rows for Week ${weekNumber}:`, `${(fetchEnd - fetchStart).toFixed(2)}ms`);

      if (fetchError) {
        console.error('[Supabase] Fetch error:', fetchError);
        return { success: false, error: fetchError.message };
      }

      previewRows = data || [];
    } catch (fetchException) {
      console.error('[Supabase] Fetch exception:', fetchException);
      return { success: false, error: `Fetch exception: ${fetchException}` };
    }

    if (previewRows.length === 0) {
      return { success: false, error: `No draft plan found for Week ${weekNumber} to approve.` };
    }

    // 3. Delete any existing rows in schedule for this client/week/type
    try {
      const deleteStart = performance.now();
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const deleteEnd = performance.now();
      console.log(`[Supabase] Delete schedule rows for Week ${weekNumber}:`, `${(deleteEnd - deleteStart).toFixed(2)}ms`);

      if (deleteError) {
        console.error('[Supabase] Delete error:', deleteError);
        return { success: false, error: deleteError.message };
      }
    } catch (deleteException) {
      console.error('[Supabase] Delete exception:', deleteException);
      return { success: false, error: `Delete exception: ${deleteException}` };
    }

    // 4. Insert the preview rows into schedule (remove id, created_at, is_approved fields)
    const rowsToInsert = previewRows.map(({ id, created_at, is_approved, ...rest }: any) => rest);

    try {
      const insertStart = performance.now();
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(rowsToInsert);
      const insertEnd = performance.now();
      console.log(`[Supabase] Insert schedule rows for Week ${weekNumber}:`, `${(insertEnd - insertStart).toFixed(2)}ms`);

      if (insertError) {
        console.error('[Supabase] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    } catch (insertException) {
      console.error('[Supabase] Insert exception:', insertException);
      return { success: false, error: `Insert exception: ${insertException}` };
    }

    // After successful insert, set is_approved=true for all affected days in schedule_preview
    try {
      const updateStart = performance.now();
      const { error: updateError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const updateEnd = performance.now();
      console.log(`[Supabase] Update approval flag for Week ${weekNumber}:`, `${(updateEnd - updateStart).toFixed(2)}ms`);

      if (updateError) {
        console.warn('[Supabase] Update warning:', updateError);
      }
    } catch (updateErr) {
      console.warn('[Supabase] Update exception:', updateErr);
    }

    const endTime = performance.now();
    console.log(`[Approval] Week ${weekNumber} approval total time:`, `${(endTime - startTime).toFixed(2)}ms`);
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    console.error(`[Approval] Week approval error:`, err, `(${(endTime - startTime).toFixed(2)}ms)`);
    return { success: false, error: err.message };
  }
}

// Helper to save plan to schedule_preview
async function savePlanToSchedulePreview(planWeek: WeekDay[], clientId: number, planStartDate: Date) {
  const startTime = performance.now();
  
  try {
    // Fetch client's preferred workout_time. Fallback to a default if not set.
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('workout_time')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('[Supabase] Client fetch error:', clientError);
    }
    const for_time = clientData?.workout_time || '08:00:00';

    // Always use a valid UUID for workout_id
    const workout_id = uuidv4();

    // Build the payload using the helper
    const rows = buildSchedulePreviewRows(planWeek, clientId, for_time, workout_id);

    // Get the date range for this week
    const firstDate = planWeek[0]?.date;
    const lastDate = planWeek[planWeek.length - 1]?.date;
    if (!firstDate || !lastDate) {
      return { success: false, error: 'Invalid date range' };
    }

    // Get existing preview data for this client and week
    const fetchStart = performance.now();
    const { data: existingData, error: fetchError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', firstDate)
      .lte('for_date', lastDate);
    const fetchEnd = performance.now();
    console.log('[Supabase] Fetch existing data:', `${(fetchEnd - fetchStart).toFixed(2)}ms`);

    if (fetchError) {
      console.error('[Supabase] Fetch error:', fetchError);
      return { success: false, error: fetchError.message };
    }

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
      const updateStart = performance.now();
      for (const record of recordsToUpdate) {
        const { id, ...updateData } = record;
        const { error: updateError } = await supabase
          .from('schedule_preview')
          .update(updateData)
          .eq('id', id);
        if (updateError) {
          console.error('[Supabase] Update error:', updateError);
          return { success: false, error: updateError.message };
        }
      }
      const updateEnd = performance.now();
      console.log('[Supabase] Update records:', `${(updateEnd - updateStart).toFixed(2)}ms`);
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      const insertStart = performance.now();
      const { error: insertError } = await supabase
        .from('schedule_preview')
        .insert(recordsToInsert);
      const insertEnd = performance.now();
      console.log('[Supabase] Insert records:', `${(insertEnd - insertStart).toFixed(2)}ms`);
      
      if (insertError) {
        console.error('[Supabase] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    // Set is_approved to false for all affected days
    try {
      const approvalStart = performance.now();
      await supabase
        .from('schedule_preview')
        .update({ is_approved: false })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', firstDate)
        .lte('for_date', lastDate);
      const approvalEnd = performance.now();
      console.log('[Supabase] Update approval flag:', `${(approvalEnd - approvalStart).toFixed(2)}ms`);
    } catch (updateErr) {
      console.warn('[Supabase] Approval update warning:', updateErr);
    }
    
    const endTime = performance.now();
    console.log('[Save Plan] Total time:', `${(endTime - startTime).toFixed(2)}ms`);
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    console.error('[Save Plan] Error:', err, `(${(endTime - startTime).toFixed(2)}ms)`);
    return { success: false, error: err.message };
  }
}

const WorkoutPlanSection = ({
  clientId,
  client,
  ...props
}: WorkoutPlanSectionProps) => {
  // Early return if client is not available
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-lg font-semibold">Loading Client Data</h3>
        <p className="text-muted-foreground mt-2">Please wait while client information is being loaded.</p>
      </div>
    );
  }
  const { toast } = useToast();
  
  // Initialize planStartDate from localStorage or URL parameters, fallback to today
  const [planStartDate, setPlanStartDate] = useState<Date>(() => {
    // Try to get date from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      } catch (error) {
        // Silent fallback
      }
    }
    
    // Try to get date from localStorage (only if clientId is available)
    if (clientId) {
      const storedDate = localStorage.getItem(`workoutPlanDate_${clientId}`);
      if (storedDate) {
        try {
          const parsedDate = new Date(storedDate);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        } catch (error) {
          // Silent fallback
        }
      }
    }
    
    // Fallback to today's date
    return new Date();
  });
  
  // Enhanced state management for better UX
  const [workoutPlanState, setWorkoutPlanState] = useState<WorkoutPlanState>({
    status: 'no_plan',
    source: 'database',
    lastSaved: null,
    hasUnsavedChanges: false,
    isAutoSaving: false
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    type: null,
    message: ''
  });
  
  const [workoutPlan, setWorkoutPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<PopupKey | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<Date | null>(null);
  
  // Legacy state variables for compatibility (will be replaced by enhanced state)
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSearch, setIsGeneratingSearch] = useState(false);
  const [isDraftPlan, setIsDraftPlan] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [planApprovalStatus, setPlanApprovalStatus] = useState<'approved' | 'partial_approved' | 'not_approved' | 'pending'>('pending');
  const [hasAIGeneratedPlan, setHasAIGeneratedPlan] = useState(false);

  // Week-level approval statuses for monthly view
  const [weekStatuses, setWeekStatuses] = useState<WeekApprovalStatus[]>([]);

  // Monthly Plan Generator state
  const [isMonthlyGeneratorOpen, setIsMonthlyGeneratorOpen] = useState(false);

  // Save Plan for Future (template) state
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [templateTagInput, setTemplateTagInput] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDuration, setTemplateDuration] = useState<'7day' | '30day'>('7day');
  const [generatedTemplateJson, setGeneratedTemplateJson] = useState<any | null>(null);
  const [isTemplatePreviewOpen, setIsTemplatePreviewOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Import Plan Template state
  const [isImportTemplateOpen, setIsImportTemplateOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateImportStartDate, setTemplateImportStartDate] = useState<Date>(new Date());
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);

  // Helper function to parse workout days for import functionality
  const parseWorkoutDaysForImport = (workoutDays: any): string[] => {
    // Handle null/undefined cases
    if (!workoutDays) {
      return [];
    }
    
    if (Array.isArray(workoutDays)) {
      return workoutDays.map(day => day?.toLowerCase?.() || '').filter(Boolean);
    }
    
    if (typeof workoutDays === 'string') {
      // Handle PostgreSQL array format: {mon,wed,fri}
      if (workoutDays.includes('{') && workoutDays.includes('}')) {
        const match = workoutDays.match(/\{([^}]+)\}/);
        if (match) {
          const days = match[1].split(',').map(day => day.trim().toLowerCase());
          const dayMapping: Record<string, string> = {
            'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday',
            'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday'
          };
          return days.map(day => dayMapping[day] || day).filter(Boolean);
        }
      }
      
      // Handle JSON array format
      try {
        const parsed = JSON.parse(workoutDays);
        if (Array.isArray(parsed)) {
          return parsed.map(day => day?.toLowerCase?.() || '').filter(Boolean);
        }
      } catch (e) {
        // fallback: split by comma if not valid JSON array
        return workoutDays.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
    }
    
    return [];
  };

  // Memoize parsed workout days to prevent repeated parsing
  const parsedWorkoutDays = useMemo(() => {
    try {
      return parseWorkoutDaysForImport(client?.workout_days || []);
    } catch (error) {
      console.error('Error parsing workout days:', error);
      return [];
    }
  }, [client?.workout_days]);
  const { trainer } = useAuth();
  
  // Monthly view state with localStorage persistence
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>(() => {
    // Try to get viewMode from localStorage, default to 'weekly'
    if (clientId) {
      const savedViewMode = localStorage.getItem(`workoutPlanViewMode_${clientId}`);
      return (savedViewMode as 'weekly' | 'monthly') || 'weekly';
    }
    return 'weekly';
  });
  const [monthlyData, setMonthlyData] = useState<any[][]>([]);
  
  // Persist viewMode changes to localStorage
  useEffect(() => {
    if (clientId && viewMode) {
      localStorage.setItem(`workoutPlanViewMode_${clientId}`, viewMode);
    }
  }, [viewMode, clientId]);
  
  // Enhanced UX functions
  const setLoading = (type: LoadingState['type'], message: string) => {
    setLoadingState({ type, message });
  };



  // Get the appropriate data for the table based on view mode
  const getTableData = () => {
    if (viewMode === 'monthly' && monthlyData.length > 0) {
      // Flatten the 4 weeks into a single array of 28 days
      return monthlyData.flat();
    }
    // Return the current week data for weekly view
    return workoutPlan?.week || [];
  };



  const clearLoading = () => {
    setLoadingState({ type: null, message: '' });
  };

  // Helper function to check if the selected date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return date < today;
  };

  const updateWorkoutPlanState = (updates: Partial<WorkoutPlanState>) => {
    setWorkoutPlanState(prev => ({ ...prev, ...updates }));
  };

  const showConfirmationDialog = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // For now, use browser confirm - can be replaced with custom dialog
      const confirmed = window.confirm(`${title}\n\n${message}`);
      resolve(confirmed);
    });
  };

  const handleUnsavedChanges = async (action: () => void) => {
    if (workoutPlanState.hasUnsavedChanges) {
      const confirmed = await showConfirmationDialog(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before continuing?'
      );
      
      if (confirmed) {
        // Auto-save current changes
        await autoSaveDraft();
      }
    }
    action();
  };

  const autoSaveDraft = async () => {
    if (!workoutPlan || !workoutPlanState.hasUnsavedChanges) return;
    
    updateWorkoutPlanState({ isAutoSaving: true });
    setLoading('saving', 'Auto-saving draft...');
    
    try {
      const result = await savePlanToSchedulePreview(workoutPlan.week, numericClientId, planStartDate);
      if (result.success) {
        updateWorkoutPlanState({ 
          hasUnsavedChanges: false, 
          lastSaved: new Date(),
          isAutoSaving: false 
        });
        toast({ 
          title: 'Draft Saved', 
          description: 'Your changes have been auto-saved.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      updateWorkoutPlanState({ isAutoSaving: false });
    } finally {
      clearLoading();
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (workoutPlanState.hasUnsavedChanges && !workoutPlanState.isAutoSaving) {
      const autoSaveTimer = setTimeout(() => {
        autoSaveDraft();
      }, 30000); // Auto-save after 30 seconds of inactivity
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [workoutPlanState.hasUnsavedChanges, workoutPlan]);

  // Cleanup effect to reset loading states on unmount
  useEffect(() => {
    return () => {
      // Reset loading states if component unmounts during generation
      if (isGeneratingSearch) {
        console.log('🔄 Component unmounting during generation - resetting state');
        setIsGeneratingSearch(false);
      }
      if (isGenerating) {
        console.log('🔄 Component unmounting during generation - resetting state');
        setIsGenerating(false);
      }
      // Clear any pending timeouts
      clearLoading();
    };
  }, [isGeneratingSearch, isGenerating]);
  
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

  const buildTemplateJson = (weekData: WeekDay[], tags: string[], duration: '7day' | '30day') => {
    const toWeekdayKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const idx = d.getDay(); // 0=Sun..6=Sat
      return ['sun','mon','tue','wed','thu','fri','sat'][idx] as 'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat';
    };

    if (duration === '7day') {
      // For 7-day templates, use the traditional days_by_weekday structure
      const days_by_weekday: Record<'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat', any> = {
        sun: { focus: 'Workout', exercises: [] },
        mon: { focus: 'Workout', exercises: [] },
        tue: { focus: 'Workout', exercises: [] },
        wed: { focus: 'Workout', exercises: [] },
        thu: { focus: 'Workout', exercises: [] },
        fri: { focus: 'Workout', exercises: [] },
        sat: { focus: 'Workout', exercises: [] },
      };
      
      (weekData || []).forEach((day) => {
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
      
      return { 
        tags, 
        duration: '7day',
        days_by_weekday 
      };
    } else {
      // For 30-day templates, use a weeks structure (4 weeks of 7 days each)
      const weeks: any[] = [];
      
      // Group the data into weeks (assuming weekData contains 28 days for monthly view)
      for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
        const weekStart = weekIndex * 7;
        const weekEnd = weekStart + 7;
        const currentWeekData = weekData.slice(weekStart, weekEnd);
        
        const days_by_weekday: Record<'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat', any> = {
          sun: { focus: 'Workout', exercises: [] },
          mon: { focus: 'Workout', exercises: [] },
          tue: { focus: 'Workout', exercises: [] },
          wed: { focus: 'Workout', exercises: [] },
          thu: { focus: 'Workout', exercises: [] },
          fri: { focus: 'Workout', exercises: [] },
          sat: { focus: 'Workout', exercises: [] },
        };
        
        currentWeekData.forEach((day) => {
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
        
        weeks.push({
          week_number: weekIndex + 1,
          days_by_weekday
        });
      }
      
      return { 
        tags, 
        duration: '30day',
        weeks 
      };
    }
  };

  const handleGenerateTemplate = () => {
    if (!workoutPlan?.week) return;
    
    // Get the appropriate data based on duration
    const dataToUse = templateDuration === '30day' && monthlyData.length > 0 
      ? monthlyData.flat() 
      : workoutPlan.week;
    
    const json = buildTemplateJson(dataToUse, templateTags, templateDuration);
    setGeneratedTemplateJson(json);
    setIsSaveTemplateOpen(false);
    setIsTemplatePreviewOpen(true);
    
    const durationText = templateDuration === '30day' ? '30-day' : '7-day';
    toast({ title: 'Template Ready', description: `${durationText} workout plan template generated.` });
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
      // Get the appropriate data based on duration
      const dataToUse = templateDuration === '30day' && monthlyData.length > 0 
        ? monthlyData.flat() 
        : workoutPlan.week;
      
      const payload: any = {
        trainer_id: trainer.id,
        name: templateName.trim(),
        tags: templateTags,
        template_json: generatedTemplateJson ?? buildTemplateJson(dataToUse, templateTags, templateDuration),
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

  // Load available templates for import
  const loadAvailableTemplates = async () => {
    if (!trainer?.id) {
      toast({ title: 'Not Signed In', description: 'Trainer account not detected. Please sign in again.', variant: 'destructive' });
      return;
    }

    setIsLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .select('id, name, tags, template_json, created_at')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
        toast({ title: 'Load Failed', description: error.message || 'Could not load templates.', variant: 'destructive' });
        return;
      }

      setAvailableTemplates(data || []);
    } catch (err: any) {
      console.error('Unexpected error loading templates:', err);
      toast({ title: 'Load Failed', description: err.message || 'Unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Handle template import
  const handleImportTemplate = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'No Template Selected', description: 'Please select a template to import.', variant: 'destructive' });
      return;
    }

    const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      toast({ title: 'Template Not Found', description: 'Selected template could not be found.', variant: 'destructive' });
      return;
    }

    setIsImportingTemplate(true);
    try {
      // Use memoized workout days
      const clientWorkoutDays = parsedWorkoutDays;
      
      // Convert template to workout plan format
      const weekData = convertTemplateToWorkoutPlan(
        selectedTemplate.template_json,
        templateImportStartDate,
        clientWorkoutDays
      );

      // Update the workout plan state
      const planStartDate = weekData[0]?.date || templateImportStartDate.toISOString().split('T')[0];
      const planEndDate = weekData[weekData.length - 1]?.date || templateImportStartDate.toISOString().split('T')[0];
      
      setWorkoutPlan({
        week: weekData,
        hasAnyWorkouts: weekData.some(day => day.exercises && day.exercises.length > 0),
        planStartDate,
        planEndDate
      });
      updateWorkoutPlanState({
        hasUnsavedChanges: true
      });

      // Close modal and reset state
      setIsImportTemplateOpen(false);
      setSelectedTemplateId('');
      setTemplateImportStartDate(new Date());

      toast({ 
        title: 'Template Imported', 
        description: `Successfully imported "${selectedTemplate.name}" template.` 
      });

    } catch (err: any) {
      console.error('Error importing template:', err);
      toast({ 
        title: 'Import Failed', 
        description: err.message || 'Failed to import template.', 
        variant: 'destructive' 
      });
    } finally {
      setIsImportingTemplate(false);
    }
  };

  // Convert template JSON to workout plan format with workout day mapping
  const convertTemplateToWorkoutPlan = (
    templateJson: any,
    startDate: Date,
    workoutDays: string[]
  ): WeekDay[] => {
    const toWeekdayKey = (dateStr: string) => {
      const d = new Date(dateStr);
      const idx = d.getDay(); // 0=Sun..6=Sat
      return ['sun','mon','tue','wed','thu','fri','sat'][idx] as 'sun'|'mon'|'tue'|'wed'|'thu'|'fri'|'sat';
    };

    // Get template data based on duration
    let templateData: any;
    if (templateJson?.duration === '30day' && templateJson?.weeks) {
      // For 30-day templates, use the first week for now
      templateData = templateJson.weeks[0]?.days_by_weekday;
    } else {
      // For 7-day templates
      templateData = templateJson?.days_by_weekday;
    }

    if (!templateData) {
      throw new Error('Invalid template structure');
    }

    // Create a week of dates starting from the selected start date
    const weekData: WeekDay[] = [];
    const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const weekdayKey = toWeekdayKey(dateStr);
      
      // Get template data for this weekday
      const templateDay = templateData[weekdayKey];
      
      weekData.push({
        date: dateStr,
        focus: templateDay?.focus || 'Workout',
        exercises: templateDay?.exercises || []
      });
    }

    // If workout days are specified, map exercises to workout days
    if (workoutDays && workoutDays.length > 0) {
      return mapTemplateToWorkoutDays(weekData, startDate, workoutDays);
    }

    return weekData;
  };

  // Map template exercises to client's workout days
  const mapTemplateToWorkoutDays = (
    weekData: WeekDay[],
    startDate: Date,
    workoutDays: string[]
  ): WeekDay[] => {
    // Filter to only include workout days
    const workoutDayData = weekData.filter(day => {
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return workoutDays.includes(dayName);
    });

    // Create a new week with exercises mapped to workout days
    const mappedWeek: WeekDay[] = [];
    let currentDate = new Date(startDate);
    let exerciseIndex = 0;

    for (let i = 0; i < 7; i++) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (workoutDays.includes(dayName) && exerciseIndex < workoutDayData.length) {
        // This is a workout day, use the next exercise day
        mappedWeek.push({
          date: dateStr,
          focus: workoutDayData[exerciseIndex].focus,
          exercises: workoutDayData[exerciseIndex].exercises
        });
        exerciseIndex++;
      } else {
        // This is not a workout day, add empty day
        mappedWeek.push({
          date: dateStr,
          focus: 'Rest Day',
          exercises: []
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return mappedWeek;
  };

  // Ensure clientId is a number and not undefined
  const numericClientId = clientId ? (typeof clientId === 'string' ? parseInt(clientId) : clientId) : 0;

  // Sync planStartDate with client's plan start day
  useEffect(() => {
    const dayFromClient = client?.plan_start_day as string | undefined;
    if (dayFromClient) {
      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const targetIdx = weekdays.indexOf(dayFromClient);
      const now = new Date();
      const delta = (targetIdx - now.getDay() + 7) % 7;
      const aligned = new Date(now);
      aligned.setDate(now.getDate() + delta);
      setPlanStartDate(aligned);
    }
  }, [client?.plan_start_day]);

  // Always align selected date to the client's plan start day
  useEffect(() => {
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const clientPlanStartDay = client?.plan_start_day || 'Sunday';
    const targetIdx = weekdays.indexOf(clientPlanStartDay);
    if (targetIdx === -1) return;
    if (weekdays[planStartDate.getDay()] !== clientPlanStartDay) {
      const base = new Date();
      const delta = (targetIdx - base.getDay() + 7) % 7;
      const aligned = new Date(base);
      aligned.setDate(base.getDate() + delta);
      setPlanStartDate(aligned);
    }
  }, [client?.plan_start_day, planStartDate]);

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

    // Helper function to get user-friendly text
    const getUserFriendlyText = (key: string, value: string): string => {
      if (value === 'Not set') return 'Not set';
      
      switch (key) {
        case 'cl_primary_goal':
          return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        case 'goal_timeline':
          return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        case 'specific_outcome':
          return value.length > 30 ? `${value.substring(0, 30)}...` : value;
        case 'injuries_limitations':
          return value.length > 40 ? `${value.substring(0, 40)}...` : value;
        default:
          return value;
      }
    };

    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
        {/* Header Row - Primary Goal + Timeline */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Primary Goal</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {getUserFriendlyText('cl_primary_goal', targetMeta.find(t => t.key === 'cl_primary_goal')?.value || 'Not set')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Timeline</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {getUserFriendlyText('goal_timeline', targetMeta.find(t => t.key === 'goal_timeline')?.value || 'Not set')}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Row - Workout Days + Duration */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Workout Days</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {targetMeta.find(t => t.key === 'workout_days')?.value !== 'Not set' ? (
                  targetMeta.find(t => t.key === 'workout_days')?.value.split(',').map((day: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                      {day.trim()}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Not set</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Duration</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {targetMeta.find(t => t.key === 'training_time_per_session')?.value || 'Not set'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Specific Outcome + Constraints */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2 flex-1">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mt-1">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Specific Outcome</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {getUserFriendlyText('specific_outcome', targetMeta.find(t => t.key === 'specific_outcome')?.value || 'Not set')}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 flex-1">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg mt-1">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Constraints</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {getUserFriendlyText('injuries_limitations', targetMeta.find(t => t.key === 'injuries_limitations')?.value || 'Not set')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchPlan = async () => {
    if (!numericClientId) {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isFetchingPlan) {
      console.log('🔄 [fetchPlan] Already fetching, skipping...');
      return;
    }

    console.log('🔄 [fetchPlan] Starting fetch for client:', numericClientId, 'date:', planStartDate);
    setLoading('fetching', 'Loading workout plan...');
    setIsFetchingPlan(true);
    
    // Add timeout protection to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Fetch plan timeout - forcing reset');
      setIsFetchingPlan(false);
      clearLoading();
      toast({ 
        title: 'Loading Timeout', 
        description: 'Loading took too long. Please try again.', 
        variant: 'destructive' 
      });
    }, 15000); // Reduced to 15 second timeout
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    let data: any[] = [];
    let error: any = null;
    let isFromPreview = true; // Default to preview as primary source

    try {
      console.log('🔄 [fetchPlan] Calling checkWeeklyWorkoutStatus...');
      // Use the unified weekly status function (same logic as monthly view)
      const weeklyResult: WorkoutStatusResult = await checkWeeklyWorkoutStatus(supabase, numericClientId, planStartDate);
      console.log('🔄 [fetchPlan] checkWeeklyWorkoutStatus completed:', weeklyResult);
      
      // Use preview data as primary source (same as monthly view)
      if (weeklyResult.previewData && weeklyResult.previewData.length > 0) {
        data = weeklyResult.previewData;
        isFromPreview = true;
      } else {
        
        // Strategy 3: Try to find the most recent plan and use it as a template
        // Try to find the most recent plan from schedule_preview first
        console.log('🔄 [fetchPlan] Querying recent preview data...');
        let { data: recentPreviewData, error: recentPreviewError } = await supabase
          .from('schedule_preview')
          .select('*')
          .eq('client_id', numericClientId)
          .eq('type', 'workout')
          .order('for_date', { ascending: false })
          .limit(1);
        console.log('🔄 [fetchPlan] Recent preview query completed:', { data: recentPreviewData?.length, error: recentPreviewError });
        
        if (!recentPreviewError && recentPreviewData && recentPreviewData.length > 0) {
          data = recentPreviewData;
          isFromPreview = true;
          setIsDraftPlan(true);
        }
        
        // FALLBACK LOGIC COMMENTED OUT - UI should ONLY get data from schedule_preview table
        // } else if (weeklyResult.scheduleData && weeklyResult.scheduleData.length > 0) {
        //   console.log('[WorkoutPlanSection] No preview data, using schedule data as fallback:', weeklyResult.scheduleData.length, 'entries');
        //   data = weeklyResult.scheduleData;
        //   isFromPreview = false;
        // } else {
        //   console.log('[WorkoutPlanSection] No data found in either table, looking for template');
        //   
        //   // Strategy 3: Try to find the most recent plan and use it as a template
        //   // Try to find the most recent plan from schedule_preview first
        //   let { data: recentPreviewData, error: recentPreviewError } = await supabase
        //     .from('schedule_preview')
        //     .select('*')
        //     .eq('client_id', numericClientId)
        //     .eq('type', 'workout')
        //     .order('for_date', { ascending: false })
        //     .limit(1);
        //   
        //   if (!recentPreviewError && recentPreviewData && recentPreviewData.length > 0) {
        //     console.log('[WorkoutPlanSection] Found recent plan in schedule_preview, using as template');
        //     data = recentPreviewData;
        //     isFromPreview = true;
        //     setIsDraftPlan(true);
        //   } else {
        //     // Only fallback to schedule if no preview data exists
        //     console.log('[WorkoutPlanSection] No recent preview data, checking schedule table as fallback');
        //     let { data: recentScheduleData, error: recentScheduleError } = await supabase
        //       .from('schedule')
        //       .select('*')
        //       .eq('client_id', numericClientId)
        //       .eq('type', 'workout')
        //       .order('for_date', { ascending: false })
        //       .limit(1);
        //     
        //     if (!recentScheduleError && recentScheduleData && recentScheduleData.length > 0) {
        //       console.log('[WorkoutPlanSection] Found recent plan in schedule, using as template');
        //       data = recentScheduleData;
        //       isFromPreview = false;
        //       setIsDraftPlan(false);
        //     }
        //   }
        // }
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
      
      // If we used a template plan, show a helpful message
      if (data.length > 0 && data[0].for_date !== startDateStr) {
        const templateDate = format(new Date(data[0].for_date), 'MMM d, yyyy');
        const currentDate = format(planStartDate, 'MMM d, yyyy');
        
        updateWorkoutPlanState({
          status: 'template',
          source: 'template',
          templateDate: data[0].for_date
        });
        
        toast({
          title: 'Template Plan Loaded',
          description: `Showing plan from ${templateDate} as template for ${currentDate}. You can generate a new plan for this date.`,
          action: (
            <Button
              onClick={() => handleGenerateSearchPlan()}
              size="sm"
              className="mt-2 bg-green-600 hover:bg-green-700"
            >
              Generate New Plan
            </Button>
          )
        });
      } else if (data.length > 0) {
        // Use the data we already have to determine status instead of making another database call
        const hasScheduleData = data.some(item => item.is_approved === true);
        if (hasScheduleData) {
          setPlanApprovalStatus('approved');
          setIsDraftPlan(false);
          updateWorkoutPlanState({
            status: 'approved',
            source: 'database'
          });
        } else {
          setPlanApprovalStatus('not_approved');
          setIsDraftPlan(true);
          updateWorkoutPlanState({
            status: 'draft',
            source: 'generated'
          });
        }
      } else {
        updateWorkoutPlanState({
          status: 'no_plan',
          source: 'database'
        });
        
        // Update legacy status for compatibility
        setPlanApprovalStatus('pending');
        setIsDraftPlan(false);
      }
    }
    } catch (error: any) {
      toast({ title: 'Error fetching plan', description: error.message, variant: 'destructive' });
      setWorkoutPlan(null);
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
      setIsFetchingPlan(false);
      clearLoading();
    }
  };

  // Debounced save function for autosaving inline edits
  const debouncedSave = debounce(async (updatedPlan: WeekDay[]) => {
    
    setIsSavingEdits(true);
    const result = await savePlanToSchedulePreview(updatedPlan, numericClientId, planStartDate);
    setIsSavingEdits(false);
    if (result.success) {
      toast({ title: 'Changes saved', description: 'Your edits have been saved to the draft.' });
      // Clear unsaved changes flag
      updateWorkoutPlanState({ 
        hasUnsavedChanges: false, 
        lastSaved: new Date() 
      });
      // Check approval status after saving to update the approve button
      await checkPlanApprovalStatus();
      // DO NOT REFETCH HERE. The local state is the source of truth during editing.
      // fetchPlan(); 
    } else {
      toast({ title: 'Save Failed', description: 'Could not save changes.', variant: 'destructive' });
    }
  }, 1500); // 1.5-second debounce delay

  const handlePlanChange = (updatedWeek: WeekDay[]) => {
    

    
    // Update the state immediately for a responsive UI
    setWorkoutPlan(currentPlan => {
      if (!currentPlan) return null;
      return { ...currentPlan, week: updatedWeek };
    });
    
    // Mark as having unsaved changes
    updateWorkoutPlanState({ hasUnsavedChanges: true });
    
    // Trigger the debounced save
    debouncedSave(updatedWeek);
  };

  const handleImportSuccess = async (weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>, dateRange: { start: string; end: string }) => {
    // Save the imported plan to schedule_preview first
    try {
      console.log('🔄 [Import] Starting import process...');
      
      // Use proper timezone handling for the start date
      const normalizedStartDate = createDateFromString(dateRange.start);
      await savePlanToSchedulePreview(weekData, numericClientId, normalizedStartDate);
      
      console.log('✅ [Import] Data saved to schedule_preview, refreshing UI...');
      
      // FORCE UI REFRESH: Update planStartDate to trigger useEffect
      const newStartDate = new Date(dateRange.start);
      setPlanStartDate(newStartDate);
      
      // Update the workout plan with imported data immediately
      const hasAnyWorkouts = weekData.some(day => day.exercises && day.exercises.length > 0);
      
      const importedWorkoutPlan = {
        week: weekData,
        hasAnyWorkouts: hasAnyWorkouts,
        planStartDate: dateRange.start,
        planEndDate: dateRange.end
      };
      
      setWorkoutPlan(importedWorkoutPlan);
      
      // Set as draft plan since it's imported
      setIsDraftPlan(true);
      
      // Check approval status after importing
      await checkPlanApprovalStatus();
      
      // Update the calendar to show the imported date range
      if (dateRange.start && dateRange.end) {
        // Update the parent component's date state if available
        if (props.onDateChange) {
          props.onDateChange(newStartDate);
        }
      }
      
      console.log('✅ [Import] UI refresh triggered, import complete');
      
      toast({ 
        title: 'Import Successful', 
        description: `Workout plan has been imported for ${dateRange.start} to ${dateRange.end}.` 
      });
      
    } catch (error) {
      console.error('[Import] Error:', error);
      toast({ 
        title: 'Import Warning', 
        description: 'Plan imported but failed to save to database. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Fetch workout plan for client and date
  useEffect(() => {
    console.log('🔄 [useEffect] fetchPlan trigger - client:', numericClientId, 'date:', planStartDate, 'hasAI:', hasAIGeneratedPlan);
    
    if (hasAIGeneratedPlan) {
      console.log('🔄 [useEffect] Skipping fetchPlan due to hasAIGeneratedPlan');
      return;
    }
    
    fetchPlan();
  }, [numericClientId, planStartDate, hasAIGeneratedPlan]); // Removed client?.plan_start_day to prevent infinite loops

  // Reset AI generated plan flag when client or date changes
  useEffect(() => {
    setHasAIGeneratedPlan(false);
  }, [numericClientId, planStartDate]);

  // Handle date changes with unsaved changes protection
  const handleDateChange = async (newDate: Date) => {
    if (workoutPlanState.hasUnsavedChanges) {
      const confirmed = await showConfirmationDialog(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before changing the date?'
      );
      
      if (confirmed) {
        await autoSaveDraft();
      }
    }
    
    // Update the state
    setPlanStartDate(newDate);
    updateWorkoutPlanState({ hasUnsavedChanges: false });
    
    // Persist to localStorage
    if (clientId) {
      localStorage.setItem(`workoutPlanDate_${clientId}`, newDate.toISOString());
    }
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('date', newDate.toISOString().split('T')[0]); // Use YYYY-MM-DD format
    window.history.replaceState({}, '', url.toString());
    
    // Notify parent component if callback exists
    if (props.onDateChange) {
      props.onDateChange(newDate);
    }
  };

  // Clear workout plan when client changes (but not when we have AI data)
  useEffect(() => {
    if (!hasAIGeneratedPlan) {
      console.log('🗑️ Clearing workout plan due to client change');
      setWorkoutPlan(null);
    }
  }, [numericClientId, hasAIGeneratedPlan]);

  // AI generation removed - using search-based generation as default
  /*
  const handleGeneratePlan = async () => {
    setAiError(null); // Clear previous error
    if (!numericClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client.', variant: 'destructive' });
      return;
    }
    
    setLoading('generating', 'Checking provider health...');
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
      clearLoading();
    }
  };
  */

  // Helper to check approval status for the week using unified utility
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [lastApprovalCheck, setLastApprovalCheck] = useState<{viewMode: string, clientId: number, date: string} | null>(null);
  const [forceRefreshKey, setForceRefreshKey] = useState(0); // Add force refresh mechanism
const [isPlanManagementExpanded, setIsPlanManagementExpanded] = useState(false); // Collapsible Plan Management state
  
  // Force refresh function to trigger immediate status update
  const forceRefreshStatus = () => {
    console.log('[forceRefreshStatus] Triggering force refresh...');
    setForceRefreshKey(prev => prev + 1);
    // Clear any cached data to force fresh fetch
    setLastApprovalCheck(null);
    // Trigger immediate status check
    checkPlanApprovalStatus();
  };
  
  const checkPlanApprovalStatus = async () => {
    if (!numericClientId || !planStartDate) return;

    // Create a unique key for this check
    const checkKey = {
      viewMode,
      clientId: numericClientId,
      date: planStartDate.toISOString().split('T')[0]
    };

    // Check if we're already checking the same data (unless it's a force refresh)
    if (isCheckingApproval && forceRefreshKey === 0) {
      console.log('[checkPlanApprovalStatus] Already running, skipping...');
      return;
    }

    // Check if we've already checked this exact combination recently (unless it's a force refresh)
    if (lastApprovalCheck && 
        lastApprovalCheck.viewMode === checkKey.viewMode &&
        lastApprovalCheck.clientId === checkKey.clientId &&
        lastApprovalCheck.date === checkKey.date &&
        forceRefreshKey === 0) {
      console.log('[checkPlanApprovalStatus] Already checked this combination recently, skipping...');
      return;
    }

    setIsCheckingApproval(true);
    setLastApprovalCheck(checkKey);

    try {
      console.log(`[checkPlanApprovalStatus] Checking approval status for ${viewMode} view`);

      let result: WorkoutStatusResult;
      let weekStatusesArray: WeekApprovalStatus[] = [];

      if (viewMode === 'monthly') {
        // For monthly view, get detailed week-by-week status
        const monthlyResult = await checkMonthlyWorkoutStatus(supabase, numericClientId, planStartDate);
        result = monthlyResult;

        // Build week statuses array for UI
        // If no weeklyBreakdown exists, create empty weeks
        if (monthlyResult.weeklyBreakdown && monthlyResult.weeklyBreakdown.length > 0) {
          weekStatusesArray = monthlyResult.weeklyBreakdown.map((weekData, index) => {
            const weekStart = new Date(planStartDate.getTime() + index * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

            // Check if week has draft data that can be approved
            const weekPreviewData = monthlyResult.previewData.filter(day =>
              day.for_date >= format(weekStart, 'yyyy-MM-dd') &&
              day.for_date <= format(weekEnd, 'yyyy-MM-dd')
            );

            const weekScheduleData = monthlyResult.scheduleData.filter(day =>
              day.for_date >= format(weekStart, 'yyyy-MM-dd') &&
              day.for_date <= format(weekEnd, 'yyyy-MM-dd')
            );

            // Can approve if: has preview data AND (no schedule data OR data doesn't match)
            const hasPreviewData = weekPreviewData.length > 0;
            const hasScheduleData = weekScheduleData.length > 0;
            const dataMatches = hasPreviewData && hasScheduleData ?
              compareWorkoutData(weekPreviewData, weekScheduleData) : false;

            const canApprove = hasPreviewData && (!hasScheduleData || !dataMatches);

            return {
              weekNumber: index + 1,
              status: weekData.status === 'partial_approved' ? 'draft' : weekData.status,
              startDate: weekStart,
              endDate: weekEnd,
              canApprove
            };
          });
        } else {
          // No workouts exist at all - create empty weeks
          console.log('[WorkoutPlanSection] No weekly breakdown found, creating empty weeks');
          for (let week = 0; week < 4; week++) {
            const weekStart = new Date(planStartDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

            weekStatusesArray.push({
              weekNumber: week + 1,
              status: 'no_plan',
              startDate: weekStart,
              endDate: weekEnd,
              canApprove: false
            });
          }
        }

        // Update week statuses state
        setWeekStatuses(weekStatusesArray);
      } else {
        // For weekly view, use the existing logic
        result = await checkWeeklyWorkoutStatus(supabase, numericClientId, planStartDate);

        // Calculate week status for weekly view (single week)
        const weekStart = planStartDate;
        const weekEnd = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

        // Check if week has draft data that can be approved
        const weekPreviewData = result.previewData.filter(day =>
          day.for_date >= format(weekStart, 'yyyy-MM-dd') &&
          day.for_date <= format(weekEnd, 'yyyy-MM-dd')
        );

        const weekScheduleData = result.scheduleData.filter(day =>
          day.for_date >= format(weekStart, 'yyyy-MM-dd') &&
          day.for_date <= format(weekEnd, 'yyyy-MM-dd')
        );

        // Can approve if: has preview data AND (no schedule data OR data doesn't match)
        const hasPreviewData = weekPreviewData.length > 0;
        const hasScheduleData = weekScheduleData.length > 0;
        const dataMatches = hasPreviewData && hasScheduleData ?
          compareWorkoutData(weekPreviewData, weekScheduleData) : false;

        const canApprove = hasPreviewData && (!hasScheduleData || !dataMatches);

        // Set single week status for weekly view
        setWeekStatuses([{
          weekNumber: 1,
          status: result.status === 'partial_approved' ? 'draft' : result.status,
          startDate: weekStart,
          endDate: weekEnd,
          canApprove
        }]);
      }

      console.log('[checkPlanApprovalStatus] Status result:', result);
      
      // Map the result to legacy state variables for compatibility
      switch (result.status) {
        case 'approved':
          setPlanApprovalStatus('approved');
          setIsDraftPlan(false);
          updateWorkoutPlanState({
            status: 'approved',
            source: result.source
          });
          break;
        case 'draft':
          setPlanApprovalStatus('not_approved');
          setIsDraftPlan(true);
          updateWorkoutPlanState({
            status: 'draft',
            source: result.source
          });
          break;
        case 'partial_approved':
          setPlanApprovalStatus('partial_approved');
          setIsDraftPlan(true);
          updateWorkoutPlanState({
            status: 'draft',
            source: result.source
          });
          break;
        case 'no_plan':
        default:
          setPlanApprovalStatus('pending');
          setIsDraftPlan(false);
          updateWorkoutPlanState({
            status: 'no_plan',
            source: result.source
          });
          break;
      }
      
      console.log('[checkPlanApprovalStatus] Final status:', result.status, 'source:', result.source);
      
    } catch (error) {
      console.error('Error checking approval status:', error);
      setPlanApprovalStatus('pending');
      updateWorkoutPlanState({
        status: 'no_plan',
        source: 'database'
      });
    } finally {
      setIsCheckingApproval(false);
      // Reset force refresh key after successful check
      if (forceRefreshKey > 0) {
        setForceRefreshKey(0);
      }
    }
  };

  // Handle individual week approval for monthly view
  const handleApproveWeek = async (weekIndex: number) => {
    if (!weekStatuses[weekIndex] || !weekStatuses[weekIndex].canApprove) return;

    const weekStatus = weekStatuses[weekIndex];

    try {
      setLoading('approving', `Approving Week ${weekStatus.weekNumber}...`);

      // Call the approveWeek function
      const result = await approveWeek(numericClientId, weekStatus.startDate, weekStatus.weekNumber);

      if (result.success) {
        toast({
          title: `Week ${weekStatus.weekNumber} Approved`,
          description: 'The workout week has been approved and saved to the main schedule.',
          variant: 'default'
        });

        // Update the week status locally
        setWeekStatuses(prev => prev.map((week, idx) =>
          idx === weekIndex
            ? { ...week, status: 'approved', canApprove: false }
            : week
        ));

        // Refresh approval status to ensure consistency
        await checkPlanApprovalStatus();

      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || 'Could not approve week.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[handleApproveWeek] Error:', error);
      toast({
        title: 'Approval Failed',
        description: 'An unexpected error occurred during approval.',
        variant: 'destructive'
      });
    } finally {
      clearLoading();
    }
  };

  // Re-check approval status whenever plan, client, date, or view mode changes
  // Removed workoutPlanState.status from dependencies to prevent infinite loop
  useEffect(() => {
    if (numericClientId && planStartDate) {
      // Add a small delay to prevent rapid successive calls when viewMode changes
      const timeoutId = setTimeout(() => {
        checkPlanApprovalStatus();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [numericClientId, planStartDate, viewMode]); // Removed workoutPlan from dependencies to prevent loops

  // Load date from localStorage when clientId changes
  useEffect(() => {
    if (clientId) {
      const storedDate = localStorage.getItem(`workoutPlanDate_${clientId}`);
      if (storedDate) {
        try {
          const parsedDate = new Date(storedDate);
          if (!isNaN(parsedDate.getTime())) {
            setPlanStartDate(parsedDate);
          }
        } catch (error) {
          // Silent fallback
        }
      }
    }
  }, [clientId]);

  // Monthly generation callbacks
  const handleMonthlyGenerationComplete = (monthlyPlan: any) => {
    console.log('✅ Monthly plan generation completed:', monthlyPlan);
    console.log('📊 Monthly plan structure:', {
      totalWeeks: monthlyPlan.weeks?.length || 0,
      weeksWithPlans: monthlyPlan.weeks?.filter((w: any) => w.plan)?.length || 0
    });

    // Convert monthly plan to weekly format for display
    const firstWeek = monthlyPlan.weeks?.[0];
    if (firstWeek && firstWeek.plan && firstWeek.plan.days) {
      console.log('📅 Setting first week for display:', {
        weekNumber: firstWeek.weekNumber,
        daysCount: firstWeek.plan.days.length,
        startDate: firstWeek.startDate,
        endDate: firstWeek.endDate
      });

      const newWorkoutPlan = {
        week: firstWeek.plan.days,
        hasAnyWorkouts: firstWeek.plan.days.some((day: any) => day.exercises && day.exercises.length > 0),
        planStartDate: firstWeek.startDate,
        planEndDate: firstWeek.endDate
      };

      setWorkoutPlan(newWorkoutPlan);
      setHasAIGeneratedPlan(true);
    } else {
      console.warn('⚠️ No valid first week found in monthly plan');
    }

    // Store the full monthly plan for later use
    if (monthlyPlan.weeks) {
      const monthlyWeeks = monthlyPlan.weeks.map((week: any) => week.plan?.days || []);
      setMonthlyData(monthlyWeeks);
      console.log('💾 Stored monthly data with', monthlyWeeks.length, 'weeks');
    }

    toast({
      title: 'Monthly Plan Generated',
      description: '4-week progressive workout plan created and saved successfully.'
    });

    setIsMonthlyGeneratorOpen(false);
  };

  const handleMonthlyGenerationError = (error: string) => {
    console.error('❌ Monthly plan generation failed:', error);
    toast({
      title: 'Monthly Generation Failed',
      description: error,
      variant: 'destructive'
    });
    setIsMonthlyGeneratorOpen(false);
  };

  // Search-based generation handler
  const handleGenerateSearchPlan = async () => {
    setAiError(null); // Clear previous error
    if (!numericClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client.', variant: 'destructive' });
      return;
    }

    // Check if we're in monthly mode - if so, show the monthly generator modal
    if (viewMode === 'monthly') {
      console.log('📅 Monthly mode detected - opening monthly generator modal');
      setIsMonthlyGeneratorOpen(true);
      return;
    }

    console.log('🔄 === SEARCH-BASED GENERATION START ===');
    console.log('🔄 Client ID:', numericClientId);
    console.log('🔄 Plan Start Date:', planStartDate.toISOString());
    console.log('🔄 Current loading states:', { isGenerating, isGeneratingSearch });

    setLoading('generating', 'Starting search-based workout generation... This may take up to 60 seconds.');
    setIsGeneratingSearch(true);
    
    // Add timeout protection to prevent infinite loading
    // Increased from 30 seconds to 65 seconds to match search-based generator timeout
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Search-based workout generation timeout - forcing reset');
      setIsGeneratingSearch(false);
      setAiError('Generation timed out. Please try again.');
      toast({ title: 'Generation Timeout', description: 'The operation took too long. Please try again.', variant: 'destructive' });
    }, 65000); // 65 second timeout
    
    try {
      console.log('🚀 Starting search-based workout plan generation...');
      
      // Update loading message to show progress
      setLoading('generating', 'Analyzing client data and generating personalized workout plan...');
      
      // Use the search-based workout generator with timeout protection
      const generationPromise = EnhancedWorkoutGenerator.generateWorkoutPlan(
        numericClientId,
        planStartDate
      );
      
      // Race against timeout - increased to 60 seconds to match search-based generator
      let result = await Promise.race([
        generationPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Generation timeout')), 60000)
        )
      ]) as {
        success: boolean;
        workoutPlan?: any;
        message?: string;
        progressionConfirmation?: boolean;
      };
      
      // Clear the main timeout since generation completed
      clearTimeout(timeoutId);
      
      console.log('✅ Generation completed successfully:', result);
      
      // Update loading message to show completion
      setLoading('generating', 'Finalizing workout plan...');
      
      // Add additional validation
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid generation result received');
      }
      
      // Check if progression reset is needed or if we need to retry
      if (!result.success) {
        if (result.progressionConfirmation === false) {
          // This is a normal case for new clients with no previous workout data
          console.log('ℹ️ No previous workout data found - using baseline template');
        } else {
          console.log('⚠️ Generation failed, attempting retry...');
        }
        
        // Try again - the search-based generator should handle this gracefully now
        const retryPromise = EnhancedWorkoutGenerator.generateWorkoutPlan(
          numericClientId,
          planStartDate
        );
        
        // Retry with same timeout
        const retryResult = await Promise.race([
          retryPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Retry generation timeout')), 60000)
          )
        ]) as {
          success: boolean;
          workoutPlan?: any;
          message?: string;
          progressionConfirmation?: boolean;
        };
        
        if (!retryResult.success) {
          throw new Error(retryResult.message || 'Failed to generate plan after retry');
        }
        
        result = retryResult;
      }
      
      if (result.success && result.workoutPlan) {
        toast({ title: 'Search-Based Workout Plan Generated', description: 'The new plan is ready for review.' });
        
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
        
        // Immediately save to schedule_preview with timeout protection
        console.log('[DEBUG] Calling savePlanToSchedulePreview...');
        try {
          const savePromise = savePlanToSchedulePreview(week, numericClientId, planStartDate);
          const saveResult = await Promise.race([
            savePromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Save timeout')), 10000)
            )
          ]) as { success: boolean; message?: string };
          
          if (!saveResult.success) {
            console.warn('⚠️ Failed to save plan to schedule_preview, but continuing...');
            toast({ title: 'Warning', description: 'Plan generated but failed to save to preview. You can still approve it.', variant: 'default' });
          } else {
            setIsDraftPlan(true);
          }
        } catch (saveError) {
          console.warn('⚠️ Save to preview failed:', saveError);
          toast({ title: 'Warning', description: 'Plan generated but failed to save to preview. You can still approve it.', variant: 'default' });
        }
        
        // Refresh approval status after generating and saving plan with timeout protection
        try {
          console.log('[DEBUG] Triggering approval status check after plan generation...');
          const approvalPromise = checkPlanApprovalStatus();
          await Promise.race([
            approvalPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Approval check timeout')), 5000)
            )
          ]);
          console.log('[DEBUG] Approval status check completed after plan generation');
        } catch (approvalError) {
          console.warn('⚠️ Approval status check failed:', approvalError);
          // Don't show error to user for this non-critical operation
        }
        
        console.log('✅ === ENHANCED GENERATION COMPLETE ===');
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ Enhanced workout generation error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        clientId: numericClientId,
        planStartDate: planStartDate?.toISOString()
      });
      
      // Clear the timeout since we're handling the error
      clearTimeout(timeoutId);
      
      // Set appropriate error message based on error type
      let errorMessage = 'Enhanced workout generation failed. Please try again.';
      if (error.message?.includes('timeout')) {
        errorMessage = 'Enhanced workout generation timed out. The AI service may be experiencing high load. Please try again in a few moments.';
      } else if (error.message?.includes('Failed to fetch client data')) {
        errorMessage = 'Unable to fetch client data. Please check your connection and try again.';
      } else if (error.message?.includes('Failed to fetch exercises')) {
        errorMessage = 'Unable to fetch exercise database. Please try again.';
      } else if (error.message?.includes('Invalid generation result')) {
        errorMessage = 'The workout generator returned an invalid response. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAiError(errorMessage);
      toast({ 
        title: 'Enhanced Workout Generation Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      // Always ensure loading state is reset
      console.log('🔄 Resetting generation loading state');
      setIsGeneratingSearch(false);
      clearTimeout(timeoutId);
      clearLoading();
      console.log('🔄 === ENHANCED GENERATION END ===');
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
              <Brain className="h-4 w-4 text-blue-500" />
              AI-powered workout planning and exercise tracking
            </p>
          </div>
        </div>


      </div>

      {/* Step-by-Step Workflow */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 shadow-xl">
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Workout Plan Workflow
        </h4>
        
        {/* Step 1: Plan Configuration (Combined Date + View Mode) */}
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </div>
            <div>
              <h5 className="text-lg font-bold text-blue-900 dark:text-blue-100">Plan Configuration</h5>
              <p className="text-sm text-blue-700 dark:text-blue-300">Select your plan start date and duration</p>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Date Picker */}
            <div className="flex items-center gap-3">
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
                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                  <Calendar
                    mode="single"
                    selected={planStartDate}
                    // Disable all dates that are not the client's plan start day
                    disabled={(date: Date) => {
                      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      const clientPlanStartDay = client?.plan_start_day || 'Sunday';
                      return weekdays[date.getDay()] !== clientPlanStartDay;
                    }}
                    onSelect={(date) => {
                      if (!date) return;
                      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                      const clientPlanStartDay = client?.plan_start_day || 'Sunday';
                      if (weekdays[date.getDay()] === clientPlanStartDay) {
                        handleDateChange(date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('weekly')}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                7 Days
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('monthly')}
                className="text-xs"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                Monthly
              </Button>
            </div>
          </div>
          
          {/* Warning message for past dates */}
          {isPastDate(planStartDate) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  Past date selected. Please choose a future date to generate a workout plan.
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Step 2: Generate Workout Plan */}
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <div>
              <h5 className="text-lg font-bold text-green-900 dark:text-green-100">Generate Plan</h5>
              <p className="text-sm text-green-700 dark:text-green-300">Create your workout plan using AI-powered exercise selection</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Primary Search-based generation button */}
            <Button
              onClick={handleGenerateSearchPlan}
              disabled={loadingState.type !== null || !numericClientId || isPastDate(planStartDate)}
              size="lg"
              className={`bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[220px] ${
                isPastDate(planStartDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isPastDate(planStartDate) ? 'Cannot generate plan for past dates' : `Generate ${viewMode === 'monthly' ? 'monthly' : 'optimized'} workout plan using smart exercise selection`}
            >
              {loadingState.type === 'generating' ? (
                <>
                  <Search className="h-5 w-5 mr-3 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-3" />
                  {viewMode === 'monthly' ? 'Generate Monthly Plan' : 'Generate Workout Plan'}
                </>
              )}
            </Button>
            
            {/* Manual reset button for stuck states */}
            {loadingState.type && (
              <Button
                onClick={() => {
                  console.log('🔄 Manual reset triggered by user');
                  clearLoading();
                  setAiError(null);
                  toast({ title: 'Reset Complete', description: 'Operation has been cancelled.', variant: 'default' });
                }}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>



        {/* Step 3: Approve Current Plan */}
        {(planApprovalStatus === 'not_approved' || planApprovalStatus === 'partial_approved') && isDraftPlan && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                3
              </div>
              <div>
                <h5 className="text-lg font-bold text-green-900 dark:text-green-100">Approve Plan</h5>
                <p className="text-sm text-green-700 dark:text-green-300">Approve your draft plan to save it to the main schedule</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={async () => {
                  const planType = viewMode === 'monthly' ? 'monthly' : 'weekly';
                  setLoading('approving', `Approving ${planType} plan...`);
                  setIsApproving(true);
                  
                  try {
                    // Add a timeout to prevent hanging
                    const approvalPromise = approvePlan(numericClientId, planStartDate, viewMode);
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Approval timeout after 30 seconds')), 30000)
                    );
                    
                    const result = await Promise.race([approvalPromise, timeoutPromise]) as { success: boolean; error?: string };
                    
                    if (result.success) {
                      const planType = viewMode === 'monthly' ? 'monthly' : 'weekly';
                      toast({ 
                        title: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Approved`, 
                        description: `The ${planType} workout plan has been approved and saved to the main schedule.`, 
                        variant: 'default' 
                      });
                      
                      // Update state immediately
                      setIsDraftPlan(false);
                      updateWorkoutPlanState({
                        status: 'approved',
                        source: 'database',
                        hasUnsavedChanges: false,
                        lastSaved: new Date()
                      });
                      
                      // Refresh approval status to ensure consistency
                      await checkPlanApprovalStatus();
                      
                      // Refresh the plan data to show approved version
                      await fetchPlan();
                    } else {
                      toast({ title: 'Approval Failed', description: result.error || 'Could not approve plan.', variant: 'destructive' });
                    }
                  } catch (error) {
                    console.error('[Approval] Error:', error);
                    toast({ title: 'Approval Failed', description: 'An unexpected error occurred during approval.', variant: 'destructive' });
                  } finally {
                    setIsApproving(false);
                    clearLoading();
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
                    ✅ Approve Current Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Plan Management */}
      {(workoutPlan?.hasAnyWorkouts || availableTemplates.length > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100">Plan Management</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">Import, export, or save your workout plans</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPlanManagementExpanded(!isPlanManagementExpanded)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {isPlanManagementExpanded ? 'Hide Options' : 'More Options'}
              {isPlanManagementExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Collapsible Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isPlanManagementExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
              <div className="flex flex-wrap items-center gap-4">
                {/* Import Button - Always available */}
                <WorkoutImportButton
                  clientId={numericClientId}
                  clientName={client?.name}
                  planStartDate={planStartDate}
                  onImportSuccess={handleImportSuccess}
                  disabled={isGenerating}
                  className="bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 hover:text-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-2"
                  clientWorkoutDays={parsedWorkoutDays}
                />
                
                {/* Export Button - Only show when there's workout data */}
                {workoutPlan && workoutPlan.hasAnyWorkouts && (
                  <WorkoutExportButton
                    weekData={getTableData()}
                    clientId={numericClientId}
                    planStartDate={planStartDate}
                    clientName={client?.name}
                    disabled={isGenerating}
                    className="bg-white hover:bg-green-50 border-2 border-green-300 text-green-700 hover:text-green-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-2"
                    viewMode={viewMode}
                  />
                )}
                
                {/* Save Plan for Future Button - Only show when there's workout data */}
                {workoutPlan && workoutPlan.hasAnyWorkouts && (
                  <Button 
                    variant="outline" 
                    size="default"
                    className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-bold px-6 py-2 transform hover:scale-105"
                    onClick={() => { 
                      setTemplateTags([]); 
                      setTemplateTagInput(''); 
                      setTemplateDuration('7day'); // Default to 7-day
                      setIsSaveTemplateOpen(true); 
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" /> 
                    Save Plan for Future
                  </Button>
                )}

                {/* Import Plan Template Button */}
                <Button 
                  variant="outline" 
                  size="default"
                  className="bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-bold px-6 py-2 transform hover:scale-105"
                  onClick={() => { 
                    setIsImportTemplateOpen(true);
                    loadAvailableTemplates();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" /> 
                  Import Plan Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <Card className="flex flex-col items-center justify-center p-6 text-center bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700">
            <div className="flex items-center gap-3 mb-3">
              <Bug className="h-6 w-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Generation Error</h3>
            </div>
            <p className="text-red-600 dark:text-red-300 mb-4 max-w-md">{aiError}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setAiError(null);
                  console.log('🔄 User cleared error - ready to retry');
                }}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
              >
                Dismiss
              </Button>
              <Button
                onClick={() => {
                  setAiError(null);
                  handleGenerateSearchPlan();
                }}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
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
                  {viewMode === 'monthly' ? '28-Day' : '7-Day'} Workout Plan: {format(planStartDate, "MMM d")} - {format(new Date(planStartDate.getTime() + (viewMode === 'monthly' ? 27 : 6) * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                </h3>
              </div>
              <WeeklyPlanHeader
                week={workoutPlan.week}
                planStartDate={planStartDate}
                onReorder={handlePlanChange}
                onPlanChange={handlePlanChange}
                clientId={numericClientId}
                onViewModeChange={setViewMode}
                onMonthlyDataChange={setMonthlyData}
                              onApprovalStatusCheck={checkPlanApprovalStatus}
              onForceRefreshStatus={forceRefreshStatus}
              weekStatuses={weekStatuses}
              onApproveWeek={handleApproveWeek}
              />
            </Card>

            {/* Save Plan Template Modal */}
            <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Save Workout Plan Template</DialogTitle>
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
                    <Label>Plan Duration</Label>
                    <Select value={templateDuration} onValueChange={(value: '7day' | '30day') => setTemplateDuration(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7day">7-Day Plan (1 Week)</SelectItem>
                        <SelectItem value="30day">30-Day Plan (4 Weeks)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {templateDuration === '30day' 
                        ? 'Saves 4 weeks of workout data (28 days total)'
                        : 'Saves 1 week of workout data (7 days total)'
                      }
                    </p>
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
                      {isSavingTemplate ? 'Saving...' : `Save ${templateDuration === '30day' ? '30-Day' : '7-Day'} Template`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Workout Plan Table */}
            {workoutPlan.hasAnyWorkouts ? (
              <WorkoutPlanTable 
                week={getTableData()}
                clientId={numericClientId}
                onPlanChange={handlePlanChange}
                planStartDate={planStartDate}
                clientName={client?.name}
                onImportSuccess={handleImportSuccess}
                viewMode={viewMode}
              />
            ) : (
              <Card className="flex flex-col items-center justify-center p-8 text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <CalendarDays className="h-8 w-8 text-gray-400" />
                    <h3 className="text-lg font-semibold">No Workout Plans Available</h3>
                  </div>
                  <p className="text-muted-foreground max-w-md">
                    No workout plans found for the week of {format(planStartDate, "MMM d, yyyy")}. 
                    This could be because no plan has been generated for this date range yet.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleGenerateSearchPlan}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700"
                    >
                      {isGenerating ? (
                        <>
                          <Search className="h-4 w-4 mr-2 animate-spin" />
                          Generating Plan...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Generate Workout Plan
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleGenerateSearchPlan} 
                      disabled={isGeneratingSearch} 
                      variant="outline"
                    >
                      {isGeneratingSearch ? (
                        <>
                          <Search className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          {viewMode === 'monthly' ? 'Monthly SearchBased Plan' : 'SearchBased'}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('[WorkoutPlanSection] Manual refresh triggered');
                        fetchPlan();
                      }} 
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                  {isFetchingPlan && (
                    <p className="text-sm text-muted-foreground">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin inline" />
                      Checking for plans...
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Template JSON Popup */}
            <Dialog open={isTemplatePreviewOpen} onOpenChange={setIsTemplatePreviewOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    {templateDuration === '30day' ? '30-Day' : '7-Day'} Plan Template (JSON)
                  </DialogTitle>
                </DialogHeader>
                <div className="text-xs whitespace-pre-wrap break-words max-h-[70vh] overflow-auto">
                  {generatedTemplateJson ? JSON.stringify(generatedTemplateJson, null, 2) : ''}
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setIsTemplatePreviewOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Plan Template Modal */}
            <Dialog open={isImportTemplateOpen} onOpenChange={setIsImportTemplateOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Import Plan Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Template</Label>
                    {isLoadingTemplates ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading templates...</span>
                      </div>
                    ) : availableTemplates.length === 0 ? (
                      <div className="p-3 border rounded-md text-center text-sm text-muted-foreground">
                        No templates available. Save a plan first to create templates.
                      </div>
                    ) : (
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{template.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {template.template_json?.duration === '30day' ? '30-Day' : '7-Day'} • 
                                  {template.tags?.length > 0 ? ` ${template.tags.join(', ')}` : ' No tags'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(templateImportStartDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={templateImportStartDate}
                          onSelect={(date) => date && setTemplateImportStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">
                      Template exercises will be mapped to your workout days starting from this date.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Workout Days</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Your workout days: {parsedWorkoutDays?.join(', ') || 'None specified'}
                    </p>
                    {/* Debug information */}
                    <p className="text-xs text-gray-500 mt-1">
                      Debug: client?.workout_days = {JSON.stringify(client?.workout_days)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Debug: parsedWorkoutDays = {JSON.stringify(parsedWorkoutDays)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Debug: client?.client_id = {client?.client_id}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsImportTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImportTemplate} 
                    disabled={!selectedTemplateId || isImportingTemplate}
                  >
                    {isImportingTemplate ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Template'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Monthly Plan Generator Modal */}
            <MonthlyPlanGenerator
              isOpen={isMonthlyGeneratorOpen}
              onClose={() => setIsMonthlyGeneratorOpen(false)}
              clientId={numericClientId || 0}
              planStartDate={planStartDate}
              onGenerationComplete={handleMonthlyGenerationComplete}
              onGenerationError={handleMonthlyGenerationError}
              onSaveWeek={savePlanToSchedulePreview}
            />
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
          isSummarizingNotes: props.isSummarizingNotes || false,
          setLastAIRecommendation: props.setLastAIRecommendation || (() => {})
        }}
      />
    </div>
  );
};

export default WorkoutPlanSection; 