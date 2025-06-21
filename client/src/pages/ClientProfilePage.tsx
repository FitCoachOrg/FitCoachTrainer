import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  X,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ViewMode, Difficulty, StartDay, TaskType, Task, ProgramData } from "@/types/program"
import { supabase } from "@/lib/supabase"

// Import the real AI workout plan generator
import { generateAIWorkoutPlan } from "@/lib/ai-fitness-plan"
import { generateAINutritionPlan } from "@/lib/ai-nutrition-plan"

// Define types for AI response (matching the actual implementation)
interface AIResponse {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  timestamp: string;
}

interface ClientInfo {
  name?: string;
  preferredName?: string;
  [key: string]: any;
}

// AI Response Popup Component
const AIResponsePopup = ({ isOpen, onClose, aiResponse, clientName, onShowMetrics }: {
  isOpen: boolean;
  onClose: () => void;
  aiResponse: AIResponse | null;
  clientName?: string;
  onShowMetrics?: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'raw'>('table');
  const [workoutPlan, setWorkoutPlan] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Parse workout plan from AI response
  useEffect(() => {
    if (aiResponse?.response) {
      try {
        const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (parsedData.workout_plan && Array.isArray(parsedData.workout_plan)) {
            setWorkoutPlan(parsedData.workout_plan);
          }
        }
      } catch (error) {
        console.error('Error parsing workout plan:', error);
      }
    }
  }, [aiResponse]);

  const handleWorkoutChange = (index: number, field: string, value: any) => {
    const updatedPlan = [...workoutPlan];
    updatedPlan[index] = { ...updatedPlan[index], [field]: value };
    setWorkoutPlan(updatedPlan);
  };

  const addNewWorkout = () => {
    const newWorkout = {
      workout: "New Exercise",
      sets: 3,
      reps: "10",
      duration: 15,
      weights: "bodyweight",
      for_date: new Date().toISOString().split('T')[0],
      for_time: "08:00:00",
      body_part: "Full Body",
      category: "Strength",
      coach_tip: "Focus on proper form",
      icon: "💪",
      progression_notes: "Increase intensity when RPE ≤ 8"
    };
    setWorkoutPlan([...workoutPlan, newWorkout]);
  };

  const removeWorkout = (index: number) => {
    const updatedPlan = workoutPlan.filter((_, i) => i !== index);
    setWorkoutPlan(updatedPlan);
  };

  const saveChanges = () => {
    setIsEditing(false);
    // Here you could save the changes to your backend or state management
    console.log('Saved workout plan:', workoutPlan);
  };

  if (!isOpen || !aiResponse) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              🤖
            </div>
            AI Fitness Plan Generated{clientName ? ` for ${clientName}` : ''}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your personalized fitness plan has been generated using AI. You can view and edit the workout plan in the table below.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Workout Table
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📄 Raw Response
            </button>
          </div>

          {/* Workout Plan Table */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">Workout Plan</h4>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={saveChanges} size="sm" className="bg-green-600 hover:bg-green-700">
                        💾 Save Changes
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      ✏️ Edit Plan
                    </Button>
                  )}
                </div>
              </div>

              {workoutPlan.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Exercise</th>
                          <th className="px-3 py-2 text-left font-medium">Sets</th>
                          <th className="px-3 py-2 text-left font-medium">Reps</th>
                          <th className="px-3 py-2 text-left font-medium">Duration</th>
                          <th className="px-3 py-2 text-left font-medium">Equipment</th>
                          <th className="px-3 py-2 text-left font-medium">Body Part</th>
                          <th className="px-3 py-2 text-left font-medium">Category</th>
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                          <th className="px-3 py-2 text-left font-medium">Coach Tip</th>
                          {isEditing && <th className="px-3 py-2 text-left font-medium">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {workoutPlan.map((workout, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{workout.icon}</span>
                                {isEditing ? (
                                  <Input
                                    value={workout.workout}
                                    onChange={(e) => handleWorkoutChange(index, 'workout', e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  <span className="font-medium">{workout.workout}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={workout.sets}
                                  onChange={(e) => handleWorkoutChange(index, 'sets', parseInt(e.target.value) || 0)}
                                  className="w-16"
                                />
                              ) : (
                                workout.sets
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Input
                                  value={workout.reps}
                                  onChange={(e) => handleWorkoutChange(index, 'reps', e.target.value)}
                                  className="w-24"
                                />
                              ) : (
                                workout.reps
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={workout.duration}
                                    onChange={(e) => handleWorkoutChange(index, 'duration', parseInt(e.target.value) || 0)}
                                    className="w-16"
                                  />
                                  <span className="text-xs text-gray-500">min</span>
                                </div>
                              ) : (
                                `${workout.duration} min`
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Select
                                  value={workout.weights}
                                  onValueChange={(value) => handleWorkoutChange(index, 'weights', value)}
                                >
                                  <SelectTrigger className="w-32">
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
                                workout.weights
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Select
                                  value={workout.body_part}
                                  onValueChange={(value) => handleWorkoutChange(index, 'body_part', value)}
                                >
                                  <SelectTrigger className="w-32">
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
                                workout.body_part
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Select
                                  value={workout.category}
                                  onValueChange={(value) => handleWorkoutChange(index, 'category', value)}
                                >
                                  <SelectTrigger className="w-28">
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
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  workout.category === 'Strength' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  workout.category === 'Cardio' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  workout.category === 'Flexibility' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {workout.category}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEditing ? (
                                <Input
                                  type="date"
                                  value={workout.for_date}
                                  onChange={(e) => handleWorkoutChange(index, 'for_date', e.target.value)}
                                  className="w-32"
                                />
                              ) : (
                                new Date(workout.for_date).toLocaleDateString()
                              )}
                            </td>
                            <td className="px-3 py-2 max-w-48">
                              {isEditing ? (
                                <textarea
                                  value={workout.coach_tip}
                                  onChange={(e) => handleWorkoutChange(index, 'coach_tip', e.target.value)}
                                  className="w-full p-2 text-xs border rounded resize-none"
                                  rows={2}
                                />
                              ) : (
                                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {workout.coach_tip}
                                </div>
                              )}
                            </td>
                            {isEditing && (
                              <td className="px-3 py-2">
                                <Button
                                  onClick={() => removeWorkout(index)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  🗑️
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {isEditing && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t">
                      <Button onClick={addNewWorkout} variant="outline" size="sm">
                        ➕ Add New Exercise
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No workout plan found in the AI response
                </div>
              )}
            </div>
          )}

          {/* Raw Response Tab */}
          {activeTab === 'raw' && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">AI Response:</h4>
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-96">
                {aiResponse.response}
              </pre>
            </div>
          )}

          {/* Usage Statistics */}
          {aiResponse.usage && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">Usage Statistics:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 dark:text-green-300">Model:</span> {aiResponse.model || 'gpt-4'}
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Total Tokens:</span> {aiResponse.usage.total_tokens}
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Input Tokens:</span> {aiResponse.usage.prompt_tokens}
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300">Output Tokens:</span> {aiResponse.usage.completion_tokens}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            {onShowMetrics && aiResponse.usage && (
              <Button variant="outline" onClick={onShowMetrics}>
                View Detailed Metrics
              </Button>
            )}
            <Button onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Client Data Popup Component
const ClientDataPopup = ({ isOpen, onClose, clientInfo }: {
  isOpen: boolean;
  onClose: () => void;
  clientInfo: any;
}) => {
  if (!isOpen || !clientInfo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Data Retrieved</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Successfully retrieved client data from the database. This information will be used to generate personalized AI plans.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Basic Information</h4>
              <div className="space-y-1">
                <div><span className="font-medium">Name:</span> {clientInfo.name || 'N/A'}</div>
                <div><span className="font-medium">Preferred Name:</span> {clientInfo.preferredName || 'N/A'}</div>
                <div><span className="font-medium">Age:</span> {clientInfo.age || 'N/A'}</div>
                <div><span className="font-medium">Sex:</span> {clientInfo.sex || 'N/A'}</div>
                <div><span className="font-medium">Height:</span> {clientInfo.height ? `${clientInfo.height} cm` : 'N/A'}</div>
                <div><span className="font-medium">Weight:</span> {clientInfo.weight ? `${clientInfo.weight} kg` : 'N/A'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Goals & Training</h4>
              <div className="space-y-1">
                <div><span className="font-medium">Primary Goal:</span> {clientInfo.primaryGoal || 'N/A'}</div>
                <div><span className="font-medium">Activity Level:</span> {clientInfo.activityLevel || 'N/A'}</div>
                <div><span className="font-medium">Training Experience:</span> {clientInfo.trainingExperience || 'N/A'}</div>
                <div><span className="font-medium">Training Days/Week:</span> {clientInfo.trainingDaysPerWeek || 'N/A'}</div>
                <div><span className="font-medium">Available Equipment:</span> {clientInfo.availableEquipment || 'N/A'}</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// AI Metrics Popup Component
const AIMetricsPopup = ({ isOpen, onClose, metrics, clientName }: {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    timestamp: string;
    responseTime?: number;
  } | null;
  clientName?: string;
}) => {
  if (!isOpen || !metrics) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const estimatedCost = (metrics.totalTokens * 0.00003).toFixed(4); // Rough GPT-4 estimate

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              📊
            </div>
            AI Generation Metrics{clientName ? ` - ${clientName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.inputTokens.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Input Tokens</div>
              <div className="text-xs text-gray-500 mt-1">Prompt & Context</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {metrics.outputTokens.toLocaleString()}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Output Tokens</div>
              <div className="text-xs text-gray-500 mt-1">Generated Content</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {metrics.totalTokens.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Total Tokens</div>
              <div className="text-xs text-gray-500 mt-1">Combined Usage</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${estimatedCost}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Est. Cost</div>
              <div className="text-xs text-gray-500 mt-1">Approximate</div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Generation Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Model:</span> {metrics.model}
              </div>
              <div>
                <span className="font-medium">Response Time:</span> {metrics.responseTime ? formatTime(metrics.responseTime) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Generated:</span> {new Date(metrics.timestamp).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Token Ratio:</span> {((metrics.outputTokens / metrics.inputTokens) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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
  const { toast } = useToast()
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<Record<string, WorkoutPlan>>({})
  const [scheduledWorkouts, setScheduledWorkouts] = useState<WorkoutPlan[][]>(() => Array(7).fill(null).map(() => []))
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
      ...aiGeneratedPlans.flatMap(plan => 
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
          source: "ai"
        }))
      )
    ];
    setAllWorkoutPlans(initialPlans);
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
      Monday: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
      Tuesday: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm", 
      Wednesday: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm",
      Thursday: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm",
      Friday: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm",
      Saturday: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm",
      Sunday: "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-sm",
    }
    return colors[day as keyof typeof colors] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm"
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
      source: "custom"
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
              <SelectTrigger className="h-6 min-w-[80px] text-xs border-0 p-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs">
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
          <div className="flex items-start gap-1">
            <Textarea
              value={String(editValue)}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] text-xs resize-none w-full border-0 p-1"
              rows={3}
              autoFocus
            />
            <div className="flex flex-col gap-1 flex-shrink-0">
              <Button size="sm" onClick={handleSave} className="h-4 w-4 p-0">
                <Save className="h-2 w-2" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-4 w-4 p-0">
                <X className="h-2 w-2" />
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(type === "number" ? Number(e.target.value) : e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-6 text-xs border-0 p-1"
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-4 w-4 p-0">
              <Save className="h-2 w-2" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-4 w-4 p-0">
              <X className="h-2 w-2" />
            </Button>
          </div>
        </div>
      )
    }

    const cellContent = () => {
      if (field === "day") {
        return (
          <Badge className={`${getDayColor(String(value))} font-medium cursor-pointer text-xs px-1.5 py-0.5 border-0`}>
            {String(value).slice(0, 3)}
          </Badge>
        )
      }
      if (field === "duration") {
        return <span className="font-semibold text-blue-600 text-xs">{value}min</span>
      }
      if (field === "sets") {
        return <span className="font-bold text-gray-800 text-sm">{value}</span>
      }
      if (field === "coach_tip") {
        return (
          <div className="w-full">
            <p
              className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 leading-tight break-words"
              style={{
                lineHeight: "1.3",
                minHeight: "3.9em",
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
          <div className="flex items-center gap-2">
            <span className="text-lg">{workout.icon || "💪"}</span>
            <span className="cursor-pointer hover:text-blue-600 font-medium text-sm text-gray-800">{String(value)}</span>
          </div>
        )
      }
      return <span className="cursor-pointer hover:text-blue-600 text-xs text-gray-700">{String(value)}</span>
    }

    return (
      <div
        onClick={() => handleCellClick(workout, field)}
        className="cursor-pointer hover:bg-blue-50 rounded transition-all duration-200 hover:shadow-sm w-full p-0.5"
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
            exercises: [{
              workout: workout.exercise,
              duration: workout.duration,
              sets: workout.sets,
              reps: workout.reps,
              weights: workout.weight,
              coach_tip: workout.coach_tip,
              icon: workout.icon,
              category: workout.category,
              body_part: workout.body_part,
              workout_yt_link: ""
            }]
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
      // For custom plans, we'll update them in allWorkoutPlans
      setAllWorkoutPlans(prev => 
        prev.map(plan => plan.id === editingPlan.id ? editedPlan : plan)
      )
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
              
              const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || 'Client';
              toast({
                title: "AI Workout Plan Generated",
                description: `Personalized plan created for ${clientName}. Click to view full response.`,
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
            const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || 'Client';
            toast({
              title: "Client Data Retrieved",
              description: `Showing data for ${clientName}`,
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
    <div className="grid grid-cols-7 gap-6 h-full">
      {/* Left Column - Weekly Calendar & Custom Exercises */}
      <div className="col-span-5 flex flex-col">
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
        <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="min-h-0">
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-20 pb-2 mb-2">
                <h4 className="text-xs font-semibold text-center text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {day}
                </h4>
              </div>
              <div
                className="space-y-2 min-h-[200px] p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {scheduledWorkouts[index]?.map((workout, workoutIndex) => (
                  <div
                    key={workoutIndex}
                    className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 text-xs group relative"
                  >
                    <div className="font-medium text-emerald-800 dark:text-emerald-200 mb-1 text-xs truncate">
                      {workout.name}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                      <Clock className="h-2 w-2" />
                      {workout.duration}m
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30"
                      onClick={() => removeFromCalendar(index)}
                    >
                      <X className="h-2 w-2 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                ))}
                {(!scheduledWorkouts[index] || scheduledWorkouts[index].length === 0) && (
                  <div className="text-center text-gray-400 dark:text-gray-600 text-xs py-8">
                    Drop workout here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - Workout Plans Table */}
      <div className="col-span-2 flex flex-col">
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workout Plans</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleAddNewWorkout}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Exercise
              </Button>
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
        </div>

        <div className="overflow-y-auto pr-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Editable Workout Plan
                <Badge variant="secondary" className="text-xs">
                  {sortedWorkouts.length} exercises
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                      <TableHead className="font-semibold text-xs w-[80px]">Day</TableHead>
                      <TableHead className="font-semibold text-xs min-w-[200px]">Exercise</TableHead>
                      <TableHead className="font-semibold text-xs w-[60px] text-center">Sets</TableHead>
                      <TableHead className="font-semibold text-xs w-[80px] text-center">Reps</TableHead>
                      <TableHead className="font-semibold text-xs w-[80px] text-center">Duration</TableHead>
                      <TableHead className="font-semibold text-xs w-[100px] text-center">Weight</TableHead>
                      <TableHead className="font-semibold text-xs min-w-[250px]">Coach Tip</TableHead>
                      <TableHead className="font-semibold text-xs w-[60px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedWorkouts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Dumbbell className="h-8 w-8 text-gray-300" />
                            <p>No workout exercises yet</p>
                            <p className="text-xs">Click "Generate AI Plan" or "Add Exercise" to get started</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedWorkouts.map((workout) => (
                        <TableRow 
                          key={workout.id} 
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group border-b border-gray-100 dark:border-gray-800"
                        >
                          <TableCell className="py-2">
                            {renderEditableCell(workout, "day", "select")}
                          </TableCell>
                          <TableCell className="py-2">
                            {renderEditableCell(workout, "exercise", "text")}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {renderEditableCell(workout, "sets", "number")}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {renderEditableCell(workout, "reps", "text")}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {renderEditableCell(workout, "duration", "number")}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {renderEditableCell(workout, "weight", "select")}
                          </TableCell>
                          <TableCell className="py-2 max-w-[250px]">
                            {renderEditableCell(workout, "coach_tip", "textarea")}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {sortedWorkouts.length > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        💡 Tips: Click any cell to edit • Drag rows to calendar • Use keyboard shortcuts (Enter/Escape)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span>Total exercises: {sortedWorkouts.length}</span>
                      <span>•</span>
                      <span>
                        Total duration: {sortedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)} min
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>




       
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
  const { toast } = useToast()
  const [selectedDay, setSelectedDay] = useState("monday")
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItemDialog, setNewItemDialog] = useState<string | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [showNutritionAIResponse, setShowNutritionAIResponse] = useState(false)
  const [nutritionAiResponse, setNutritionAiResponse] = useState<any>(null)
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

  const parseAINutritionResponse = (aiResponseText: string) => {
    try {
      console.log('🔍 Parsing AI nutrition response:', aiResponseText)
      
      // Remove any markdown code blocks
      const cleanedResponse = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      
      // Parse the JSON
      const parsedResponse = JSON.parse(cleanedResponse)
      console.log('✅ Successfully parsed AI nutrition response:', parsedResponse)
      
      // Extract nutrition plan items
      if (parsedResponse.nutrition_plan && Array.isArray(parsedResponse.nutrition_plan)) {
        const nutritionItems = parsedResponse.nutrition_plan
        
        // Group by meal type
        const groupedMeals: {
          breakfast: MealItem[];
          lunch: MealItem[];
          snack: MealItem[];
          dinner: MealItem[];
        } = {
          breakfast: [],
          lunch: [],
          snack: [],
          dinner: []
        }
        
        nutritionItems.forEach((item: any) => {
          const mealType = item.meal_type?.toLowerCase()
          if (groupedMeals[mealType as keyof typeof groupedMeals]) {
            groupedMeals[mealType as keyof typeof groupedMeals].push({
              name: item.food_name || item.name,
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fats: item.fats || 0
            })
          }
        })
        
        console.log('🍽️ Grouped meals:', groupedMeals)
        return groupedMeals
      }
      
      return null
    } catch (error) {
      console.error('❌ Error parsing AI nutrition response:', error)
      return null
    }
  }

  const handleGenerateAINutritionPlan = async () => {
    console.log('🚀 Button clicked - Starting AI nutrition generation process');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    setIsGeneratingAI(true)
    const startTime = Date.now() // Track response time
    
    try {
      const clientId = 34 // Hardcoded for now to match working fitness plan
      console.log('🎯 Using hardcoded client ID:', clientId);
      
      toast({
        title: "Generating AI Nutrition Plan",
        description: "Please wait while we create a personalized nutrition plan...",
      })
      
      const result = await generateAINutritionPlan(clientId)
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
          
          // If AI response is available, parse and update meal items
          if (result.aiResponse) {
            try {
              const parsedMeals = parseAINutritionResponse(result.aiResponse.response);
              if (parsedMeals) {
                setMealItems(parsedMeals);
              }
              
              // Always show the complete AI response first
              setNutritionAiResponse(result.aiResponse);
              setShowNutritionAIResponse(true);
              
              const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || 'Client';
              toast({
                title: "AI Nutrition Plan Generated",
                description: `Personalized nutrition plan created for ${clientName}. Click to view full response.`,
              })
            } catch (parseError) {
              console.error('Error parsing AI nutrition response:', parseError);
              // Show the raw response in popup (parsing failed)
              setNutritionAiResponse(result.aiResponse);
              setShowNutritionAIResponse(true);
              
              toast({
                title: "AI Response Generated",
                description: "View the complete AI response. Meals may need manual parsing.",
              })
            }
          } else {
            const clientName = result.clientInfo?.name || result.clientInfo?.preferredName || 'Client';
            toast({
              title: "Client Data Retrieved",
              description: `Showing data for ${clientName}`,
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
      console.error('💥 EXCEPTION CAUGHT in handleGenerateAINutritionPlan:');
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
        <Button 
          onClick={handleGenerateAINutritionPlan}
          disabled={isGeneratingAI}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg disabled:opacity-50"
        >
          {isGeneratingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Generate AI Plan
            </>
          )}
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

          {/* Lunch */}
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
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingItem === `lunch-${index}` ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateMealItem("lunch", index, "name", e.target.value)}
                        className="text-sm font-medium h-6 p-1"
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
                        onClick={() => setEditingItem(`lunch-${index}`)}
                      >
                        {item.name}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                        onClick={() => setEditingItem(`lunch-${index}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMealItem("lunch", index)}
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
                onClick={() => setNewItemDialog("lunch")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Snack */}
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
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingItem === `snack-${index}` ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateMealItem("snack", index, "name", e.target.value)}
                        className="text-sm font-medium h-6 p-1"
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
                        onClick={() => setEditingItem(`snack-${index}`)}
                      >
                        {item.name}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                        onClick={() => setEditingItem(`snack-${index}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMealItem("snack", index)}
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
                onClick={() => setNewItemDialog("snack")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Dinner */}
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
                <div
                  key={index}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-400 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingItem === `dinner-${index}` ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateMealItem("dinner", index, "name", e.target.value)}
                        className="text-sm font-medium h-6 p-1"
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingItem(null)}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex-1"
                        onClick={() => setEditingItem(`dinner-${index}`)}
                      >
                        {item.name}
                      </div>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-600"
                        onClick={() => setEditingItem(`dinner-${index}`)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMealItem("dinner", index)}
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
                onClick={() => setNewItemDialog("dinner")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Item Dialog */}
      {newItemDialog && (
        <Dialog open={!!newItemDialog} onOpenChange={() => setNewItemDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New {newItemDialog?.charAt(0).toUpperCase() + newItemDialog?.slice(1)} Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Food Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Enter food name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={newItem.calories}
                    onChange={(e) => setNewItem({ ...newItem, calories: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={newItem.protein}
                    onChange={(e) => setNewItem({ ...newItem, protein: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={newItem.carbs}
                    onChange={(e) => setNewItem({ ...newItem, carbs: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="fats">Fats (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    value={newItem.fats}
                    onChange={(e) => setNewItem({ ...newItem, fats: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewItemDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => newItemDialog && addMealItem(newItemDialog)}>
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Response Dialog */}
      {showNutritionAIResponse && nutritionAiResponse && (
        <Dialog open={showNutritionAIResponse} onOpenChange={setShowNutritionAIResponse}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                </div>
                AI Nutrition Plan Generated
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Your personalized nutrition plan has been generated using AI. The meal items have been automatically added to your plan above.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">AI Response:</h4>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {nutritionAiResponse.response}
                </pre>
              </div>
              
              {nutritionAiResponse.usage && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Usage Statistics:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Model:</span> {nutritionAiResponse.model || 'gpt-4'}
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Total Tokens:</span> {nutritionAiResponse.usage.total_tokens}
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Input Tokens:</span> {nutritionAiResponse.usage.prompt_tokens}
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Output Tokens:</span> {nutritionAiResponse.usage.completion_tokens}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => setShowNutritionAIResponse(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
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
        [day]: (prev.tasks[day] || []).filter((task, index) => index.toString() !== taskId),
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
