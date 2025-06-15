"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeaderBar } from "@/components/header-bar"
import { DescriptionInput } from "@/components/description-input"
import { ViewTabs } from "@/components/view-tabs"
import { ProgramCardsContainer } from "@/components/program-cards-container"
import { SaveButton } from "@/components/save-button"
import { AddTaskDropdown } from "@/components/add-task-dropdown"
import { useToast } from "@/components/ui/use-toast"
import type { ViewMode, Difficulty, StartDay, TaskType, Task, ProgramData } from "@/types/program"
import { saveProgramToFile, loadProgramFromFile, autoSaveProgram, loadAutoSavedProgram } from "@/utils/program-utils"

export default function ProgramPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [programData, setProgramData] = useState<ProgramData>({
    title: "",
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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Auto-save when program data changes
  useEffect(() => {
    if (programData.title) {
      autoSaveProgram(programData)
      setHasUnsavedChanges(true)
    }
  }, [programData])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const loadProgram = async () => {
      if (id) {
        setIsLoading(true)
        try {
          // Try to load from localStorage first
          const savedProgram = loadAutoSavedProgram(id)
          if (savedProgram) {
            setProgramData(savedProgram)
            setViewMode(savedProgram.viewMode)
          } else {
            // If not in localStorage, try to load from file
            const fileInput = document.createElement("input")
            fileInput.type = "file"
            fileInput.accept = ".json"
            
            fileInput.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                try {
                  const loadedProgram = await loadProgramFromFile(file)
                  setProgramData(loadedProgram)
                  setViewMode(loadedProgram.viewMode)
                } catch (error) {
                  toast({
                    title: "Error loading program",
                    description: "There was an error loading the program. Please try again.",
                    variant: "destructive",
                  })
                }
              }
            }
            
            fileInput.click()
          }
        } catch (error) {
          toast({
            title: "Error loading program",
            description: "There was an error loading the program. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadProgram()
  }, [id, toast])

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
      setHasUnsavedChanges(false)
      toast({
        title: "Program saved",
        description: "Your program has been successfully saved.",
      })
    } catch (error) {
      toast({
        title: "Error saving program",
        description: "There was an error saving your program. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F0F0F0] font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#39FF14] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading program...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F0F0F0] font-sans">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Button
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={() => {
            if (hasUnsavedChanges) {
              if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                navigate("/programs")
              }
            } else {
              navigate("/programs")
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Button>

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
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                  navigate("/programs")
                }
              } else {
                navigate("/programs")
              }
            }}
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