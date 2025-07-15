"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Utensils, AlertTriangle, Coffee, Sun, Moon, Apple } from "lucide-react"

interface NutritionalPreferencesSectionProps {
  client: any
}

export function NutritionalPreferencesSection({ client }: NutritionalPreferencesSectionProps) {
  // Helper function to format time
  const formatTime = (time: string | null) => {
    if (!time) return "Not set"
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return time
    }
  }

  // Helper function to render array of preferences
  const renderPreferences = (preferences: string[] | null) => {
    if (!preferences || preferences.length === 0) {
      return <span className="text-gray-500 italic">None specified</span>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {preferences.map((pref, index) => (
          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {pref}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Diet Preferences */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-600">
            <Utensils className="h-5 w-5" />
            Diet Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPreferences(client?.diet_preferences)}
        </CardContent>
      </Card>

      {/* Food Allergies */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Food Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client?.food_allergies ? (
            <div className="flex flex-wrap gap-2">
              {client.food_allergies.split(',').map((allergy: string, index: number) => (
                <Badge key={index} variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  {allergy.trim()}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 italic">No allergies specified</span>
          )}
        </CardContent>
      </Card>

      {/* Meal Schedule */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
            <Clock className="h-5 w-5" />
            Meal Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Breakfast Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.bf_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lunch Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.lunch_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Dinner Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.dinner_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Snack Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.snack_time)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Preferred Meals/Day:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {client?.preferred_meals_per_day || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Wake Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.wake_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Bed Time:</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatTime(client?.bed_time)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eating Habits */}
      {client?.eating_habits && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-orange-600">
              <Apple className="h-5 w-5" />
              Eating Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {client.eating_habits}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-600">Nutritional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {client?.diet_preferences?.length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Diet Preferences</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {client?.food_allergies ? client.food_allergies.split(',').length : 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Allergies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {client?.preferred_meals_per_day || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Meals/Day</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {[client?.bf_time, client?.lunch_time, client?.dinner_time, client?.snack_time].filter(Boolean).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Times Set</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 