export type ViewMode = "day" | "week" | "month"
export type Difficulty = "Easy" | "Medium" | "Hard"
export type StartDay = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
export type TaskType = "workout" | "metric" | "checkin" | "picture" | "nutrition" | "note" | "hydration" | "Workout" | "Check-in" | "Nutrition" | "Metric" | "Picture" | "Note" | "Hydration"

export interface Macros {
  protein: number
  carbs: number
  fat: number
}

export interface Task {
  id: string
  type: TaskType
  title?: string
  duration?: string
  subType?: string
  mealType?: string
  calories?: number
  macros?: Macros
  mood?: number
  energyLevel?: number
  weight?: number
  notes?: string
}

export interface Program {
  title: string
  tag: string
  difficulty: string
  startDay: StartDay
  color: string
  description: string
  viewMode: ViewMode
  createdAt: string
  tasks: {
    [unit: string]: Task[]
  }
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
  tasks: Record<number, Task[]>
  viewMode: ViewMode
} 