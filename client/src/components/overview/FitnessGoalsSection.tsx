import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Target, Clock, Calendar, FileText, Zap, TrendingUp, Flag } from "lucide-react"

interface FitnessGoalsSectionProps {
  client: any
  onGoalsSaved?: () => void
}

export function FitnessGoalsSection({ client }: FitnessGoalsSectionProps) {
  // Guard: if no client data is supplied just render a friendly empty state
  if (!client) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Target className="h-5 w-5 text-blue-500" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No client selected.</p>
        </CardContent>
      </Card>
    )
  }

  // Helper function to format goal values
  const formatGoalValue = (value: string | null | undefined): string => {
    if (!value || value === 'Not set' || value === 'null') return 'Not set'
    
    // Convert snake_case to Title Case
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Helper function to format timeline
  const formatTimeline = (timeline: string | null | undefined): string => {
    if (!timeline || timeline === 'Not set' || timeline === 'null') return 'Not set'
    
    // Convert snake_case to Title Case and add "months" if it's a number
    const formatted = timeline
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    // If it's a number, add "months"
    if (/^\d+$/.test(timeline)) {
      return `${formatted} months`
    }
    
    return formatted
  }

  // Get formatted values
  const primaryGoal = formatGoalValue(client.cl_primary_goal)
  const specificOutcome = formatGoalValue(client.specific_outcome)
  const timeline = formatTimeline(client.goal_timeline)
  const workoutDays = client.workout_days ? client.workout_days.split(',').map((day: string) => day.trim()) : []
  const sessionDuration = client.training_time_per_session || 'Not set'
  const constraints = client.injuries_limitations || 'None specified'



  // Get goal type color
  const getGoalColor = (goal: string) => {
    const goalType = goal.toLowerCase()
    if (goalType.includes('build') || goalType.includes('muscle')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (goalType.includes('lose') || goalType.includes('weight')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (goalType.includes('run') || goalType.includes('marathon')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (goalType.includes('strength') || goalType.includes('power')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    if (goalType.includes('endurance') || goalType.includes('stamina')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  // Get timeline color
  const getTimelineColor = (timeline: string) => {
    if (timeline === 'Not set') return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    
    const months = parseInt(timeline)
    if (isNaN(months)) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    
    if (months <= 3) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (months <= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }



  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
            <Target className="h-5 w-5 text-blue-500" />
            Fitness Goals & Objectives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Goal & Timeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Goal */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Primary Goal</div>
                <Badge className={`text-xs ${getGoalColor(primaryGoal)}`}>
                  {primaryGoal}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timeline</div>
                <Badge className={`text-xs ${getTimelineColor(timeline)}`}>
                  {timeline}
                </Badge>
              </div>
            </div>
          </div>

          {/* Specific Outcome */}
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
              <Flag className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Specific Outcome</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {specificOutcome}
              </div>
            </div>
          </div>

          {/* Training Schedule Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workout Days */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Workout Days</div>
                <div className="flex flex-wrap gap-1">
                  {workoutDays.length > 0 ? (
                    workoutDays.map((day: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium">
                        {day}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Session Duration */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Session Duration</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionDuration}
                </div>
              </div>
            </div>
          </div>

          {/* Constraints */}
          {constraints !== 'None specified' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-help">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Constraints & Limitations</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {constraints.length > 50 
                        ? `${constraints.substring(0, 50)}...` 
                        : constraints}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <div className="space-y-2">
                  <div className="font-medium">Injuries & Limitations:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {constraints}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {primaryGoal !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Primary Goal</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {timeline !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Timeline</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {specificOutcome !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Outcome</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {workoutDays.length > 0 ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Schedule</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 