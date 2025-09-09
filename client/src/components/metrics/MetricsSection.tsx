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
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost"
import { type PopupKey } from "@/components/popups/trainer-popups.config"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp, BarChart3, CheckSquare, Loader2, Filter, Calendar, X, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")

  // Unified popup state
  const [openPopup, setOpenPopup] = useState<PopupKey | null>(null)

  // State for sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"client-data" | "completed-exercises" | "progress-picture">("client-data")

  // State for workout info data
  const [workoutInfoData, setWorkoutInfoData] = useState<any[]>([])
  const [filteredWorkoutInfoData, setFilteredWorkoutInfoData] = useState<any[]>([])
  const [loadingWorkoutInfo, setLoadingWorkoutInfo] = useState(false)
  const [workoutInfoError, setWorkoutInfoError] = useState<string | null>(null)

  // Filter state
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [intensityFilter, setIntensityFilter] = useState<string[]>([])
  const [feedbackFilter, setFeedbackFilter] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // State for collapsible client details
  const [showClientDetails, setShowClientDetails] = useState<boolean>(() => {
    // Load from localStorage, default to false (hidden)
    const saved = localStorage.getItem('metrics-show-details');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('metrics-show-details', JSON.stringify(showClientDetails));
  }, [showClientDetails]);

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
    // Helper to coerce values like "20", "20.5", or "20 g" to numbers
    const toNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const match = value.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : NaN;
      }
      return NaN;
    };
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
              // Convert hydration cups to mL (240 mL per cup) for waterIntake value
              aggregatedData[item.date].total += (metric.key === 'waterIntake')
                ? ((item.qty ?? 0) * 240)
                : (item.qty ?? 0);
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
    
    // Process meal data (Calories, Protein, Carbs, Fat)
    const processMealData = () => {
      if (!filteredMealData.length) return;
      
      if (timeRange === "7D") {
        // For 7D: Group by individual days and sum all meals per day
        const dailyCalories: Record<string, number> = {};
        const dailyProtein: Record<string, number> = {};
        const dailyCarbs: Record<string, number> = {};
        const dailyFat: Record<string, number> = {};
        
        filteredMealData.forEach(item => {
          const date = new Date(item.created_at);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
          
          const add = (map: Record<string, number>, value: any) => {
            const numeric = toNumber(value);
            if (!isNaN(numeric)) {
              if (!map[displayDate]) map[displayDate] = 0;
              map[displayDate] += numeric;
            }
          };
          add(dailyCalories, item.calories);
          add(dailyProtein, item.protein);
          add(dailyCarbs, item.carbs);
          add(dailyFat, item.fat);
        });
        
        // Update 7D nutrition metrics
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "meal_info" && ["calories", "protein", "carbs", "fat"].includes(String(metric.columnName))) {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              let dailyTotal: number | null = null;
              if (metric.columnName === "calories") dailyTotal = dailyCalories[timelineItem.date] ?? null;
              if (metric.columnName === "protein") dailyTotal = dailyProtein[timelineItem.date] ?? null;
              if (metric.columnName === "carbs") dailyTotal = dailyCarbs[timelineItem.date] ?? null;
              if (metric.columnName === "fat") dailyTotal = dailyFat[timelineItem.date] ?? null;
              return {
                date: timelineItem.date,
                qty: dailyTotal ?? null,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
        
      } else {
        // For 30D/90D: Calculate daily average for each week
        const weeklyCalories: Record<string, {total: number, daysWithData: Set<string>}> = {};
        const weeklyProtein: Record<string, {total: number, daysWithData: Set<string>}> = {};
        const weeklyCarbs: Record<string, {total: number, daysWithData: Set<string>}> = {};
        const weeklyFat: Record<string, {total: number, daysWithData: Set<string>}> = {};
        
        filteredMealData.forEach(item => {
          const date = new Date(item.created_at);
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const weekKey = `${monthName} W${weekNum}`;
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          const add = (map: Record<string, { total: number, daysWithData: Set<string> }>, value: any) => {
            const numeric = toNumber(value);
            if (!isNaN(numeric)) {
              if (!map[weekKey]) map[weekKey] = { total: 0, daysWithData: new Set() };
              map[weekKey].total += numeric;
              map[weekKey].daysWithData.add(dateKey);
            }
          };
          add(weeklyCalories, item.calories);
          add(weeklyProtein, item.protein);
          add(weeklyCarbs, item.carbs);
          add(weeklyFat, item.fat);
        });
        
        // Calculate daily average for each week per nutrient
        const calcAvg = (map: Record<string, { total: number, daysWithData: Set<string> }>) => {
          const out: Record<string, number> = {};
          Object.entries(map).forEach(([weekKey, data]) => {
            if (data.daysWithData.size > 0) {
              out[weekKey] = Number((data.total / data.daysWithData.size).toFixed(1));
            }
          });
          return out;
        };
        const weeklyAvgCalories = calcAvg(weeklyCalories);
        const weeklyAvgProtein = calcAvg(weeklyProtein);
        const weeklyAvgCarbs = calcAvg(weeklyCarbs);
        const weeklyAvgFat = calcAvg(weeklyFat);
        
        // Update nutrition metrics for 30D/90D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "meal_info" && ["calories", "protein", "carbs", "fat"].includes(String(metric.columnName))) {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              let weeklyAverage: number | null = null;
              if (metric.columnName === "calories") weeklyAverage = weeklyAvgCalories[timelineItem.date] ?? null;
              if (metric.columnName === "protein") weeklyAverage = weeklyAvgProtein[timelineItem.date] ?? null;
              if (metric.columnName === "carbs") weeklyAverage = weeklyAvgCarbs[timelineItem.date] ?? null;
              if (metric.columnName === "fat") weeklyAverage = weeklyAvgFat[timelineItem.date] ?? null;
              return {
                date: timelineItem.date,
                qty: weeklyAverage ?? null,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
      }
    };
    
    // Process workout metrics (time and number of exercises)
    const processWorkoutTimeData = () => {
      if (!filteredWorkoutData.length) return;
      
      if (timeRange === "7D") {
        // For 7D: Group by individual days and calculate average workout duration per day (matching manual query)
        const dailyData: Record<string, {totalDuration: number, count: number, exerciseCount: number}> = {};
        
        filteredWorkoutData.forEach(item => {
          const date = new Date(item.created_at);
          const displayDate = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
          
          if (item.duration && !isNaN(Number(item.duration))) {
            if (!dailyData[displayDate]) {
              dailyData[displayDate] = { totalDuration: 0, count: 0, exerciseCount: 0 };
            }
            dailyData[displayDate].totalDuration += Number(item.duration);
            dailyData[displayDate].count += 1;
          }
          // Count each row as an exercise entry for the day
          if (!dailyData[displayDate]) {
            dailyData[displayDate] = { totalDuration: 0, count: 0, exerciseCount: 0 };
          }
          dailyData[displayDate].exerciseCount += 1;
        });
        
        // Update workout time metric for 7D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "workout_info" && metric.columnName === "duration") {
            const completeTimeline = generateCompleteTimeline();
            
            const mergedData = completeTimeline.map(timelineItem => {
              const dayData = dailyData[timelineItem.date];
              const dailyAverage = dayData && dayData.count > 0 ? Number((dayData.totalDuration / dayData.count).toFixed(1)) : null;
              return {
                date: timelineItem.date,
                qty: dailyAverage,
                fullDate: timelineItem.fullDate
              };
            });
            
            METRIC_LIBRARY[index].data = mergedData;
          }
        });

        // Update number of exercises metric for 7D (daily count)
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "workout_info" && metric.columnName === "count") {
            const completeTimeline = generateCompleteTimeline();
            const mergedData = completeTimeline.map(timelineItem => {
              const dayData = dailyData[timelineItem.date];
              const count = dayData ? dayData.exerciseCount : null;
              return {
                date: timelineItem.date,
                qty: count,
                fullDate: timelineItem.fullDate
              };
            });
            METRIC_LIBRARY[index].data = mergedData;
          }
        });

        // Update workout logins (same as number of exercises) for 7D
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.key === "workoutLogins") {
            const completeTimeline = generateCompleteTimeline();
            const mergedData = completeTimeline.map(timelineItem => {
              const dayData = dailyData[timelineItem.date];
              const count = dayData ? dayData.exerciseCount : null;
              return {
                date: timelineItem.date,
                qty: count,
                fullDate: timelineItem.fullDate
              };
            });
            METRIC_LIBRARY[index].data = mergedData;
          }
        });
        
      } else {
        // For 30D/90D: Calculate daily average for each week
        const weeklyData: Record<string, {totalDuration: number, daysWithData: Set<string>, exerciseCount: number}> = {};
        
        filteredWorkoutData.forEach(item => {
          const date = new Date(item.created_at);
          const weekNum = Math.ceil(date.getDate() / 7);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const weekKey = `${monthName} W${weekNum}`;
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          if (item.duration && !isNaN(Number(item.duration))) {
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = { totalDuration: 0, daysWithData: new Set(), exerciseCount: 0 };
            }
            weeklyData[weekKey].totalDuration += Number(item.duration);
            weeklyData[weekKey].daysWithData.add(dateKey);
          }
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { totalDuration: 0, daysWithData: new Set(), exerciseCount: 0 };
          }
          weeklyData[weekKey].exerciseCount += 1;
        });
        
        // Calculate daily average for each week
        const weeklyAverages: Record<string, number> = {};
        Object.entries(weeklyData).forEach(([weekKey, data]) => {
          if (data.daysWithData.size > 0) {
            weeklyAverages[weekKey] = Number((data.totalDuration / data.daysWithData.size).toFixed(1));
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

        // Update number of exercises metric for 30D/90D: daily average count per week
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.dataSource === "workout_info" && metric.columnName === "count") {
            const completeTimeline = generateCompleteTimeline();
            const mergedData = completeTimeline.map(timelineItem => {
              const week = weeklyData[timelineItem.date];
              const avgCount = week && week.daysWithData.size > 0
                ? Number((week.exerciseCount / week.daysWithData.size).toFixed(1))
                : null;
              return {
                date: timelineItem.date,
                qty: avgCount,
                fullDate: timelineItem.fullDate
              };
            });
            METRIC_LIBRARY[index].data = mergedData;
          }
        });

        // Update workout logins for 30D/90D: daily average count per week
        METRIC_LIBRARY.forEach((metric, index) => {
          if (metric.key === "workoutLogins") {
            const completeTimeline = generateCompleteTimeline();
            const mergedData = completeTimeline.map(timelineItem => {
              const week = weeklyData[timelineItem.date];
              const avgCount = week && week.daysWithData.size > 0
                ? Number((week.exerciseCount / week.daysWithData.size).toFixed(1))
                : null;
              return {
                date: timelineItem.date,
                qty: avgCount,
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

    // Process engagement-like logins from other tables
    const processEngagementLogins = () => {
      // Meal logins: count rows per day/week in filteredMealData
      if (filteredMealData.length) {
        if (timeRange === "7D") {
          const daily: Record<string, number> = {};
          filteredMealData.forEach(item => {
            const date = new Date(item.created_at);
            const label = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
            daily[label] = (daily[label] || 0) + 1;
          });
          METRIC_LIBRARY.forEach((metric, index) => {
            if (metric.key === 'mealLogins') {
              const timeline = generateCompleteTimeline();
              METRIC_LIBRARY[index].data = timeline.map(t => ({ date: t.date, qty: daily[t.date] ?? null, fullDate: t.fullDate }));
            }
          });
        } else {
          const weekly: Record<string, { total: number, days: Set<string> }> = {};
          filteredMealData.forEach(item => {
            const date = new Date(item.created_at);
            const weekNum = Math.ceil(date.getDate() / 7);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const weekKey = `${monthName} W${weekNum}`;
            const dateKey = date.toISOString().split('T')[0];
            if (!weekly[weekKey]) weekly[weekKey] = { total: 0, days: new Set() };
            weekly[weekKey].total += 1;
            weekly[weekKey].days.add(dateKey);
          });
          METRIC_LIBRARY.forEach((metric, index) => {
            if (metric.key === 'mealLogins') {
              const timeline = generateCompleteTimeline();
              METRIC_LIBRARY[index].data = timeline.map(t => {
                const w = weekly[t.date];
                const avg = w && w.days.size > 0 ? Number((w.total / w.days.size).toFixed(1)) : null;
                return { date: t.date, qty: avg, fullDate: t.fullDate };
              });
            }
          });
        }
      }

      // Hydration logins: count rows where activity='hydration' in filteredActivityData
      if (filteredActivityData.length) {
        const hydration = filteredActivityData.filter(i => String(i.activity || '').toLowerCase().trim() === 'hydration');
        if (hydration.length) {
          if (timeRange === '7D') {
            const daily: Record<string, number> = {};
            hydration.forEach(item => {
              const date = new Date(item.created_at);
              const label = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
              daily[label] = (daily[label] || 0) + 1;
            });
            METRIC_LIBRARY.forEach((metric, index) => {
              if (metric.key === 'hydrationLogins') {
                const timeline = generateCompleteTimeline();
                METRIC_LIBRARY[index].data = timeline.map(t => ({ date: t.date, qty: daily[t.date] ?? null, fullDate: t.fullDate }));
              }
            });
          } else {
            const weekly: Record<string, { total: number, days: Set<string> }> = {};
            hydration.forEach(item => {
              const date = new Date(item.created_at);
              const weekNum = Math.ceil(date.getDate() / 7);
              const monthName = date.toLocaleString('default', { month: 'short' });
              const weekKey = `${monthName} W${weekNum}`;
              const dateKey = date.toISOString().split('T')[0];
              if (!weekly[weekKey]) weekly[weekKey] = { total: 0, days: new Set() };
              weekly[weekKey].total += 1;
              weekly[weekKey].days.add(dateKey);
            });
            METRIC_LIBRARY.forEach((metric, index) => {
              if (metric.key === 'hydrationLogins') {
                const timeline = generateCompleteTimeline();
                METRIC_LIBRARY[index].data = timeline.map(t => {
                  const w = weekly[t.date];
                  const avg = w && w.days.size > 0 ? Number((w.total / w.days.size).toFixed(1)) : null;
                  return { date: t.date, qty: avg, fullDate: t.fullDate };
                });
              }
            });
          }
        }
      }

      // Wakeup Logins: derive from three related activities in activity_info
      // Activities considered: Sleep Quality, Sleep Duration, Energy Level
      // Count total entries across these per day/week, then divide by 3
      if (filteredActivityData.length) {
        const normalizedActivities = new Set([
          'sleep quality',
          'sleep duration',
          'energy level',
        ]);
        const wakeGroup = filteredActivityData.filter(i =>
          normalizedActivities.has(String(i.activity || '').toLowerCase().trim())
        );
        if (wakeGroup.length) {
          if (timeRange === '7D') {
            const daily: Record<string, number> = {};
            wakeGroup.forEach(item => {
              const date = new Date(item.created_at);
              const label = date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
              daily[label] = (daily[label] || 0) + 1;
            });
            METRIC_LIBRARY.forEach((metric, index) => {
              if (metric.key === 'wakeupLogins') {
                const timeline = generateCompleteTimeline();
                METRIC_LIBRARY[index].data = timeline.map(t => ({
                  date: t.date,
                  qty: daily[t.date] != null ? Number((daily[t.date] / 3).toFixed(1)) : null,
                  fullDate: t.fullDate
                }));
              }
            });
          } else {
            const weekly: Record<string, { total: number, days: Set<string> }> = {};
            wakeGroup.forEach(item => {
              const date = new Date(item.created_at);
              const weekNum = Math.ceil(date.getDate() / 7);
              const monthName = date.toLocaleString('default', { month: 'short' });
              const weekKey = `${monthName} W${weekNum}`;
              const dateKey = date.toISOString().split('T')[0];
              if (!weekly[weekKey]) weekly[weekKey] = { total: 0, days: new Set() };
              weekly[weekKey].total += 1;
              weekly[weekKey].days.add(dateKey);
            });
            METRIC_LIBRARY.forEach((metric, index) => {
              if (metric.key === 'wakeupLogins') {
                const timeline = generateCompleteTimeline();
                METRIC_LIBRARY[index].data = timeline.map(t => {
                  const w = weekly[t.date];
                  const avg = w && w.days.size > 0 ? Number(((w.total / 3) / w.days.size).toFixed(1)) : null;
                  return { date: t.date, qty: avg, fullDate: t.fullDate };
                });
              }
            });
          }
        }
      }
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
    processEngagementLogins();

    // Ensure every metric has at least a baseline timeline (so charts render axes)
    const baselineTimeline = generateCompleteTimeline();
    METRIC_LIBRARY.forEach((metric, index) => {
      const current = METRIC_LIBRARY[index].data;
      if (!current || current.length === 0) {
        METRIC_LIBRARY[index].data = baselineTimeline;
      }
    });
    
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
        
        // Fetch meal data for nutrition tracking
        const { data: mealData, error: mealError } = await supabase
          .from("meal_info")
          .select("id, client_id, calories, protein, carbs, fat, created_at")
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

  // Fetch workout info data when component mounts or clientId changes
  useEffect(() => {
    if (!clientId || !isActive) {
      return;
    }
    
    const fetchWorkoutInfo = async () => {
      setLoadingWorkoutInfo(true);
      setWorkoutInfoError(null);
      
      try {
        const { data, error } = await supabase
          .from("workout_info")
          .select("*")
          .eq("client_id", clientId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('❌ Workout info error:', error);
          throw error;
        }
        
        setWorkoutInfoData(data || []);
      } catch (err: any) {
        setWorkoutInfoError(err.message || "Failed to fetch workout info");
        setWorkoutInfoData([]);
      } finally {
        setLoadingWorkoutInfo(false);
      }
    };
    
    fetchWorkoutInfo();
  }, [clientId, isActive]);

  // Filter workout info data based on filter criteria (cumulative filtering)
  useEffect(() => {
    let filtered = [...workoutInfoData];

    // Apply filters in sequence - each filter narrows down the previous result
    
    // Step 1: Date filter (applied first)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(workout => new Date(workout.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter(workout => new Date(workout.created_at) <= toDate);
    }

    // Step 2: Intensity filter (applied to date-filtered results)
    if (intensityFilter.length > 0) {
      filtered = filtered.filter(workout => 
        workout.intensity && intensityFilter.some(filter => 
          workout.intensity.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    // Step 3: Feedback filter (applied to date + intensity filtered results)
    if (feedbackFilter.length > 0) {
      filtered = filtered.filter(workout => 
        workout.feedback && feedbackFilter.some(filter => 
          workout.feedback.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    setFilteredWorkoutInfoData(filtered);
  }, [workoutInfoData, dateFrom, dateTo, intensityFilter, feedbackFilter]);

  // Clear all filters
  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setIntensityFilter([]);
    setFeedbackFilter([]);
  };

  // Get unique intensity values for dropdown (based on current filtered data)
  const getUniqueIntensities = () => {
    // Start with all data, then apply filters except intensity filter
    let dataForIntensity = [...workoutInfoData];
    
    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      dataForIntensity = dataForIntensity.filter(workout => new Date(workout.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      dataForIntensity = dataForIntensity.filter(workout => new Date(workout.created_at) <= toDate);
    }
    
    // Apply feedback filter (if any)
    if (feedbackFilter.length > 0) {
      dataForIntensity = dataForIntensity.filter(workout => 
        workout.feedback && feedbackFilter.some(filter => 
          workout.feedback.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
    
    const intensities = dataForIntensity
      .map(workout => workout.intensity)
      .filter(intensity => intensity && intensity.trim() !== "")
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return intensities;
  };

  // Get unique feedback keywords for dropdown (based on current filtered data)
  const getUniqueFeedbackKeywords = () => {
    // Start with all data, then apply filters except feedback filter
    let dataForFeedback = [...workoutInfoData];
    
    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      dataForFeedback = dataForFeedback.filter(workout => new Date(workout.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      dataForFeedback = dataForFeedback.filter(workout => new Date(workout.created_at) <= toDate);
    }
    
    // Apply intensity filter (if any)
    if (intensityFilter.length > 0) {
      dataForFeedback = dataForFeedback.filter(workout => 
        workout.intensity && intensityFilter.some(filter => 
          workout.intensity.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
    
    const feedbacks = dataForFeedback
      .map(workout => workout.feedback)
      .filter(feedback => feedback && feedback.trim() !== "")
      .flatMap(feedback => feedback.toLowerCase().split(/\s+/))
      .filter(word => word.length > 2) // Filter out short words
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return feedbacks;
  };


  // Clean up on component mount
  useEffect(() => {
    cleanupAndResetMetrics()
  }, [])

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={(value) => setActiveSubTab(value as "client-data" | "completed-exercises" | "progress-picture")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="client-data" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Client Data
          </TabsTrigger>
          <TabsTrigger value="completed-exercises" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Completed Exercises
          </TabsTrigger>
          <TabsTrigger value="progress-picture" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Progress Picture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client-data" className="space-y-8">
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
            <TrainingPreferencesPlaceholder onClick={() => setOpenPopup('trainingPreferences')} client={client} />
            <NutritionalPreferencesPlaceholder onClick={() => setOpenPopup('nutritionalPreferences')} client={client} />
            <TrainerNotesPlaceholder onClick={() => setOpenPopup('trainerNotes')} client={client} />
            <AICoachInsightsPlaceholder onClick={() => setOpenPopup('aiCoachInsights')} client={client} />
          </div>
        </div>
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
        viewMode={viewMode}
        setViewMode={setViewMode}
        draggingId={draggingId}
        setDraggingId={setDraggingId}
        onDragEnd={handleDragEnd}
        client={client}
      />

      {/* Enhanced Metrics Grid */}
      <MetricsGrid selectedKeys={selectedKeys} onDragEnd={handleDragEnd} chartType={chartType} viewMode={viewMode} />


      {/* Unified Popup Host */}
      <TrainerPopupHost
        openKey={openPopup}
        onClose={() => setOpenPopup(null)}
        context={{
          client,
          onGoalsSaved: () => {},
          lastAIRecommendation,
          onViewFullAnalysis: () => {},
          trainerNotes: trainerNotes || "",
          setTrainerNotes: setTrainerNotes || (() => {}),
          handleSaveTrainerNotes: handleSaveTrainerNotes || (() => {}),
          isSavingNotes: isSavingNotes || false,
          isEditingNotes: isEditingNotes || false,
          setIsEditingNotes: setIsEditingNotes || (() => {}),
          notesDraft: notesDraft || "",
          setNotesDraft: setNotesDraft || (() => {}),
          notesError: notesError || null,
          setNotesError: setNotesError || (() => {}),
          isGeneratingAnalysis: isGeneratingAnalysis || false,
          handleSummarizeNotes: handleSummarizeNotes || (() => {}),
          isSummarizingNotes: isSummarizingNotes || false,
          setLastAIRecommendation
        }}
      />
        </TabsContent>

        <TabsContent value="completed-exercises" className="space-y-6">
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 dark:bg-gray-900/95 dark:border-gray-700/50 shadow-xl rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Completed Exercises
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Filter Criteria</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Filters are applied cumulatively - each filter narrows down the previous results
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                
                {/* Filter Steps Indicator */}
                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                  <span className="flex items-center">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">1</span>
                    Date Range
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="flex items-center">
                    <span className="w-6 h-6 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">2</span>
                    Intensity
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="flex items-center">
                    <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">3</span>
                    Feedback
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="inline-flex items-center">
                        <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">1</span>
                        Date From
                      </span>
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="inline-flex items-center">
                        <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">1</span>
                        Date To
                      </span>
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Intensity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="inline-flex items-center">
                        <span className="w-4 h-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">2</span>
                        Intensity
                      </span>
                    </label>
                    <Select
                      value={intensityFilter.length > 0 ? intensityFilter[0] : ""}
                      onValueChange={(value) => {
                        if (value && !intensityFilter.includes(value)) {
                          setIntensityFilter(prev => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select intensity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueIntensities().length > 0 ? (
                          getUniqueIntensities().map((intensity) => (
                            <SelectItem key={intensity} value={intensity}>
                              <div className="flex items-center justify-between w-full">
                                <span>{intensity}</span>
                                {intensityFilter.includes(intensity) && (
                                  <span className="text-green-600 ml-2">✓</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            No intensity data available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {intensityFilter.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {intensityFilter.map((intensity) => (
                          <span
                            key={intensity}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          >
                            {intensity}
                            <button
                              onClick={() => setIntensityFilter(prev => prev.filter(item => item !== intensity))}
                              className="ml-1 hover:text-green-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feedback Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span className="inline-flex items-center">
                        <span className="w-4 h-4 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-medium mr-2">3</span>
                        Feedback Keywords
                      </span>
                    </label>
                    <Select
                      value={feedbackFilter.length > 0 ? feedbackFilter[0] : ""}
                      onValueChange={(value) => {
                        if (value && !feedbackFilter.includes(value)) {
                          setFeedbackFilter(prev => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select feedback keyword..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getUniqueFeedbackKeywords().length > 0 ? (
                          getUniqueFeedbackKeywords().map((keyword) => (
                            <SelectItem key={keyword} value={keyword}>
                              <div className="flex items-center justify-between w-full">
                                <span>{keyword}</span>
                                {feedbackFilter.includes(keyword) && (
                                  <span className="text-purple-600 ml-2">✓</span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            No feedback data available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {feedbackFilter.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {feedbackFilter.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          >
                            {keyword}
                            <button
                              onClick={() => setFeedbackFilter(prev => prev.filter(item => item !== keyword))}
                              className="ml-1 hover:text-purple-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredWorkoutInfoData.length} of {workoutInfoData.length} exercises
                </div>
              </div>
            )}
            
            {loadingWorkoutInfo ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading workout data...</span>
              </div>
            ) : workoutInfoError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error loading workout data</div>
                <p className="text-gray-600 dark:text-gray-400">{workoutInfoError}</p>
              </div>
            ) : workoutInfoData.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Completed Exercises Yet</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Completed exercises will appear here once the client starts their workout program.
                </p>
              </div>
            ) : filteredWorkoutInfoData.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Results Found</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  No exercises match your current filter criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Exercise</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Intensity</TableHead>
                      <TableHead>Sets</TableHead>
                      <TableHead>Reps</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Rest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkoutInfoData.map((workout, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(workout.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{workout.exercise_name || 'N/A'}</TableCell>
                        <TableCell>{workout.duration || 'N/A'}</TableCell>
                        <TableCell>{workout.intensity || 'N/A'}</TableCell>
                        <TableCell>{workout.sets || 'N/A'}</TableCell>
                        <TableCell>{workout.reps || 'N/A'}</TableCell>
                        <TableCell>{workout.distance || 'N/A'}</TableCell>
                        <TableCell>{workout.weight || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{workout.feedback || 'N/A'}</TableCell>
                        <TableCell>{workout.rest || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress-picture" className="space-y-6">
          <ProgressPicturesCard clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 