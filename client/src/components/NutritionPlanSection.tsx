"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  Utensils, 
  Target, 
  Sparkles, 
  Cpu,
  Table,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Lightbulb,
  Calendar as CalendarIcon,
  ChevronDown,
  Coffee,
  Sun,
  Moon,
  Apple,
  Brain,
  FileText,
  Dumbbell,
  X
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, addDays } from "date-fns"

import { generateNutritionPlan, NutritionPlanResult } from "@/lib/ai-nutrition-plan"
import { supabase } from "@/lib/supabase"
import OpenRouterTest from "./OpenRouterTest"
import { SidePopup } from "@/components/ui/side-popup"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection"

import { generateGroceryListFromPlan, updateGroceryItemState, categorizeGroceryItems } from "@/lib/grocery-list-service";

// Types
interface Meal {
  name: string;
  amount?: string; // New field for meal quantities
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  coach_tip?: string;
}
interface DayPlan {
    day: string;
    total: Meal;
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
}

interface ScheduleItem {
  client_id: number;
  for_date: string;
  type: 'meal';
  task: string;
  summary: string;
  coach_tip?: string;
  details_json: object;
  for_time: string;
  icon?: string;
  is_approved?: boolean;
}

interface NutritionPlanSectionProps {
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

// Loading Spinner Component
const LoadingSpinner = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`} />
  )
}

const NutritionPlanSection = ({ 
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
}: NutritionPlanSectionProps) => {
  // --- All hooks at the top ---
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingGroceryList, setIsGeneratingGroceryList] = useState(false);
  const [showGroceryListPopup, setShowGroceryListPopup] = useState(false);
  const [groceryItems, setGroceryItems] = useState<{ id: string; text: string; checked: boolean }[]>([]);
  const [groceryCategories, setGroceryCategories] = useState<{ name: string; items: { id: string; text: string; checked: boolean }[] }[]>([]);
  const [showFitnessGoals, setShowFitnessGoals] = useState(false);
  const [showAICoachInsights, setShowAICoachInsights] = useState(false);
  const [showTrainerNotes, setShowTrainerNotes] = useState(false);
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false);
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false);
  const { toast } = useToast();
  const [mealItems, setMealItems] = useState<Record<string, Record<string, any[]>>>({});
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'not_approved' | 'partial_approved'>('pending');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: string; mealType: string; field: string; } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  // --- Client Target State and Fetch/Save Logic ---
  const defaultTargets: Record<string, number> = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 70,
  };
  const [clientTargets, setClientTargets] = useState<Record<string, number>>(defaultTargets);
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [targetEditValue, setTargetEditValue] = useState<string>('');
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  // --- Modal Dialog State ---
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [hasExistingSchedule, setHasExistingSchedule] = useState(false);
  // --- Debug logger for approvalStatus ---
  useEffect(() => {
    console.log('approvalStatus changed:', approvalStatus);
  }, [approvalStatus]);

  const handleGenerateGroceryList = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client selected. Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingGroceryList(true);
    try {
      const result = await generateGroceryListFromPlan(clientId, planStartDate);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to generate grocery list.",
          variant: "destructive",
        });
        return;
      }

      setGroceryItems(result.groceryItems);
      if (result.groceryCategories) {
        setGroceryCategories(result.groceryCategories);
      }
      setShowGroceryListPopup(true);
      
      // Show appropriate message based on data source
      if (result.isFromDatabase) {
        toast({
          title: "Grocery List Loaded",
          description: "Loaded existing grocery list from database.",
        });
      } else {
        toast({
          title: "Grocery List Generated",
          description: "New grocery list has been generated and saved to database.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while generating the grocery list.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGroceryList(false);
    }
  };

  // --- Fetch Nutrition Plan from Supabase ---
  const fetchNutritionPlanFromSupabase = async (clientId: number, startDate: Date) => {
    setLoading(true);
    try {
      const startDateString = format(startDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(startDate, 6), 'yyyy-MM-dd');
      // First try to fetch from schedule_preview
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (previewError) throw previewError;
      let data = previewData;
      let dataSource = 'preview';
      // If no preview data, try to fetch from schedule (approved data)
      if (!data || data.length === 0) {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedule')
          .select('*')
          .eq('client_id', clientId)
          .eq('type', 'meal')
          .gte('for_date', startDateString)
          .lte('for_date', endDateString);
        if (scheduleError) throw scheduleError;
        data = scheduleData;
        dataSource = 'schedule';
      }
      const newMealItemsData: Record<string, Record<string, any[]>> = {};
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      daysOfWeek.forEach(day => {
        newMealItemsData[day] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
      });
      if (data && data.length > 0) {
        data.forEach(item => {
          try {
            const dayOfWeek = format(new Date(item.for_date), 'EEEE').toLowerCase();
            const mealTypeMatch = item.summary.match(/^([\w ]+):\s*/);
            if (mealTypeMatch && mealTypeMatch[1]) {
              const mealType = mealTypeMatch[1].toLowerCase();
              const mealData = {
                meal: item.summary.replace(/^[\w ]+:\s*/, ''),
                ...item.details_json,
                amount: item.details_json.amount,
                coach_tip: item.coach_tip
              };
              if (newMealItemsData[dayOfWeek] && newMealItemsData[dayOfWeek][mealType]) {
                // Replace the first meal (or add if empty)
                newMealItemsData[dayOfWeek][mealType][0] = mealData;
              }
            } else {
              console.warn(`Could not parse meal type from summary: "${item.summary}"`);
            }
          } catch (itemError) {
            console.error(`Error processing item:`, item, itemError);
          }
        });
        // Set approval status based on data source
        if (dataSource === 'preview') {
          setApprovalStatus('not_approved');
          toast({ title: "Preview Plan Loaded", description: "Nutrition plan from preview has been loaded. Changes will be auto-saved." });
        } else if (dataSource === 'schedule') {
          setApprovalStatus('approved');
          toast({ title: "Approved Plan Loaded", description: "Approved nutrition plan has been loaded." });
        } else {
          setApprovalStatus('pending');
          toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
        }
      } else {
        setApprovalStatus('pending');
        toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
      }
      setMealItems(newMealItemsData); // Always set the structure, populated or empty.
    } catch (error: any) {
      console.error("Error fetching nutrition plan from Supabase:", error);
      setApprovalStatus('pending');
      toast({
        title: "Database Error",
        description: "Could not fetch the nutrition plan.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  // Helper function to get date for a specific day of the week
  const getDateForDay = (dayName: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayIndex = days.indexOf(dayName)
    const currentDayIndex = planStartDate.getDay()
    const daysToAdd = (dayIndex - currentDayIndex + 7) % 7
    const targetDate = new Date(planStartDate)
    targetDate.setDate(planStartDate.getDate() + daysToAdd)
    return targetDate
  }

  // Get the week days starting from the plan start date
  const getWeekDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const startDayIndex = planStartDate.getDay()
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      const dayIndex = (startDayIndex + i) % 7
      weekDays.push(days[dayIndex])
    }
    
    return weekDays
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'MMM d')
  }

  // Get client meal times dynamically
  const getClientMealTimes = async (clientId: number) => {
    try {
      const { data: clientData, error } = await supabase
        .from('client')
        .select('bf_time, lunch_time, dinner_time, snack_time')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;

      return {
        breakfast: clientData?.bf_time || '08:00:00',
        lunch: clientData?.lunch_time || '13:00:00',
        dinner: clientData?.dinner_time || '19:00:00',
        snacks: clientData?.snack_time || '16:00:00',
      };
    } catch (error) {
      console.error('Error fetching client meal times:', error);
      // Return default times if error
      return {
        breakfast: '08:00:00',
        lunch: '13:00:00',
        dinner: '19:00:00',
        snacks: '16:00:00',
      };
    }
  };

  // Auto-save function for user edits
  const autoSaveToPreview = async (updatedMealItems: Record<string, Record<string, any[]>>) => {
    if (!clientId) return;

    try {
      const mealTimes = await getClientMealTimes(clientId);
      const recordsToInsert: ScheduleItem[] = [];

      // Clear existing preview data for the week
      const startDateString = format(planStartDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(planStartDate, 6), 'yyyy-MM-dd');

      await supabase
        .from('schedule_preview')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);

      // Convert mealItems to schedule_preview format
      Object.keys(updatedMealItems).forEach((dayKey) => {
        const dayDate = getDateForDay(dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
        const forDate = format(dayDate, 'yyyy-MM-dd');

        Object.keys(updatedMealItems[dayKey]).forEach((mealType) => {
          const mealData = updatedMealItems[dayKey][mealType][0];
          if (mealData && mealData.meal) {
            const task = mealType.charAt(0).toUpperCase() + mealType.slice(1);
            recordsToInsert.push({
              client_id: clientId,
              for_date: forDate,
              type: 'meal',
              task: task,
              summary: `${task}: ${mealData.meal}`,
              coach_tip: mealData.coach_tip,
              details_json: {
                calories: mealData.calories || 0,
                protein: mealData.protein || 0,
                carbs: mealData.carbs || 0,
                fats: mealData.fats || 0,
                amount: mealData.amount,
              },
              for_time: mealTimes[mealType as keyof typeof mealTimes],
              icon: '🍽️', // Fork and plate emoji
              is_approved: false, // Set to false for new preview entries
            });
          }
        });
      });

      if (recordsToInsert.length > 0) {
        const { error } = await supabase
          .from('schedule_preview')
          .insert(recordsToInsert);

        if (error) throw error;
        
        // Update approval status after saving
        await checkApprovalStatus();
        
        setHasUnsavedChanges(false);
        toast({ title: "Auto-saved", description: "Changes have been saved to preview.", variant: "default" });
      }
    } catch (error: any) {
      console.error('Error auto-saving to preview:', error);
      toast({
        title: "Auto-save Error",
        description: "Could not save changes to preview.",
        variant: "destructive",
      });
    }
  };

  // Debounced auto-save
  const debouncedAutoSave = (updatedMealItems: Record<string, Record<string, any[]>>) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      autoSaveToPreview(updatedMealItems);
    }, 2000); // 2 second delay

    setAutoSaveTimeout(timeout);
  };

  // Effect to update the 'current' values in the daily targets display
  useEffect(() => {
    const dayKey = selectedDay.toLowerCase();
    const dayMeals = mealItems[dayKey];
    if (dayMeals) {
        let calories = 0, protein = 0, carbs = 0, fats = 0;
        Object.values(dayMeals).forEach((mealType: any[]) => {
            mealType.forEach((meal) => {
                calories += meal.calories || 0;
                protein += meal.protein || 0;
                carbs += meal.carbs || 0;
                fats += meal.fats || 0;
            });
        });
    }
  }, [mealItems, selectedDay]);

  // AI Nutrition Plan Generation
  const handleGeneratePlan = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "No client selected. Please select a client first.",
        variant: "destructive",
      })
      return
    }
    setIsGenerating(true)
    setGeneratedPlan(null); // Clear any previously generated plan
    try {
      const result = await generateNutritionPlan(clientId)
      if (result.success && result.response) {
        const parsedData = JSON.parse(result.response);
        const plan: DayPlan[] = parsedData.nutrition_plan;
        if (plan) {
          // Use the currently selected planStartDate instead of current date
          const selectedPlanStartDate = planStartDate;
          setGeneratedPlan(plan);
          const newMealItemsData: Record<string, Record<string, any[]>> = {};
          plan.forEach((dayPlan) => {
            const dayKey = dayPlan.day.toLowerCase();
            newMealItemsData[dayKey] = {
              breakfast: dayPlan.breakfast ? [{ meal: dayPlan.breakfast.name, amount: dayPlan.breakfast.amount, ...dayPlan.breakfast }] : [],
              lunch: dayPlan.lunch ? [{ meal: dayPlan.lunch.name, amount: dayPlan.lunch.amount, ...dayPlan.lunch }] : [],
              dinner: dayPlan.dinner ? [{ meal: dayPlan.dinner.name, amount: dayPlan.dinner.amount, ...dayPlan.dinner }] : [],
              snacks: dayPlan.snacks ? [{ meal: dayPlan.snacks.name, amount: dayPlan.snacks.amount, ...dayPlan.snacks }] : [],
            };
          });
          setMealItems(newMealItemsData);
          // Save the AI-generated plan to schedule_preview with the selected start date
          await saveNutritionPlanToPreview(plan, clientId, selectedPlanStartDate);
          toast({ title: "Success", description: "AI nutrition plan has been applied!" });
          // Ensure status is recalculated after generation
          await checkApprovalStatus();
        } else {
          toast({ title: "Parsing Error", description: "Could not read the generated plan. Please try again.", variant: "destructive" });
        }
      } else {
        toast({ title: "Generation Error", description: "The AI model did not return a response.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while generating the plan.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Save Nutrition Plan to schedule_preview
  const saveNutritionPlanToPreview = async (plan: DayPlan[], clientId: number, startDate: Date) => {
    try {
      const mealTimes = await getClientMealTimes(clientId);
      
      const recordsToInsert: ScheduleItem[] = [];

      plan.forEach((dayPlan) => {
        // Use getDateForDay to map day names (Monday, Tuesday, etc.) to correct dates
        const forDate = format(getDateForDay(dayPlan.day), 'yyyy-MM-dd');

        Object.keys(mealTimes).forEach(mealType => {
          const meal = dayPlan[mealType as keyof DayPlan] as Meal;
          if (meal && meal.name) {
            recordsToInsert.push({
              client_id: clientId,
              for_date: forDate,
              type: 'meal',
              task: mealType.charAt(0).toUpperCase() + mealType.slice(1),
              summary: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}`,
              coach_tip: meal.coach_tip,
              details_json: {
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                amount: meal.amount,
              },
              for_time: mealTimes[mealType as keyof typeof mealTimes],
              icon: '🍽️', // Fork and plate emoji
              is_approved: false, // Set to false for new preview entries
            });
          }
        });
      });

      if (recordsToInsert.length > 0) {
        // First, delete existing preview entries for the upcoming week
        const startDateString = format(startDate, 'yyyy-MM-dd');
        const endDateString = format(addDays(startDate, 6), 'yyyy-MM-dd');

        const { error: deleteError } = await supabase
          .from('schedule_preview')
          .delete()
          .eq('client_id', clientId)
          .eq('type', 'meal')
          .gte('for_date', startDateString)
          .lte('for_date', endDateString);

        if (deleteError) {
          throw deleteError;
        }

        // Then, insert the new records
        const { error: insertError } = await supabase
          .from('schedule_preview')
          .insert(recordsToInsert);

        if (insertError) {
          throw insertError;
        }
        
        // Update approval status after saving
        await checkApprovalStatus();
      }
    } catch (error: any) {
      console.error("Error saving nutrition plan to preview:", error);
      throw error;
    }
  };

  // --- Status calculation helper ---
  const isApproved = (val: any) => val === true || val === 1 || val === 'true';
  
  // Enhanced status calculation that accounts for missing dates
  const getApprovalStatusFromPreview = (rows: any[], startDate: Date): 'approved' | 'partial_approved' | 'not_approved' | 'pending' => {
    if (!rows || rows.length === 0) return 'pending';
    
    // Get unique days from the rows (since there are multiple meal entries per day)
    const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
    const actualTotalDays = uniqueDays.length;
    
    // Debug logging
    console.log('Status calculation details:');
    console.log('Actual unique days in preview:', actualTotalDays);
    console.log('Unique days:', uniqueDays);
    console.log('Total rows (meal entries):', rows.length);
    console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
    
    // Check if all existing days are approved
    const approvedDays = uniqueDays.filter(day => {
      const dayRows = rows.filter(row => row.for_date === day);
      const allApproved = dayRows.every(row => isApproved(row.is_approved));
      console.log(`Day ${day}: ${dayRows.length} entries, all approved: ${allApproved}`);
      return allApproved;
    });
    
    console.log('Approved days:', approvedDays);
    console.log('Approved days count:', approvedDays.length);
    console.log('Total days count:', actualTotalDays);
    
    // If we have no approved days, it's not approved
    if (approvedDays.length === 0) {
      console.log('❌ Result: not_approved (no days are approved)');
      return 'not_approved';
    }
    
    // If all available days are approved, it's approved (regardless of how many days)
    if (approvedDays.length === actualTotalDays) {
      console.log('✅ Result: approved (all available days are approved)');
      return 'approved';
    }
    
    // If some days are approved but not all, it's partial approved
    console.log('⚠️ Result: partial_approved (some days approved, some not)');
    return 'partial_approved';
  };

  // --- Enhanced Approval Status Check ---
  const checkApprovalStatus = async () => {
    if (!clientId) return;
    try {
      const startDateString = format(planStartDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(planStartDate, 6), 'yyyy-MM-dd');
      // Get all preview rows for the week
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (previewError) console.error('Preview check error:', previewError);
      // Get all schedule rows for the week
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('id')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (scheduleError) console.error('Schedule check error:', scheduleError);
      setHasExistingSchedule(!!(scheduleData && scheduleData.length > 0));
      // Use previewData for status
      const status = getApprovalStatusFromPreview(previewData || [], planStartDate);
      setApprovalStatus(status);
    } catch (error) {
      setApprovalStatus('pending');
      console.error('Error checking approval status:', error);
    }
  };

  // --- Approve Plan Handler with is_approved update ---
  const handleApprovePlan = async () => {
    if (hasExistingSchedule) {
      setShowApproveModal(true);
      return;
    }
    await doApprovePlan();
  };

  const doApprovePlan = async () => {
    setShowApproveModal(false);
    if (!clientId) return;
    setIsApproving(true);
    try {
      const startDateString = format(planStartDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(planStartDate, 6), 'yyyy-MM-dd');
      // Fetch preview data
      const { data: previewData, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (fetchError) throw fetchError;
      if (!previewData || previewData.length === 0) {
        toast({ title: "No Plan to Approve", description: "No nutrition plan found in preview to approve.", variant: "destructive" });
        return;
      }
      // Delete existing schedule data for the week
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (deleteError) throw deleteError;
      // Copy preview data to schedule
      const scheduleRows = previewData.map(({ is_approved, ...rest }) => rest);
      const { error: insertError } = await supabase
        .from('schedule')
        .insert(scheduleRows);
      if (insertError) throw insertError;
      // Set is_approved=true for all days in preview
      const { error: updateError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (updateError) throw updateError;
      setHasUnsavedChanges(false);
      toast({ title: "Plan Approved", description: "The nutrition plan has been approved and saved to the main schedule." });
      // Add a short delay before refreshing status and UI
      typeof window !== 'undefined' && setTimeout(async () => {
        await checkApprovalStatus();
        await fetchNutritionPlanFromSupabase(clientId, planStartDate);
      }, 300);
    } catch (error: any) {
      console.error("Error approving nutrition plan:", error);
      toast({ title: "Approval Error", description: "Could not approve the nutrition plan. Please try again.", variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  // Fetch client targets from Supabase
  const fetchClientTargets = async (clientId: number) => {
    try {
      const { data, error } = await supabase
        .from('client_target')
        .select('goal, target')
        .eq('client_id', clientId);
      if (error) throw error;
      if (data && data.length > 0) {
        const newTargets = { ...defaultTargets };
        data.forEach((row: any) => {
          if (row.goal && row.target !== null) {
            newTargets[row.goal] = row.target;
          }
        });
        setClientTargets(newTargets);
      } else {
        setClientTargets(defaultTargets);
      }
    } catch (error) {
      setClientTargets(defaultTargets);
      console.error('Error fetching client targets:', error);
    }
  };

  // Upsert (insert or update) a client target
  const saveClientTarget = async (goal: string, value: number) => {
    if (!clientId) return;
    setIsSavingTarget(true);
    const payload = { client_id: clientId, goal, target: value };
    try {
      console.log('Upserting client_target payload:', payload);
      const { error } = await supabase
        .from('client_target')
        .upsert([
          payload,
        ]);
      if (error) throw error;
      setClientTargets((prev) => ({ ...prev, [goal]: value }));
      toast({ title: 'Target Updated', description: `Target for ${goal} updated to ${value}.` });
    } catch (error: any) {
      console.error('Error saving client target:', error, JSON.stringify(error));
      toast({ title: 'Error', description: `Could not update target for ${goal}. ${error?.message || JSON.stringify(error)}`, variant: 'destructive' });
    } finally {
      setIsSavingTarget(false);
      setEditingTarget(null);
    }
  };

  // Fetch targets on mount or when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchClientTargets(clientId);
    }
  }, [clientId]);


  // Nutrition Table Component
  const NutritionTable = () => {
    const days = getWeekDays();
    const formatNutrients = (meal: Meal) => meal ? `${meal.calories} cal | P:${meal.protein} C:${meal.carbs} F:${meal.fats}` : 'N/A';
    
    // Check if mealItems has data
    if (Object.keys(mealItems).length === 0) {
      return (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Utensils className="h-10 w-10 text-gray-400" />
            </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">No Nutrition Plan</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Generate a plan to see the details here.</p>
          <Button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Plan
              </>
            )}
          </Button>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-xl border-0 shadow-xl bg-white/95 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs">
          <thead className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-3 font-bold text-gray-900 dark:text-white w-40 text-xs">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Date
                </div>
              </th>
              <th className="text-left py-3 px-3 font-bold text-gray-900 dark:text-white text-xs">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Breakfast
                </div>
              </th>
              <th className="text-left py-3 px-3 font-bold text-gray-900 dark:text-white text-xs">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Lunch
                </div>
              </th>
              <th className="text-left py-3 px-3 font-bold text-gray-900 dark:text-white text-xs">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Dinner
                </div>
              </th>
              <th className="text-left py-3 px-3 font-bold text-gray-900 dark:text-white text-xs">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4 text-green-600 dark:text-green-400" />
                  Snacks
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {days.map((day) => {
              const dayKey = day.toLowerCase();
              const dayMeals = mealItems[dayKey] || {};
              const dayDate = getDateForDay(day);
              
              const dayTotal = {
                  calories: (dayMeals.breakfast?.[0]?.calories || 0) + (dayMeals.lunch?.[0]?.calories || 0) + (dayMeals.dinner?.[0]?.calories || 0) + (dayMeals.snacks?.[0]?.calories || 0),
                  protein: (dayMeals.breakfast?.[0]?.protein || 0) + (dayMeals.lunch?.[0]?.protein || 0) + (dayMeals.dinner?.[0]?.protein || 0) + (dayMeals.snacks?.[0]?.protein || 0),
                  carbs: (dayMeals.breakfast?.[0]?.carbs || 0) + (dayMeals.lunch?.[0]?.carbs || 0) + (dayMeals.dinner?.[0]?.carbs || 0) + (dayMeals.snacks?.[0]?.carbs || 0),
                  fats: (dayMeals.breakfast?.[0]?.fats || 0) + (dayMeals.lunch?.[0]?.fats || 0) + (dayMeals.dinner?.[0]?.fats || 0) + (dayMeals.snacks?.[0]?.fats || 0),
                  name: 'Total'
              };

              // --- On edit, set is_approved=false for that day ---
              const handleMealChange = (dayKey: string, mealType: string, field: string, value: any) => {
                const updatedMealItems = { ...mealItems };
                const mealToUpdate = updatedMealItems[dayKey]?.[mealType]?.[0];

                if (mealToUpdate) {
                  // Ensure numeric fields are stored as numbers
                  const numericFields = ['calories', 'protein', 'carbs', 'fats'];
                  const finalValue = numericFields.includes(field) ? Number(value) || 0 : value;
                  
                  mealToUpdate[field] = finalValue;
                  setMealItems(updatedMealItems);
                  setHasUnsavedChanges(true);
                  
                  // Set is_approved=false for this day in preview
                  const startDateString = format(planStartDate, 'yyyy-MM-dd');
                  const dayDate = getDateForDay(dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
                  const forDate = format(dayDate, 'yyyy-MM-dd');
                  supabase
                    .from('schedule_preview')
                    .update({ is_approved: false })
                    .eq('client_id', clientId)
                    .eq('type', 'meal')
                    .eq('for_date', forDate)
                    .then(() => checkApprovalStatus());
                  // Trigger auto-save
                  debouncedAutoSave(updatedMealItems);
                  
                  // Manually trigger re-render of daily targets
                  setSelectedDay(selectedDay); 
                }
              };

              const handleEdit = (dayKey: string, mealType: string, field: string, currentValue: string | number) => {
                setEditingCell({ day: dayKey, mealType, field });
                setEditValue(currentValue);
              };

              const handleSaveEdit = () => {
                if (editingCell) {
                  handleMealChange(editingCell.day, editingCell.mealType, editingCell.field, editValue);
                  setEditingCell(null);
                }
              };

              const renderEditableCell = (value: string | number, dayKey: string, mealType: string, field: string) => {
                const isEditing = editingCell?.day === dayKey && editingCell?.mealType === mealType && editingCell?.field === field;

                if (isEditing) {
                  // Special handling for meal names (longer text)
                  if (field === 'meal') {
              return (
                      <div className="relative">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          autoFocus
                          rows={2}
                          className="w-full bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-md px-2 py-1 text-sm font-medium text-gray-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 resize-none"
                          style={{ minWidth: '120px' }}
                        />
                        <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                          Press Enter to save, Esc to cancel
                        </div>
                      </div>
                    );
                  }

                  // For numeric fields and amounts
                  return (
                    <div className="relative">
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                        className="w-full bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-md px-2 py-1 text-sm font-medium text-gray-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        style={{ minWidth: field === 'amount' ? '80px' : '60px' }}
                      />
                      <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                        Press Enter to save, Esc to cancel
                      </div>
                    </div>
                  );
                }

                // Non-editing state
                return (
                  <div 
                    onClick={() => handleEdit(dayKey, mealType, field, value)} 
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-2 py-1 transition-all duration-200 group relative"
                    title="Click to edit"
                  >
                    <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {value}
                    </span>
                    <div className="absolute inset-0 bg-blue-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                );
              };

              const renderMealCell = (mealData: any, mealType: string) => {
                const mealTypeColors = {
                  breakfast: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
                  lunch: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
                  dinner: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
                  snacks: 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
                };

                return (
                  <td className="py-2 px-3 align-top">
                    {mealData ? (
                      <div className={`rounded-lg p-3 border-l-4 ${mealTypeColors[mealType as keyof typeof mealTypeColors]} shadow-sm hover:shadow-md transition-all duration-200 min-h-[120px]`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="font-semibold text-gray-900 dark:text-white text-sm flex-1 min-w-0">
                                {renderEditableCell(mealData.meal, dayKey, mealType, 'meal')}
                              </div>
                              {mealData.coach_tip && <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                            </div>
                          </TooltipTrigger>
                          {mealData.coach_tip && <TooltipContent><p className="max-w-xs">{mealData.coach_tip}</p></TooltipContent>}
                        </Tooltip>
                        {mealData.amount && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2 bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1 group">
                            <span className="text-gray-500 dark:text-gray-400 mr-1">📏</span>
                            <span className="group-hover:bg-gray-200 dark:group-hover:bg-gray-700 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.amount, dayKey, mealType, 'amount')}
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 group">
                            <span className="text-red-600 dark:text-red-400 font-medium">Cal:</span> 
                            <span className="font-semibold group-hover:bg-red-100 dark:group-hover:bg-red-900/30 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.calories, dayKey, mealType, 'calories')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 group">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">P:</span> 
                            <span className="font-semibold group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.protein, dayKey, mealType, 'protein')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1 group">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">C:</span> 
                            <span className="font-semibold group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.carbs, dayKey, mealType, 'carbs')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 group">
                            <span className="text-green-600 dark:text-green-400 font-medium">F:</span> 
                            <span className="font-semibold group-hover:bg-green-100 dark:group-hover:bg-green-900/30 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.fats, dayKey, mealType, 'fats')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-xs">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <Utensils className="h-4 w-4" />
                        </div>
                        No meal
                      </div>
                    )}
                  </td>
                );
              };
              
              return (
                <tr 
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-200 ${selectedDay === day ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                >
                  <td className="py-2 px-3 font-bold text-gray-900 dark:text-white text-xs align-top">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-4 text-center shadow-sm min-h-[140px] flex flex-col justify-start w-full">
                      <div className="mb-3">
                        <div className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">{day}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{formatDate(dayDate)}</div>
                      </div>
                      <div className="space-y-1 text-xs w-full">
                        <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded px-3 py-1.5 w-full">
                          <span className="text-red-600 dark:text-red-400 font-medium">Cal:</span> 
                          <span className="font-semibold">{dayTotal.calories}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-1.5 w-full">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">Protein:</span> 
                          <span className="font-semibold">{dayTotal.protein}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-1.5 w-full">
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Carbs:</span> 
                          <span className="font-semibold">{dayTotal.carbs}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded px-3 py-1.5 w-full">
                          <span className="text-green-600 dark:text-green-400 font-medium">Fats:</span> 
                          <span className="font-semibold">{dayTotal.fats}g</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {renderMealCell(dayMeals.breakfast?.[0], 'breakfast')}
                  {renderMealCell(dayMeals.lunch?.[0], 'lunch')}
                  {renderMealCell(dayMeals.dinner?.[0], 'dinner')}
                  {renderMealCell(dayMeals.snacks?.[0], 'snacks')}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // --- Professional UI for Target Editing ---
  const TargetEditGrid = () => {
    const targetMeta = [
      { key: 'calories', label: 'Calories', unit: 'kcal', color: 'from-red-500 to-orange-500', icon: Flame },
      { key: 'protein', label: 'Protein', unit: 'g', color: 'from-sky-500 to-blue-500', icon: Beef },
      { key: 'carbs', label: 'Carbs', unit: 'g', color: 'from-amber-500 to-yellow-500', icon: Wheat },
      { key: 'fats', label: 'Fats', unit: 'g', color: 'from-green-500 to-emerald-500', icon: Droplets },
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {targetMeta.map(({ key, label, unit, color, icon: Icon }) => (
          <div key={key} className={`rounded-2xl shadow-lg bg-gradient-to-br ${color} p-4 flex flex-col items-center relative`}>
            <div className="absolute top-2 right-2">
              {editingTarget === key ? (
                <button
                  className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  onClick={() => setEditingTarget(null)}
                  title="Cancel Edit"
                >
                  ✖️
                </button>
              ) : (
                <button
                  className="text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-200"
                  onClick={() => {
                    setEditingTarget(key);
                    setTargetEditValue(clientTargets[key]?.toString() || '');
                  }}
                  title={`Edit ${label}`}
                >
                  ✏️
                </button>
              )}
            </div>
            <Icon className="h-7 w-7 mb-2 text-white drop-shadow" />
            <div className="text-lg font-bold text-white mb-1">{label}</div>
            {editingTarget === key ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={targetEditValue}
                  onChange={e => setTargetEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = parseInt(targetEditValue, 10);
                      if (!isNaN(val)) saveClientTarget(key, val);
                    } else if (e.key === 'Escape') {
                      setEditingTarget(null);
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(targetEditValue, 10);
                    if (!isNaN(val)) saveClientTarget(key, val);
                    else setEditingTarget(null);
                  }}
                  className="w-20 px-2 py-1 rounded-md border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-900 shadow"
                  autoFocus
                  min={0}
                  disabled={isSavingTarget}
                />
                <span className="text-white font-semibold">{unit}</span>
                {isSavingTarget && editingTarget === key && <LoadingSpinner size="small" />}
              </div>
            ) : (
              <div className="text-3xl font-extrabold text-white flex items-center gap-2">
                {clientTargets[key]}
                <span className="text-lg font-semibold">{unit}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Data loading effect
  useEffect(() => {
    // Only fetch from the database if we are not in the middle of reviewing a newly generated plan.
    if (clientId && isActive && !generatedPlan) {
      fetchNutritionPlanFromSupabase(clientId, planStartDate);
    }
  }, [clientId, isActive, planStartDate, generatedPlan]);

  // Check approval status when component loads or planStartDate changes
  useEffect(() => {
    if (clientId && isActive) {
      checkApprovalStatus();
    }
  }, [clientId, isActive, planStartDate]);

  // Check approval status after data is loaded
  useEffect(() => {
    if (dataLoaded && clientId && isActive) {
      checkApprovalStatus();
    }
  }, [dataLoaded, clientId, isActive]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Early return for loading state
  if (loading) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoadingSpinner />
            <p className="text-gray-600 dark:text-gray-400">Loading nutrition data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      {/* Placeholder Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} client={client} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} client={client} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} client={client} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} client={client} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} client={client} />
      </div>

      {/* Enhanced Header with AI Generation */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-xl">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Nutrition Plan</h3>
            <p className="text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI-powered meal planning and macro tracking
            </p>
            {/* Approval Status Indicator */}
            <div className="flex items-center gap-2 mt-2">
              {approvalStatus === 'approved' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium border border-green-300 dark:border-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ✅ Approved Plan
                </div>
              )}
              {approvalStatus === 'partial_approved' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-300 dark:border-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  📝 Partial Approval
                </div>
              )}
              {approvalStatus === 'not_approved' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium border border-yellow-300 dark:border-yellow-700">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  📝 Draft Plan (Not Approved)
                </div>
              )}
              {approvalStatus === 'pending' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-700">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  ⚪ No Plan
                </div>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-300 dark:border-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  💾 Saving Changes...
                </div>
              )}
            </div>
            {/* Debug Status (remove in production) */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Status: {approvalStatus} | Client: {clientId} | Date: {formatDate(planStartDate)}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Plan Start Date Calendar Button */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-3 text-sm border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 shadow-lg"
                >
                  <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Plan starts: {formatDate(planStartDate)}</span>
                  <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-xl">
                <Calendar
                  mode="single"
                  selected={planStartDate}
                  onSelect={(date) => {
                    if (date) {
                      setPlanStartDate(date);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Save Plan Button - Show when there are unsaved changes */}
            {hasUnsavedChanges && approvalStatus === 'not_approved' && (
              <Button
                onClick={() => debouncedAutoSave(mealItems)}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-3">Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Save Changes
                  </>
                )}
              </Button>
            )}

            {/* Approve Plan Button - Show when there's preview data and not approved */}
            {(approvalStatus === 'not_approved' || approvalStatus === 'partial_approved') && (
              <>
                <Button
                  onClick={handleApprovePlan}
                  disabled={isApproving}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-300 dark:border-green-700"
                >
                  {isApproving ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-3">Approving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-3" />
                      ✅ Approve Plan
                    </>
                  )}
                </Button>
                {/* Modal Dialog for Overwrite Confirmation */}
                {showApproveModal && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-20">
                      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overwrite Existing Plan?</h2>
                        </div>
                        <p className="mb-8 text-gray-700 dark:text-gray-300 leading-relaxed">
                          A plan already exists for this week. Approving will <span className="font-bold text-red-600 dark:text-red-400">overwrite</span> the current plan in production. 
                          <br /><br />
                          <span className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowApproveModal(false)} 
                            className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={doApprovePlan} 
                            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            Yes, Overwrite Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-3">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generate New Plan
                </>
              )}
            </Button>
            <Button
              onClick={handleGenerateGroceryList}
              disabled={isGeneratingGroceryList}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {isGeneratingGroceryList ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-3">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generate Grocery List
                </>
              )}
            </Button>
        </div>
      </div>

      {/* --- Editable Target Grid --- */}
      <TargetEditGrid />

      {/* Dashboard Row - Equal Height Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Weekly Plan Table */}
        <Card className="lg:col-span-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              Weekly Nutrition Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NutritionTable />
          </CardContent>
        </Card>
      </div>

            <OpenRouterTest />
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

      {/* Grocery List Popup */}
      {showGroceryListPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-20">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grocery List</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(planStartDate, 'MMM d')} - {format(addDays(planStartDate, 6), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowGroceryListPopup(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto pr-4">
                {groceryCategories.length > 0 ? (
                  <div className="space-y-4">
                    {groceryCategories.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                          {category.name}
                        </h3>
                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <label key={item.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={async (e) => {
                                  const newChecked = e.target.checked;
                                  setGroceryItems(prev => 
                                    prev.map(prevItem => 
                                      prevItem.id === item.id 
                                        ? { ...prevItem, checked: newChecked }
                                        : prevItem
                                    )
                                  );
                                  
                                  // Update in database
                                  if (clientId) {
                                    try {
                                      await updateGroceryItemState(clientId, planStartDate, item.id, newChecked);
                                    } catch (error) {
                                      console.error('Error updating grocery item state:', error);
                                      toast({
                                        title: "Error",
                                        description: "Failed to save checkbox state. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <span className={`text-gray-700 dark:text-gray-300 ${item.checked ? 'line-through text-gray-400' : ''}`}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-semibold mb-2">No grocery items found</div>
                    <div className="text-sm">The grocery list could not be parsed properly.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </TooltipProvider>
  )
}

export default NutritionPlanSection 