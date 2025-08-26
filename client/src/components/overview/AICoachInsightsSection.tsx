import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap, Star, Clock, Users, BarChart3, Lightbulb, Activity, ArrowRight, MessageSquare, Settings, Dumbbell, Utensils, Heart, Timer, Award, ThumbsUp } from "lucide-react"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"
import { useToast } from "@/hooks/use-toast"
import { AICoachInsightsState } from "@/types/ai-coach-insights"

interface AICoachInsightsSectionProps {
  lastAIRecommendation: any
  onViewFullAnalysis: () => void
  client?: any
  trainerNotes?: string
  setLastAIRecommendation?: (analysis: any) => void
  aiCoachInsights?: AICoachInsightsState
}

interface ActionItem {
  id: string
  text: string
  completed: boolean
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
  timeframe?: string
}

export function AICoachInsightsSection({ 
  lastAIRecommendation, 
  onViewFullAnalysis, 
  client, 
  trainerNotes,
  setLastAIRecommendation,
  aiCoachInsights
}: AICoachInsightsSectionProps) {
  const { toast } = useToast()
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  
  // State to track completed actions
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const handleActionToggle = (actionId: string) => {
    const newCompleted = new Set(completedActions)
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId)
    } else {
      newCompleted.add(actionId)
    }
    setCompletedActions(newCompleted)
  }

  // Helper function to convert trainer notes to proper format for AI analysis
  const convertTrainerNotesToText = (notes: string): string => {
    if (!notes || typeof notes !== 'string') {
      return ''
    }
    
    try {
      // Try to parse as JSON (structured notes format)
      const parsedNotes = JSON.parse(notes)
      if (Array.isArray(parsedNotes)) {
        // Convert array of note objects to text
        return parsedNotes.map(note => 
          `Date: ${note.date}\nNotes: ${note.notes}`
        ).join('\n\n')
      }
    } catch (error) {
      // If not JSON, treat as plain text
      console.log('📝 Notes are not JSON, treating as plain text')
    }
    
    // Return as-is if it's already plain text
    return notes
  }

  // Function to generate AI analysis from trainer notes
  const handleGenerateAIAnalysis = async () => {
    // Use unified AI Coach Insights if available, otherwise fall back to individual props
    const currentClient = client || aiCoachInsights?.client;
    const currentTrainerNotes = aiCoachInsights?.trainerNotes || trainerNotes;
    const currentSetLastAIRecommendation = aiCoachInsights?.setLastAIRecommendation || setLastAIRecommendation;
    const currentIsGeneratingAnalysis = aiCoachInsights?.isGeneratingAnalysis;
    const currentSetIsGeneratingAnalysis = aiCoachInsights?.setIsGeneratingAnalysis;
    
    console.log('🔍 AI Analysis Debug Info:')
    console.log('👤 client:', currentClient)
    console.log('👤 client?.client_id:', currentClient?.client_id)
    console.log('📝 trainerNotes:', currentTrainerNotes)
    console.log('📝 trainerNotes type:', typeof currentTrainerNotes)
    console.log('📝 trainerNotes length:', currentTrainerNotes?.length)
    console.log('🔧 setLastAIRecommendation:', currentSetLastAIRecommendation)
    console.log('🔧 setLastAIRecommendation type:', typeof currentSetLastAIRecommendation)
    console.log('🔧 aiCoachInsights available:', !!aiCoachInsights)
    
    // Create a fallback function if setLastAIRecommendation is not provided
    const updateAIRecommendation = currentSetLastAIRecommendation || ((analysis: any) => {
      console.log('📊 AI Analysis completed (no setter function):', analysis)
      toast({
        title: "AI Analysis Complete",
        description: "Analysis generated successfully, but cannot be saved to parent component.",
      })
    })
    
    if (!currentClient?.client_id || !currentTrainerNotes) {
      console.log('❌ Validation failed:')
      console.log('  - client?.client_id:', !!currentClient?.client_id)
      console.log('  - trainerNotes:', !!currentTrainerNotes)
      
      toast({
        title: "Cannot Generate Analysis",
        description: "Please ensure trainer notes are available and client information is loaded.",
        variant: "destructive"
      })
      return
    }
    
    // Check if trainer notes have sufficient content
    if (currentTrainerNotes.trim().length < 20) {
      console.log('❌ Trainer notes too short:', currentTrainerNotes.trim().length, 'characters')
      toast({
        title: "Insufficient Notes",
        description: "Please add more trainer notes (minimum 20 characters) before generating AI analysis.",
        variant: "destructive"
      })
      return
    }

    // Use unified state management if available
    if (currentSetIsGeneratingAnalysis) {
      currentSetIsGeneratingAnalysis(true);
    } else {
      setIsGeneratingAnalysis(true);
    }
    
    try {
      console.log('🤖 Generating AI analysis from trainer notes...')
      
      // Convert trainer notes to proper format
      const notesText = convertTrainerNotesToText(currentTrainerNotes)
      console.log('📝 Converted notes text:', notesText)
      console.log('📝 Converted notes length:', notesText.length)
      
      const result = await performComprehensiveCoachAnalysis(
        currentClient.client_id,
        notesText,
        '' // No todo items for now
      )

      if (result.success && result.analysis) {
        updateAIRecommendation(result.analysis)
        toast({
          title: "AI Analysis Complete",
          description: "Comprehensive analysis has been generated based on your trainer notes.",
        })
      } else {
        console.error('❌ AI analysis failed:', result.message)
        toast({
          title: "AI Analysis Failed",
          description: result.message || "Failed to generate AI analysis",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('❌ Error generating AI analysis:', error)
      toast({
        title: "AI Analysis Error",
        description: error.message || "Failed to generate AI analysis",
        variant: "destructive"
      })
    } finally {
      // Use unified state management if available
      if (currentSetIsGeneratingAnalysis) {
        currentSetIsGeneratingAnalysis(false);
      } else {
        setIsGeneratingAnalysis(false);
      }
    }
  }

  // Helper function to extract action items
  const getActionItems = (): ActionItem[] => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    const actions = currentRecommendation?.action_plan?.immediate_actions || 
                  currentRecommendation?.immediate_actions || 
                  currentRecommendation?.action_items?.immediate_actions || 
                  currentRecommendation?.recommendations?.immediate_actions ||
                  currentRecommendation?.actions ||
                  [];
    
    return actions.map((action: any, index: number) => ({
      id: `action-${index}`,
      text: typeof action === 'string' ? action : 
            typeof action === 'object' && action.action ? action.action :
            String(action),
      completed: completedActions.has(`action-${index}`),
      priority: action.priority || 'Medium',
      category: action.category || 'General',
      timeframe: action.timeframe || 'This week'
    }));
  }

  // Helper function to get progress assessment
  const getProgressAssessment = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.progress_assessment || 
           currentRecommendation?.progress_assessment ||
           currentRecommendation?.assessment?.progress;
  }

  // Helper function to get positive developments
  const getPositiveDevelopments = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.positive_developments || 
           currentRecommendation?.positive_developments ||
           currentRecommendation?.assessment?.positive_developments ||
           [];
  }

  // Helper function to get immediate concerns
  const getImmediateConcerns = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.immediate_concerns || 
           currentRecommendation?.immediate_concerns ||
           [];
  }

  // Helper function to get weekly focus areas
  const getWeeklyFocusAreas = () => {
    return lastAIRecommendation?.action_plan?.weekly_focus || 
           lastAIRecommendation?.weekly_focus ||
           [];
  }

  // Helper function to get recommendations
  const getRecommendations = () => {
    return lastAIRecommendation?.recommendations || 
           lastAIRecommendation?.coaching_recommendations ||
           {};
  }

  // Helper function to get insights
  const getInsights = () => {
    return lastAIRecommendation?.insights || 
           lastAIRecommendation?.client_insights ||
           {};
  }

  // Helper function to get next session focus
  const getNextSessionFocus = () => {
    return lastAIRecommendation?.next_session_focus || 
           lastAIRecommendation?.next_session_plan ||
           {};
  }

  // Helper function to get coaching recommendations
  const getCoachingRecommendations = () => {
    return lastAIRecommendation?.coaching_recommendations || 
           lastAIRecommendation?.recommendations?.coaching ||
           {};
  }

  // Helper function to get workout plan changes
  const getWorkoutPlanChanges = () => {
    return lastAIRecommendation?.workout_plan_changes || {};
  }

  // Helper function to get nutritional plan changes
  const getNutritionalPlanChanges = () => {
    return lastAIRecommendation?.nutritional_plan_changes || {};
  }

  const actionItems = getActionItems()
  const progressAssessment = getProgressAssessment()
  const positiveDevelopments = getPositiveDevelopments()
  const immediateConcerns = getImmediateConcerns()
  const weeklyFocusAreas = getWeeklyFocusAreas()
  const recommendations = getRecommendations()
  const insights = getInsights()
  const nextSessionFocus = getNextSessionFocus()
  const coachingRecommendations = getCoachingRecommendations()
  const workoutPlanChanges = getWorkoutPlanChanges()
  const nutritionalPlanChanges = getNutritionalPlanChanges()

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">AI Coach Insights</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAIAnalysis}
                disabled={!client?.client_id || !trainerNotes || isGeneratingAnalysis || aiCoachInsights?.isGeneratingAnalysis}
                className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
              >
                {(isGeneratingAnalysis || aiCoachInsights?.isGeneratingAnalysis) ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Analysis
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔍 Manual Debug Check:')
                  console.log('👤 client:', client)
                  console.log('👤 client?.client_id:', client?.client_id)
                  console.log('📝 trainerNotes:', trainerNotes)
                  console.log('📝 trainerNotes type:', typeof trainerNotes)
                  console.log('📝 trainerNotes length:', trainerNotes?.length)
                  console.log('🔧 setLastAIRecommendation:', setLastAIRecommendation)
                  console.log('🔧 setLastAIRecommendation type:', typeof setLastAIRecommendation)
                }}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                Debug
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Action Plan Card - Moved to top */}
      {actionItems.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Target className="h-5 w-5" />
              Action Plan
              <Badge variant="secondary" className="ml-2">
                {actionItems.filter(item => item.completed).length}/{actionItems.length} Completed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleActionToggle(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-medium ${item.completed ? 'line-through text-gray-500' : 'text-blue-800 dark:text-blue-300'}`}>
                        {item.text}
                      </span>
                      <div className="flex gap-2 ml-2">
                        {item.priority && (
                          <Badge 
                            variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.timeframe && (
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Clock className="h-3 w-3" />
                        {item.timeframe}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Assessment Card */}
      {lastAIRecommendation?.summary?.progress_assessment && (
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="h-5 w-5" />
              Progress Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {lastAIRecommendation.summary.progress_assessment}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Card */}
      {lastAIRecommendation?.summary?.key_insights && lastAIRecommendation.summary.key_insights.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.key_insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Status Card */}
      {lastAIRecommendation?.summary?.client_status && (
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Users className="h-5 w-5" />
              Client Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              {lastAIRecommendation.summary.client_status}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workout Plan Changes Card */}
      {Object.keys(workoutPlanChanges).length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Dumbbell className="h-5 w-5" />
              Workout Plan Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutPlanChanges.exercise_modifications && workoutPlanChanges.exercise_modifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Exercise Modifications</h4>
                  {workoutPlanChanges.exercise_modifications.map((mod: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{mod.exercise}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{mod.change}</p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        <p><strong>Timeline:</strong> {mod.timeline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {workoutPlanChanges.intensity_adjustments && workoutPlanChanges.intensity_adjustments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Intensity Adjustments</h4>
                  {workoutPlanChanges.intensity_adjustments.map((adj: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{adj.area}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{adj.adjustment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutritional Plan Changes Card */}
      {Object.keys(nutritionalPlanChanges).length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <Utensils className="h-5 w-5" />
              Nutritional Plan Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nutritionalPlanChanges.dietary_adjustments && nutritionalPlanChanges.dietary_adjustments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Dietary Adjustments</h4>
                  {nutritionalPlanChanges.dietary_adjustments.map((adj: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{adj.nutrient}</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">{adj.adjustment}</p>
                      {adj.food_sources && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          <strong>Food Sources:</strong> {adj.food_sources}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {nutritionalPlanChanges.meal_timing_changes && nutritionalPlanChanges.meal_timing_changes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Meal Timing Changes</h4>
                  {nutritionalPlanChanges.meal_timing_changes.map((timing: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{timing.meal}</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">{timing.change}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Recommendations Card */}
      {Object.keys(recommendations).length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Award className="h-5 w-5" />
              Enhanced Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.training_recommendations && recommendations.training_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Training Recommendations
                  </h4>
                  {recommendations.training_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {recommendations.nutrition_recommendations && recommendations.nutrition_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Nutrition Recommendations
                  </h4>
                  {recommendations.nutrition_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {recommendations.lifestyle_recommendations && recommendations.lifestyle_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Lifestyle Recommendations
                  </h4>
                  {recommendations.lifestyle_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Immediate Concerns Card */}
      {lastAIRecommendation?.summary?.immediate_concerns && lastAIRecommendation.summary.immediate_concerns.length > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Immediate Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.immediate_concerns.map((concern: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-red-700 dark:text-red-300">{concern}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positive Developments Card */}
      {lastAIRecommendation?.summary?.positive_developments && lastAIRecommendation.summary.positive_developments.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ThumbsUp className="h-5 w-5" />
              Positive Developments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.positive_developments.map((development: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-700 dark:text-green-300">{development}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Session Plan Card */}
      {lastAIRecommendation?.next_session_plan && (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <Calendar className="h-5 w-5" />
              Next Session Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.next_session_plan.primary_objectives && lastAIRecommendation.next_session_plan.primary_objectives.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Primary Objectives</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.primary_objectives.map((objective: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.next_session_plan.specific_exercises && lastAIRecommendation.next_session_plan.specific_exercises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Specific Exercises</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.specific_exercises.map((exercise: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{exercise}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.next_session_plan.discussion_topics && lastAIRecommendation.next_session_plan.discussion_topics.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Discussion Topics</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.discussion_topics.map((topic: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Insights Card */}
      {lastAIRecommendation?.client_insights && (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-300">
              <Brain className="h-5 w-5" />
              Client Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.client_insights.behavioral_patterns && lastAIRecommendation.client_insights.behavioral_patterns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Behavioral Patterns</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.behavioral_patterns.map((pattern: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.client_insights.engagement_level && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Engagement Level</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{lastAIRecommendation.client_insights.engagement_level}</p>
                </div>
              )}

              {lastAIRecommendation.client_insights.potential_barriers && lastAIRecommendation.client_insights.potential_barriers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Potential Barriers</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.potential_barriers.map((barrier: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{barrier}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.client_insights.success_factors && lastAIRecommendation.client_insights.success_factors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Success Factors</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.success_factors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coaching Recommendations Card */}
      {lastAIRecommendation?.coaching_recommendations && (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-300">
              <MessageSquare className="h-5 w-5" />
              Coaching Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.coaching_recommendations.training_modifications && lastAIRecommendation.coaching_recommendations.training_modifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Training Modifications</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.training_modifications.map((mod: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{mod}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.coaching_recommendations.communication_strategy && lastAIRecommendation.coaching_recommendations.communication_strategy.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Communication Strategy</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.communication_strategy.map((strategy: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.coaching_recommendations.motivation_techniques && lastAIRecommendation.coaching_recommendations.motivation_techniques.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Motivation Techniques</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.motivation_techniques.map((technique: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{technique}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Focus Areas Card */}
      {weeklyFocusAreas.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Calendar className="h-5 w-5" />
              Weekly Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyFocusAreas.map((focus: any, index: number) => (
                <div key={index} className="p-4 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h5 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {focus.focus_area || `Focus Area ${index + 1}`}
                  </h5>
                  {focus.specific_actions && Array.isArray(focus.specific_actions) && (
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Specific Actions:</h6>
                      <div className="space-y-1">
                        {focus.specific_actions.map((action: string, actionIndex: number) => (
                          <div key={actionIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {focus.success_metrics && Array.isArray(focus.success_metrics) && (
                    <div className="space-y-2 mt-3">
                      <h6 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Success Metrics:</h6>
                      <div className="space-y-1">
                        {focus.success_metrics.map((metric: string, metricIndex: number) => (
                          <div key={metricIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">
                              {metric}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!lastAIRecommendation && (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <Brain className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No AI Analysis Available
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Save trainer notes to generate comprehensive AI analysis with workout and nutrition recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 