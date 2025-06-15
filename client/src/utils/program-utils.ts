import { saveAs } from "file-saver"
import type { Program, ProgramData } from "@/types/program"

const PROGRAM_VERSION = "1.0.0"

export interface ProgramFile {
  id: string
  title: string
  tag: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  startDay: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
  color: string
  lastEdited: string
  created: string
  tasks: Record<number, Array<{
    id: string
    type: "workout" | "metric" | "checkin" | "picture" | "nutrition" | "note" | "hydration"
    content: string
    completed?: boolean
    notes?: string
  }>>
  assignedClient?: string
  isEditable: boolean
}

export const generateProgramId = (): string => {
  return `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const formatProgramForFile = (programData: ProgramData): Program => {
  const now = new Date().toISOString()
  
  return {
    title: programData.title,
    tag: programData.tag,
    description: programData.description,
    difficulty: programData.difficulty.charAt(0).toUpperCase() + programData.difficulty.slice(1),
    startDay: programData.startDay,
    color: programData.assignedColor,
    viewMode: programData.viewMode,
    createdAt: now,
    tasks: Object.entries(programData.tasks).reduce((acc, [day, tasks]) => {
      acc[day] = tasks.map(task => {
        const formattedTask: any = {
          type: task.type.charAt(0).toUpperCase() + task.type.slice(1)
        }

        if (task.title) formattedTask.title = task.title
        if (task.duration) formattedTask.duration = task.duration
        if (task.subType) formattedTask.subType = task.subType
        if (task.mealType) formattedTask.mealType = task.mealType
        if (task.calories) formattedTask.calories = task.calories
        if (task.macros) formattedTask.macros = task.macros
        if (task.mood) formattedTask.mood = task.mood
        if (task.energyLevel) formattedTask.energyLevel = task.energyLevel
        if (task.weight) formattedTask.weight = task.weight
        if (task.notes) formattedTask.notes = task.notes

        return formattedTask
      })
      return acc
    }, {} as Record<string, any[]>)
  }
}

export const saveProgramToFile = async (programData: ProgramData): Promise<void> => {
  const program = formatProgramForFile(programData)
  const timestamp = new Date().toISOString().replace(/:/g, "-")
  const filename = `${programData.title}-${timestamp}.json`
  
  const jsonBlob = new Blob(
    [JSON.stringify(program, null, 2)],
    { type: "application/json" }
  )

  try {
    // Try to use the File System Access API
    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
        startIn: 'documents'
      });
      
      const writable = await handle.createWritable();
      await writable.write(jsonBlob);
      await writable.close();
    } else {
      // Fallback to the traditional file-saver if File System Access API is not available
      saveAs(jsonBlob, filename);
    }
  } catch (error) {
    console.error('Error saving file:', error);
    // Fallback to the traditional file-saver if there's any error
    saveAs(jsonBlob, filename);
  }
}

export const loadProgramFromFile = async (file: File): Promise<ProgramData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const program = JSON.parse(event.target?.result as string) as Program
        
        // Validate program version
        if (program.version !== PROGRAM_VERSION) {
          console.warn(`Program version mismatch. Expected ${PROGRAM_VERSION}, got ${program.version}`)
        }
        
        // Convert program to ProgramData format
        const programData: ProgramData = {
          title: program.title,
          tag: program.tag,
          description: program.description,
          difficulty: program.difficulty,
          startDay: program.startDay,
          assignedColor: program.color,
          assignedClient: "",
          isEditable: true,
          viewMode: program.viewMode,
          tasks: Object.entries(program.tasks).reduce((acc, [day, tasks]) => {
            acc[Number(day)] = tasks.map(task => ({
              type: task.type,
              title: task.title,
              duration: task.duration,
              subType: task.subType,
              mealType: task.mealType,
              calories: task.calories,
              macros: task.macros,
              mood: task.mood,
              energyLevel: task.energyLevel,
              weight: task.weight,
              notes: task.notes
            }))
            return acc
          }, {} as Record<number, any[]>)
        }
        
        resolve(programData)
      } catch (error) {
        reject(new Error("Failed to parse program file"))
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Failed to read program file"))
    }
    
    reader.readAsText(file)
  })
}

// Auto-save to localStorage
export const autoSaveProgram = (programData: ProgramData): void => {
  try {
    const program = formatProgramForFile(programData)
    localStorage.setItem(`program_${programData.title}`, JSON.stringify(program))
  } catch (error) {
    console.error("Failed to auto-save program:", error)
  }
}

// Load from localStorage
export const loadAutoSavedProgram = (title: string): ProgramData | null => {
  try {
    const savedProgram = localStorage.getItem(`program_${title}`)
    if (savedProgram) {
      const program = JSON.parse(savedProgram) as Program
      return {
        title: program.title,
        tag: program.tag,
        description: program.description,
        difficulty: program.difficulty,
        startDay: program.startDay,
        assignedColor: program.color,
        assignedClient: "",
        isEditable: true,
        viewMode: program.viewMode,
        tasks: Object.entries(program.tasks).reduce((acc, [day, tasks]) => {
          acc[Number(day)] = tasks.map(task => ({
            type: task.type,
            title: task.title,
            duration: task.duration,
            subType: task.subType,
            mealType: task.mealType,
            calories: task.calories,
            macros: task.macros,
            mood: task.mood,
            energyLevel: task.energyLevel,
            weight: task.weight,
            notes: task.notes
          }))
          return acc
        }, {} as Record<number, any[]>)
      }
    }
    return null
  } catch (error) {
    console.error("Failed to load auto-saved program:", error)
    return null
  }
}

export const updateProgramFile = async (programId: string, updates: Partial<ProgramFile>): Promise<void> => {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll simulate updating a file
    console.log("Updating program:", programId, updates)
  } catch (error) {
    console.error("Error updating program:", error)
    throw new Error("Failed to update program")
  }
}

export const deleteProgramFile = async (programId: string): Promise<void> => {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll simulate deleting a file
    console.log("Deleting program:", programId)
  } catch (error) {
    console.error("Error deleting program:", error)
    throw new Error("Failed to delete program")
  }
} 