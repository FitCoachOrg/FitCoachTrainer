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

interface EditableSectionProps {
  title: string
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

const ClientStats = () => {
  const stats = [
    { label: "Workouts Completed", value: "47", icon: Activity, color: "text-green-600" },
    { label: "Goals Achieved", value: "3", icon: Target, color: "text-blue-600" },
    { label: "Progress Score", value: "85%", icon: TrendingUp, color: "text-purple-600" },
    { label: "Days Active", value: "127", icon: Clock, color: "text-orange-600" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-black"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
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
              content.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
                  {line || <br />}
                </p>
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weight Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-blue-600" />
              Weight
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                74.4 kg
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal text-red-500 bg-red-50">
                -0.8%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Chart data={weightData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[73.5, 75.5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </Chart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              Sleep
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                6h 59min
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Heart Rate Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-600" />
              Resting Heart Rate
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                62 bpm
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Chart data={heartRateData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[55, 70]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                </Chart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Steps Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg dark:bg-black">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-amber-600" />
              Steps
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                8,700 steps
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stepsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[5000, 10000]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="steps" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
      </div>

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

export default function ClientDashboard() {
  const [client, setClient] = useState(sampleClient)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("1")
  const [activeTab, setActiveTab] = useState("metrics")

  const filteredClients = sampleClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    // In real app, fetch client data here
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Client List Sidebar */}
          <div className="w-full lg:w-80 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    All Clients
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {filteredClients.length}
                  </Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200/60 focus:border-blue-300 focus:ring-blue-200/50 dark:bg-neutral-700"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {filteredClients.map((c) => (
                    <button
                      key={c.client_id}
                      onClick={() => handleClientSelect(c.client_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                        c.client_id === selectedClientId
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                        <AvatarImage src={c.avatarUrl || "/placeholder.svg"} alt={c.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold truncate">{c.name}</div>
                        {c.email && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</div>}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content */}
          <div className="flex-1 space-y-6">
            {/* Enhanced Profile Header */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden dark:bg-black">
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-32 relative">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 right-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
              <CardContent className="relative pt-0 pb-6">
                <div className="flex flex-col md:flex-row items-start gap-6 -mt-16">
                  <Avatar className="h-32 w-32 ring-4 ring-white shadow-2xl">
                    <AvatarImage src={client.avatarUrl || "/placeholder.svg"} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                      {client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 pt-16 md:pt-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-2">{client.name}</h1>
                        {client.username && <p className="text-gray-500 dark:text-gray-400 mb-3">@{client.username}</p>}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            {client.membershipType}
                          </Badge>
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                            Active Member
                          </Badge>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Born {new Date(client.dob).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.height} cm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.weight} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{client.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-400">
                      Member since {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Stats */}
            <ClientStats />

            {/* Editable Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableSection
                title="Goals & Limitations"
                icon={Target}
                initialContent="1. Run a marathon without stopping\n2. Lose 5kg by August\n3. Improve overall endurance\n4. Reduce body fat percentage to 15%"
                storageKey="client-goals-1"
              />
              <EditableSection
                title="Trainer Notes"
                icon={Edit}
                initialContent="Client is making good progress with their running program. Needs to focus more on nutrition and recovery. Suggested adding more protein to diet and implementing better sleep hygiene.\n\nLeg injury from last year occasionally flares up - modify lower body exercises as needed."
                storageKey="client-notes-1"
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
      </div>
    </div>
  )
}
