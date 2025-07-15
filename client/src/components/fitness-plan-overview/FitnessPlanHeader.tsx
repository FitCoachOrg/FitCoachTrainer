import React from 'react';
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Save,
  Settings,
  Table,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
} from "lucide-react";

interface FitnessPlanHeaderProps {
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  handleGenerateNewPlan: () => void;
  handleSavePlan: () => void;
  setIsEditing: (value: boolean) => void;
  setCurrentView: (view: 'table' | 'calendar' | 'weekly' | 'daily') => void;
  currentView: 'table' | 'calendar' | 'weekly' | 'daily';
}

export const FitnessPlanHeader: React.FC<FitnessPlanHeaderProps> = ({
  isLoading,
  isSaving,
  isEditing,
  handleGenerateNewPlan,
  handleSavePlan,
  setIsEditing,
  setCurrentView,
  currentView,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
          AI-Generated Fitness Plan
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review, edit, and save the plan.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateNewPlan}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Generating..." : "Regenerate"}
        </Button>
        <div className="flex items-center gap-2 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setCurrentView('table')}
            className={`p-1.5 rounded-md ${currentView === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <Table className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setCurrentView('calendar')}
            className={`p-1.5 rounded-md ${currentView === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
          >
            <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <Button
          size="sm"
          onClick={handleSavePlan}
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save to Client"}
        </Button>
      </div>
    </div>
  );
}; 