import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards";
import { BarChart3, TrendingUp, Target, Brain, FileText, Utensils, Dumbbell } from "lucide-react";
import FitnessScoreVisualization from "@/components/fitness-score/FitnessScoreVisualization";
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost";
import { type PopupKey } from "@/components/popups/trainer-popups.config";
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection";
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection";
import { StructuredTrainerNotesSection } from "@/components/StructuredTrainerNotesSection";
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection";
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection";

interface ClientOverviewSectionProps {
  client: any;
  lastAIRecommendation: any;
  trainerNotes: string;
  setTrainerNotes: (notes: string) => void;
  handleSaveTrainerNotes: () => void;
  isSavingNotes: boolean;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesDraft: string;
  setNotesDraft: (draft: string) => void;
  notesError: string | null;
  setNotesError: (error: string | null) => void;
  isGeneratingAnalysis: boolean;
  handleSummarizeNotes: () => void;
  isSummarizingNotes: boolean;
  refreshClientData: () => void;
}

const ClientOverviewSection: React.FC<ClientOverviewSectionProps> = ({
  client,
  lastAIRecommendation,
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
  refreshClientData,
}) => {
  // Local state for popups
  const [openPopup, setOpenPopup] = React.useState<PopupKey | null>(null);
  const [showFitnessScore, setShowFitnessScore] = React.useState(false);

  return (
    <>
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setOpenPopup('fitnessGoals')} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setOpenPopup('trainingPreferences')} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
        <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
        {/* Fitness Score Card removed as requested */}
      </div>
      {/* Fitness Score Visualization */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
        <CardContent>
          <FitnessScoreVisualization clientId={client?.client_id || 34} />
        </CardContent>
      </Card>
      {/* Unified Popup Host */}
      <TrainerPopupHost
        openKey={openPopup}
        onClose={() => setOpenPopup(null)}
        context={{
          client,
          onGoalsSaved: refreshClientData,
          lastAIRecommendation,
          onViewFullAnalysis: () => {},
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
          isSummarizingNotes
        }}
      />
      {/* Remove the SidePopup for Fitness Score as well: */}
      {/* <SidePopup
        isOpen={showFitnessScore}
        onClose={() => setShowFitnessScore(false)}
        title="Fitness Score"
        icon={<BarChart3 className="h-5 w-5 text-white" />}
      >
        <FitnessScoreVisualization clientId={client?.client_id || 34} />
      </SidePopup> */}
    </>
  );
};

export default ClientOverviewSection; 