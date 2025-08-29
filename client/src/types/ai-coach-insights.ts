// AI Coach Insights Types and Interfaces
// This file defines the unified structure for AI Coach Insights across all sections

export interface AICoachInsightsState {
  // Core AI Analysis Data
  lastAIRecommendation: any | null;
  isGeneratingAnalysis: boolean;
  
  // Trainer Notes Integration
  trainerNotes: string;
  notesDraft: string;
  isEditingNotes: boolean;
  isSavingNotes: boolean;
  notesError: string | null;
  
  // Analysis Functions
  setLastAIRecommendation: (analysis: any) => void;
  setTrainerNotes: (notes: string) => void;
  setNotesDraft: (draft: string) => void;
  setIsEditingNotes: (editing: boolean) => void;
  setIsSavingNotes: (saving: boolean) => void;
  setNotesError: (error: string | null) => void;
  
  // Action Functions
  handleSaveTrainerNotes: () => Promise<void>;
  handleGenerateAIAnalysis: () => Promise<void>;
  
  // Loading States
  isSummarizingNotes: boolean;
  handleSummarizeNotes: () => Promise<void>;
}

export interface AICoachInsightsContext {
  // Core Data
  client: any;
  aiInsights: AICoachInsightsState;
  
  // Additional Context
  onGoalsSaved?: () => void;
  onViewFullAnalysis?: () => void;
}

// Helper function to create default AI Coach Insights state
export const createDefaultAICoachInsightsState = (
  setLastAIRecommendation: (analysis: any) => void,
  setTrainerNotes: (notes: string) => void,
  setNotesDraft: (draft: string) => void,
  setIsEditingNotes: (editing: boolean) => void,
  setIsSavingNotes: (saving: boolean) => void,
  setNotesError: (error: string | null) => void,
  handleSaveTrainerNotes: () => Promise<void>,
  handleGenerateAIAnalysis: () => Promise<void>,
  isSummarizingNotes: boolean,
  handleSummarizeNotes: () => Promise<void>
): AICoachInsightsState => ({
  lastAIRecommendation: null,
  isGeneratingAnalysis: false,
  trainerNotes: "",
  notesDraft: "",
  isEditingNotes: false,
  isSavingNotes: false,
  notesError: null,
  setLastAIRecommendation,
  setTrainerNotes,
  setNotesDraft,
  setIsEditingNotes,
  setIsSavingNotes,
  setNotesError,
  handleSaveTrainerNotes,
  handleGenerateAIAnalysis,
  isSummarizingNotes,
  handleSummarizeNotes
});
