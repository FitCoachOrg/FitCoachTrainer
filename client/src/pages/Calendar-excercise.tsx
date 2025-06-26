import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Clock, ChevronDown, Play, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  rest: number
  duration: number
  image: string
  notes?: string
  eachSide?: boolean
  tempo?: string
}

interface Workout {
  id: string
  title: string
  type: string
  description: string
  time: string
  duration: number
  exercises: Exercise[]
  moreExercises: number
  color: string
}

const workoutData: { [key: string]: Workout } = {
  day1: {
    id: "day1",
    title: "LOWER BODY CIRCUIT",
    type: "Lower Body Circuit",
    description: "Five exercises, 40 seconds of work, 20 seconds of rest, repeated five times.",
    time: "10:00",
    duration: 45,
    color: "bg-blue-100 border-blue-200",
    moreExercises: 9,
    exercises: [
      {
        id: "1",
        name: "Full Body Warm Up",
        sets: 1,
        reps: 1,
        rest: 0,
        duration: 10,
        image: "/placeholder.svg?height=60&width=60",
      },
      {
        id: "2",
        name: "Inchworm",
        sets: 1,
        reps: 10,
        rest: 30,
        duration: 2,
        image: "/placeholder.svg?height=60&width=60",
        eachSide: false,
        tempo: "Slow",
      },
      {
        id: "3",
        name: "Bodyweight Walking Lunge",
        sets: 3,
        reps: 12,
        rest: 45,
        duration: 3,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
  },
  day3: {
    id: "day3",
    title: "HIIT - TABATA",
    type: "HIIT Tabata",
    description: "High intensity interval training with 20 seconds work, 10 seconds rest.",
    time: "10:00",
    duration: 25,
    color: "bg-purple-100 border-purple-200",
    moreExercises: 13,
    exercises: [
      {
        id: "4",
        name: "Full Body Warm Up",
        sets: 1,
        reps: 1,
        rest: 0,
        duration: 10,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
  },
  day5: {
    id: "day5",
    title: "FULL BODY EMOM",
    type: "Full Body EMOM",
    description: "Every minute on the minute full body workout for maximum efficiency.",
    time: "10:00",
    duration: 30,
    color: "bg-green-100 border-green-200",
    moreExercises: 12,
    exercises: [
      {
        id: "5",
        name: "Full Body Warm Up",
        sets: 1,
        reps: 1,
        rest: 0,
        duration: 10,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
  },
}

export default function FitnessCalendar() {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [workouts, setWorkouts] = useState(workoutData)
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [liveSyncEnabled, setLiveSyncEnabled] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [viewMode, setViewMode] = useState("1 Week")
  const [startDate, setStartDate] = useState(new Date()) 
 

  // Helper function to format date as dd-mm-yyyy
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Helper function to get date for a specific day offset
  const getDateForDay = (dayOffset: number): Date => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + dayOffset)
    return date
  }

  // Generate calendar days with dates
  const generateCalendarDays = (weekOffset: number = 0) => {
    const baseOffset = weekOffset * 7
    return [
      { dayNumber: 1 + baseOffset, date: getDateForDay(0 + baseOffset), workout: workouts.day1 },
      { dayNumber: 2 + baseOffset, date: getDateForDay(1 + baseOffset), workout: null },
      { dayNumber: 3 + baseOffset, date: getDateForDay(2 + baseOffset), workout: workouts.day3 },
      { dayNumber: 4 + baseOffset, date: getDateForDay(3 + baseOffset), workout: null },
      { dayNumber: 5 + baseOffset, date: getDateForDay(4 + baseOffset), workout: workouts.day5 },
      { dayNumber: 6 + baseOffset, date: getDateForDay(5 + baseOffset), workout: null },
      { dayNumber: 7 + baseOffset, date: getDateForDay(6 + baseOffset), workout: null },
    ]
  }

  const days = generateCalendarDays(0)
  const secondWeekDays = generateCalendarDays(1)

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout)
  }

  const handleWorkoutUpdate = (field: keyof Workout, value: any) => {
  if (!selectedWorkout) return;
  const updatedWorkout = { ...selectedWorkout, [field]: value };
  setSelectedWorkout(updatedWorkout);
  setWorkouts((prev) => ({
    ...prev,
    [selectedWorkout.id]: updatedWorkout,
  }));
};

const handleExerciseUpdate = (
  exerciseId: string,
  field: keyof Exercise,
  value: any
) => {
  if (!selectedWorkout) return;
  const updatedExercises = selectedWorkout.exercises.map((ex) =>
    ex.id === exerciseId ? { ...ex, [field]: value } : ex
  );
  const updatedWorkout = { ...selectedWorkout, exercises: updatedExercises };
  setSelectedWorkout(updatedWorkout);
  setWorkouts((prev) => ({
    ...prev,
    [selectedWorkout.id]: updatedWorkout,
  }));
};


  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercises((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStartDate = new Date(startDate)
    newStartDate.setDate(startDate.getDate() + (direction === 'next' ? 7 : -7))
    setStartDate(newStartDate)
  }

  const WorkoutCard = ({ workout, date, dayNumber }: { workout: Workout | null; date: Date; dayNumber: number }) => {
    const isToday = new Date().toDateString() === date.toDateString()
    
    if (!workout) {
      return (
        <div className="h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {formatDate(date)}
          </div>
          <span className="text-gray-400 text-xs">No workout</span>
        </div>
      )
    }

    return (
      <Card
        className={`h-48 cursor-pointer transition-all hover:shadow-md ${workout.color} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => handleWorkoutClick(workout)}
      >
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-800' : 'text-blue-600'}`}>
              {formatDate(date)}
              {isToday && <span className="ml-1 text-xs bg-blue-600 text-white px-1 rounded">TODAY</span>}
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </div>

          <div className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">{workout.title}</div>

          <div className="bg-white rounded-lg p-3 mb-2 flex-1">
            <div className="text-sm font-medium mb-2">Full Body Warm Up</div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs mb-2">
              AMRAP
            </Badge>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {workout.time}
              </div>
              <div className="flex items-center gap-1">
                <span>⏱</span>
                {workout.duration} min
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Plus className="w-3 h-3" />
            {workout.moreExercises} more exercises
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <span className="text-lg font-medium">
                Week {currentWeek} - {formatDate(startDate)} to {formatDate(getDateForDay(13))}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </Button>
            </div>

          </div>

          <div className="flex items-center gap-4">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Master Planner
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Assign Program
            </Button>

            <div className="flex items-center gap-2">
              <Switch checked={liveSyncEnabled} onCheckedChange={setLiveSyncEnabled} />
              <div className="text-sm">
                <div className="font-medium">ENABLE</div>
                <div className="text-gray-600">LIVE SYNC</div>
              </div>
            </div>

            <div className="flex bg-gray-200 rounded-lg p-1">
              {["1 Week", "2 Week", "4 Week"].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  className={`text-xs ${viewMode === mode ? "bg-white shadow-sm" : ""}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-8">
          {/* Week 1 */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-4 -rotate-90 absolute -ml-8 mt-20">WEEK 1</div>
            <div className="ml-8 grid grid-cols-7 gap-4">
              {days.map(({ dayNumber, date, workout }) => (
                <div key={dayNumber}>
                  <div className="text-center text-sm font-medium text-gray-700 mb-2">
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <WorkoutCard workout={workout} date={date} dayNumber={dayNumber} />
                </div>
              ))}
            </div>
          </div>

          {/* Week 2 */}
          <div>
            <div className="text-sm font-medium text-gray-500 mb-4 -rotate-90 absolute -ml-8 mt-20">WEEK 2</div>
            <div className="ml-8 grid grid-cols-7 gap-4">
              {secondWeekDays.map(({ dayNumber, date, workout }) => (
                <div key={dayNumber}>
                  <div className="text-center text-sm font-medium text-gray-700 mb-2">
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <WorkoutCard workout={workout} date={date} dayNumber={dayNumber} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
  {selectedWorkout && (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-2xl font-bold">
            Edit Workout - {selectedWorkout.title}
          </DialogTitle>
          <Button variant="ghost" onClick={() => setSelectedWorkout(null)}>
            Close
          </Button>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <Label>Title</Label>
        <Input
          value={selectedWorkout.title}
          onChange={(e) => handleWorkoutUpdate("title", e.target.value)}
        />

        <Label>Description</Label>
        <Textarea
          value={selectedWorkout.description}
          onChange={(e) => handleWorkoutUpdate("description", e.target.value)}
        />

        <Label>Exercises</Label>
        <div className="space-y-4">
          {selectedWorkout.exercises.map((exercise) => (
            <Card key={exercise.id} className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={exercise.name}
                    onChange={(e) =>
                      handleExerciseUpdate(exercise.id, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Sets</Label>
                  <Input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) =>
                      handleExerciseUpdate(exercise.id, "sets", +e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Reps</Label>
                  <Input
                    type="number"
                    value={exercise.reps}
                    onChange={(e) =>
                      handleExerciseUpdate(exercise.id, "reps", +e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Rest (sec)</Label>
                  <Input
                    type="number"
                    value={exercise.rest}
                    onChange={(e) =>
                      handleExerciseUpdate(exercise.id, "rest", +e.target.value)
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => {
            const newExercise = {
              id: crypto.randomUUID(),
              name: "New Exercise",
              sets: 1,
              reps: 1,
              rest: 30,
              duration: 1,
              image: "/placeholder.svg",
            };
            const updatedWorkout = {
              ...selectedWorkout,
              exercises: [...selectedWorkout.exercises, newExercise],
            };
            setSelectedWorkout(updatedWorkout);
            setWorkouts((prev) => ({
              ...prev,
              [selectedWorkout.id]: updatedWorkout,
            }));
          }}
        >
          Add Exercise
        </Button>
      </div>
    </div>
  )}
</DialogContent>

      </Dialog>
    </div>
  )
}