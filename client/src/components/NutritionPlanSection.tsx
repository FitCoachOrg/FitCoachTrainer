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
  Dumbbell
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
  const [dailyTargets, setDailyTargets] = useState([
    { name: "Calories", current: 0, target: 2000, unit: "kcal", icon: Flame, color: "from-red-500 to-orange-500" },
    { name: "Protein", current: 0, target: 150, unit: "g", icon: Beef, color: "from-sky-500 to-blue-500" },
    { name: "Carbs", current: 0, target: 200, unit: "g", icon: Wheat, color: "from-amber-500 to-yellow-500" },
    { name: "Fats", current: 0, target: 70, unit: "g", icon: Droplets, color: "from-green-500 to-emerald-500" }
  ]);
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
          const dayOfWeek = format(new Date(item.for_date), 'EEEE').toLowerCase();
          const mealTypeMatch = item.summary.match(/^(\w+):/);
          if (mealTypeMatch) {
            const mealType = mealTypeMatch[1].toLowerCase();
            const mealData = {
              meal: item.summary.replace(/^\w+:\s*/, ''),
              ...item.details_json,
              amount: item.details_json.amount,
              coach_tip: item.coach_tip
            };
            if (newMealItemsData[dayOfWeek] && newMealItemsData[dayOfWeek][mealType]) {
              newMealItemsData[dayOfWeek][mealType].push(mealData);
            }
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
            });
          }
        });
      });

      if (recordsToInsert.length > 0) {
        const { error } = await supabase
          .from('schedule_preview')
          .insert(recordsToInsert);

        if (error) throw error;
        
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

        setDailyTargets(prev => prev.map(target => {
            switch(target.name) {
                case "Calories": return { ...target, current: Math.round(calories) };
                case "Protein": return { ...target, current: Math.round(protein) };
                case "Carbs": return { ...target, current: Math.round(carbs) };
                case "Fats": return { ...target, current: Math.round(fats) };
                default: return target;
            }
        }));
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
          const newPlanStartDate = new Date();
          setPlanStartDate(newPlanStartDate);
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
          const planTargets = plan[0]?.total;
          if (planTargets) {
            setDailyTargets(prev => prev.map(target => {
              switch(target.name) {
                case "Calories": return { ...target, target: planTargets.calories };
                case "Protein": return { ...target, target: planTargets.protein };
                case "Carbs": return { ...target, target: planTargets.carbs };
                case "Fats": return { ...target, target: planTargets.fats };
                default: return target;
              }
            }));
          }
          // Save the AI-generated plan to schedule_preview with is_approved = false
          await saveNutritionPlanToPreview(plan, clientId, newPlanStartDate);
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

      plan.forEach((dayPlan, dayIndex) => {
        const forDate = format(addDays(startDate, dayIndex), 'yyyy-MM-dd');

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
      }
    } catch (error: any) {
      console.error("Error saving nutrition plan to preview:", error);
      throw error;
    }
  };

  // --- Status calculation helper ---
  const isApproved = (val: any) => val === true || val === 1 || val === 'true';
  const getApprovalStatusFromPreview = (rows: any[]): 'approved' | 'partial_approved' | 'not_approved' | 'pending' => {
    if (!rows || rows.length === 0) return 'pending';
    // Debug log for status calculation
    console.log('Preview rows for status:', rows);
    console.log('is_approved types:', rows.map(r => typeof r.is_approved), 'values:', rows.map(r => r.is_approved));
    const approvedCount = rows.filter(r => isApproved(r.is_approved)).length;
    const total = rows.length;
    if (approvedCount === total) return 'approved';
    if (approvedCount > 0) return 'partial_approved';
    return 'not_approved';
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
      const status = getApprovalStatusFromPreview(previewData || []);
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


  // Macro Chart Component
  const MacroChart = () => {
    const { protein, carbs, fats } = dailyTargets.reduce((acc, curr) => {
        acc[curr.name.toLowerCase()] = curr.current;
        return acc;
    }, {} as Record<string, number>);

    const total = protein + carbs + fats;
    const proteinPercent = total > 0 ? (protein / total) * 100 : 33.3;
    const carbsPercent = total > 0 ? (carbs / total) * 100 : 33.3;
    const fatsPercent = total > 0 ? (fats / total) * 100 : 33.3;

    return (
      <div className="space-y-4">
        <div className="flex h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
                className="bg-sky-500 h-full transition-all duration-300"
            style={{ width: `${proteinPercent}%` }}
          />
          <div 
                className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${carbsPercent}%` }}
          />
          <div 
                className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${fatsPercent}%` }}
          />
        </div>
            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full" />
                <span>Protein: {protein}g</span>
          </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span>Carbs: {carbs}g</span>
          </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Fats: {fats}g</span>
          </div>
        </div>
      </div>
    )
  }

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
        <FitnessGoalsPlaceholder onClick={() => setShowFitnessGoals(true)} />
        <AICoachInsightsPlaceholder onClick={() => setShowAICoachInsights(true)} />
        <TrainerNotesPlaceholder onClick={() => setShowTrainerNotes(true)} />
        <NutritionalPreferencesPlaceholder onClick={() => setShowNutritionalPreferences(true)} />
        <TrainingPreferencesPlaceholder onClick={() => setShowTrainingPreferences(true)} />
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
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full">
                      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Overwrite Existing Plan?</h2>
                      <p className="mb-6 text-gray-700 dark:text-gray-300">A plan already exists for this week. Approving will <span className="font-bold text-red-600">overwrite</span> the current plan in production. Are you sure you want to continue?</p>
                      <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setShowApproveModal(false)} className="border-gray-300 dark:border-gray-700">Cancel</Button>
                        <Button onClick={doApprovePlan} className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold">Yes, Overwrite</Button>
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
        </div>
      </div>

      {/* --- Editable Target Grid --- */}
      <TargetEditGrid />

      {/* Dashboard Row - Equal Height Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Daily Targets */}
          <Card className="lg:col-span-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl h-[300px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                Daily Targets for {selectedDay}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-0 pb-4 flex-1 items-center">
              {dailyTargets.map((target) => {
                const TargetIcon = target.icon;
                const percentage = target.target > 0 ? Math.min((target.current / target.target) * 100, 100) : 0;
                const isOverTarget = target.current > target.target;
                return (
                  <div key={target.name} className="flex flex-col items-center justify-center text-center p-1">
                    <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                      {/* Background circle */}
                      <div className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      
                      {/* Progress circle with gradient */}
                      <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          className="stroke-current text-gray-200 dark:text-gray-700"
                          strokeWidth="2.5"
                          fill="none"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          className={`stroke-current transition-all duration-500 ${
                            isOverTarget 
                              ? 'text-red-500' 
                              : target.name === 'Calories' ? 'text-red-500' 
                              : target.name === 'Protein' ? 'text-blue-500'
                              : target.name === 'Carbs' ? 'text-amber-500'
                              : 'text-green-500'
                          }`}
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray={`${percentage}, 100`}
                          strokeLinecap="round"
                          style={{
                            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'
                          }}
                        />
                      </svg>
                      
                      {/* Content overlay */}
                      <div className="absolute flex flex-col items-center z-20 bg-white dark:bg-gray-800 rounded-full w-20 h-20 border-2 border-gray-100 dark:border-gray-600 shadow-sm">
                        <TargetIcon className="h-4 w-4 mt-2 mb-1 text-gray-600 dark:text-gray-400" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{target.current}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">/{target.target}</span>
                      </div>
                      
                      {/* Percentage indicator */}
                      <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md border border-gray-200 dark:border-gray-600 z-30">
                        <span className={`text-xs font-semibold ${
                          isOverTarget ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{target.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{target.unit}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Macro Distribution */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl h-[300px] flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <Table className="h-5 w-5 text-white" />
                </div>
                Macro Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center pt-0 pb-4 flex-1">
              <MacroChart />
            </CardContent>
          </Card>
        </div>

          {/* Weekly Plan Table */}
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl">
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
        </TooltipProvider>
  )
}

export default NutritionPlanSection 