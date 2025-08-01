import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap, Star, Clock, Users, BarChart3, Lightbulb, Activity, ArrowRight, MessageSquare, Settings, Dumbbell, Utensils, Heart, Timer, Award } from "lucide-react"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"
import { useToast } from "@/hooks/use-toast"

interface AICoachInsightsSectionProps {
  lastAIRecommendation: any
  onViewFullAnalysis: () => void
  client?: any
  trainerNotes?: string
  setLastAIRecommendation?: (analysis: any) => void
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
  setLastAIRecommendation 
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

  // Function to generate AI analysis from trainer notes
  const handleGenerateAIAnalysis = async () => {
    if (!client?.client_id || !trainerNotes || !setLastAIRecommendation) {
      toast({
        title: "Cannot Generate Analysis",
        description: "Please ensure trainer notes are available and client information is loaded.",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingAnalysis(true)
    
    try {
      console.log('🤖 Generating AI analysis from trainer notes...')
      
      const result = await performComprehensiveCoachAnalysis(
        client.client_id,
        trainerNotes,
        '' // No todo items for now
      )

      if (result.success && result.analysis) {
        setLastAIRecommendation(result.analysis)
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
      setIsGeneratingAnalysis(false)
    }
  }

  // Helper function to extract action items
  const getActionItems = (): ActionItem[] => {
    const actions = lastAIRecommendation?.action_plan?.immediate_actions || 
                  lastAIRecommendation?.immediate_actions || 
                  lastAIRecommendation?.action_items?.immediate_actions || 
                  lastAIRecommendation?.recommendations?.immediate_actions ||
                  lastAIRecommendation?.actions ||
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
    return lastAIRecommendation?.summary?.progress_assessment || 
           lastAIRecommendation?.progress_assessment ||
           lastAIRecommendation?.assessment?.progress;
  }

  // Helper function to get positive developments
  const getPositiveDevelopments = () => {
    return lastAIRecommendation?.summary?.positive_developments || 
           lastAIRecommendation?.positive_developments ||
           lastAIRecommendation?.assessment?.positive_developments ||
           [];
  }

  // Helper function to get immediate concerns
  const getImmediateConcerns = () => {
    return lastAIRecommendation?.summary?.immediate_concerns || 
           lastAIRecommendation?.immediate_concerns ||
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
    <div className="h-full overflow-y-auto space-y-6 pr-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAIAnalysis}
              disabled={!client?.client_id || !trainerNotes || isGeneratingAnalysis}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              {isGeneratingAnalysis ? (
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
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Progress Assessment Card */}
      {progressAssessment && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <BarChart3 className="h-5 w-5" />
              Progress Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300 leading-relaxed">
                {typeof progressAssessment === 'string' ? progressAssessment : 'Progress assessment available'}
              </p>
            </div>
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
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{mod.recommended_change}</p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        <p><strong>Timeline:</strong> {mod.implementation_timeline}</p>
                        <p><strong>Rationale:</strong> {mod.rationale}</p>
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
                        <Badge variant="outline" className="text-xs">{adj.recommended_level}</Badge>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{adj.reason}</p>
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
                        <Badge variant="outline" className="text-xs">{adj.recommended_intake}</Badge>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">{adj.rationale}</p>
                      {adj.food_sources && adj.food_sources.length > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          <strong>Food Sources:</strong> {adj.food_sources.join(', ')}
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
                        <Badge variant="outline" className="text-xs">{timing.recommended_timing}</Badge>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">{timing.reason}</p>
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
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">{rec.expected_impact}</p>
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
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">{rec.expected_impact}</p>
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
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">{rec.expected_impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Plan Card */}
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

      {/* Immediate Concerns Card */}
      {immediateConcerns.length > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Immediate Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {immediateConcerns.map((concern: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <span className="text-sm text-red-800 dark:text-red-300">
                    {typeof concern === 'string' ? concern : String(concern)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positive Developments Card */}
      {positiveDevelopments.length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="h-5 w-5" />
              Positive Developments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {positiveDevelopments.map((dev: any, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex-shrink-0 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <span className="text-sm text-emerald-800 dark:text-emerald-300">
                    {typeof dev === 'string' ? dev : 
                     typeof dev === 'object' && dev.development ? dev.development :
                     String(dev)}
                  </span>
                </div>
              ))}
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