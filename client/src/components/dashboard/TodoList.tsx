"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  CheckCircle,
  User,
  Loader2,
  Search,
  ChevronDown
} from "lucide-react"
import { useClients } from "@/hooks/use-clients"
import { useTodos } from "@/hooks/use-todos"
import { TodoWithClient, CreateTodoRequest } from "@/types/todo"

const TodoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined)
  const [selectedPriority, setSelectedPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)

  // Get clients using the useClients hook
  const { clients, loading: clientsLoading } = useClients()
  
  // Get todos using the useTodos hook
  const { 
    todos, 
    loading: todosLoading, 
    error, 
    stats,
    createTodo, 
    toggleTodo, 
    deleteTodo 
  } = useTodos()

  // Filter clients based on search query
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
  )

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return

    const todoData: CreateTodoRequest = {
      title: newTodo.trim(),
      client_id: selectedClientId,
      priority: selectedPriority,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      category: selectedCategory || undefined
    }

    const success = await createTodo(todoData)
    
    if (success) {
      // Reset form
      setNewTodo("")
      setSelectedClientId(undefined)
      setSelectedPriority("medium")
      setSelectedCategory("")
      setDueDate("")
      setIsAddingTodo(false)
      setClientSearchQuery("")
      setIsClientDropdownOpen(false)
    }
  }

  const handleToggleTodo = async (id: string) => {
    await toggleTodo(id)
  }

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id)
  }

  // Helper function to get client name by ID
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || "Unknown Client"
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      // Use short date format: MM/DD or MM/DD/YY
      const year = date.getFullYear()
      const currentYear = new Date().getFullYear()
      if (year === currentYear) {
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      } else {
        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
      }
    }
  }

  const isOverdue = (dateString: string) => {
    const date = new Date(dateString)
    return date < new Date() && date.toDateString() !== new Date().toDateString()
  }

  // Show loading state while todos are being fetched
  if (todosLoading) {
    return (
      <Card className="shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              To-Do List
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading your todos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            To-Do List
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {stats?.completed_todos || 0}/{stats?.total_todos || 0} completed
          </Badge>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Todo Form */}
        {isAddingTodo ? (
          <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            {/* Client Dropdown - Moved to top */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client (optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between"
                >
                  <span>
                    {selectedClientId 
                      ? getClientName(selectedClientId)
                      : "Select a client (optional)"
                    }
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isClientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="pl-8 border-0 focus:ring-0 bg-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Client list */}
                    <div className="max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(undefined)
                          setIsClientDropdownOpen(false)
                          setClientSearchQuery("")
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                      >
                        No client assigned
                      </button>
                      
                      {clientsLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Loading clients...
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {clientSearchQuery ? "No clients found" : "No clients available"}
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id)
                              setIsClientDropdownOpen(false)
                              setClientSearchQuery("")
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                          >
                            {client.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Input
              placeholder="What needs to be done?"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="font-medium"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as "low" | "medium" | "high")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <Input
              placeholder="Category (optional)"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddTodo} size="sm" className="flex-1">
                Add Todo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsAddingTodo(false)
                  setClientSearchQuery("")
                  setIsClientDropdownOpen(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsAddingTodo(true)}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Add New Todo
          </Button>
        )}

        {/* Todo List as Compact Table */}
        <div className="w-full">
          <table className="w-full border-collapse text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-12">
                  <Checkbox />
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-1/3">
                  Task
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-1/6">
                  Client
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-16">
                  Priority
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-20">
                  Due Date
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-1/6">
                  Category
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {todos.map((todo: TodoWithClient) => (
                <tr 
                  key={todo.id}
                  className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    todo.completed ? 'opacity-75 bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <td className="py-2 px-2 align-top">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <span className={`font-medium break-words ${
                      todo.completed 
                        ? 'line-through text-gray-500 dark:text-gray-400' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {todo.title}
                    </span>
                  </td>
                  <td className="py-2 px-2 align-top">
                    {todo.client_id ? (
                      <div className="flex items-start gap-1">
                        <User className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 break-words">
                          {getClientName(todo.client_id)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-1 py-0.5 ${
                        todo.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}
                    >
                      {todo.priority === 'high' ? 'H' : todo.priority === 'medium' ? 'M' : 'L'}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 align-top">
                    {todo.due_date ? (
                      <span className={`text-xs break-words ${
                        isOverdue(todo.due_date) && !todo.completed 
                          ? 'text-red-600 dark:text-red-400 font-medium' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {formatDueDate(todo.due_date)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {todo.category ? (
                      <span className="text-xs text-gray-600 dark:text-gray-300 capitalize break-words">
                        {todo.category}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {todos.length === 0 && !todosLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No todos yet. Add your first todo to get started!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TodoList
