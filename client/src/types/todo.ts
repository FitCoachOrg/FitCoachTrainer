// Todo Types for FitCoachTrainer
// These types match the database schema in database_schema_todos.sql
// Enhanced: Added AI integration types for converting AI recommendations to todos

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
  // AI Integration Fields (Minimal)
  source?: 'manual' | 'ai_recommendation'
  ai_context?: string // Simple text field for original AI recommendation
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
  // AI Integration Fields
  source?: 'manual' | 'ai_recommendation'
  ai_context?: string
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

// AI Integration Types
export interface AIRecommendationToTodo {
  title: string
  client_id?: number
  priority: 'low' | 'medium' | 'high'
  category?: string
  source: 'ai_recommendation'
  ai_context?: string
}

// AI Category Mapping
export interface AICategoryMapping {
  ai_category: string
  todo_category: string
  description?: string
}

// Default AI category mappings
export const DEFAULT_AI_CATEGORY_MAPPINGS: AICategoryMapping[] = [
  { ai_category: 'Training', todo_category: 'training' },
  { ai_category: 'Nutrition', todo_category: 'nutrition' },
  { ai_category: 'Motivation', todo_category: 'client-follow-up' },
  { ai_category: 'Communication', todo_category: 'client-follow-up' },
  { ai_category: 'Assessment', todo_category: 'administration' },
  { ai_category: 'Other', todo_category: 'personal' }
]
