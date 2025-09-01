import React from "react";
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards";
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost";
import { type PopupKey } from "@/components/popups/trainer-popups.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrainerOnboardingScreen from "./TrainerOnboardingScreen";
import ClientTargetsTable from "./ClientTargetsTable";
import ClientMonthlyReportSection from "./monthly-report/ClientMonthlyReportSection";

import { AICoachInsightsState } from "@/types/ai-coach-insights";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface ClientOverviewSectionProps {
  client: any;
  aiCoachInsights?: AICoachInsightsState;
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
  setLastAIRecommendation?: (analysis: any) => void;
  refreshClientData: () => void;
}

type OverviewTab = 'onboarding' | 'targets' | 'monthly-report';

const ClientOverviewSection: React.FC<ClientOverviewSectionProps> = ({
  client,
  aiCoachInsights,
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
  setLastAIRecommendation,
  refreshClientData,
}) => {
  // Local state for popups
  const [openPopup, setOpenPopup] = React.useState<PopupKey | null>(null);
  // Local state for active tab
  const [activeTab, setActiveTab] = React.useState<OverviewTab>('onboarding');

  // State for collapsible client details
  const [showClientDetails, setShowClientDetails] = React.useState<boolean>(() => {
    // Load from localStorage, default to false (hidden)
    const saved = localStorage.getItem('client-overview-show-details');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage when state changes
  React.useEffect(() => {
    localStorage.setItem('client-overview-show-details', JSON.stringify(showClientDetails));
  }, [showClientDetails]);

  // Debug: Log when openPopup changes
  React.useEffect(() => {
    console.log('🔍 ClientOverviewSection - openPopup changed to:', openPopup)
  }, [openPopup])

  // Debug: Log when openPopup changes
  React.useEffect(() => {
    console.log('🔍 ClientOverviewSection - openPopup changed to:', openPopup)
  }, [openPopup])

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
          <div className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black rounded-lg">
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
          <div className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black rounded-lg p-6">
            <ClientTargetsTable
              clientId={client?.client_id?.toString() || ''}
              client={client}
            />
          </div>
        );
      
      case 'monthly-report':
        return (
          <div className="w-full bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-black rounded-lg p-6">
            <ClientMonthlyReportSection
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
        {/* Collapsible Client Details Section */}
        <div className="mb-6">
          <Button
            onClick={() => setShowClientDetails(!showClientDetails)}
            variant="outline"
            className="w-full justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-300"
          >
            <span className="font-medium text-gray-900 dark:text-white">
              Show Client Details
            </span>
            {showClientDetails ? (
              <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
          </Button>

          {/* Collapsible Cards Container */}
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showClientDetails ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <FitnessGoalsPlaceholder onClick={() => setOpenPopup('fitnessGoals')} client={client} />
              <TrainingPreferencesPlaceholder onClick={() => {
                console.log('🔍 ClientOverviewSection - TrainingPreferencesPlaceholder clicked!')
                console.log('🔍 ClientOverviewSection - Setting openPopup to trainingPreferences')
                setOpenPopup('trainingPreferences')
              }} client={client} />
              <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
              <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
              <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
            </div>
          </div>
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
            <span>Client Settings and Goals</span>
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
          <Button
            variant={activeTab === 'monthly-report' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('monthly-report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'monthly-report'
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-700/60"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Client Monthly Report</span>
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
          aiCoachInsights,
          onViewFullAnalysis: () => {},
          // Legacy props for backward compatibility
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
          setLastAIRecommendation
        }}
      />
    </div>
  );
};

export default ClientOverviewSection; 