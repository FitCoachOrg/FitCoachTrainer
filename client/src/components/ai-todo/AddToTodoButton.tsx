// Add to Todo Button Component
// Simple component for converting individual AI recommendations to todos

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle, Sparkles } from 'lucide-react'
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
  onAddSuccess?: () => void
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

  // Get available categories
  const availableCategories = getAvailableCategories()

  // Get default category from AI recommendation
  const defaultCategory = recommendation.category ? 
    availableCategories.find(cat => cat.toLowerCase() === recommendation.category.toLowerCase()) || 'personal' 
    : 'personal'

  // Initialize selected category
  React.useEffect(() => {
    if (!selectedCategory) {
      setSelectedCategory(defaultCategory)
    }
  }, [defaultCategory, selectedCategory])

    // Handle conversion to todo with enhanced duplicate prevention
  const handleConvertToTodo = async () => {
    console.log(`🚀 Starting todo creation for recommendation:`, recommendation)
    setIsConverting(true)

    try {
      // Enhanced duplicate checking
      const existingTodos = await checkExistingTodos(recommendation, clientId)
      if (existingTodos.length > 0) {
        console.log(`⚠️ Found ${existingTodos.length} existing similar todos:`, existingTodos)
        
        // Show more detailed duplicate information
        const duplicateTitles = existingTodos.map(todo => todo.title).join(', ')
        toast({
          title: "Similar Todo Already Exists",
          description: `Found ${existingTodos.length} similar todo(s): "${duplicateTitles}". Please check your existing todos.`,
          variant: "destructive"
        })
        setShowDialog(false)
        return
      }

      console.log(`✅ No duplicates found, proceeding with creation`)

      const todoData = convertAIRecommendationToTodo(
        recommendation,
        clientId,
        selectedCategory
      )

      // Override priority if user selected different one
      if (selectedPriority !== todoData.priority) {
        todoData.priority = selectedPriority
      }

      console.log(`📝 Creating todo with data:`, todoData)
      const success = await createTodo(todoData)

      if (success) {
        console.log(`✅ Todo created successfully:`, success)
        toast({
          title: "Todo Created Successfully",
          description: `"${todoData.title}" has been added to your todo list.`,
        })
        setShowDialog(false)
        onAddSuccess?.() // Call success callback
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Add to Todo
          </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Task
              </Label>
              <p className="text-sm text-gray-900 dark:text-white mt-1 line-clamp-2">
                {getTitle()}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {recommendation.priority && (
                  <Badge 
                    variant={recommendation.priority === 'High' ? 'destructive' : recommendation.priority === 'Medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {recommendation.priority}
                  </Badge>
                )}
                {recommendation.category && (
                  <Badge variant="outline" className="text-xs">
                    {recommendation.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Category and Priority Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={selectedPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setSelectedPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToTodo}
              disabled={isConverting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConverting ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Todo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
