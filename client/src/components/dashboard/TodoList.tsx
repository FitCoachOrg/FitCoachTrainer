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
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Flag
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

  // Enhanced priority badge component
  const PriorityBadge = ({ priority, size = "default" }: { priority: "low" | "medium" | "high", size?: "small" | "default" }) => {
    const config = {
      low: {
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
        icon: <Flag className={`${size === "small" ? "h-3 w-3" : "h-4 w-4"} text-green-600 dark:text-green-400`} />,
        text: "Low"
      },
      medium: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
        icon: <Flag className={`${size === "small" ? "h-3 w-3" : "h-4 w-4"} text-yellow-600 dark:text-yellow-400`} />,
        text: "Medium"
      },
      high: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
        icon: <Flag className={`${size === "small" ? "h-3 w-3" : "h-4 w-4"} text-red-600 dark:text-red-400`} />,
        text: "High"
      }
    }

    const { color, icon, text } = config[priority]

    return (
      <Badge 
        variant="outline" 
        className={`${color} border ${size === "small" ? "text-xs px-2 py-1" : "text-sm px-3 py-1"} flex items-center gap-1 font-medium`}
      >
        {icon}
        {size === "small" ? (priority === 'high' ? 'H' : priority === 'medium' ? 'M' : 'L') : text}
      </Badge>
    )
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
    <Card className="shadow-lg border border-border bg-card rounded-2xl h-full overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            To-Do List
          </CardTitle>
          <Badge variant="secondary" className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {stats?.completed_todos || 0}/{stats?.total_todos || 0} completed
          </Badge>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error: {error}
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        {/* Add Todo Form */}
        {isAddingTodo ? (
          <div className="space-y-4 p-4 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
            {/* Client Dropdown - Moved to top */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client (optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
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
              className="font-medium border-2 focus:border-blue-500 dark:focus:border-blue-400"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as "low" | "medium" | "high")}
                className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-sm border-2 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>
            <Input
              placeholder="Category (optional)"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              className="border-2 focus:border-blue-500 dark:focus:border-blue-400"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddTodo} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
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
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 border-2 border-blue-200 dark:border-blue-800"
          >
            <Plus className="h-4 w-4" />
            Add New Todo
          </Button>
        )}

        {/* Enhanced Todo List with Gridlines */}
        <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 w-1/3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Task
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 w-1/6">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Client
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 w-20">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Priority
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 w-24">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      Due Date
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 w-1/6">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white w-20">
                    {/* Actions column - icons only */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {todos.map((todo: TodoWithClient, index: number) => (
                  <tr 
                    key={todo.id}
                    className={`border-b border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 ${
                      todo.completed ? 'opacity-75 bg-gray-50/50 dark:bg-gray-800/50' : 
                      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'
                    } ${
                      isOverdue(todo.due_date || '') && !todo.completed ? 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 align-top border-r border-gray-200 dark:border-gray-700">
                      {editingId === todo.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing()
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          className="font-medium border-2 focus:border-blue-500 dark:focus:border-blue-400"
                          placeholder="Task title"
                        />
                      ) : (
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => handleToggleTodo(todo.id)}
                            className="mt-1 flex-shrink-0 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <span className={`font-medium break-words leading-relaxed ${
                            todo.completed 
                              ? 'line-through text-gray-500 dark:text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {todo.title}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top border-r border-gray-200 dark:border-gray-700">
                      {editingId === todo.id ? (
                        <select
                          value={editClientId ?? ''}
                          onChange={(e) => setEditClientId(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                        >
                          <option value="">No client</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        todo.client_id ? (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-900 dark:text-white break-words font-medium">
                              {getClientName(todo.client_id)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">-</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 align-top border-r border-gray-200 dark:border-gray-700">
                      {editingId === todo.id ? (
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <PriorityBadge priority={todo.priority} size="small" />
                      )}
                    </td>
                    <td className="py-3 px-4 align-top border-r border-gray-200 dark:border-gray-700">
                      {editingId === todo.id ? (
                        <Input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="text-sm border-2 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      ) : (
                        todo.due_date ? (
                          <div className="flex items-center gap-2">
                            {isOverdue(todo.due_date) && !todo.completed && (
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className={`text-sm break-words font-medium ${
                              isOverdue(todo.due_date) && !todo.completed 
                                ? 'text-red-600 dark:text-red-400' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {formatDueDate(todo.due_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">-</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 align-top border-r border-gray-200 dark:border-gray-700">
                      {editingId === todo.id ? (
                        <Input
                          placeholder="Category"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="text-sm border-2 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      ) : (
                        todo.category ? (
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                            {todo.category}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">-</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {editingId === todo.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            onClick={saveEditing}
                            disabled={savingEdit}
                            title="Save changes"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={cancelEditing}
                            disabled={savingEdit}
                            title="Cancel editing"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            onClick={() => startEditing(todo)}
                            title="Edit todo"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                            onClick={() => handleDeleteTodo(todo.id)}
                            title="Delete todo"
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
          </div>
          
          {todos.length === 0 && !todosLoading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-blue-400" />
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">No todos yet</h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">Add your first todo to get started and stay organized!</p>
              <Button 
                onClick={() => setIsAddingTodo(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Todo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TodoList
