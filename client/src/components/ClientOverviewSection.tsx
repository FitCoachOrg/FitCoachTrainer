import React from "react";
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards";
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost";
import { type PopupKey } from "@/components/popups/trainer-popups.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrainerOnboardingScreen from "./TrainerOnboardingScreen";
import ClientTargetsTable from "./ClientTargetsTable";

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

type OverviewTab = 'onboarding' | 'targets';

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
  // Local state for active tab
  const [activeTab, setActiveTab] = React.useState<OverviewTab>('onboarding');

  // Handle onboarding completion
  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed:', data);
    // Refresh client data to show updated information
    refreshClientData();
    // Show success message or navigate
    alert('Client onboarding completed successfully!');
  };

  // Handle onboarding save
  const handleOnboardingSave = (data: any) => {
    console.log('Onboarding progress saved:', data);
  };

  // Handle onboarding error
  const handleOnboardingError = (error: any) => {
    console.error('Onboarding error:', error);
    alert('An error occurred during onboarding. Please try again.');
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'onboarding':
        return (
          <div className="w-full">
            <TrainerOnboardingScreen
              clientId={client?.client_id?.toString() || ''}
              client={client}
              onComplete={handleOnboardingComplete}
              onSave={handleOnboardingSave}
              onError={handleOnboardingError}
              showProgress={true}
              autoSave={true}
              saveInterval={2000}
            />
          </div>
        );
      
      case 'targets':
        return (
          <div className="w-full">
            <ClientTargetsTable 
              clientId={client?.client_id?.toString() || ''}
              client={client}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Header Section - Mini Cards and Tabs */}
      <div className="flex-shrink-0">
        {/* Placeholder Cards Section - 5 mini cards that open popup windows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <FitnessGoalsPlaceholder onClick={() => setOpenPopup('fitnessGoals')} client={client} />
          <TrainingPreferencesPlaceholder onClick={() => setOpenPopup('trainingPreferences')} client={client} />
          <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
          <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
          <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
        </div>

        {/* Tab Navigation - Underneath the mini cards */}
        <div className="flex space-x-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-1 rounded-xl mb-6">
          <Button
            variant={activeTab === 'onboarding' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'onboarding'
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
            }`}
          >
            <span>Client Onboarding</span>
          </Button>
          <Button
            variant={activeTab === 'targets' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('targets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'targets'
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
            }`}
          >
            <span>Client Targets</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Unified Popup Host for the 5 mini cards */}
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
    </div>
  );
};

export default ClientOverviewSection; 