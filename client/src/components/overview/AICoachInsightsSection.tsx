import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap, Star, Clock, Users, BarChart3, Lightbulb, Activity, ArrowRight, MessageSquare, Settings } from "lucide-react"

interface AICoachInsightsSectionProps {
  lastAIRecommendation: any
  onViewFullAnalysis: () => void
}

interface ActionItem {
  id: string
  text: string
  completed: boolean
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
  timeframe?: string
}

export function AICoachInsightsSection({ lastAIRecommendation, onViewFullAnalysis }: AICoachInsightsSectionProps) {
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

  const actionItems = getActionItems()
  const progressAssessment = getProgressAssessment()
  const positiveDevelopments = getPositiveDevelopments()
  const immediateConcerns = getImmediateConcerns()
  const weeklyFocusAreas = getWeeklyFocusAreas()
  const recommendations = getRecommendations()
  const insights = getInsights()
  const nextSessionFocus = getNextSessionFocus()
  const coachingRecommendations = getCoachingRecommendations()

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
              onClick={onViewFullAnalysis}
              disabled={!lastAIRecommendation}
              className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Full Analysis
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

      {/* Recommendations Card */}
      {Object.keys(recommendations).length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(recommendations).map(([key, recs]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 capitalize">
                    {key.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(recs) ? recs.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-yellow-100/50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-yellow-800 dark:text-yellow-300">
                          {rec}
                        </span>
                      </div>
                    )) : (
                      <div className="p-2 bg-yellow-100/50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                        <span className="text-sm text-yellow-800 dark:text-yellow-300">
                          {String(recs)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Card */}
      {Object.keys(insights).length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Activity className="h-5 w-5" />
              Client Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(insights).map(([key, items]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 capitalize">
                    {key.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(items) ? items.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-purple-800 dark:text-purple-300">
                          {item}
                        </span>
                      </div>
                    )) : (
                      <div className="p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800">
                        <span className="text-sm text-purple-800 dark:text-purple-300">
                          {String(items)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Session Focus Card */}
      {Object.keys(nextSessionFocus).length > 0 && (
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <ArrowRight className="h-5 w-5" />
              Next Session Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(nextSessionFocus).map(([key, items]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 capitalize">
                    {key.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(items) ? items.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-cyan-100/50 dark:bg-cyan-900/30 rounded border border-cyan-200 dark:border-cyan-800">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-cyan-800 dark:text-cyan-300">
                          {item}
                        </span>
                      </div>
                    )) : (
                      <div className="p-2 bg-cyan-100/50 dark:bg-cyan-900/30 rounded border border-cyan-200 dark:border-cyan-800">
                        <span className="text-sm text-cyan-800 dark:text-cyan-300">
                          {String(items)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coaching Recommendations Card */}
      {Object.keys(coachingRecommendations).length > 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <MessageSquare className="h-5 w-5" />
              Coaching Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(coachingRecommendations).map(([key, items]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                    {key.replace('_', ' ')}
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(items) ? items.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded border border-emerald-200 dark:border-emerald-800">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm text-emerald-800 dark:text-emerald-300">
                          {item}
                        </span>
                      </div>
                    )) : (
                      <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded border border-emerald-200 dark:border-emerald-800">
                        <span className="text-sm text-emerald-800 dark:text-emerald-300">
                          {String(items)}
                        </span>
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
                  Generate an AI analysis to see personalized insights and action plans for your client.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 