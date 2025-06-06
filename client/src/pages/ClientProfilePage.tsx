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
