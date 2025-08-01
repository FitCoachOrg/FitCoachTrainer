import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards";
import { BarChart3, TrendingUp, Target, Brain, FileText, Utensils, Dumbbell } from "lucide-react";
import FitnessScoreVisualization from "@/components/fitness-score/FitnessScoreVisualization";
import { SidePopup } from "@/components/ui/side-popup";
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
  const [showFitnessGoals, setShowFitnessGoals] = React.useState(false);
  const [showAICoachInsights, setShowAICoachInsights] = React.useState(false);
  const [showTrainerNotes, setShowTrainerNotes] = React.useState(false);
  const [showNutritionalPreferences, setShowNutritionalPreferences] = React.useState(false);
  const [showTrainingPreferences, setShowTrainingPreferences] = React.useState(false);
  const [showFitnessScore, setShowFitnessScore] = React.useState(false);

  return (
    <>
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} client={client} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} client={client} />
        {/* Fitness Score Card removed as requested */}
      </div>
      {/* Fitness Score Visualization */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black">
        <CardContent>
          <FitnessScoreVisualization clientId={client?.client_id || 34} />
        </CardContent>
      </Card>
      {/* Side Popups for Placeholder Cards */}
      <SidePopup
        isOpen={showFitnessGoals}
        onClose={() => setShowFitnessGoals(false)}
        title="Fitness Goals"
        icon={<Target className="h-5 w-5 text-white" />}
      >
        <FitnessGoalsSection client={client} onGoalsSaved={refreshClientData} />
      </SidePopup>
      <SidePopup
        isOpen={showAICoachInsights}
        onClose={() => setShowAICoachInsights(false)}
        title="AI Coach Insights"
        icon={<Brain className="h-5 w-5 text-white" />}
      >
        <AICoachInsightsSection 
          lastAIRecommendation={lastAIRecommendation}
          onViewFullAnalysis={() => {}}
        />
      </SidePopup>
      <SidePopup
        isOpen={showTrainerNotes}
        onClose={() => setShowTrainerNotes(false)}
        title="Trainer Notes"
        icon={<FileText className="h-5 w-5 text-white" />}
      >
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
        />
      </SidePopup>
      <SidePopup
        isOpen={showNutritionalPreferences}
        onClose={() => setShowNutritionalPreferences(false)}
        title="Nutritional Preferences"
        icon={<Utensils className="h-5 w-5 text-white" />}
      >
        <NutritionalPreferencesSection client={client} />
      </SidePopup>
      <SidePopup
        isOpen={showTrainingPreferences}
        onClose={() => setShowTrainingPreferences(false)}
        title="Training Preferences"
        icon={<Dumbbell className="h-5 w-5 text-white" />}
      >
        <TrainingPreferencesSection client={client} />
      </SidePopup>
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