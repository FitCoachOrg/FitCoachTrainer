"use client"

import React from "react"
import { Target, Brain, FileText, Utensils, Dumbbell } from "lucide-react"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { StructuredTrainerNotesSection } from "@/components/StructuredTrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection"

export type PopupKey = 'fitnessGoals' | 'aiCoachInsights' | 'trainerNotes' | 'nutritionalPreferences' | 'trainingPreferences'

interface TrainerPopupConfigEntry {
  key: PopupKey
  title: string
  icon: React.ReactNode
  render: (ctx: any) => React.ReactNode
}

export const trainerPopups: Record<PopupKey, TrainerPopupConfigEntry> = {
  fitnessGoals: {
    key: 'fitnessGoals',
    title: 'Fitness Goals',
    icon: <Target className="h-5 w-5 text-white" />,
    render: ({ client, onGoalsSaved }: any) => (
      <FitnessGoalsSection client={client} onGoalsSaved={onGoalsSaved} />
    )
  },
  aiCoachInsights: {
    key: 'aiCoachInsights',
    title: 'AI Coach Insights',
    icon: <Brain className="h-5 w-5 text-white" />,
    render: ({ aiCoachInsights, onViewFullAnalysis, client, lastAIRecommendation, trainerNotes, setLastAIRecommendation }: any) => (
      <AICoachInsightsSection
        lastAIRecommendation={aiCoachInsights?.lastAIRecommendation || lastAIRecommendation}
        onViewFullAnalysis={onViewFullAnalysis || (() => {})}
        client={client}
        trainerNotes={aiCoachInsights?.trainerNotes || trainerNotes}
        setLastAIRecommendation={aiCoachInsights?.setLastAIRecommendation || setLastAIRecommendation}
        aiCoachInsights={aiCoachInsights}
      />
    )
  },
  trainerNotes: {
    key: 'trainerNotes',
    title: 'Trainer Notes',
    icon: <FileText className="h-5 w-5 text-white" />,
    render: ({ client, trainerNotes, setTrainerNotes, handleSaveTrainerNotes, isSavingNotes, isEditingNotes, setIsEditingNotes, notesDraft, setNotesDraft, notesError, setNotesError, isGeneratingAnalysis, handleSummarizeNotes, isSummarizingNotes, lastAIRecommendation, setLastAIRecommendation }: any) => (
      <StructuredTrainerNotesSection
        client={client}
        trainerNotes={trainerNotes}
        setTrainerNotes={setTrainerNotes}
        handleSaveTrainerNotes={handleSaveTrainerNotes}
        isSavingNotes={isSavingNotes}
        isEditingNotes={isEditingNotes}
        setIsEditingNotes={setIsEditingNotes}
        notesDraft={notesDraft}
        setNotesDraft={setNotesDraft}
        notesError={notesError}
        setNotesError={setNotesError}
        isGeneratingAnalysis={isGeneratingAnalysis}
        handleSummarizeNotes={handleSummarizeNotes}
        isSummarizingNotes={isSummarizingNotes}
        lastAIRecommendation={lastAIRecommendation}
        setLastAIRecommendation={setLastAIRecommendation}
      />
    )
  },
  nutritionalPreferences: {
    key: 'nutritionalPreferences',
    title: 'Nutritional Preferences',
    icon: <Utensils className="h-5 w-5 text-white" />,
    render: ({ client }: any) => (
      <NutritionalPreferencesSection client={client} />
    )
  },
  trainingPreferences: {
    key: 'trainingPreferences',
    title: 'Training Preferences',
    icon: <Dumbbell className="h-5 w-5 text-white" />,
    render: ({ client }: any) => {
      console.log('🔍 trainerPopups - trainingPreferences render called')
      console.log('🔍 trainerPopups - client data:', client)
      return <TrainingPreferencesSection client={client} />
    }
  }
}


