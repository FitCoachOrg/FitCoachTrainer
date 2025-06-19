<<<<<<< Updated upstream
import { useParams, useNavigate } from 'react-router-dom';
import { useClientProfile } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Activity, Target, TrendingUp, Dumbbell, Utensils, FileText, Settings, Search, User, Ruler, Weight, Edit, MoreHorizontal, Clock, Save, LineChart, Heart, Footprints, Pencil, Plus, Filter, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart as Chart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
=======
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Ruler,
  Weight,
  MapPin,
  Edit,
  MoreHorizontal,
  Activity,
  Target,
  TrendingUp,
  Clock,
  ArrowLeft,
  Save,
  Dumbbell,
  Utensils,
  LineChart,
  Heart,
  Footprints,
  Pencil,
  Plus,
  Filter,
  Copy,
  Trash2,
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
} from "recharts"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNavigate } from "react-router-dom"
import { DndContext, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HeaderBar } from "@/components/header-bar"
import { DescriptionInput } from "@/components/description-input"
import { ViewTabs } from "@/components/view-tabs"
import { ProgramCardsContainer } from "@/components/program-cards-container"
import { SaveButton } from "@/components/save-button"
import { AddTaskDropdown } from "@/components/add-task-dropdown"
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
import type { ViewMode, Difficulty, StartDay, TaskType, Task, ProgramData } from "@/types/program"
import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"
import { useToast } from "@/hooks/use-toast"
import { ClientDataPopup } from "@/components/ClientDataPopup"
import { AIResponsePopup } from "@/components/AIResponsePopup"
import { AIMetricsPopup } from "@/components/AIMetricsPopup"
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

