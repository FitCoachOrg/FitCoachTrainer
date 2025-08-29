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
  const handleClick = () => {
    onClick()
  }
  
  return (
    <Card 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-0 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}

export function FitnessGoalsPlaceholder({ onClick, client }: { onClick: () => void; client?: any }) {
  const clientName = client?.cl_prefer_name || client?.cl_name || 'Client';
  
  const handleClick = () => {
    onClick()
  }
  
  return (
    <PlaceholderCard
      title={`${clientName} Fitness Goals`}
      description="Set, track & manage fitness objectives & milestones"
      icon={<Target className="h-4 w-4 text-white" />}
      onClick={handleClick}
    />
  )
}

export function AICoachInsightsPlaceholder({ onClick, client }: { onClick: () => void; client?: any }) {
  const clientName = client?.cl_prefer_name || client?.cl_name || 'Client';
  
  const handleClick = () => {
    onClick()
  }
  
  return (
    <PlaceholderCard
      title={`${clientName} AI Coach Insights`}
      description="AI-powered recommendations & progress analysis"
      icon={<Brain className="h-4 w-4 text-white" />}
      onClick={handleClick}
    />
  )
}

export function TrainerNotesPlaceholder({ onClick, client }: { onClick: () => void; client?: any }) {
  const clientName = client?.cl_prefer_name || client?.cl_name || 'Client';
  
  const handleClick = () => {
    onClick()
  }
  
  return (
    <PlaceholderCard
      title={`${clientName} Trainer Notes`}
      description="Personal notes, observations & client feedback"
      icon={<FileText className="h-4 w-4 text-white" />}
      onClick={handleClick}
    />
  )
}

export function NutritionalPreferencesPlaceholder({ onClick, client }: { onClick: () => void; client?: any }) {
  const clientName = client?.cl_prefer_name || client?.cl_name || 'Client';
  
  const handleClick = () => {
    onClick()
  }
  
  return (
    <PlaceholderCard
      title={`${clientName} Nutritional Preferences`}
      description="Diet preferences, allergies & meal scheduling"
      icon={<Utensils className="h-4 w-4 text-white" />}
      onClick={handleClick}
    />
  )
}

export function TrainingPreferencesPlaceholder({ onClick, client }: { onClick: () => void; client?: any }) {
  const clientName = client?.cl_prefer_name || client?.cl_name || 'Client';
  
  const handleClick = () => {
    onClick()
  }
  
  return (
    <PlaceholderCard
      title={`${clientName} Training Preferences`}
      description="Workout style, equipment & training intensity preferences"
      icon={<Dumbbell className="h-4 w-4 text-white" />}
      onClick={handleClick}
    />
  )
} 