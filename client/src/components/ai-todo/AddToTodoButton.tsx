// Add to Todo Button Component
// Simple component for converting individual AI recommendations to todos

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Plus, CheckCircle, Sparkles, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useTodos } from '@/hooks/use-todos'
import { convertAIRecommendationToTodo, getAvailableCategories } from '@/utils/ai-todo-converter'
import { AIRecommendationToTodo } from '@/types/todo'
import { supabase } from '@/lib/supabase'

interface AddToTodoButtonProps {
  recommendation: any
  clientId?: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default'
  className?: string
  onAddSuccess?: (recommendation?: any) => void
  disabled?: boolean
}

export function AddToTodoButton({ 
  recommendation, 
  clientId, 
  variant = 'outline',
  size = 'sm',
  className = '',
  onAddSuccess,
  disabled = false
}: AddToTodoButtonProps) {
  const { toast } = useToast()
  const { createTodo } = useTodos()
  
  const [showDialog, setShowDialog] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium')
  
  // New editable fields
  const [editedTitle, setEditedTitle] = useState<string>('')
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(false)

  // Get available categories
  const availableCategories = getAvailableCategories()

  // Get default category from AI recommendation
  const defaultCategory = recommendation.category ? 
    availableCategories.find(cat => cat.toLowerCase() === recommendation.category.toLowerCase()) || 'personal' 
    : 'personal'

  // Initialize all fields when dialog opens
  React.useEffect(() => {
    if (showDialog) {
      if (!selectedCategory) {
        setSelectedCategory(defaultCategory)
      }
      if (!editedTitle) {
        setEditedTitle(getTitle())
      }
      // Set default priority from recommendation
      const aiPriority = recommendation.priority?.toLowerCase()
      if (aiPriority && ['low', 'medium', 'high'].includes(aiPriority)) {
        setSelectedPriority(aiPriority as 'low' | 'medium' | 'high')
      }
    }
  }, [showDialog, selectedCategory, defaultCategory, editedTitle, recommendation])

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      // Reset all fields
      setEditedTitle('')
      setSelectedDueDate(undefined)
      setIsEditMode(false)
      setSelectedCategory('')
      setSelectedPriority('medium')
    }
  }

    // Handle conversion to todo with enhanced duplicate prevention
  const handleConvertToTodo = async () => {
    console.log(`🚀 Starting todo creation for recommendation:`, recommendation)
    setIsConverting(true)

    try {
      // Enhanced duplicate checking with current title
      const existingTodos = await checkExistingTodos({ 
        ...recommendation, 
        text: editedTitle.trim() || getTitle() 
      }, clientId)
      if (existingTodos.length > 0) {
        console.log(`⚠️ Found ${existingTodos.length} existing similar todos:`, existingTodos)
        
        // Show more detailed duplicate information
        const duplicateTitles = existingTodos.map(todo => todo.title).join(', ')
        toast({
          title: "Similar Todo Already Exists",
          description: `Found ${existingTodos.length} similar todo(s): "${duplicateTitles}". Please check your existing todos.`,
          variant: "destructive"
        })
        handleDialogClose(false)
        return
      }

      console.log(`✅ No duplicates found, proceeding with creation`)

      // Create custom todo data with edited values
      const todoData = {
        title: editedTitle.trim() || getTitle(),
        client_id: clientId,
        priority: selectedPriority,
        category: selectedCategory,
        due_date: selectedDueDate ? selectedDueDate.toISOString() : null,
        source: 'ai_recommendation',
        ai_context: JSON.stringify({
          original_recommendation: recommendation,
          edited_by_user: isEditMode,
          created_at: new Date().toISOString()
        })
      }

      console.log(`📝 Creating todo with data:`, todoData)
      const success = await createTodo(todoData)

      if (success) {
        console.log(`✅ Todo created successfully:`, success)
        toast({
          title: "Todo Created Successfully",
          description: `"${todoData.title}" has been added to your todo list.`,
        })
        handleDialogClose(false)
        onAddSuccess?.(recommendation) // Call success callback with recommendation data
      } else {
        console.log(`❌ Todo creation failed`)
        toast({
          title: "Failed to Create Todo",
          description: "There was an error creating the todo item. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Error converting recommendation to todo:', error)
      toast({
        title: "Conversion Error",
        description: "An error occurred while creating the todo item. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  // Enhanced duplicate checking with fuzzy matching
  const checkExistingTodos = async (recommendation: any, clientId?: number): Promise<any[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const recommendationTitle = getTitle()
      const normalizedTitle = recommendationTitle.toLowerCase().trim()

      // Query existing todos for this client with AI recommendations
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .eq('source', 'ai_recommendation')

      if (error) {
        console.error('Error checking existing todos:', error)
        return []
      }

      if (!data || data.length === 0) return []

      // Enhanced duplicate detection with fuzzy matching
      const duplicates = data.filter(todo => {
        const todoTitle = todo.title.toLowerCase().trim()
        
        // Exact match
        if (todoTitle === normalizedTitle) return true
        
                 // Similar match (70% similarity threshold for better detection)
         const similarity = calculateSimilarity(todoTitle, normalizedTitle)
         return similarity > 0.7
      })

      console.log(`🔍 Found ${duplicates.length} potential duplicates for: "${recommendationTitle}"`)
      return duplicates
    } catch (error) {
      console.error('Error checking existing todos:', error)
      return []
    }
  }

  // Simple similarity calculation function
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  // Levenshtein distance calculation for similarity
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Extract title from recommendation
  const getTitle = () => {
    return recommendation.action || recommendation.recommendation || recommendation.text || 'AI Recommendation'
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        className={`text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus className="h-3 w-3 mr-1" />
        {disabled ? 'Added' : 'Add Todo'}
      </Button>

      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Add AI Recommendation to Todo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Review and customize the todo details before adding
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5">
            {/* Editable Todo Details */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Todo Details</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  {isEditMode ? 'Disable Edit' : 'Enable Edit'}
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Task Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter task title..."
                  disabled={!isEditMode}
                  className={cn(
                    "transition-all duration-200",
                    !isEditMode && "bg-gray-50 dark:bg-gray-800"
                  )}
                />
              </div>

              {/* Category, Priority, and Due Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select value={selectedPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setSelectedPriority(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          High Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Due Date (Optional)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDueDate ? format(selectedDueDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDueDate}
                        onSelect={setSelectedDueDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                      {selectedDueDate && (
                        <div className="p-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDueDate(undefined)}
                            className="w-full"
                          >
                            Clear Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isConverting}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToTodo}
              disabled={isConverting || !editedTitle.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              {isConverting ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Creating Todo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Todo List
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
