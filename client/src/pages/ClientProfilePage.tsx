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
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useParams } from "react-router-dom"

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
      if (clientId && isActive && !statsData) {
        setLoading(true)
        // Simulate API call - replace with actual data fetching
        setTimeout(() => {
          setStatsData({
            // Mock data - replace with actual stats
            totalSessions: 24,
            weeklyProgress: 85,
            monthlyGoals: 3
          })
          setLoading(false)
        }, 1000)
      }
    }, [clientId, isActive, statsData])

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
      data: [
        { month: "Jan", value: 15 },
        { month: "Feb", value: 18 },
        { month: "Mar", value: 20 },
        { month: "Apr", value: 22 },
        { month: "May", value: 25 },
        { month: "Jun", value: 28 },
        { month: "Jul", value: 30 },
        { month: "Aug", value: 32 },
        { month: "Sep", value: 35 },
        { month: "Oct", value: 38 },
        { month: "Nov", value: 42 },
        { month: "Dec", value: 47 },
      ],
    },
    {
      label: "Goals Achieved",
      value: "3",
      icon: Target,
      color: "text-blue-600",
      bgColor: "from-blue-500 to-indigo-600",
      data: [
        { month: "Jan", value: 0 },
        { month: "Feb", value: 0 },
        { month: "Mar", value: 1 },
        { month: "Apr", value: 1 },
        { month: "May", value: 1 },
        { month: "Jun", value: 2 },
        { month: "Jul", value: 2 },
        { month: "Aug", value: 2 },
        { month: "Sep", value: 2 },
        { month: "Oct", value: 3 },
        { month: "Nov", value: 3 },
        { month: "Dec", value: 3 },
      ],
    },
    {
      label: "Engagement Score",
      value: "85%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "from-purple-500 to-pink-600",
      data: [
        { month: "Jan", value: 65 },
        { month: "Feb", value: 68 },
        { month: "Mar", value: 70 },
        { month: "Apr", value: 72 },
        { month: "May", value: 75 },
        { month: "Jun", value: 77 },
        { month: "Jul", value: 79 },
        { month: "Aug", value: 81 },
        { month: "Sep", value: 82 },
        { month: "Oct", value: 83 },
        { month: "Nov", value: 84 },
        { month: "Dec", value: 85 },
      ],
    },
    {
      label: "Days Active",
      value: "127",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "from-orange-500 to-red-600",
      data: [
        { month: "Jan", value: 20 },
        { month: "Feb", value: 35 },
        { month: "Mar", value: 48 },
        { month: "Apr", value: 62 },
        { month: "May", value: 75 },
        { month: "Jun", value: 88 },
        { month: "Jul", value: 101 },
        { month: "Aug", value: 114 },
        { month: "Sep", value: 127 },
        { month: "Oct", value: 127 },
        { month: "Nov", value: 127 },
        { month: "Dec", value: 127 },
      ],
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
                  <ResponsiveContainer width="100%" height="100%">
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
                  </ResponsiveContainer>
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

// Enhanced Workout Plan Section
    const WorkoutPlanSection = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [workoutPlans, setWorkoutPlans] = useState<any[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)
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
      Monday: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
      Tuesday: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
      Wednesday: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg",
      Thursday: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
      Friday: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg",
      Saturday: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg",
      Sunday: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg",
    }
    return colors[day as keyof typeof colors] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
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
              <SelectTrigger className="h-8 min-w-[100px] text-sm border-2 border-blue-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option} className="text-sm">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      if (type === "textarea") {
        return (
          <div className="flex items-start gap-2">
            <Textarea
              value={String(editValue)}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] text-sm resize-none border-2 border-blue-300 focus:border-blue-500 rounded-xl"
              rows={3}
              autoFocus
            />
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600">
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-6 w-6 p-0 border-red-300 hover:bg-red-50"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm border-2 border-blue-300 focus:border-blue-500 rounded-lg"
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600">
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-6 w-6 p-0 border-red-300 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    }

    const cellContent = () => {
      if (field === "day") {
        return (
          <Badge
            className={`${getDayColor(String(value))} font-semibold cursor-pointer text-sm px-3 py-1 border-0 hover:scale-105 transition-transform`}
          >
            {String(value).slice(0, 3)}
          </Badge>
        )
      }
      if (field === "duration") {
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-blue-600 dark:text-blue-400">{value}min</span>
          </div>
        )
      }
      if (field === "sets") {
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-bold text-sm"
          >
            {value}
          </Badge>
        )
      }
      if (field === "coach_tip") {
        return (
          <div className="w-full">
            <p
              className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 leading-relaxed break-words p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              style={{
                lineHeight: "1.4",
                minHeight: "4em",
                display: "block",
              }}
              title={String(value)}
            >
              {String(value)}
            </p>
          </div>
        )
      }
      if (field === "exercise") {
        return (
          <div className="flex items-center gap-3">
            <span className="text-2xl">{workout.icon || "💪"}</span>
            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-gray-900 dark:text-white transition-colors">
              {String(value)}
            </span>
          </div>
        )
      }
      return (
        <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 text-sm text-gray-700 dark:text-gray-300 transition-colors">
          {String(value)}
        </span>
      )
    }

    return (
      <div
        onClick={() => handleCellClick(workout, field)}
        className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-200 hover:shadow-sm w-full p-2"
        title="Click to edit"
        draggable
        onDragStart={(e) => {
          // Enable dragging for workout rows
          const workoutData = {
            id: workout.id,
            name: workout.exercise,
            type: workout.category,
            duration: workout.duration,
            difficulty: "Custom",
            color: "bg-gray-500",
            category: workout.category,
            body_part: workout.body_part,
            exercises: [
              {
                workout: workout.exercise,
                duration: workout.duration,
                sets: workout.sets,
                reps: workout.reps,
                weights: workout.weight,
                coach_tip: workout.coach_tip,
                icon: workout.icon,
                category: workout.category,
                body_part: workout.body_part,
                workout_yt_link: "",
              },
            ],
          }
          e.dataTransfer.setData("text/plain", JSON.stringify(workoutData))
        }}
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

  const handleAddExercise = () => {
    // This function is now handled by handleAddNewWorkout in the table
    handleAddNewWorkout()
  }

  const handleDragStart = (e: any, plan: any) => {
    setIsDragging(true)
    setDragStartTime(Date.now())
    e.dataTransfer.setData("application/json", JSON.stringify(plan))
  }

  const handleDragEnd = () => {
    // Reset dragging state after a short delay to allow click detection
    setTimeout(() => {
      setIsDragging(false)
      setDragStartTime(0)
    }, 100)
  }

  const handleMouseDown = (e: React.MouseEvent, plan: WorkoutPlan) => {
    console.log("Mouse down on plan:", plan.name)
    setMouseDownTime(Date.now())
    setMouseDownPosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = (e: React.MouseEvent, plan: WorkoutPlan) => {
    const timeDiff = Date.now() - mouseDownTime
    const positionDiff = Math.abs(e.clientX - mouseDownPosition.x) + Math.abs(e.clientY - mouseDownPosition.y)

    console.log("Mouse up on plan:", plan.name, { timeDiff, positionDiff, isDragging })

    // Consider it a click if:
    // 1. Mouse was down for less than 300ms
    // 2. Mouse didn't move more than 5 pixels
    // 3. Not currently dragging
    if (timeDiff < 300 && positionDiff < 5 && !isDragging) {
      console.log("✅ Plan clicked - opening edit modal:", plan.name)
      handleEditPlan(plan)
    } else {
      console.log("❌ Click ignored - conditions not met")
    }
  }

  const handlePlanClick = (e: React.MouseEvent, plan: WorkoutPlan) => {
    // Fallback click handler
    e.preventDefault()
    e.stopPropagation()
  }

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

  // Handle plan editing
  const handleEditPlan = (plan: WorkoutPlan) => {
    console.log("🎯 handleEditPlan called for:", plan.name)
    setEditingPlan(plan)
    setEditedPlan(JSON.parse(JSON.stringify(plan))) // Deep copy
    setShowEditPlanModal(true)
    console.log("📱 Edit modal should now be open")
  }

  const handleSavePlan = () => {
    if (!editedPlan || !editingPlan) return

    // Update the plan in the appropriate array
    if (editingPlan.category === "ai_generated") {
      setAiGeneratedPlans((prev) => prev.map((plan) => (plan.id === editingPlan.id ? editedPlan : plan)))
    } else {
      // For custom plans, we'll update them in allWorkoutPlans
      setAllWorkoutPlans((prev) => prev.map((plan) => (plan.id === editingPlan.id ? editedPlan : plan)))
    }

    setShowEditPlanModal(false)
    setEditingPlan(null)
    setEditedPlan(null)

    toast({
      title: "Plan Updated",
      description: "Your workout plan has been successfully updated.",
    })
  }

  const handleAddExerciseToPlan = () => {
    if (!editedPlan) return

    const newExercise: WorkoutExercise = {
      workout: "New Exercise",
      duration: 2,
      sets: 3,
      reps: "10",
      weights: "bodyweight",
      coach_tip: "Focus on proper form",
      icon: "💪",
      category: "strength",
      body_part: "full_body",
      workout_yt_link: "",
    }

    setEditedPlan({
      ...editedPlan,
      exercises: [...editedPlan.exercises, newExercise],
    })
  }

  const handleRemoveExerciseFromPlan = (index: number) => {
    if (!editedPlan) return

    setEditedPlan({
      ...editedPlan,
      exercises: editedPlan.exercises.filter((_, i) => i !== index),
    })
  }

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    if (!editedPlan) return

    const updatedExercises = [...editedPlan.exercises]
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    }

    setEditedPlan({
      ...editedPlan,
      exercises: updatedExercises,
    })
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
    console.log("🚀 Button clicked - Starting AI generation process")
    console.log("⏰ Timestamp:", new Date().toISOString())

    setIsGeneratingAI(true)
    const startTime = Date.now() // Track response time

    try {
      const clientId = 34 // Hardcoded for now as requested
      console.log("🎯 Using hardcoded client ID:", clientId)

      const result = await generateAIWorkoutPlan(clientId)
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
              toast({
                title: "AI Workout Plan Generated",
                description: `Personalized plan created for ${clientName}. Click to view full response.`,
              })
            } catch (parseError) {
              console.error("Error parsing AI response:", parseError)
              // Show the raw response in popup (parsing failed)
              setAiResponse(result.aiResponse)
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

  // Data loading effect - placed after all hooks
  useEffect(() => {
    if (clientId && isActive && !dataLoaded) {
      setLoading(true)
      // Simulate API call - replace with actual workout plans fetching
      setTimeout(() => {
        setWorkoutPlans([
          // Mock data - replace with actual workout plans
          { id: 1, name: "Upper Body", exercises: [] },
          { id: 2, name: "Lower Body", exercises: [] }
        ])
        setDataLoaded(true)
        setLoading(false)
      }, 1200)
    }
  }, [clientId, isActive, dataLoaded])

  // Early return for loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <LoadingSpinner />
              <p className="text-gray-600 dark:text-gray-400">Loading workout plans...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-7 gap-8 h-full">
      {/* Enhanced Left Column - Weekly Calendar */}
      <div className="col-span-5 flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Schedule</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Drag exercises to schedule your week</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddExercise(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3 flex-1 overflow-y-auto">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="min-h-0">
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-20 pb-3 mb-3">
                <h4 className="text-sm font-bold text-center text-gray-700 dark:text-gray-300 uppercase tracking-wide py-2 px-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                  {day}
                </h4>
              </div>
              <div
                className="space-y-3 min-h-[300px] p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {scheduledWorkouts[index]?.map((workout, workoutIndex) => (
                  <div
                    key={workoutIndex}
                    className="group relative p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700 text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 text-sm">
                      {workout.name}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {workout.duration}m
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs"
                      >
                        {workout.difficulty}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30 rounded-full shadow-lg"
                      onClick={() => removeFromCalendar(index)}
                    >
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                ))}
                {(!scheduledWorkouts[index] || scheduledWorkouts[index].length === 0) && (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-xs">Drop exercises here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Right Column - Exercise Library */}
      <div className="col-span-2 flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Exercise Library</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drag to schedule</p>
            </div>
          </div>

          {/* Enhanced AI Generation Button */}
          <Button
            onClick={handleGenerateAIPlans}
            disabled={isGeneratingAI}
            className="w-full mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none h-14 text-base font-semibold"
          >
            {isGeneratingAI ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating AI Plan...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <span>Generate AI Workout Plan</span>
                <Zap className="h-5 w-5" />
              </div>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Enhanced AI Generated Plans Section */}
          {aiGeneratedPlans.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100">AI Generated Plans</h4>
                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 dark:from-purple-900 dark:to-pink-900 dark:text-purple-300 border-0">
                  {aiGeneratedPlans.length}
                </Badge>
              </div>
              {aiGeneratedPlans.map((plan) => (
                <div
                  key={plan.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, plan)}
                  onDragEnd={handleDragEnd}
                  onMouseDown={(e) => handleMouseDown(e, plan)}
                  onMouseUp={(e) => handleMouseUp(e, plan)}
                  onClick={(e) => handlePlanClick(e, plan)}
                  className="group relative p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-700 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-300 dark:hover:border-purple-600"
                >
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0 shadow-lg">
                      AI
                    </Badge>
                  </div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{plan.name}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{plan.duration}m</span>
                        <Badge
                          variant="outline"
                          className="text-xs border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                        >
                          {plan.exercises.length} exercises
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {plan.exercises.slice(0, 3).map((exercise, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-sm">{exercise.icon}</span>
                        <span className="truncate flex-1">{exercise.workout}</span>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs"
                        >
                          {exercise.sets}x{exercise.reps}
                        </Badge>
                      </div>
                    ))}
                    {plan.exercises.length > 3 && (
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        +{plan.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Custom Exercises Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100">Custom Exercises</h4>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
                {customExercises.length}
              </Badge>
            </div>
            {customExercises.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <p className="text-sm mb-2">No custom exercises yet</p>
                <p className="text-xs">Add your first exercise to get started</p>
              </div>
            ) : (
              customExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  draggable
                  className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-700 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{exercise.name}</h5>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                        >
                          {exercise.difficulty}
                        </Badge>
                        {exercise.duration && (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>{exercise.duration}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{exercise.instructions}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Workout Plan Table */}
      <div className="col-span-7 mt-8">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl dark:bg-gray-900/90">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-gray-900 dark:text-white">Workout Plan Overview</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-1">
                    Click any cell to edit • {sortedWorkouts.length} total exercises
                  </p>
                </div>
              </CardTitle>
              <Button
                onClick={handleAddNewWorkout}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedWorkouts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No workout plans created yet</p>
                <p className="text-sm text-gray-400">Generate an AI plan or add custom exercises to get started</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-green-950/50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Day</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Exercise</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Sets</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Reps</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Duration</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Weight</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Coach Tip</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedWorkouts.map((workout) => (
                        <tr
                          key={workout.id}
                          className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 transition-all duration-200"
                        >
                          <td className="px-6 py-4">{renderEditableCell(workout, "day", "select")}</td>
                          <td className="px-6 py-4 min-w-[200px]">{renderEditableCell(workout, "exercise")}</td>
                          <td className="px-6 py-4">{renderEditableCell(workout, "sets", "number")}</td>
                          <td className="px-6 py-4">{renderEditableCell(workout, "reps")}</td>
                          <td className="px-6 py-4">{renderEditableCell(workout, "duration", "number")}</td>
                          <td className="px-6 py-4">{renderEditableCell(workout, "weight", "select")}</td>
                          <td className="px-6 py-4 min-w-[300px] max-w-[400px]">
                            {renderEditableCell(workout, "coach_tip", "textarea")}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() => handleDeleteWorkout(workout.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Popups */}
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

      <ClientDataPopup
        isOpen={showClientDataPopup}
        onClose={() => setShowClientDataPopup(false)}
        clientInfo={clientInfo}
      />

      <AIMetricsPopup
        isOpen={showAIMetricsPopup}
        onClose={() => setShowAIMetricsPopup(false)}
        metrics={aiMetrics}
        clientName={clientInfo?.name || clientInfo?.preferredName}
      />

      {/* Enhanced Plan Edit Modal */}
      <Dialog open={showEditPlanModal} onOpenChange={setShowEditPlanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
          <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Edit Workout Plan
              </span>
            </DialogTitle>
          </DialogHeader>

          {editedPlan && (
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="plan-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Name
                  </Label>
                  <Input
                    id="plan-name"
                    value={editedPlan.name}
                    onChange={(e) => setEditedPlan({ ...editedPlan, name: e.target.value })}
                    className="mt-1 border-2 border-blue-200 focus:border-blue-400 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plan Type
                  </Label>
                  <Input
                    id="plan-type"
                    value={editedPlan.type}
                    onChange={(e) => setEditedPlan({ ...editedPlan, type: e.target.value })}
                    className="mt-1 border-2 border-blue-200 focus:border-blue-400 rounded-xl"
                  />
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Exercises</h4>
                  <Button
                    onClick={handleAddExerciseToPlan}
                    variant="outline"
                    size="sm"
                    className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {editedPlan.exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Exercise Name</Label>
                          <Input
                            value={exercise.workout}
                            onChange={(e) => handleUpdateExercise(index, "workout", e.target.value)}
                            className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Sets</Label>
                          <Input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleUpdateExercise(index, "sets", Number.parseInt(e.target.value) || 0)}
                            className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Reps</Label>
                          <Input
                            value={exercise.reps}
                            onChange={(e) => handleUpdateExercise(index, "reps", e.target.value)}
                            className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Duration (min)</Label>
                          <Input
                            type="number"
                            value={exercise.duration}
                            onChange={(e) =>
                              handleUpdateExercise(index, "duration", Number.parseInt(e.target.value) || 0)
                            }
                            className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Weight/Equipment
                          </Label>
                          <Select
                            value={exercise.weights}
                            onValueChange={(value) => handleUpdateExercise(index, "weights", value)}
                          >
                            <SelectTrigger className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {weightOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => handleRemoveExerciseFromPlan(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Coach Tip</Label>
                        <Textarea
                          value={exercise.coach_tip}
                          onChange={(e) => handleUpdateExercise(index, "coach_tip", e.target.value)}
                          className="mt-1 text-sm border-2 border-gray-200 focus:border-blue-400 rounded-lg resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowEditPlanModal(false)}
                  className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePlan}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enhanced Nutrition Plan Section
  const NutritionPlanSection = ({ clientId, isActive }: { clientId?: number; isActive?: boolean }) => {
    const [loading, setLoading] = useState(false)
    const [nutritionData, setNutritionData] = useState<any>(null)
    const [dataLoaded, setDataLoaded] = useState(false)
    const [mealPlan, setMealPlan] = useState<Record<string, MealItem[]>>({
    breakfast: [
      { name: "Greek Yogurt with Berries", calories: 150, protein: 15, carbs: 20, fats: 2 },
      { name: "Whole Grain Toast", calories: 80, protein: 3, carbs: 15, fats: 1 },
    ],
    lunch: [
      { name: "Grilled Chicken Salad", calories: 300, protein: 35, carbs: 10, fats: 12 },
      { name: "Quinoa", calories: 120, protein: 4, carbs: 22, fats: 2 },
    ],
    dinner: [
      { name: "Salmon Fillet", calories: 250, protein: 30, carbs: 0, fats: 14 },
      { name: "Roasted Vegetables", calories: 100, protein: 3, carbs: 20, fats: 2 },
    ],
    snacks: [
      { name: "Apple with Almond Butter", calories: 190, protein: 4, carbs: 25, fats: 8 },
      { name: "Protein Shake", calories: 120, protein: 25, carbs: 3, fats: 1 },
    ],
  })

  const [showAddMeal, setShowAddMeal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast")
  const [newMeal, setNewMeal] = useState<MealItem>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  })

  const mealTypes = [
    { key: "breakfast", label: "Breakfast", icon: "🌅", color: "from-yellow-400 to-orange-500" },
    { key: "lunch", label: "Lunch", icon: "☀️", color: "from-green-400 to-emerald-500" },
    { key: "dinner", label: "Dinner", icon: "🌙", color: "from-blue-400 to-indigo-500" },
    { key: "snacks", label: "Snacks", icon: "🍎", color: "from-purple-400 to-pink-500" },
  ]

  const getTotalNutrition = () => {
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    Object.values(mealPlan).forEach((meals) => {
      meals.forEach((meal) => {
        totals.calories += meal.calories
        totals.protein += meal.protein
        totals.carbs += meal.carbs
        totals.fats += meal.fats
      })
    })
    return totals
  }

  const handleAddMeal = () => {
    if (newMeal.name.trim()) {
      setMealPlan((prev) => ({
        ...prev,
        [selectedMealType]: [...(prev[selectedMealType] || []), newMeal],
      }))
      setNewMeal({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0 })
      setShowAddMeal(false)
    }
  }

  const handleRemoveMeal = (mealType: string, index: number) => {
    setMealPlan((prev) => ({
      ...prev,
      [mealType]: prev[mealType].filter((_, i) => i !== index),
    }))
  }

  // Data loading effect - placed after all hooks
  useEffect(() => {
    if (clientId && isActive && !dataLoaded) {
      setLoading(true)
      // Simulate API call - replace with actual nutrition data fetching
      setTimeout(() => {
        setNutritionData({
          // Mock data - replace with actual nutrition data
          dailyCalories: 2200,
          meals: {}
        })
        setDataLoaded(true)
        setLoading(false)
      }, 900)
    }
  }, [clientId, isActive, dataLoaded])

  // Early return for loading state
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

  const totals = getTotalNutrition()

  return (
    <div className="space-y-8">
      {/* Enhanced Nutrition Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Calories", value: totals.calories, unit: "kcal", color: "from-red-500 to-pink-600", icon: "🔥" },
          { label: "Protein", value: totals.protein, unit: "g", color: "from-blue-500 to-indigo-600", icon: "💪" },
          { label: "Carbs", value: totals.carbs, unit: "g", color: "from-green-500 to-emerald-600", icon: "🌾" },
          { label: "Fats", value: totals.fats, unit: "g", color: "from-yellow-500 to-orange-600", icon: "🥑" },
        ].map((stat, index) => (
          <Card
            key={index}
            className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
            />
            <CardContent className="relative p-6 text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
                <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{stat.unit}</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Meal Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {mealTypes.map((mealType) => (
          <Card
            key={mealType.key}
            className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90"
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${mealType.color} shadow-lg text-2xl`}>
                    {mealType.icon}
                  </div>
                  <div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{mealType.label}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {mealPlan[mealType.key]?.length || 0} items
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedMealType(mealType.key)
                    setShowAddMeal(true)
                  }}
                  className="h-9 px-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 dark:from-gray-800 dark:to-blue-950/50 dark:hover:from-gray-700 dark:hover:to-blue-900/50 border border-gray-200 dark:border-gray-700 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-blue-600 font-medium">Add</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mealPlan[mealType.key]?.length > 0 ? (
                  mealPlan[mealType.key].map((meal, index) => (
                    <div
                      key={index}
                      className="group/item p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">{meal.name}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMeal(mealType.key, index)}
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="text-center">
                          <div className="font-bold text-red-600 dark:text-red-400">{meal.calories}</div>
                          <div className="text-gray-500 dark:text-gray-400">cal</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600 dark:text-blue-400">{meal.protein}g</div>
                          <div className="text-gray-500 dark:text-gray-400">protein</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600 dark:text-green-400">{meal.carbs}g</div>
                          <div className="text-gray-500 dark:text-gray-400">carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-yellow-600 dark:text-yellow-400">{meal.fats}g</div>
                          <div className="text-gray-500 dark:text-gray-400">fats</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      {mealType.icon}
                    </div>
                    <p className="text-sm mb-2">No {mealType.label.toLowerCase()} items yet</p>
                    <p className="text-xs">Add your first meal to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Add Meal Modal */}
      <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
          <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                Add New Meal
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="meal-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Meal Type
              </Label>
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((type) => (
                    <SelectItem key={type.key} value={type.key}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meal-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Meal Name
              </Label>
              <Input
                id="meal-name"
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                placeholder="e.g., Grilled Chicken Breast"
                className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Calories
                </Label>
                <Input
                  id="calories"
                  type="number"
                  value={newMeal.calories}
                  onChange={(e) => setNewMeal({ ...newMeal, calories: Number.parseInt(e.target.value) || 0 })}
                  className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Protein (g)
                </Label>
                <Input
                  id="protein"
                  type="number"
                  value={newMeal.protein}
                  onChange={(e) => setNewMeal({ ...newMeal, protein: Number.parseInt(e.target.value) || 0 })}
                  className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Carbs (g)
                </Label>
                <Input
                  id="carbs"
                  type="number"
                  value={newMeal.carbs}
                  onChange={(e) => setNewMeal({ ...newMeal, carbs: Number.parseInt(e.target.value) || 0 })}
                  className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="fats" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fats (g)
                </Label>
                <Input
                  id="fats"
                  type="number"
                  value={newMeal.fats}
                  onChange={(e) => setNewMeal({ ...newMeal, fats: Number.parseInt(e.target.value) || 0 })}
                  className="mt-1 border-2 border-green-200 focus:border-green-400 rounded-xl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowAddMeal(false)}
                className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMeal}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Meal
              </Button>
            </div>
          </div>
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
  const [activeTab, setActiveTab] = useState("overview")
  const [showProfileCard, setShowProfileCard] = useState(false)
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allClientGoals, setAllClientGoals] = useState<string[]>([]);
  const [trainerNotes, setTrainerNotes] = useState<string>("");

  // Editable Trainer Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(trainerNotes);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

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
      // Fetch client names for these client_ids
      const { data: clientsData, error: clientsError } = await supabase
        .from("client")
        .select("client_id, cl_name")
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
        console
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
        const { data, error } = await supabase
          .from("client")
          .select("*")
          .eq("client_id", clientId)
          .single();
        
        if (error) {
          setError(error.message);
        } else if (!data) {
          setError("Client not found");
        } else {
          setClient(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch client data");
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  // Show page loading while fetching main client data
  if (loading) return <PageLoading />;
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="relative cursor-pointer group" onClick={() => setShowProfileCard(!showProfileCard)}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <img
                      src={client.cl_pic || "/placeholder.svg"}
                      alt={client.cl_name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
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
                    className="border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all duration-300"
                    disabled={clientsLoading}
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
                      <DropdownMenuItem key={c.client_id} onClick={() => console.log("Selected client:", c)}>
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
                    <img
                      src={client.cl_pic || "/placeholder.svg"}
                      alt={client.cl_name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
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

      {/* Enhanced Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl p-6 flex flex-col gap-3">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Dumbbell className="h-5 w-5 text-red-400" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Trainer Notes</span>
                    </CardTitle>
                    {!isEditingNotes && (
                      <Button size="icon" variant="ghost" onClick={() => setIsEditingNotes(true)}>
                        <span className="sr-only">Edit</span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" /></svg>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={notesDraft}
                          onChange={e => setNotesDraft(e.target.value)}
                          disabled={isSavingNotes}
                        />
                        {notesError && <div className="text-red-500 text-sm">{notesError}</div>}
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={handleSaveTrainerNotes} disabled={isSavingNotes}>
                            {isSavingNotes ? (
                              <div className="flex items-center gap-2">
                                <LoadingSpinner size="small" />
                                Saving...
                              </div>
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setIsEditingNotes(false); setNotesError(null); setNotesDraft(trainerNotes); }} disabled={isSavingNotes}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {trainerNotes ? trainerNotes : <span className="text-gray-400 italic">No notes from trainer yet.</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl p-6 flex flex-col gap-3">
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
            </div>
          )}
          {activeTab === "metrics" && <MetricsSection clientId={clientId} isActive={activeTab === "metrics"} />}
          {activeTab === "workout" && <WorkoutPlanSection clientId={clientId} isActive={activeTab === "workout"} />}
          {activeTab === "nutrition" && <NutritionPlanSection clientId={clientId} isActive={activeTab === "nutrition"} />}
          {activeTab === "programs" && <ProgramManagementSection clientId={clientId} isActive={activeTab === "programs"} />}
        </div>
      </div>
    </div>
  )
}

