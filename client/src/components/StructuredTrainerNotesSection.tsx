"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Save, Trash2, Search as SearchIcon, Brain, CalendarDays } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"

// Interface for trainer notes
interface TrainerNote {
  id: string
  date: string
  notes: string
  createdAt: string
}

interface StructuredTrainerNotesSectionProps {
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
  lastAIRecommendation: any
  setLastAIRecommendation?: (analysis: any) => void
}

/**
 * StructuredTrainerNotesSection Component
 * 
 * This component provides a comprehensive trainer notes management system with:
 * - Structured note-taking with dates and content
 * - Search functionality for finding specific notes
 * - Add, edit, and delete note capabilities
 * - AI analysis integration that triggers when notes are saved
 * - Visual feedback for AI analysis generation
 * - Responsive design with proper loading states
 * - Error handling and validation
 */
export function StructuredTrainerNotesSection({ 
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
  lastAIRecommendation, 
  setLastAIRecommendation 
}: StructuredTrainerNotesSectionProps) {

  return (
    <TrainerNotesSection
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
} 