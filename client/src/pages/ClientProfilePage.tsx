"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  Calendar,
  Edit,
  Activity,
  Target,
  TrendingUp,
  Clock,
  Save,
  Dumbbell,
  Utensils,
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
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Brain,
  PlusCircle,
  Cpu,
  CalendarDays,
  Search as SearchIcon,
  Table,
  FileText,
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
import { useNavigate, useParams, useLocation } from "react-router-dom"
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
import NutritionPlanSection from "@/components/NutritionPlanSection"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { StructuredTrainerNotesSection } from "@/components/StructuredTrainerNotesSection"
import { ProgramManagementSection } from "@/components/ProgramManagementSection"
import { ProgramsScreen } from "@/components/ProgramsScreen"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection"
import FitnessScoreVisualization from "@/components/fitness-score/FitnessScoreVisualization"
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost"
import { type PopupKey } from "@/components/popups/trainer-popups.config"
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
import { getClientImageUrl, getFallbackAvatarUrl } from '@/utils/image-utils'

// Import the real AI workout plan generator (used in WorkoutPlanSection)
// import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"


import { summarizeTrainerNotes } from "@/lib/ai-notes-summary"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"
import { Progress } from "@/components/ui/progress"
import { AICoachInsightsState, createDefaultAICoachInsightsState } from "@/types/ai-coach-insights"

// Helper functions to format and parse trainer notes with AI recommendations
const formatNotesWithAI = (notes: string, aiAnalysis: any): string => {
  const aiSection = `

---AI_ANALYSIS_START---
${JSON.stringify(aiAnalysis)}
---AI_ANALYSIS_END---`;
  
  return notes + aiSection;
};



import { getOrCreateEngagementScore } from "@/lib/client-engagement"
import { MetricsSection } from "@/components/metrics/MetricsSection"
import ClientOverviewSection from "@/components/ClientOverviewSection"


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

// AI Response Popup Component - Simplified (workout functionality moved to WorkoutPlanSection)
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
  const [activeTab, setActiveTab] = useState<"overview" | "raw">("overview")

  if (!isOpen || !aiResponse) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                AI Response Generated
              </span>
              {clientName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                  Response for {clientName}
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
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI-Powered Response</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              AI response has been generated. View the details below or check the raw response.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 bg-gray-100/80 dark:bg-gray-800/80 p-2 rounded-2xl backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg shadow-blue-500/20 scale-105"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
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

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900 dark:text-white">AI Response Overview</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Response details and metrics
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={onShowMetrics}
                    variant="outline"
                    className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Metrics
                  </Button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Length:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {aiResponse?.response?.length || 0} characters
                    </span>
                  </div>
                  {aiResponse?.usage && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Input Tokens:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{aiResponse.usage.prompt_tokens}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Output Tokens:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{aiResponse.usage.completion_tokens}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{aiResponse.usage.total_tokens}</span>
                      </div>
                    </>
                  )}
                  {aiResponse?.model && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Model:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{aiResponse.model}</span>
                    </div>
                  )}
                  {aiResponse?.timestamp && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Generated:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(aiResponse.timestamp).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Raw Response Tab */}
          {activeTab === "raw" && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Edit className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Raw AI Response</h4>
              </div>
              <pre className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                {aiResponse?.response || "No response available"}
              </pre>
            </div>
          )}
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
        const responseStr = summaryResponse.aiResponse.response;
        const jsonMatch = responseStr.match(/\{[\s\S]*\}/);
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
// Workout-related interfaces moved to WorkoutPlanSection component
// interface Exercise { ... }
// interface WorkoutExercise { ... }
// interface WorkoutPlan { ... }

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

// METRIC_LIBRARY and SortableMetric have been moved to @/lib/metrics-library

// Enhanced Client Stats Component
// ClientStats has been moved to @/components/metrics/ClientStats.tsx

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


