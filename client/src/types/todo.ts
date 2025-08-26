// Todo Types for FitCoachTrainer
// These types match the database schema in database_schema_todos.sql

export interface Todo {
  id: string
  trainer_id: string
  title: string
  client_id?: number
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string // ISO date string
  category?: string
  created_at: string // ISO date string
  updated_at: string // ISO date string
}

export interface TodoWithClient extends Todo {
  client_name?: string
  client_email?: string
  due_status?: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | null
}

export interface CreateTodoRequest {
  title: string
  client_id?: number
  priority?: 'low' | 'medium' | 'high'
  due_date?: string // ISO date string
  category?: string
}

export interface UpdateTodoRequest {
  title?: string
  client_id?: number
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  due_date?: string // ISO date string
  category?: string
}

export interface TodoFilters {
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  client_id?: number
  category?: string
  due_status?: 'overdue' | 'today' | 'tomorrow' | 'upcoming'
}

export interface TodoStats {
  total_todos: number
  completed_todos: number
  overdue_todos: number
  today_todos: number
  tomorrow_todos: number
  high_priority_todos: number
  medium_priority_todos: number
  low_priority_todos: number
}

// Priority options for UI components
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: 'green' },
  { value: 'medium', label: 'Medium Priority', color: 'yellow' },
  { value: 'high', label: 'High Priority', color: 'red' }
] as const

// Category suggestions for UI components
export const CATEGORY_SUGGESTIONS = [
  'work',
  'meetings',
  'equipment',
  'client-follow-up',
  'training',
  'administration',
  'marketing',
  'personal'
] as const

// Due status options for filtering
export const DUE_STATUS_OPTIONS = [
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'today', label: 'Today', color: 'orange' },
  { value: 'tomorrow', label: 'Tomorrow', color: 'blue' },
  { value: 'upcoming', label: 'Upcoming', color: 'gray' }
] as const
