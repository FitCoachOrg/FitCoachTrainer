import React from "react"
import { FitnessGoalsSection } from "./FitnessGoalsSection"
import { AICoachInsightsSection } from "./AICoachInsightsSection"

interface OverviewSectionProps {
  client: any
  trainerNotes: string
  setTrainerNotes: (notes: string) => void
  handleSaveTrainerNotes: () => void
  isSavingNotes: boolean
  isEditingNotes: boolean
  setIsEditingNotes: (editing: boolean) => void
  notesDraft: string
  setNotesDraft: (draft: string) => void
  notesError: string | null
  setNotesError: (error: string | null) => void
  isGeneratingAnalysis: boolean
  handleSummarizeNotes: () => void
  isSummarizingNotes: boolean
  handleSummarizeLocalLLM: () => void
  isSummarizingLocalLLM: boolean
  lastAIRecommendation: any
  onGoalsSaved?: () => void
  onViewFullAnalysis: () => void
}

export function OverviewSection({
  client,
  trainerNotes,
  setTrainerNotes,
  handleSaveTrainerNotes,
  isSavingNotes,
  isEditingNotes,
  setIsEditingNotes,
  notesDraft,
  setNotesDraft,
  notesError,
  setNotesError,
  isGeneratingAnalysis,
  handleSummarizeNotes,
  isSummarizingNotes,
  handleSummarizeLocalLLM,
  isSummarizingLocalLLM,
  lastAIRecommendation,
  onGoalsSaved,
  onViewFullAnalysis
}: OverviewSectionProps) {
  return (
    <div className="space-y-8">
      {/* Enhanced Content Area */}
      <div className="space-y-8">
        <div className="space-y-8">
          {/* For now, we'll keep the original StructuredTrainerNotesSection in the main file */}
          {/* This will be replaced with the modular component once we extract it */}
        </div>
      </div>
    </div>
  )
} 