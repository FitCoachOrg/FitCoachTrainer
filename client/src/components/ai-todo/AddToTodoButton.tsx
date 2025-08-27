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

  // Handle conversion to todo
  const handleConvertToTodo = async () => {
    setIsConverting(true)
    
    try {
      const todoData = convertAIRecommendationToTodo(
        recommendation,
        clientId,
        selectedCategory
      )

      // Override priority if user selected different one
      if (selectedPriority !== todoData.priority) {
        todoData.priority = selectedPriority
      }

      const success = await createTodo(todoData)
      
      if (success) {
        toast({
          title: "Todo Created Successfully",
          description: "AI recommendation has been added to your todo list.",
        })
        setShowDialog(false)
        onAddSuccess?.() // Call success callback
      } else {
        toast({
          title: "Failed to Create Todo",
          description: "There was an error creating the todo item.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error converting recommendation to todo:', error)
      toast({
        title: "Conversion Error",
        description: "An error occurred while creating the todo item.",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
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
