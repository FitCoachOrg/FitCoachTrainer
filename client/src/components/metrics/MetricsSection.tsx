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
import { MetricsCustomizationPanel } from "./MetricsCustomizationPanel"
import { MetricsGrid } from "./MetricsGrid"
import { WorkoutHistoryTable } from "./WorkoutHistoryTable"
import { ProgressPicturesCard } from "./ProgressPicturesCard"
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
  setLastAIRecommendation?: (analysis: any) => void
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
  isSummarizingNotes,
  setLastAIRecommendation
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("selectedMetrics")
    const initialKeys = saved ? JSON.parse(saved) : ["heartRate", "steps", "caloriesSpent", "exerciseTime"]
    
    // Clean up invalid keys that don't exist in METRIC_LIBRARY
    const validKeys = initialKeys.filter((key: string) => 
      METRIC_LIBRARY.some(metric => metric.key === key)
    )
    
    console.log('🔍 MetricsSection Initial State Debug:', {
      saved: saved,
      initialKeys: initialKeys,
      initialKeysLength: initialKeys.length,
      validKeys: validKeys,
      validKeysLength: validKeys.length,
      invalidKeys: initialKeys.filter((key: string) => 
        !METRIC_LIBRARY.some(metric => metric.key === key)
      )
    })
    
    // If we cleaned up invalid keys, save the cleaned version
    if (validKeys.length !== initialKeys.length) {
      localStorage.setItem("selectedMetrics", JSON.stringify(validKeys))
      console.log('🧹 Cleaned up invalid metric keys and saved to localStorage')
    }
    
    return validKeys
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [activityData, setActivityData] = useState<any[]>([])
  const [workoutData, setWorkoutData] = useState<any[]>([])
  const [filteredWorkoutData, setFilteredWorkoutData] = useState<any[]>([])
  const [externalDeviceData, setExternalDeviceData] = useState<any[]>([])
  const [filteredActivityData, setFilteredActivityData] = useState<any[]>([])
  const [filteredExternalDeviceData, setFilteredExternalDeviceData] = useState<any[]>([])
  // New state for additional data sources
  const [mealData, setMealData] = useState<any[]>([])
  const [filteredMealData, setFilteredMealData] = useState<any[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [filteredEngagementData, setFilteredEngagementData] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [workoutCount, setWorkoutCount] = useState<number>(0)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D")
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  
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
    
    // Filter workout data if available
    if (workoutData.length) {
      const filteredWorkout = workoutData.filter(item => 
        new Date(item.created_at) >= cutoffDate
      );
      setFilteredWorkoutData(filteredWorkout);
    }
    
    // Filter external device data if available
    if (externalDeviceData.length) {
      const filteredExternal = externalDeviceData.filter(item => 
        new Date(item.for_date) >= cutoffDate
      );
      setFilteredExternalDeviceData(filteredExternal);
    }
    
    // Filter meal data if available
    if (mealData.length) {
      const filteredMeal = mealData.filter(item => 
        new Date(item.created_at) >= cutoffDate
      );
      setFilteredMealData(filteredMeal);
    }
    
    // Filter engagement data if available
    if (engagementData.length) {
      const filteredEngagement = engagementData.filter(item => 
        new Date(item.for_date) >= cutoffDate
      );
      setFilteredEngagementData(filteredEngagement);
    }
  }, [activityData, workoutData, externalDeviceData, mealData, engagementData, timeRange]);

  // Helper function to generate complete timeline
  const generateCompleteTimeline = () => {
    const timeline = [];
    const today = new Date();
    
    if (timeRange === "7D") {
      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        timeline.push({
          date: displayDate,
          fullDate: dateStr,
          qty: null
        });
      }
    } else {
      // Generate weeks for 30D (4 weeks) or 90D (12 weeks)
      const weeks = timeRange === "30D" ? 4 : 12;
      for (let i = weeks - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay() + 1);
        const monthName = startOfWeek.toLocaleString('default', { month: 'short' });
        const weekNum = Math.ceil(startOfWeek.getDate() / 7);
        const displayDate = `${monthName} W${weekNum}`;
        const fullDate = startOfWeek.toISOString().split('T')[0];
        timeline.push({
          date: displayDate,
          fullDate: fullDate,
          qty: null
        });
      }
    }
    
    return timeline;
  };

  // Update metrics data from multiple data sources
  const updateMetricsData = useCallback(() => {
    // Process activity_info data
    const processActivityData = () => {
      if (!filteredActivityData.length) return;
      
      // Group activity data by activity type
      const groupedData: Record<string, any[]> = {};
      filteredActivityData.forEach(item => {
        // Normalize certain measurement names and typos while preserving others
        const raw = String(item.activity || '').toLowerCase().trim();
        let keyForGrouping: string;
        if (["hip", "waist", "waste", "bicep", "thigh", "thight"].includes(raw)) {
          const normalized = raw === "waste" ? "waist" : raw === "thight" ? "thigh" : raw;
          keyForGrouping = normalized; // use lowercase canonical for measurements
        } else {
          keyForGrouping = item.activity; // keep original for other metrics that rely on exact labels
        }
        if (!groupedData[keyForGrouping]) {
          groupedData[keyForGrouping] = [];
        }
        
        // Format date based on time range
        const date = new Date(item.created_at);
        let dateStr: string;
        let displayDate: string;
        
        if (timeRange === "7D") {
          // Daily for 7D
          dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        } else {
          // Weekly for 30D and 90D
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          dateStr = `${monthName} W${weekNum}`; // e.g., "Jan W1"
          displayDate = dateStr;
        }
        
        // Add to grouped data
        groupedData[keyForGrouping].push({
          date: displayDate,
          fullDate: dateStr,
          qty: Number(item.qty),
          unit: item.unit,
          created_at: item.created_at
        });
      });
      
      // Update metrics from activity_info
      METRIC_LIBRARY.forEach((metric, index) => {
        if (metric.dataSource !== "activity_info") return;
        
        // Special handling for derived Hips/Waist ratio
        if (metric.key === "hipsWaistRatio") {
          const completeTimeline = generateCompleteTimeline();
          // Aggregate hip and waist values by period
          const aggregate = (arr: any[] | undefined) => {
            const out: Record<string, { total: number, count: number }> = {};
            (arr || []).forEach(item => {
              if (!out[item.date]) out[item.date] = { total: 0, count: 0 };
              out[item.date].total += item.qty;
              out[item.date].count += 1;
            });
            return out;
          };
          const hipAgg = aggregate(groupedData["hip"]);
          const waistAgg = aggregate(groupedData["waist"]);
          const mergedData = completeTimeline.map(timelineItem => {
            const h = hipAgg[timelineItem.date];
            const w = waistAgg[timelineItem.date];
            let ratio: number | null = null;
            if (h && w && w.count > 0) {
              const hipAvg = h.total / h.count;
              const waistAvg = w.total / w.count;
              if (waistAvg > 0) ratio = Number((hipAvg / waistAvg).toFixed(3));
            }
            return { date: timelineItem.date, qty: ratio, fullDate: timelineItem.fullDate };
          });
          METRIC_LIBRARY[index].data = mergedData;
          return;
        }
        
        const activityName = metric.activityName;
        
        // Generate complete timeline
        const completeTimeline = generateCompleteTimeline();
        
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
          
          // Merge with complete timeline
          const mergedData = completeTimeline.map(timelineItem => {
            const existingData = aggregatedData[timelineItem.date];
            return {
              date: timelineItem.date,
              qty: existingData ? Number((existingData.total / existingData.count).toFixed(1)) : null,
              fullDate: timelineItem.fullDate
            };
          });
          
          // Update the metric data
          METRIC_LIBRARY[index].data = mergedData;
        } else {
          // No data for this metric, use empty timeline
          METRIC_LIBRARY[index].data = completeTimeline;
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
        let displayDate: string;
        
        if (timeRange === "7D") {
          // Daily for 7D - use exact date
          dateStr = date.toISOString().split('T')[0];
          displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        } else {
          // Weekly for 30D/90D - get start of week (Monday)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay() + 1);
          const monthName = startOfWeek.toLocaleString('default', { month: 'short' });
          const weekNum = Math.ceil(startOfWeek.getDate() / 7);
          dateStr = `${monthName} W${weekNum}`;
          displayDate = dateStr;
        }
        
        METRIC_LIBRARY.forEach(metric => {
          if (metric.dataSource === "external_device_connect" && metric.columnName) {
            const columnName = metric.columnName;
            if (columnName in item && item[columnName] !== null) {
              if (!columnDataMap[columnName]) {
                columnDataMap[columnName] = [];
              }
              columnDataMap[columnName].push({
                date: displayDate,
                fullDate: dateStr,
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
        
        // Generate complete timeline
        const completeTimeline = generateCompleteTimeline();
        
        // Aggregate actual data
        const aggregatedData: Record<string, {total: number, count: number}> = {};
        columnDataMap[columnName].forEach(item => {
          const date = item.date;
          if (!aggregatedData[date]) {
            aggregatedData[date] = { total: 0, count: 0 };
          }
          aggregatedData[date].total += item.qty;
          aggregatedData[date].count += 1;
        });
        
        // Merge with complete timeline
        const mergedData = completeTimeline.map(timelineItem => {
          const existingData = aggregatedData[timelineItem.date];
          return {
            date: timelineItem.date,
            qty: existingData ? Number((existingData.total / existingData.count).toFixed(1)) : null,
            fullDate: timelineItem.fullDate
          };
        });
        
        // Update the metric data
        METRIC_LIBRARY[index].data = mergedData;
      });
    };
    
    // Process meal data
    const processMealData = () => {
      if (!filteredMealData.length) return;
      
      if (timeRange === "7D") {
        // For 7D: Group by individual days and sum all meals per day
        const dailyData: Record<string, number> = {};
        
        filteredMealData.forEach(item => {
          const date = new Date(item.created_at);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
          
          if (item.calories && !isNaN(Number(item.calories))) {
            if (!dailyData[displayDate]) {
              dailyData[displayDate] = 0;
            }
            dailyData[displayDate] += Number(item.calories);
          }
        });
        
        // Update calories metric for 7D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "meal_info" && metric.columnName === "calories") {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              const dailyTotal = dailyData[timelineItem.date];
              return {
                date: timelineItem.date,
                qty: dailyTotal || null,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
        
      } else {
        // For 30D/90D: Calculate daily average for each week
        const weeklyData: Record<string, {total: number, daysWithData: Set<string>}> = {};
        
        filteredMealData.forEach(item => {
          const date = new Date(item.created_at);
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const weekKey = `${monthName} W${weekNum}`;
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (item.calories && !isNaN(Number(item.calories))) {
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { total: 0, daysWithData: new Set() };
            }
            weeklyData[weekKey].total += Number(item.calories);
            weeklyData[weekKey].daysWithData.add(dateKey);
          }
        });
        
        // Calculate daily average for each week
        const weeklyAverages: Record<string, number> = {};
        Object.entries(weeklyData).forEach(([weekKey, data]) => {
          if (data.daysWithData.size > 0) {
            weeklyAverages[weekKey] = Number((data.total / data.daysWithData.size).toFixed(1));
          }
        });
        
        // Update calories metric for 30D/90D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "meal_info" && metric.columnName === "calories") {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              const weeklyAverage = weeklyAverages[timelineItem.date];
              return {
                date: timelineItem.date,
                qty: weeklyAverage || null,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
      }
    };
    
    // Process workout time data
    const processWorkoutTimeData = () => {
      if (!filteredWorkoutData.length) return;
      
      if (timeRange === "7D") {
        // For 7D: Group by individual days and calculate average workout duration per day (matching manual query)
        const dailyData: Record<string, {total: number, count: number}> = {};
        
        filteredWorkoutData.forEach(item => {
          const date = new Date(item.created_at);
          const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
          
          if (item.duration && !isNaN(Number(item.duration))) {
            if (!dailyData[displayDate]) {
              dailyData[displayDate] = { total: 0, count: 0 };
            }
            dailyData[displayDate].total += Number(item.duration);
            dailyData[displayDate].count += 1;
          }
        });
        
        // Update workout time metric for 7D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "workout_info" && metric.columnName === "duration") {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              const dayData = dailyData[timelineItem.date];
              const dailyAverage = dayData ? Number((dayData.total / dayData.count).toFixed(1)) : null;
              return {
                date: timelineItem.date,
                qty: dailyAverage,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
        
      } else {
        // For 30D/90D: Calculate daily average for each week
        const weeklyData: Record<string, {total: number, daysWithData: Set<string>}> = {};
        
        filteredWorkoutData.forEach(item => {
          const date = new Date(item.created_at);
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const weekKey = `${monthName} W${weekNum}`;
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (item.duration && !isNaN(Number(item.duration))) {
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { total: 0, daysWithData: new Set() };
            }
            weeklyData[weekKey].total += Number(item.duration);
            weeklyData[weekKey].daysWithData.add(dateKey);
          }
        });
        
        // Calculate daily average for each week
        const weeklyAverages: Record<string, number> = {};
        Object.entries(weeklyData).forEach(([weekKey, data]) => {
          if (data.daysWithData.size > 0) {
            weeklyAverages[weekKey] = Number((data.total / data.daysWithData.size).toFixed(1));
          }
        });
        
        // Update workout time metric for 30D/90D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "workout_info" && metric.columnName === "duration") {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              const weeklyAverage = weeklyAverages[timelineItem.date];
              return {
                date: timelineItem.date,
                qty: weeklyAverage || null,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
      }
    };
    
    // Process engagement data
    const processEngagementData = () => {
      if (!filteredEngagementData.length) return;
      
      // Group engagement data by date
      const groupedData: Record<string, {total: number, count: number}> = {};
      
      filteredEngagementData.forEach(item => {
        const date = new Date(item.for_date);
        let dateStr: string;
        let displayDate: string;
        
        if (timeRange === "7D") {
          dateStr = date.toISOString().split('T')[0];
          displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        } else {
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          dateStr = `${monthName} W${weekNum}`;
          displayDate = dateStr;
        }
        
        if (!groupedData[displayDate]) {
          groupedData[displayDate] = { total: 0, count: 0 };
        }
        
        // Sum engagement scores for the day/period
        if (item.eng_score && !isNaN(Number(item.eng_score))) {
          groupedData[displayDate].total += Number(item.eng_score);
          groupedData[displayDate].count += 1;
        }
      });
      
      // Update engagement level metric
      METRIC_LIBRARY.forEach((metric, index) => {
        if (metric.dataSource === "client_engagement_score" && metric.columnName === "eng_score") {
          const completeTimeline = generateCompleteTimeline();
          
          const mergedData = completeTimeline.map(timelineItem => {
            const existingData = groupedData[timelineItem.date];
            return {
              date: timelineItem.date,
              qty: existingData ? Number((existingData.total / existingData.count).toFixed(1)) : null,
              fullDate: timelineItem.fullDate
            };
          });
          
          METRIC_LIBRARY[index].data = mergedData;
        }
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
    
    // Process all data sources
    processActivityData();
    processExternalDeviceData();
    processMealData();
    processWorkoutTimeData();
    processEngagementData();
    
  }, [filteredActivityData, filteredExternalDeviceData, filteredMealData, filteredWorkoutData, filteredEngagementData, timeRange]);

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
        // Fetch activity_info data for the client - get all historical activity data
        const { data: activityData, error: activityError } = await supabase
          .from("activity_info")
          .select("*")
          .eq("client_id", clientId)
          .order('created_at', { ascending: true });
          
        if (activityError) {
          console.error('❌ Activity data error:', activityError);
          throw activityError;
        }
        
        setActivityData(activityData || []); // Keep using activityData state for compatibility
        
        // Fetch workout_info data for workout history
        const { data: workoutData, error: workoutError } = await supabase
          .from("workout_info")
          .select("*")
          .eq("client_id", clientId)
          .order('created_at', { ascending: true });
          
        if (workoutError) {
          console.error('❌ Workout data error:', workoutError);
          throw workoutError;
        }
        
        setWorkoutData(workoutData || []); // New state for workout data
        
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
        
        // Fetch meal data for calories tracking
        const { data: mealData, error: mealError } = await supabase
          .from("meal_info")
          .select("id, client_id, calories, created_at")
          .eq("client_id", clientId)
          .order('created_at', { ascending: true });
          
        if (mealError) {
          console.error('❌ Meal data error:', mealError);
        } else {
          setMealData(mealData || []);
          console.log("Meal data loaded:", mealData?.length || 0, "records");
        }
        
        // Fetch engagement data
        const { data: engagementData, error: engagementError } = await supabase
          .from("client_engagement_score")
          .select("id, client_id, eng_score, for_date")
          .eq("client_id", clientId)
          .order('for_date', { ascending: true });
          
        if (engagementError) {
          console.error('❌ Engagement data error:', engagementError);
        } else {
          setEngagementData(engagementData || []);
          console.log("Engagement data loaded:", engagementData?.length || 0, "records");
        }
        
        // Calculate workout count based on selected time range
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

  // Filter data whenever activity data, workout data, external device data, meal data, engagement data, or time range changes
  useEffect(() => {
    filterDataByTimeRange();
  }, [activityData, workoutData, externalDeviceData, mealData, engagementData, timeRange, filterDataByTimeRange]);

  // Update metrics data whenever filtered data changes
  useEffect(() => {
    updateMetricsData();
  }, [filteredActivityData, filteredExternalDeviceData, filteredMealData, filteredWorkoutData, filteredEngagementData, updateMetricsData]);

  // Calculate workout count based on time range
  useEffect(() => {
    if (!clientId || !dataLoaded) return;
    
    const calculateWorkoutCount = async () => {
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
      
      const sinceISOString = cutoffDate.toISOString();
      const { count, error: countError } = await supabase
        .from("workout_info")
        .select("id", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("created_at", sinceISOString);
        
      if (countError) {
        console.error('❌ Workout count error:', countError);
        setWorkoutCount(0);
      } else {
        setWorkoutCount(count || 0);
      }
    };
    
    calculateWorkoutCount();
  }, [clientId, timeRange, dataLoaded]);

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

  // Function to clean up and reset metrics
  const cleanupAndResetMetrics = () => {
    const validKeys = selectedKeys.filter((key: string) => 
      METRIC_LIBRARY.some(metric => metric.key === key)
    )
    
    if (validKeys.length !== selectedKeys.length) {
      console.log('🧹 Cleaning up invalid metric keys:', {
        before: selectedKeys,
        after: validKeys,
        removed: selectedKeys.filter(key => !validKeys.includes(key))
      })
      
      setSelectedKeys(validKeys)
      localStorage.setItem("selectedMetrics", JSON.stringify(validKeys))
    }
  }

  // Clean up on component mount
  useEffect(() => {
    cleanupAndResetMetrics()
  }, [])

  return (
    <div className="space-y-8">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} client={client} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} client={client} />
      </div>

      {/* Client Stats Section - Removed */}
      
      {/* Enhanced Customization Panel */}
      <MetricsCustomizationPanel
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        chartType={chartType}
        setChartType={setChartType}
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDragEnd={handleDragEnd}
        client={client}
      />

      {/* Enhanced Metrics Grid */}
      <MetricsGrid selectedKeys={selectedKeys} onDragEnd={handleDragEnd} chartType={chartType} />

      {/* Workout History and Progress Pictures Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout History Card */}
        <WorkoutHistoryTable
          activityData={filteredWorkoutData}
          loadingActivity={loadingActivity}
          activityError={activityError}
          workoutCount={workoutCount}
          timeRange={timeRange}
        />
        
        {/* Progress Pictures Card */}
        <ProgressPicturesCard clientId={clientId} />
      </div>

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
          client={client}
          trainerNotes={trainerNotes || ""}
          setLastAIRecommendation={setLastAIRecommendation}
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
          setLastAIRecommendation={setLastAIRecommendation}
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