"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Brain, ChevronRight, FileText, Utensils, Dumbbell } from "lucide-react"

interface PlaceholderCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

export function PlaceholderCard({ title, description, icon, onClick }: PlaceholderCardProps) {
  return (
    <Card 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </div>
      </CardContent>
    </Card>
  )
}

export function FitnessGoalsPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <PlaceholderCard
      title="Fitness Goals"
      description="View and manage client fitness goals"
      icon={<Target className="h-4 w-4 text-white" />}
      onClick={onClick}
    />
  )
}

export function AICoachInsightsPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <PlaceholderCard
      title="AI Coach Insights"
      description="View AI-powered coaching insights"
      icon={<Brain className="h-4 w-4 text-white" />}
      onClick={onClick}
    />
  )
}

export function TrainerNotesPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <PlaceholderCard
      title="Trainer Notes"
      description="View and edit trainer notes"
      icon={<FileText className="h-4 w-4 text-white" />}
      onClick={onClick}
    />
  )
}

export function NutritionalPreferencesPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <PlaceholderCard
      title="Nutritional Preferences"
      description="View client's nutritional preferences"
      icon={<Utensils className="h-4 w-4 text-white" />}
      onClick={onClick}
    />
  )
}

export function TrainingPreferencesPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <PlaceholderCard
      title="Training Preferences"
      description="View client's training preferences"
      icon={<Dumbbell className="h-4 w-4 text-white" />}
      onClick={onClick}
    />
  )
} 