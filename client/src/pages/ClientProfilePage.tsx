import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
import { supabase } from "@/lib/supabase"

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

interface WorkoutPlan {
  id: string
  name: string
  duration: string
  type: string
  difficulty: string
  color: string
  exercises: Exercise[]
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
    description: "A comprehensive strength training program designed to build muscle and improve overall fitness through progressive overload techniques.",
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
    description: "High-intensity interval training program that maximizes calorie burn and improves cardiovascular endurance in minimal time.",
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
    description: "Gentle yoga sequences perfect for beginners looking to improve flexibility, balance, and mindfulness.",
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
  Easy: "#39FF14",
  Medium: "#FFD93D",
  Hard: "#FF6B35",
}

const programTags = ["All", "Strength", "Cardio", "Flexibility", "Recovery", "Performance"]
const sortOptions = ["Recently updated", "Alphabetically", "Difficulty"]

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
    data: [
      { date: 'Jan', weight: 82.5 },
      { date: 'Feb', weight: 81.8 },
      { date: 'Mar', weight: 80.5 },
      { date: 'Apr', weight: 79.2 },
      { date: 'May', weight: 78.4 },
      { date: 'Jun', weight: 77.6 },
      { date: 'Jul', weight: 76.8 },
      { date: 'Aug', weight: 76.2 },
      { date: 'Sep', weight: 75.8 },
      { date: 'Oct', weight: 75.2 },
      { date: 'Nov', weight: 74.8 },
      { date: 'Dec', weight: 74.4 }
    ],
    dataKey: 'weight',
    yLabel: 'kg',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    icon: Clock,
    type: 'bar',
    color: '#14b8a6',
    data: [
      { date: 'Jan', hours: 5.8 },
      { date: 'Feb', hours: 6.2 },
      { date: 'Mar', hours: 6.5 },
      { date: 'Apr', hours: 6.8 },
      { date: 'May', hours: 7.0 },
      { date: 'Jun', hours: 7.2 },
      { date: 'Jul', hours: 7.0 },
      { date: 'Aug', hours: 7.2 },
      { date: 'Sep', hours: 7.4 },
      { date: 'Oct', hours: 7.2 },
      { date: 'Nov', hours: 7.0 },
      { date: 'Dec', hours: 7.2 }
    ],
    dataKey: 'hours',
    yLabel: 'h',
  },
  {
    key: 'heartRate',
    label: 'Resting Heart Rate',
    icon: Heart,
    type: 'line',
    color: '#e11d48',
    data: [
      { date: 'Jan', rate: 78 },
      { date: 'Feb', rate: 76 },
      { date: 'Mar', rate: 74 },
      { date: 'Apr', rate: 72 },
      { date: 'May', rate: 70 },
      { date: 'Jun', rate: 68 },
      { date: 'Jul', rate: 66 },
      { date: 'Aug', rate: 64 },
      { date: 'Sep', rate: 63 },
      { date: 'Oct', rate: 62 },
      { date: 'Nov', rate: 61 },
      { date: 'Dec', rate: 60 }
    ],
    dataKey: 'rate',
    yLabel: 'bpm',
  },
  {
    key: 'steps',
    label: 'Steps',
    icon: Footprints,
    type: 'bar',
    color: '#d97706',
    data: [
      { date: 'Jan', steps: 6500 },
      { date: 'Feb', steps: 7200 },
      { date: 'Mar', steps: 7800 },
      { date: 'Apr', steps: 8200 },
      { date: 'May', steps: 8800 },
      { date: 'Jun', steps: 9200 },
      { date: 'Jul', steps: 9000 },
      { date: 'Aug', steps: 9400 },
      { date: 'Sep', steps: 9600 },
      { date: 'Oct', steps: 9800 },
      { date: 'Nov', steps: 9500 },
      { date: 'Dec', steps: 10000 }
    ],
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
      { date: 'Jan', value: 65 },
      { date: 'Feb', value: 70 },
      { date: 'Mar', value: 75 },
      { date: 'Apr', value: 78 },
      { date: 'May', value: 82 },
      { date: 'Jun', value: 85 },
      { date: 'Jul', value: 88 },
      { date: 'Aug', value: 90 },
      { date: 'Sep', value: 92 },
      { date: 'Oct', value: 94 },
      { date: 'Nov', value: 93 },
      { date: 'Dec', value: 95 }
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
      { date: 'Jan', value: 800 },
      { date: 'Feb', value: 950 },
      { date: 'Mar', value: 1100 },
      { date: 'Apr', value: 1250 },
      { date: 'May', value: 1400 },
      { date: 'Jun', value: 1550 },
      { date: 'Jul', value: 1700 },
      { date: 'Aug', value: 1850 },
      { date: 'Sep', value: 2000 },
      { date: 'Oct', value: 2150 },
      { date: 'Nov', value: 2300 },
      { date: 'Dec', value: 2450 }
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
      { date: 'Jan', value: 65 },
      { date: 'Feb', value: 68 },
      { date: 'Mar', value: 71 },
      { date: 'Apr', value: 73 },
      { date: 'May', value: 75 },
      { date: 'Jun', value: 77 },
      { date: 'Jul', value: 79 },
      { date: 'Aug', value: 81 },
      { date: 'Sep', value: 82 },
      { date: 'Oct', value: 83 },
      { date: 'Nov', value: 84 },
      { date: 'Dec', value: 85 }
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
      { date: 'Jan', value: 45 },
      { date: 'Feb', value: 50 },
      { date: 'Mar', value: 55 },
      { date: 'Apr', value: 58 },
      { date: 'May', value: 62 },
      { date: 'Jun', value: 65 },
      { date: 'Jul', value: 68 },
      { date: 'Aug', value: 70 },
      { date: 'Sep', value: 72 },
      { date: 'Oct', value: 74 },
      { date: 'Nov', value: 76 },
      { date: 'Dec', value: 78 }
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
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 p-2 bg-slate-100 rounded mb-2">
      <metric.icon className="h-4 w-4" />
      <span>{metric.label}</span>
    </div>
  );
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
        { month: "Dec", value: 47 }
      ]
    },
    { label: "Goals Achieved", value: "3", icon: Target, color: "text-blue-600" },
    { 
      label: "Engagement Score", 
      value: "85%", 
      icon: TrendingUp, 
      color: "text-purple-600", 
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
        { month: "Dec", value: 85 }
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
    setCompletedItems(prev => {
      const newCompleted = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
      localStorage.setItem(`${storageKey}-completed`, JSON.stringify(newCompleted))
      return newCompleted
    })
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
                  <div key={i} className="flex items-center justify-between group">
                    <p 
                      className={`text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 ${
                        completedItems.includes(i) ? 'line-through text-gray-400 dark:text-gray-600' : ''
                      }`}
                    >
                      {sentence.trim()}
                    </p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="ml-2 w-5 h-5 rounded border-gray-300 text-rose-500 focus:ring-rose-500 transition-all duration-200" 
                        checked={completedItems.includes(i)}
                        onChange={() => handleToggleComplete(i)}
                        aria-label={`Mark ${sentence.trim()} as ${completedItems.includes(i) ? 'incomplete' : 'complete'}`}
                      />
                    </div>
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
  );
};