// ProgramManagementSection has been moved to its own component file

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

      {/* Clients List - No height limit, no overflow */}
      <div className="space-y-2">
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
                {/* Scaled down Avatar with profile pic support */}
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                    currentClientId === client.client_id
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-blue-800 dark:group-hover:to-blue-800 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                  }`}>
                    {/* Try to show profile image if available, otherwise show initials */}
                    {client.profile_image_url ? (
                      <img
                        src={client.profile_image_url}
                        alt={client.cl_name}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.textContent = client.cl_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "?";
                          }
                        }}
                      />
                    ) : (
                      client.cl_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase() || "?"
                    )}
                  </div>
                  {/* Active Status Indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 shadow-lg"></div>
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium truncate transition-colors text-sm ${
                      currentClientId === client.client_id
                        ? "text-blue-900 dark:text-blue-300"
                        : "text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300"
                    }`}>
                      {client.cl_name}
                    </p>
                    {currentClientId === client.client_id && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
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
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// FilterCriteria component has been removed - not used in the application

// Fitness Goals Section Component - Modularized
// This component has been moved to @/components/overview/FitnessGoalsSection.tsx



// TrainerNotesSection component has been removed - replaced by StructuredTrainerNotesSection

// TodoSection component has been removed - not used in the application

// Structured Trainer Note Interface
interface TrainerNote {
  id: string
  date: string
  notes: string
  createdAt: string
}

// StructuredTrainerNotesSection has been moved to its own component file

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
  const location = useLocation();
  const navigate = useNavigate();
  const clientId = params.id && !isNaN(Number(params.id)) ? Number(params.id) : undefined;
  console.log("params:", params, "clientId:", clientId);
  
  // Get initial tab from URL params or localStorage, default to "metrics"
  const getInitialTab = () => {
    // First check URL parameters
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) return tabFromUrl;
    
    // Then check localStorage
    const savedTab = localStorage.getItem(`client-${clientId}-activeTab`);
    if (savedTab) return savedTab;
    
    // Default to metrics
    return "metrics";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
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
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [lastAIRecommendation, setLastAIRecommendation] = useState<any>(null)
  const [trainerNotes, setTrainerNotes] = useState("")
  const [notesDraft, setNotesDraft] = useState("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  
  // Unified AI Coach Insights State
  const [aiCoachInsights, setAiCoachInsights] = useState<AICoachInsightsState | null>(null)
  const [allClientGoals, setAllClientGoals] = useState<string[]>([])
  
  // Unified popup state for placeholder cards
  const [openPopup, setOpenPopup] = useState<PopupKey | null>(null)
  const [showFitnessScore, setShowFitnessScore] = useState(false)
  const [todoItems, setTodoItems] = useState(
    "1. Schedule nutrition consultation\n2. Update workout plan for next month\n3. Review progress photos\n4. Plan recovery week"
  )
  const [isEditingTodo, setIsEditingTodo] = useState(false)
  const [aiInsightsActiveTab, setAiInsightsActiveTab] = useState<'summary' | 'action_plan' | 'recommendations' | 'insights'>('summary')

  // Save active tab to localStorage and update URL when tab changes
  useEffect(() => {
    if (clientId && activeTab) {
      // Save to localStorage
      localStorage.setItem(`client-${clientId}-activeTab`, activeTab);
      
      // Update URL without causing a page reload
      const urlParams = new URLSearchParams(location.search);
      urlParams.set('tab', activeTab);
      navigate(`${location.pathname}?${urlParams.toString()}`, { replace: true });
    }
  }, [activeTab, clientId, location.pathname, location.search, navigate]);

  // Reset tab state when clientId changes
  useEffect(() => {
    if (clientId) {
      const newInitialTab = getInitialTab();
      setActiveTab(newInitialTab);
    }
  }, [clientId, location.search]);

  // Force layout containment when content loads
  useEffect(() => {
    const forceContainment = () => {
      const container = document.querySelector('.client-profile-tab-content');
      if (container) {
        // Force all child elements to respect container width
        const allChildren = container.querySelectorAll('*');
        allChildren.forEach((child: any) => {
          if (child.style) {
            child.style.maxWidth = '100%';
            child.style.boxSizing = 'border-box';
            child.style.overflowX = 'hidden';
          }
        });
      }
    };

    // Apply containment immediately
    forceContainment();
    
    // Apply containment after a short delay to catch dynamically loaded content
    const timer = setTimeout(forceContainment, 100);
    
    // Apply containment when client data changes
    if (client) {
      const clientTimer = setTimeout(forceContainment, 200);
      return () => clearTimeout(clientTimer);
    }

    return () => clearTimeout(timer);
  }, [client, activeTab]);

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
      
      // Get trainer ID
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", trainerEmail)
        .single();
      
      if (trainerError || !trainerData?.id || !clientId) {
        setNotesError("Failed to get trainer or client information");
        setIsSavingNotes(false);
        return;
      }
      
      // Save the notes to trainer_client_web table
      const { error: saveError } = await supabase
        .from("trainer_client_web")
        .update({ trainer_notes: notesDraft })
        .eq("trainer_id", trainerData.id)
        .eq("client_id", clientId);
        
      if (saveError) {
        setNotesError(saveError.message);
        setIsSavingNotes(false);
        return;
      }
      
      setTrainerNotes(notesDraft);
      setIsEditingNotes(false);
      console.log('✅ Notes saved successfully without AI analysis');
      
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

  // Unified AI Coach Insights Management
  const handleGenerateAIAnalysis = async () => {
    if (!client?.client_id || !trainerNotes) {
      console.log("Cannot generate AI analysis: missing client or trainer notes");
      return;
    }

    try {
      setIsGeneratingAnalysis(true);
      console.log('🤖 Generating AI analysis from trainer notes...');
      
      const result = await performComprehensiveCoachAnalysis(
        client.client_id,
        trainerNotes,
        '' // No todo items for now
      );

      if (result.success && result.analysis) {
        setLastAIRecommendation(result.analysis);
        console.log('✅ AI analysis generated successfully:', result.analysis);
      } else {
        console.error('❌ AI analysis failed:', result.message);
      }
    } catch (error: any) {
      console.error('❌ Error generating AI analysis:', error);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleSummarizeNotes = async () => {
    if (!trainerNotes || trainerNotes.trim().length === 0) {
      console.log("No trainer notes to summarize");
      return;
    }

    try {
      setIsSummarizingNotes(true);
      console.log('🔄 Starting notes summarization...');
      
      // Get trainer ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.email) {
        throw new Error("Not logged in");
      }
      const trainerEmail = sessionData.session.user.email;
      
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", trainerEmail)
        .single();
      
      if (trainerError || !trainerData?.id || !clientId) {
        throw new Error("Failed to get trainer or client information");
      }
      
      // Call the AI notes summary service
      const result = await summarizeTrainerNotes(trainerNotes, client?.id);
      
      console.log('📊 Summary Result:', result);
      
      if (result.success) {
        // Parse the AI response to get the analysis data
        let analysisData;
        try {
          if (result.aiResponse?.response) {
            // The response is already an object, so we can use it directly
            analysisData = result.aiResponse.response;
          }
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          analysisData = result.aiResponse;
        }
        
        // Save AI analysis to ai_summary column
        if (analysisData) {
          console.log('🔍 analysisData before saving:', analysisData);
          console.log('🔍 analysisData type:', typeof analysisData);
          console.log('🔍 analysisData keys:', Object.keys(analysisData || {}));
          
          const { error: aiSaveError } = await supabase
            .from("trainer_client_web")
            .update({ ai_summary: analysisData })
            .eq("trainer_id", trainerData.id)
            .eq("client_id", clientId);
            
          if (aiSaveError) {
            console.error('⚠️ Failed to save AI analysis:', aiSaveError);
          } else {
            console.log('✅ AI analysis saved to database');
            setLastAIRecommendation(analysisData);
            console.log('✅ lastAIRecommendation set to:', analysisData);
          }
        }
        
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

  // Initialize unified AI Coach Insights state
  useEffect(() => {
    if (client && clientId) {
      const unifiedState = createDefaultAICoachInsightsState(
        setLastAIRecommendation,
        setTrainerNotes,
        setNotesDraft,
        setIsEditingNotes,
        setIsSavingNotes,
        setNotesError,
        handleSaveTrainerNotes,
        handleGenerateAIAnalysis,
        isSummarizingNotes,
        handleSummarizeNotes
      );
      
      // Update with current values
      unifiedState.lastAIRecommendation = lastAIRecommendation;
      unifiedState.isGeneratingAnalysis = isGeneratingAnalysis;
      unifiedState.trainerNotes = trainerNotes;
      unifiedState.notesDraft = notesDraft;
      unifiedState.isEditingNotes = isEditingNotes;
      unifiedState.isSavingNotes = isSavingNotes;
      unifiedState.notesError = notesError;
      unifiedState.isSummarizingNotes = isSummarizingNotes;
      
      setAiCoachInsights(unifiedState);
    }
  }, [
    client, 
    clientId, 
    lastAIRecommendation, 
    isGeneratingAnalysis, 
    trainerNotes, 
    notesDraft, 
    isEditingNotes, 
    isSavingNotes, 
    notesError, 
    isSummarizingNotes
  ]);



  // Function to refresh client data after goals are saved
  const refreshClientData = async () => {
    if (!clientId) return;
    
    try {
      console.log('🔄 Refreshing client data...');
      const { data, error } = await supabase
        .from("client")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (error) {
        console.error("Error refreshing client data:", error);
      } else if (data) {
        console.log("✅ Client data refreshed:", data);
        setClient(data);
      }
    } catch (err) {
      console.error("Unexpected error refreshing client data:", err);
    }
  };



  // State for all clients of the trainer
  const [trainerClients, setTrainerClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Fetch trainer id and clients for dropdown
  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    (async () => {
      try {
        console.log('🔄 Loading trainer clients...');
        setClientsLoading(true);
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.user?.email) {
          if (isMounted) {
            setClientsLoading(false);
          }
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
          if (isMounted) {
            setClientsLoading(false);
          }
          return;
        }
        
        // Fetch all client_ids for this trainer from the linking table
        const { data: linkRows, error: linkError } = await supabase
          .from("trainer_client_web")
          .select("client_id")
          .eq("trainer_id", trainerData.id);
        if (linkError || !linkRows || linkRows.length === 0) {
          if (isMounted) {
            setTrainerClients([]);
            setClientsLoading(false);
          }
          return;
        }
        const clientIds = linkRows.map((row: any) => row.client_id).filter(Boolean);
        if (clientIds.length === 0) {
          if (isMounted) {
            setTrainerClients([]);
            setClientsLoading(false);
          }
          return;
        }
        
        // Fetch complete client data for these client_ids
        const { data: clientsData, error: clientsError } = await supabase
          .from("client")
          .select("client_id, cl_name, cl_email, last_active, created_at")
          .in("client_id", clientIds);
        
        if (!isMounted) return; // Don't update state if component unmounted
        
        if (!clientsError && clientsData) {
          setTrainerClients(clientsData);
        } else {
          setTrainerClients([]);
        }
        setClientsLoading(false);
      } catch (error) {
        console.error('❌ Error loading trainer clients:', error);
        if (isMounted) {
          setTrainerClients([]);
          setClientsLoading(false);
        }
      }
    })();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
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
    if (!clientId) return; // Don't run if no clientId
    
    let isMounted = true; // Track if component is still mounted
    
    (async () => {
      try {
        console.log(`🔄 Loading trainer notes for client: ${clientId}`);
        
        // 1. Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.user?.email) {
          if (isMounted) {
            setTrainerNotes("");
            setNotesDraft("");
            setLastAIRecommendation(null);
          }
          return;
        }
        const trainerEmail = sessionData.session.user.email;
        
        // 2. Fetch trainer ID
        const { data: trainerData, error: trainerError } = await supabase
          .from("trainer")
          .select("id")
          .eq("trainer_email", trainerEmail)
          .single();
        
        if (trainerError || !trainerData?.id || !clientId) {
          if (isMounted) {
            setTrainerNotes("");
            setNotesDraft("");
            setLastAIRecommendation(null);
          }
          return;
        }
        
        // 3. Fetch client-specific trainer notes from trainer_client_web table
        const { data, error } = await supabase
          .from("trainer_client_web")
          .select("trainer_notes, ai_summary")
          .eq("trainer_id", trainerData.id)
          .eq("client_id", clientId)
          .single();
        
        if (!isMounted) return; // Don't update state if component unmounted
        
        if (!error && data) {
          // Set trainer notes
          const notes = data.trainer_notes || "";
          setTrainerNotes(notes);
          setNotesDraft(notes);
          
          // Set AI analysis from ai_summary column
          if (data.ai_summary) {
            let parsedSummary: any = null;
            try {
              parsedSummary = typeof data.ai_summary === 'string' ? JSON.parse(data.ai_summary) : data.ai_summary;
            } catch (jsonErr) {
              console.error('❌ Failed to parse ai_summary JSON from DB:', jsonErr);
            }
            setLastAIRecommendation(parsedSummary);
            console.log('📊 Loaded previous AI analysis:', parsedSummary);
          } else {
            setLastAIRecommendation(null);
          }
        } else {
          setTrainerNotes("");
          setNotesDraft("");
          setLastAIRecommendation(null);
        }
      } catch (error) {
        console.error('❌ Error loading trainer notes:', error);
        if (isMounted) {
          setTrainerNotes("");
          setNotesDraft("");
          setLastAIRecommendation(null);
        }
      }
    })();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setError("No client ID provided");
      return;
    }

    setLoading(true);
    setError(null);
    
    let isMounted = true; // Track if component is still mounted
    
    (async () => {
      try {
        console.log(`🔄 Fetching client data for ID: ${clientId}`);
        
        // Fetch client data with timeout
        const clientDataPromise = supabase
          .from("client")
          .select("*")
          .eq("client_id", clientId)
          .single();
        
        const { data, error } = await Promise.race([
          clientDataPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Client data fetch timeout')), 30000)
          )
        ]);

        if (!isMounted) return; // Don't update state if component unmounted

        if (error) {
          console.error("Error fetching client:", error);
          if (error.message?.includes('timeout')) {
            setError("Client data fetch timed out. Please refresh the page.");
          } else {
            setError("Failed to fetch client data");
          }
          setClient(null);
        } else if (data) {
          console.log("✅ Fetched client:", data);
          setClient(data);
          setError(null);

          // Fetch client image URL using the new utility
          const imageUrl = await getClientImageUrl(data.client_id);

          if (!isMounted) return; // Don't update state if component unmounted

          setClientImageUrl(imageUrl);

        } else {
          setError("Client not found");
          setClient(null);
          setClientImageUrl(null);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (isMounted) {
          setError("An unexpected error occurred");
          setClient(null);
          setClientImageUrl(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
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
    <div className="client-profile-container min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/30 dark:to-indigo-950/50 flex overflow-hidden">
      {/* AllClientsSidebar - Left Sidebar */}
      <div className="client-profile-sidebar w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-200/70 dark:border-gray-700/70 shadow-xl overflow-y-auto flex-shrink-0">
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
      <div className="client-profile-content flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Enhanced Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg flex-shrink-0">
      <div className="w-full px-6 py-4">
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
                    {/* Removed Premium badge as per request */}
                    {/* Removed Member since text as per request */}
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex space-x-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-1 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>


          </div>

          {/* Enhanced Profile Card (Revised for Simplicity & Requirements) */}
          {showProfileCard && (
            <>
              {/* Overlay for click-away-to-close */}
              <div
                className="fixed inset-0 z-40 bg-black/10" // semi-transparent overlay
                onClick={() => setShowProfileCard(false)}
                aria-label="Close profile card by clicking outside"
              />
            <Card className="absolute top-20 left-6 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-300">
              <CardContent className="p-6">
                  {/* Profile Picture and Green Dot (active_session) */}
                  <div className="flex items-center gap-4 mb-6 relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-xl relative">
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
                      {/* Green dot only if active_session is true */}
                      {client.active_session && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-lg" title="Active now"></div>
                      )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.cl_name}</h3>
                      {/* Email */}
                      <p className="text-sm text-gray-600 dark:text-gray-400">{client.cl_email || 'N/A'}</p>
                      {/* Phone */}
                      <p className="text-sm text-gray-600 dark:text-gray-400">{client.cl_phone ? String(client.cl_phone) : 'N/A'}</p>
                      {/* Last Active */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last Active: {client.last_active ? new Date(client.last_active).toLocaleString() : 'N/A'}
                      </p>
                  </div>
                </div>

                  {/* Simple Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Weight */}
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.cl_weight ?? 'N/A'}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Weight (kg)</div>
                  </div>
                    {/* Height */}
                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{client.cl_height ?? 'N/A'}</div>
                    <div className="text-xs text-green-700 dark:text-green-300">Height (cm)</div>
                  </div>
                </div>

                  {/* Age */}
                  <div className="flex items-center gap-3 text-sm mb-4">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {/* Prefer cl_age, else calculate from cl_dob */}
                      {client.cl_age
                        ? client.cl_age
                        : client.cl_dob
                          ? new Date().getFullYear() - new Date(client.cl_dob).getFullYear()
                          : 'N/A'}
                    </span>
                </div>

                  {/* Goals */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Current Goals</h4>
                  <div className="space-y-2">
                    {client.cl_primary_goal ? (
                      <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_primary_goal}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No goals set yet.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className={`client-profile-tab-content flex-1 overflow-hidden ${activeTab === 'overview' ? '' : 'px-4 py-4'}`}>

        {/* Overview tab content */}
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Moved Overview logic/UI to ClientOverviewSection for modularity */}
            <ClientOverviewSection
              client={client}
              aiCoachInsights={aiCoachInsights || undefined}
              lastAIRecommendation={lastAIRecommendation}
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
              isGeneratingAnalysis={isGeneratingAnalysis}
              handleSummarizeNotes={handleSummarizeNotes}
              isSummarizingNotes={isSummarizingNotes}
              refreshClientData={refreshClientData}
            />
          </div>
        )}

        {/* Tab Content Sections */}
        {activeTab === "metrics" && (
          <div className="client-profile-scrollable h-full overflow-hidden">
            <Card className="h-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black overflow-hidden">
              <CardHeader className="pb-0 flex-shrink-0">
                <MetricsSection 
                  clientId={clientId} 
                  isActive={activeTab === "metrics"}
                  client={client}
                  lastAIRecommendation={lastAIRecommendation}
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
                  isGeneratingAnalysis={isGeneratingAnalysis}
                  handleSummarizeNotes={handleSummarizeNotes}
                  isSummarizingNotes={isSummarizingNotes}
                  setLastAIRecommendation={setLastAIRecommendation}
                />
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "workout" && (
          <div className="client-profile-scrollable h-full overflow-hidden">
            <Card className="h-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black overflow-hidden">
              <CardHeader className="pb-0 flex-shrink-0">
                <WorkoutPlanSection 
                  clientId={client?.client_id}
                  client={client}
                  lastAIRecommendation={lastAIRecommendation}
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
                  isGeneratingAnalysis={isGeneratingAnalysis}
                  handleSummarizeNotes={handleSummarizeNotes}
                  isSummarizingNotes={isSummarizingNotes}
                />
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "nutrition" && (
          <div className="client-profile-scrollable h-full overflow-hidden">
            <Card className="h-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black overflow-hidden">
              <CardHeader className="pb-0 flex-shrink-0">
                <NutritionPlanSection 
                  clientId={clientId} 
                  isActive={activeTab === "nutrition"}
                  client={client}
                  lastAIRecommendation={lastAIRecommendation}
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
                  isGeneratingAnalysis={isGeneratingAnalysis}
                  handleSummarizeNotes={handleSummarizeNotes}
                  isSummarizingNotes={isSummarizingNotes}
                />
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "programs" && (
          <div className="client-profile-scrollable h-full overflow-hidden">
            <ProgramsScreen 
              clientId={clientId}
              client={client}
              onGoalsSaved={refreshClientData}
              lastAIRecommendation={lastAIRecommendation}
            />
          </div>
        )}
      </div>
   

        {/* AI Notes Summary Popup */}
        <AINotesSummaryPopup
          isOpen={showNotesSummaryPopup}
          onClose={() => setShowNotesSummaryPopup(false)}
          summaryResponse={notesSummaryResponse}
          clientName={client?.name || client?.preferredName}
        />

        {/* Unified Popup Host */}
        <TrainerPopupHost
          openKey={openPopup}
          onClose={() => setOpenPopup(null)}
          context={{
            client,
            onGoalsSaved: refreshClientData,
            aiCoachInsights,
            onViewFullAnalysis: () => {},
            // Legacy props for backward compatibility
            lastAIRecommendation,
            trainerNotes,
            setTrainerNotes,
            handleSaveTrainerNotes,
            isSavingNotes,
            isEditingNotes,
            setIsEditingNotes,
            notesDraft,
            setNotesDraft,
            notesError,
            setNotesError,
            isGeneratingAnalysis,
            handleSummarizeNotes,
            isSummarizingNotes,
            setLastAIRecommendation
          }}
        />

        <TrainerPopupHost
          openKey={showFitnessScore ? 'fitnessGoals' : null}
          onClose={() => setShowFitnessScore(false)}
          context={{
            client,
            onGoalsSaved: () => {},
          }}
        />
      </div>
    </div>
  )
}