interface EditableSectionProps {
  title: string
<<<<<<< Updated upstream
  icon: React.ElementType
  initialContent?: string
  storageKey: string
}
interface Exercise {
  id:string
  name: string
  instructions: string
  sets?: string
  reps?: string
  duration?: string
  equipment?: string
  difficulty: string
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
// Sample client data
const sampleClient = {
  id: "1",
  trainerId: 1,
  name: "Ben Andrew",
  email: "ben.andrew@example.com",
  avatarUrl: "/placeholder.svg?height=120&width=120",
  phone: "+1 (555) 123-4567",
  username: "ben_a",
  height: 178,
  weight: 74.4,
  dob: "1990-05-15",
  genderName: "Male",
  isActive: true,
  createdAt: "2023-01-15T10:00:00Z",
  updatedAt: "2024-05-15T10:00:00Z",
  location: "Los Angeles, CA",
  goals: ["Run a marathon without stopping", "Lose 5kg", "Improve endurance"],
  membershipType: "Premium",
}

const sampleClients = [
  {
    client_id: "1",
    name: "Ben Andrew",
    email: "ben.andrew@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    client_id: "2",
    name: "Kristina Wilson",
    email: "kristina.wilson@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
  {
    client_id: "3",
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "pending",
  },
  {
    client_id: "4",
    name: "David Brown",
    email: "david.brown@example.com",
    avatarUrl: "/placeholder.svg?height=40&width=40",
    status: "active",
  },
]

// Sample metrics data
const weightData = [
  { date: "MAY 14", weight: 74.8 },
  { date: "MAY 16", weight: 74.6 },
  { date: "MAY 18", weight: 74.9 },
  { date: "MAY 20", weight: 74.7 },
  { date: "MAY 22", weight: 74.5 },
  { date: "MAY 24", weight: 74.6 },
  { date: "MAY 26", weight: 74.3 },
  { date: "MAY 28", weight: 74.2 },
  { date: "MAY 30", weight: 74.0 },
  { date: "JUN 1", weight: 74.2 },
  { date: "JUN 3", weight: 74.4 },
]

const sleepData = [
  { date: "MAY 14", hours: 6.5 },
  { date: "MAY 15", hours: 7.2 },
  { date: "MAY 16", hours: 6.8 },
  { date: "MAY 17", hours: 7.0 },
  { date: "MAY 18", hours: 6.5 },
  { date: "MAY 19", hours: 7.5 },
  { date: "MAY 20", hours: 8.0 },
  { date: "MAY 21", hours: 7.2 },
  { date: "MAY 22", hours: 6.8 },
  { date: "MAY 23", hours: 7.0 },
  { date: "MAY 24", hours: 6.5 },
  { date: "MAY 25", hours: 7.5 },
  { date: "MAY 26", hours: 8.0 },
  { date: "MAY 27", hours: 7.2 },
  { date: "MAY 28", hours: 6.8 },
  { date: "MAY 29", hours: 7.0 },
  { date: "MAY 30", hours: 6.5 },
  { date: "MAY 31", hours: 7.5 },
  { date: "JUN 1", hours: 8.0 },
  { date: "JUN 2", hours: 7.2 },
  { date: "JUN 3", hours: 6.8 },
]

const heartRateData = [
  { date: "MAY 14", rate: 62 },
  { date: "MAY 16", rate: 64 },
  { date: "MAY 18", rate: 63 },
  { date: "MAY 20", rate: 65 },
  { date: "MAY 22", rate: 62 },
  { date: "MAY 24", rate: 61 },
  { date: "MAY 26", rate: 63 },
  { date: "MAY 28", rate: 62 },
  { date: "MAY 30", rate: 64 },
  { date: "JUN 1", rate: 63 },
  { date: "JUN 3", rate: 62 },
]

const stepsData = [
  { date: "MAY 14", steps: 8500 },
  { date: "MAY 15", steps: 7200 },
  { date: "MAY 16", steps: 9100 },
  { date: "MAY 17", steps: 8300 },
  { date: "MAY 18", steps: 7800 },
  { date: "MAY 19", steps: 6500 },
  { date: "MAY 20", steps: 9200 },
  { date: "MAY 21", steps: 8700 },
  { date: "MAY 22", steps: 8100 },
  { date: "MAY 23", steps: 7600 },
  { date: "MAY 24", steps: 8900 },
  { date: "MAY 25", steps: 9300 },
  { date: "MAY 26", steps: 8200 },
  { date: "MAY 27", steps: 7500 },
  { date: "MAY 28", steps: 8800 },
  { date: "MAY 29", steps: 9000 },
  { date: "MAY 30", steps: 8400 },
  { date: "MAY 31", steps: 7900 },
  { date: "JUN 1", steps: 8600 },
  { date: "JUN 2", steps: 9100 },
  { date: "JUN 3", steps: 8700 },
]

// Sample workout plan
const workoutPlan = [
  {
    day: "Monday",
    focus: "Upper Body",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-10", weight: "70kg" },
      { name: "Pull-ups", sets: 3, reps: "8-10", weight: "Bodyweight" },
      { name: "Shoulder Press", sets: 3, reps: "10-12", weight: "20kg" },
      { name: "Bicep Curls", sets: 3, reps: "12-15", weight: "15kg" },
      { name: "Tricep Extensions", sets: 3, reps: "12-15", weight: "15kg" },
    ],
  },
  {
    day: "Tuesday",
    focus: "Lower Body",
    exercises: [
      { name: "Squats", sets: 4, reps: "8-10", weight: "90kg" },
      { name: "Deadlifts", sets: 3, reps: "8-10", weight: "100kg" },
      { name: "Leg Press", sets: 3, reps: "10-12", weight: "120kg" },
      { name: "Calf Raises", sets: 3, reps: "15-20", weight: "40kg" },
    ],
  },
  {
    day: "Wednesday",
    focus: "Cardio",
    exercises: [
      { name: "Running", sets: 1, reps: "30 mins", weight: "N/A" },
      { name: "HIIT", sets: 1, reps: "15 mins", weight: "N/A" },
    ],
  },
  {
    day: "Thursday",
    focus: "Rest Day",
    exercises: [],
  },
  {
    day: "Friday",
    focus: "Full Body",
    exercises: [
      { name: "Deadlifts", sets: 3, reps: "8-10", weight: "100kg" },
      { name: "Bench Press", sets: 3, reps: "8-10", weight: "70kg" },
      { name: "Squats", sets: 3, reps: "8-10", weight: "90kg" },
      { name: "Pull-ups", sets: 3, reps: "8-10", weight: "Bodyweight" },
    ],
  },
  {
    day: "Saturday",
    focus: "Cardio & Core",
    exercises: [
      { name: "Running", sets: 1, reps: "45 mins", weight: "N/A" },
      { name: "Planks", sets: 3, reps: "60 secs", weight: "N/A" },
      { name: "Russian Twists", sets: 3, reps: "20 each side", weight: "10kg" },
    ],
  },
  {
    day: "Sunday",
    focus: "Rest Day",
    exercises: [],
  },
]

// Sample nutrition plan
const nutritionPlan = [
  {
    meal: "Breakfast",
    foods: [
      { name: "Oatmeal", portion: "1 cup", calories: 300, protein: 10, carbs: 50, fat: 5 },
      { name: "Banana", portion: "1 medium", calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: "Protein Shake", portion: "1 scoop", calories: 120, protein: 25, carbs: 3, fat: 1 },
    ],
  },
  {
    meal: "Lunch",
    foods: [
      { name: "Grilled Chicken", portion: "150g", calories: 250, protein: 35, carbs: 0, fat: 10 },
      { name: "Brown Rice", portion: "1 cup", calories: 215, protein: 5, carbs: 45, fat: 2 },
      { name: "Mixed Vegetables", portion: "1 cup", calories: 80, protein: 4, carbs: 15, fat: 1 },
    ],
  },
  {
    meal: "Snack",
    foods: [
      { name: "Greek Yogurt", portion: "1 cup", calories: 150, protein: 20, carbs: 8, fat: 4 },
      { name: "Almonds", portion: "1/4 cup", calories: 170, protein: 6, carbs: 6, fat: 15 },
    ],
  },
  {
    meal: "Dinner",
    foods: [
      { name: "Salmon", portion: "150g", calories: 280, protein: 30, carbs: 0, fat: 18 },
      { name: "Quinoa", portion: "1 cup", calories: 220, protein: 8, carbs: 40, fat: 4 },
      { name: "Steamed Broccoli", portion: "1 cup", calories: 55, protein: 4, carbs: 11, fat: 0 },
    ],
  },
]

const METRIC_LIBRARY = [
  {
    key: 'weight',
    label: 'Weight',
    icon: Weight,
    type: 'line',
    color: '#3b82f6',
    data: weightData,
    dataKey: 'weight',
    yLabel: 'kg',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    icon: Clock,
    type: 'bar',
    color: '#14b8a6',
    data: sleepData,
    dataKey: 'hours',
    yLabel: 'h',
  },
  {
    key: 'heartRate',
    label: 'Resting Heart Rate',
    icon: Heart,
    type: 'line',
    color: '#e11d48',
    data: heartRateData,
    dataKey: 'rate',
    yLabel: 'bpm',
  },
  {
    key: 'steps',
    label: 'Steps',
    icon: Footprints,
    type: 'bar',
    color: '#d97706',
    data: stepsData,
    dataKey: 'steps',
    yLabel: 'steps',
  },
  {
    key: 'workoutAdherence',
    label: 'Workout Adherence',
    icon: Activity,
    type: 'line',
    color: '#6366f1',
    data: [
      { date: 'May', value: 90 },
      { date: 'Jun', value: 87 },
    ],
    dataKey: 'value',
    yLabel: '%',
  },
  {
    key: 'revenue',
    label: 'Revenue Analytics',
    icon: LineChart,
    type: 'line',
    color: '#f59e42',
    data: [
      { date: 'May', value: 1200 },
      { date: 'Jun', value: 1500 },
    ],
    dataKey: 'value',
    yLabel: '$',
  },
  {
    key: 'retention',
    label: 'Client Retention Rate',
    icon: Target,
    type: 'line',
    color: '#10b981',
    data: [
      { date: 'May', value: 80 },
      { date: 'Jun', value: 85 },
    ],
    dataKey: 'value',
    yLabel: '%',
  },
  {
    key: 'progress',
    label: 'Progress Improvement',
    icon: TrendingUp,
    type: 'line',
    color: '#9333ea',
    data: [
      { date: 'May', value: 60 },
      { date: 'Jun', value: 75 },
    ],
    dataKey: 'value',
    yLabel: '%',
  },
];

function SortableMetric({ metric, listeners, attributes, isDragging }: { metric: any, listeners: any, attributes: any, isDragging: boolean }) {
  const { setNodeRef, transform, transition } = useSortable({ id: metric.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };
=======
  icon: LucideIcon
  children: React.ReactNode
  onEdit?: () => void
  isEditing?: boolean
}

const EditableSection = ({ title, icon: Icon, children, onEdit, isEditing }: EditableSectionProps) => {
>>>>>>> Stashed changes
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {isEditing ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

const MetricsSection = () => {
  const metrics = [
    {
      title: "Weight",
      value: "75 kg",
      change: "+2.5 kg",
      changeType: "increase",
      data: [
        { date: "Jan", value: 72.5 },
        { date: "Feb", value: 73.0 },
        { date: "Mar", value: 73.5 },
        { date: "Apr", value: 74.0 },
        { date: "May", value: 74.5 },
        { date: "Jun", value: 75.0 }
      ]
    },
    {
      title: "Sleep",
      value: "7.5 hrs",
      change: "-0.5 hrs",
      changeType: "decrease",
      data: [
        { date: "Jan", value: 8.0 },
        { date: "Feb", value: 7.8 },
        { date: "Mar", value: 7.7 },
        { date: "Apr", value: 7.6 },
        { date: "May", value: 7.5 },
        { date: "Jun", value: 7.5 }
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{metric.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    <p className={`text-sm ${metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  <LineChart className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Chart data={metric.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={metric.changeType === 'increase' ? '#22c55e' : '#ef4444'}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                      activeDot={{ r: 4, strokeWidth: 2 }}
                    />
                  </Chart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const WorkoutPlanSection = () => {
  const workouts = [
    {
      id: 1,
      name: "Full Body Strength",
      description: "Focus on compound movements and overall strength",
      exercises: [
        { name: "Squats", sets: 4, reps: "8-10", weight: "80kg" },
        { name: "Bench Press", sets: 4, reps: "8-10", weight: "60kg" },
        { name: "Deadlifts", sets: 4, reps: "6-8", weight: "100kg" }
      ],
      duration: "60 min",
      difficulty: "Intermediate",
      targetMuscles: ["Legs", "Chest", "Back"],
      equipment: ["Barbell", "Bench", "Squat Rack"]
    },
    {
      id: 2,
      name: "HIIT Cardio",
      description: "High-intensity interval training for fat loss",
      exercises: [
        { name: "Burpees", sets: 4, reps: "30 sec", weight: "Bodyweight" },
        { name: "Mountain Climbers", sets: 4, reps: "30 sec", weight: "Bodyweight" },
        { name: "Jump Rope", sets: 4, reps: "30 sec", weight: "Bodyweight" }
      ],
      duration: "30 min",
      difficulty: "Advanced",
      targetMuscles: ["Full Body"],
      equipment: ["None"]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Plans</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workouts.map((workout) => (
          <Card key={workout.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{workout.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{workout.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Exercises</h4>
                  <div className="space-y-3">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{exercise.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {exercise.sets} sets × {exercise.reps}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{exercise.weight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{workout.duration}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Difficulty</p>
                      <p className="font-medium text-gray-900 dark:text-white">{workout.difficulty}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Target Muscles</p>
                      <div className="flex gap-2">
                        {workout.targetMuscles.map((muscle, index) => (
                          <Badge key={index} variant="secondary">{muscle}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400">Equipment</p>
                      <div className="flex gap-2">
                        {workout.equipment.map((item, index) => (
                          <Badge key={index} variant="outline">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const NutritionPlanSection = () => {
  const nutritionPlans = [
    {
      id: 1,
      name: "High Protein Diet",
      description: "Focused on muscle building and recovery",
      meals: [
        {
          name: "Breakfast",
          time: "8:00 AM",
          foods: [
            { name: "Oatmeal", amount: "1 cup", calories: 300 },
            { name: "Protein Shake", amount: "1 serving", calories: 150 },
            { name: "Banana", amount: "1 medium", calories: 105 }
          ]
        },
        {
          name: "Lunch",
          time: "1:00 PM",
          foods: [
            { name: "Grilled Chicken Breast", amount: "200g", calories: 330 },
            { name: "Brown Rice", amount: "1 cup", calories: 216 },
            { name: "Mixed Vegetables", amount: "1 cup", calories: 100 }
          ]
        },
        {
          name: "Dinner",
          time: "7:00 PM",
          foods: [
            { name: "Salmon", amount: "200g", calories: 412 },
            { name: "Sweet Potato", amount: "1 medium", calories: 103 },
            { name: "Broccoli", amount: "1 cup", calories: 55 }
          ]
        }
      ],
      totalCalories: 2125,
      macros: {
        protein: "180g",
        carbs: "200g",
        fats: "65g"
      },
      restrictions: ["No processed foods", "No added sugars"]
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nutrition Plans</h2>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {nutritionPlans.map((plan) => (
          <Card key={plan.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Meal Plan</h4>
                  <div className="space-y-4">
                    {plan.meals.map((meal, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-white">{meal.name}</h5>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{meal.time}</span>
                        </div>
                        <div className="space-y-2">
                          {meal.foods.map((food, foodIndex) => (
                            <div key={foodIndex} className="flex justify-between items-center text-sm">
                              <div>
                                <p className="text-gray-900 dark:text-white">{food.name}</p>
                                <p className="text-gray-600 dark:text-gray-400">{food.amount}</p>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400">{food.calories} cal</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Nutrition Summary</h4>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">Daily Calories</h5>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{plan.totalCalories} cal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{plan.macros.protein}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{plan.macros.carbs}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Fats</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{plan.macros.fats}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Dietary Restrictions</h5>
                      <div className="flex flex-wrap gap-2">
                        {plan.restrictions.map((restriction, index) => (
                          <Badge key={index} variant="secondary">{restriction}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const ClientStats = () => {
  const stats = [
    { 
      label: "Workouts Completed", 
      value: "47", 
      subtitle: "in Last 30 Days",
      icon: Activity, 
      color: "text-green-600", 
      data: [
        { month: "May", value: 20 },
        { month: "Jun", value: 27 }
      ]
    },
    { label: "Goals Achieved", value: "3", icon: Target, color: "text-blue-600" },
    { 
      label: "Progress Score", 
      value: "85%", 
      icon: TrendingUp, 
      color: "text-purple-600", 
      data: [
        { month: "May", value: 80 },
        { month: "Jun", value: 85 }
      ]
    },
    { label: "Days Active", value: "127", icon: Clock, color: "text-orange-600" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black group"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              {stat.data && (
                <div className="h-0 group-hover:h-[100px] w-full mt-2 overflow-hidden transition-all duration-300">
                  <ResponsiveContainer width="100%" height="100%">
                    <Chart data={stat.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={stat.color.replace('text-', '#').replace('green-600', '22c55e').replace('purple-600', '9333ea')}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
                        activeDot={{ r: 4, strokeWidth: 2 }}
                      />
                    </Chart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

<<<<<<< Updated upstream
const EditableSection: React.FC<EditableSectionProps> = ({ title, icon, initialContent, storageKey }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(initialContent || "")
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

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-rose-500" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="h-8 px-2"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
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
            className="min-h-[120px] focus:border-rose-300 focus:ring-rose-200/50"
            placeholder={`Add ${title.toLowerCase()} here...`}
          />
        ) : (
          <div className="space-y-2">
            {content ? (
              content.split(".").map((sentence, i) => (
                sentence.trim() && (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{sentence.trim()}</p>
                    <input type="checkbox" className="ml-2 w-5 h-5" aria-label={`Goal ${i + 1}`} style={{ accentColor: 'green' }} />
                  </div>
                )
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} added yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const MetricsSection = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('selectedMetrics');
    return saved ? JSON.parse(saved) : ['weight', 'sleep', 'heartRate', 'steps'];
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('selectedMetrics', JSON.stringify(selectedKeys));
  }, [selectedKeys]);

  const selectedMetrics = selectedKeys.map((key: string) => METRIC_LIBRARY.find(m => m.key === key)).filter(Boolean) as typeof METRIC_LIBRARY;
  const availableMetrics = METRIC_LIBRARY.filter(m => !selectedKeys.includes(m.key));

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (selectedKeys.length < 4 && value && !selectedKeys.includes(value)) {
      setSelectedKeys([...selectedKeys, value]);
    }
  }

  function handleRemove(key: string) {
    setSelectedKeys(selectedKeys.filter((k: string) => k !== key));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedKeys.indexOf(active.id as string);
      const newIndex = selectedKeys.indexOf(over.id as string);
      setSelectedKeys(arrayMove(selectedKeys, oldIndex, newIndex));
    }
    setDraggingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Customization Panel */}
      <div className="mb-4 p-4 bg-slate-50 rounded-lg border flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex flex-wrap gap-2 items-center">
          <span className="font-medium mr-2">Your Metrics:</span>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={e => setDraggingId(String(e.active.id))}>
            <SortableContext items={selectedMetrics.map((m: any) => m.key)} strategy={verticalListSortingStrategy}>
              {selectedMetrics.map((metric: any) => (
                <div key={metric.key} className="flex items-center gap-1 bg-white border rounded px-2 py-1 shadow-sm cursor-grab" tabIndex={0} aria-label={`Drag to reorder ${metric.label}`}>
                  <span className="mr-1 cursor-grab" title="Drag to reorder">☰</span>
                  <metric.icon className="h-4 w-4" />
                  <span className="text-sm">{metric.label}</span>
                  <button onClick={() => handleRemove(metric.key)} className="ml-1 text-xs text-red-500" aria-label={`Remove ${metric.label}`}>✕</button>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div>
          {/* Accessibility: label for select */}
          <label htmlFor="metric-select" className="sr-only">Add Metric</label>
          <select id="metric-select" className="border rounded px-2 py-1 text-sm" onChange={handleSelectChange} value="">
            <option value="">Add Metric...</option>
            {availableMetrics.map((m: any) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Metrics Grid */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedMetrics.map((m: any) => m.key)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedMetrics.map((metric: any) => (
              <div key={metric.key} className="cursor-grab">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
                      {metric.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {metric.type === 'line' ? (
                          <Chart data={metric.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey={metric.dataKey} stroke={metric.color} strokeWidth={2} dot={{ r: 3 }} />
                          </Chart>
                        ) : (
                          <BarChart data={metric.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey={metric.dataKey} fill={metric.color} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
=======
export default function ClientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const trainerId = 1; // This should come from your auth context in a real app

  const { data: client, isLoading, error } = useClientProfile(
    id ? parseInt(id) : 0,
    trainerId
>>>>>>> Stashed changes
  );

<<<<<<< Updated upstream
const WorkoutPlanSection = () => {
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

  // Recommended workout plans - Compatible with Supabase workout_plan table
  const recommendedPlans = [
    {
      id: "upper-body-strength",
      name: "Upper Body Strength",
      type: "Upper Body",
      duration: 45,
      difficulty: "Intermediate",
      color: "bg-blue-500",
      category: "strength",
      body_part: "upper_body",
      exercises: [
        {
          workout: "Bench Press",
          duration: 3,
          sets: 4,
          reps: "8-10",
          weights: "70kg",
          coach_tip: "Keep your core engaged and maintain proper form throughout the movement",
          icon: "💪",
          category: "strength",
          body_part: "chest",
          workout_yt_link: "https://youtube.com/watch?v=bench-press-tutorial"
        },
        {
          workout: "Pull-ups",
          duration: 2.5,
          sets: 3,
          reps: "8-12",
          weights: "bodyweight",
          coach_tip: "Focus on controlled movement, engage your lats",
          icon: "🏋️",
          category: "strength",
          body_part: "back",
          workout_yt_link: "https://youtube.com/watch?v=pullups-tutorial"
        },
        {
          workout: "Shoulder Press",
          duration: 2,
          sets: 3,
          reps: "10-12",
          weights: "20kg dumbbells",
          coach_tip: "Keep shoulders stable, press straight up",
          icon: "🏋️‍♀️",
          category: "strength",
          body_part: "shoulders",
          workout_yt_link: "https://youtube.com/watch?v=shoulder-press-tutorial"
        },
        {
          workout: "Bent-over Rows",
          duration: 2.5,
          sets: 3,
          reps: "10-12",
          weights: "60kg barbell",
          coach_tip: "Keep back straight, pull to lower chest",
          icon: "💪",
          category: "strength",
          body_part: "back",
          workout_yt_link: "https://youtube.com/watch?v=bent-rows-tutorial"
        },
        {
          workout: "Bicep Curls",
          duration: 1.5,
          sets: 3,
          reps: "12-15",
          weights: "15kg dumbbells",
          coach_tip: "Control the negative, squeeze at the top",
          icon: "💪",
          category: "strength",
          body_part: "arms",
          workout_yt_link: "https://youtube.com/watch?v=bicep-curls-tutorial"
        },
        {
          workout: "Tricep Dips",
          duration: 1.5,
          sets: 3,
          reps: "10-15",
          weights: "bodyweight",
          coach_tip: "Keep elbows close to body, full range of motion",
          icon: "💪",
          category: "strength",
          body_part: "arms",
          workout_yt_link: "https://youtube.com/watch?v=tricep-dips-tutorial"
        }
      ],
    },
    {
      id: "lower-body-power",
      name: "Lower Body Power",
      type: "Lower Body",
      duration: 50,
      difficulty: "Intermediate",
      color: "bg-green-500",
      category: "strength",
      body_part: "lower_body",
      exercises: [
        {
          workout: "Squats",
          duration: 4,
          sets: 4,
          reps: "8-12",
          weights: "90kg barbell",
          coach_tip: "Keep chest up, knees tracking over toes",
          icon: "🏋️",
          category: "strength",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=squats-tutorial"
        },
        {
          workout: "Deadlifts",
          duration: 4,
          sets: 3,
          reps: "6-8",
          weights: "100kg barbell",
          coach_tip: "Keep bar close to body, drive through heels",
          icon: "🏋️‍♂️",
          category: "strength",
          body_part: "full_body",
          workout_yt_link: "https://youtube.com/watch?v=deadlifts-tutorial"
        },
        {
          workout: "Lunges",
          duration: 3,
          sets: 3,
          reps: "10 each leg",
          weights: "25kg dumbbells",
          coach_tip: "Step forward with control, keep torso upright",
          icon: "🦵",
          category: "strength",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=lunges-tutorial"
        },
        {
          workout: "Leg Press",
          duration: 3,
          sets: 3,
          reps: "12-15",
          weights: "120kg",
          coach_tip: "Full range of motion, control the weight",
          icon: "🏋️",
          category: "strength",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=leg-press-tutorial"
        },
        {
          workout: "Calf Raises",
          duration: 2,
          sets: 4,
          reps: "15-20",
          weights: "40kg dumbbells",
          coach_tip: "Full extension, pause at the top",
          icon: "🦵",
          category: "strength",
          body_part: "calves",
          workout_yt_link: "https://youtube.com/watch?v=calf-raises-tutorial"
        },
        {
          workout: "Glute Bridges",
          duration: 2,
          sets: 3,
          reps: "15-20",
          weights: "bodyweight",
          coach_tip: "Squeeze glutes at top, control the descent",
          icon: "🍑",
          category: "strength",
          body_part: "glutes",
          workout_yt_link: "https://youtube.com/watch?v=glute-bridges-tutorial"
        }
      ],
    },
    {
      id: "cardio-hiit-blast",
      name: "HIIT Cardio Blast",
      type: "Cardio",
      duration: 30,
      difficulty: "Advanced",
      color: "bg-red-500",
      category: "cardio",
      body_part: "full_body",
      exercises: [
        {
          workout: "Burpees",
          duration: 0.5,
          sets: 4,
          reps: "30 seconds",
          weights: "bodyweight",
          coach_tip: "Maintain form even when tired, full body engagement",
          icon: "🔥",
          category: "cardio",
          body_part: "full_body",
          workout_yt_link: "https://youtube.com/watch?v=burpees-tutorial"
        },
        {
          workout: "Mountain Climbers",
          duration: 0.5,
          sets: 4,
          reps: "30 seconds",
          weights: "bodyweight",
          coach_tip: "Keep core tight, rapid alternating movement",
          icon: "⛰️",
          category: "cardio",
          body_part: "core",
          workout_yt_link: "https://youtube.com/watch?v=mountain-climbers-tutorial"
        },
        {
          workout: "Jump Squats",
          duration: 0.5,
          sets: 4,
          reps: "30 seconds",
          weights: "bodyweight",
          coach_tip: "Land softly, explosive upward movement",
          icon: "🦘",
          category: "cardio",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=jump-squats-tutorial"
        },
        {
          workout: "High Knees",
          duration: 0.5,
          sets: 4,
          reps: "30 seconds",
          weights: "bodyweight",
          coach_tip: "Drive knees up high, stay on balls of feet",
          icon: "🏃",
          category: "cardio",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=high-knees-tutorial"
        },
        {
          workout: "Plank Jacks",
          duration: 0.5,
          sets: 4,
          reps: "30 seconds",
          weights: "bodyweight",
          coach_tip: "Maintain plank position, quick feet movement",
          icon: "🏃‍♀️",
          category: "cardio",
          body_part: "core",
          workout_yt_link: "https://youtube.com/watch?v=plank-jacks-tutorial"
        },
        {
          workout: "Sprint Intervals",
          duration: 0.33,
          sets: 6,
          reps: "20 seconds",
          weights: "bodyweight",
          coach_tip: "Maximum effort, full recovery between sets",
          icon: "💨",
          category: "cardio",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=sprint-intervals-tutorial"
        }
      ],
    },
    {
      id: "flexibility-recovery",
      name: "Flexibility & Recovery",
      type: "Flexibility",
      duration: 25,
      difficulty: "Beginner",
      color: "bg-purple-500",
      category: "flexibility",
      body_part: "full_body",
      exercises: [
        {
          workout: "Cat-Cow Stretch",
          duration: 2,
          sets: 3,
          reps: "10-15",
          weights: "bodyweight",
          coach_tip: "Slow, controlled movement, feel the stretch",
          icon: "🐱",
          category: "flexibility",
          body_part: "spine",
          workout_yt_link: "https://youtube.com/watch?v=cat-cow-tutorial"
        },
        {
          workout: "Downward Dog",
          duration: 1.5,
          sets: 3,
          reps: "30 seconds hold",
          weights: "bodyweight",
          coach_tip: "Press hands down, lengthen spine",
          icon: "🐕",
          category: "flexibility",
          body_part: "full_body",
          workout_yt_link: "https://youtube.com/watch?v=downward-dog-tutorial"
        },
        {
          workout: "Pigeon Pose",
          duration: 2,
          sets: 2,
          reps: "45 seconds each side",
          weights: "bodyweight",
          coach_tip: "Breathe deeply, relax into the stretch",
          icon: "🕊️",
          category: "flexibility",
          body_part: "hips",
          workout_yt_link: "https://youtube.com/watch?v=pigeon-pose-tutorial"
        },
        {
          workout: "Hamstring Stretch",
          duration: 1.5,
          sets: 2,
          reps: "30 seconds each leg",
          weights: "bodyweight",
          coach_tip: "Keep back straight, reach forward gently",
          icon: "🦵",
          category: "flexibility",
          body_part: "legs",
          workout_yt_link: "https://youtube.com/watch?v=hamstring-stretch-tutorial"
        },
        {
          workout: "Shoulder Rolls",
          duration: 1,
          sets: 3,
          reps: "10 forward, 10 backward",
          weights: "bodyweight",
          coach_tip: "Large, slow circles, release tension",
          icon: "🔄",
          category: "flexibility",
          body_part: "shoulders",
          workout_yt_link: "https://youtube.com/watch?v=shoulder-rolls-tutorial"
        },
        {
          workout: "Child's Pose",
          duration: 2,
          sets: 1,
          reps: "60 seconds hold",
          weights: "bodyweight",
          coach_tip: "Focus on breathing, complete relaxation",
          icon: "🧘",
          category: "flexibility",
          body_part: "full_body",
          workout_yt_link: "https://youtube.com/watch?v=childs-pose-tutorial"
        }
      ],
    }
  ]

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const handleAddExercise = () => {
    if (newExercise.name && newExercise.instructions) {
      const exercise = {
        id: Date.now().toString(),
        ...newExercise,
        createdAt: new Date().toISOString(),
      }
      setCustomExercises([...customExercises, exercise])
      setNewExercise({
        name: "",
        instructions: "",
        sets: "",
        reps: "",
        duration: "",
        equipment: "",
        difficulty: "Beginner",
      })
      setShowAddExercise(false)
    }
  }

  const handleDragStart = (e:any, plan:any) => {
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
    console.log('Mouse down on plan:', plan.name)
    setMouseDownTime(Date.now())
    setMouseDownPosition({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = (e: React.MouseEvent, plan: WorkoutPlan) => {
    const timeDiff = Date.now() - mouseDownTime
    const positionDiff = Math.abs(e.clientX - mouseDownPosition.x) + Math.abs(e.clientY - mouseDownPosition.y)
    
    console.log('Mouse up on plan:', plan.name, { timeDiff, positionDiff, isDragging })
    
    // Consider it a click if:
    // 1. Mouse was down for less than 300ms
    // 2. Mouse didn't move more than 5 pixels
    // 3. Not currently dragging
    if (timeDiff < 300 && positionDiff < 5 && !isDragging) {
      console.log('✅ Plan clicked - opening edit modal:', plan.name)
      handleEditPlan(plan)
    } else {
      console.log('❌ Click ignored - conditions not met')
    }
  }

  const handlePlanClick = (e: React.MouseEvent, plan: WorkoutPlan) => {
    // Fallback click handler
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragOver = (e:any) => {
    e.preventDefault()
  }

  const handleDrop = (e:any, day:any) => {
    e.preventDefault()
    const planData = JSON.parse(e.dataTransfer.getData("application/json"))
    setWeeklyPlan((prev) => ({
      ...prev,
      [day]: planData,
    }))
  }

  const removeFromCalendar = (day:any) => {
    setWeeklyPlan((prev) => {
      const newPlan = { ...prev }
      delete newPlan[day]
      return newPlan
    })
  }

  // Handle plan editing
  const handleEditPlan = (plan: WorkoutPlan) => {
    console.log('🎯 handleEditPlan called for:', plan.name)
    setEditingPlan(plan)
    setEditedPlan(JSON.parse(JSON.stringify(plan))) // Deep copy
    setShowEditPlanModal(true)
    console.log('📱 Edit modal should now be open')
  }

  const handleSavePlan = () => {
    if (!editedPlan || !editingPlan) return

    // Update the plan in the appropriate array
    if (editingPlan.category === 'ai_generated') {
      setAiGeneratedPlans(prev => 
        prev.map(plan => plan.id === editingPlan.id ? editedPlan : plan)
      )
    } else {
      // For default plans, we'll update them in the recommendedPlans array
      // Since recommendedPlans is a const, we'll store edited versions separately
      const updatedPlans = recommendedPlans.map(plan => 
        plan.id === editingPlan.id ? editedPlan : plan
      )
      // You might want to store this in state or localStorage
      localStorage.setItem('editedRecommendedPlans', JSON.stringify(updatedPlans))
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
      workout_yt_link: ""
    }
    
    setEditedPlan({
      ...editedPlan,
      exercises: [...editedPlan.exercises, newExercise]
    })
  }

  const handleRemoveExerciseFromPlan = (index: number) => {
    if (!editedPlan) return
    
    setEditedPlan({
      ...editedPlan,
      exercises: editedPlan.exercises.filter((_, i) => i !== index)
    })
  }

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    if (!editedPlan) return
    
    const updatedExercises = [...editedPlan.exercises]
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value
    }
    
    setEditedPlan({
      ...editedPlan,
      exercises: updatedExercises
    })
  }

  // Function to parse AI response and convert to recommended plans format
  const parseAIResponseToPlans = (aiResponseText: string) => {
    try {
      // Extract JSON from the AI response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const aiData = JSON.parse(jsonMatch[0]);
      
      if (!aiData.workout_plan || !Array.isArray(aiData.workout_plan)) {
        throw new Error('Invalid workout plan format in AI response');
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
          workout_yt_link: ""
        }))
      };

      return [aiPlan];
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  // Handle AI fitness plan generation
  const handleGenerateAIPlans = async () => {
    console.log('🚀 Button clicked - Starting AI generation process');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    setIsGeneratingAI(true)
    const startTime = Date.now() // Track response time
    
    try {
      const clientId = 34 // Hardcoded for now as requested
      console.log('🎯 Using hardcoded client ID:', clientId);
      
      const result = await generateAIWorkoutPlan(clientId)
      const responseTime = Date.now() - startTime // Calculate response time
      
      console.log('📬 Function Response:');
      console.log('  - Success:', result.success);
      console.log('  - Message:', result.message);
      console.log('  - Has Client Data:', !!result.clientData);
      
      if (result.success) {
        console.log('✅ SUCCESS - Data retrieval completed');
        
        // Log the client data to console for inspection
        if (result.clientData && result.clientInfo) {
          console.log('🎉 CLIENT DATA SUCCESSFULLY RETRIEVED:');
          console.log('📋 Data Format: JavaScript Object');
          console.log('🔢 Number of Properties:', Object.keys(result.clientData).length);
          console.log('🏷️ Property Names:', Object.keys(result.clientData));
          console.log('📊 Full Client Data Object:');
          console.table(result.clientData); // Display as table for better readability
          console.log('📄 JSON Format:');
          console.log(JSON.stringify(result.clientData, null, 2));
          console.log('💾 Organized Client Info:');
          console.log(result.clientInfo);
          
          // Set client info
          setClientInfo(result.clientInfo);
          
          // If AI response is available, parse and add to recommended plans
          if (result.aiResponse) {
            try {
              const aiPlans = parseAIResponseToPlans(result.aiResponse.response);
              setAiGeneratedPlans(aiPlans);
              setAiResponse(result.aiResponse);
              
              // Always show the complete AI response first
              setShowAIResponsePopup(true);
              
              // Capture metrics for later display
              if (result.aiResponse.usage) {
                const metrics = {
                  inputTokens: result.aiResponse.usage.prompt_tokens || 0,
                  outputTokens: result.aiResponse.usage.completion_tokens || 0,
                  totalTokens: result.aiResponse.usage.total_tokens || 0,
                  model: result.aiResponse.model || 'gpt-4',
                  timestamp: result.aiResponse.timestamp,
                  responseTime: responseTime
                };
                setAiMetrics(metrics);
              }
              
              toast({
                title: "AI Workout Plan Generated",
                description: `Personalized plan created for ${result.clientInfo.name || result.clientInfo.preferredName}. Click to view full response.`,
              })
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
              // Show the raw response in popup (parsing failed)
              setAiResponse(result.aiResponse);
              setShowAIResponsePopup(true);
              
              // Capture metrics for later display
              if (result.aiResponse.usage) {
                const metrics = {
                  inputTokens: result.aiResponse.usage.prompt_tokens || 0,
                  outputTokens: result.aiResponse.usage.completion_tokens || 0,
                  totalTokens: result.aiResponse.usage.total_tokens || 0,
                  model: result.aiResponse.model || 'gpt-4',
                  timestamp: result.aiResponse.timestamp,
                  responseTime: responseTime
                };
                setAiMetrics(metrics);
              }
              
              toast({
                title: "AI Response Generated",
                description: "View the complete AI response. Plans may need manual parsing.",
              })
            }
          } else {
            setShowClientDataPopup(true);
            toast({
              title: "Client Data Retrieved",
              description: `Showing data for ${result.clientInfo.name || result.clientInfo.preferredName}`,
            })
          }
        } else {
          console.warn('⚠️ Success reported but no client data in response');
          toast({
            title: "Client Data Retrieved", 
            description: result.message,
          })
        }
      } else {
        console.log('❌ FAILURE - Data retrieval failed');
        console.log('💬 Error Message:', result.message);
        
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
      
    } catch (err) {
      console.error('💥 EXCEPTION CAUGHT in handleGenerateAIPlans:');
      console.error('  - Error Type:', typeof err);
      console.error('  - Error:', err);
      console.error('  - Stack:', err instanceof Error ? err.stack : 'No stack');
      
      toast({
        title: "Error",
        description: "Something went wrong while fetching client data.",
        variant: "destructive"
      })
    } finally {
      console.log('🏁 Process completed - Resetting loading state');
      setIsGeneratingAI(false)
    }
  }

  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="space-y-8">
      {/* Recommended Plans */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recommended Workout Plans</h3>
          <Button
            onClick={() => setShowAddExercise(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Exercise
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {recommendedPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-move dark:bg-black"
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                    {plan.name}
                  </CardTitle>
                  <Badge variant="outline">{plan.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {plan.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    {plan.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {plan.exercises.slice(0, 3).map((exercise, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium">{exercise.name}</span>
                      <span className="text-gray-500">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 3 && (
                    <div className="text-sm text-gray-500 italic">+{plan.exercises.length - 3} more exercises</div>
                  )}
                </div>
                <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Drag to calendar to schedule</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Calendar */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Weekly Workout Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysOfWeek.map((day) => (
=======
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left Column - Recommended Plans */}
      <div className="flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recommended Plans</h3>
            <Button
              onClick={handleGenerateAIPlans}
              disabled={isGeneratingAI}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Generating AI Plan...
                </>
              ) : (
                <>
                  <div className="mr-1">🤖</div>
                  Generate AI Plan
                </>
              )}
            </Button>
          </div>

        </div>
        <div className="space-y-4 overflow-y-auto pr-2">

          {/* AI Generated Plans */}
          {aiGeneratedPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onMouseDown={(e) => handleMouseDown(e, plan)}
              onMouseUp={(e) => handleMouseUp(e, plan)}
              onClick={(e) => handlePlanClick(e, plan)}
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    {plan.name}
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1">
                      🤖 AI
                    </Badge>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                    {plan.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {plan.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 mb-3">
                  {plan.exercises.slice(0, 4).map((exercise, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{exercise.workout}</span>
                      <span className="text-gray-500 text-xs">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 4 && (
                    <div className="text-xs text-gray-500 italic text-center pt-1">
                      +{plan.exercises.length - 4} more exercises
                    </div>
                  )}
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center relative">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    AI Generated • Click to edit • Drag to schedule
                  </p>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-3 w-3 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Default Recommended Plans */}
          {recommendedPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-black"
              onMouseDown={(e) => handleMouseDown(e, plan)}
              onMouseUp={(e) => handleMouseUp(e, plan)}
              onClick={(e) => handlePlanClick(e, plan)}
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                    {plan.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{plan.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {plan.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 mb-3">
                  {plan.exercises.slice(0, 4).map((exercise, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{exercise.workout}</span>
                      <span className="text-gray-500 text-xs">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 4 && (
                    <div className="text-xs text-gray-500 italic text-center pt-1">
                      +{plan.exercises.length - 4} more exercises
                    </div>
                  )}
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center relative">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Click to edit • Drag to schedule
                  </p>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column - Weekly Calendar & Custom Exercises */}
      <div className="flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Schedule</h3>
            <Button
              onClick={() => setShowAddExercise(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          </div>
        </div>
=======
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left Column - Recommended Plans */}
      <div className="flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recommended Plans</h3>
            <Button
              onClick={handleGenerateAIPlans}
              disabled={isGeneratingAI}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isGeneratingAI ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Generating AI Plan...
                </>
              ) : (
                <>
                  <div className="mr-1">🤖</div>
                  Generate AI Plan
                </>
              )}
            </Button>
          </div>

        </div>
        <div className="space-y-4 overflow-y-auto pr-2">

          {/* AI Generated Plans */}
          {aiGeneratedPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onMouseDown={(e) => handleMouseDown(e, plan)}
              onMouseUp={(e) => handleMouseUp(e, plan)}
              onClick={(e) => handlePlanClick(e, plan)}
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    {plan.name}
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1">
                      🤖 AI
                    </Badge>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                    {plan.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {plan.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 mb-3">
                  {plan.exercises.slice(0, 4).map((exercise, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{exercise.workout}</span>
                      <span className="text-gray-500 text-xs">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 4 && (
                    <div className="text-xs text-gray-500 italic text-center pt-1">
                      +{plan.exercises.length - 4} more exercises
                    </div>
                  )}
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center relative">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    AI Generated • Click to edit • Drag to schedule
                  </p>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-3 w-3 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Default Recommended Plans */}
          {recommendedPlans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group dark:bg-black"
              onMouseDown={(e) => handleMouseDown(e, plan)}
              onMouseUp={(e) => handleMouseUp(e, plan)}
              onClick={(e) => handlePlanClick(e, plan)}
              draggable
              onDragStart={(e) => handleDragStart(e, plan)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${plan.color}`} />
                    {plan.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{plan.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {plan.duration} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {plan.type}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 mb-3">
                  {plan.exercises.slice(0, 4).map((exercise, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{exercise.workout}</span>
                      <span className="text-gray-500 text-xs">
                        {exercise.sets} × {exercise.reps}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 4 && (
                    <div className="text-xs text-gray-500 italic text-center pt-1">
                      +{plan.exercises.length - 4} more exercises
                    </div>
                  )}
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center relative">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Click to edit • Drag to schedule
                  </p>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column - Weekly Calendar & Custom Exercises */}
      <div className="flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Schedule</h3>
            <Button
              onClick={() => setShowAddExercise(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          </div>
        </div>
>>>>>>> Stashed changes
        
        {/* Weekly Calendar - Compact 2-column layout */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {daysOfWeek.map((day, index) => (
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            <Card
              key={day}
              className={`bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors min-h-[180px] dark:bg-black dark:border-gray-700 ${
                index === 6 ? 'col-span-2' : '' // Make Sunday span both columns
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">{day}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {weeklyPlan[day] ? (
                  <div className="space-y-2">
                    <div className={`p-2 rounded-lg text-white ${weeklyPlan[day].color}`}>
                      <div className="font-medium text-xs">{weeklyPlan[day].name}</div>
                      <div className="text-xs opacity-90">{weeklyPlan[day].duration} min</div>
                    </div>
                    <div className="space-y-1">
                      {weeklyPlan[day].exercises.slice(0, 2).map((exercise, i) => (
                        <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                          • {exercise.workout}
                        </div>
                      ))}
                      {weeklyPlan[day].exercises.length > 2 && (
                        <div className="text-xs text-gray-500 italic">+{weeklyPlan[day].exercises.length - 2} more</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCalendar(day)}
                      className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
                    <div className="text-center">
                      <Dumbbell className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">Drop workout here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
<<<<<<< Updated upstream
      </div>

<<<<<<< Updated upstream
      {/* Custom Exercises */}
      {customExercises.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Custom Exercises</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customExercises.map((exercise) => (
              <Card key={exercise.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{exercise.name}</CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {exercise.difficulty}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">{exercise.instructions}</p>
                    {exercise.sets && (
                      <div className="flex justify-between">
                        <span>Sets:</span>
                        <span className="font-medium">{exercise.sets}</span>
                      </div>
                    )}
                    {exercise.reps && (
                      <div className="flex justify-between">
                        <span>Reps:</span>
                        <span className="font-medium">{exercise.reps}</span>
                      </div>
                    )}
                    {exercise.duration && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{exercise.duration}</span>
                      </div>
                    )}
                    {exercise.equipment && (
                      <div className="flex justify-between">
                        <span>Equipment:</span>
                        <span className="font-medium">{exercise.equipment}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

=======

=======
>>>>>>> Stashed changes
        {/* Custom Exercises Section - Compact */}
        {customExercises.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Custom Exercises</h4>
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto">
              {customExercises.map((exercise) => (
                <Card key={exercise.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm dark:bg-black">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{exercise.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {exercise.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{exercise.instructions}</p>
                      <div className="flex justify-between text-xs">
                        {exercise.sets && <span>Sets: {exercise.sets}</span>}
                        {exercise.reps && <span>Reps: {exercise.reps}</span>}
                        {exercise.duration && <span>Duration: {exercise.duration}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      {/* Add Exercise Modal */}
      {showAddExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Add Custom Exercise
                <Button variant="ghost" size="sm" onClick={() => setShowAddExercise(false)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Exercise Name *</label>
                <Input
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  placeholder="e.g., Push-ups"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions *</label>
                <Textarea
                  value={newExercise.instructions}
                  onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                  placeholder="Describe how to perform this exercise..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Sets</label>
                  <Input
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: e.target.value })}
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reps</label>
                  <Input
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                    placeholder="e.g., 10-12"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Duration</label>
                <Input
                  value={newExercise.duration}
                  onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
                  placeholder="e.g., 30 seconds"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Equipment</label>
                <Input
                  value={newExercise.equipment}
                  onChange={(e) => setNewExercise({ ...newExercise, equipment: e.target.value })}
                  placeholder="e.g., Dumbbells"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <select
                  value={newExercise.difficulty}
                  onChange={(e) => setNewExercise({ ...newExercise, difficulty: e.target.value })}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddExercise}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Add Exercise
                </Button>
                <Button variant="outline" onClick={() => setShowAddExercise(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Client Data Popup */}
      <ClientDataPopup 
        isOpen={showClientDataPopup}
        onClose={() => setShowClientDataPopup(false)}
        clientInfo={clientInfo}
      />
      
      {/* AI Response Popup */}
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
      
      {/* AI Metrics Popup */}
      <AIMetricsPopup 
        isOpen={showAIMetricsPopup}
        onClose={() => setShowAIMetricsPopup(false)}
        metrics={aiMetrics}
        clientName={clientInfo?.name || clientInfo?.preferredName}
      />

      {/* Edit Plan Modal */}
      <Dialog open={showEditPlanModal} onOpenChange={setShowEditPlanModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workout Plan</DialogTitle>
          </DialogHeader>
          
          {editedPlan && (
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={editedPlan.name}
                    onChange={(e) => setEditedPlan({...editedPlan, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-type">Type</Label>
                  <Input
                    id="plan-type"
                    value={editedPlan.type}
                    onChange={(e) => setEditedPlan({...editedPlan, type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-duration">Duration (minutes)</Label>
                  <Input
                    id="plan-duration"
                    type="number"
                    value={editedPlan.duration}
                    onChange={(e) => setEditedPlan({...editedPlan, duration: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-difficulty">Difficulty</Label>
                  <Select
                    value={editedPlan.difficulty}
                    onValueChange={(value) => setEditedPlan({...editedPlan, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="AI Recommended">AI Recommended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-category">Category</Label>
                  <Select
                    value={editedPlan.category}
                    onValueChange={(value) => setEditedPlan({...editedPlan, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="ai_generated">AI Generated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-body-part">Body Part</Label>
                  <Select
                    value={editedPlan.body_part}
                    onValueChange={(value) => setEditedPlan({...editedPlan, body_part: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_body">Full Body</SelectItem>
                      <SelectItem value="upper_body">Upper Body</SelectItem>
                      <SelectItem value="lower_body">Lower Body</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="arms">Arms</SelectItem>
                      <SelectItem value="legs">Legs</SelectItem>
                      <SelectItem value="chest">Chest</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                      <SelectItem value="shoulders">Shoulders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exercises */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Exercises</h3>
                  <Button onClick={handleAddExerciseToPlan} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exercise
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {editedPlan.exercises.map((exercise, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label>Exercise Name</Label>
                          <Input
                            value={exercise.workout}
                            onChange={(e) => handleUpdateExercise(index, 'workout', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Input
                            value={exercise.icon}
                            onChange={(e) => handleUpdateExercise(index, 'icon', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sets</Label>
                          <Input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reps</Label>
                          <Input
                            value={exercise.reps}
                            onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={exercise.duration}
                            onChange={(e) => handleUpdateExercise(index, 'duration', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Weights</Label>
                          <Input
                            value={exercise.weights}
                            onChange={(e) => handleUpdateExercise(index, 'weights', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={exercise.category}
                            onValueChange={(value) => handleUpdateExercise(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="strength">Strength</SelectItem>
                              <SelectItem value="cardio">Cardio</SelectItem>
                              <SelectItem value="flexibility">Flexibility</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Body Part</Label>
                          <Select
                            value={exercise.body_part}
                            onValueChange={(value) => handleUpdateExercise(index, 'body_part', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_body">Full Body</SelectItem>
                              <SelectItem value="chest">Chest</SelectItem>
                              <SelectItem value="back">Back</SelectItem>
                              <SelectItem value="shoulders">Shoulders</SelectItem>
                              <SelectItem value="arms">Arms</SelectItem>
                              <SelectItem value="legs">Legs</SelectItem>
                              <SelectItem value="core">Core</SelectItem>
                              <SelectItem value="glutes">Glutes</SelectItem>
                              <SelectItem value="calves">Calves</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label>Coach Tip</Label>
                        <Textarea
                          value={exercise.coach_tip}
                          onChange={(e) => handleUpdateExercise(index, 'coach_tip', e.target.value)}
                          placeholder="Enter coaching tip for this exercise..."
                        />
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label>YouTube Link</Label>
                        <Input
                          value={exercise.workout_yt_link}
                          onChange={(e) => handleUpdateExercise(index, 'workout_yt_link', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleRemoveExerciseFromPlan(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Exercise
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditPlanModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan}>
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

const NutritionPlanSection = () => {
  const [selectedDay, setSelectedDay] = useState("monday")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItemDialog, setNewItemDialog] = useState<string | null>(null)
  const [mealItems, setMealItems] = useState({
    breakfast: [
      { name: "Oatmeal with berries", calories: 320, protein: 12, carbs: 58, fats: 6 },
      { name: "Greek yogurt", calories: 150, protein: 20, carbs: 8, fats: 4 },
      { name: "Banana", calories: 105, protein: 1, carbs: 27, fats: 0 },
    ],
    lunch: [
      { name: "Grilled chicken breast", calories: 280, protein: 53, carbs: 0, fats: 6 },
      { name: "Quinoa salad", calories: 220, protein: 8, carbs: 39, fats: 4 },
      { name: "Mixed vegetables", calories: 80, protein: 3, carbs: 16, fats: 1 },
    ],
    snack: [
      { name: "Mixed nuts", calories: 170, protein: 6, carbs: 6, fats: 15 },
      { name: "Apple", calories: 95, protein: 0, carbs: 25, fats: 0 },
      { name: "Protein shake", calories: 120, protein: 25, carbs: 3, fats: 1 },
    ],
    dinner: [
      { name: "Salmon fillet", calories: 350, protein: 39, carbs: 0, fats: 20 },
      { name: "Sweet potato", calories: 180, protein: 4, carbs: 41, fats: 0 },
      { name: "Steamed broccoli", calories: 55, protein: 6, carbs: 11, fats: 1 },
    ],
<<<<<<< Updated upstream
=======
  })
  const [newItem, setNewItem] = useState({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0 })

  interface WeeklyTarget {
    name: string
    current: number
    target: number
    unit: string
    icon: React.ReactNode
    color: string
  }

  interface DayTotal {
    day: string
    date: string
    calories: number
    protein: number
    carbs: number
    fats: number
    completed: boolean
  }

  interface MealItem {
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
  }

  const weeklyTargets: WeeklyTarget[] = [
    {
      name: "Calories",
      current: 9850,
      target: 14000,
      unit: "kcal",
      icon: <Target className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Protein",
      current: 420,
      target: 840,
      unit: "g",
      icon: <Dumbbell className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Carbs",
      current: 680,
      target: 1260,
      unit: "g",
      icon: <Utensils className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Fats",
      current: 245,
      target: 490,
      unit: "g",
      icon: <Heart className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Vitamins",
      current: 65,
      target: 100,
      unit: "%",
      icon: <Activity className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
  ]

  const dailyTotals: DayTotal[] = [
    { day: "Monday", date: "", calories: 1950, protein: 85, carbs: 180, fats: 65, completed: true },
    { day: "Tuesday", date: "", calories: 2100, protein: 92, carbs: 195, fats: 70, completed: true },
    { day: "Wednesday", date: "", calories: 1850, protein: 78, carbs: 165, fats: 58, completed: true },
    { day: "Thursday", date: "", calories: 2050, protein: 88, carbs: 185, fats: 68, completed: true },
    { day: "Friday", date: "", calories: 1900, protein: 82, carbs: 175, fats: 62, completed: true },
    { day: "Saturday", date: "", calories: 0, protein: 0, carbs: 0, fats: 0, completed: false },
    { day: "Sunday", date: "", calories: 0, protein: 0, carbs: 0, fats: 0, completed: false },
  ]

  const completedDays = dailyTotals.filter((day) => day.completed).length
  const weekProgress = (completedDays / 7) * 100

  const updateMealItem = (mealType: string, index: number, field: string, value: number | string) => {
    setMealItems((prev) => ({
      ...prev,
      [mealType]: prev[mealType as keyof typeof prev].map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const deleteMealItem = (mealType: string, index: number) => {
    setMealItems((prev) => ({
      ...prev,
      [mealType]: prev[mealType as keyof typeof prev].filter((_, i) => i !== index),
    }))
  }

  const addMealItem = (mealType: string) => {
    if (newItem.name.trim()) {
      setMealItems((prev) => ({
        ...prev,
        [mealType]: [...prev[mealType as keyof typeof prev], { ...newItem }],
      }))
      setNewItem({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0 })
      setNewItemDialog(null)
    }
  }

  const MacroChart = ({ protein, carbs, fats }: { protein: number; carbs: number; fats: number }) => {
    const total = protein + carbs + fats
    if (total === 0) return null

    const proteinPercent = (protein / total) * 100
    const carbsPercent = (carbs / total) * 100
    const fatsPercent = (fats / total) * 100

    return (
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
        <div className="bg-green-400" style={{ width: `${proteinPercent}%` }} title={`Protein: ${protein}g`} />
        <div className="bg-blue-400" style={{ width: `${carbsPercent}%` }} title={`Carbs: ${carbs}g`} />
        <div className="bg-yellow-400" style={{ width: `${fatsPercent}%` }} title={`Fats: ${fats}g`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Weekly Nutrition Plan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Week of December 18-24, 2023</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Plan
        </Button>
      </div>

      {/* Weekly Targets */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl text-emerald-600">Weekly Targets</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedDays}/7 days completed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {weeklyTargets.map((target) => (
              <div key={target.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                    {target.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{target.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{target.current.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / {target.target.toLocaleString()}
                    {target.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((target.current / target.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  {Math.round((target.current / target.target) * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Week Progress</span>
              <span className="text-sm text-emerald-600 font-medium">{Math.round(weekProgress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Daily Totals */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-lg font-semibold text-emerald-600 mb-4">Daily Totals</h3>
          {dailyTotals.map((day, index) => (
            <Card
              key={day.day}
              className={`bg-white/80 backdrop-blur-sm border shadow-lg cursor-pointer transition-all duration-200 dark:bg-black ${
                selectedDay === day.day.toLowerCase() ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setSelectedDay(day.day.toLowerCase())}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{day.day}</div>
                  <div className={`w-3 h-3 rounded-full ${day.completed ? "bg-emerald-400" : "bg-gray-400"}`} />
                </div>
                {day.completed ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">{day.calories}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">calories</div>
                    </div>
                    <MacroChart protein={day.protein} carbs={day.carbs} fats={day.fats} />
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center">
                        <div className="text-green-500 font-medium">{day.protein}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-500 font-medium">{day.carbs}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-500 font-medium">{day.fats}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Fats</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Not planned yet</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column - Meal Columns */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Breakfast */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Breakfast</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.breakfast.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingItem === `breakfast-${index}` ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateMealItem("breakfast", index, "name", e.target.value)}
                        className="text-sm font-medium h-6 p-1"
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
                        onClick={() => setEditingItem(`breakfast-${index}`)}
                      >
                        {item.name}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                        onClick={() => setEditingItem(`breakfast-${index}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMealItem("breakfast", index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer hover:text-emerald-600">
                        {item.calories} cal
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="cursor-pointer hover:text-green-500">
                        P: {item.protein}g
                      </span>
                      <span className="cursor-pointer hover:text-blue-500">
                        C: {item.carbs}g
                      </span>
                      <span className="cursor-pointer hover:text-yellow-500">
                        F: {item.fats}g
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600"
                onClick={() => setNewItemDialog("breakfast")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Similar structure for Lunch, Snack, and Dinner - abbreviated for brevity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Lunch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.lunch.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Snack</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.snack.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Dinner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.dinner.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const ProgramsSection = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")
  const [sortBy, setSortBy] = useState("Recently updated")
  const [programs, setPrograms] = useState(mockPrograms)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [programData, setProgramData] = useState<ProgramData>({
    title: "New Program",
    tag: "",
    description: "",
    difficulty: "Medium",
    startDay: "Monday",
    assignedColor: "#39FF14",
    assignedClient: "",
    isEditable: true,
    tasks: {},
    viewMode: "day"
>>>>>>> Stashed changes
  })
  const [newItem, setNewItem] = useState({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0 })

  interface WeeklyTarget {
    name: string
    current: number
    target: number
    unit: string
    icon: React.ReactNode
    color: string
  }

  interface DayTotal {
    day: string
    date: string
    calories: number
    protein: number
    carbs: number
    fats: number
    completed: boolean
  }

  interface MealItem {
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
  }

  const weeklyTargets: WeeklyTarget[] = [
    {
      name: "Calories",
      current: 9850,
      target: 14000,
      unit: "kcal",
      icon: <Target className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Protein",
      current: 420,
      target: 840,
      unit: "g",
      icon: <Dumbbell className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Carbs",
      current: 680,
      target: 1260,
      unit: "g",
      icon: <Utensils className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Fats",
      current: 245,
      target: 490,
      unit: "g",
      icon: <Heart className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
    {
      name: "Vitamins",
      current: 65,
      target: 100,
      unit: "%",
      icon: <Activity className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
    },
  ]

  const dailyTotals: DayTotal[] = [
    { day: "Monday", date: "", calories: 1950, protein: 85, carbs: 180, fats: 65, completed: true },
    { day: "Tuesday", date: "", calories: 2100, protein: 92, carbs: 195, fats: 70, completed: true },
    { day: "Wednesday", date: "", calories: 1850, protein: 78, carbs: 165, fats: 58, completed: true },
    { day: "Thursday", date: "", calories: 2050, protein: 88, carbs: 185, fats: 68, completed: true },
    { day: "Friday", date: "", calories: 1900, protein: 82, carbs: 175, fats: 62, completed: true },
    { day: "Saturday", date: "", calories: 0, protein: 0, carbs: 0, fats: 0, completed: false },
    { day: "Sunday", date: "", calories: 0, protein: 0, carbs: 0, fats: 0, completed: false },
  ]

  const completedDays = dailyTotals.filter((day) => day.completed).length
  const weekProgress = (completedDays / 7) * 100

  const updateMealItem = (mealType: string, index: number, field: string, value: number | string) => {
    setMealItems((prev) => ({
      ...prev,
      [mealType]: prev[mealType as keyof typeof prev].map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const deleteMealItem = (mealType: string, index: number) => {
    setMealItems((prev) => ({
      ...prev,
      [mealType]: prev[mealType as keyof typeof prev].filter((_, i) => i !== index),
    }))
  }

  const addMealItem = (mealType: string) => {
    if (newItem.name.trim()) {
      setMealItems((prev) => ({
        ...prev,
        [mealType]: [...prev[mealType as keyof typeof prev], { ...newItem }],
      }))
      setNewItem({ name: "", calories: 0, protein: 0, carbs: 0, fats: 0 })
      setNewItemDialog(null)
    }
  }

  const MacroChart = ({ protein, carbs, fats }: { protein: number; carbs: number; fats: number }) => {
    const total = protein + carbs + fats
    if (total === 0) return null

    const proteinPercent = (protein / total) * 100
    const carbsPercent = (carbs / total) * 100
    const fatsPercent = (fats / total) * 100

    return (
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
        <div className="bg-green-400" style={{ width: `${proteinPercent}%` }} title={`Protein: ${protein}g`} />
        <div className="bg-blue-400" style={{ width: `${carbsPercent}%` }} title={`Carbs: ${carbs}g`} />
        <div className="bg-yellow-400" style={{ width: `${fatsPercent}%` }} title={`Fats: ${fats}g`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Weekly Nutrition Plan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Week of December 18-24, 2023</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Plan
        </Button>
      </div>

      {/* Weekly Targets */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl text-emerald-600">Weekly Targets</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{completedDays}/7 days completed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {weeklyTargets.map((target) => (
              <div key={target.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                    {target.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{target.name}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{target.current.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / {target.target.toLocaleString()}
                    {target.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((target.current / target.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  {Math.round((target.current / target.target) * 100)}%
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Week Progress</span>
              <span className="text-sm text-emerald-600 font-medium">{Math.round(weekProgress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Daily Totals */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-lg font-semibold text-emerald-600 mb-4">Daily Totals</h3>
          {dailyTotals.map((day, index) => (
            <Card
              key={day.day}
              className={`bg-white/80 backdrop-blur-sm border shadow-lg cursor-pointer transition-all duration-200 dark:bg-black ${
                selectedDay === day.day.toLowerCase() ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
              onClick={() => setSelectedDay(day.day.toLowerCase())}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">{day.day}</div>
                  <div className={`w-3 h-3 rounded-full ${day.completed ? "bg-emerald-400" : "bg-gray-400"}`} />
                </div>
                {day.completed ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">{day.calories}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">calories</div>
                    </div>
                    <MacroChart protein={day.protein} carbs={day.carbs} fats={day.fats} />
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center">
                        <div className="text-green-500 font-medium">{day.protein}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Protein</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-500 font-medium">{day.carbs}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Carbs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-500 font-medium">{day.fats}g</div>
                        <div className="text-gray-500 dark:text-gray-400">Fats</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Not planned yet</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column - Meal Columns */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Breakfast */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Breakfast</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.breakfast.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingItem === `breakfast-${index}` ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateMealItem("breakfast", index, "name", e.target.value)}
                        className="text-sm font-medium h-6 p-1"
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
                        onClick={() => setEditingItem(`breakfast-${index}`)}
                      >
                        {item.name}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                        onClick={() => setEditingItem(`breakfast-${index}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMealItem("breakfast", index)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="cursor-pointer hover:text-emerald-600">
                        {item.calories} cal
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="cursor-pointer hover:text-green-500">
                        P: {item.protein}g
                      </span>
                      <span className="cursor-pointer hover:text-blue-500">
                        C: {item.carbs}g
                      </span>
                      <span className="cursor-pointer hover:text-yellow-500">
                        F: {item.fats}g
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600"
                onClick={() => setNewItemDialog("breakfast")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Similar structure for Lunch, Snack, and Dinner - abbreviated for brevity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Lunch</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.lunch.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Snack</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.snack.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-gray-900 dark:text-white">Dinner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealItems.dinner.map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.calories} cal</div>
                    <div className="flex gap-3">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Calculate age from DOB
const getAge = (dob: string) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function ClientDashboard() {
  const [client, setClient] = useState(sampleClient)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("1")
  const [activeTab, setActiveTab] = useState("metrics")
  const [showProfileCard, setShowProfileCard] = useState(false)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null)
  const navigate = useNavigate()

  const filteredClients = sampleClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    // In real app, fetch client data here
  }

  const handleSmartAlertsClick = () => {
    navigate("/dashboard")
  }

  if (loading) {
=======
  const [activeTab, setActiveTab] = useState("metrics");
  const [showProfileCard, setShowProfileCard] = useState(false);

  if (isLoading) {
>>>>>>> Stashed changes
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Client</h3>
          <p className="text-red-600 mb-6">{error.message}</p>
          <Button onClick={() => navigate('/clients')} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Not Found</h3>
          <p className="text-gray-600 mb-6">The requested client profile could not be found.</p>
          <Button onClick={() => navigate('/clients')} className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8">
        {/* Gradient Top Bar with profile icon dropdown */}
        <div className="w-full flex items-center gap-6 px-8 h-24 rounded-xl mb-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg">
          <span className="text-2xl font-bold text-white flex-1">{client.cl_name}</span>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-white/80 text-base">
              <MapPin className="h-4 w-4" />
              {client.cl_address}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-base">
              <Calendar className="h-4 w-4" />
              Age: {getAge(client.cl_dob)}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-base">
              <Weight className="h-4 w-4" />
              {client.cl_weight} kg
            </span>
            <Popover open={showProfileCard} onOpenChange={setShowProfileCard}>
              <PopoverTrigger asChild>
                <button className="ml-4 focus:outline-none">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarImage src="/placeholder.svg" alt={client.cl_name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                      {client.cl_name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 border-0 bg-transparent shadow-none">
                <Card className="w-[350px] bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden dark:bg-black">
                  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-24 relative flex items-center px-6">
                    <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                      <AvatarImage src="/placeholder.svg" alt={client.cl_name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                        {client.cl_name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <h1 className="text-2xl font-bold text-white mb-1">{client.cl_name}</h1>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">{client.cl_membership_type}</Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4 pb-6">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Born {new Date(client.cl_dob).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_height} cm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_weight} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.cl_address}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      Member since {new Date(client.cl_join_date).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Main Content */}
          <div className="flex-1 space-y-6">
            {/* Client Stats */}
            <ClientStats />

            {/* Editable Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableSection
                title="Goals & Limitations"
                icon={Target}
                initialContent={client.cl_goals || "No goals set yet."}
                storageKey={`client-goals-${client.client_id}`}
              />
              <EditableSection
                title="Trainer Notes"
                icon={Edit}
                initialContent={client.cl_notes || "No notes available."}
                storageKey={`client-notes-${client.client_id}`}
              />
            </div>

            {/* Tabbed Content */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="metrics" className="flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      <span>Metrics</span>
                    </TabsTrigger>
                    <TabsTrigger value="workout" className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span>Workout Plan</span>
                    </TabsTrigger>
                    <TabsTrigger value="nutrition" className="flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      <span>Nutrition Plan</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="metrics">
                    <MetricsSection />
                  </TabsContent>
                  <TabsContent value="workout">
                    <WorkoutPlanSection />
                  </TabsContent>
                  <TabsContent value="nutrition">
                    <NutritionPlanSection />
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
