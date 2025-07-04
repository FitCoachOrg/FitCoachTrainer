"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Calendar,
  Weight,
  Edit,
  Activity,
  Target,
  TrendingUp,
  Clock,
  Save,
  Dumbbell,
  Utensils,
  Heart,
  Footprints,
  Pencil,
  Plus,
  Trash2,
  X,
  Sparkles,
  Zap,
  Edit3,
  Trophy,
  BarChart3,
  PieChart,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Play,
  Download,
  Share,
  Settings,
  LineChart,
  Users,
  CheckCircle,
} from "lucide-react"
import {
  LineChart as Chart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNavigate, useParams } from "react-router-dom"
import { DndContext, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HeaderBar } from "@/components/header-bar"
import { DescriptionInput } from "@/components/description-input"
import { ViewTabs } from "@/components/view-tabs"
import { ProgramCardsContainer } from "@/components/program-cards-container"
import { SaveButton } from "@/components/save-button"
import { AddTaskDropdown } from "@/components/add-task-dropdown"
import WorkoutPlanSection from "@/components/WorkoutPlanSection"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"
// Import the AI nutrition plan generator
import { generateAINutritionPlan } from "@/lib/ai-nutrition-plan"

import { summarizeTrainerNotes } from "@/lib/ai-notes-summary"
import { Progress } from "@/components/ui/progress"

import { getOrCreateEngagementScore } from "@/lib/client-engagement"


// Define types for AI response (matching the actual implementation)
interface AIResponse {
  response: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
  timestamp: string
}

interface ClientInfo {
  name?: string
  preferredName?: string
  [key: string]: any
}

