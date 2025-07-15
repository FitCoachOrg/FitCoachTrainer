/**
 * MetricsSection Component
 * 
 * This component handles the display and management of client metrics including:
 * - Interactive charts for various fitness metrics (weight, sleep, heart rate, etc.)
 * - Drag-and-drop metric customization
 * - Time range filtering (7D, 30D, 90D)
 * - Data processing from activity_info and external_device_connect tables
 * - Workout history display
 * 
 * The component integrates with the METRIC_LIBRARY for metric definitions and
 * provides a comprehensive dashboard for tracking client progress.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from "react"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { supabase } from "@/lib/supabase"
import { METRIC_LIBRARY, type Metric, type MetricData } from "@/lib/metrics-library"
import { ClientStats } from "./ClientStats"
import { MetricsCustomizationPanel } from "./MetricsCustomizationPanel"
import { MetricsGrid } from "./MetricsGrid"
import { WorkoutHistoryTable } from "./WorkoutHistoryTable"
import { SidePopup } from "@/components/ui/side-popup"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection"
import { Target, Brain, FileText, Utensils, Dumbbell } from "lucide-react"

interface MetricsSectionProps {
  clientId?: number
  isActive?: boolean
  client?: any
  lastAIRecommendation?: any
  trainerNotes?: string
  setTrainerNotes?: (notes: string) => void
  handleSaveTrainerNotes?: () => void
  isSavingNotes?: boolean
  isEditingNotes?: boolean
  setIsEditingNotes?: (editing: boolean) => void
  notesDraft?: string
  setNotesDraft?: (draft: string) => void
  notesError?: string | null
  setNotesError?: (error: string | null) => void
  isGeneratingAnalysis?: boolean
  handleSummarizeNotes?: () => void
  isSummarizingNotes?: boolean
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ 
  clientId, 
  isActive, 
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
  isSummarizingNotes
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("selectedMetrics")
    return saved ? JSON.parse(saved) : ["heartRate", "steps", "caloriesSpent", "exerciseTime"]
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [activityData, setActivityData] = useState<any[]>([])
  const [externalDeviceData, setExternalDeviceData] = useState<any[]>([])
  const [filteredActivityData, setFilteredActivityData] = useState<any[]>([])
  const [filteredExternalDeviceData, setFilteredExternalDeviceData] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [workoutCount, setWorkoutCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D")
  
  // Side popup states
  const [showFitnessGoals, setShowFitnessGoals] = useState(false)
  const [showAICoachInsights, setShowAICoachInsights] = useState(false)
  const [showTrainerNotes, setShowTrainerNotes] = useState(false)
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false)
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false)

  // Filter data based on selected time range
  const filterDataByTimeRange = useCallback(() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    // Set cutoff date based on selected time range
    switch (timeRange) {
      case "7D":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30D":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90D":
        cutoffDate.setDate(now.getDate() - 90);
        break;
    }
    
    // Filter activity data if available
    if (activityData.length) {
      const filteredActivity = activityData.filter(item => 
        new Date(item.created_at) >= cutoffDate
      );
      setFilteredActivityData(filteredActivity);
    }
    
    // Filter external device data if available
    if (externalDeviceData.length) {
      const filteredExternal = externalDeviceData.filter(item => 
        new Date(item.for_date) >= cutoffDate
      );
      setFilteredExternalDeviceData(filteredExternal);
    }
  }, [activityData, externalDeviceData, timeRange]);

  // Update metrics data from both activity_info and external_device_connect
  const updateMetricsData = useCallback(() => {
    // Process activity_info data
    const processActivityData = () => {
      if (!filteredActivityData.length) return;
      
      // Group activity data by activity type
      const groupedData: Record<string, any[]> = {};
      filteredActivityData.forEach(item => {
        if (!groupedData[item.activity]) {
          groupedData[item.activity] = [];
        }
        
        // Format date based on time range
        const date = new Date(item.created_at);
        let dateStr: string;
        
        if (timeRange === "7D") {
          // Daily for 7D
          dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
          // Weekly for 30D and 90D
          // Get the week number (approximate by dividing day of month by 7)
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          dateStr = `${monthName} W${weekNum}`; // e.g., "Jan W1"
        }
        
        // Add to grouped data
        groupedData[item.activity].push({
          date: dateStr,
          qty: Number(item.qty),
          unit: item.unit,
          created_at: item.created_at
        });
      });
      
      // Update metrics from activity_info
      METRIC_LIBRARY.forEach((metric, index) => {
        if (metric.dataSource !== "activity_info") return;
        
        const activityName = metric.activityName;
        if (groupedData[activityName]) {
          // Group by date to calculate averages
          const aggregatedData: Record<string, {total: number, count: number}> = {};
          
          groupedData[activityName].forEach(item => {
            if (!aggregatedData[item.date]) {
              aggregatedData[item.date] = { total: 0, count: 0 };
            }
            aggregatedData[item.date].total += item.qty;
            aggregatedData[item.date].count += 1;
          });
          
          // Convert to array of averages
          const averagedData = Object.entries(aggregatedData).map(([date, values]) => {
            return {
              date: date,
              qty: values.total / values.count,
              fullDate: date // Keep for sorting
            };
          });
          
          // Sort and format data
          const formattedData = formatAndSortData(averagedData);
          
          // Update the metric data
          METRIC_LIBRARY[index].data = formattedData;
        }
      });
    };
    
    // Process external device data
    const processExternalDeviceData = () => {
      if (!filteredExternalDeviceData.length) {
        console.log("No filtered external device data available");
        return;
      }
      
      // Group external device data by column and week
      const columnDataMap: Record<string, any[]> = {};
      
      filteredExternalDeviceData.forEach(item => {
        const date = new Date(item.for_date);
        let dateStr: string;
        
        if (timeRange === "7D") {
          // Daily for 7D - use exact date
          dateStr = date.toISOString().split('T')[0];
        } else {
          // Weekly for 30D/90D - get start of week (Monday)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + 1);
          dateStr = startOfWeek.toLocaleDateString('default', { month: 'numeric', day: 'numeric' });
        }
        
        METRIC_LIBRARY.forEach(metric => {
          if (metric.dataSource === "external_device_connect" && metric.columnName) {
            const columnName = metric.columnName;
            if (columnName in item && item[columnName] !== null) {
              if (!columnDataMap[columnName]) {
                columnDataMap[columnName] = [];
              }
              columnDataMap[columnName].push({
                date: dateStr,
                qty: Number(item[columnName]),
                for_date: item.for_date
              });
            }
          }
        });
      });
      
      // Update metrics
      METRIC_LIBRARY.forEach((metric, index) => {
        if (metric.dataSource !== "external_device_connect" || !metric.columnName) return;
        
        const columnName = metric.columnName;
        if (!columnDataMap[columnName] || columnDataMap[columnName].length === 0) {
          METRIC_LIBRARY[index].data = [];
          return;
        }
        
        // Create date placeholders based on time range
        const aggregatedData: Record<string, {total: number, count: number}> = {};
          const today = new Date();
            
            if (timeRange === "7D") {
          // Create last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            aggregatedData[dateStr] = { total: 0, count: 0 };
          }
            } else {
          // Create weekly buckets (4 for 30D, 12 for 90D)
          const weeks = timeRange === "30D" ? 4 : 12;
          for (let i = weeks - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - (i * 7));
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay() + 1);
            const dateStr = startOfWeek.toLocaleDateString('default', { month: 'numeric', day: 'numeric' });
            aggregatedData[dateStr] = { total: 0, count: 0 };
          }
        }
        
        // Aggregate actual data
        columnDataMap[columnName].forEach(item => {
          const date = item.date;
          if (aggregatedData[date]) {
            aggregatedData[date].total += item.qty;
            aggregatedData[date].count += 1;
          }
        });
        
        // Convert to array format
        const formattedData = Object.entries(aggregatedData).map(([date, values]) => ({
          date: timeRange === "7D" 
            ? new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' })
            : date,
          qty: values.count > 0 ? values.total / values.count : null,
          fullDate: date
        }));
        
        // Sort chronologically
        METRIC_LIBRARY[index].data = formattedData.sort((a, b) => {
          const dateA = new Date(a.fullDate);
          const dateB = new Date(b.fullDate);
          return dateA.getTime() - dateB.getTime();
        });
      });
    };
    
    // Helper function to sort and format date data consistently
    const formatAndSortData = (averagedData: any[]) => {
      // Sort by date
      const sortedData = [...averagedData].sort((a, b) => {
        // If using weekly format (Month W#), need custom sorting
        if (timeRange !== "7D") {
          const [aMonth, aWeek] = a.fullDate.split(" ");
          const [bMonth, bWeek] = b.fullDate.split(" ");
          
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const aMonthIndex = months.indexOf(aMonth);
          const bMonthIndex = months.indexOf(bMonth);
          
          if (aMonthIndex !== bMonthIndex) return aMonthIndex - bMonthIndex;
          return aWeek.localeCompare(bWeek);
        }
        
        // For daily format, simple date comparison
        return new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime();
      });
      
      // Format display dates
      return sortedData.map(item => ({
        ...item,
        date: timeRange === "7D" 
          ? new Date(item.fullDate).toLocaleDateString('default', { month: 'short', day: 'numeric' })
          : item.date // Keep the Month W# format for weekly
      }));
    };
    
    // Process both data sources
    processActivityData();
    processExternalDeviceData();
    
  }, [filteredActivityData, filteredExternalDeviceData, timeRange]);

  useEffect(() => {
    localStorage.setItem("selectedMetrics", JSON.stringify(selectedKeys))
  }, [selectedKeys])

  useEffect(() => {
    if (!clientId || !isActive || dataLoaded) {
      return;
    }
    
    setLoadingActivity(true);
    setActivityError(null);
    
    (async () => {
      try {
        // Fetch workout_info data for the client - get all historical workout data
        const { data: workoutData, error: workoutError } = await supabase
          .from("workout_info")
          .select("*")
          .eq("client_id", clientId)
          .order('created_at', { ascending: true });
          
        if (workoutError) throw workoutError;
        setActivityData(workoutData || []); // Keep using activityData state for compatibility
        console.log("Workout data loaded:", workoutData?.length || 0, "records");
        
        // Fetch external device data - explicitly list all columns to ensure we get the right names
        const { data: deviceData, error: deviceError } = await supabase
          .from("external_device_connect")
          .select("id, client_id, calories_spent, steps, heart_rate, for_date, other_data, exercise_time")
          .eq("client_id", clientId)
          .order('for_date', { ascending: true });
          
        if (deviceError) throw deviceError;
        
        // Log the raw device data for debugging
        console.log("Raw external device data:", deviceData);
        console.log("Client ID being fetched:", clientId);
        
        // Only use real data from the database. If no data, show 'No data available for this period'.
        let finalDeviceData = deviceData || [];
        setExternalDeviceData(finalDeviceData);
        
        console.log("External device data loaded:", finalDeviceData.length, "records");
        if (finalDeviceData.length > 0) {
          console.log("Sample external device data:", finalDeviceData[0]);
          console.log("Available columns:", Object.keys(finalDeviceData[0]));
        }
        
        // Fetch count of workouts in last 30 days (keeping existing functionality)
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);
        const sinceISOString = sinceDate.toISOString();
        const { count, error: countError } = await supabase
          .from("workout_info")
          .select("id", { count: "exact", head: true })
          .eq("client_id", clientId)
          .gte("created_at", sinceISOString);
          
        if (countError) throw countError;
        setWorkoutCount(count || 0);
        setDataLoaded(true);
      } catch (err: any) {
        setActivityError(err.message || "Failed to fetch workout data");
        setActivityData([]);
        setExternalDeviceData([]);
        setWorkoutCount(0);
      } finally {
        setLoadingActivity(false);
      }
    })();
  }, [clientId, isActive, dataLoaded]);

  // Filter data whenever activity data, external device data, or time range changes
  useEffect(() => {
    filterDataByTimeRange();
  }, [activityData, externalDeviceData, timeRange, filterDataByTimeRange]);

  // Update metrics data whenever filtered data changes
  useEffect(() => {
    updateMetricsData();
  }, [filteredActivityData, filteredExternalDeviceData, updateMetricsData]);

  const selectedMetrics = selectedKeys
    .map((key: string) => {
      const metric = METRIC_LIBRARY.find((m) => m.key === key);
      // Log the selected metric and its data
      if (metric) {
        console.log(`Selected metric ${metric.label} has ${metric.data.length} data points`);
      }
      return metric;
    })
    .filter(Boolean) as typeof METRIC_LIBRARY
  const availableMetrics = METRIC_LIBRARY.filter((m) => !selectedKeys.includes(m.key))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = selectedKeys.indexOf(active.id as string)
      const newIndex = selectedKeys.indexOf(over.id as string)
      setSelectedKeys(arrayMove(selectedKeys, oldIndex, newIndex))
    }
    setDraggingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} />
      </div>

      {/* Client Stats Section */}
      <ClientStats clientId={clientId} isActive={isActive} />
      
      {/* Enhanced Customization Panel */}
      <MetricsCustomizationPanel
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDragEnd={handleDragEnd}
      />

      {/* Enhanced Metrics Grid */}
      <MetricsGrid selectedKeys={selectedKeys} onDragEnd={handleDragEnd} />

      {/* Enhanced Workout History Table */}
      <WorkoutHistoryTable
        activityData={activityData}
        loadingActivity={loadingActivity}
        activityError={activityError}
        workoutCount={workoutCount}
      />

      {/* Side Popups */}
      <SidePopup
        isOpen={showFitnessGoals}
        onClose={() => setShowFitnessGoals(false)}
        title="Fitness Goals"
        icon={<Target className="h-5 w-5 text-white" />}
      >
        <FitnessGoalsSection client={client} onGoalsSaved={() => {}} />
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
        <TrainerNotesSection 
          client={client}
          trainerNotes={trainerNotes || ""}
          setTrainerNotes={setTrainerNotes || (() => {})}
          handleSaveTrainerNotes={handleSaveTrainerNotes || (() => {})}
          isSavingNotes={isSavingNotes || false}
          isEditingNotes={isEditingNotes || false}
          setIsEditingNotes={setIsEditingNotes || (() => {})}
          notesDraft={notesDraft || ""}
          setNotesDraft={setNotesDraft || (() => {})}
          notesError={notesError || null}
          setNotesError={setNotesError || (() => {})}
          isGeneratingAnalysis={isGeneratingAnalysis || false}
          handleSummarizeNotes={handleSummarizeNotes || (() => {})}
          isSummarizingNotes={isSummarizingNotes || false}
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
    </div>
  )
} 