const WorkoutPlanSection = () => {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, WorkoutPlan>>({})
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExercise, setNewExercise] = useState<Omit<Exercise, "id" | "createdAt">>({
    name: "",
    instructions: "",
    sets: "",
    reps: "",
    duration: "",
    equipment: "",
    difficulty: "Beginner",
  })

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

  // Recommended workout plans
  const recommendedPlans = [
    {
      id: "upper-body",
      name: "Upper Body Strength",
      type: "Upper Body",
      duration: "45 mins",
      difficulty: "Intermediate",
      color: "bg-blue-500",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10", equipment: "Barbell" },
        { name: "Pull-ups", sets: 3, reps: "8-12", equipment: "Pull-up Bar" },
        { name: "Shoulder Press", sets: 3, reps: "10-12", equipment: "Dumbbells" },
        { name: "Bent-over Rows", sets: 3, reps: "10-12", equipment: "Barbell" },
        { name: "Bicep Curls", sets: 3, reps: "12-15", equipment: "Dumbbells" },
        { name: "Tricep Dips", sets: 3, reps: "10-15", equipment: "Bench" },
      ],
    },
    {
      id: "lower-body",
      name: "Lower Body Power",
      type: "Lower Body",
      duration: "50 mins",
      difficulty: "Intermediate",
      color: "bg-green-500",
      exercises: [
        { name: "Squats", sets: 4, reps: "8-12", equipment: "Barbell" },
        { name: "Deadlifts", sets: 3, reps: "6-8", equipment: "Barbell" },
        { name: "Lunges", sets: 3, reps: "10 each leg", equipment: "Dumbbells" },
        { name: "Leg Press", sets: 3, reps: "12-15", equipment: "Leg Press Machine" },
        { name: "Calf Raises", sets: 4, reps: "15-20", equipment: "Dumbbells" },
        { name: "Glute Bridges", sets: 3, reps: "15-20", equipment: "Bodyweight" },
      ],
    },
    {
      id: "cardio-hiit",
      name: "HIIT Cardio Blast",
      type: "Cardio",
      duration: "30 mins",
      difficulty: "Advanced",
      color: "bg-red-500",
      exercises: [
        { name: "Burpees", sets: 4, reps: "30 seconds", equipment: "Bodyweight" },
        { name: "Mountain Climbers", sets: 4, reps: "30 seconds", equipment: "Bodyweight" },
        { name: "Jump Squats", sets: 4, reps: "30 seconds", equipment: "Bodyweight" },
        { name: "High Knees", sets: 4, reps: "30 seconds", equipment: "Bodyweight" },
        { name: "Plank Jacks", sets: 4, reps: "30 seconds", equipment: "Bodyweight" },
        { name: "Sprint Intervals", sets: 6, reps: "20 seconds", equipment: "Treadmill" },
      ],
    },
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
    e.dataTransfer.setData("application/json", JSON.stringify(plan))
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

  return (
    <div className="flex gap-6 h-full">
      {/* Left Side - Weekly Calendar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Weekly Workout Schedule</h3>
          <Button
            onClick={() => setShowAddExercise(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Exercise
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
          {daysOfWeek.map((day) => (
            <Card
              key={day}
              className="bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors min-h-[200px] dark:bg-black dark:border-gray-700"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-center">{day}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {weeklyPlan[day] ? (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg text-white ${weeklyPlan[day].color}`}>
                      <div className="font-medium text-sm">{weeklyPlan[day].name}</div>
                      <div className="text-xs opacity-90">{weeklyPlan[day].duration}</div>
                    </div>
                    <div className="space-y-1">
                      {weeklyPlan[day].exercises.slice(0, 2).map((exercise, i) => (
                        <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                          • {exercise.name}
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
                      <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Drop workout here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Exercises Section */}
        {customExercises.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Custom Exercises</h3>
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
      </div>

      {/* Right Side - Recommended Plans Sidebar */}
      <div className="w-80 flex flex-col">
        <div className="sticky top-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recommended Plans</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {recommendedPlans.map((plan) => (
              <Card
                key={plan.id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-move dark:bg-black"
                draggable
                onDragStart={(e) => handleDragStart(e, plan)}
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
                      {plan.duration}
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
                        <span className="font-medium text-gray-700 dark:text-gray-300">{exercise.name}</span>
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
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Drag to calendar to schedule
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

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
                  aria-label="Select exercise difficulty level"
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
    </div>
  )
}

const NutritionPlanSection = () => {
  return (
    <div className="space-y-6">
      {nutritionPlan.map((meal, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-emerald-600" />
              {meal.meal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                <div className="col-span-2">Food</div>
                <div>Portion</div>
                <div>Calories</div>
                <div>Protein</div>
                <div>Carbs</div>
              </div>
              <Separator />
              {meal.foods.map((food, i) => (
                <div key={i} className="grid grid-cols-6 text-sm">
                  <div className="col-span-2 font-medium">{food.name}</div>
                  <div>{food.portion}</div>
                  <div>{food.calories}</div>
                  <div>{food.protein}g</div>
                  <div>{food.carbs}g</div>
                </div>
              ))}
              <div className="pt-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  Total Calories: {meal.foods.reduce((sum, food) => sum + food.calories, 0)}
                </Badge>
                <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                  Protein: {meal.foods.reduce((sum, food) => sum + food.protein, 0)}g
                </Badge>
                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700">
                  Carbs: {meal.foods.reduce((sum, food) => sum + food.carbs, 0)}g
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
  })
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.tag.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = selectedTag === "All" || program.tag === selectedTag
    return matchesSearch && matchesTag
  })

  const sortedPrograms = [...filteredPrograms].sort((a, b) => {
    switch (sortBy) {
      case "Alphabetically":
        return a.title.localeCompare(b.title)
      case "Difficulty":
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
      default:
        return new Date(b.created).getTime() - new Date(a.created).getTime()
    }
  })

  const updateProgramData = (updates: Partial<ProgramData>) => {
    setProgramData((prev) => ({ ...prev, ...updates }))
  }

  const addTask = (day: number, task: Task) => {
    setProgramData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [day]: [...(prev.tasks[day] || []), task],
      },
    }))
  }

  const removeTask = (day: number, taskId: string) => {
    setProgramData((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [day]: (prev.tasks[day] || []).filter((task) => task.id !== taskId),
      },
    }))
  }

  const openAddTaskDropdown = (day: number) => {
    setSelectedDay(day)
    setDropdownOpen(true)
  }

  const handleSaveProgram = async () => {
    setIsSaving(true)
    try {
      // Create new program from programData
      const newProgram = {
        id: Math.max(...programs.map((p) => p.id)) + 1,
        title: programData.title,
        tag: programData.tag,
        difficulty: programData.difficulty,
        startDay: programData.startDay,
        color: programData.assignedColor,
        lastEdited: "Just now",
        description: programData.description,
        created: new Date().toISOString().split("T")[0],
      }
      setPrograms([...programs, newProgram])
      setIsCreating(false)
      
      // Reset program data
      setProgramData({
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
      })
    } catch (error) {
      console.error("Error saving program:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = (programId: number) => {
    const programToDuplicate = programs.find((p) => p.id === programId)
    if (programToDuplicate) {
      const newProgram = {
        ...programToDuplicate,
        id: Math.max(...programs.map((p) => p.id)) + 1,
        title: `${programToDuplicate.title} (Copy)`,
        lastEdited: "Just now",
        created: new Date().toISOString().split("T")[0],
      }
      setPrograms([...programs, newProgram])
    }
  }

  const handleDelete = (programId: number) => {
    setPrograms(programs.filter((p) => p.id !== programId))
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-lg p-6 dark:bg-slate-800">
          <HeaderBar programData={programData} updateProgramData={updateProgramData} />

          <div className="mt-8">
            <DescriptionInput
              description={programData.description}
              onChange={(description) => updateProgramData({ description })}
            />
          </div>

          <div className="mt-8">
            <ViewTabs viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          <div className="mt-8">
            <ProgramCardsContainer
              viewMode={viewMode}
              tasks={programData.tasks}
              onAddTask={openAddTaskDropdown}
              onRemoveTask={removeTask}
              startDay={programData.startDay}
            />
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <SaveButton onSave={handleSaveProgram} disabled={isSaving} />
          </div>

          <AddTaskDropdown
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            onAddTask={(task) => {
              if (selectedDay !== null) {
                addTask(selectedDay, task)
              }
              setDropdownOpen(false)
            }}
            selectedDay={selectedDay}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-40">
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
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Program
        </Button>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPrograms.map((program) => (
          <Card key={program.id} className="group hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: program.color }}
                    />
                    <Badge variant="secondary" className="text-xs">
                      {program.tag}
                    </Badge>
                    <Badge
                      variant="outline"
                      style={{ 
                        backgroundColor: difficultyColors[program.difficulty as keyof typeof difficultyColors] + '20',
                        borderColor: difficultyColors[program.difficulty as keyof typeof difficultyColors],
                        color: difficultyColors[program.difficulty as keyof typeof difficultyColors]
                      }}
                      className="text-xs"
                    >
                      {program.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold mb-1">{program.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Starts {program.startDay} • {program.lastEdited}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(program.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Program</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{program.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(program.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {program.description}
              </p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {new Date(program.created).toLocaleDateString()}
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedPrograms.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || selectedTag !== "All" 
              ? "No programs match your search criteria" 
              : "No programs created yet"}
          </p>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Program
          </Button>
        </div>
      )}
    </div>
  )
}

// Calculate age from DOB
const getAge = (dob: string) => {
  if (!dob) return "N/A"
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
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("metrics")
  const [showProfileCard, setShowProfileCard] = useState(false)
  const [notes, setNotes] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editableNotes, setEditableNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showClientFilter, setShowClientFilter] = useState(false)
  const [activeClientFilter, setActiveClientFilter] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (notes) {
      setEditableNotes(notes)
    }
  }, [notes])

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      const authUserEmail = session?.user?.email
      if (!authUserEmail) {
        console.log("[DEBUG] No auth user email found")
        return
      }
      const { data: trainerRows, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", authUserEmail)
        .limit(1)
      if (trainerError) throw trainerError
      if (!trainerRows || trainerRows.length === 0) {
        console.log("[DEBUG] No trainer found for email:", authUserEmail)
        return
      }
      const trainerId = trainerRows[0].id
      console.log("[DEBUG] Saving notes for trainer:", trainerId)
      const { error: updateError } = await supabase
        .from("trainer")
        .update({ trainer_notes: editableNotes })
        .eq("id", trainerId)
      if (updateError) throw updateError
      setNotes(editableNotes)
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving trainer notes:", err)
    } finally {
      setIsSaving(false)
    }
  }
  const filteredClients = sampleClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleClientSelect = (clientId: string) => {
    navigate(`/client/${clientId}`)
  }

  const handleSmartAlertsClick = () => {
    navigate("/dashboard")
  }
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        const authUserEmail = session?.user?.email;
        if (!authUserEmail) {
          console.log("[DEBUG] No auth user email found");
          return;
        }
        const { data: trainerRows, error: trainerError } = await supabase
          .from("trainer")
          .select("id")
          .eq("trainer_email", authUserEmail)
          .limit(1);

        if (trainerError) throw trainerError;
        if (!trainerRows || trainerRows.length === 0) {
          console.log("[DEBUG] No trainer found for email:", authUserEmail);
          return;
        }

        const trainerId = trainerRows[0].id;
        console.log("[DEBUG] Trainer ID:", trainerId);
        const { data, error } = await supabase
          .from("trainer")
          .select("trainer_notes")
          .eq("id", trainerId)
          .single();

        if (error) throw error;
        setNotes(data.trainer_notes);
      } catch (err) {
        console.error("Error fetching trainer notes:", err);
      }
    };
    fetchNotes();
  }, []);
  useEffect(() => {
    if (!id) {
      setError("No client ID provided in URL.")
      setClient(null)
      return
    }
    async function fetchClient() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from("client")
          .select("*")
          .eq("client_id", id)
          .single()
        if (error) throw error
        setClient({
          id: data.client_id,
          trainerId: data.trainer_id,
          name: data.cl_name,
          preferredName: data.cl_prefer_name,
          email: data.cl_email,
          avatarUrl: data.cl_pic || "/placeholder.svg?height=120&width=120",
          phone: data.cl_phone,
          username: data.cl_username,
          height: data.cl_height,
          weight: data.cl_weight,
          age: data.cl_age,
          sex: data.cl_sex,
          dob: data.cl_dob,
          primaryGoal: data.cl_primary_goal,
          targetWeight: data.cl_target_weight,
          activityLevel: data.cl_activity_level,
          specificOutcome: data.specific_outcome,
          goalTimeline: data.goal_timeline,
          obstacles: data.obstacles,
          confidenceLevel: data.confidence_level,
          trainingExperience: data.training_experience,
          previousTraining: data.previous_training,
          trainingDaysPerWeek: data.training_days_per_week,
          trainingTimePerSession: data.training_time_per_session,
          trainingLocation: data.training_location,
          availableEquipment: data.available_equipment || [],
          injuriesLimitations: data.injuries_limitations,
          focusAreas: data.focus_areas || [],
          eatingHabits: data.eating_habits,
          dietPreferences: data.diet_preferences || [],
          foodAllergies: data.food_allergies,
          preferredMealsPerDay: data.preferred_meals_per_day,
          sleepHours: data.sleep_hours,
          stress: data.cl_stress,
          alcohol: data.cl_alcohol,
          supplements: data.cl_supplements,
          gastricIssues: data.cl_gastric_issues,
          motivationStyle: data.motivation_style,
          wakeTime: data.wake_time,
          bedTime: data.bed_time,
          workoutTime: data.workout_time,
          workoutDays: data.workout_days,
          mealtimes: {
            breakfast: data.bf_time,
            lunch: data.lunch_time,
            dinner: data.dinner_time,
            snack: data.snack_time
          },
          onboardingCompleted: data.onboarding_completed || false,
          onboardingProgress: data.onboarding_progress,
          lastLogin: data.last_login,
          lastLogout: data.last_logout,
          lastActive: data.last_active,
          lastCheckIn: data.last_checkIn,
          streaks: {
            current: data.current_streak || 0,
            longest: data.longest_streak || 0
          },
          isActive: data.active_session || false,
          createdAt: data.created_at
        })
      } catch (err: any) {
        setError(err.message || "Failed to fetch client")
        setClient(null)
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading client profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Client</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">No client data found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Main Content */}
      <main className="flex flex-col p-8">
        {/* Gradient Top Bar with profile icon dropdown */}
        <div className="w-full flex items-center gap-6 px-8 h-24 rounded-xl mb-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-lg">
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-sm font-semibold text-white/80 hover:text-white transition-colors duration-200 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20">
                ALL CLIENTS
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-80 bg-white text-slate-900 rounded-lg shadow-xl border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-slate-700 mb-3">All Clients</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {filteredClients
                  .filter(c => {
                    if (activeClientFilter === 'low-engagement') {
                      return c.name.toLowerCase().includes('low engagement')
                    }
                    if (activeClientFilter === 'low-outcome') {
                      return c.name.toLowerCase().includes('low outcome')
                    }
                    return true;
                  })
                  .map((c) => (
                  <button
                    key={c.client_id}
                    onClick={() => handleClientSelect(c.client_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      c.client_id === id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatarUrl || "/placeholder.svg"} alt={c.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-xs">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium truncate text-sm">{c.name}</div>
                      {c.email && <div className="text-xs text-gray-500 truncate">{c.email}</div>}
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-2xl font-bold text-white flex-1">{client.name}</span>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-white/80 text-base">
              <MapPin className="h-4 w-4" />
              {client.trainingLocation || "Location not set"}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-base">
              <Calendar className="h-4 w-4" />
              Age: {client.age || getAge(client.dob)}
            </span>
            <span className="flex items-center gap-1 text-white/80 text-base">
              <Weight className="h-4 w-4" />
              {client.weight || "N/A"} kg
            </span>
            <Popover open={showProfileCard} onOpenChange={setShowProfileCard}>
              <PopoverTrigger asChild>
                <button className="ml-4 focus:outline-none">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarImage src={client.avatarUrl || "/placeholder.svg"} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                      {client.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 border-0 bg-transparent shadow-none">
                <Card className="w-[350px] bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden dark:bg-black">
                  <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-24 relative flex items-center px-6">
                    <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                      <AvatarImage src={client.avatarUrl || "/placeholder.svg"} alt={client.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                        {client.name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <h1 className="text-2xl font-bold text-white mb-1">{client.name}</h1>
                      {client.username && <p className="text-white/80 mb-1">@{client.username}</p>}
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        {client.onboardingCompleted ? "Active Client" : "Onboarding"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="pt-4 pb-6">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.phone || "No phone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Born {client.dob ? new Date(client.dob).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.height || "N/A"} cm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.weight || "N/A"} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.trainingLocation || "No location"}</span>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      Member since {new Date(client.createdAt).toLocaleDateString()}
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-rose-500" />
                      Goals & Limitations
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.primaryGoal && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Primary Goal</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.primaryGoal}</p>
                      </div>
                    )}
                    {client.specificOutcome && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Specific Outcome</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.specificOutcome}</p>
                      </div>
                    )}
                    {client.goalTimeline && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Timeline</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.goalTimeline}</p>
                      </div>
                    )}
                    {client.obstacles && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Potential Obstacles</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.obstacles}</p>
                      </div>
                    )}
                    {client.injuriesLimitations && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Injuries & Limitations</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.injuriesLimitations}</p>
                      </div>
                    )}
                    {client.focusAreas && client.focusAreas.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Focus Areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {client.focusAreas.map((area: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {client.confidenceLevel && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confidence Level</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className="bg-rose-500 h-2.5 rounded-full" 
                            style={{ width: `${client.confidenceLevel}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 text-right">{client.confidenceLevel}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5 text-rose-500" />
                      Trainer Notes
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isEditing ? handleSaveNotes : () => setIsEditing(true)}
                      className="h-8 px-2"
                      disabled={isEditing && isSaving}
                    >
                      {isEditing ? (
                        isSaving ? (
                          <>
                            <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )
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
                      value={editableNotes}
                      onChange={(e) => setEditableNotes(e.target.value)}
                      className="min-h-[200px] focus:border-rose-300 focus:ring-rose-200/50"
                      placeholder="Add your notes about the client here..."
                    />
                  ) : (
                    <div className="space-y-2">
                      {notes ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {notes}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No notes added yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabbed Content */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-0">
                <Tabs defaultValue="metrics" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-4">
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
                    <TabsTrigger value="programs" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Programs</span>
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
                  <TabsContent value="programs">
                    <ProgramsSection />
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
