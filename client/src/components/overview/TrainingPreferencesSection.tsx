import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dumbbell, Clock, MapPin, Calendar, User, Target, Zap, Home, Building, TreePine } from "lucide-react"
import { 
  formatLocalTime, 
  formatTrainingExperience, 
  formatTrainingDuration, 
  formatTrainingFrequency, 
  formatWorkoutDays, 
  formatEquipment, 
  getEquipmentIcon, 
  formatLocation 
} from "@/utils/datetime"

interface TrainingPreferencesSectionProps {
  client: any
  onPreferencesSaved?: () => void
}

export function TrainingPreferencesSection({ client }: TrainingPreferencesSectionProps) {
  console.log('🔍 TrainingPreferencesSection - Component rendered')
  console.log('🔍 TrainingPreferencesSection - Client data:', client)
  
  // Guard: if no client data is supplied just render a friendly empty state
  if (!client) {
    console.log('🔍 TrainingPreferencesSection - No client data, showing empty state')
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Dumbbell className="h-5 w-5 text-blue-500" />
            Training Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No client selected.</p>
        </CardContent>
      </Card>
    )
  }

  // Helper to parse workout days
  function parseWorkoutDays(val: any): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
        return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  // Get formatted values
  const trainingExperience = formatTrainingExperience(client.training_experience)
  const trainingFrequency = formatTrainingFrequency(client.training_days_per_week)
  const sessionDuration = formatTrainingDuration(client.training_time_per_session)
  const workoutTime = formatLocalTime(client.workout_time)
  const workoutDays = formatWorkoutDays(parseWorkoutDays(client.workout_days))
  const location = formatLocation(client.training_location)
  const equipment = formatEquipment(client.available_equipment)

  console.log('🔍 TrainingPreferencesSection - Formatted values:', {
    trainingExperience,
    trainingFrequency,
    sessionDuration,
    workoutTime,
    workoutDays,
    location,
    equipment
  })

  // Get experience level color
  const getExperienceColor = (experience: string) => {
    const level = experience.toLowerCase()
    if (level.includes('beginner') || level.includes('novice')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (level.includes('intermediate')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (level.includes('advanced') || level.includes('expert')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  // Get location icon
  const getLocationIcon = (location: string) => {
    const loc = location.toLowerCase()
    if (loc.includes('home')) return <Home className="h-4 w-4" />
    if (loc.includes('gym') || loc.includes('studio')) return <Building className="h-4 w-4" />
    if (loc.includes('outdoor') || loc.includes('park')) return <TreePine className="h-4 w-4" />
    return <MapPin className="h-4 w-4" />
  }

  console.log('🔍 TrainingPreferencesSection - Rendering new compact layout')

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
            <Dumbbell className="h-5 w-5 text-blue-500" />
            Client Goals & Workout Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Experience & Schedule Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Training Experience */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Experience Level</div>
                <Badge className={`text-xs ${getExperienceColor(trainingExperience)}`}>
                  {trainingExperience}
                </Badge>
              </div>
            </div>

            {/* Training Frequency */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Training Frequency</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {trainingFrequency}
                </div>
              </div>
            </div>
          </div>

          {/* Time Preferences Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Duration */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
                  </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Session Duration</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {sessionDuration}
                </div>
              </div>
            </div>

            {/* Preferred Workout Time */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
                    </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preferred Time</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {workoutTime}
                </div>
              </div>
            </div>
          </div>

          {/* Workout Days */}
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Workout Days</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {workoutDays}
              </div>
            </div>
          </div>

          {/* Location & Equipment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Training Location */}
            <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <div className="p-2 bg-teal-100 dark:bg-teal-800 rounded-lg">
                {getLocationIcon(location)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Training Location</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {location}
                </div>
              </div>
            </div>

            {/* Available Equipment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-help">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <Dumbbell className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Equipment</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {equipment.length > 0 ? `${equipment.length} items` : 'None specified'}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-medium">Available Equipment:</div>
                  {equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {equipment.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {getEquipmentIcon(item)} {item}
                          </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No equipment specified</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
            </div>

          {/* Previous Training (if available) */}
          {client.previous_training && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg cursor-help">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Target className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Previous Training</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {client.previous_training.length > 50 
                        ? `${client.previous_training.substring(0, 50)}...` 
                        : client.previous_training}
              </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <div className="space-y-2">
                  <div className="font-medium">Previous Training Experience:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {client.previous_training}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

      {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {trainingExperience !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {trainingFrequency !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Schedule</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {location !== 'Not set' ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {equipment.length > 0 ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Equipment</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 