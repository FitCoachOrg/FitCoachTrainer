"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Utensils, AlertTriangle, Coffee, Sun, Moon, Apple, Calendar } from "lucide-react"
import { formatLocalTime } from "@/utils/datetime"

interface NutritionalPreferencesSectionProps {
  client: any
}

export function NutritionalPreferencesSection({ client }: NutritionalPreferencesSectionProps) {
  // Guard: if no client data is supplied just render a friendly empty state
  if (!client) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Utensils className="h-5 w-5 text-blue-500" />
            Nutritional Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No client selected.</p>
        </CardContent>
      </Card>
    )
  }

  // Helper function to format time consistently
  const formatTime = (time: string | null) => formatLocalTime(time)

  // Helper function to format preferences
  const formatPreferences = (preferences: string[] | null): string[] => {
    if (!preferences || preferences.length === 0) return []
    return preferences.map(pref => 
      pref.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    )
  }

  // Helper function to format allergies
  const formatAllergies = (allergies: string | null): string[] => {
    if (!allergies) return []
    return allergies.split(',').map(allergy => allergy.trim()).filter(Boolean)
  }

  // Get formatted values
  const dietPreferences = formatPreferences(client.diet_preferences)
  const foodAllergies = formatAllergies(client.food_allergies)
  const preferredMealsPerDay = client.preferred_meals_per_day || 'Not set'
  const eatingHabits = client.eating_habits || null

  // Get meal times
  const breakfastTime = formatTime(client.bf_time)
  const lunchTime = formatTime(client.lunch_time)
  const dinnerTime = formatTime(client.dinner_time)
  const snackTime = formatTime(client.snack_time)
  const wakeTime = formatTime(client.wake_time)
  const bedTime = formatTime(client.bed_time)

  // Get preference color
  const getPreferenceColor = (preference: string) => {
    const pref = preference.toLowerCase()
    if (pref.includes('vegetarian') || pref.includes('vegan')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (pref.includes('keto') || pref.includes('low carb')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (pref.includes('paleo') || pref.includes('whole30')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    if (pref.includes('mediterranean')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (pref.includes('gluten') || pref.includes('dairy')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <TooltipProvider>
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
            <Utensils className="h-5 w-5 text-blue-500" />
            Nutritional Preferences & Meal Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diet Preferences & Allergies Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diet Preferences */}
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Utensils className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diet Preferences</div>
                <div className="flex flex-wrap gap-1">
                  {dietPreferences.length > 0 ? (
                    dietPreferences.map((pref, index) => (
                      <Badge key={index} className={`text-xs ${getPreferenceColor(pref)}`}>
                        {pref}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* Food Allergies */}
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Food Allergies</div>
                <div className="flex flex-wrap gap-1">
                  {foodAllergies.length > 0 ? (
                    foodAllergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Meal Schedule Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meal Times */}
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Meal Times</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Breakfast:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{breakfastTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Lunch:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{lunchTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dinner:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{dinnerTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Schedule */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Schedule</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Wake:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{wakeTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bed:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{bedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Meals/Day:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{preferredMealsPerDay}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Snack Time */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
              <Apple className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Snack Time</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {snackTime}
              </div>
            </div>
          </div>

          {/* Eating Habits */}
          {eatingHabits && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg cursor-help">
                  <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                    <Coffee className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Eating Habits</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {eatingHabits.length > 50 
                        ? `${eatingHabits.substring(0, 50)}...` 
                        : eatingHabits}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <div className="space-y-2">
                  <div className="font-medium">Eating Habits:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {eatingHabits}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {dietPreferences.length > 0 ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Preferences</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {foodAllergies.length > 0 ? '⚠' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Allergies</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {[breakfastTime, lunchTime, dinnerTime, snackTime].filter(time => time !== 'Not set').length > 0 ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Meal Times</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {eatingHabits ? '✓' : '○'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Habits</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 