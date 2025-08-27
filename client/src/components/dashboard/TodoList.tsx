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
  ChevronDown,
  Pencil,
  Save,
  X
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
    deleteTodo,
    updateTodo
  } = useTodos()

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium")
  const [editDueDate, setEditDueDate] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editClientId, setEditClientId] = useState<number | undefined>(undefined)
  const [savingEdit, setSavingEdit] = useState(false)

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

  const startEditing = (todo: TodoWithClient) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditPriority(todo.priority)
    setEditDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0,10) : "")
    setEditCategory(todo.category || "")
    setEditClientId(todo.client_id)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setSavingEdit(false)
  }

  const saveEditing = async () => {
    if (!editingId) return
    setSavingEdit(true)
    await updateTodo(editingId, {
      title: editTitle.trim() || undefined,
      priority: editPriority,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      category: editCategory || undefined,
      client_id: editClientId
    })
    setSavingEdit(false)
    setEditingId(null)
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
    <Card className="shadow-lg border border-border bg-card rounded-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
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
          <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/40">
            {/* Client Dropdown - Moved to top */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client (optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground flex items-center justify-between"
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
                  <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-border">
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
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                      >
                        No client assigned
                      </button>
                      
                      {clientsLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Loading clients...
                        </div>
                      ) : filteredClients.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
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
                            className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
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
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Todo
          </Button>
        )}

        {/* Todo List as Compact Table */}
        <div className="w-full">
          <table className="w-full border-collapse text-sm table-fixed rounded-lg overflow-hidden">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-2 px-2 font-medium text-foreground w-1/3">
                  Task
                </th>
                <th className="text-left py-2 px-2 font-medium text-foreground w-1/6">
                  Client
                </th>
                <th className="text-left py-2 px-2 font-medium text-foreground w-16">
                  Priority
                </th>
                <th className="text-left py-2 px-2 font-medium text-foreground w-20">
                  Due Date
                </th>
                <th className="text-left py-2 px-2 font-medium text-foreground w-1/6">
                  Category
                </th>
                <th className="text-left py-2 px-2 font-medium text-foreground w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {todos.map((todo: TodoWithClient) => (
                <tr 
                  key={todo.id}
                  className={`border-b border-border hover:bg-muted/40 ${
                    todo.completed ? 'opacity-75 bg-muted/40' : ''
                  }`}
                >
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditing()
                          if (e.key === 'Escape') cancelEditing()
                        }}
                        className="font-medium"
                        placeholder="Task title"
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => handleToggleTodo(todo.id)}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <span className={`font-medium break-words ${
                          todo.completed 
                            ? 'line-through text-muted-foreground' 
                            : 'text-foreground'
                        }`}>
                          {todo.title}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <select
                        value={editClientId ?? ''}
                        onChange={(e) => setEditClientId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-2 py-2 border border-input rounded-md bg-background text-foreground text-xs"
                      >
                        <option value="">No client</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      todo.client_id ? (
                        <div className="flex items-start gap-1">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-foreground break-words">
                            {getClientName(todo.client_id)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                        className="w-full px-2 py-2 border border-input rounded-md bg-background text-foreground text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    ) : (
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
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <Input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="text-xs"
                      />
                    ) : (
                      todo.due_date ? (
                        <span className={`text-xs break-words ${
                          isOverdue(todo.due_date) && !todo.completed 
                            ? 'text-red-600 dark:text-red-400 font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatDueDate(todo.due_date)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <Input
                        placeholder="Category"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-xs"
                      />
                    ) : (
                      todo.category ? (
                        <span className="text-xs text-foreground capitalize break-words">
                          {todo.category}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    {editingId === todo.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={saveEditing}
                          disabled={savingEdit}
                        >
                          <Save className="h-3 w-3" /> Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={cancelEditing}
                          disabled={savingEdit}
                        >
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => startEditing(todo)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTodo(todo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
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
