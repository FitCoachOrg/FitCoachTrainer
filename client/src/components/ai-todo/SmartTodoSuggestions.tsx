// Smart Todo Suggestions Component
// Clean and minimalistic component for converting AI recommendations to todos

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Brain, 
  Plus, 
  Target, 
  Clock, 
  CheckCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTodos } from '@/hooks/use-todos'
import { 
  extractActionableRecommendations, 
  convertAIRecommendationToTodo,
  getAvailableCategories 
} from '@/utils/ai-todo-converter'
import { AIRecommendationToTodo } from '@/types/todo'

interface SmartTodoSuggestionsProps {
  aiAnalysis: any
  clientId?: number
  onClose?: () => void
  onTodosCreated?: (todoIds: string[]) => void
}

export function SmartTodoSuggestions({ 
  aiAnalysis, 
  clientId, 
  onClose,
  onTodosCreated
}: SmartTodoSuggestionsProps) {
  const { toast } = useToast()
  const { createTodo } = useTodos()
  
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set())
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [categoryMappings, setCategoryMappings] = useState<Record<string, string>>({})

  // Extract actionable recommendations from AI analysis
  const recommendations = useMemo(() => {
    return extractActionableRecommendations(aiAnalysis)
  }, [aiAnalysis])

  // Get available categories
  const availableCategories = useMemo(() => {
    return getAvailableCategories()
  }, [])

  // Handle recommendation selection
  const handleRecommendationToggle = (recommendationId: string) => {
    const newSelected = new Set(selectedRecommendations)
    if (newSelected.has(recommendationId)) {
      newSelected.delete(recommendationId)
    } else {
      newSelected.add(recommendationId)
    }
    setSelectedRecommendations(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecommendations.size === recommendations.length) {
      setSelectedRecommendations(new Set())
    } else {
      setSelectedRecommendations(new Set(recommendations.map((_, index) => index.toString())))
    }
  }

  // Handle category mapping change
  const handleCategoryChange = (recommendationId: string, category: string) => {
    setCategoryMappings(prev => ({
      ...prev,
      [recommendationId]: category
    }))
  }

  // Convert selected recommendations to todos
  const handleConvertToTodos = async () => {
    if (selectedRecommendations.size === 0) {
      toast({
        title: "No recommendations selected",
        description: "Please select at least one recommendation to convert to a todo.",
        variant: "destructive"
      })
      return
    }

    setIsConverting(true)
    
    try {
      const selectedRecs = Array.from(selectedRecommendations).map(id => 
        recommendations[parseInt(id)]
      )

      let successCount = 0
      let errorCount = 0

      for (const recommendation of selectedRecs) {
        try {
          const todoData = convertAIRecommendationToTodo(
            recommendation,
            clientId,
            categoryMappings[recommendations.indexOf(recommendation).toString()]
          )

          const success = await createTodo(todoData)
          if (success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error('Error converting recommendation to todo:', error)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Todos Created Successfully",
          description: `Successfully created ${successCount} todos from AI recommendations.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
        })
        
        // Notify parent component about created todos
        const createdTodoIds = selectedRecs.map((_, index) => `action-${recommendations.indexOf(selectedRecs[index])}`)
        onTodosCreated?.(createdTodoIds)
        
        // Reset selection and close
        setSelectedRecommendations(new Set())
        setShowPreviewDialog(false)
        onClose?.()
      } else {
        toast({
          title: "Conversion Failed",
          description: "Failed to create todos from AI recommendations.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error converting recommendations:', error)
      toast({
        title: "Conversion Error",
        description: "An error occurred while converting recommendations to todos.",
        variant: "destructive"
      })
    } finally {
      setIsConverting(false)
    }
  }

  // Generate preview todos
  const previewTodos = useMemo(() => {
    return Array.from(selectedRecommendations).map(id => {
      const recommendation = recommendations[parseInt(id)]
      return convertAIRecommendationToTodo(
        recommendation,
        clientId,
        categoryMappings[id]
      )
    })
  }, [selectedRecommendations, recommendations, clientId, categoryMappings])

  if (recommendations.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 opacity-50" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No AI Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Generate AI analysis to see actionable recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                AI Todo Suggestions
              </span>
            </div>
            <Badge variant="secondary" className="ml-2">
              {recommendations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Select All Button */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {selectedRecommendations.size === recommendations.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedRecommendations.size > 0 && (
              <Button
                onClick={() => setShowPreviewDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Selected ({selectedRecommendations.size})
              </Button>
            )}
          </div>

          {/* Recommendations List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recommendations.map((recommendation, index) => {
              const recommendationId = index.toString()
              const isSelected = selectedRecommendations.has(recommendationId)
              const title = recommendation.action || recommendation.recommendation || recommendation.text || 'AI Recommendation'
              
              return (
                <div
                  key={recommendationId}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleRecommendationToggle(recommendationId)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-medium ${
                        isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {title}
                      </span>
                      
                      <div className="flex gap-2 ml-2">
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
                    
                    {recommendation.timeframe && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        {recommendation.timeframe}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Preview Todos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {previewTodos.map((todo, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {todo.title}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <Badge 
                        variant={todo.priority === 'high' ? 'destructive' : todo.priority === 'medium' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {todo.priority}
                      </Badge>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </label>
                      <Select
                        value={todo.category || 'personal'}
                        onValueChange={(value) => handleCategoryChange(index.toString(), value)}
                      >
                        <SelectTrigger className="mt-1">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToTodos}
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
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Create {previewTodos.length}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
