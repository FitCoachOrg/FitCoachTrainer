import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Todo, TodoWithClient, CreateTodoRequest, UpdateTodoRequest, TodoFilters, TodoStats } from '@/types/todo'

export function useTodos() {
  const [todos, setTodos] = useState<TodoWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TodoStats | null>(null)

  // Fetch all todos for the current user
  const fetchTodos = async (filters?: TodoFilters) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Build the query
      let query = supabase
        .from('todos_with_clients')
        .select('*')
        .eq('trainer_id', user.id)

      // Apply filters
      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.due_status) {
        query = query.eq('due_status', filters.due_status)
      }

      // Order by priority, due date, and creation date
      query = query.order('priority', { ascending: false })
        .order('due_date', { ascending: true, nullsLast: true })
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        setError(error.message)
        return
      }

      setTodos(data || [])
    } catch (err) {
      setError('Failed to fetch todos')
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch todo statistics
  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .rpc('get_todo_stats', { p_trainer_id: user.id })

      if (error) {
        console.error('Error fetching todo stats:', error)
        return
      }

      setStats(data?.[0] || null)
    } catch (err) {
      console.error('Error fetching todo stats:', err)
    }
  }

  // Create a new todo
  const createTodo = async (todoData: CreateTodoRequest): Promise<Todo | null> => {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return null
      }

      const { data, error } = await supabase
        .from('todos')
        .insert({
          trainer_id: user.id,
          title: todoData.title,
          client_id: todoData.client_id,
          priority: todoData.priority || 'medium',
          due_date: todoData.due_date,
          category: todoData.category
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      // Refresh the todos list
      await fetchTodos()
      await fetchStats()

      return data
    } catch (err) {
      setError('Failed to create todo')
      console.error('Error creating todo:', err)
      return null
    }
  }

  // Update an existing todo
  const updateTodo = async (id: string, updates: UpdateTodoRequest): Promise<Todo | null> => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      // Refresh the todos list
      await fetchTodos()
      await fetchStats()

      return data
    } catch (err) {
      setError('Failed to update todo')
      console.error('Error updating todo:', err)
      return null
    }
  }

  // Toggle todo completion status
  const toggleTodo = async (id: string): Promise<boolean> => {
    try {
      const todo = todos.find(t => t.id === id)
      if (!todo) return false

      const result = await updateTodo(id, { completed: !todo.completed })
      return result !== null
    } catch (err) {
      setError('Failed to toggle todo')
      console.error('Error toggling todo:', err)
      return false
    }
  }

  // Delete a todo
  const deleteTodo = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) {
        setError(error.message)
        return false
      }

      // Refresh the todos list
      await fetchTodos()
      await fetchStats()

      return true
    } catch (err) {
      setError('Failed to delete todo')
      console.error('Error deleting todo:', err)
      return false
    }
  }

  // Bulk operations
  const markAllCompleted = async (completed: boolean): Promise<boolean> => {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return false
      }

      const { error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('trainer_id', user.id)

      if (error) {
        setError(error.message)
        return false
      }

      // Refresh the todos list
      await fetchTodos()
      await fetchStats()

      return true
    } catch (err) {
      setError('Failed to update todos')
      console.error('Error updating todos:', err)
      return false
    }
  }

  // Initialize on mount
  useEffect(() => {
    fetchTodos()
    fetchStats()
  }, [])

  return {
    // State
    todos,
    loading,
    error,
    stats,
    
    // Actions
    fetchTodos,
    fetchStats,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    markAllCompleted,
    
    // Computed values
    completedCount: todos.filter(todo => todo.completed).length,
    totalCount: todos.length,
    overdueCount: todos.filter(todo => todo.due_status === 'overdue').length,
    todayCount: todos.filter(todo => todo.due_status === 'today').length,
    tomorrowCount: todos.filter(todo => todo.due_status === 'tomorrow').length
  }
}
