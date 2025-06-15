"use client"

import { useState } from "react"
import { Search, Plus, Filter, MoreHorizontal, Edit, Copy, Trash2, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { HeaderBar } from "@/components/header-bar"
import { DescriptionInput } from "@/components/description-input"
import { ViewTabs } from "@/components/view-tabs"
import { ProgramCardsContainer } from "@/components/program-cards-container"
import { SaveButton } from "@/components/save-button"
import { AddTaskDropdown } from "@/components/add-task-dropdown"
import { saveProgramToFile } from "@/utils/program-utils"
import { useToast } from "@/components/ui/use-toast"

// Add these utility functions after the imports
const getStartDate = (startDay: StartDay): Date => {
  const today = new Date()
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const targetDayIndex = dayNames.indexOf(startDay)
  const currentDayIndex = today.getDay()

  const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + daysToAdd)

  return startDate
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const getDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "long" })
}

const getShortDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

export type ViewMode = "day" | "week" | "month"
export type Difficulty = "easy" | "medium" | "hard"
export type StartDay = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
export type TaskType = "checkin" | "picture" | "metric" | "workout" | "nutrition" | "note" | "hydration"

export interface Task {
  type: TaskType
  content: string
}

export interface ProgramData {
  title: string
  tag: string
  description: string
  difficulty: Difficulty
  startDay: StartDay
  assignedColor: string
  assignedClient: string
  isEditable: boolean
  tasks: Record<number, Task[]> // day number -> tasks
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
  Easy: "#39FF14",
  Medium: "#FFD93D",
  Hard: "#FF6B35",
}

const tags = ["All", "Strength", "Cardio", "Flexibility", "Recovery", "Performance"]
const sortOptions = ["Recently updated", "Alphabetically", "Difficulty"]

export default function AllProgramsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")
  const [sortBy, setSortBy] = useState("Recently updated")
  const [programs, setPrograms] = useState(mockPrograms)
  const [isSaving, setIsSaving] = useState(false)
  const [programData, setProgramData] = useState<ProgramData>({
    title: "New Program",
    tag: "",
    description: "",
    difficulty: "medium",
    startDay: "Monday",
    assignedColor: "#39FF14",
    assignedClient: "",
    isEditable: true,
    tasks: {},
  })

  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

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
      await saveProgramToFile(programData)
      
      // Create new program from programData
      const newProgram = {
        id: Math.max(...programs.map((p) => p.id)) + 1,
        title: programData.title,
        tag: programData.tag,
        difficulty: programData.difficulty.charAt(0).toUpperCase() + programData.difficulty.slice(1),
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
        difficulty: "medium",
        startDay: "Monday",
        assignedColor: "#39FF14",
        assignedClient: "",
        isEditable: true,
        tasks: {},
      })

      toast({
        title: "Program saved",
        description: "Your program has been successfully saved.",
      })
    } catch (error) {
      console.error("Error saving program:", error)
      toast({
        title: "Error saving program",
        description: "There was an error saving your program. Please try again.",
        variant: "destructive",
      })
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

  const filteredPrograms = programs
    .filter((program) => {
      const matchesSearch =
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.tag.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTag = selectedTag === "All" || program.tag === selectedTag
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Alphabetically":
          return a.title.localeCompare(b.title)
        case "Difficulty":
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
          return (
            difficultyOrder[a.difficulty as keyof typeof difficultyOrder] -
            difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
          )
        default:
          return new Date(b.created).getTime() - new Date(a.created).getTime()
      }
    })

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {!isCreating ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">All Programs</h1>
                <p className="text-gray-400">Manage and organize your training programs</p>
              </div>
              <Button 
                className="bg-[#39FF14] hover:bg-[#32E012] text-black font-semibold"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Program
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search programs by name or tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-400 focus:border-[#39FF14]"
                />
              </div>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full sm:w-48 bg-[#1a1a1a] border-gray-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-white hover:bg-[#2a2a2a]">
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 bg-[#1a1a1a] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  {sortOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-white hover:bg-[#2a2a2a]">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} className="bg-[#1a1a1a] border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: program.color }} />
                          <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300 text-xs">
                            {program.tag}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{program.title}</h3>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-gray-700">
                          <DropdownMenuItem className="text-white hover:bg-[#2a2a2a]">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-white hover:bg-[#2a2a2a]"
                            onClick={() => handleDuplicate(program.id)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-red-400 hover:bg-red-900/20"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1a1a1a] border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Delete Program</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to delete "{program.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#2a2a2a] border-gray-600 text-white hover:bg-[#3a3a3a]">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDelete(program.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: difficultyColors[program.difficulty as keyof typeof difficultyColors] }}
                        />
                        <span>{program.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{program.startDay}</span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{program.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Edited {program.lastEdited}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPrograms.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No programs found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="min-h-screen bg-[#121212] text-[#F0F0F0] font-sans">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
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
                  className="border-gray-700 text-gray-400 hover:text-white"
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
        )}
      </div>
    </div>
  )
} 