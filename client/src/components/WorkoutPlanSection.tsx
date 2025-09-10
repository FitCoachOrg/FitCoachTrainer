"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import WeekExerciseModal from '@/components/ExerciseModals/WeekExerciseModal';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, addWeeks, addDays } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkoutPlanTable } from './WorkoutPlanTable';
import type { Exercise as TableExercise, WeekDay as TableWeekDay } from './WorkoutPlanTable';
import WeeklyPlanHeader from './WeeklyPlanHeader';
import MonthlyPlanGenerator from './MonthlyPlanGenerator';
import { UnifiedApprovalButton } from './UnifiedApprovalButton';
import { StateMachineApprovalButton } from './StateMachineApprovalButton';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for universal UUID generation
import { useApproveButtonState } from '@/hooks/useApproveButtonState';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';
import { ToastContainer } from '@/components/ui/ToastContainer';
import WorkoutExportButton from './WorkoutExportButton';
import WorkoutImportButton from './WorkoutImportButton';
import { normalizeDateForStorage, createDateFromString } from '../lib/date-utils';
import { RequestLogger, loggedOperation, loggedStateUpdate } from '@/utils/requestLogger';
import ErrorBoundary from './ErrorBoundary';
import RequestDeduplication from '@/utils/requestDeduplication';
import { useUnifiedRefresh } from '@/hooks/useUnifiedRefresh';
import { RefreshIndicator, ErrorRecovery } from '@/components/RefreshIndicator';
import { useWorkoutPlanOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import { OfflineIndicator, OfflineStatusBadge } from '@/components/OfflineIndicator';
import offlineManager from '@/utils/offlineManager';
import { generateSearchBasedWorkoutPlanForReview, warmupExerciseCache } from "@/lib/search-based-workout-plan"
import { SimpleWorkoutGenerator } from "@/lib/simple-workout-generator"
import { EnhancedWorkoutGenerator } from "@/lib/enhanced-workout-generator"
import { 
  checkWeeklyWorkoutStatus, 
  checkMonthlyWorkoutStatus, 
  getStatusDisplay,
  type WorkoutStatusResult 
} from '@/utils/workoutStatusUtils';
import useUnifiedWorkoutData from '@/hooks/useUnifiedWorkoutData';

// Types imported from WorkoutPlanTable to ensure consistency
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

interface WeeklyWorkoutPlan {
  week: TableWeekDay[];
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

// Unified approval status interface for consistent button logic
interface UnifiedApprovalStatus {
  global: {
    canApprove: boolean;
    status: 'approved' | 'draft' | 'no_plan' | 'partial_approved' | 'pending';
    hasUnsavedChanges: boolean;
    message: string;
  };
  weeks: WeekApprovalStatus[];
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
            
            setAiWorkoutPlan(cleanedWorkoutPlan)
          }
        }
      } catch (error) {
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
    setAiWorkoutPlan([...aiWorkoutPlan, newWorkout])
  }

  const removeWorkout = (index: number) => {
    const updatedPlan = aiWorkoutPlan.filter((_, i) => i !== index)
    setAiWorkoutPlan(updatedPlan)
  }

  const saveChanges = () => {
    setIsEditing(false)
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
                        Accept AI Plan
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
                                    /* title="Enter number or range (e.g., 10 or 8-12)" */
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



// Import centralized exercise normalization utility
import { normalizeExercise } from '@/utils/exerciseNormalization';
// ---

// Helper to build the payload for schedule_preview
function buildSchedulePreviewRows(planWeek: TableWeekDay[], clientId: number, for_time: string, workout_id: string) {
  // Validate input parameters
  if (!planWeek || !Array.isArray(planWeek)) {
    console.error('[buildSchedulePreviewRows] ❌ Invalid planWeek data:', planWeek);
    return [];
  }
  
  if (!clientId || !for_time || !workout_id) {
    console.error('[buildSchedulePreviewRows] ❌ Missing required parameters:', {
      clientId, for_time, workout_id
    });
    return [];
  }
  
  console.log('[buildSchedulePreviewRows] 🔍 Input data:', {
    planWeekLength: planWeek?.length || 0,
    planWeekData: planWeek?.map(day => ({
      date: day.date,
      focus: day.focus,
      exercisesCount: day.exercises?.length || 0,
      hasExercises: !!(day.exercises && day.exercises.length > 0)
    }))
  });
  
  // ✅ FIXED: Process ALL days, not just those with exercises
  // This ensures rest days and days with empty exercises are also saved
  const processedRows = planWeek.map((day) => {
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
  
  console.log('[buildSchedulePreviewRows] 📊 Output data:', {
    processedRowsLength: processedRows.length,
    processedRowsData: processedRows.map(row => ({
      date: row.for_date,
      summary: row.summary,
      exercisesCount: row.details_json?.exercises?.length || 0
    }))
  });
  
  return processedRows;
}


// Perform the actual approval with UPSERT operation
async function approvePlanWithUpsert(clientId: number, planStartDate: Date, viewMode: 'weekly' | 'monthly' = 'weekly') {
  const startTime = performance.now();
  
  try {
    // 1. Get the date range based on view mode
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const daysToAdd = viewMode === 'monthly' ? 27 : 6; // 28 days for monthly (0-27), 7 days for weekly (0-6)
    const endDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
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
      
      if (fetchError) {
        return { success: false, error: fetchError.message };
      }
      
      previewRows = data || [];
    } catch (fetchException) {
      return { success: false, error: `Fetch exception: ${fetchException}` };
    }
    
    if (previewRows.length === 0) {
      return { success: false, error: 'No draft plan found to approve.' };
    }

    // 3. Prepare rows for UPSERT (remove id, created_at, is_approved fields)
    const rowsToUpsert = previewRows.map(({ id, created_at, is_approved, ...rest }: any) => rest);
    
    // 4. Perform UPSERT operation
    try {
      const upsertStart = performance.now();
      const { error: upsertError } = await supabase
        .from('schedule')
        .upsert(rowsToUpsert, { 
          onConflict: 'client_id,for_date,type,task',
          ignoreDuplicates: false 
        });
      const upsertEnd = performance.now();
      
      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } catch (upsertException) {
      return { success: false, error: `Upsert exception: ${upsertException}` };
    }
    
    // 5. Set is_approved=true for all affected days in schedule_preview
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
      
      if (updateError) {
        // Update error - continue with operation
      }
    } catch (updateErr) {
      // Update exception - continue with operation
    }
    
    const endTime = performance.now();
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    return { success: false, error: err.message };
  }
}

// Legacy approvePlan function (kept for backward compatibility)
async function approvePlan(clientId: number, planStartDate: Date, viewMode: 'weekly' | 'monthly' = 'weekly') {
  const startTime = performance.now();
  
  try {
    // 1. Get the date range based on view mode
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const daysToAdd = viewMode === 'monthly' ? 27 : 6; // 28 days for monthly (0-27), 7 days for weekly (0-6)
    const endDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    
    // Show progress for large operations
    if (viewMode === 'monthly') {
      // Large operation - monthly plan approval
    }

    // 2. Check if data already exists in schedule (optimization)
    let scheduleRows: any[] = [];
    try {
      const checkStart = performance.now();
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const checkEnd = performance.now();
      
      if (scheduleError) {
        console.error('[Supabase] Schedule check error:', scheduleError);
        return { success: false, error: scheduleError.message };
      }
      
      scheduleRows = scheduleData || [];
    } catch (checkException) {
      console.error('[Supabase] Schedule check exception:', checkException);
      return { success: false, error: `Schedule check exception: ${checkException}` };
    }

    // 3. If data doesn't exist in schedule, copy from schedule_preview
    if (scheduleRows.length === 0) {
      console.log('[approvePlan] Step 2: No data in schedule, copying from schedule_preview...');
      
      // Fetch all rows from schedule_preview for this client/week/type
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
      
      if (fetchError) {
        return { success: false, error: fetchError.message };
      }
      
      previewRows = data || [];
    } catch (fetchException) {
      return { success: false, error: `Fetch exception: ${fetchException}` };
    }
    
    if (previewRows.length === 0) {
      return { success: false, error: 'No draft plan found to approve.' };
    }

      // Insert the preview rows into schedule (remove id, created_at, is_approved fields)
    const rowsToInsert = previewRows.map(({ id, created_at, is_approved, ...rest }: any) => rest);
    
    try {
      const insertStart = performance.now();
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(rowsToInsert);
      const insertEnd = performance.now();
        console.log('[Supabase] Insert schedule rows:', `${(insertEnd - insertStart).toFixed(2)}ms`, `(${rowsToInsert.length} rows)`);
      
      if (insertError) {
        console.error('[Supabase] Insert error:', insertError);
        return { success: false, error: insertError.message };
      }
    } catch (insertException) {
      console.error('[Supabase] Insert exception:', insertException);
      return { success: false, error: `Insert exception: ${insertException}` };
      }
    } else {
      console.log('[approvePlan] Step 2: Data already exists in schedule, skipping copy operation');
    }
    
    // 4. Set is_approved=true for all affected days in schedule_preview
    console.log('[approvePlan] Step 3: Updating approval status...');
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
      
      if (updateError) {
        // Update error - continue with operation
      }
    } catch (updateErr) {
      // Update exception - continue with operation
    }
    
    const endTime = performance.now();
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
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

    // 2. Check if data already exists in schedule (optimization)
    let scheduleRows: any[] = [];
    try {
      const checkStart = performance.now();
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      const checkEnd = performance.now();
      console.log(`[Supabase] Check schedule rows for Week ${weekNumber}:`, `${(checkEnd - checkStart).toFixed(2)}ms`, `(${scheduleData?.length || 0} rows)`);
      
      if (scheduleError) {
        console.error('[Supabase] Schedule check error:', scheduleError);
        return { success: false, error: scheduleError.message };
      }
      
      scheduleRows = scheduleData || [];
    } catch (checkException) {
      console.error('[Supabase] Schedule check exception:', checkException);
      return { success: false, error: `Schedule check exception: ${checkException}` };
    }

    // 3. If data doesn't exist in schedule, copy from schedule_preview
    if (scheduleRows.length === 0) {
      // Fetch all rows from schedule_preview for this client/week/type
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
        console.log(`[Supabase] Fetch preview rows for Week ${weekNumber}:`, `${(fetchEnd - fetchStart).toFixed(2)}ms`, `(${data?.length || 0} rows)`);

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      previewRows = data || [];
    } catch (fetchException) {
      return { success: false, error: `Fetch exception: ${fetchException}` };
    }

    if (previewRows.length === 0) {
      return { success: false, error: `No draft plan found for Week ${weekNumber} to approve.` };
    }

      // Upsert the preview rows into schedule (remove id, created_at, is_approved fields)
    const rowsToUpsert = previewRows.map(({ id, created_at, is_approved, ...rest }: any) => rest);

    try {
      const upsertStart = performance.now();
      const { error: upsertError } = await supabase
        .from('schedule')
        .upsert(rowsToUpsert, { 
          onConflict: 'client_id,for_date,type,task',
          ignoreDuplicates: false 
        });
      const upsertEnd = performance.now();

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }
    } catch (upsertException) {
      return { success: false, error: `Upsert exception: ${upsertException}` };
    }
    } else {
      // Data already exists in schedule, skipping copy operation
    }

    // 4. Set is_approved=true for all affected days in schedule_preview
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

      if (updateError) {
        // Update error - continue with operation
      }
    } catch (updateErr) {
      // Update exception - continue with operation
    }

    const endTime = performance.now();
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    return { success: false, error: err.message };
  }
}

// Client data cache to avoid repeated database calls
const clientDataCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to clear client cache (useful when client data might have changed)
function clearClientCache(clientId?: number) {
  if (clientId) {
    clientDataCache.delete(clientId);
  } else {
    clientDataCache.clear();
  }
}

// Request deduplication map to prevent concurrent requests
const pendingClientRequests = new Map<string, Promise<{ workout_time: string }>>();

// Helper to get client data with enhanced caching, retry, and fallback
async function getClientData(clientId: number, componentName: string, retryCount = 0): Promise<{ workout_time: string }> {
  console.log(`[${componentName}] 🔄 ENHANCED CLIENT DATA FUNCTION - Attempt ${retryCount + 1} for client ${clientId}`);
  
  // Check cache first with longer duration
  const cached = clientDataCache.get(clientId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[${componentName}] ✅ Using cached client data for client ${clientId}`);
    return cached.data;
  }

  // Request deduplication - prevent concurrent requests for same client
  const requestKey = `client_data_${clientId}`;
  if (pendingClientRequests.has(requestKey)) {
    console.log(`[${componentName}] ⏳ Request already pending for client ${clientId}, waiting...`);
    return pendingClientRequests.get(requestKey)!;
  }

  const operationTimeout = 5000; // Reduced from 8000ms to 5000ms for faster fallback
  const maxRetries = 3; // Increased from 2 to 3
  const clientQueryStartTime = Date.now();
  
  // Create the request promise
  const requestPromise = (async () => {
    try {
      RequestLogger.logDatabaseQuery(
        'client',
        'select',
        componentName,
        {
          clientId,
          filters: { client_id: clientId, select: 'workout_time' },
          startTime: clientQueryStartTime
        }
      );
      
      const clientQueryPromise = supabase
        .from('client')
        .select('workout_time')
        .eq('client_id', clientId)
        .single();
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Client fetch timeout after ${operationTimeout}ms`));
        }, operationTimeout);
      });
      
      const { data: clientData, error: clientError } = await Promise.race([
        clientQueryPromise,
        timeoutPromise
      ]);

      RequestLogger.logDatabaseQuery(
        'client',
        'select',
        componentName,
        {
          clientId,
          filters: { client_id: clientId, select: 'workout_time' },
          startTime: clientQueryStartTime,
          success: !clientError,
          error: clientError?.message,
          resultCount: clientData ? 1 : 0
        }
      );

      if (clientError) {
        // Enhanced error handling with more error types
        if (retryCount < maxRetries && (
          clientError.message.includes('timeout') || 
          clientError.message.includes('network') ||
          clientError.message.includes('connection') ||
          clientError.message.includes('fetch') ||
          clientError.message.includes('aborted')
        )) {
          console.warn(`[${componentName}] Client fetch error, retrying (${retryCount + 1}/${maxRetries}):`, clientError);
          
          // Exponential backoff with jitter
          const baseDelay = 1000 * Math.pow(2, retryCount);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return getClientData(clientId, componentName, retryCount + 1);
        }
        
        console.warn(`[${componentName}] Client fetch error, using fallback:`, clientError);
        // Use fallback data
        const fallbackData = { workout_time: '08:00:00' };
        clientDataCache.set(clientId, { data: fallbackData, timestamp: Date.now() });
        return fallbackData;
      }

      const result = { workout_time: clientData?.workout_time || '08:00:00' };
      
      // Cache the result
      clientDataCache.set(clientId, { data: result, timestamp: Date.now() });
      console.log(`[${componentName}] ✅ Cached client data for client ${clientId}`);
      
      return result;
    } catch (error) {
      // Enhanced timeout handling with more error types
      if (retryCount < maxRetries && error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('aborted')
      )) {
        console.warn(`[${componentName}] Client fetch timeout, retrying (${retryCount + 1}/${maxRetries}):`, error);
        
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return getClientData(clientId, componentName, retryCount + 1);
      }
      
      console.warn(`[${componentName}] Client fetch failed, using fallback:`, error);
      // Use fallback data
      const fallbackData = { workout_time: '08:00:00' };
      clientDataCache.set(clientId, { data: fallbackData, timestamp: Date.now() });
      return fallbackData;
    } finally {
      // Clean up pending request
      pendingClientRequests.delete(requestKey);
    }
  })();

  // Store the promise for deduplication
  pendingClientRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