// AI Response Popup Component
const AIResponsePopup = ({
  isOpen,
  onClose,
  aiResponse,
  clientName,
  onShowMetrics,
}: {
  isOpen: boolean
  onClose: () => void
  aiResponse: AIResponse | null
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
            setWorkoutPlan(parsedData.workout_plan)
          }
        }
      } catch (error) {
        console.error("Error parsing workout plan:", error)
      }
    }
  }, [aiResponse])

  const handleWorkoutChange = (index: number, field: string, value: any) => {
    const updatedPlan = [...workoutPlan]
    updatedPlan[index] = { ...updatedPlan[index], [field]: value }
    setWorkoutPlan(updatedPlan)
  }

  const addNewWorkout = () => {
    const newWorkout = {
      workout: "New Exercise",
      sets: 3,
      reps: "10",
      duration: 15,
      weights: "bodyweight",
      for_date: new Date().toISOString().split("T")[0],
      for_time: "08:00:00",
      body_part: "Full Body",
      category: "Strength",
      coach_tip: "Focus on proper form",
      icon: "💪",
      progression_notes: "Increase intensity when RPE ≤ 8",
    }
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6">
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI-Powered Personalization</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Your personalized fitness plan has been generated using advanced AI. You can view and edit the workout
              plan in the interactive table below.
            </p>
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="flex space-x-2 bg-gray-100/80 dark:bg-gray-800/80 p-2 rounded-2xl backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("table")}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === "table"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg shadow-blue-500/20 scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Workout Table
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === "raw"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg shadow-blue-500/20 scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <Edit className="w-4 h-4" />
              Raw Response
            </button>
          </div>

          {/* Enhanced Workout Plan Table */}
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
                      <Button
                        onClick={saveChanges}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Plan
                    </Button>
                  )}
                </div>
              </div>

              {workoutPlan.length > 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50">
                        <tr>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Exercise</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Sets</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Reps</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Duration</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Equipment</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Body Part</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Category</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Date</th>
                          <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Coach Tip</th>
                          {isEditing && (
                            <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {workoutPlan.map((workout, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 transition-all duration-200"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{workout.icon}</span>
                                {isEditing ? (
                                  <Input
                                    value={workout.workout}
                                    onChange={(e) => handleWorkoutChange(index, "workout", e.target.value)}
                                    className="font-medium border-2 focus:border-blue-400"
                                  />
                                ) : (
                                  <span className="font-semibold text-gray-900 dark:text-white">{workout.workout}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={workout.sets}
                                  onChange={(e) =>
                                    handleWorkoutChange(index, "sets", Number.parseInt(e.target.value) || 0)
                                  }
                                  className="w-20 text-center border-2 focus:border-blue-400"
                                />
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-bold"
                                >
                                  {workout.sets}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Input
                                  value={workout.reps}
                                  onChange={(e) => handleWorkoutChange(index, "reps", e.target.value)}
                                  className="w-24 border-2 focus:border-blue-400"
                                />
                              ) : (
                                <span className="font-medium text-gray-700 dark:text-gray-300">{workout.reps}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={workout.duration}
                                    onChange={(e) =>
                                      handleWorkoutChange(index, "duration", Number.parseInt(e.target.value) || 0)
                                    }
                                    className="w-20 text-center border-2 focus:border-blue-400"
                                  />
                                  <span className="text-sm text-gray-500">min</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-orange-500" />
                                  <span className="font-medium text-orange-600 dark:text-orange-400">
                                    {workout.duration} min
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Select
                                  value={workout.weights}
                                  onValueChange={(value) => handleWorkoutChange(index, "weights", value)}
                                >
                                  <SelectTrigger className="w-36 border-2 focus:border-blue-400">
                                    <SelectValue />
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
                                <Badge
                                  variant="outline"
                                  className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                                >
                                  {workout.weights}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Select
                                  value={workout.body_part}
                                  onValueChange={(value) => handleWorkoutChange(index, "body_part", value)}
                                >
                                  <SelectTrigger className="w-36 border-2 focus:border-blue-400">
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
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {workout.body_part}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Select
                                  value={workout.category}
                                  onValueChange={(value) => handleWorkoutChange(index, "category", value)}
                                >
                                  <SelectTrigger className="w-32 border-2 focus:border-blue-400">
                                    <SelectValue />
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
                                <Badge
                                  className={`font-medium ${
                                    workout.category === "Strength"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : workout.category === "Cardio"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        : workout.category === "Flexibility"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {workout.category}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={workout.for_date}
                                  onChange={(e) => handleWorkoutChange(index, "for_date", e.target.value)}
                                  className="w-36 border-2 focus:border-blue-400"
                                />
                              ) : (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(workout.for_date).toLocaleDateString()}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-64">
                              {isEditing ? (
                                <textarea
                                  value={workout.coach_tip}
                                  onChange={(e) => handleWorkoutChange(index, "coach_tip", e.target.value)}
                                  className="w-full p-3 text-sm border-2 border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:border-blue-400 dark:bg-gray-800"
                                  rows={3}
                                  placeholder="Enter coach tip..."
                                />
                              ) : (
                                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {workout.coach_tip}
                                </div>
                              )}
                            </td>
                            {isEditing && (
                              <td className="px-6 py-4">
                                <Button
                                  onClick={() => removeWorkout(index)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                >
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
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={addNewWorkout}
                        variant="outline"
                        className="border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Exercise
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Dumbbell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No workout plan found in the AI response</p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Raw Response Tab */}
          {activeTab === "raw" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50 p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                    <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-bold text-xl text-gray-900 dark:text-white">AI Response</h4>
                </div>
              </div>
              <div className="p-6">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                  {aiResponse.response}
                </pre>
              </div>
            </div>
          )}

          {/* Enhanced Usage Statistics */}
          {aiResponse.usage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-6 rounded-2xl border border-green-200/50 dark:border-green-800/50">
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

          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            {onShowMetrics && aiResponse.usage && (
              <Button
                variant="outline"
                onClick={onShowMetrics}
                className="border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/50"
              >
                <PieChart className="w-4 h-4 mr-2" />
                View Detailed Metrics
              </Button>
            )}
            <Button
              onClick={onClose}
              className="ml-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Client Data Popup Component
const ClientDataPopup = ({
  isOpen,
  onClose,
  clientInfo,
}: {
  isOpen: boolean
  onClose: () => void
  clientInfo: any
}) => {
  if (!isOpen || !clientInfo) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Client Data Retrieved
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Data Successfully Retrieved</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Successfully retrieved client data from the database. This information will be used to generate
              personalized AI plans.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{clientInfo.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Preferred Name:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.preferredName || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Age:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{clientInfo.age || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Sex:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{clientInfo.sex || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Height:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.height ? `${clientInfo.height} cm` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Weight:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.weight ? `${clientInfo.weight} kg` : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-green-500" />
                  Goals & Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Primary Goal:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{clientInfo.primaryGoal || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Activity Level:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.activityLevel || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Training Experience:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.trainingExperience || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Training Days/Week:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.trainingDaysPerWeek || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Available Equipment:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {clientInfo.availableEquipment || "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced AI Metrics Popup Component
const AIMetricsPopup = ({
  isOpen,
  onClose,
  metrics,
  clientName,
}: {
  isOpen: boolean
  onClose: () => void
  metrics: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    model: string
    timestamp: string
    responseTime?: number
  } | null
  clientName?: string
}) => {
  if (!isOpen || !metrics) return null

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const estimatedCost = (metrics.totalTokens * 0.00003).toFixed(4) // Rough GPT-4 estimate

  const pieData = [
    { name: "Input Tokens", value: metrics.inputTokens, color: "#3b82f6" },
    { name: "Output Tokens", value: metrics.outputTokens, color: "#10b981" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-950/30 dark:to-blue-950/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
                AI Generation Metrics
              </span>
              {clientName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">Analysis for {clientName}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {metrics.inputTokens.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Input Tokens</div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Prompt & Context</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  {metrics.outputTokens.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Output Tokens</div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70">Generated Content</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  {metrics.totalTokens.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Total Tokens</div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Combined Usage</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">${estimatedCost}</div>
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Est. Cost</div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70">Approximate</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Token Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Tooltip />
                      <RechartsPieChart data={pieData} cx="50%" cy="50%" outerRadius={60}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Input</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Output</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Generation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Model:</span>
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {metrics.model}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Response Time:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.responseTime ? formatTime(metrics.responseTime) : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Generated:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {new Date(metrics.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Token Ratio:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {((metrics.outputTokens / metrics.inputTokens) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// AI Notes Summary Popup Component
const AINotesSummaryPopup = ({ isOpen, onClose, summaryResponse, clientName }: {
  isOpen: boolean;
  onClose: () => void;
  summaryResponse: any | null;
  clientName?: string;
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'insights' | 'raw'>('summary');
  const [parsedSummary, setParsedSummary] = useState<any>(null);

  // Parse summary from AI response
  useEffect(() => {
    if (summaryResponse?.aiResponse?.response) {
      try {
        const jsonMatch = summaryResponse.aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          setParsedSummary(parsedData);
        }
      } catch (error) {
        console.error('Error parsing summary:', error);
      }
    }
  }, [summaryResponse]);

  if (!isOpen || !summaryResponse) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              📋
            </div>
            AI Notes Summary & Action Items{clientName ? ` for ${clientName}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Your trainer notes have been analyzed using AI to generate insights, action items, and recommendations.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {['summary', 'actions', 'insights', 'raw'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab === 'summary' ? 'Summary' : tab === 'actions' ? 'Action Items' : tab === 'insights' ? 'Insights' : 'Raw Data'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'summary' && parsedSummary?.summary && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Key Points</h3>
                <ul className="space-y-2">
                  {parsedSummary.summary.key_points?.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Client Progress</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">{parsedSummary.summary.client_progress}</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Challenges Identified</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {parsedSummary.summary.challenges_identified?.map((challenge: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {parsedSummary.summary.successes_highlighted?.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Successes Highlighted</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    {parsedSummary.summary.successes_highlighted.map((success: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{success}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && parsedSummary?.action_items && (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-300">Immediate Actions</h3>
                <div className="space-y-3">
                  {parsedSummary.action_items.immediate_actions?.map((action: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        action.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {action.priority}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{action.action}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>⏰ {action.timeframe}</span>
                          <span>📂 {action.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-300">Follow-up Items</h3>
                <div className="space-y-3">
                  {parsedSummary.action_items.follow_up_items?.map((action: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        action.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {action.priority}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{action.action}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span>⏰ {action.timeframe}</span>
                          <span>📂 {action.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && parsedSummary?.insights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Patterns Observed</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                    {parsedSummary.insights.patterns_observed?.map((pattern: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                    {parsedSummary.insights.areas_for_improvement?.map((area: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Positive Trends</h4>
                  <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                    {parsedSummary.insights.positive_trends?.map((trend: string, index: number) => (
                      <li key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {parsedSummary.next_session_focus && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Next Session Focus</h4>
                    <div className="space-y-2 text-sm text-indigo-700 dark:text-indigo-400">
                      {parsedSummary.next_session_focus.primary_objectives && (
                        <div>
                          <span className="font-medium">Objectives:</span>
                          <ul className="ml-4 mt-1">
                            {parsedSummary.next_session_focus.primary_objectives.map((obj: string, index: number) => (
                              <li key={index}>• {obj}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {summaryResponse.aiResponse?.response || 'No response data available'}
              </pre>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
};

interface EditableSectionProps {
  title: string
  icon: React.ElementType
  initialContent?: string
  storageKey: string
}
interface Exercise {
  id: string
  name: string
  instructions: string
  sets?: string
  reps?: string
  duration?: string
  equipment?: string
  difficulty: string
  createdAt?: string
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
  duration: number
  type: string
  difficulty: string
  color: string
  category: string
  body_part: string
  exercises: WorkoutExercise[]
}

interface MealItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

// Mock data for programs
const mockPrograms = [
  {
    id: 1,
    title: "Morning Strength Training",
    tag: "Strength",
    difficulty: "Medium",
    startDay: "Monday",
    color: "#39FF14",
    lastEdited: "2 days ago",
    description:
      "A comprehensive strength training program designed to build muscle and improve overall fitness through progressive overload techniques.",
    created: "2024-01-15",
  },
  {
    id: 2,
    title: "HIIT Cardio Blast",
    tag: "Cardio",
    difficulty: "Hard",
    startDay: "Tuesday",
    color: "#FF6B35",
    lastEdited: "1 week ago",
    description:
      "High-intensity interval training program that maximizes calorie burn and improves cardiovascular endurance in minimal time.",
    created: "2024-01-10",
  },
  {
    id: 3,
    title: "Beginner Yoga Flow",
    tag: "Flexibility",
    difficulty: "Easy",
    startDay: "Wednesday",
    color: "#4ECDC4",
    lastEdited: "3 days ago",
    description:
      "Gentle yoga sequences perfect for beginners looking to improve flexibility, balance, and mindfulness.",
    created: "2024-01-20",
  },
  {
    id: 4,
    title: "Powerlifting Fundamentals",
    tag: "Strength",
    difficulty: "Hard",
    startDay: "Thursday",
    color: "#FFD93D",
    lastEdited: "5 days ago",
    description: "Master the big three lifts with proper form and progressive programming for maximum strength gains.",
    created: "2024-01-08",
  },
  {
    id: 5,
    title: "Recovery & Mobility",
    tag: "Recovery",
    difficulty: "Easy",
    startDay: "Friday",
    color: "#A8E6CF",
    lastEdited: "1 day ago",
    description: "Active recovery sessions focusing on mobility work, stretching, and muscle recovery techniques.",
    created: "2024-01-25",
  },
  {
    id: 6,
    title: "Athletic Performance",
    tag: "Performance",
    difficulty: "Hard",
    startDay: "Saturday",
    color: "#FF8B94",
    lastEdited: "4 days ago",
    description: "Sport-specific training program designed to enhance athletic performance and competitive edge.",
    created: "2024-01-12",
  },
]

const difficultyColors = {
  Easy: "#10b981",
  Medium: "#f59e0b",
  Hard: "#ef4444",
}

const programTags = ["All", "Strength", "Cardio", "Flexibility", "Recovery", "Performance"]
const sortOptions = ["Recently updated", "Alphabetically", "Difficulty"]

const METRIC_LIBRARY = [
  {
    key: "weight",
    label: "Weight",
    icon: Weight,
    type: "line",
    color: "#3b82f6",
    data: [
      { date: "Jan", weight: 82.5 },
      { date: "Feb", weight: 81.8 },
      { date: "Mar", weight: 80.5 },
      { date: "Apr", weight: 79.2 },
      { date: "May", weight: 78.4 },
      { date: "Jun", weight: 77.6 },
      { date: "Jul", weight: 76.8 },
      { date: "Aug", weight: 76.2 },
      { date: "Sep", weight: 75.8 },
      { date: "Oct", weight: 75.2 },
      { date: "Nov", weight: 74.8 },
      { date: "Dec", weight: 74.4 },
    ],
    dataKey: "weight",
    yLabel: "kg",
  },
  {
    key: "sleep",
    label: "Sleep",
    icon: Clock,
    type: "bar",
    color: "#14b8a6",
    data: [
      { date: "Jan", hours: 5.8 },
      { date: "Feb", hours: 6.2 },
      { date: "Mar", hours: 6.5 },
      { date: "Apr", hours: 6.8 },
      { date: "May", hours: 7.0 },
      { date: "Jun", hours: 7.2 },
      { date: "Jul", hours: 7.0 },
      { date: "Aug", hours: 7.2 },
      { date: "Sep", hours: 7.4 },
      { date: "Oct", hours: 7.2 },
      { date: "Nov", hours: 7.0 },
      { date: "Dec", hours: 7.2 },
    ],
    dataKey: "hours",
    yLabel: "h",
  },
  {
    key: "heartRate",
    label: "Resting Heart Rate",
    icon: Heart,
    type: "line",
    color: "#e11d48",
    data: [
      { date: "Jan", rate: 78 },
      { date: "Feb", rate: 76 },
      { date: "Mar", rate: 74 },
      { date: "Apr", rate: 72 },
      { date: "May", rate: 70 },
      { date: "Jun", rate: 68 },
      { date: "Jul", rate: 66 },
      { date: "Aug", rate: 64 },
      { date: "Sep", rate: 63 },
      { date: "Oct", rate: 62 },
      { date: "Nov", rate: 61 },
      { date: "Dec", rate: 60 },
    ],
    dataKey: "rate",
    yLabel: "bpm",
  },
  {
    key: "steps",
    label: "Steps",
    icon: Footprints,
    type: "bar",
    color: "#d97706",
    data: [
      { date: "Jan", steps: 6500 },
      { date: "Feb", steps: 7200 },
      { date: "Mar", steps: 7800 },
      { date: "Apr", steps: 8200 },
      { date: "May", steps: 8800 },
      { date: "Jun", steps: 9200 },
      { date: "Jul", steps: 9000 },
      { date: "Aug", steps: 9400 },
      { date: "Sep", steps: 9600 },
      { date: "Oct", steps: 9800 },
      { date: "Nov", steps: 9500 },
      { date: "Dec", steps: 10000 },
    ],
    dataKey: "steps",
    yLabel: "steps",
  },
  {
    key: "workoutAdherence",
    label: "Workout Adherence",
    icon: Activity,
    type: "line",
    color: "#6366f1",
    data: [
      { date: "Jan", value: 65 },
      { date: "Feb", value: 70 },
      { date: "Mar", value: 75 },
      { date: "Apr", value: 78 },
      { date: "May", value: 82 },
      { date: "Jun", value: 85 },
      { date: "Jul", value: 88 },
      { date: "Aug", value: 90 },
      { date: "Sep", value: 92 },
      { date: "Oct", value: 94 },
      { date: "Nov", value: 93 },
      { date: "Dec", value: 95 },
    ],
    dataKey: "value",
    yLabel: "%",
  },
  {
    key: "retention",
    label: "Client Retention Rate",
    icon: Target,
    type: "line",
    color: "#10b981",
    data: [
      { date: "Jan", value: 65 },
      { date: "Feb", value: 68 },
      { date: "Mar", value: 71 },
      { date: "Apr", value: 73 },
      { date: "May", value: 75 },
      { date: "Jun", value: 77 },
      { date: "Jul", value: 79 },
      { date: "Aug", value: 81 },
      { date: "Sep", value: 82 },
      { date: "Oct", value: 83 },
      { date: "Nov", value: 84 },
      { date: "Dec", value: 85 },
    ],
    dataKey: "value",
    yLabel: "%",
  },
  {
    key: "progress",
    label: "Progress Improvement",
    icon: TrendingUp,
    type: "line",
    color: "#9333ea",
    data: [
      { date: "Jan", value: 45 },
      { date: "Feb", value: 50 },
      { date: "Mar", value: 55 },
      { date: "Apr", value: 58 },
      { date: "May", value: 62 },
      { date: "Jun", value: 65 },
      { date: "Jul", value: 68 },
      { date: "Aug", value: 70 },
      { date: "Sep", value: 72 },
      { date: "Oct", value: 74 },
      { date: "Nov", value: 76 },
      { date: "Dec", value: 78 },
    ],
    dataKey: "value",
    yLabel: "%",
  },
]

function SortableMetric({
  metric,
  listeners,
  attributes,
  isDragging,
}: { metric: any; listeners: any; attributes: any; isDragging: boolean }) {
  const { setNodeRef, transform, transition } = useSortable({ id: metric.key })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-slate-100 rounded mb-2"
    >
      <metric.icon className="h-4 w-4" />
      <span>{metric.label}</span>
    </div>
  )
}

// Enhanced Client Stats Component
const ClientStats = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<any>(null)

  useEffect(() => {
    if (clientId && isActive) {
      setLoading(true);
      const fetchStats = async () => {
        try {
          // Workouts in last 30 days (existing)
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - 30);
          const sinceISOString = sinceDate.toISOString();

          const { count: workoutCount, error: workoutError } = await supabase
            .from("workout_info")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("created_at", sinceISOString);

          // Engagement Score
          // 1. Total schedule rows for this client
          const { count: totalSchedules, error: totalError } = await supabase
            .from("schedule")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId);

          // 2. Completed schedule rows for this client
          const { count: completedSchedules, error: completedError } = await supabase
            .from("schedule")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("status", "completed");

          let engagementScore = 0;
          if (totalSchedules && totalSchedules > 0) {
            engagementScore = Math.round((completedSchedules || 0) / totalSchedules * 100);
          }

          setStatsData({
            totalSessions: workoutCount || 0,
            weeklyProgress: 85, // (keep or update as needed)
            monthlyGoals: 3,    // (keep or update as needed)
            engagementScore: engagementScore
          });
        } catch (err) {
          setStatsData({
            totalSessions: 0,
            weeklyProgress: 0,
            monthlyGoals: 0,
            engagementScore: 0
          });
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [clientId, isActive]);

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl p-6">
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "Workouts Completed",
      value: statsData?.totalSessions?.toString() || "0",
      subtitle: "in Last 30 Days",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "from-emerald-500 to-green-600",
    },
    {
      label: "Goals Achieved",
      value: "3",
      icon: Target,
      color: "text-blue-600",
      bgColor: "from-blue-500 to-indigo-600",
    },
    {
      label: "Engagement Score",
      value: statsData?.engagementScore !== undefined ? `${statsData.engagementScore}%` : "0%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "from-purple-500 to-pink-600",
    },
    {
      label: "Days Active",
      value: "127",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "from-orange-500 to-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
            />

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${stat.color} transition-colors duration-300`}>{stat.value}</p>
                    {stat.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl bg-gradient-to-br ${stat.bgColor} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-0 group-hover:h-[120px] w-full overflow-hidden transition-all duration-500 ease-out">
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  {/* <ResponsiveContainer width="100%" height="100%">
                    <Chart data={stat.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stat.color
                          .replace("text-", "#")
                          .replace("emerald-600", "059669")
                          .replace("blue-600", "2563eb")
                          .replace("purple-600", "9333ea")
                          .replace("orange-600", "ea580c")}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </Chart>
                  </ResponsiveContainer> */}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const EditableSection: React.FC<EditableSectionProps> = ({ title, icon, initialContent, storageKey }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
  const [completedItems, setCompletedItems] = useState<number[]>(() => {
    const saved = localStorage.getItem(`${storageKey}-completed`)
    return saved ? JSON.parse(saved) : []
  })
  const Icon = icon

  useEffect(() => {
    // Load from localStorage on component mount
    const savedContent = localStorage.getItem(storageKey)
    if (savedContent) {
      setContent(savedContent)
    }
  }, [storageKey])

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(storageKey, content)
    setIsEditing(false)
  }

  const handleToggleComplete = (index: number) => {
    setCompletedItems((prev) => {
      const newCompleted = prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      localStorage.setItem(`${storageKey}-completed`, JSON.stringify(newCompleted))
      return newCompleted
    })
  }

  return (
    <Card className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-gray-900/90">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{title}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="h-9 px-3 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 dark:from-rose-950/50 dark:to-pink-950/50 dark:hover:from-rose-900/50 dark:hover:to-pink-900/50 border border-rose-200 dark:border-rose-800 transition-all duration-300"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2 text-rose-600" />
                <span className="text-rose-600 font-medium">Save</span>
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-2 text-rose-600" />
                <span className="text-rose-600 font-medium">Edit</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[160px] border-2 border-rose-200 focus:border-rose-400 focus:ring-rose-200/50 rounded-xl resize-none"
            placeholder={`Add ${title.toLowerCase()} here...`}
          />
        ) : (
          <div className="space-y-3">
            {content ? (
              content.split(".").map(
                (sentence, i) =>
                  sentence.trim() && (
                    <div
                      key={i}
                      className="flex items-start gap-3 group/item p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 rounded-lg border-2 border-rose-300 text-rose-500 focus:ring-rose-500 focus:ring-2 transition-all duration-200"
                        checked={completedItems.includes(i)}
                        onChange={() => handleToggleComplete(i)}
                        aria-label={`Mark ${sentence.trim()} as ${completedItems.includes(i) ? "incomplete" : "complete"}`}
                      />
                      <p
                        className={`text-sm leading-relaxed transition-all duration-300 flex-1 ${
                          completedItems.includes(i)
                            ? "line-through text-gray-400 dark:text-gray-600"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {sentence.trim()}
                      </p>
                    </div>
                  ),
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-rose-400" />
                </div>
                <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} added yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click Edit to get started</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Metrics Section
const MetricsSection = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("selectedMetrics")
    return saved ? JSON.parse(saved) : ["weight", "sleep", "heartRate", "steps"]
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [workoutInfo, setWorkoutInfo] = useState<any[]>([])
  const [loadingWorkout, setLoadingWorkout] = useState(false)
  const [workoutError, setWorkoutError] = useState<string | null>(null)
  const [workoutCount, setWorkoutCount] = useState<number>(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem("selectedMetrics", JSON.stringify(selectedKeys))
  }, [selectedKeys])

  useEffect(() => {
    console.log("[MetricsSection] Effect running, clientId:", clientId, "isActive:", isActive);
    if (!clientId || !isActive || dataLoaded) {
      console.log("[MetricsSection] Not loading - clientId:", clientId, "isActive:", isActive, "dataLoaded:", dataLoaded);
      return;
    }
    setLoadingWorkout(true)
    setWorkoutError(null)
    ;(async () => {
      try {
        console.log("[MetricsSection] Fetching workout_info for clientId:", clientId);
        const { data, error } = await supabase.from("workout_info").select("*").eq("client_id", clientId);
        console.log("[MetricsSection] Query result:", data, error);
        if (error) throw error;
        setWorkoutInfo(data || []);

        // Fetch count of workouts in last 30 days
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);
        const sinceISOString = sinceDate.toISOString();
        const { count, error: countError } = await supabase
          .from("workout_info")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .gte("created_at", sinceISOString);
        console.log("[MetricsSection] 30-day count:", count, countError);
        if (countError) throw countError;
        setWorkoutCount(count || 0);
        setDataLoaded(true);
      } catch (err: any) {
        setWorkoutError(err.message || "Failed to fetch workout info");
        setWorkoutInfo([]);
        setWorkoutCount(0);
      } finally {
        setLoadingWorkout(false);
      }
    })();
  }, [clientId, isActive, dataLoaded]);

  const selectedMetrics = selectedKeys
    .map((key: string) => METRIC_LIBRARY.find((m) => m.key === key))
    .filter(Boolean) as typeof METRIC_LIBRARY
  const availableMetrics = METRIC_LIBRARY.filter((m) => !selectedKeys.includes(m.key))

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (selectedKeys.length < 4 && value && !selectedKeys.includes(value)) {
      setSelectedKeys([...selectedKeys, value])
    }
  }

  function handleRemove(key: string) {
    setSelectedKeys(selectedKeys.filter((k: string) => k !== key))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = selectedKeys.indexOf(active.id as string)
      const newIndex = selectedKeys.indexOf(over.id as string)
      setSelectedKeys(arrayMove(selectedKeys, oldIndex, newIndex))
    }
    setDraggingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Customization Panel */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Your Metrics Dashboard</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  onDragStart={(e) => setDraggingId(String(e.active.id))}
                >
                  <SortableContext
                    items={selectedMetrics.map((m: any) => m.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedMetrics.map((metric: any) => (
                      <div
                        key={metric.key}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 shadow-lg cursor-grab hover:shadow-xl transition-all duration-300 group"
                        tabIndex={0}
                        aria-label={`Drag to reorder ${metric.label}`}
                      >
                        <span
                          className="cursor-grab text-gray-400 group-hover:text-blue-500 transition-colors"
                          title="Drag to reorder"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2z" />
                          </svg>
                        </span>
                        <metric.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.label}</span>
                        <button
                          onClick={() => handleRemove(metric.key)}
                          className="ml-2 text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50"
                          aria-label={`Remove ${metric.label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
            <div className="lg:w-64">
              <label
                htmlFor="metric-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Add New Metric
              </label>
              <select
                id="metric-select"
                className="w-full border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                onChange={handleSelectChange}
                value=""
              >
                <option value="">Choose a metric...</option>
                {availableMetrics.map((m: any) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Metrics Grid */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedMetrics.map((m: any) => m.key)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {selectedMetrics.map((metric: any) => (
              <Card
                key={metric.key}
                className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 cursor-grab hover:scale-105"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: `${metric.color}20` }}>
                      <metric.icon className="h-6 w-6" style={{ color: metric.color }} />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{metric.label}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Track your {metric.label.toLowerCase()} progress over time
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {metric.type === "line" ? (
                        <Chart data={metric.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "none",
                              borderRadius: "12px",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey={metric.dataKey}
                            stroke={metric.color}
                            strokeWidth={3}
                            dot={{ r: 5, strokeWidth: 2, fill: "white" }}
                            activeDot={{ r: 7, strokeWidth: 2 }}
                          />
                        </Chart>
                      ) : (
                        <BarChart data={metric.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "none",
                              borderRadius: "12px",
                              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            }}
                          />
                          <Bar dataKey={metric.dataKey} fill={metric.color} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Enhanced Workout Info Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-900/90 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Dumbbell className="h-5 w-5 text-orange-500" />
            <span className="text-gray-900 dark:text-white">Workouts Completed (Last 30 Days):</span>
            <span className="ml-2 text-2xl font-bold text-orange-600 dark:text-orange-400">{workoutCount}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-900/90">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Workout History</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-1">
                Complete history of all workout sessions
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWorkout ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading workout history...</p>
            </div>
          ) : workoutError ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-500 dark:text-red-400">{workoutError}</p>
            </div>
          ) : workoutInfo.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No workout history found</p>
              <p className="text-sm text-gray-400">Start tracking workouts to see data here</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Exercise</th>
                    <th className="px-4 py-3 font-semibold">Duration (min)</th>
                    <th className="px-4 py-3 font-semibold">Intensity</th>
                    <th className="px-4 py-3 font-semibold">Sets</th>
                    <th className="px-4 py-3 font-semibold">Reps</th>
                    <th className="px-4 py-3 font-semibold">Weight</th>
                    <th className="px-4 py-3 font-semibold">Feedback</th>
                    <th className="px-4 py-3 font-semibold">Rest (sec)</th>
                    <th className="px-4 py-3 font-semibold">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutInfo.map((w, idx) => (
                    <tr
                      key={w.id}
                      className={
                        idx % 2 === 0
                          ? "bg-orange-50/40 dark:bg-orange-900/10"
                          : "bg-white dark:bg-gray-900"
                      }
                    >
                      <td className="px-4 py-3">{w.created_at ? new Date(w.created_at).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-3 font-semibold">{w.exercise_name}</td>
                      <td className="px-4 py-3">{w.duration ?? ""}</td>
                      <td className="px-4 py-3">{w.intensity ?? ""}</td>
                      <td className="px-4 py-3">{w.sets ?? ""}</td>
                      <td className="px-4 py-3">{w.reps ?? ""}</td>
                      <td className="px-4 py-3">{w.weight ?? ""}</td>
                      <td className="px-4 py-3">{w.feedback ?? ""}</td>
                      <td className="px-4 py-3">{w.rest ?? ""}</td>
                      <td className="px-4 py-3">{w.distance ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
// 

// Enhanced Nutrition Plan Section
const NutritionPlanSection = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
  const [loading, setLoading] = useState(false)
  const [nutritionData, setNutritionData] = useState<any>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [selectedDay, setSelectedDay] = useState("monday")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItemDialog, setNewItemDialog] = useState<string | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiNutritionResponse, setAiNutritionResponse] = useState<any>(null)
  const [showAiResponsePopup, setShowAiResponsePopup] = useState(false)
  const { toast } = useToast()
  
  // Sample meal items data structure
  const [mealItems, setMealItems] = useState<Record<string, Record<string, any[]>>>({
    monday: {
      breakfast: [
        { meal: "Greek Yogurt with Berries", calories: 150, protein: 15, fats: 2, icon: "🥣", coach_tip: "Great source of probiotics!" }
      ],
      lunch: [
        { meal: "Grilled Chicken Salad", calories: 300, protein: 35, fats: 12, icon: "🥗", coach_tip: "Perfect post-workout meal" }
      ],
      dinner: [
        { meal: "Salmon Fillet", calories: 250, protein: 30, fats: 14, icon: "🐟", coach_tip: "Rich in omega-3 fatty acids" }
      ],
      snacks: [
        { meal: "Apple with Almond Butter", calories: 190, protein: 4, fats: 8, icon: "🍎", coach_tip: "Great pre-workout snack" }
      ]
    },
    tuesday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    wednesday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    thursday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    friday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    saturday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
    sunday: { breakfast: [], lunch: [], dinner: [], snacks: [] }
  })

  const [newItem, setNewItem] = useState({
    meal: "",
    calories: 0,
    protein: 0,
    fats: 0,
    icon: "",
    coach_tip: "",
    meal_info: ""
  })

  // Daily targets state
  const [dailyTargets, setDailyTargets] = useState([
    { name: "Calories", current: 1420, target: 2000, unit: "kcal", icon: "🔥", color: "from-red-500 to-pink-600" },
    { name: "Protein", current: 95, target: 150, unit: "g", icon: "💪", color: "from-blue-500 to-indigo-600" },
    { name: "Carbs", current: 165, target: 200, unit: "g", icon: "🌾", color: "from-green-500 to-emerald-600" },
    { name: "Fats", current: 48, target: 70, unit: "g", icon: "🥑", color: "from-yellow-500 to-orange-600" }
  ])

  // Calculate daily totals from meal items
  const calculateDailyTotals = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    return days.map((day, index) => {
      const dayMeals = mealItems[day] || { breakfast: [], lunch: [], dinner: [], snacks: [] }
      let calories = 0, protein = 0, carbs = 0, fats = 0
      
      // Sum up all meals for the day
      Object.values(dayMeals).forEach((mealType: any[]) => {
        mealType.forEach((meal) => {
          calories += meal.calories || 0
          protein += meal.protein || 0
          carbs += meal.carbs || 0
          fats += meal.fats || 0
        })
      })
      
      return {
        day: dayNames[index],
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
        completed: calories > 0
      }
    })
  }

  // Get daily totals
  const dailyTotals = calculateDailyTotals()

  // Update current daily targets based on selected day
  const updateCurrentDayTargets = () => {
    const selectedDayData = dailyTotals.find(d => d.day.toLowerCase() === selectedDay)
    if (selectedDayData) {
      setDailyTargets(prev => prev.map(target => {
        switch(target.name) {
          case "Calories":
            return { ...target, current: selectedDayData.calories }
          case "Protein":
            return { ...target, current: selectedDayData.protein }
          case "Carbs":
            return { ...target, current: selectedDayData.carbs }
          case "Fats":
            return { ...target, current: selectedDayData.fats }
          default:
            return target
        }
      }))
    }
  }

  // Update targets when selected day or meal items change
  useEffect(() => {
    updateCurrentDayTargets()
  }, [selectedDay, mealItems])

  // Meal types
  const mealTypes = [
    { key: "breakfast", label: "Breakfast", icon: "🌅", emoji: "🥞" },
    { key: "lunch", label: "Lunch", icon: "☀️", emoji: "🥗" },
    { key: "dinner", label: "Dinner", icon: "🌙", emoji: "🍽️" },
    { key: "snacks", label: "Snacks", icon: "🍎", emoji: "🥨" }
  ]

  // Get current day meals
  const getCurrentDayMeals = () => {
    return mealItems[selectedDay] || { breakfast: [], lunch: [], dinner: [], snacks: [] }
  }

  // Add meal item
  const addMealItem = (mealType: string) => {
    if (newItem.meal.trim()) {
      setMealItems(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [mealType]: [...(prev[selectedDay]?.[mealType] || []), { ...newItem }]
        }
      }))
      setNewItem({ meal: "", calories: 0, protein: 0, fats: 0, icon: "", coach_tip: "", meal_info: "" })
      setNewItemDialog(null)
    }
  }

  // Update meal item
  const updateMealItem = (mealType: string, index: number, field: string, value: any) => {
    setMealItems(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: prev[selectedDay][mealType].map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }))
  }

  // Delete meal item
  const deleteMealItem = (mealType: string, index: number) => {
    setMealItems(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: prev[selectedDay][mealType].filter((_, i) => i !== index)
      }
    }))
  }

  // AI Nutrition Plan Generation
  const handleGenerateAINutritionPlan = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client selected. Please select a client first.",
        variant: "destructive",
      })
      return
    }

    setAiGenerating(true)
    
    try {
      console.log('🚀 Starting AI nutrition plan generation for client:', clientId)
      const result = await generateAINutritionPlan(clientId)
      
      if (result.success) {
        console.log('✅ AI nutrition plan generated successfully:', result)
        setAiNutritionResponse(result)
        setShowAiResponsePopup(true)
        
        toast({
          title: "Success",
          description: "AI nutrition plan generated successfully!",
        })
      } else {
        console.error('❌ AI nutrition plan generation failed:', result.message)
        toast({
          title: "Error",
          description: result.message || "Failed to generate AI nutrition plan",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 Error generating AI nutrition plan:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the nutrition plan",
        variant: "destructive",
      })
    } finally {
      setAiGenerating(false)
    }
  }

  // Parse AI Response and Apply to Nutrition Plan
  const parseAndApplyAINutritionPlan = (aiResponseText: string) => {
    try {
      console.log('🔍 Parsing AI nutrition response:', aiResponseText)
      
      // Extract JSON from the response
      let jsonMatch = aiResponseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      const nutritionData = JSON.parse(jsonMatch[0])
      console.log('📊 Parsed nutrition data:', nutritionData)
      
      // Update daily targets
      if (nutritionData.daily_targets) {
        setDailyTargets([
          { name: "Calories", current: 0, target: nutritionData.daily_targets.calories || 2000, unit: "kcal", icon: "🔥", color: "from-red-500 to-pink-600" },
          { name: "Protein", current: 0, target: nutritionData.daily_targets.protein || 150, unit: "g", icon: "💪", color: "from-blue-500 to-indigo-600" },
          { name: "Carbs", current: 0, target: nutritionData.daily_targets.carbs || 200, unit: "g", icon: "🌾", color: "from-green-500 to-emerald-600" },
          { name: "Fats", current: 0, target: nutritionData.daily_targets.fats || 70, unit: "g", icon: "🥑", color: "from-yellow-500 to-orange-600" }
        ])
      }
      
      // Process nutrition plan and populate meal items
      if (nutritionData.nutrition_plan && Array.isArray(nutritionData.nutrition_plan)) {
        const newMealItems: Record<string, Record<string, any[]>> = {
          monday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          tuesday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          wednesday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          thursday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          friday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          saturday: { breakfast: [], lunch: [], dinner: [], snacks: [] },
          sunday: { breakfast: [], lunch: [], dinner: [], snacks: [] }
        }
        
        // Distribute meals across the week (repeat pattern for 7 days)
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        // If we have fewer meals than 7 days, repeat the pattern
        days.forEach((day, dayIndex) => {
          nutritionData.nutrition_plan.forEach((meal: any) => {
            const mealItem = {
              meal: meal.food_name,
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fats: meal.fats || 0,
              fiber: meal.fiber || 0,
              icon: meal.icon || "🍽️",
              coach_tip: meal.coach_tip || "",
              meal_info: `${meal.portion_size || "1 serving"} - ${meal.category || meal.meal_type}`,
              dietary_tags: meal.dietary_tags || []
            }
            
            const mealType = meal.meal_type === 'snack' ? 'snacks' : meal.meal_type
            if (newMealItems[day] && newMealItems[day][mealType]) {
              newMealItems[day][mealType].push(mealItem)
            }
          })
        })
        
        setMealItems(newMealItems)
        console.log('✅ Meal items updated:', newMealItems)
      }
      
      return true
    } catch (error) {
      console.error('❌ Error parsing AI nutrition response:', error)
      toast({
        title: "Error",
        description: "Failed to parse AI nutrition plan. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  // Data loading effect
  useEffect(() => {
    if (clientId && isActive && !dataLoaded) {
      setLoading(true)
      setTimeout(() => {
        setNutritionData({ loaded: true })
        setDataLoaded(true)
        setLoading(false)
      }, 900)
    }
  }, [clientId, isActive, dataLoaded])

  const MacroChart = ({ protein, carbs, fats }: { protein: number; carbs: number; fats: number }) => {
    const total = protein + carbs + fats
    if (total === 0) return null

    const proteinPercent = (protein / total) * 100
    const carbsPercent = (carbs / total) * 100
    const fatsPercent = (fats / total) * 100

    return (
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="bg-green-400" style={{ width: `${proteinPercent}%` }} title={`Protein: ${protein}g`} />
        <div className="bg-blue-400" style={{ width: `${carbsPercent}%` }} title={`Carbs: ${carbs}g`} />
        <div className="bg-yellow-400" style={{ width: `${fatsPercent}%` }} title={`Fats: ${fats}g`} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
              <CardContent className="p-6 text-center">
                <LoadingSpinner size="small" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner />
              <p className="text-gray-600 dark:text-gray-400">Loading nutrition plan...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentDayMeals = getCurrentDayMeals()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Nutrition Plan</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Viewing {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s plan
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateAINutritionPlan}
            disabled={aiGenerating}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg disabled:opacity-50"
          >
            {aiGenerating ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Plan
              </>
            )}
          </Button>
          <Button 
            onClick={() => {
              const sampleResponse = `{
                "overview": "This nutrition plan is designed for Vikas Malik, 52, who is active and primarily aims to improve his health by losing 10 kgs of weight. As a vegetarian and vegan, his diet will include high protein, moderate carbohydrates, and low fats. Given his inconsistent eating habits, acid reflux, and high-stress levels, this plan will emphasize regular meals, increased fiber, and hydration for better health and stress management. His workouts will be fueled with appropriate meals and protein supplementations.",
                "daily_targets": {
                  "calories": 1800,
                  "protein": 125,
                  "carbs": 200,
                  "fats": 60,
                  "fiber": 35,
                  "water_liters": 3
                },
                "meal_timing": {
                  "breakfast": "13:00",
                  "lunch": "17:00",
                  "dinner": "00:00",
                  "snacks": ["15:30", "21:30"]
                },
                "nutrition_plan": [
                  {
                    "food_name": "Quinoa Porridge with Berries and Nuts",
                    "meal_type": "breakfast",
                    "portion_size": "1 bowl",
                    "calories": 400,
                    "protein": 12,
                    "carbs": 60,
                    "fats": 12,
                    "fiber": 8,
                    "for_date": "Day 1",
                    "for_time": "13:00",
                    "coach_tip": "Quinoa is a complete protein, providing all essential amino acids. It's also a great source of fiber which can help manage your acid reflux.",
                    "icon": "🥣",
                    "category": "Breakfast",
                    "dietary_tags": ["vegan", "vegetarian", "mediterranean"]
                  },
                  {
                    "food_name": "Mixed Salad with Chickpeas, Avocado, and Olive Oil Dressing",
                    "meal_type": "lunch",
                    "portion_size": "1 large plate",
                    "calories": 500,
                    "protein": 18,
                    "carbs": 40,
                    "fats": 28,
                    "fiber": 12,
                    "for_date": "Day 1",
                    "for_time": "17:00",
                    "coach_tip": "Chickpeas provide plant-based protein, while avocado adds healthy fats. Olive oil dressing can help with the absorption of fat-soluble vitamins.",
                    "icon": "🥗",
                    "category": "Lunch",
                    "dietary_tags": ["vegan", "vegetarian", "mediterranean"]
                  },
                  {
                    "food_name": "Lentil Soup with Whole Grain Bread",
                    "meal_type": "dinner",
                    "portion_size": "1 bowl of soup, 2 slices of bread",
                    "calories": 600,
                    "protein": 32,
                    "carbs": 70,
                    "fats": 15,
                    "fiber": 15,
                    "for_date": "Day 1",
                    "for_time": "00:00",
                    "coach_tip": "Lentils are high in protein and fiber. Whole grain bread adds complex carbs for a balanced meal. This meal is timed after your workout for optimal recovery.",
                    "icon": "🍲",
                    "category": "Dinner",
                    "dietary_tags": ["vegan", "vegetarian", "mediterranean"]
                  },
                  {
                    "food_name": "Apple with Almond Butter",
                    "meal_type": "snack",
                    "portion_size": "1 medium apple + 2 tbsp almond butter",
                    "calories": 300,
                    "protein": 8,
                    "carbs": 30,
                    "fats": 18,
                    "fiber": 6,
                    "for_date": "Day 1",
                    "for_time": "15:30",
                    "coach_tip": "Perfect pre-workout snack providing quick energy and healthy fats.",
                    "icon": "🍎",
                    "category": "Snack",
                    "dietary_tags": ["vegan", "vegetarian"]
                  }
                ],
                "hydration_plan": "Aim to drink 3 liters of water per day. Start your day with a 500ml glass of water upon waking. Drink 250ml of water 30 minutes before each meal and snack to aid digestion and manage acid reflux. Refill your water bottle during your workout to stay hydrated.",
                "supplement_recommendations": "Continue with your prenatal vitamins and protein powder. For your workouts, aim for a protein intake of 20-30g post-workout to support muscle recovery and growth. This could be a scoop of your protein powder mixed with water or a plant-based milk.",
                "meal_prep_tips": "Prepare your meals in advance to maintain consistency. Cook quinoa, chickpeas, and lentils in bulk and store them in the refrigerator. Wash and chop vegetables for your salads and store them in airtight containers. Prepare your dressing in advance and add it just before eating.",
                "progress_tracking": "Track your weight weekly and adjust your caloric intake if necessary. Monitor your energy levels, sleep quality, and stress management as these factors can affect your weight loss. Adjust your protein powder dosage based on your workout intensity and recovery."
              }`
              const success = parseAndApplyAINutritionPlan(sampleResponse)
              if (success) {
                toast({
                  title: "Sample Applied",
                  description: "Sample nutrition plan has been applied successfully!",
                })
              }
            }}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Zap className="w-4 h-4 mr-2" />
            Test Sample
          </Button>
        </div>
      </div>

      {/* Enhanced Daily Targets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {dailyTargets.map((target, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${target.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
            />
            <CardContent className="relative p-6 text-center">
              <div className="text-4xl mb-3">{target.icon}</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {target.current}
                <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{target.unit}</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{target.name}</p>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Target: {target.target}
                {target.unit}
              </div>
              <Progress value={(target.current / target.target) * 100} className="h-2 bg-gray-200 dark:bg-gray-700" />
              <div className="text-xs text-green-500 font-medium mt-1">
                {Math.round((target.current / target.target) * 100)}% Complete
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Daily Totals - Same size as meal cards */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-green-500 mb-4">Weekly Overview</h2>
          {dailyTotals.map((day, index) => (
            <Card
              key={day.day}
              className={`bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl cursor-pointer transition-all duration-500 dark:bg-gray-900/90 h-[400px] flex flex-col ${
                selectedDay === day.day.toLowerCase()
                  ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setSelectedDay(day.day.toLowerCase())}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{day.day}</span>
                  <div className={`w-3 h-3 rounded-full ${day.completed ? "bg-green-500" : "bg-gray-400"}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center p-6">
                {day.completed ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500 mb-1">{day.calories}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">calories</div>
                    </div>
                    <MacroChart protein={day.protein} carbs={day.carbs} fats={day.fats} />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Protein:</span>
                        <span className="text-green-500 font-bold">{day.protein}g</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Carbs:</span>
                        <span className="text-blue-500 font-bold">{day.carbs}g</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Fats:</span>
                        <span className="text-yellow-500 font-bold">{day.fats}g</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 flex-1 flex flex-col justify-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      📅
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No meals planned</p>
                    <p className="text-xs text-gray-400">Click to start planning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column - Meal Columns */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mealTypes.map((mealType) => (
            <Card
              key={mealType.key}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 h-[400px] flex flex-col"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-500/20 text-green-500">
                      {mealType.icon}
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{mealType.label}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {currentDayMeals[mealType.key]?.length || 0} items
                      </p>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {currentDayMeals[mealType.key]?.length > 0 ? (
                    currentDayMeals[mealType.key].map((item, index) => (
                      <div
                        key={index}
                        className="group/item p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2">
                          {editingItem === `${mealType.key}-${index}` ? (
                            <Input
                              value={item.meal}
                              onChange={(e) => updateMealItem(mealType.key, index, "meal", e.target.value)}
                              className="text-sm font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white h-6 p-1"
                              onBlur={() => setEditingItem(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                              autoFocus
                            />
                          ) : (
                            <div
                              className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1 flex items-center gap-2"
                              onClick={() => setEditingItem(`${mealType.key}-${index}`)}
                            >
                              <span>{item.icon}</span>
                              <span>{item.meal}</span>
                            </div>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-green-500"
                              onClick={() => setEditingItem(`${mealType.key}-${index}`)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                              onClick={() => deleteMealItem(mealType.key, index)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="text-center">
                            <div className="font-bold text-red-600 dark:text-red-400">{item.calories}</div>
                            <div className="text-gray-500 dark:text-gray-400">cal</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-600 dark:text-blue-400">{item.protein}g</div>
                            <div className="text-gray-500 dark:text-gray-400">protein</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-yellow-600 dark:text-yellow-400">{item.fats}g</div>
                            <div className="text-gray-500 dark:text-gray-400">fats</div>
                          </div>
                        </div>
                        {item.coach_tip && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 italic">
                            💡 {item.coach_tip}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 flex-1 flex flex-col justify-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        {mealType.emoji}
                      </div>
                      <p className="text-sm mb-2 text-gray-500 dark:text-gray-400">
                        No {mealType.label.toLowerCase()} items yet
                      </p>
                      <p className="text-xs text-gray-400">Add your first meal to get started</p>
                    </div>
                  )}
                </div>

                <Dialog open={newItemDialog === mealType.key} onOpenChange={(open) => !open && setNewItemDialog(null)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-500 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 dark:from-gray-800 dark:to-blue-950/50 dark:hover:from-gray-700 dark:hover:to-blue-900/50"
                    onClick={() => setNewItemDialog(mealType.key)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                  <DialogContent className="max-w-md bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
                    <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                          {mealType.icon}
                        </div>
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                          Add {mealType.label} Item
                        </span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="meal-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meal Name
                        </Label>
                        <Input
                          id="meal-name"
                          value={newItem.meal}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, meal: e.target.value }))}
                          className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="e.g., Grilled Chicken Breast"
                        />
                      </div>
                      <div>
                        <Label htmlFor="icon" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Icon (emoji)
                        </Label>
                        <Input
                          id="icon"
                          value={newItem.icon || ""}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, icon: e.target.value }))}
                          className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="🍗"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="calories" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Calories
                          </Label>
                          <Input
                            id="calories"
                            type="number"
                            value={newItem.calories || ""}
                            onChange={(e) =>
                              setNewItem((prev) => ({ ...prev, calories: Number.parseInt(e.target.value) || 0 }))
                            }
                            className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="protein" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Protein (g)
                          </Label>
                          <Input
                            id="protein"
                            type="number"
                            value={newItem.protein || ""}
                            onChange={(e) =>
                              setNewItem((prev) => ({ ...prev, protein: Number.parseInt(e.target.value) || 0 }))
                            }
                            className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="fats" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fats (g)
                          </Label>
                          <Input
                            id="fats"
                            type="number"
                            value={newItem.fats || ""}
                            onChange={(e) =>
                              setNewItem((prev) => ({ ...prev, fats: Number.parseInt(e.target.value) || 0 }))
                            }
                            className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="coach-tip" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Coach Tip (optional)
                        </Label>
                        <Textarea
                          id="coach-tip"
                          value={newItem.coach_tip || ""}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, coach_tip: e.target.value }))}
                          className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Nutritional advice or tips..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meal-info" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meal Info (optional)
                        </Label>
                        <Input
                          id="meal-info"
                          value={newItem.meal_info || ""}
                          onChange={(e) => setNewItem((prev) => ({ ...prev, meal_info: e.target.value }))}
                          className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Additional meal information"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="outline"
                          onClick={() => setNewItemDialog(null)}
                          className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => addMealItem(mealType.key)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Meal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Nutrition Response Popup */}
      <Dialog open={showAiResponsePopup} onOpenChange={setShowAiResponsePopup}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-green-500" />
              AI Generated Nutrition Plan
            </DialogTitle>
          </DialogHeader>
          
          {aiNutritionResponse && (
            <div className="space-y-6">
              {/* Raw AI Response */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Response:</h3>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {aiNutritionResponse.aiResponse?.response || 'No response available'}
                </pre>
              </div>

              {/* Client Info Used */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Client Information Used:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {aiNutritionResponse.clientInfo?.name || 'N/A'}</p>
                    <p><strong>Age:</strong> {aiNutritionResponse.clientInfo?.age || 'N/A'}</p>
                    <p><strong>Weight:</strong> {aiNutritionResponse.clientInfo?.weight || 'N/A'} kg</p>
                    <p><strong>Height:</strong> {aiNutritionResponse.clientInfo?.height || 'N/A'} cm</p>
                  </div>
                  <div>
                    <p><strong>Goal:</strong> {aiNutritionResponse.clientInfo?.primaryGoal || 'N/A'}</p>
                    <p><strong>Activity Level:</strong> {aiNutritionResponse.clientInfo?.activityLevel || 'N/A'}</p>
                    <p><strong>Diet Preferences:</strong> {aiNutritionResponse.clientInfo?.dietPreferences || 'N/A'}</p>
                    <p><strong>Allergies:</strong> {aiNutritionResponse.clientInfo?.foodAllergies || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Usage Metrics */}
              {aiNutritionResponse.aiResponse?.usage && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">API Usage:</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p><strong>Input Tokens:</strong> {aiNutritionResponse.aiResponse.usage.prompt_tokens}</p>
                    <p><strong>Output Tokens:</strong> {aiNutritionResponse.aiResponse.usage.completion_tokens}</p>
                    <p><strong>Total Tokens:</strong> {aiNutritionResponse.aiResponse.usage.total_tokens}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAiResponsePopup(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    if (aiNutritionResponse?.aiResponse?.response) {
                      const success = parseAndApplyAINutritionPlan(aiNutritionResponse.aiResponse.response)
                      if (success) {
                        setShowAiResponsePopup(false)
                        toast({
                          title: "Success",
                          description: "Nutrition plan applied successfully! Your meal plan has been updated.",
                        })
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: "No AI response available to apply.",
                        variant: "destructive",
                      })
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Apply Nutrition Plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enhanced Program Management Section
const ProgramManagementSection = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [filteredPrograms, setFilteredPrograms] = useState(mockPrograms)
  const [selectedTag, setSelectedTag] = useState("All")
  const [sortBy, setSortBy] = useState("Recently updated")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter and sort programs
  useEffect(() => {
    let filtered = mockPrograms

    // Filter by tag
    if (selectedTag !== "All") {
      filtered = filtered.filter((program) => program.tag === selectedTag)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (program) =>
          program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort programs
    switch (sortBy) {
      case "Alphabetically":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        break
      case "Difficulty":
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
        filtered = [...filtered].sort(
          (a, b) =>
            (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 4) -
            (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 4),
        )
        break
      default: // Recently updated
        filtered = [...filtered].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    }

    setFilteredPrograms(filtered)
  }, [mockPrograms, selectedTag, sortBy, searchQuery])

  const handleDeleteProgram = (id: number) => {
    setPrograms(programs.filter((p) => p.id !== id))
  }

  const handleDuplicateProgram = (program: any) => {
    const newProgram = {
      ...program,
      id: Math.max(...programs.map((p) => p.id)) + 1,
      title: `${program.title} (Copy)`,
      created: new Date().toISOString().split("T")[0],
      lastEdited: "Just now",
    }
    setPrograms([...programs, newProgram])
  }

  // Data loading effect - placed after all hooks
  useEffect(() => {
    if (clientId && isActive && !dataLoaded) {
      setLoading(true)
      // Simulate API call - replace with actual programs fetching
      setTimeout(() => {
        setPrograms([
          // Mock data - replace with actual programs
          { id: 1, name: "Weight Loss Program", status: "active" },
          { id: 2, name: "Strength Building", status: "completed" }
        ])
        setDataLoaded(true)
        setLoading(false)
      }, 1100)
    }
  }, [clientId, isActive, dataLoaded])

  // Early return for loading state
  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-gray-600 dark:text-gray-400">Loading programs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Program Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPrograms.length} of {mockPrograms.length} programs
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 border-2 border-gray-200 focus:border-indigo-400 rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-32 border-2 border-gray-200 focus:border-indigo-400 rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {programTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 border-2 border-gray-200 focus:border-indigo-400 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none border-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Programs Display */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No programs found</p>
          <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
            >
              {/* Color accent */}
              <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: program.color }} />

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                        style={{
                          backgroundColor: `${program.color}20`,
                          color: program.color,
                          border: `1px solid ${program.color}40`,
                        }}
                      >
                        {program.tag}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                          color: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                        }}
                      >
                        {program.difficulty}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {program.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{program.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Starts {program.startDay}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>Last edited {program.lastEdited}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicateProgram(program)}
                    className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteProgram(program.id)}
                    className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Enhanced List View */
        <div className="space-y-4">
          {filteredPrograms.map((program) => (
            <Card
              key={program.id}
              className="group bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900/90"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="w-4 h-16 rounded-full flex-shrink-0" style={{ backgroundColor: program.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{program.title}</h4>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium flex-shrink-0"
                        style={{
                          backgroundColor: `${program.color}20`,
                          color: program.color,
                          border: `1px solid ${program.color}40`,
                        }}
                      >
                        {program.tag}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                        style={{
                          borderColor: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                          color: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                        }}
                      >
                        {program.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{program.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Starts {program.startDay}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Last edited {program.lastEdited}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateProgram(program)}
                      className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteProgram(program.id)}
                      className="border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Loading Spinner Component
const LoadingSpinner = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8", 
    large: "h-12 w-12"
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-blue-500 border-t-transparent`} />
    </div>
  )
}

// Enhanced All Clients Sidebar Component
function AllClientsSidebar({
  currentClientId,
  onClientSelect,
  trainerClients,
  clientsLoading,
}: {
  currentClientId?: number
  onClientSelect: (clientId: number) => void
  trainerClients: any[]
  clientsLoading: boolean
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClients = trainerClients.filter((client) =>
    client.cl_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="small" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading clients...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition-all duration-200"
        />
      </div>

      {/* Client Count Badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
        </span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Clients List */}
      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? "No clients found" : "No clients assigned"}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.client_id}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                currentClientId === client.client_id
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-500 shadow-sm"
                  : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 dark:hover:from-gray-800/50 dark:hover:to-blue-900/10"
              }`}
              onClick={() => onClientSelect(client.client_id)}
            >
              <div className="flex items-center gap-3">
                {/* Enhanced Avatar */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    currentClientId === client.client_id
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-800 dark:group-hover:to-indigo-800 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    {client.cl_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </div>
                  {/* Active Status Indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    client.last_active && new Date(client.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}></div>
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate transition-colors ${
                      currentClientId === client.client_id
                        ? "text-blue-900 dark:text-blue-300"
                        : "text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    }`}>
                      {client.cl_name}
                    </p>
                    {currentClientId === client.client_id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {client.last_active
                      ? `Active ${new Date(client.last_active).toLocaleDateString()}`
                      : "No recent activity"}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className={`transition-all duration-200 ${
                  currentClientId === client.client_id
                    ? "opacity-100 text-blue-500"
                    : "opacity-0 group-hover:opacity-100 text-gray-400"
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {filteredClients.length > 0 && (
        <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add New Client
          </Button>
        </div>
      )}
    </div>
  )
}

// Filter Criteria Component
function FilterCriteria() {
  const criteria = [
    { label: "Fitness Goals", color: "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" },
    { label: "Outcome", color: "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" },
    { label: "Timeline", color: "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" },
    { label: "Motivational Factor", color: "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" },
  ]

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Filter Criteria</h3>
      <div className="grid grid-cols-2 gap-2">
        {criteria.map((item, index) => (
          <div key={index} className={`${item.color} p-2 rounded text-xs font-medium text-center`}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// Fitness Goals Section Component
function FitnessGoalsSection({ client }: { client: any }) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-green-600" />
          Fitness Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Primary Goal</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            {client?.cl_primary_goal || "Weight loss and muscle building"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Outcome</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            {client?.specific_outcome || "Lose 15 lbs and gain lean muscle"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Timeline</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            {client?.goal_timeline || "6 months"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Motivation</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            {client?.motivational_factors || "Health improvement, energy"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Fitness Plan Section Component
function FitnessPlanSection({ client }: { client: any }) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-blue-600" />
          Fitness Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Schedule</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            Mon, Wed, Fri - 6:00 AM
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Duration</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            60 minutes per session
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Location</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            Home gym / Fitness center
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Equipment</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            Dumbbells, bands, yoga mat
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Limitations</Label>
          <p className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded-md">
            {client?.injuries_limitations || "Lower back - avoid deadlifts"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Trainer Notes Section Component
function TrainerNotesSection({ 
  client, 
  trainerNotes, 
  setTrainerNotes, 
  handleSaveTrainerNotes, 
  isSavingNotes, 
  isEditingNotes, 
  setIsEditingNotes,
  notesDraft,
  setNotesDraft,
  notesError,
  setNotesError 
}: {
  client: any
  trainerNotes: string
  setTrainerNotes: (notes: string) => void
  handleSaveTrainerNotes: () => void
  isSavingNotes: boolean
  isEditingNotes: boolean
  setIsEditingNotes: (editing: boolean) => void
  notesDraft: string
  setNotesDraft: (draft: string) => void
  notesError: string | null
  setNotesError: (error: string | null) => void
}) {
  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Edit className="h-4 w-4 text-yellow-600" />
          Trainer Notes
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isEditingNotes ? handleSaveTrainerNotes() : setIsEditingNotes(true))}
          disabled={isSavingNotes}
        >
          {isEditingNotes ? (
            isSavingNotes ? (
              <>
                <LoadingSpinner size="small" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Save
              </>
            )
          ) : (
            <>
              <Edit className="h-3 w-3" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditingNotes ? (
          <div className="space-y-2">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Add your notes about the client..."
              className="min-h-[120px] text-sm bg-white dark:bg-gray-800"
              disabled={isSavingNotes}
            />
            {notesError && <div className="text-red-500 text-xs">{notesError}</div>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingNotes(false)
                  setNotesError(null)
                  setNotesDraft(trainerNotes)
                }}
                disabled={isSavingNotes}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[120px] p-2 text-sm bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded border border-yellow-200/50 dark:border-yellow-800/50 whitespace-pre-line">
            {trainerNotes || "No notes added yet. Click edit to add notes."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Todo Section Component
function TodoSection({ 
  todoItems, 
  setTodoItems, 
  isEditingTodo, 
  setIsEditingTodo,
  handleSaveTodo 
}: {
  todoItems: string
  setTodoItems: (items: string) => void
  isEditingTodo: boolean
  setIsEditingTodo: (editing: boolean) => void
  handleSaveTodo: () => void
}) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle className="h-4 w-4 text-purple-600" />
          To-Do List
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isEditingTodo ? handleSaveTodo() : setIsEditingTodo(true))}
        >
          {isEditingTodo ? <Save className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditingTodo ? (
          <Textarea
            value={todoItems}
            onChange={(e) => setTodoItems(e.target.value)}
            placeholder="Add to-do items..."
            className="min-h-[120px] text-sm bg-white dark:bg-gray-800"
          />
        ) : (
          <div className="min-h-[120px] p-2 text-sm bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded border border-purple-200/50 dark:border-purple-800/50 whitespace-pre-line">
            {todoItems || "No to-do items added yet. Click edit to add items."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Notes and Todo Cards Component
function TrainerNotesToDoSection({ 
  client, 
  trainerNotes, 
  setTrainerNotes, 
  handleSaveTrainerNotes, 
  isSavingNotes, 
  isEditingNotes, 
  setIsEditingNotes,
  notesDraft,
  setNotesDraft,
  notesError,
  setNotesError 
}: {
  client: any
  trainerNotes: string
  setTrainerNotes: (notes: string) => void
  handleSaveTrainerNotes: () => void
  isSavingNotes: boolean
  isEditingNotes: boolean
  setIsEditingNotes: (editing: boolean) => void
  notesDraft: string
  setNotesDraft: (draft: string) => void
  notesError: string | null
  setNotesError: (error: string | null) => void
}) {
  const [todoItems, setTodoItems] = useState(
    "1. Schedule nutrition consultation\n2. Update workout plan for next month\n3. Review progress photos\n4. Plan recovery week",
  )
  const [isEditingTodo, setIsEditingTodo] = useState(false)
  const { toast } = useToast()

  const handleSaveTodo = () => {
    setIsEditingTodo(false)
    toast({
      title: "To-Do saved",
      description: "To-Do items have been updated successfully.",
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Enhanced Trainer Notes Card */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-yellow-600" />
            Trainer Notes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditingNotes ? handleSaveTrainerNotes() : setIsEditingNotes(true))}
            disabled={isSavingNotes}
          >
            {isEditingNotes ? (
              isSavingNotes ? (
                <>
                  <LoadingSpinner size="small" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add your notes about the client..."
                className="min-h-[120px] bg-white dark:bg-gray-800"
                disabled={isSavingNotes}
              />
              {notesError && <div className="text-red-500 text-sm">{notesError}</div>}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingNotes(false)
                    setNotesError(null)
                    setNotesDraft(trainerNotes)
                  }}
                  disabled={isSavingNotes}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[120px] p-3 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded border border-yellow-200/50 dark:border-yellow-800/50 whitespace-pre-line">
              {trainerNotes || "No notes added yet. Click edit to add notes."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced To-Do Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            To-Do
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditingTodo ? handleSaveTodo() : setIsEditingTodo(true))}
          >
            {isEditingTodo ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditingTodo ? (
            <Textarea
              value={todoItems}
              onChange={(e) => setTodoItems(e.target.value)}
              placeholder="Add to-do items..."
              className="min-h-[120px] bg-white dark:bg-gray-800"
            />
          ) : (
            <div className="min-h-[120px] p-3 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded border border-blue-200/50 dark:border-blue-800/50 whitespace-pre-line">
              {todoItems || "No to-do items added yet. Click edit to add items."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Page Loading Component
const PageLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="large" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Client Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the client data...</p>
        </div>
      </div>
    </div>
  )
}

// Enhanced Main Component
export default function ClientDashboard() {
  const params = useParams();
  const clientId = params.id && !isNaN(Number(params.id)) ? Number(params.id) : undefined;
  console.log("params:", params, "clientId:", clientId);
  const [activeTab, setActiveTab] = useState("metrics")
  const [showProfileCard, setShowProfileCard] = useState(false)
  const [client, setClient] = useState<any>(null)
  const [clientImageUrl, setClientImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [notes, setNotes] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editableNotes, setEditableNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null)
  const [showNotesSummaryPopup, setShowNotesSummaryPopup] = useState(false)
  const [notesSummaryResponse, setNotesSummaryResponse] = useState<any>(null)
  const [isSummarizingNotes, setIsSummarizingNotes] = useState(false)
  const [trainerNotes, setTrainerNotes] = useState("")
  const [notesDraft, setNotesDraft] = useState("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [allClientGoals, setAllClientGoals] = useState<string[]>([])
  const [todoItems, setTodoItems] = useState(
    "1. Schedule nutrition consultation\n2. Update workout plan for next month\n3. Review progress photos\n4. Plan recovery week"
  )
  const [isEditingTodo, setIsEditingTodo] = useState(false)
  const navigate = useNavigate()

  // Handler for client selection from sidebar
  const handleClientSelect = (selectedClientId: number) => {
    navigate(`/client/${selectedClientId}`)
  }

  // Placeholder handler functions
  const handleSaveNotes = () => {
    if (editableNotes.trim() !== notes) {
      setIsSaving(true)
      // Simulate API call
      setTimeout(() => {
        setNotes(editableNotes)
        setIsEditing(false)
        setIsSaving(false)
      }, 1000)
    } else {
      setIsEditing(false)
    }
  }

  const ProgramsSection = () => {
    return <div>Programs section to be implemented</div>
  }

  useEffect(() => {
    setNotesDraft(trainerNotes);
  }, [trainerNotes]);

  const handleSaveTrainerNotes = async () => {
    setIsSavingNotes(true);
    setNotesError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.email) {
        setNotesError("Not logged in");
        setIsSavingNotes(false);
        return;
      }
      const trainerEmail = sessionData.session.user.email;
      const { error } = await supabase
        .from("trainer")
        .update({ trainer_notes: notesDraft })
        .eq("trainer_email", trainerEmail);
      if (error) {
        setNotesError(error.message);
      } else {
        setTrainerNotes(notesDraft);
        setIsEditingNotes(false);
      }
    } catch (err: any) {
      setNotesError(err.message || "Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  }

  const handleSaveTodo = () => {
    setIsEditingTodo(false)
    // In a real app, this would save to the database
    console.log("Todo saved:", todoItems)
  }

  const handleSummarizeNotes = async () => {
    if (!notes || notes.trim().length === 0) {
      console.log("No notes to summarize");
      return;
    }

    try {
      setIsSummarizingNotes(true);
      console.log('🔄 Starting notes summarization...');
      
      // Call the AI notes summary service (notes is guaranteed to be non-null here)
      const result = await summarizeTrainerNotes(notes as string, client?.id);
      
      console.log('📊 Summary Result:', result);
      
      if (result.success) {
        setNotesSummaryResponse(result);
        setShowNotesSummaryPopup(true);
        console.log('✅ Notes summary generated successfully');
      } else {
        console.error('❌ Failed to generate notes summary:', result.message);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('💥 Error summarizing notes:', error);
      // You could show an error toast notification here
    } finally {
      setIsSummarizingNotes(false);
    }
  };



  // State for all clients of the trainer
  const [trainerClients, setTrainerClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Fetch trainer id and clients for dropdown
  useEffect(() => {
    (async () => {
      setClientsLoading(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.email) {
        setClientsLoading(false);
        return;
      }
      const trainerEmail = sessionData.session.user.email;
      // Fetch trainer id
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", trainerEmail)
        .single();
      if (trainerError || !trainerData?.id) {
        setClientsLoading(false);
        return;
      }
      // Fetch all client_ids for this trainer from the linking table
      const { data: linkRows, error: linkError } = await supabase
        .from("trainer_client_web")
        .select("client_id")
        .eq("trainer_id", trainerData.id);
      if (linkError || !linkRows || linkRows.length === 0) {
        setTrainerClients([]);
        setClientsLoading(false);
        return;
      }
      const clientIds = linkRows.map((row: any) => row.client_id).filter(Boolean);
      if (clientIds.length === 0) {
        setTrainerClients([]);
        setClientsLoading(false);
        return;
      }
      // Fetch complete client data for these client_ids
      const { data: clientsData, error: clientsError } = await supabase
        .from("client")
        .select("client_id, cl_name, cl_email, last_active, created_at")
        .in("client_id", clientIds);
      if (!clientsError && clientsData) {
        setTrainerClients(clientsData);
      } else {
        setTrainerClients([]);
      }
      setClientsLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("client")
        .select("cl_primary_goal")
        .not("cl_primary_goal", "is", null);
      if (!error && data) {
        setAllClientGoals(data.map((c: any) => c.cl_primary_goal));
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // 1. Get the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.email) {
        setTrainerNotes("");
        return;
      }
      const trainerEmail = sessionData.session.user.email;
      console.log(trainerEmail,"himanshu");
      // 2. Fetch the trainer by email
      const { data, error } = await supabase
        .from("trainer")
        .select("trainer_notes")
        .eq("trainer_email", trainerEmail)
        .single();
      if (!error && data && data.trainer_notes) {
        setTrainerNotes(data.trainer_notes);
      } else {
        setTrainerNotes("");
      }
    })();
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setError("No client ID provided");
      return;
    }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        // Fetch client data
        const { data, error } = await supabase
          .from("client")
          .select("*")
          .eq("client_id", clientId)
          .single();

        if (error) {
          console.error("Error fetching client:", error);
          setError("Failed to fetch client data");
          setClient(null);
        } else if (data) {
          console.log("Fetched client:", data);
          setClient(data);
          setError(null);

          // Fetch client image URL
          const filePath = `${data.client_id}.jpg`;
          const { data: imageData, error: imageError } = await supabase.storage
            .from('client-images')
            .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

          if (imageData && imageData.signedUrl) {
            setClientImageUrl(imageData.signedUrl);
          } else {
            console.warn(`No image found or error fetching signed URL for client ${data.client_id}:`, imageError);
            setClientImageUrl(null);
          }

        } else {
          setError("Client not found");
          setClient(null);
          setClientImageUrl(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
        setClient(null);
        setClientImageUrl(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error Loading Client</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-gray-400 text-6xl">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Client Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The requested client could not be found.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "metrics", label: "Metrics", icon: TrendingUp },
    { id: "workout", label: "Workout Plans", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: Utensils },
    { id: "programs", label: "Programs", icon: Trophy },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex">
      {/* AllClientsSidebar - Left Sidebar */}
      <div className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/70 dark:border-gray-700/70 shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-xl">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{trainerClients?.length || 0}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Total Clients</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-3 rounded-xl">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {trainerClients?.filter(c => c.last_active && new Date(c.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">Active</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* All Clients List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              All Clients
            </h3>
            <AllClientsSidebar 
              currentClientId={clientId} 
              onClientSelect={handleClientSelect}
              trainerClients={trainerClients}
              clientsLoading={clientsLoading}
            />
          </div>


        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer group" onClick={() => setShowProfileCard(!showProfileCard)}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    {clientImageUrl ? (
                      <img
                        src={clientImageUrl}
                        alt={client.cl_name}
                        className="w-full h-full rounded-2xl object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg">
                        {client.cl_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {client.cl_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                      {client.membershipType || "Premium"}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Member since {new Date(client.created_at).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:hover:border-purple-700 dark:hover:bg-purple-950/50 transition-all duration-300"
              >
                <Share className="h-4 w-4 mr-2" />
                Share Progress
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50 transition-all duration-300"
                  >
                    {clientsLoading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      "All Clients"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {trainerClients.length === 0 ? (
                    <DropdownMenuItem disabled>No clients found</DropdownMenuItem>
                  ) : (
                    trainerClients.map((c: any) => (
                      <DropdownMenuItem key={c.client_id} onClick={() => navigate(`/client/${c.client_id}`)}>
                        {c.cl_name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Enhanced Profile Card */}
          {showProfileCard && (
            <Card className="absolute top-20 left-6 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl">
                    {clientImageUrl ? (
                      <img
                        src={clientImageUrl}
                        alt={client.cl_name}
                        className="w-full h-full rounded-2xl object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg">
                        {client.cl_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.cl_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.cl_email}</p>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 text-xs mt-1">
                      {client.membershipType || "Premium"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.cl_weight}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Weight (kg)</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{client.cl_height}</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Height (cm)</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {client.cl_dob ? new Date().getFullYear() - new Date(client.cl_dob).getFullYear() : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Current Goals</h4>
                  <div className="space-y-2">
                    {client.cl_primary_goal ? (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_primary_goal}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No goals set yet.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Permanent Card Sections */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-4 mb-8">
          {/* Fitness Goals Section */}
          <FitnessGoalsSection client={client} />

          {/* Fitness Plan Section */}
          <FitnessPlanSection client={client} />

          {/* Trainer Notes Section */}
          <TrainerNotesSection
            client={client}
            trainerNotes={trainerNotes}
            setTrainerNotes={setTrainerNotes}
            handleSaveTrainerNotes={handleSaveTrainerNotes}
            isSavingNotes={isSavingNotes}
            isEditingNotes={isEditingNotes}
            setIsEditingNotes={setIsEditingNotes}
            notesDraft={notesDraft}
            setNotesDraft={setNotesDraft}
            notesError={notesError}
            setNotesError={setNotesError}
          />

          {/* To Do Section */}
          <TodoSection
            todoItems={todoItems}
            setTodoItems={setTodoItems}
            isEditingTodo={isEditingTodo}
            setIsEditingTodo={setIsEditingTodo}
            handleSaveTodo={handleSaveTodo}
          />
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex space-x-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1 justify-center ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Enhanced Content Area */}
        <div className="space-y-8">
          {activeTab === "overview" && (
              <div className="space-y-8">
                <ClientStats clientId={clientId} isActive={activeTab === "overview"} />
              {/* Enhanced Trainer Notes and To-Do Section */}
              <TrainerNotesToDoSection
                client={client}
                trainerNotes={trainerNotes}
                setTrainerNotes={setTrainerNotes}
                handleSaveTrainerNotes={handleSaveTrainerNotes}
                isSavingNotes={isSavingNotes}
                isEditingNotes={isEditingNotes}
                setIsEditingNotes={setIsEditingNotes}
                notesDraft={notesDraft}
                setNotesDraft={setNotesDraft}
                notesError={notesError}
                setNotesError={setNotesError}
              />

              {/* Client Goals & Key Info Card */}
              <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Client Goals & Key Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.cl_primary_goal && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Primary Goal:</span>
                      <span className="text-gray-900 dark:text-white">{client.cl_primary_goal}</span>
                    </div>
                  )}
                  {client.cl_target_weight && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Target Weight:</span>
                      <span className="text-gray-900 dark:text-white">{client.cl_target_weight} kg</span>
                    </div>
                  )}
                  {client.confidence_level && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Confidence Level:</span>
                      <span className="text-gray-900 dark:text-white">{client.confidence_level}/10</span>
                    </div>
                  )}
                  {client.cl_activity_level && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Activity Level:</span>
                      <span className="text-gray-900 dark:text-white">{client.cl_activity_level}</span>
                    </div>
                  )}
                  {client.specific_outcome && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Specific Outcome:</span>
                      <span className="text-gray-900 dark:text-white">{client.specific_outcome}</span>
                    </div>
                  )}
                  {client.goal_timeline && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-200">Goal Timeline:</span>
                      <span className="text-gray-900 dark:text-white">{client.goal_timeline}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab Content Sections */}
          {activeTab === "metrics" && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <MetricsSection clientId={clientId} isActive={activeTab === "metrics"} />
              </CardHeader>
            </Card>
          )}

          {activeTab === "workout" && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <WorkoutPlanSection clientId={client?.id} />
              </CardHeader>
            </Card>
          )}

          {activeTab === "nutrition" && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <NutritionPlanSection clientId={clientId} isActive={activeTab === "nutrition"} />
              </CardHeader>
            </Card>
          )}

          {activeTab === "programs" && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <ProgramManagementSection clientId={clientId} isActive={activeTab === "programs"} />
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

        {/* AI Notes Summary Popup */}
        <AINotesSummaryPopup
          isOpen={showNotesSummaryPopup}
          onClose={() => setShowNotesSummaryPopup(false)}
          summaryResponse={notesSummaryResponse}
          clientName={client?.name || client?.preferredName}
        />
      </div>
    </div>
  )
}