// Helper to save plan to schedule_preview with timeout protection
async function savePlanToSchedulePreview(planWeek: TableWeekDay[], clientId: number, planStartDate: Date) {
  console.log(`[savePlanToSchedulePreview] 🚀 ENHANCED SAVE FUNCTION - Starting save for client ${clientId}`);
  console.log(`[savePlanToSchedulePreview] 🔍 DEBUG: Input parameters:`, {
    planWeekLength: planWeek?.length || 0,
    clientId,
    planStartDate,
    planWeekData: planWeek?.map((day: any) => ({
      date: day.date,
      focus: day.focus,
      exercisesCount: day.exercises?.length || 0,
      hasExercises: !!(day.exercises && day.exercises.length > 0)
    })) || []
  });
  
  const startTime = performance.now();
  const componentName = 'savePlanToSchedulePreview';
  const operationTimeout = 20000; // Increased to 20 seconds for individual operations to reduce transient timeouts
  
  // Circuit breaker: check for recent save timeouts
  const now = Date.now();
  const lastSaveTimeout = localStorage.getItem('lastSaveTimeout');
  if (lastSaveTimeout && (now - parseInt(lastSaveTimeout)) < 30000) { // 30 second cooldown
    console.log('🔄 [savePlanToSchedulePreview] Circuit breaker active, adding delay...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced to 2 second delay
  }
  
  try {
    // Create timeout promise for individual operations (supports override per attempt)
    const createTimeoutPromise = (operationName: string, timeoutMs: number = operationTimeout) => 
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${operationName} timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

    // Get client data with enhanced error handling
    let clientData;
    try {
      clientData = await getClientData(clientId, componentName);
    } catch (error) {
      console.warn(`[${componentName}] Client data fetch failed, using fallback:`, error);
      clientData = { workout_time: '08:00:00' }; // Fallback data
    }
    
    const for_time = clientData.workout_time;

    // Always use a valid UUID for workout_id
    const workout_id = uuidv4();

    // Build the payload using the helper
    console.log(`[${componentName}] 🔍 DEBUG: Building schedule preview rows with:`, {
      planWeekLength: planWeek?.length || 0,
      clientId,
      for_time,
      workout_id
    });
    
    const rows = buildSchedulePreviewRows(planWeek, clientId, for_time, workout_id);
    
    console.log(`[${componentName}] 🔍 DEBUG: Built rows:`, {
      rowsLength: rows?.length || 0,
      rowsData: rows?.map((row: any) => ({
        client_id: row.client_id,
        type: row.type,
        task: row.task,
        for_date: row.for_date,
        for_time: row.for_time,
        summary: row.summary,
        hasDetailsJson: !!row.details_json,
        exercisesCount: row.details_json?.exercises?.length || 0
      })) || []
    });

    // Get the date range for this week
    const firstDate = planWeek[0]?.date;
    const lastDate = planWeek[planWeek.length - 1]?.date;
    if (!firstDate || !lastDate) {
      return { success: false, error: 'Invalid date range' };
    }

    // Get existing preview data for this client and week with improved error handling
    const fetchStart = performance.now();
    const existingDataQueryStartTime = Date.now();
    console.log(`[${componentName}] 🔍 Fetching existing data for client ${clientId}, dates: ${firstDate} to ${lastDate}`);
    
    RequestLogger.logDatabaseQuery(
      'schedule_preview',
      'select',
      componentName,
      {
        clientId,
        filters: { 
          client_id: clientId, 
          type: 'workout',
          date_range: `${firstDate} to ${lastDate}`
        },
        startTime: existingDataQueryStartTime
      }
    );
    
    let existingData: any[] = [];
    let fetchError: any = null;
    
    try {
      // Use a more targeted query with better performance
      const { data, error } = await supabase
        .from('schedule_preview')
        .select('id, client_id, for_date, type, task, summary, coach_tip, details_json, for_time, icon, is_approved')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', firstDate)
        .lte('for_date', lastDate)
        .order('for_date', { ascending: true });
      
      if (error) {
        console.error(`[${componentName}] ❌ Database query error:`, error);
        fetchError = error;
        // Don't continue if we can't fetch existing data - this indicates a serious issue
        return { success: false, error: `Failed to fetch existing data: ${error.message}` };
      }
      
      existingData = data || [];
      console.log(`[${componentName}] ✅ Fetched ${existingData.length} existing records`);
      
    } catch (dbError) {
      console.error(`[${componentName}] ❌ Database connection error:`, dbError);
      fetchError = dbError;
      // Don't continue if we can't connect to the database
      return { success: false, error: `Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` };
    }
      
    const fetchEnd = performance.now();
    RequestLogger.logDatabaseQuery(
      'schedule_preview',
      'select',
      componentName,
      {
        clientId,
        filters: { 
          client_id: clientId, 
          type: 'workout',
          date_range: `${firstDate} to ${lastDate}`
        },
        startTime: existingDataQueryStartTime,
        success: !fetchError,
        error: fetchError?.message,
        resultCount: existingData?.length || 0
      }
    );
    console.log('[Supabase] Fetch existing data:', `${(fetchEnd - fetchStart).toFixed(2)}ms`);

    if (fetchError) {
      console.warn(`[${componentName}] ⚠️ Existing data fetch error, continuing with empty data:`, fetchError);
      // Continue with empty existing data instead of failing
      // This allows the save operation to proceed even if fetch fails
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

    console.log(`[${componentName}] 📊 Prepared ${recordsToUpdate.length} updates and ${recordsToInsert.length} inserts`);

    // Update existing records with simplified approach
    if (recordsToUpdate.length > 0) {
      const updateStart = performance.now();
      console.log(`[Supabase] Updating ${recordsToUpdate.length} records`);
      
      try {
        // Process updates one by one for better error handling and reliability
        let updateSuccessCount = 0;
        let updateErrors: string[] = [];
        
        for (let i = 0; i < recordsToUpdate.length; i++) {
          const record = recordsToUpdate[i];
          const { id, ...updateData } = record;
          
          try {
            const { error: updateError } = await supabase
              .from('schedule_preview')
              .update(updateData)
              .eq('id', id);
            
            if (updateError) {
              console.error(`[Supabase] ❌ Update error for record ${id}:`, updateError);
              updateErrors.push(`Record ${id}: ${updateError.message}`);
            } else {
              updateSuccessCount++;
            }
          } catch (updateException) {
            console.error(`[Supabase] ❌ Update exception for record ${id}:`, updateException);
            updateErrors.push(`Record ${id}: ${updateException instanceof Error ? updateException.message : 'Unknown error'}`);
          }
          
          // Small delay between updates to prevent database overload
          if (i < recordsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        const updateEnd = performance.now();
        console.log(`[Supabase] Update completed:`, `${(updateEnd - updateStart).toFixed(2)}ms`, `(${updateSuccessCount}/${recordsToUpdate.length} successful)`);
        
        // If any updates failed, return error with details
        if (updateErrors.length > 0) {
          console.error(`[Supabase] ❌ Update failures:`, updateErrors);
          return { success: false, error: `Update failed for ${updateErrors.length} records: ${updateErrors.join(', ')}` };
        }
        
      } catch (error) {
        console.error('[Supabase] Update processing error:', error);
        return { success: false, error: `Update processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    // Insert new records with simplified, more reliable approach
    if (recordsToInsert.length > 0) {
      const insertStart = performance.now();
      console.log(`[Supabase] Inserting ${recordsToInsert.length} records`);
      
      try {
        // Use a single insert operation for better reliability
        const { data: insertData, error: insertError } = await supabase
          .from('schedule_preview')
          .insert(recordsToInsert)
          .select('id'); // Return the inserted IDs for verification
        
        if (insertError) {
          console.error(`[Supabase] ❌ Insert error:`, insertError);
          console.error(`[Supabase] Insert error details:`, {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          console.error(`[Supabase] Sample record being inserted:`, recordsToInsert[0]);
          return { success: false, error: `Insert failed: ${insertError.message}` };
        }
        
        // Verify the insert was successful
        if (!insertData || insertData.length !== recordsToInsert.length) {
          console.error(`[Supabase] ❌ Insert verification failed:`, {
            expected: recordsToInsert.length,
            actual: insertData?.length || 0,
            insertData
          });
          return { success: false, error: `Insert verification failed: expected ${recordsToInsert.length} records, got ${insertData?.length || 0}` };
        }
        
        const insertEnd = performance.now();
        console.log(`[Supabase] ✅ Insert completed successfully:`, `${(insertEnd - insertStart).toFixed(2)}ms`, `(${insertData.length} records)`);
        
      } catch (error) {
        console.error('[Supabase] Insert exception:', error);
        return { success: false, error: `Insert exception: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    // Set is_approved to false for all affected days
    try {
      const approvalStart = performance.now();
      console.log('[Supabase] Updating approval flag');
      
      const { error: approvalError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: false })
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', firstDate)
        .lte('for_date', lastDate);
      
      if (approvalError) {
        console.warn('[Supabase] ⚠️ Approval flag update warning:', approvalError);
        // Don't fail the entire operation for approval flag update, but log it
      } else {
        const approvalEnd = performance.now();
        console.log('[Supabase] ✅ Approval flag updated:', `${(approvalEnd - approvalStart).toFixed(2)}ms`);
      }
    } catch (updateErr) {
      console.warn('[Supabase] ⚠️ Approval update exception:', updateErr);
      // Don't fail the entire operation for approval flag update
    }
    
    // Final verification: Check that our data was actually saved
    try {
      const verifyStart = performance.now();
      console.log('[Supabase] 🔍 Verifying save operation...');
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('schedule_preview')
        .select('id, for_date, type')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', firstDate)
        .lte('for_date', lastDate);
      
      if (verifyError) {
        console.warn('[Supabase] ⚠️ Verification query failed:', verifyError);
      } else {
        const verifyEnd = performance.now();
        console.log(`[Supabase] ✅ Verification completed:`, `${(verifyEnd - verifyStart).toFixed(2)}ms`, `(${verifyData?.length || 0} records found)`);
        
        if (!verifyData || verifyData.length === 0) {
          console.error('[Supabase] ❌ Verification failed: No records found after save operation');
          return { success: false, error: 'Save verification failed: No records found in database' };
        }
        
        // Log the saved dates for debugging
        const savedDates = verifyData.map(record => record.for_date).sort();
        console.log(`[Supabase] ✅ Saved dates:`, savedDates);
      }
    } catch (verifyException) {
      console.warn('[Supabase] ⚠️ Verification exception:', verifyException);
      // Don't fail the operation for verification issues
    }
    
    const endTime = performance.now();
    console.log('[Save Plan] ✅ Total time:', `${(endTime - startTime).toFixed(2)}ms`);
    console.log(`[Save Plan] ✅ Successfully saved ${recordsToInsert.length} inserts and ${recordsToUpdate.length} updates`);
    
    return { success: true };
  } catch (err: any) {
    const endTime = performance.now();
    console.error('[Save Plan] Error:', err, `(${(endTime - startTime).toFixed(2)}ms)`);
    
    // Record timeout for circuit breaker
    if (err.message.includes('timeout')) {
      localStorage.setItem('lastSaveTimeout', Date.now().toString());
    }
    
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
  // FIXED: Don't depend on client object during initialization to prevent errors
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
  
  // WeeklyExerciseModal state
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  
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

  // Unified approval status for consistent button logic
  const [unifiedApprovalStatus, setUnifiedApprovalStatus] = useState<UnifiedApprovalStatus>({
    global: { canApprove: false, status: 'pending', hasUnsavedChanges: false, message: 'Approve Plan' },
    weeks: []
  });

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

  // Approval confirmation dialog state
  const [showApprovalConfirmation, setShowApprovalConfirmation] = useState(false);
  const [pendingApprovalData, setPendingApprovalData] = useState<{
    clientId: number;
    planStartDate: Date;
    viewMode: 'weekly' | 'monthly';
    weekIndex?: number;
    existingDataCount: number;
  } | null>(null);

  // Saving modal state
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');

  // Import Plan Template state
  const [isImportTemplateOpen, setIsImportTemplateOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // State for collapsible client details
  const [showClientDetails, setShowClientDetails] = useState<boolean>(() => {
    // Load from localStorage, default to false (hidden)
    const saved = localStorage.getItem('workout-show-details');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('workout-show-details', JSON.stringify(showClientDetails));
  }, [showClientDetails]);
  const [templateImportStartDate, setTemplateImportStartDate] = useState<Date>(new Date());
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isImportingTemplate, setIsImportingTemplate] = useState(false);

  // Dirty dates tracking for unsaved changes
  const [dirtyDates, setDirtyDates] = useState<Set<string>>(new Set());

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
  
  // Ensure clientId is a number and not undefined
  const numericClientId = clientId ? (typeof clientId === 'string' ? parseInt(clientId) : clientId) : 0;
  
  
  // Monthly view state with localStorage persistence
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>(() => {
    // Try to get viewMode from localStorage, default to 'monthly'
    if (clientId) {
      const savedViewMode = localStorage.getItem(`workoutPlanViewMode_${clientId}`);
      return (savedViewMode as 'weekly' | 'monthly') || 'monthly';
    }
    return 'monthly';
  });
  
  // Add state to control the calendar popover
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState<any[][]>([]);
  
  // UNIFIED DATA FETCHING - TEMPORARILY DISABLED FOR DEBUGGING
  // Single source of truth: schedule_preview table only
  const shouldFetchData = false; // Temporarily disabled
  
  // Temporarily disable unified data fetching to restore functionality
  const unifiedWorkoutData: any = null;
  const isWorkoutDataLoading = false;
  const workoutDataError: any = null;
  const refetchWorkoutData = async () => {};
  const isWorkoutDataStale = false;
  
  // Memoized callback to prevent infinite loops in WeeklyPlanHeader
  const handleMonthlyDataChange = useCallback((data: any[][]) => {
    setMonthlyData(data);
  }, []);
  
  // Persist viewMode changes to localStorage and refresh data when switching modes
  useEffect(() => {
    if (clientId && viewMode) {
      localStorage.setItem(`workoutPlanViewMode_${clientId}`, viewMode);
      
      // Set loading state when switching views
      setIsViewSwitching(true);
      console.log(`[ViewMode] Switching to ${viewMode} view - setting loading state`);
      
      // When switching to monthly view, ensure we have fresh monthly data
      if (viewMode === 'monthly') {
        console.log('[ViewMode] Switching to monthly view - triggering data refresh');
        // Force a refresh of the plan data to ensure monthly view has current data
        setForceRefreshKey(prev => prev + 1);
      }
      
      // Clear loading state after a delay to allow data to load
      const timeoutId = setTimeout(() => {
        setIsViewSwitching(false);
        console.log(`[ViewMode] ${viewMode} view loading complete`);
      }, 2000); // 2 second delay to allow data loading
      
      return () => clearTimeout(timeoutId);
    }
  }, [viewMode, clientId]);
  
  // Enhanced UX functions
  const setLoading = (type: LoadingState['type'], message: string) => {
    setLoadingState({ type, message });
  };



  // Get the appropriate data for the table based on view mode
  const getTableData = () => {
    
    // Use current planStartDate (alignment is handled in useEffect)
    if (!planStartDate || !(planStartDate instanceof Date) || isNaN(planStartDate.getTime())) {
      console.warn('[WorkoutPlanSection] ⚠️ planStartDate is invalid, returning empty array:', planStartDate);
      return [];
    }
    
    // TEMPORARILY DISABLED: Use unified workout data as primary source
    if (false && unifiedWorkoutData && unifiedWorkoutData.days && unifiedWorkoutData.days.length > 0) {
      const totalDays = viewMode === 'monthly' ? 28 : 7;
      const weekDates = [];
      
      for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Find matching data from unified workout data
        const dayData = unifiedWorkoutData.days.find((day: any) => 
          day.date === dateStr
        );
        
        let planDay = {
          date: dateStr,
          focus: 'Rest Day',
          exercises: []
        };
        
        if (dayData && dayData.exercises && dayData.exercises.length > 0) {
          planDay.focus = dayData.focus;
          planDay.exercises = dayData.exercises as any; // Type assertion for compatibility
        }
        
        weekDates.push(planDay);
      }
      
      console.log('[WorkoutPlanSection] ✅ Using unified workout data:', {
        totalDays: unifiedWorkoutData.days.length,
        hasAnyPlans: unifiedWorkoutData.hasAnyPlans,
        viewMode: unifiedWorkoutData.viewMode
      });
      
      return unifiedWorkoutData.days;
    }
    
    // PRIORITY 2: Fallback to original data sources
    if (viewMode === 'monthly' && monthlyData && monthlyData.length > 0) {
      // Flatten the 4 weeks into a single array of 28 days
      const monthlyDataFlat = monthlyData.flat();
      
      // Ensure we have exactly 28 days for monthly view
      if (monthlyDataFlat.length >= 28) {
        return monthlyDataFlat.slice(0, 28);
      } else {
        // Pad with empty days if we don't have enough data
        const paddedMonthlyData = [...monthlyDataFlat];
        for (let i = monthlyDataFlat.length; i < 28; i++) {
          // Use addDays to avoid timezone issues
          const dayDate = addDays(planStartDate, i);
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          paddedMonthlyData.push({
            date: dateStr,
            focus: 'Rest Day',
            exercises: []
          });
        }
        return paddedMonthlyData;
      }
    }
    
    // For weekly view or when monthly data is not available, use workoutPlan.week
    if (workoutPlan && workoutPlan.week && workoutPlan.week.length > 0) {
      return workoutPlan.week;
    }
    
    // Fallback: generate empty data structure
    console.log('[WorkoutPlanSection] 🔍 No data available, generating empty structure');
    const totalDays = viewMode === 'monthly' ? 28 : 7;
    const emptyData = [];
    
    for (let i = 0; i < totalDays; i++) {
      const dayDate = addDays(planStartDate, i);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      emptyData.push({
        date: dateStr,
        focus: 'Rest Day',
        exercises: []
      });
    }
    
    return emptyData;
  };



  const clearLoading = () => {
    setLoadingState({ type: null, message: '' });
  };

  // Check for existing data and show confirmation dialog if needed
  const checkAndApprovePlan = async (clientId: number, planStartDate: Date, viewMode: 'weekly' | 'monthly' = 'weekly', weekIndex?: number) => {
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const daysToAdd = viewMode === 'monthly' ? 27 : 6;
    const endDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    try {
      // Check if data already exists in schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr);
      
      if (scheduleError) {
        console.error('[checkAndApprovePlan] Schedule check error:', scheduleError);
        return { success: false, error: scheduleError.message };
      }
      
      const existingDataCount = scheduleData?.length || 0;
      
      // If data exists, show confirmation dialog
      if (existingDataCount > 0) {
        setPendingApprovalData({
          clientId,
          planStartDate,
          viewMode,
          weekIndex,
          existingDataCount
        });
        setShowApprovalConfirmation(true);
        return { success: true, requiresConfirmation: true };
      }
      
      // No existing data, proceed with approval
      return await approvePlanWithUpsert(clientId, planStartDate, viewMode);
      
    } catch (error) {
      console.error('[checkAndApprovePlan] Error:', error);
      return { success: false, error: `Error checking existing data: ${error}` };
    }
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

  // Force refresh workout plan data from database
  const forceRefreshWorkoutPlan = async () => {
    console.log('[WorkoutPlanSection] 🔄 Force refreshing workout plan data...');
    
    try {
      // Clear current workout plan state to force fresh fetch
      setWorkoutPlan(null);
      
      // Force fetch fresh data from database
      await fetchPlan();
      
      console.log('[WorkoutPlanSection] ✅ Workout plan data refreshed');
      
      // Show success message
      toast({
        title: 'Data Refreshed',
        description: 'Workout plan data has been updated from database',
        variant: 'default'
      });
    } catch (error) {
      console.error('[WorkoutPlanSection] ❌ Error refreshing workout plan:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh workout plan data',
        variant: 'destructive'
      });
    }
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
        // Auto-save removed - using explicit save model
      }
    }
    action();
  };

  // Auto-save function removed - using explicit save model instead

  // Auto-save effect removed - using explicit save model instead

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
      // Clear all pending requests
      RequestDeduplication.clearAll();
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

  const buildTemplateJson = (weekData: TableWeekDay[], tags: string[], duration: '7day' | '30day') => {
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
  ): TableWeekDay[] => {
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
    const weekData: TableWeekDay[] = [];
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
    weekData: TableWeekDay[],
    startDate: Date,
    workoutDays: string[]
  ): TableWeekDay[] => {
    // Filter to only include workout days
    const workoutDayData = weekData.filter(day => {
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      return workoutDays.includes(dayName);
    });

    // Create a new week with exercises mapped to workout days
    const mappedWeek: TableWeekDay[] = [];
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

  // Sync planStartDate with client's plan start day - ENHANCED ALIGNMENT
  useEffect(() => {
    const dayFromClient = client?.plan_start_day as string | undefined;
    if (dayFromClient) {
      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const currentDayIndex = planStartDate.getDay();
      const targetDayIndex = weekdays.indexOf(dayFromClient);
      
      if (currentDayIndex !== targetDayIndex) {
        console.log('[WorkoutPlanSection] 🔄 Aligning planStartDate with client plan start day:', {
          currentDay: weekdays[currentDayIndex],
          targetDay: dayFromClient,
          currentDate: planStartDate.toISOString()
        });
        
        // Calculate days to add to get to the target day
        let daysToAdd = targetDayIndex - currentDayIndex;
        if (daysToAdd < 0) {
          daysToAdd += 7; // Go to next week's target day
        }
        
        const newDate = new Date(planStartDate);
        newDate.setDate(planStartDate.getDate() + daysToAdd);
        
        console.log('[WorkoutPlanSection] ✅ Aligned planStartDate:', {
          newDate: newDate.toISOString(),
          newDay: weekdays[newDate.getDay()]
        });
        
        setPlanStartDate(newDate);
      }
    }
  }, [client?.plan_start_day, planStartDate]);

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
    const componentName = 'WorkoutPlanSection';
    const operationStartTime = Date.now();
    
    if (!numericClientId) {
      RequestLogger.logError(componentName, new Error('fetchPlan called without clientId'), {
        numericClientId,
        planStartDate: planStartDate?.toISOString()
      });
      return;
    }

    // Generate unique key for this fetch operation
    const fetchKey = RequestDeduplication.generateKey('fetchPlan', {
      clientId: numericClientId,
      planStartDate: planStartDate?.toISOString(),
      viewMode
    });

    // Use request deduplication to prevent multiple simultaneous calls
    return RequestDeduplication.execute(fetchKey, async () => {
      // Prevent multiple simultaneous calls (legacy check)
      if (isFetchingPlan) {
        RequestLogger.logStateChange(componentName, 'fetchPlan', 'blocked', 'already_fetching', 'duplicate_call_prevention');
        console.log('🔄 [fetchPlan] Already fetching, skipping...');
        return;
      }

      // Circuit breaker: if we've had recent timeouts, add a delay
      const now = Date.now();
      const lastTimeout = localStorage.getItem('lastFetchTimeout');
      if (lastTimeout && (now - parseInt(lastTimeout)) < 30000) { // 30 second cooldown
        console.log('🔄 [fetchPlan] Circuit breaker active, adding delay...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

    RequestLogger.logPerformance('fetchPlan_start', componentName, operationStartTime, {
      success: true,
      metadata: { clientId: numericClientId, planStartDate: planStartDate?.toISOString() }
    });

    console.log('🔄 [fetchPlan] Starting fetch for client:', numericClientId, 'date:', planStartDate);
    // Update loading state directly since setLoading is a custom function
    setLoading('fetching', 'Loading workout plan...');
    loggedStateUpdate(componentName, 'isFetchingPlan', isFetchingPlan, true, setIsFetchingPlan, 'fetchPlan_start');
    
    // Add timeout protection to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Fetch plan timeout - forcing reset');
      // Record timeout for circuit breaker
      localStorage.setItem('lastFetchTimeout', Date.now().toString());
      setIsFetchingPlan(false);
      clearLoading();
      // Clear any pending requests to prevent cascading timeouts
      RequestDeduplication.clearAll();
      toast({ 
        title: 'Loading Timeout', 
        description: 'Loading took too long. Please try again.', 
        variant: 'destructive' 
      });
    }, 12000); // Reduced to 12 second timeout
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    // Calculate date range based on view mode: 7 days for weekly, 28 days for monthly
    const daysToAdd = viewMode === 'monthly' ? 27 : 6; // 28 days for monthly (0-27), 7 days for weekly (0-6)
    const endDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    console.log(`[fetchPlan] 🔍 Fetching ${viewMode} view data: ${startDateStr} to ${endDateStr} (${daysToAdd + 1} days)`);

    let data: any[] = [];
    let error: any = null;
    let isFromPreview = true; // Default to preview as primary source

    try {
      console.log(`🔄 [fetchPlan] Calling ${viewMode === 'monthly' ? 'checkMonthlyWorkoutStatus' : 'checkWeeklyWorkoutStatus'}...`);
      const statusQueryStartTime = Date.now();
      
      // Use the appropriate status function based on view mode
      const statusResult: WorkoutStatusResult = await loggedOperation(
        viewMode === 'monthly' ? 'checkMonthlyWorkoutStatus' : 'checkWeeklyWorkoutStatus',
        componentName,
        () => viewMode === 'monthly' 
          ? checkMonthlyWorkoutStatus(supabase, numericClientId, planStartDate)
          : checkWeeklyWorkoutStatus(supabase, numericClientId, planStartDate),
        { clientId: numericClientId, planStartDate: planStartDate?.toISOString(), viewMode }
      );
      
      console.log(`🔄 [fetchPlan] ${viewMode === 'monthly' ? 'checkMonthlyWorkoutStatus' : 'checkWeeklyWorkoutStatus'} completed:`, statusResult);
      RequestLogger.logPerformance(viewMode === 'monthly' ? 'checkMonthlyWorkoutStatus' : 'checkWeeklyWorkoutStatus', componentName, statusQueryStartTime, {
        success: true,
        metadata: { 
          resultStatus: statusResult.status, 
          previewDataCount: statusResult.previewData?.length || 0,
          scheduleDataCount: statusResult.scheduleData?.length || 0,
          viewMode
        }
      });
      
      // Use preview data as primary source (same as monthly view)
      if (statusResult.previewData && statusResult.previewData.length > 0) {
        data = statusResult.previewData;
        isFromPreview = true;
      } else {
        
        // Strategy 3: Try to find the most recent plan and use it as a template
        // Try to find the most recent plan from schedule_preview first
        console.log('🔄 [fetchPlan] Querying recent preview data...');
        const recentQueryStartTime = Date.now();
        const recentQueryId = RequestLogger.logDatabaseQuery(
          'schedule_preview',
          'select',
          componentName,
          {
            clientId: numericClientId,
            filters: { client_id: numericClientId, type: 'workout', order: 'for_date desc', limit: 1 },
            startTime: recentQueryStartTime
          }
        );
        
        let { data: recentPreviewData, error: recentPreviewError } = await supabase
          .from('schedule_preview')
          .select('*')
          .eq('client_id', numericClientId)
          .eq('type', 'workout')
          .order('for_date', { ascending: false })
          .limit(1);
          
        RequestLogger.logDatabaseQuery(
          'schedule_preview',
          'select',
          componentName,
          {
            clientId: numericClientId,
            filters: { client_id: numericClientId, type: 'workout', order: 'for_date desc', limit: 1 },
            startTime: recentQueryStartTime,
            success: !recentPreviewError,
            error: recentPreviewError?.message,
            resultCount: recentPreviewData?.length || 0
          }
        );
        
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
        const totalDays = viewMode === 'monthly' ? 28 : 7; // 28 days for monthly, 7 days for weekly
        for (let i = 0; i < totalDays; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          // Find matching data by comparing dates (workout.for_date is already normalized from DB)
          const dayData = data?.find(workout => {
            // workout.for_date is already in YYYY-MM-DD format from database
            return workout.for_date === dateStr;
          });
          
          // Debug logging to help identify date matching issues
          if (i === 0 || (viewMode === 'monthly' && i === 7)) { // Log for first day and first day of second week for monthly
            console.log(`[fetchPlan] 🔍 Date matching debug for ${dateStr} (day ${i + 1}/${totalDays}):`, {
              availableDates: data?.map(w => w.for_date) || [],
              foundMatch: !!dayData,
              dayDataExercises: dayData?.details_json?.exercises?.length || 0,
              totalDataCount: data?.length || 0
            });
          }
          
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
      RequestLogger.logError(componentName, error, {
        operation: 'fetchPlan',
        clientId: numericClientId,
        planStartDate: planStartDate?.toISOString(),
        duration: Date.now() - operationStartTime
      });
      
      RequestLogger.logPerformance('fetchPlan_error', componentName, operationStartTime, {
        success: false,
        error: error.message,
        metadata: { clientId: numericClientId }
      });
      
      toast({ title: 'Error fetching plan', description: error.message, variant: 'destructive' });
      loggedStateUpdate(componentName, 'workoutPlan', workoutPlan, null, setWorkoutPlan, 'fetchPlan_error');
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
      
      loggedStateUpdate(componentName, 'isFetchingPlan', isFetchingPlan, false, setIsFetchingPlan, 'fetchPlan_cleanup');
      // Clear loading state directly since clearLoading is a custom function
      clearLoading();
      
      RequestLogger.logPerformance('fetchPlan_complete', componentName, operationStartTime, {
        success: true,
        metadata: { 
          totalDuration: Date.now() - operationStartTime,
          clientId: numericClientId 
        }
      });
    }
  }, {
    onDuplicate: () => {
      console.log('🔄 [fetchPlan] Duplicate request detected, returning existing promise');
      toast({ 
        title: 'Loading in Progress', 
        description: 'Plan is already being loaded. Please wait.',
        variant: 'default' 
      });
    }
  });
  };

  // Debounced save function removed - using explicit save model instead

  // Listen for immediate status refresh from inline edits
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const handleWorkoutPlanChanged = () => {
      console.log('[WorkoutPlanSection] Received workoutPlan:changed event, refreshing status immediately');
      // Force immediate status refresh for inline edits
      setForceRefreshKey(prev => prev + 1);
      // Add a small delay to ensure database transaction is visible
      timeoutId = setTimeout(() => {
        checkPlanApprovalStatus();
      }, 100);
    };

    window.addEventListener('workoutPlan:changed', handleWorkoutPlanChanged);
    
    return () => {
      window.removeEventListener('workoutPlan:changed', handleWorkoutPlanChanged);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handlePlanChange = (updatedWeek: TableWeekDay[], isFromSave: boolean = false) => {
    console.log('[handlePlanChange] Called with:', {
      isFromSave,
      updatedWeekLength: updatedWeek.length,
      viewMode,
      currentDirtyDatesSize: dirtyDates.size,
      currentIsDraftPlan: isDraftPlan,
      currentPlanApprovalStatus: planApprovalStatus
    });
    
    // Update the state immediately for a responsive UI
    setWorkoutPlan(currentPlan => {
      if (!currentPlan) return null;
      const updated = { ...currentPlan, week: updatedWeek };
      return updated;
    });
    
    // For monthly view, also update monthlyData to ensure consistency
    if (viewMode === 'monthly' && monthlyData.length > 0) {
      // Convert flat array back to 4 weeks structure
      const updatedMonthlyData = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = i * 7;
        const weekEnd = weekStart + 7;
        updatedMonthlyData.push(updatedWeek.slice(weekStart, weekEnd));
      }
      setMonthlyData(updatedMonthlyData);
    }
    
    if (isFromSave) {
      console.log('[handlePlanChange] Processing save operation - applying immediate state updates');
      console.log('[handlePlanChange] Current state before save:', {
        isDraftPlan,
        planApprovalStatus,
        dirtyDatesSize: dirtyDates.size,
        hasUnsavedChanges: workoutPlanState.hasUnsavedChanges
      });
      
      // IMMEDIATE STATE UPDATES: Apply the same pattern as other save operations
      console.log('[handlePlanChange] Applying immediate state updates for instant approval button display');
      
      // Clear unsaved changes and mark as draft plan
      updateWorkoutPlanState({ 
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        status: 'draft',
        source: 'generated'
      });
      
      // Ensure Approve button logic can activate consistently after table saves
      setIsDraftPlan(true);
      
      // Update plan approval status to show approve buttons
      setPlanApprovalStatus('not_approved');
      
      // Force refresh key to trigger UI updates
      setForceRefreshKey(prev => prev + 1);
      
      console.log('[handlePlanChange] State after save operation:', {
        isDraftPlan: true,
        hasUnsavedChanges: false,
        dirtyDatesSize: dirtyDates.size,
        planApprovalStatus: 'not_approved'
      });
      
      // BACKGROUND REFRESH: Do database validation in background (same pattern as other saves)
      setTimeout(async () => {
        try {
          console.log('[handlePlanChange] Starting background refresh for data consistency');
          await handlePostSaveRefreshEnhanced({
            isMonthly: viewMode === 'monthly',
            forceWeekStatusRefresh: false, // Table saves don't need extra refresh
            delayBeforeRefresh: 100
          });
          console.log('[handlePlanChange] Background refresh completed successfully');
        } catch (refreshError) {
          console.warn('[handlePlanChange] Background refresh failed:', refreshError);
          // Don't show error to user since UI is already updated optimistically
        }
      }, 50); // Very short delay to avoid blocking UI
    } else {
      console.log('[handlePlanChange] Processing unsaved changes - setting hasUnsavedChanges=true');
      // New unsaved changes
      updateWorkoutPlanState({ hasUnsavedChanges: true });
      
      // For inline edits, no need to refresh approval status immediately
      // Status will be updated when changes are explicitly saved
    }
  };

  const handleImportSuccess = async (weekData: Array<{
    date: string; focus: string; exercises: any[];
  }>, dateRange: { start: string; end: string }) => {
    // Save the imported plan to schedule_preview first
    try {
      setShowSavingModal(true);
      setSavingMessage('Importing workout plan...');
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
      
      // IMMEDIATE STATE UPDATES: Apply the same pattern as other save operations
      console.log('[Import] Applying immediate state updates for instant approval button display');
      
      // Clear dirty dates since data is now saved to database
      setDirtyDates(new Set());
      
      // Mark as draft plan to enable approve buttons immediately
      setIsDraftPlan(true);
      
      // Update plan approval status to show approve buttons
      setPlanApprovalStatus('not_approved');
      
      // Force refresh key to trigger UI updates
      setForceRefreshKey(prev => prev + 1);
      
      // Update workout plan state
      updateWorkoutPlanState({
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        status: 'draft',
        source: 'generated'
      });
      
      // BACKGROUND REFRESH: Do database validation in background (same pattern as other saves)
      setTimeout(async () => {
        try {
          console.log('[Import] Starting background refresh for data consistency');
          await handlePostSaveRefreshEnhanced({
            isMonthly: viewMode === 'monthly',
            forceWeekStatusRefresh: true,
            delayBeforeRefresh: 100
          });
          console.log('[Import] Background refresh completed successfully');
        } catch (refreshError) {
          console.warn('[Import] Background refresh failed:', refreshError);
          // Don't show error to user since UI is already updated optimistically
        }
      }, 50); // Very short delay to avoid blocking UI
      
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
    } finally {
      setShowSavingModal(false);
    }
  };

  // RESTORED: Original data fetching logic
  // This useEffect handles the primary data fetching for the component
  useEffect(() => {
    console.log('🔄 [useEffect] Running original fetchPlan logic');
    
    // Only run fetchPlan if we don't have an AI generated plan
    if (hasAIGeneratedPlan) {
      console.log('🔄 [useEffect] Skipping fetchPlan - AI plan exists');
      return;
    }
    
    // Run the original fetchPlan function
    console.log('🔄 [useEffect] Running original fetchPlan');
    fetchPlan();
  }, [numericClientId, planStartDate, hasAIGeneratedPlan]);

  // Reset AI generated plan flag when client or date changes
  useEffect(() => {
    setHasAIGeneratedPlan(false);
  }, [numericClientId, planStartDate]);
  
  // Handle date alignment separately from render cycle to prevent infinite loops
  useEffect(() => {
    if (planStartDate && client?.plan_start_day) {
      const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const clientPlanStartDay = client.plan_start_day;
      const targetDayIndex = weekdays.indexOf(clientPlanStartDay);
      const currentDayIndex = planStartDate.getDay();
      
      if (currentDayIndex !== targetDayIndex) {
        console.warn('[WorkoutPlanSection] ⚠️ planStartDate not aligned, correcting:', {
          currentDate: planStartDate.toISOString(),
          currentDay: weekdays[currentDayIndex],
          targetDay: clientPlanStartDay
        });
        
        // Calculate days to add to get to the target day
        let daysToAdd = targetDayIndex - currentDayIndex;
        if (daysToAdd < 0) {
          daysToAdd += 7; // Go to next week's target day
        }
        
        const alignedDate = new Date(planStartDate);
        alignedDate.setDate(planStartDate.getDate() + daysToAdd);
        
        // Update the state to the aligned date
        setPlanStartDate(alignedDate);
      }
    }
  }, [client?.plan_start_day]); // Only run when client plan start day changes

  // TEMPORARILY DISABLED: Sync workoutPlan state with unified data
  useEffect(() => {
    if (false && unifiedWorkoutData && !hasAIGeneratedPlan && planStartDate && shouldFetchData) {
      console.log('[WorkoutPlanSection] 🔄 Syncing workoutPlan with unified data:', {
        totalDays: unifiedWorkoutData?.days?.length || 0,
        hasAnyPlans: unifiedWorkoutData?.hasAnyPlans,
        viewMode: unifiedWorkoutData?.viewMode
      });
      
      // Convert unified data to legacy workoutPlan format for compatibility
      const weekDates = unifiedWorkoutData.days.map((day: any) => ({
        date: day.date,
        focus: day.focus,
        exercises: day.exercises as any // Type assertion for compatibility
      }));
      
      const syncedWorkoutPlan: WeeklyWorkoutPlan = {
        week: weekDates,
        hasAnyWorkouts: unifiedWorkoutData.hasAnyPlans,
        planStartDate: unifiedWorkoutData.startDate,
        planEndDate: unifiedWorkoutData.endDate
      };
      
      setWorkoutPlan(syncedWorkoutPlan);
      console.log('[WorkoutPlanSection] ✅ Synced workoutPlan with unified data:', {
        weekLength: syncedWorkoutPlan.week.length,
        hasAnyWorkouts: syncedWorkoutPlan.hasAnyWorkouts
      });
    }
  }, [unifiedWorkoutData, hasAIGeneratedPlan, planStartDate, shouldFetchData]);

  // Handle date changes with unsaved changes protection and strict alignment
  const handleDateChange = async (newDate: Date) => {
    if (workoutPlanState.hasUnsavedChanges) {
      const confirmed = await showConfirmationDialog(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before changing the date?'
      );
      
      if (confirmed) {
        // Auto-save removed - using explicit save model
      }
    }
    
    // Ensure the date is strictly aligned with client's plan start day
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const clientPlanStartDay = client?.plan_start_day || 'Sunday';
    const targetDayIndex = weekdays.indexOf(clientPlanStartDay);
    const newDateDayIndex = newDate.getDay();
    
    let alignedDate = newDate;
    if (newDateDayIndex !== targetDayIndex) {
      console.log('[WorkoutPlanSection] 🔄 Aligning selected date with client plan start day:', {
        selectedDate: newDate.toISOString(),
        selectedDay: weekdays[newDateDayIndex],
        targetDay: clientPlanStartDay
      });
      
      // Calculate days to add to get to the target day
      let daysToAdd = targetDayIndex - newDateDayIndex;
      if (daysToAdd < 0) {
        daysToAdd += 7; // Go to next week's target day
      }
      
      alignedDate = new Date(newDate);
      alignedDate.setDate(newDate.getDate() + daysToAdd);
      
      console.log('[WorkoutPlanSection] ✅ Aligned selected date:', {
        alignedDate: alignedDate.toISOString(),
        alignedDay: weekdays[alignedDate.getDay()]
      });
    }
    
    // Update the state with aligned date
    setPlanStartDate(alignedDate);
    updateWorkoutPlanState({ hasUnsavedChanges: false });
    
    // Persist to localStorage
    if (clientId) {
      localStorage.setItem(`workoutPlanDate_${clientId}`, alignedDate.toISOString());
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
          hasAnyWorkouts: week.some((day: TableWeekDay) => day.exercises && day.exercises.length > 0),
          planStartDate: week[0]?.date || '',
          planEndDate: week[week.length - 1]?.date || ''
        };
        console.log('✅ Setting AI-generated workout plan:', newWorkoutPlan);
        setWorkoutPlan(newWorkoutPlan);
        // Don't override the user's selected plan start date
        // The plan start date should remain as the user selected it
        setHasAIGeneratedPlan(true); // Mark that AI generated data is now available
        // Immediately save to schedule_preview
        setShowSavingModal(true);
        setSavingMessage('Saving AI-generated plan...');
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
  const [lastApprovalCheck, setLastApprovalCheck] = useState<{viewMode: string, clientId: number, date: string, timestamp: number} | null>(null);
  const [forceRefreshKey, setForceRefreshKey] = useState(0); // Add force refresh mechanism
  
  // Unified refresh system
  const { state: refreshState, refresh: unifiedRefresh, clearAll: clearRefreshQueue } = useUnifiedRefresh();
  
  // Optimistic updates system
  const { 
    optimisticData, 
    isOptimistic, 
    optimisticSave, 
    optimisticApprove, 
    confirmUpdate, 
    revertUpdate 
  } = useWorkoutPlanOptimisticUpdates();
  
  // Approve button state machine
  const {
    state: approveButtonState,
    buttonConfig: approveButtonConfig,
    dispatch: dispatchApproveAction,
    handleSave: handleApproveSave,
    handleRefresh: handleApproveRefresh,
    handleApprove: handleApproveAction,
    handleRetry: handleApproveRetry,
    reset: resetApproveState,
    isState: isApproveState,
    canTransition: canTransitionAction,
    getRetryInfo: getApproveRetryInfo
  } = useApproveButtonState();
  
  // Enhanced toast notifications
  const {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hideToast,
    clearAllToasts
  } = useEnhancedToast();
  const [isViewSwitching, setIsViewSwitching] = useState(false); // Block view switching during data loading
  const [isPlanManagementExpanded, setIsPlanManagementExpanded] = useState(false); // Collapsible Plan Management state
  const [isClientGoalsExpanded, setIsClientGoalsExpanded] = useState(() => {
    // Try to get user preference from localStorage
    try {
      const stored = localStorage.getItem('clientGoalsExpanded');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }); // Collapsible Client Goals state with persistence
  
  // Force refresh function to trigger immediate status update
  const forceRefreshStatus = () => {
    console.log('[forceRefreshStatus] Triggering force refresh...');
    setForceRefreshKey(prev => prev + 1);
    // Clear any cached data to force fresh fetch
    setLastApprovalCheck(null);
    // Trigger immediate status check
    checkPlanApprovalStatus();
  };

  // Cleanup function to reset stuck states
  const resetStuckStates = useCallback(() => {
    console.log('[Reset Stuck States] Resetting potentially stuck states...');
    setIsCheckingApproval(false);
    setIsSavingEdits(false);
    setShowSavingModal(false);
    setForceRefreshKey(prev => prev + 1);
    
    // Clear unified refresh queue
    clearRefreshQueue();
    
    // Clear any stuck requests in RequestDeduplication
    const stats = RequestDeduplication.getStats();
    if (stats.pendingCount > 0) {
      console.log(`[Reset Stuck States] Clearing ${stats.pendingCount} stuck requests:`, stats.pendingKeys);
      RequestDeduplication.clearAll();
    }
  }, [clearRefreshQueue]);

  // Handle client goals toggle with persistence
  const handleClientGoalsToggle = () => {
    const newValue = !isClientGoalsExpanded;
    setIsClientGoalsExpanded(newValue);
    
    // Persist user preference
    try {
      localStorage.setItem('clientGoalsExpanded', JSON.stringify(newValue));
    } catch (error) {
      console.warn('Failed to save client goals preference:', error);
    }
  };
  
  const checkPlanApprovalStatus = async () => {
    if (!numericClientId || !planStartDate) return;

    // PROTECTION: Don't override 'approved' status if it was just set
    // This prevents the useEffect from overriding our immediate status updates after approval
    if (planApprovalStatus === 'approved') {
      console.log('[checkPlanApprovalStatus] Skipping check - status is already approved, preserving optimistic update');
      return;
    }

    // Generate unique key for this approval status check
    const approvalKey = RequestDeduplication.generateKey('checkPlanApprovalStatus', {
      viewMode,
      clientId: numericClientId,
      date: planStartDate.toISOString().split('T')[0],
      forceRefreshKey
    });

    // Use request deduplication to prevent multiple simultaneous checks
    return RequestDeduplication.execute(approvalKey, async () => {
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
        // Add cooldown period to prevent excessive calls
        const timeSinceLastCheck = Date.now() - lastApprovalCheck.timestamp;
        const cooldownPeriod = checkKey.viewMode === 'monthly' ? 2000 : 1000; // 2 seconds for monthly, 1 second for weekly
        
        if (timeSinceLastCheck < cooldownPeriod) {
          console.log(`[checkPlanApprovalStatus] Cooldown period active (${timeSinceLastCheck}ms < ${cooldownPeriod}ms), skipping...`);
          return;
        }
      }

    setIsCheckingApproval(true);
    setLastApprovalCheck({...checkKey, timestamp: Date.now()});

    // Add timeout to prevent infinite hanging
    const timeoutId = setTimeout(() => {
      console.error('[checkPlanApprovalStatus] Timeout reached (30 seconds), forcing completion');
      setIsCheckingApproval(false);
      setPlanApprovalStatus('pending');
      updateWorkoutPlanState({
        status: 'no_plan',
        source: 'database'
      });
    }, 30000); // 30 second timeout

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

            // Check if week has preview data for approval logic
            const weekPreviewData = monthlyResult.previewData.filter(day =>
              day.for_date >= format(weekStart, 'yyyy-MM-dd') &&
              day.for_date <= format(weekEnd, 'yyyy-MM-dd')
            );

            // Use the new is_approved logic: can approve if week status is 'draft' and has preview data
            const hasPreviewData = weekPreviewData.length > 0;
            const canApprove = hasPreviewData && weekData.status === 'draft';

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

        // Use the new is_approved logic: can approve if status is 'draft' and has preview data
        const hasPreviewData = result.previewData.length > 0;
        const canApprove = hasPreviewData && result.status === 'draft';

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
      clearTimeout(timeoutId); // Clear the timeout
      setIsCheckingApproval(false);
      // Clear view switching loading state when approval check completes
      setIsViewSwitching(false);
      // Reset force refresh key after successful check
      if (forceRefreshKey > 0) {
        setForceRefreshKey(0);
      }
    }
  }, {
    onDuplicate: () => {
      console.log('🔄 [checkPlanApprovalStatus] Duplicate request detected, returning existing promise');
    }
  });
  };

  // Unified post-save refresh helper to ensure consistent status and UI updates
  const handlePostSaveRefresh = async () => {
    try {
      // Mark plan as draft so Approve button logic can activate
      setIsDraftPlan(true);
      // Force a fresh approval status check (avoid dedupe)
      setForceRefreshKey(prev => prev + 1);
      // Refresh approval status to ensure consistency
      await checkPlanApprovalStatus();
    } catch (err) {
      console.warn('[Post-Save Refresh] Warning:', err);
    }
  };

  // Enhanced unified post-save handler for all save operations
  const handlePostSaveRefreshEnhanced = async (options: {
    isMonthly?: boolean;
    forceWeekStatusRefresh?: boolean;
    delayBeforeRefresh?: number;
    skipDatabaseCheck?: boolean; // New option to skip database status check
  } = {}) => {
    const startTime = Date.now();
    
    try {
      console.log('[Enhanced Post-Save Refresh] Starting with options:', options);
      
      // Mark plan as draft so Approve button logic can activate
      setIsDraftPlan(true);
      
      // Use unified refresh system for approval status
      if (!options.skipDatabaseCheck) {
        console.log('[Enhanced Post-Save Refresh] Using unified refresh for approval status...');
        
        // Add delay if specified
        if (options.delayBeforeRefresh && options.delayBeforeRefresh > 0) {
          console.log(`[Enhanced Post-Save Refresh] Waiting ${options.delayBeforeRefresh}ms for database propagation`);
          await new Promise(resolve => setTimeout(resolve, options.delayBeforeRefresh));
        }
        
        // SEQUENTIAL OPERATIONS: Only run one refresh operation at a time
        if (options.isMonthly && options.forceWeekStatusRefresh) {
          // For monthly view, use MONTHLY_DATA which includes approval status
          console.log('[Enhanced Post-Save Refresh] Calling unifiedRefresh for MONTHLY_DATA (includes approval status)...');
          await unifiedRefresh({
            type: 'MONTHLY_DATA',
            params: { clientId: numericClientId, planStartDate },
            cooldown: 1000, // Increased cooldown to prevent conflicts
            priority: 'normal'
          });
          console.log('[Enhanced Post-Save Refresh] unifiedRefresh for MONTHLY_DATA completed');
        } else {
          // For weekly view, use APPROVAL_STATUS
          console.log('[Enhanced Post-Save Refresh] Calling unifiedRefresh for APPROVAL_STATUS...');
          await unifiedRefresh({
            type: 'APPROVAL_STATUS',
            params: { clientId: numericClientId, planStartDate, viewMode },
            cooldown: 1000, // Increased cooldown to prevent conflicts
            priority: 'normal'
          });
          console.log('[Enhanced Post-Save Refresh] unifiedRefresh for APPROVAL_STATUS completed');
        }
      } else {
        console.log('[Enhanced Post-Save Refresh] Skipping database check, using current state...');
      }
      
      // Single force refresh key update at the end to avoid cascading effects
      console.log('[Enhanced Post-Save Refresh] Forcing unified approval status update...');
      setForceRefreshKey(prev => prev + 1);
      
      const duration = Date.now() - startTime;
      console.log(`[Enhanced Post-Save Refresh] Completed successfully in ${duration}ms`);
      return true;
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(`[Enhanced Post-Save Refresh] Failed after ${duration}ms:`, err);
      
      // Reset state on error to prevent UI from being stuck
      setIsCheckingApproval(false);
      setForceRefreshKey(prev => prev + 1); // Force UI refresh even on error
      
      return false;
    }
  };

  // Helper function to check if a week has any dirty dates (unified logic)
  const isWeekDirty = useCallback((weekIndex: number) => {
    if (dirtyDates.size === 0) return false;
    
    const weekStartDate = addWeeks(planStartDate, weekIndex);
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStartDate, i);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      if (dirtyDates.has(dateStr)) {
        return true;
      }
    }
    return false;
  }, [dirtyDates, planStartDate]);

  // Unified approval status calculation function
  const calculateUnifiedApprovalStatus = useCallback((): UnifiedApprovalStatus => {
    const hasUnsavedChanges = dirtyDates.size > 0;
    
    console.log('[calculateUnifiedApprovalStatus] Current state:', {
      planApprovalStatus,
      isDraftPlan,
      hasUnsavedChanges,
      dirtyDatesSize: dirtyDates.size
    });
    
    const globalCanApprove = (planApprovalStatus === 'not_approved' || planApprovalStatus === 'partial_approved') && 
                            isDraftPlan && 
                            !hasUnsavedChanges;
    
    console.log('[calculateUnifiedApprovalStatus] Global approval calculation:', {
      planApprovalStatusCheck: planApprovalStatus === 'not_approved' || planApprovalStatus === 'partial_approved',
      isDraftPlan,
      hasUnsavedChanges,
      globalCanApprove
    });
    
    // Calculate week statuses with unified dirty date logic
    // IMPORTANT: Only block approval if there are actually unsaved changes
    // After save operations, dirtyDates should be empty, allowing approval
    const weeks = weekStatuses.map(week => ({
      ...week,
      canApprove: week.canApprove && !hasUnsavedChanges // Use global hasUnsavedChanges instead of per-week check
    }));
    
    // Determine global message based on state
    let globalMessage = 'Approve Plan';
    if (hasUnsavedChanges) {
      globalMessage = 'Save Plan First';
    } else if (planApprovalStatus === 'approved') {
      globalMessage = 'Plan Approved';
    } else if (planApprovalStatus === 'pending') {
      globalMessage = 'No Plan to Approve';
    }
    
    return {
      global: {
        canApprove: globalCanApprove,
        status: planApprovalStatus === 'not_approved' ? 'draft' : planApprovalStatus,
        hasUnsavedChanges,
        message: globalMessage
      },
      weeks
    };
  }, [planApprovalStatus, isDraftPlan, dirtyDates, weekStatuses]);

  // Update unified approval status whenever dependencies change
  useEffect(() => {
    const newUnifiedStatus = calculateUnifiedApprovalStatus();
    setUnifiedApprovalStatus(newUnifiedStatus);
    console.log('[Unified Approval Status] Updated:', newUnifiedStatus);
  }, [calculateUnifiedApprovalStatus, forceRefreshKey]);

  // Additional effect to ensure unified approval status is updated after plan generation
  useEffect(() => {
    if (planApprovalStatus === 'not_approved' && isDraftPlan && weekStatuses.length > 0) {
      console.log('[Post-Generation] Triggering unified approval status update...');
      const newUnifiedStatus = calculateUnifiedApprovalStatus();
      setUnifiedApprovalStatus(newUnifiedStatus);
      console.log('[Post-Generation] Unified approval status updated:', newUnifiedStatus);
    }
  }, [planApprovalStatus, isDraftPlan, weekStatuses, calculateUnifiedApprovalStatus]);

  // Sync state machine with existing state variables
  useEffect(() => {
    console.log('[State Machine Sync] Current state:', {
      dirtyDatesSize: dirtyDates.size,
      isDraftPlan,
      planApprovalStatus,
      approveButtonState
    });
    
    // Sync dirty dates with state machine
    if (dirtyDates.size > 0) {
      console.log('[State Machine Sync] Dispatching DIRTY_CHANGES');
      dispatchApproveAction('DIRTY_CHANGES');
    } else if (dirtyDates.size === 0 && isDraftPlan) {
      // Only dispatch CLEAN_CHANGES if not already in saving/refreshing state to prevent invalid transitions
      if (approveButtonState !== 'saving' && approveButtonState !== 'refreshing') {
        // Trigger CLEAN_CHANGES if we have a draft plan with no dirty dates
        // This should work regardless of planApprovalStatus to ensure Approve Plan button activates
        console.log('[State Machine Sync] Dispatching CLEAN_CHANGES (draft plan with no dirty dates)', {
          planApprovalStatus,
          isDraftPlan,
          dirtyDatesSize: dirtyDates.size,
          currentState: approveButtonState
        });
        const dispatchResult = dispatchApproveAction('CLEAN_CHANGES');
        console.log('[State Machine Sync] CLEAN_CHANGES dispatch result:', dispatchResult, {
          action: 'CLEAN_CHANGES',
          success: dispatchResult,
          newState: approveButtonState
        });
      } else {
        console.log('[State Machine Sync] Skipping CLEAN_CHANGES dispatch as state is already saving/refreshing:', approveButtonState);
      }
    } else {
      console.log('[State Machine Sync] No action needed:', {
        dirtyDatesSize: dirtyDates.size,
        isDraftPlan,
        condition: dirtyDates.size === 0 && isDraftPlan
      });
    }
  }, [dirtyDates, isDraftPlan, planApprovalStatus, dispatchApproveAction]);

  // Sync plan generation with state machine
  useEffect(() => {
    if (hasAIGeneratedPlan && isDraftPlan) {
      dispatchApproveAction('PLAN_GENERATED');
    }
  }, [hasAIGeneratedPlan, isDraftPlan, dispatchApproveAction]);

  // Unified approval handler for both global and week-level approvals
  const handleUnifiedApproval = async (scope: 'global' | 'week', weekIndex?: number) => {
    const isGlobal = scope === 'global';
    const weekStatus = isGlobal ? null : weekStatuses[weekIndex!];
    
    console.log('[handleUnifiedApproval] Called with:', {
      scope,
      weekIndex,
      isGlobal,
      unifiedApprovalStatus,
      weekStatus
    });
    
    // Validate approval conditions
    if (isGlobal) {
      if (!unifiedApprovalStatus.global.canApprove) {
        console.warn('[Unified Approval] Global approval not allowed', {
          canApprove: unifiedApprovalStatus.global.canApprove,
          status: unifiedApprovalStatus.global.status,
          hasUnsavedChanges: unifiedApprovalStatus.global.hasUnsavedChanges,
          message: unifiedApprovalStatus.global.message
        });
        return;
      }
    } else {
      if (!weekStatus || !weekStatus.canApprove) {
        console.warn('[Unified Approval] Week approval not allowed', {
          weekStatus,
          canApprove: weekStatus?.canApprove
        });
        return;
      }
    }

    // IMMEDIATE STATE UPDATE: Update UI immediately before starting approval process
    console.log('[handleUnifiedApproval] Updating UI state immediately to show approval in progress');
    setIsApproving(true);
    setShowSavingModal(true);
    setSavingMessage('Approving plan...');
    setLoading('approving', 'Approving plan...');

    // Also update button states immediately to prevent double clicks
    if (isGlobal) {
      setPlanApprovalStatus('not_approved'); // Keep as not_approved to maintain button state
    } else {
      setWeekStatuses(prev => prev.map((week, idx) =>
        idx === weekIndex
          ? { ...week, status: 'draft', canApprove: false } // Use 'draft' instead of 'pending'
          : week
      ));
    }

    try {
      const planType = isGlobal ? (viewMode === 'monthly' ? 'monthly' : 'weekly') : `Week ${weekStatus!.weekNumber}`;
      setShowSavingModal(true);
      setSavingMessage(`Approving ${planType} plan...`);
      setLoading('approving', `Approving ${planType} plan...`);
      setIsApproving(true);
      
      // Show progress message for large operations
      if (isGlobal && viewMode === 'monthly') {
        setTimeout(() => {
          setSavingMessage('Processing large monthly plan - this may take a few minutes...');
        }, 10000); // Show progress message after 10 seconds
      }

      let result: { success: boolean; error?: string; requiresConfirmation?: boolean };
      
      if (isGlobal) {
        // Global approval - use new checkAndApprovePlan function
        const approvalPromise = checkAndApprovePlan(numericClientId, planStartDate, viewMode);
        
        // Set reasonable timeout for approval operations
        const timeoutDuration = 30 * 1000; // 30 seconds should be more than enough for optimized approval
        const timeoutMessage = 'Approval timeout after 30 seconds - please try again';
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(timeoutMessage)), timeoutDuration)
        );
        
        console.log(`[Unified Approval] Starting ${viewMode} approval with ${timeoutDuration/1000}s timeout`);
        result = await Promise.race([approvalPromise, timeoutPromise]) as { success: boolean; error?: string; requiresConfirmation?: boolean };
        
        // If confirmation is required, don't proceed with the rest of the function
        if (result.requiresConfirmation) {
          setShowSavingModal(false);
          clearLoading();
          setIsApproving(false);
          return;
        }
      } else {
        // Week approval - use new checkAndApprovePlan function
        result = await checkAndApprovePlan(numericClientId, weekStatus!.startDate, 'weekly', weekIndex);
        
        // If confirmation is required, don't proceed with the rest of the function
        if (result.requiresConfirmation) {
          setShowSavingModal(false);
          clearLoading();
          setIsApproving(false);
          return;
        }
      }

      if (result.success) {
        // IMMEDIATE UI UPDATE: Update all states immediately for instant feedback
        console.log('[handleUnifiedApproval] Approval succeeded, updating UI immediately');
        
        toast({
          title: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Approved`,
          description: `The ${planType} workout plan has been approved and saved to the main schedule.`,
          variant: 'default'
        });

        // Update state immediately with optimistic updates
        if (isGlobal) {
          // Immediately reflect approved state in local UI to hide Approve buttons
          setPlanApprovalStatus('approved');
          setIsDraftPlan(false);
          updateWorkoutPlanState({
            status: 'approved',
            source: 'database',
            hasUnsavedChanges: false,
            lastSaved: new Date()
          });
          
          // Clear dirty dates after successful approval
          setDirtyDates(new Set());
          
          // Force update week statuses to show approved status
          if (viewMode === 'monthly') {
            const approvedWeekStatuses = Array.from({ length: 4 }, (_, index) => ({
              weekNumber: index + 1,
              status: 'approved' as const,
              startDate: new Date(planStartDate.getTime() + index * 7 * 24 * 60 * 60 * 1000),
              endDate: new Date(planStartDate.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000),
              canApprove: false
            }));
            setWeekStatuses(approvedWeekStatuses);
          } else {
            setWeekStatuses([{
              weekNumber: 1,
              status: 'approved' as const,
              startDate: planStartDate,
              endDate: new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
              canApprove: false
            }]);
          }
        } else {
          // Update the specific week status locally
          setWeekStatuses(prev => prev.map((week, idx) =>
            idx === weekIndex
              ? { ...week, status: 'approved', canApprove: false }
              : week
          ));
        }

        // BACKGROUND REFRESH: Do database refresh in background without blocking UI
        setTimeout(async () => {
          try {
            console.log('[handleUnifiedApproval] Starting background refresh for data consistency');
            
            // Force a fresh approval status check (avoid dedupe)
            setForceRefreshKey(prev => prev + 1);
            
            // Refresh the plan data to show approved version (but don't override status)
            await fetchPlan();
            
            // SKIP DATABASE STATUS CHECK: Don't call handlePostSaveRefreshEnhanced after approval
            // as it would override our optimistic 'approved' status
            console.log('[handleUnifiedApproval] Skipping database status check to preserve approved status');
            
            console.log('[handleUnifiedApproval] Background refresh completed successfully');
          } catch (refreshError) {
            console.warn('[handleUnifiedApproval] Background refresh failed:', refreshError);
            // Don't show error to user since UI is already updated optimistically
          }
        }, 100); // Very short delay to avoid blocking UI

        // Return success result for state machine
        return { success: true };

      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || `Could not approve ${planType} plan.`,
          variant: 'destructive'
        });
        
        // Return failure result for state machine
        return { success: false, error: result.error || `Could not approve ${planType} plan.` };
      }
    } catch (error) {
      console.error('[Unified Approval] Error:', error);
      
      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('timeout')) {
        toast({ 
          title: 'Approval Timeout', 
          description: 'The approval process is taking longer than expected. This can happen with large plans. Please try again or contact support if the issue persists.', 
          variant: 'destructive' 
        });
      } else {
      toast({
        title: 'Approval Failed',
        description: 'An unexpected error occurred during approval.',
        variant: 'destructive'
      });
      }
      
      // Return failure result for state machine
      return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred during approval.' };
    } finally {
      // CLEANUP: Reset approval states immediately
      console.log('[handleUnifiedApproval] Cleaning up approval states');
      clearLoading();
      setShowSavingModal(false);
      setIsApproving(false);
      
      // Reset loading states to ensure UI is responsive
      setTimeout(() => {
        setSavingMessage('');
      }, 500); // Small delay to let users see the completion message
    }
  };

  // Handle individual week approval for monthly view (legacy function - now uses unified handler)
  const handleApproveWeek = async (weekIndex: number) => {
    await handleUnifiedApproval('week', weekIndex);
  };

  // Handle confirmation dialog actions
  const handleConfirmApproval = async () => {
    if (!pendingApprovalData) return;
    
    setShowApprovalConfirmation(false);
    setShowSavingModal(true);
    setSavingMessage('Approving plan...');
    setLoading('approving', 'Approving plan...');
    setIsApproving(true);
    
    try {
      const result = await approvePlanWithUpsert(
        pendingApprovalData.clientId,
        pendingApprovalData.planStartDate,
        pendingApprovalData.viewMode
      );
      
      if (result.success) {
        const planType = pendingApprovalData.viewMode === 'monthly' ? 'monthly' : 'weekly';
        toast({
          title: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Approved`,
          description: `The ${planType} workout plan has been approved and saved to the main schedule.`,
          variant: 'default'
        });
        
        // IMMEDIATE UI UPDATE: Update all states immediately for instant feedback
        console.log('[handleConfirmApproval] Approval succeeded, updating UI immediately');
        
        // Update state immediately with optimistic updates
        setPlanApprovalStatus('approved');
        setIsDraftPlan(false);
        updateWorkoutPlanState({
          status: 'approved',
          source: 'database',
          hasUnsavedChanges: false,
          lastSaved: new Date()
        });
        
        // Clear dirty dates after successful approval
        setDirtyDates(new Set());
        
        // Force update week statuses to show approved status
        if (pendingApprovalData.viewMode === 'monthly') {
          const approvedWeekStatuses = Array.from({ length: 4 }, (_, index) => ({
            weekNumber: index + 1,
            status: 'approved' as const,
            startDate: new Date(pendingApprovalData.planStartDate.getTime() + index * 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(pendingApprovalData.planStartDate.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000),
            canApprove: false
          }));
          setWeekStatuses(approvedWeekStatuses);
        } else {
          setWeekStatuses([{
            weekNumber: 1,
            status: 'approved' as const,
            startDate: pendingApprovalData.planStartDate,
            endDate: new Date(pendingApprovalData.planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            canApprove: false
          }]);
        }
        
        // Force refresh key to trigger UI updates
        setForceRefreshKey(prev => prev + 1);
        
        // BACKGROUND REFRESH: Do database refresh in background without blocking UI
        setTimeout(async () => {
          try {
            console.log('[handleConfirmApproval] Starting background refresh for data consistency');
            
            // Refresh the plan data to show approved version (but don't override status)
            await fetchPlan();
            
            // SKIP DATABASE STATUS CHECK: Don't call handlePostSaveRefreshEnhanced after approval
            // as it would override our optimistic 'approved' status
            console.log('[handleConfirmApproval] Skipping database status check to preserve approved status');
            
            console.log('[handleConfirmApproval] Background refresh completed successfully');
          } catch (refreshError) {
            console.warn('[handleConfirmApproval] Background refresh failed:', refreshError);
            // Don't show error to user since UI is already updated optimistically
          }
        }, 50); // Very short delay to avoid blocking UI
      } else {
        toast({
          title: 'Approval Failed',
          description: result.error || 'An error occurred during approval.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[handleConfirmApproval] Error:', error);
      toast({
        title: 'Approval Failed',
        description: 'An unexpected error occurred during approval.',
        variant: 'destructive'
      });
    } finally {
      clearLoading();
      setShowSavingModal(false);
      setIsApproving(false);
      setPendingApprovalData(null);
    }
  };

  const handleCancelApproval = () => {
    setShowApprovalConfirmation(false);
    setPendingApprovalData(null);
    clearLoading();
    setIsApproving(false);
  };

  // Re-check approval status whenever plan, client, date, or view mode changes
  // Removed workoutPlanState.status from dependencies to prevent infinite loop
  useEffect(() => {
    const componentName = 'WorkoutPlanSection';
    
    if (numericClientId && planStartDate) {
      RequestLogger.logStateChange(
        componentName,
        'useEffect_checkApprovalStatus',
        'triggered',
        'scheduled',
        `dependencies: clientId=${numericClientId}, date=${planStartDate?.toISOString()}, viewMode=${viewMode}`
      );
      
      // Add a longer delay to prevent rapid successive calls when viewMode changes
      // Use a longer delay for viewMode changes to prevent infinite loops
      const delay = viewMode === 'monthly' ? 1000 : 500; // 1 second for monthly, 500ms for weekly
      const timeoutId = setTimeout(() => {
        RequestLogger.logStateChange(
          componentName,
          'useEffect_checkApprovalStatus',
          'scheduled',
          'executing',
          'timeout_triggered'
        );
        checkPlanApprovalStatus();
      }, delay);
      
      return () => {
        RequestLogger.logStateChange(
          componentName,
          'useEffect_checkApprovalStatus',
          'scheduled',
          'cancelled',
          'component_cleanup'
        );
        clearTimeout(timeoutId);
      };
    } else {
      RequestLogger.logStateChange(
        componentName,
        'useEffect_checkApprovalStatus',
        'triggered',
        'skipped',
        `missing_data: clientId=${numericClientId}, date=${planStartDate?.toISOString()}`
      );
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
  const handleMonthlyGenerationComplete = async (monthlyPlan: any) => {
    console.log('✅ Monthly plan generation completed:', monthlyPlan);
    console.log('📊 Monthly plan structure:', {
      totalWeeks: monthlyPlan.weeks?.length || 0,
      weeksWithPlans: monthlyPlan.weeks?.filter((w: any) => w.plan)?.length || 0
    });

    // Convert monthly plan to weekly format for display, respecting client workout days
    const firstWeek = monthlyPlan.weeks?.[0];
    if (firstWeek && firstWeek.plan && firstWeek.plan.days) {
      console.log('📅 Setting first week for display:', {
        weekNumber: firstWeek.weekNumber,
        daysCount: firstWeek.plan.days.length,
        startDate: firstWeek.startDate,
        endDate: firstWeek.endDate
      });

      // Build a 7-day mapped week starting from the week's startDate
      const toDays = (workoutDays: any): string[] => {
        if (!workoutDays) return ['monday','wednesday','friday'];
        if (Array.isArray(workoutDays)) return workoutDays.map((d: any) => String(d).toLowerCase());
        if (typeof workoutDays === 'string') {
          if (workoutDays.includes('{') && workoutDays.includes('}')) {
            const match = workoutDays.match(/\{([^}]+)\}/);
            const days = match ? match[1].split(',').map(s => s.trim().toLowerCase()) : [];
            const map: Record<string,string> = { mon:'monday', tue:'tuesday', wed:'wednesday', thu:'thursday', fri:'friday', sat:'saturday', sun:'sunday' };
            return days.map(d => map[d] || d);
          }
          return workoutDays.toLowerCase().split(',').map(s => s.trim());
        }
        return ['monday','wednesday','friday'];
      };
      const mappedFirstWeek: TableWeekDay[] = (() => {
        const parsedWorkoutDays = toDays(client?.workout_days);
        const start = new Date(firstWeek.startDate);
        const workoutDayIndices: number[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (parsedWorkoutDays.includes(dayName)) workoutDayIndices.push(i);
        }
        const generated = firstWeek.plan.days || [];
        const totalGenerated = Math.min(7, generated.length);
        const targetIndices = (workoutDayIndices.length >= totalGenerated && workoutDayIndices.length > 0)
          ? workoutDayIndices.slice(0, totalGenerated)
          : Array.from({ length: totalGenerated }, (_, i) => i);
        const weekArr: TableWeekDay[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          weekArr.push({ date: format(d, 'yyyy-MM-dd'), focus: 'Rest Day', exercises: [] } as TableWeekDay);
        }
        for (let k = 0; k < totalGenerated; k++) {
          const idx = targetIndices[k] ?? k;
          const d = new Date(start.getTime() + idx * 24 * 60 * 60 * 1000);
          const src = generated[k] || {};
          const normalizedExercises = (src.exercises || []).map(normalizeExercise);
          weekArr[idx] = {
            date: format(d, 'yyyy-MM-dd'),
            focus: src.focus || 'Workout',
            exercises: normalizedExercises,
            timeBreakdown: src.timeBreakdown || { warmup: 0, exercises: 0, rest: 0, cooldown: 0, total: 0 }
          } as TableWeekDay;
        }
        return weekArr;
      })();

      const newWorkoutPlan = {
        week: mappedFirstWeek,
        hasAnyWorkouts: firstWeek.plan.days.some((day: any) => day.exercises && day.exercises.length > 0),
        planStartDate: firstWeek.startDate,
        planEndDate: firstWeek.endDate
      };

      setWorkoutPlan(newWorkoutPlan);
      setHasAIGeneratedPlan(true);
    } else {
      console.warn('⚠️ No valid first week found in monthly plan');
    }

    // Store the full monthly plan for later use, each week mapped to 7 days
    if (monthlyPlan.weeks) {
      const monthlyWeeks = monthlyPlan.weeks.map((w: any) => {
        if (!w?.plan?.days) return [];
        const start = new Date(w.startDate);
        const parsedWorkoutDays = ((): string[] => {
          const wd = client?.workout_days;
          if (!wd) return ['monday','wednesday','friday'];
          if (Array.isArray(wd)) return wd.map((d: any) => String(d).toLowerCase());
          if (typeof wd === 'string') {
            if (wd.includes('{') && wd.includes('}')) {
              const match = wd.match(/\{([^}]+)\}/);
              const days = match ? match[1].split(',').map(s => s.trim().toLowerCase()) : [];
              const map: Record<string,string> = { mon:'monday', tue:'tuesday', wed:'wednesday', thu:'thursday', fri:'friday', sat:'saturday', sun:'sunday' };
              return days.map(d => map[d] || d);
            }
            return wd.toLowerCase().split(',').map(s => s.trim());
          }
          return ['monday','wednesday','friday'];
        })();
        const workoutDayIndices: number[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (parsedWorkoutDays.includes(dayName)) workoutDayIndices.push(i);
        }
        const generated = w.plan.days || [];
        const totalGenerated = Math.min(7, generated.length);
        const targetIndices = (workoutDayIndices.length >= totalGenerated && workoutDayIndices.length > 0)
          ? workoutDayIndices.slice(0, totalGenerated)
          : Array.from({ length: totalGenerated }, (_, i) => i);
        const weekArr: TableWeekDay[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          weekArr.push({ date: format(d, 'yyyy-MM-dd'), focus: 'Rest Day', exercises: [] } as TableWeekDay);
        }
        for (let k = 0; k < totalGenerated; k++) {
          const idx = targetIndices[k] ?? k;
          const d = new Date(start.getTime() + idx * 24 * 60 * 60 * 1000);
          const src = generated[k] || {};
          const normalizedExercises = (src.exercises || []).map(normalizeExercise);
          weekArr[idx] = {
            date: format(d, 'yyyy-MM-dd'),
            focus: src.focus || 'Workout',
            exercises: normalizedExercises,
            timeBreakdown: src.timeBreakdown || { warmup: 0, exercises: 0, rest: 0, cooldown: 0, total: 0 }
          } as TableWeekDay;
        }
        return weekArr;
      });
      setMonthlyData(monthlyWeeks);
      console.log('💾 Stored monthly data with', monthlyWeeks.length, 'weeks');
    }

    // NEW: Save all weeks to schedule_preview before checking approval
    try {
      console.log('💾 [Monthly Generation] Saving all weeks to schedule_preview...');
      for (let weekIndex = 0; weekIndex < monthlyPlan.weeks.length; weekIndex++) {
        const weekData = monthlyPlan.weeks[weekIndex];
        if (weekData?.plan?.days) {
          const weekStartDate = new Date(weekData.startDate);
          await savePlanToSchedulePreview(weekData.plan.days, numericClientId, weekStartDate);
          console.log(`✅ [Monthly Generation] Saved week ${weekIndex + 1} to schedule_preview`);
        }
      }
      
      // IMMEDIATE STATE UPDATES: Apply the same pattern as other save operations
      console.log('[Monthly Generation] Applying immediate state updates for instant approval button display');
      
      // Clear dirty dates since data is now saved to database
      setDirtyDates(new Set());
      
      // Mark as draft plan to enable approve buttons immediately
      setIsDraftPlan(true);
      
      // Update plan approval status to show approve buttons
      setPlanApprovalStatus('not_approved');
      
      // Force refresh key to trigger UI updates
      setForceRefreshKey(prev => prev + 1);
      
      // Update workout plan state
      updateWorkoutPlanState({
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        status: 'draft',
        source: 'generated'
      });
      
      // Also ensure week statuses are updated for monthly view
      console.log('[Monthly Generation] Updating week statuses for monthly view...');
      const monthlyWeekStatuses = Array.from({ length: 4 }, (_, index) => ({
        weekNumber: index + 1,
        status: 'draft' as const,
        startDate: new Date(planStartDate.getTime() + index * 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(planStartDate.getTime() + (index + 1) * 7 * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000),
        canApprove: true
      }));
      setWeekStatuses(monthlyWeekStatuses);
      
      // BACKGROUND REFRESH: Do database validation in background (same pattern as other saves)
      setTimeout(async () => {
        try {
          console.log('[Monthly Generation] Starting background refresh for data consistency');
          await handlePostSaveRefreshEnhanced({
            isMonthly: true,
            forceWeekStatusRefresh: true,
            delayBeforeRefresh: 100
          });
          console.log('[Monthly Generation] Background refresh completed successfully');
        } catch (refreshError) {
          console.warn('[Monthly Generation] Background refresh failed:', refreshError);
          // Don't show error to user since UI is already updated optimistically
        }
      }, 50); // Very short delay to avoid blocking UI

    toast({
      title: 'Monthly Plan Generated',
      description: '4-week progressive workout plan created and saved successfully.'
    });

    } catch (error) {
      console.error('❌ [Monthly Generation] Failed to save monthly plan:', error);
      toast({ 
        title: 'Save Failed', 
        description: 'Could not save monthly plan to database. Please try again.', 
        variant: 'destructive' 
      });
    }

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
    const componentName = 'WorkoutPlanSection';
    
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

    // Generate unique key for this generation operation
    const generationKey = RequestDeduplication.generateKey('generateSearchPlan', {
      clientId: numericClientId,
      planStartDate: planStartDate?.toISOString(),
      viewMode
    });

    // Use request deduplication to prevent multiple simultaneous generations
    return RequestDeduplication.execute(generationKey, async () => {

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
      const generationStartTime = Date.now();
      
      // Update loading message to show progress
      setLoading('generating', 'Analyzing client data and generating personalized workout plan...');
      
      RequestLogger.logPerformance('enhanced_workout_generation_start', componentName, generationStartTime, {
        success: true,
        metadata: { clientId: numericClientId, planStartDate: planStartDate?.toISOString() }
      });
      
      // Use the search-based workout generator with timeout protection
      const generationPromise = loggedOperation(
        'EnhancedWorkoutGenerator.generateWorkoutPlan',
        componentName,
        () => EnhancedWorkoutGenerator.generateWorkoutPlan(numericClientId, planStartDate),
        { clientId: numericClientId, planStartDate: planStartDate?.toISOString() }
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
        
        // Build a full 7-day week array starting from planStartDate, mapping generated days to client workout days
        // Reuse the existing parser from search-based library to ensure consistency
        // Import is not available here; use a local lightweight parser equivalent
        const toDays = (workoutDays: any): string[] => {
          if (!workoutDays) return ['monday','wednesday','friday'];
          if (Array.isArray(workoutDays)) return workoutDays.map((d: any) => String(d).toLowerCase());
          if (typeof workoutDays === 'string') {
            if (workoutDays.includes('{') && workoutDays.includes('}')) {
              const match = workoutDays.match(/\{([^}]+)\}/);
              const days = match ? match[1].split(',').map(s => s.trim().toLowerCase()) : [];
              const map: Record<string,string> = { mon:'monday', tue:'tuesday', wed:'wednesday', thu:'thursday', fri:'friday', sat:'saturday', sun:'sunday' };
              return days.map(d => map[d] || d);
            }
            return workoutDays.toLowerCase().split(',').map(s => s.trim());
          }
          return ['monday','wednesday','friday'];
        };
        const parsedWorkoutDays = toDays(client?.workout_days);
        const week = [] as TableWeekDay[];
        const workoutDayIndices: number[] = [];
        
        // Precompute 7-day window dates and which are workout days
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (parsedWorkoutDays.includes(dayName)) {
            workoutDayIndices.push(i);
          }
        }

        // Determine target indices where generated days should be placed
        const totalGenerated = Math.min(7, searchDays?.length || 0);
        let targetIndices: number[];
        if (workoutDayIndices.length >= totalGenerated && workoutDayIndices.length > 0) {
          targetIndices = workoutDayIndices.slice(0, totalGenerated);
        } else {
          // Fallback: place consecutively from the start of the week
          targetIndices = Array.from({ length: totalGenerated }, (_, i) => i);
        }

        // Initialize week with Rest Days for all 7 dates
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          week.push({ date: dateStr, focus: 'Rest Day', exercises: [] } as TableWeekDay);
        }

        // Place generated days into the chosen indices
        for (let k = 0; k < totalGenerated; k++) {
          const idx = targetIndices[k] ?? k;
          const currentDate = new Date(planStartDate.getTime() + idx * 24 * 60 * 60 * 1000);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const generated = searchDays[k] || {};
          const normalizedExercises = (generated.exercises || []).map(normalizeExercise);
          week[idx] = {
            date: dateStr,
            focus: generated.focus || 'Workout',
            exercises: normalizedExercises,
            timeBreakdown: generated.timeBreakdown || {
              warmup: 0,
              exercises: 0,
              rest: 0,
              cooldown: 0,
              total: 0
            }
          } as TableWeekDay;
          console.log(`🚀 Placed generated day ${k} at index ${idx} (${dateStr})`);
        }
        
        console.log('🚀 Final week structure:', week);
        console.log('🚀 First week day sample:', week[0]);
        console.log('🚀 First week day exercises:', week[0]?.exercises);
        
        const newWorkoutPlan = {
          week,
          hasAnyWorkouts: week.some((day: TableWeekDay) => day.exercises && day.exercises.length > 0),
          planStartDate: week[0]?.date || '',
          planEndDate: week[week.length - 1]?.date || ''
        };
        console.log('✅ Setting enhanced workout plan:', newWorkoutPlan);
        setWorkoutPlan(newWorkoutPlan);
        setHasAIGeneratedPlan(true); // Mark that plan data is now available
        
        // Immediately save to schedule_preview with timeout protection
        setShowSavingModal(true);
        setSavingMessage('Saving generated workout plan...');
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
          
          // Force unified approval status update after generation
          console.log('[DEBUG] Forcing unified approval status update after generation...');
          setForceRefreshKey(prev => prev + 1);
          
          // Ensure global approval status is properly set for both weekly and monthly views
          console.log('[DEBUG] Setting global approval status to draft...');
          setPlanApprovalStatus('not_approved');
          setIsDraftPlan(true);
          
          // Also ensure week statuses are updated for local approve buttons
          if (viewMode === 'weekly') {
            console.log('[DEBUG] Updating week statuses for weekly view...');
            setWeekStatuses([{
              weekNumber: 1,
              status: 'draft',
              startDate: planStartDate,
              endDate: new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
              canApprove: true
            }]);
          }
          
          // Force immediate unified approval status update
          console.log('[DEBUG] Forcing immediate unified approval status update...');
          setForceRefreshKey(prev => prev + 1);
          
          // Add a small delay to ensure all state updates are processed
          setTimeout(() => {
            console.log('[DEBUG] Unified approval status should now be updated');
            // Force another refresh to ensure global approval button appears
            setForceRefreshKey(prev => prev + 1);
          }, 100);
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
      setShowSavingModal(false);
      console.log('🔄 === ENHANCED GENERATION END ===');
    }
  }, {
    onDuplicate: () => {
      console.log('🔄 [handleGenerateSearchPlan] Duplicate request detected, returning existing promise');
      toast({ 
        title: 'Generation in Progress', 
        description: 'Workout plan is already being generated. Please wait.',
        variant: 'default' 
      });
    }
  });
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[WorkoutPlanSection] Error caught by boundary:', error, errorInfo);
        // You could also send this to an error reporting service here
      }}
    >
      <div className="space-y-8">
      {/* Client Goals & Preferences Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Client Goals & Preferences</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and edit client goals, preferences, and insights</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleClientGoalsToggle}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          {isClientGoalsExpanded ? 'Hide Details' : 'Show Details'}
          {isClientGoalsExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Collapsible Client Goals & Preferences Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isClientGoalsExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {/* Collapsible Client Details Section */}
        <div className="mb-6">
          <Button
            onClick={() => setShowClientDetails(!showClientDetails)}
            variant="outline"
            className="w-full justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-300"
          >
            <span className="font-medium text-gray-900 dark:text-white">
              Show Client Details
            </span>
            {showClientDetails ? (
              <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </Button>

          {/* Collapsible Cards Container */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showClientDetails ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <FitnessGoalsPlaceholder onClick={() => setOpenPopup('fitnessGoals')} client={client} />
              <TrainingPreferencesPlaceholder onClick={() => setOpenPopup('trainingPreferences')} client={client} />
              <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
              <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
              <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
            </div>
          </div>
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
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Date Picker Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Plan Start Date
              </label>
              <div className="flex items-center gap-3">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full sm:w-[220px] justify-start text-left font-normal shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {format(planStartDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start" side="bottom" sideOffset={8}>
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
                          setIsCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* View Mode Toggle Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                View Mode
              </label>
              <div
                className={`flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-2 shadow-lg border border-blue-200 dark:border-blue-700 ${
                  isViewSwitching ? 'opacity-75' : ''
                }`}
              >
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="default"
                  disabled={isViewSwitching || isCheckingApproval || isWorkoutDataLoading}
                  onClick={() => {
                    if (!isViewSwitching && !isCheckingApproval && !isWorkoutDataLoading) {
                      setViewMode('weekly');
                      setIsCalendarOpen(false);
                    }
                  }}
                  className={`font-semibold px-6 py-3 transition-all duration-300 transform hover:scale-105 ${
                    viewMode === 'weekly' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl' 
                      : 'hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                  } ${(isViewSwitching || isCheckingApproval || isWorkoutDataLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {isViewSwitching && viewMode !== 'weekly' ? 'Loading...' : 'Weekly'}
                </Button>
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="default"
                  disabled={isViewSwitching || isCheckingApproval || isWorkoutDataLoading}
                  onClick={() => {
                    if (!isViewSwitching && !isCheckingApproval && !isWorkoutDataLoading) {
                      setViewMode('monthly');
                      setIsCalendarOpen(false);
                    }
                  }}
                  className={`font-semibold px-6 py-3 transition-all duration-300 transform hover:scale-105 ${
                    viewMode === 'monthly' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xl' 
                      : 'hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-2 border-purple-200 dark:border-purple-700'
                  } ${(isViewSwitching || isCheckingApproval || isWorkoutDataLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {isViewSwitching && viewMode !== 'monthly' ? 'Loading...' : 'Monthly'}
                </Button>
              </div>
              
              {/* Loading indicator for view switching */}
              {isViewSwitching && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Switching to {viewMode === 'weekly' ? 'Monthly' : 'Weekly'} view...</span>
                </div>
              )}
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
        
        {/* Step 2: Generate & Approve Workout Plan */}
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <div>
              <h5 className="text-lg font-bold text-green-900 dark:text-green-100">Generate & Approve Plan</h5>
              <p className="text-sm text-green-700 dark:text-green-300">
                {((planApprovalStatus === 'not_approved' || planApprovalStatus === 'partial_approved') && isDraftPlan) 
                  ? 'Create or approve your workout plan using AI-powered exercise selection' 
                  : 'Create your workout plan using AI-powered exercise selection'
                }
              </p>
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
                              /* title={isPastDate(planStartDate) ? 'Cannot generate plan for past dates' : `Generate ${viewMode === 'monthly' ? 'monthly' : 'optimized'} workout plan using smart exercise selection`} */
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
            
            {/* Unsaved Changes Warning and Save Button */}
            {dirtyDates.size > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <span className="h-4 w-4 rounded-full bg-orange-500"></span>
                  </div>
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    You have {dirtyDates.size} unsaved change{dirtyDates.size === 1 ? '' : 's'}. Save your changes before approving the plan.
                  </span>
                </div>
                <Button
                  onClick={async () => {
                    if (!workoutPlan) return;
                    console.log('[WorkoutPlanSection] Save Plan to Database button clicked');
                    setShowSavingModal(true);
                    setSavingMessage('Saving changes...');
                    setIsSavingEdits(true);
                    
                    try {
                      // Show loading toast
                      const loadingToastId = showLoading('Saving Changes', 'Please wait while we save your workout plan...');
                      
                      console.log('[WorkoutPlanSection] About to call handleApproveSave');
                      console.log('[WorkoutPlanSection] 🔍 DEBUG: workoutPlan.week data:', {
                        hasWorkoutPlan: !!workoutPlan,
                        hasWeek: !!(workoutPlan?.week),
                        weekLength: workoutPlan?.week?.length || 0,
                        weekData: workoutPlan?.week?.map((day: any) => ({
                          date: day.date,
                          focus: day.focus,
                          exercisesCount: day.exercises?.length || 0,
                          hasExercises: !!(day.exercises && day.exercises.length > 0)
                        })) || [],
                        clientId: numericClientId,
                        planStartDate: planStartDate
                      });
                      
                      // Use state machine to handle save operation
                      const success = await handleApproveSave(
                        { week: workoutPlan.week, clientId: numericClientId, planStartDate },
                        async (data) => {
                          console.log('[WorkoutPlanSection] 🔍 DEBUG: Data passed to savePlanToSchedulePreview:', {
                            weekLength: data.week?.length || 0,
                            clientId: data.clientId,
                            planStartDate: data.planStartDate,
                            weekData: data.week?.map((day: any) => ({
                              date: day.date,
                              focus: day.focus,
                              exercisesCount: day.exercises?.length || 0
                            })) || []
                          });
                          
                          const result = await savePlanToSchedulePreview(data.week, data.clientId, data.planStartDate);
                          console.log('[WorkoutPlanSection] savePlanToSchedulePreview result:', result);
                          return result;
                        }
                      );
                      
                      console.log('[WorkoutPlanSection] handleApproveSave returned:', success);
                      
                      // Hide loading toast
                      hideToast(loadingToastId);
                      
                      if (success) {
                        showSuccess('Changes Saved', 'Your workout plan has been saved successfully!');
                        
                        // Clear dirty dates by notifying WorkoutPlanTable
                        setDirtyDates(new Set());
                        
                        // Update workout plan state
                        updateWorkoutPlanState({ 
                          hasUnsavedChanges: false, 
                          lastSaved: new Date() 
                        });
                        
                        // Show refresh loading toast
                        const refreshToastId = showLoading('Checking Status', 'Verifying your plan is ready for approval...');
                        
                        // IMMEDIATE STATE UPDATES: Show approve buttons immediately after save
                        console.log('[Save Operation] Updating states immediately for instant approval button display');
                        
                        // Clear dirty dates immediately
                        setDirtyDates(new Set());
                        
                        // Mark as draft plan to enable approve buttons
                        setIsDraftPlan(true);
                        
                        // Update plan approval status to show approve buttons
                        setPlanApprovalStatus('not_approved');
                        
                        // Force refresh key to trigger UI updates
                        setForceRefreshKey(prev => prev + 1);

                        // Handle status refresh using state machine (background)
                        handleApproveRefresh(async () => {
                          try {
                            // Run refresh in background without blocking UI
                            setTimeout(async () => {
                              await handlePostSaveRefreshEnhanced({
                                isMonthly: viewMode === 'monthly',
                                forceWeekStatusRefresh: true,
                                delayBeforeRefresh: 100,
                                skipDatabaseCheck: false
                              });
                            }, 50);
                            
                            console.log('[Save Operation] Immediate state update completed, background refresh scheduled');
                            return { canApprove: true }; // Return success immediately
                          } catch (error) {
                            console.error('[Save Operation] State update failed:', error);
                            return { canApprove: false, error: error instanceof Error ? error.message : 'Unknown error' };
                          }
                        });
                        
                        // Hide refresh loading toast
                        hideToast(refreshToastId);
                        
                        // Show success message
                        showSuccess('Ready to Approve', 'Your plan is now ready for approval!');
                        
                        // Force a refresh to ensure the Save Plan to Database button is properly coordinated
                        setForceRefreshKey(prev => prev + 1);
                      } else {
                        showError('Save Failed', 'Could not save your changes. Please try again.', () => {
                          // Retry save operation
                          console.log('Retrying save operation...');
                        });
                      }
                    } catch (error) {
                      console.error('Save failed:', error);
                      showError('Save Failed', 'An unexpected error occurred while saving. Please try again.', () => {
                        // Retry save operation
                        console.log('Retrying save operation...');
                      });
                    } finally {
                      setIsSavingEdits(false);
                      setShowSavingModal(false);
                    }
                  }}
                  disabled={isSavingEdits}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSavingEdits ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Plan to Database
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* State Machine Based Global Approve Button */}
            <StateMachineApprovalButton
              type="global"
              onApprove={handleUnifiedApproval}
              showInlineStatus={false}
              onRetry={() => {
                console.log('[StateMachineApprovalButton] Manual retry triggered');
                // Trigger a manual retry of the save/refresh process
                dispatchApproveAction('RETRY');
              }}
              stateMachineInstance={{
                state: approveButtonState,
                buttonConfig: approveButtonConfig,
                dispatch: dispatchApproveAction,
                handleSave: handleApproveSave,
                handleRefresh: handleApproveRefresh,
                handleApprove: handleApproveAction,
                handleRetry: handleApproveRetry,
                reset: resetApproveState,
                isState: isApproveState,
                canTransition: canTransitionAction,
                getRetryInfo: getApproveRetryInfo
              }}
            />
            
            {/* Unified Refresh Indicator */}
            <RefreshIndicator
              state={refreshState}
              onRetry={() => {
                console.log('[WorkoutPlanSection] Retry refresh triggered');
                setForceRefreshKey(prev => prev + 1);
              }}
              onCancel={() => {
                console.log('[WorkoutPlanSection] Cancel refresh triggered');
                clearRefreshQueue();
              }}
              showDetails={true}
            />
            
            {/* Offline Status Badge */}
            <OfflineStatusBadge />
            
            {/* Progress indicator for approval */}
            {isApproving && (
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Approval in progress... This may take a few moments for {viewMode === 'monthly' ? 'monthly plans' : 'weekly plans'}.
                </span>
              </div>
            )}

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
      </div>

      {/* Collapsible Plan Management */}
      <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100">Plan Management</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Import, export, or save your workout plans
                </p>
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

                {/* Refresh Data Button */}
                <Button 
                  variant="outline" 
                  size="default"
                  className="bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 hover:from-orange-600 hover:via-amber-700 hover:to-yellow-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 font-bold px-6 py-2 transform hover:scale-105"
                  onClick={forceRefreshWorkoutPlan}
                  disabled={isFetchingPlan}
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> 
                  {isFetchingPlan ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Plan Table or Empty State */}
      <div>
        {/* SECOND SAVE BUTTON - COMMENTED OUT TO AVOID DUPLICATE BUTTONS */}
        {/*
        {workoutPlan && isDraftPlan && (
          <div className="mb-2 flex items-center gap-4">
            <Button
              onClick={async () => {
                console.log('[WorkoutPlanSection] Save Plan to Database button clicked');
                setShowSavingModal(true);
                setSavingMessage('Saving changes...');
                setIsSavingEdits(true);
                
                try {
                  // Show loading toast
                  const loadingToastId = showLoading('Saving Changes', 'Please wait while we save your workout plan...');
                  
                  console.log('[WorkoutPlanSection] About to call handleApproveSave');
                  // Use state machine to handle save operation
                  const success = await handleApproveSave(
                    { week: workoutPlan.week, clientId: numericClientId, planStartDate },
                    async (data) => {
                      const result = await savePlanToSchedulePreview(data.week, data.clientId, data.planStartDate);
                      console.log('[WorkoutPlanSection] savePlanToSchedulePreview result:', result);
                      return result;
                    }
                  );
                  
                  console.log('[WorkoutPlanSection] handleApproveSave returned:', success);
                  
                  // Hide loading toast
                  hideToast(loadingToastId);
                  
                  if (success) {
                    showSuccess('Changes Saved', 'Your workout plan has been saved successfully!');
                    
                    // Clear dirty dates by notifying WorkoutPlanTable
                    setDirtyDates(new Set());
                    
                    // Update workout plan state
                    updateWorkoutPlanState({ 
                      hasUnsavedChanges: false, 
                      lastSaved: new Date() 
                    });
                    
                    // Show refresh loading toast
                    const refreshToastId = showLoading('Checking Status', 'Verifying your plan is ready for approval...');
                    
                    // IMMEDIATE STATE UPDATES: Show approve buttons immediately after save
                    console.log('[Save Operation] Updating states immediately for instant approval button display');
                    
                    // Clear dirty dates immediately
                    setDirtyDates(new Set());
                    
                    // Mark as draft plan to enable approve buttons
                    setIsDraftPlan(true);
                    
                    // Update plan approval status to show approve buttons
                    setPlanApprovalStatus('not_approved');
                    
                    // Force refresh key to trigger UI updates
                    setForceRefreshKey(prev => prev + 1);

                    // Handle status refresh using state machine (background)
                    handleApproveRefresh(async () => {
                      try {
                        // Run refresh in background without blocking UI
                        setTimeout(async () => {
                          await handlePostSaveRefreshEnhanced({
                            isMonthly: viewMode === 'monthly',
                            forceWeekStatusRefresh: true,
                            delayBeforeRefresh: 100,
                            skipDatabaseCheck: false
                          });
                        }, 50);
                        
                        console.log('[Save Operation] Immediate state update completed, background refresh scheduled');
                        return { canApprove: true }; // Return success immediately
                      } catch (error) {
                        console.error('[Save Operation] State update failed:', error);
                        return { canApprove: false, error: error instanceof Error ? error.message : 'Unknown error' };
                      }
                    });
                    
                    // Hide refresh loading toast
                    hideToast(refreshToastId);
                    
                    // Show success message
                    showSuccess('Ready to Approve', 'Your plan is now ready for approval!');
                    
                    // Force a refresh to ensure the Save Plan to Database button is properly coordinated
                    setForceRefreshKey(prev => prev + 1);
                  } else {
                    showError('Save Failed', 'Could not save your changes. Please try again.', () => {
                      // Retry save operation
                      console.log('Retrying save operation...');
                    });
                  }
                } catch (error) {
                  console.error('Save failed:', error);
                  showError('Save Failed', 'An unexpected error occurred while saving. Please try again.', () => {
                    // Retry save operation
                    console.log('Retrying save operation...');
                  });
                } finally {
                  setIsSavingEdits(false);
                  setShowSavingModal(false);
                }
              }}
              disabled={isSavingEdits || !isApproveState('disabled_save_first')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSavingEdits ? 'Saving...' : 'Save Plan to Database'}
            </Button>
          </div>
        )}
        */}
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
        {(isFetchingPlan || isWorkoutDataLoading) ? (
          <Card className="flex items-center justify-center h-64">
            <span>Loading workout plan...</span>
          </Card>
        ) : workoutPlan ? (
          <div className="space-y-4">
            {/* 7-Day Overview Header */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {viewMode === 'monthly' ? '28-Day' : '7-Day'} Workout Plan: {format(planStartDate, "MMM d")} - {format(new Date(planStartDate.getTime() + (viewMode === 'monthly' ? 27 : 6) * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
                  </h3>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setWeekModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  >
                    <Edit className="h-4 w-4" />
                    Edit/View Plan
                  </Button>
                </div>
              </div>

              {/* Status row removed per request */}
              <WeeklyPlanHeader
                week={(viewMode === 'weekly') ? (() => {
                  // Ensure exactly 7 days are passed in weekly mode
                  const weekData = workoutPlan.week || [];
                  if (weekData.length >= 7) {
                    return weekData.slice(0, 7);
                  }
                  // If we have fewer than 7 days, pad with rest days
                  const paddedWeek = [...weekData];
                  for (let i = weekData.length; i < 7; i++) {
                    // Use addDays to avoid timezone issues
                    const dayDate = addDays(planStartDate, i);
                    const dateStr = format(dayDate, 'yyyy-MM-dd');
                    paddedWeek.push({
                      date: dateStr,
                      focus: 'Rest Day',
                      exercises: [],
                      timeBreakdown: { warmup: 0, exercises: 0, rest: 0, cooldown: 0, total: 0 }
                    });
                  }
                  return paddedWeek.slice(0, 7);
                })() : workoutPlan.week}
                planStartDate={planStartDate}
                onReorder={handlePlanChange}
                onPlanChange={handlePlanChange}
                clientId={numericClientId}
                viewMode={viewMode}
                onMonthlyDataChange={handleMonthlyDataChange}
                onApprovalStatusCheck={checkPlanApprovalStatus}
                onForceRefreshStatus={forceRefreshStatus}
                weekStatuses={weekStatuses}
                onApproveWeek={handleApproveWeek}
                dirtyDates={dirtyDates}
                onDirtyDatesChange={setDirtyDates}
                forceRefreshKey={forceRefreshKey}
                unifiedApprovalStatus={unifiedApprovalStatus}
                onUnifiedApproval={handleUnifiedApproval}
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
                key={`${viewMode}-${planStartDate.toISOString().split('T')[0]}-${clientId}`}
                week={getTableData()}
                clientId={numericClientId}
                onPlanChange={handlePlanChange}
                planStartDate={planStartDate}
                clientName={client?.name}
                onImportSuccess={handleImportSuccess}
                viewMode={viewMode}
                onDirtyDatesChange={setDirtyDates}
                weekStatuses={weekStatuses}
                onApproveWeek={handleApproveWeek}
                dirtyDates={dirtyDates}
                unifiedApprovalStatus={unifiedApprovalStatus}
                onUnifiedApproval={handleUnifiedApproval}
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
                    <Button
                      onClick={() => {
                        console.log('[WorkoutPlanSection] Reset stuck states triggered');
                        resetStuckStates();
                        toast({ 
                          title: 'States Reset', 
                          description: 'Reset stuck states. If issues persist, please refresh the page.',
                          variant: 'default'
                        });
                      }} 
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                  {isWorkoutDataLoading && (
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
              onSaveWeek={async (weekDays, clientId, weekStartDate) => {
                // Delegate to existing save, then apply immediate state updates
                const result = await savePlanToSchedulePreview(weekDays, clientId, weekStartDate);
                if (result?.success) {
                  // IMMEDIATE STATE UPDATES: Apply the same pattern as other save operations
                  console.log('[Monthly Generator Save Week] Applying immediate state updates for instant approval button display');
                  
                  // Clear dirty dates since data is now saved to database
                  setDirtyDates(new Set());
                  
                  // Mark as draft plan to enable approve buttons immediately
                  setIsDraftPlan(true);
                  
                  // Update plan approval status to show approve buttons
                  setPlanApprovalStatus('not_approved');
                  
                  // Force refresh key to trigger UI updates
                  setForceRefreshKey(prev => prev + 1);
                  
                  // Update workout plan state
                  updateWorkoutPlanState({
                    hasUnsavedChanges: false,
                    lastSaved: new Date(),
                    status: 'draft',
                    source: 'generated'
                  });
                  
                  // BACKGROUND REFRESH: Do database validation in background (same pattern as other saves)
                  setTimeout(async () => {
                    try {
                      console.log('[Monthly Generator Save Week] Starting background refresh for data consistency');
                      await handlePostSaveRefreshEnhanced({
                        isMonthly: true,
                        forceWeekStatusRefresh: true,
                        delayBeforeRefresh: 100
                      });
                      console.log('[Monthly Generator Save Week] Background refresh completed successfully');
                    } catch (refreshError) {
                      console.warn('[Monthly Generator Save Week] Background refresh failed:', refreshError);
                      // Don't show error to user since UI is already updated optimistically
                    }
                  }, 50); // Very short delay to avoid blocking UI
                }
                return result;
              }}
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

      {/* Saving Modal */}
      <Dialog open={showSavingModal} onOpenChange={setShowSavingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Saving Changes
            </DialogTitle>
            <DialogDescription>
              {savingMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please wait while your changes are being saved to the database.
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-500">
                This usually takes 1-2 seconds
              </span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <Dialog open={showApprovalConfirmation} onOpenChange={setShowApprovalConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Overwrite Existing Plan?
            </DialogTitle>
            <DialogDescription>
              {pendingApprovalData && (
                <>
                  There are already <strong>{pendingApprovalData.existingDataCount}</strong> workout entries in the schedule for this period.
                  <br /><br />
                  Approving this plan will <strong>overwrite</strong> the existing workout data with the new plan from the preview.
                  <br /><br />
                  <strong>This action cannot be undone.</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={handleCancelApproval}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmApproval}
              disabled={isApproving}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Approving...
                </>
              ) : (
                'Overwrite & Approve'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onClose={hideToast}
        position="top-right"
        maxToasts={3}
      />

      {/* WeeklyExerciseModal */}
      <WeekExerciseModal
        isOpen={weekModalOpen}
        onClose={() => setWeekModalOpen(false)}
        week={workoutPlan?.week || []}
        planStartDate={planStartDate}
        clientId={numericClientId}
        onSave={(updatedWeek) => {
          console.log('[WorkoutPlanSection] WeeklyExerciseModal save callback called with:', updatedWeek);
          // Convert WeekDay[] to TableWeekDay[] for compatibility
          const tableWeekData = updatedWeek.map(day => ({
            ...day,
            exercises: day.exercises.map(ex => ({
              ...ex,
              time: ex.duration || 0, // Map duration to time for compatibility
              date: day.date // Add date field for compatibility
            }))
          })) as TableWeekDay[];
          
          // Update the workout plan with the saved week data
          setWorkoutPlan(prev => prev ? { ...prev, week: tableWeekData } : null);
          
          // IMMEDIATE STATE UPDATES: Apply the same pattern as other save operations
          console.log('[WorkoutPlanSection] WeeklyExerciseModal: Applying immediate state updates for instant approval button display');
          
          // Clear dirty dates since data is now saved to database
          const weekDates = updatedWeek.map(day => day.date);
          const newDirtyDates = new Set([...Array.from(dirtyDates)]);
          // Remove the week dates from dirty dates since they're now saved
          weekDates.forEach(date => newDirtyDates.delete(date));
          console.log('[WorkoutPlanSection] Clearing dirty dates for week dates:', weekDates);
          setDirtyDates(newDirtyDates);
          
          // Mark as draft plan to enable approve buttons immediately
          setIsDraftPlan(true);
          
          // Update plan approval status to show approve buttons
          setPlanApprovalStatus('not_approved');
          
          // Force refresh key to trigger UI updates
          setForceRefreshKey(prev => prev + 1);
          
          // Update workout plan state
          updateWorkoutPlanState({
            hasUnsavedChanges: false,
            lastSaved: new Date(),
            status: 'draft',
            source: 'generated'
          });
          
          // Close the modal
          setWeekModalOpen(false);
          
          // BACKGROUND REFRESH: Do database validation in background (same pattern as other saves)
          setTimeout(async () => {
            try {
              console.log('[WorkoutPlanSection] WeeklyExerciseModal: Starting background refresh for data consistency');
              await handlePostSaveRefreshEnhanced({
                isMonthly: viewMode === 'monthly',
                forceWeekStatusRefresh: true,
                delayBeforeRefresh: 100,
                skipDatabaseCheck: false
              });
              console.log('[WorkoutPlanSection] WeeklyExerciseModal: Background refresh completed successfully');
            } catch (refreshError) {
              console.warn('[WorkoutPlanSection] WeeklyExerciseModal: Background refresh failed:', refreshError);
              // Don't show error to user since UI is already updated optimistically
            }
          }, 50); // Very short delay to avoid blocking UI
        }}
      />
    </div>
    </ErrorBoundary>
  );
};

export default WorkoutPlanSection; 