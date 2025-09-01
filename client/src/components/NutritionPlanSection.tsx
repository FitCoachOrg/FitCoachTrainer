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
  ChevronUp,
  Coffee,
  Sun,
  Moon,
  Apple,
  Brain,
  FileText,
  Dumbbell,
  X,
  AlertTriangle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, addDays } from "date-fns"

import { generateNutritionPlan, NutritionPlanResult } from "@/lib/ai-nutrition-plan"
import { supabase } from "@/lib/supabase"
import OpenRouterTest from "./OpenRouterTest"
import { TrainerPopupHost } from "@/components/popups/TrainerPopupHost"
import { type PopupKey } from "@/components/popups/trainer-popups.config"
import { FitnessGoalsPlaceholder, AICoachInsightsPlaceholder, TrainerNotesPlaceholder, NutritionalPreferencesPlaceholder, TrainingPreferencesPlaceholder } from "@/components/placeholder-cards"
import { FitnessGoalsSection } from "@/components/overview/FitnessGoalsSection"
import { AICoachInsightsSection } from "@/components/overview/AICoachInsightsSection"
import { TrainerNotesSection } from "@/components/overview/TrainerNotesSection"
import { NutritionalPreferencesSection } from "@/components/overview/NutritionalPreferencesSection"
import { TrainingPreferencesSection } from "@/components/overview/TrainingPreferencesSection"

import { generateGroceryListFromPlan, updateGroceryItemState, categorizeGroceryItems, checkGroceryListExists } from "@/lib/grocery-list-service";
import { ContentEditable } from './ui/content-editable';
import { normalizeDateForDisplay, normalizeDateForStorage } from "@/lib/date-utils";

// Types
interface Meal {
  name: string;
  amount?: string; // New field for meal quantities
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  coach_tip?: string;
  recipe?: string; // Recipe instructions
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
  setLastAIRecommendation?: (analysis: any) => void
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
  isSummarizingNotes,
  setLastAIRecommendation
}: NutritionPlanSectionProps) => {
  // --- All hooks at the top ---
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingGroceryList, setIsGeneratingGroceryList] = useState(false);

  // Helper function to check if the selected date is in the past
  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    return date < today;
  };
  const [showGroceryListPopup, setShowGroceryListPopup] = useState(false);
  const [groceryItems, setGroceryItems] = useState<{ id: string; text: string; checked: boolean }[]>([]);
  const [groceryCategories, setGroceryCategories] = useState<{ name: string; items: { id: string; text: string; checked: boolean }[] }[]>([]);
  const [openPopup, setOpenPopup] = useState<PopupKey | null>(null);
  const { toast } = useToast();
  const [mealItems, setMealItems] = useState<Record<string, Record<string, any[]>>>({});
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [planStartDate, setPlanStartDate] = useState(() => new Date());
  const [planStartDay, setPlanStartDay] = useState<string>('Sunday');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // State for collapsible client details
  const [showClientDetails, setShowClientDetails] = useState<boolean>(() => {
    // Load from localStorage, default to false (hidden)
    const saved = localStorage.getItem('nutrition-show-details');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('nutrition-show-details', JSON.stringify(showClientDetails));
  }, [showClientDetails]);

  // Load client's plan_start_day and align UI
  useEffect(() => {
    async function loadPlanStartDay() {
      try {
        if (!clientId) return;
        const { data, error } = await supabase
          .from('client')
          .select('plan_start_day')
          .eq('client_id', clientId)
          .single();
        if (!error && data?.plan_start_day) {
          setPlanStartDay(data.plan_start_day);
          const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const targetIdx = weekdays.indexOf(String(data.plan_start_day));
          const now = new Date();
          const delta = (targetIdx - now.getDay() + 7) % 7;
          const aligned = new Date(now);
          aligned.setDate(now.getDate() + delta);
          setPlanStartDate(aligned);
        }
      } catch (e) {
        console.error('Failed to load plan_start_day', e);
      }
    }
    loadPlanStartDay();
  }, [clientId]);

  // Helper to disable non-start-day dates
  const isDisabledDate = (date: Date) => {
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return weekdays[date.getDay()] !== planStartDay;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'partial_approved' | 'not_approved' | 'pending'>('pending');
  const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
  // State for managing meal description dropdowns
  const [openMealDescriptions, setOpenMealDescriptions] = useState<Record<string, boolean>>({});
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
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [showGroceryListConfirmModal, setShowGroceryListConfirmModal] = useState(false);
  const [isClientNutritionExpanded, setIsClientNutritionExpanded] = useState(() => {
    // Try to get user preference from localStorage
    try {
      const stored = localStorage.getItem('clientNutritionExpanded');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }); // Collapsible Client Nutrition state with persistence
  // Handle client nutrition toggle with persistence
  const handleClientNutritionToggle = () => {
    const newValue = !isClientNutritionExpanded;
    setIsClientNutritionExpanded(newValue);
    
    // Persist user preference
    try {
      localStorage.setItem('clientNutritionExpanded', JSON.stringify(newValue));
    } catch (error) {
      console.warn('Failed to save client nutrition preference:', error);
    }
  };

  // --- Debug logger for approvalStatus ---
  useEffect(() => {
    console.log('approvalStatus changed:', approvalStatus);
  }, [approvalStatus]);

  // --- Track Shift key for force regeneration ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleGenerateGroceryList = async (event?: React.MouseEvent) => {
    // Check if Shift key is held down for force regeneration
    const forceRegenerate = event?.shiftKey || false;
    
    console.log('🛒 === GROCERY LIST BUTTON CLICKED ===');
    console.log('👤 Client ID:', clientId);
    console.log('📅 Plan Start Date:', planStartDate.toISOString().split('T')[0]);
    console.log('🔄 Force Regenerate:', forceRegenerate);
    
    if (!clientId) {
      console.log('❌ No client ID found');
      toast({
        title: "Error",
        description: "No client selected. Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    // Check if grocery list already exists (unless forcing regeneration)
    if (!forceRegenerate) {
      const hasExistingList = await checkGroceryListExists(clientId, planStartDate);
      if (hasExistingList) {
        console.log('📋 Grocery list already exists - showing confirmation dialog');
        setShowGroceryListConfirmModal(true);
        return;
      }
    }

    console.log('🔄 Starting grocery list generation...');
    setIsGeneratingGroceryList(true);
    try {
      console.log('📞 Calling generateGroceryListFromPlan...');
      const result = await generateGroceryListFromPlan(clientId, planStartDate, forceRegenerate);
      console.log('📥 Result received:', result);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to generate grocery list.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Setting grocery list data...');
      setGroceryItems(result.groceryItems);
      if (result.groceryCategories) {
        setGroceryCategories(result.groceryCategories);
      }
      setShowGroceryListPopup(true);
      
      // Show appropriate message based on data source
      if (result.isFromDatabase) {
        console.log('📋 Loaded existing grocery list from database');
        toast({
          title: "Grocery List Loaded",
          description: "Loaded existing grocery list from database.",
        });
      } else {
        console.log('🆕 Generated new grocery list');
        toast({
          title: "Grocery List Generated",
          description: "New grocery list has been generated and saved to database.",
        });
      }
    } catch (error: any) {
      console.log('❌ Error in grocery list generation:', error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while generating the grocery list.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Grocery list generation completed');
      setIsGeneratingGroceryList(false);
    }
  };

  // Handle confirmation dialog actions
  const handleLoadExistingGroceryList = async () => {
    setShowGroceryListConfirmModal(false);
    setIsGeneratingGroceryList(true);
    
    try {
      console.log('📋 Loading existing grocery list...');
      const result = await generateGroceryListFromPlan(clientId!, planStartDate, false);
      
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to load grocery list.",
          variant: "destructive",
        });
        return;
      }

      setGroceryItems(result.groceryItems);
      if (result.groceryCategories) {
        setGroceryCategories(result.groceryCategories);
      }
      setShowGroceryListPopup(true);
      
      toast({
        title: "Grocery List Loaded",
        description: "Loaded existing grocery list from database.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred while loading the grocery list.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingGroceryList(false);
    }
  };

  const handleForceRegenerateGroceryList = async () => {
    setShowGroceryListConfirmModal(false);
    setIsGeneratingGroceryList(true);
    
    try {
      console.log('🔄 Force regenerating grocery list...');
      const result = await generateGroceryListFromPlan(clientId!, planStartDate, true);
      
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
      
      toast({
        title: "Grocery List Generated",
        description: "New grocery list has been generated and saved to database.",
      });
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
      const startDateString = normalizeDateForStorage(format(startDate, 'yyyy-MM-dd'));
      const endDateString = normalizeDateForStorage(format(addDays(startDate, 6), 'yyyy-MM-dd'));
      // Fetch from schedule_preview ONLY
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('id, client_id, for_date, type, task, summary, coach_tip, details_json, for_time, icon, is_approved')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (previewError) throw previewError;
      let data = previewData;
      let dataSource = 'preview';
      // No fallback to schedule table - only use schedule_preview
      const newMealItemsData: Record<string, Record<string, any[]>> = {};
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      daysOfWeek.forEach(day => {
        newMealItemsData[day] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
      });
      if (data && data.length > 0) {
        data.forEach(item => {
          try {
            // Use timezone-aware date conversion to prevent date mismatches
            const normalizedDate = normalizeDateForDisplay(item.for_date);
            const dayOfWeek = format(new Date(normalizedDate + 'T00:00:00'), 'EEEE').toLowerCase();
            const mealTypeMatch = item.summary.match(/^([\w ]+):\s*/);
            if (mealTypeMatch && mealTypeMatch[1]) {
              const mealType = mealTypeMatch[1].toLowerCase();
                             const mealData = {
                 meal: item.summary.replace(/^[\w ]+:\s*/, ''),
                 ...item.details_json,
                 amount: item.details_json.amount,
                 coach_tip: item.coach_tip,
                 recipe: item.details_json.recipe
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
        // Don't set approval status here - let checkApprovalStatus handle it
        if (dataSource === 'preview') {
          toast({ title: "Preview Plan Loaded", description: "Nutrition plan from preview has been loaded. Changes will be auto-saved." });
        } else {
          toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
        }
      } else {
        toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
      }
      setMealItems(newMealItemsData); // Always set the structure, populated or empty.
    } catch (error: any) {
      console.error("Error fetching nutrition plan from Supabase:", error);
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

  // Helper: get date for a specific weekday within the selected week window
  const getDateForDay = (dayName: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const targetIdx = days.indexOf(dayName)
    const baseIdx = planStartDate.getDay()
    const daysToAdd = (targetIdx - baseIdx + 7) % 7
    const targetDate = new Date(planStartDate)
    targetDate.setDate(planStartDate.getDate() + daysToAdd)
    return targetDate
  }

  // Weekday labels starting from the chosen planStartDay
  const getWeekDays = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const startDayIndex = days.indexOf(planStartDay)
    const weekDays: string[] = []
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
      const recordsToUpdate: Array<ScheduleItem & { id: number }> = [];

      // Get existing preview data for the week
      const startDateString = normalizeDateForStorage(format(planStartDate, 'yyyy-MM-dd'));
      const endDateString = normalizeDateForStorage(format(addDays(planStartDate, 6), 'yyyy-MM-dd'));

      const { data: existingData, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('id, client_id, for_date, type, task, summary, coach_tip, details_json, for_time, icon, is_approved')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);

      if (fetchError) throw fetchError;

      // Convert mealItems to schedule_preview format
      Object.keys(updatedMealItems).forEach((dayKey) => {
        const dayDate = getDateForDay(dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
        const forDate = normalizeDateForStorage(format(dayDate, 'yyyy-MM-dd'));

        Object.keys(updatedMealItems[dayKey]).forEach((mealType) => {
          const mealData = updatedMealItems[dayKey][mealType][0];
          if (mealData && mealData.meal) {
            const task = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                         const newRecord: ScheduleItem = {
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
                 recipe: mealData.recipe || null, // Store recipe in details_json, null if not provided
               },
               for_time: mealTimes[mealType as keyof typeof mealTimes],
               icon: '🍽️', // Fork and plate emoji
               is_approved: false, // Set to false for new preview entries
             };

            // Check if record already exists for this day and meal type
            const existingRecord = existingData?.find(record => 
              record.for_date === forDate && 
              record.task === task
            );

            if (existingRecord) {
              // Update existing record
              recordsToUpdate.push({
                ...newRecord,
                id: existingRecord.id
              });
            } else {
              // Insert new record
              recordsToInsert.push(newRecord);
            }
          }
        });
      });

      // Update existing records
      if (recordsToUpdate.length > 0) {
        for (const record of recordsToUpdate) {
          const { id, ...updateData } = record;
          const { error: updateError } = await supabase
            .from('schedule_preview')
            .update(updateData)
            .eq('id', id);
          if (updateError) throw updateError;
        }
      }

      // Insert new records
      if (recordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('schedule_preview')
          .insert(recordsToInsert);
        if (insertError) throw insertError;
      }
      
      // Update approval status after saving
      await checkApprovalStatus();
      
              toast({ title: "Changes Saved", description: "Changes have been saved to preview.", variant: "default" });
    } catch (error: any) {
      console.error('Error auto-saving to preview:', error);
      toast({
        title: "Save Error",
        description: "Could not save changes to preview.",
        variant: "destructive",
      });
    }
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
    console.log('💾 === SAVING NUTRITION PLAN TO DATABASE ===');
    console.log('👤 Client ID:', clientId);
    console.log('📅 Start Date:', startDate.toISOString().split('T')[0]);
    console.log('📊 Plan days:', plan.length);
    
    try {
      const mealTimes = await getClientMealTimes(clientId);
      
      const recordsToInsert: ScheduleItem[] = [];

      plan.forEach((dayPlan) => {
        // Use getDateForDay to map day names (Monday, Tuesday, etc.) to correct dates
        const forDate = normalizeDateForStorage(format(getDateForDay(dayPlan.day), 'yyyy-MM-dd'));

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
                 recipe: meal.recipe || null, // Store recipe in details_json, null if not provided by LLM
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
        const startDateString = normalizeDateForStorage(format(startDate, 'yyyy-MM-dd'));
        const endDateString = normalizeDateForStorage(format(addDays(startDate, 6), 'yyyy-MM-dd'));

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
        
        console.log('✅ === NUTRITION PLAN SAVED ===');
        console.log('📊 Records saved:', recordsToInsert.length);
        console.log('📋 Meal types saved:', Array.from(new Set(recordsToInsert.map(r => r.task))));
        console.log('📅 Date range:', `${startDate.toISOString().split('T')[0]} to ${format(addDays(startDate, 6), 'yyyy-MM-dd')}`);
        
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
    console.log('Sample row data:', rows.slice(0, 3).map(r => ({ id: r.id, for_date: r.for_date, is_approved: r.is_approved })));
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

  // --- Utility function for individual meal upsert (fallback) ---
  const upsertMeal = async (mealData: any) => {
    // Check if a meal already exists for this client, date, type, and task
    const { data: existingMeal, error: checkError } = await supabase
      .from('schedule')
      .select('id')
      .eq('client_id', mealData.client_id)
      .eq('for_date', mealData.for_date)
      .eq('type', mealData.type)
      .eq('task', mealData.task)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError;
    }
    
    if (existingMeal) {
      // Update existing meal
      const { error: updateError } = await supabase
        .from('schedule')
        .update({
          summary: mealData.summary,
          coach_tip: mealData.coach_tip,
          details_json: mealData.details_json,
          for_time: mealData.for_time,
          icon: mealData.icon
        })
        .eq('id', existingMeal.id);
      
      if (updateError) throw updateError;
      return { action: 'updated', id: existingMeal.id };
    } else {
      // Insert new meal
      const { error: insertError } = await supabase
        .from('schedule')
        .insert([mealData]);
      
      if (insertError) throw insertError;
      return { action: 'inserted', id: null };
    }
  };

  // --- Enhanced Approval Status Check ---
  const checkApprovalStatus = async () => {
    if (!clientId) return;
    try {
      console.log('📋 Status Check Debug - Starting approval status check...');
      const startDateString = normalizeDateForStorage(format(planStartDate, 'yyyy-MM-dd'));
      const endDateString = normalizeDateForStorage(format(addDays(planStartDate, 6), 'yyyy-MM-dd'));
      
      // Get all preview rows for the week
      const { data: previewData, error: previewError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved, for_date')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (previewError) console.error('Preview check error:', previewError);
      
      console.log('📋 Status Check Debug - Preview data found:', previewData?.length || 0, 'records');
      console.log('📋 Status Check Debug - Sample preview records:', previewData?.slice(0, 3).map(r => ({ id: r.id, for_date: r.for_date, is_approved: r.is_approved })));
      
      // Get all schedule rows for the week
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('id')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (scheduleError) console.error('Schedule check error:', scheduleError);
      
      console.log('📋 Status Check Debug - Schedule data found:', scheduleData?.length || 0, 'records');
      
      setHasExistingSchedule(!!(scheduleData && scheduleData.length > 0));
      
      // Use previewData for status
      const status = getApprovalStatusFromPreview(previewData || [], planStartDate);
      console.log('📋 Status Check Debug - Calculated status:', status);
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
    setIsApprovalInProgress(true);
    try {
      const startDateString = normalizeDateForStorage(format(planStartDate, 'yyyy-MM-dd'));
      const endDateString = normalizeDateForStorage(format(addDays(planStartDate, 6), 'yyyy-MM-dd'));
      // Fetch preview data
      const { data: previewData, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('id, client_id, for_date, type, task, summary, coach_tip, details_json, for_time, icon, is_approved')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      if (fetchError) throw fetchError;
      if (!previewData || previewData.length === 0) {
        toast({ title: "No Plan to Approve", description: "No nutrition plan found in preview to approve.", variant: "destructive" });
        return;
      }
      console.log('📋 Approval Debug - Date range:', { startDateString, endDateString });
      console.log('📋 Approval Debug - Preview data found:', previewData.length, 'records');
      console.log('📋 Approval Debug - Sample preview record:', previewData[0]);
      // Copy preview data to schedule
      // Note: The schedule table has a unique constraint on (client_id, for_date, type)
      // So we need to handle multiple meals per day differently
      const scheduleRows = previewData.map(({ is_approved, ...rest }) => rest);
      
      // Remove any potential duplicates based on client_id, for_date, type, and task
      const uniqueRows = scheduleRows.filter((row, index, self) => 
        index === self.findIndex(r => 
          r.client_id === row.client_id && 
          r.for_date === row.for_date && 
          r.type === row.type && 
          r.task === row.task
        )
      );
      
      console.log('📋 Approval Debug - Original rows:', scheduleRows.length);
      console.log('📋 Approval Debug - Unique rows after deduplication:', uniqueRows.length);
      console.log('📋 Approval Debug - Sample schedule row:', uniqueRows[0]);
      
      // Check if there are multiple meals per day that would violate the unique constraint
      const mealsPerDay = new Map();
      uniqueRows.forEach(row => {
        const key = `${row.client_id}-${row.for_date}-${row.type}`;
        if (!mealsPerDay.has(key)) {
          mealsPerDay.set(key, []);
        }
        mealsPerDay.get(key).push(row);
      });
      
      // Debug: Check for duplicate constraint violations
      console.log('📋 Approval Debug - Checking for constraint violations...');
      mealsPerDay.forEach((meals, key) => {
        if (meals.length > 1) {
          console.log(`📋 Approval Debug - Multiple meals for key "${key}":`, meals.map((m: any) => ({ task: m.task, summary: m.summary })));
        }
      });
      
      // The unique constraint is on (client_id, for_date, type), but we have multiple meals per day
      // Since we can't change the type field, we need to insert meals one by one to avoid the constraint violation
      console.log('📋 Approval Debug - Will insert meals one by one to avoid constraint violation');
      
      // Check what exists in schedule table before deleting
      console.log('📋 Approval Debug - Checking schedule table before delete...');
      const { data: beforeDeleteData, error: beforeDeleteError } = await supabase
        .from('schedule')
        .select('id, client_id, for_date, type, task')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (beforeDeleteError) {
        console.error('📋 Approval Debug - Before delete check error:', beforeDeleteError);
      } else {
        console.log('📋 Approval Debug - Schedule table before delete:', {
          count: beforeDeleteData?.length || 0,
          data: beforeDeleteData?.map(r => ({ id: r.id, for_date: r.for_date, task: r.task }))
        });
      }
      
      // Delete any existing meal records for this client and date range first
      // This avoids the unique constraint violation
      console.log('📋 Approval Debug - About to delete from schedule table...');
      const { data: deleteResult, error: scheduleDeleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString)
        .select('id'); // Add select to see what was deleted
      
      if (scheduleDeleteError) {
        console.error('📋 Approval Debug - Schedule delete error:', scheduleDeleteError);
        throw scheduleDeleteError;
      }
      
      console.log('📋 Approval Debug - Delete result:', {
        rowsDeleted: deleteResult?.length || 0,
        deletedIds: deleteResult?.map(r => r.id)
      });
      
      // Verify that the records were actually deleted
      console.log('📋 Approval Debug - Verifying deletion...');
      const { data: afterDeleteData, error: afterDeleteError } = await supabase
        .from('schedule')
        .select('id, client_id, for_date, type, task')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (afterDeleteError) {
        console.error('📋 Approval Debug - After delete check error:', afterDeleteError);
      } else {
        console.log('📋 Approval Debug - Schedule table after delete:', {
          count: afterDeleteData?.length || 0,
          data: afterDeleteData?.map(r => ({ id: r.id, for_date: r.for_date, task: r.task }))
        });
      }
      
      console.log('📋 Approval Debug - Schedule rows to insert:', uniqueRows.length);
      console.log('📋 Approval Debug - Sample schedule row:', uniqueRows[0]);
      
      // Debug: Log all rows being inserted to check for duplicates
      console.log('📋 Approval Debug - All rows being inserted:');
      uniqueRows.forEach((row: any, index: number) => {
        console.log(`Row ${index + 1}:`, {
          client_id: row.client_id,
          for_date: row.for_date,
          type: row.type,
          task: row.task,
          summary: row.summary
        });
      });
      
      // Batch upsert meals using Supabase's upsert functionality
      console.log('📋 Approval Debug - Batch upserting meals...');
      
      // Use Supabase's upsert with onConflict option
      const { data: upsertData, error: upsertError } = await supabase
        .from('schedule')
        .upsert(uniqueRows, {
          onConflict: 'client_id,for_date,type,task', // This requires the constraint to include task
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error('📋 Approval Debug - Batch upsert error:', upsertError);
        console.log('📋 Approval Debug - Error details:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        
        // If batch upsert fails due to constraint, fallback to individual upserts
        if (upsertError.code === '23505') { // Unique constraint violation
          console.log('📋 Approval Debug - Constraint violation, falling back to individual upserts...');
          let upsertResults: any[] = [];
          
          for (let i = 0; i < uniqueRows.length; i++) {
            const row = uniqueRows[i];
            
            try {
              const result = await upsertMeal(row);
              console.log(`📋 Approval Debug - Meal ${i + 1}: ${row.task} for ${row.for_date} - ${result.action}`);
              upsertResults.push({ row: i + 1, result });
            } catch (error: any) {
              console.error(`📋 Approval Debug - Error upserting meal ${i + 1}:`, error);
              throw error;
            }
          }
          
          console.log('📋 Approval Debug - Individual upsert summary:', {
            total: upsertResults.length,
            updated: upsertResults.filter(r => r.result.action === 'updated').length,
            inserted: upsertResults.filter(r => r.result.action === 'inserted').length
          });
        } else {
          throw upsertError;
        }
      } else {
        console.log('📋 Approval Debug - Batch upsert successful for', uniqueRows.length, 'meals');
      }
      // Check what data exists in schedule_preview before updating
      console.log('📋 Approval Debug - Checking schedule_preview data before update...');
      const { data: beforeUpdateData, error: beforeUpdateError } = await supabase
        .from('schedule_preview')
        .select('*') // Select all columns to see the actual table structure
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString)
        .limit(1); // Just get one row to see the structure
      
      if (beforeUpdateError) {
        console.error('📋 Approval Debug - Before update check error:', beforeUpdateError);
      } else {
        console.log('📋 Approval Debug - Table structure sample:', beforeUpdateData?.[0]);
        console.log('📋 Approval Debug - Available columns:', beforeUpdateData?.[0] ? Object.keys(beforeUpdateData[0]) : 'No data');
      }
      
      // Now get all the data for the update
      const { data: allBeforeUpdateData, error: allBeforeUpdateError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved, for_date, type, client_id')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (allBeforeUpdateError) {
        console.error('📋 Approval Debug - All before update check error:', allBeforeUpdateError);
      } else {
        console.log('📋 Approval Debug - Before update data:', {
          count: allBeforeUpdateData?.length || 0,
          data: allBeforeUpdateData?.map(r => ({ id: r.id, for_date: r.for_date, is_approved: r.is_approved, type: r.type, client_id: r.client_id }))
        });
      }
      
      // Set is_approved=true for all days in preview
      console.log('📋 Approval Debug - About to update is_approved in schedule_preview...');
      console.log('📋 Approval Debug - Update criteria:', {
        client_id: clientId,
        type: 'meal',
        for_date_gte: startDateString,
        for_date_lte: endDateString
      });
      
      const { data: updateData, error: updateError } = await supabase
        .from('schedule_preview')
        .update({ is_approved: true })
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString)
        .select('id, is_approved, for_date'); // Add select to see what was updated
      
      if (updateError) {
        console.error('📋 Approval Debug - Update error:', updateError);
        throw updateError;
      }
      
      console.log('📋 Approval Debug - Update result:', {
        rowsUpdated: updateData?.length || 0,
        updateData: updateData
      });
      
      // If no rows were updated, try a different approach
      if (!updateData || updateData.length === 0) {
        console.log('📋 Approval Debug - No rows updated, trying alternative approach...');
        
        // Try updating by individual IDs
        if (beforeUpdateData && beforeUpdateData.length > 0) {
          const idsToUpdate = beforeUpdateData.map(row => row.id);
          console.log('📋 Approval Debug - Trying to update by IDs:', idsToUpdate);
          
          const { data: individualUpdateData, error: individualUpdateError } = await supabase
            .from('schedule_preview')
            .update({ is_approved: true })
            .in('id', idsToUpdate)
            .select('id, is_approved, for_date');
          
          if (individualUpdateError) {
            console.error('📋 Approval Debug - Individual update error:', individualUpdateError);
          } else {
            console.log('📋 Approval Debug - Individual update result:', {
              rowsUpdated: individualUpdateData?.length || 0,
              updateData: individualUpdateData
            });
          }
        }
      }
      
      // Verify that is_approved was set correctly
      const { data: verificationData, error: verificationError } = await supabase
        .from('schedule_preview')
        .select('id, is_approved, for_date')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);
      
      if (verificationError) {
        console.error('📋 Approval Debug - Verification error:', verificationError);
      } else {
        console.log('📋 Approval Debug - Verification data:', verificationData?.length || 0, 'records');
        console.log('📋 Approval Debug - is_approved values:', verificationData?.map(r => ({ id: r.id, for_date: r.for_date, is_approved: r.is_approved })));
        
        // Check if any rows have is_approved = true
        const approvedRows = verificationData?.filter(r => r.is_approved === true) || [];
        console.log('📋 Approval Debug - Rows with is_approved = true:', approvedRows.length);
        console.log('📋 Approval Debug - All rows should be approved:', verificationData?.every(r => r.is_approved === true));
      }
      
      toast({ title: "Current Plan Approved", description: "The current nutrition plan has been approved and saved to the main schedule." });
      
      // Update status immediately after approval
      setApprovalStatus('approved');
      
      // Force refresh after approval with a longer delay to ensure database consistency
      // The database update needs time to be committed before we check the status
      setTimeout(async () => {
        console.log('📋 Approval Debug - Refreshing status after approval...');
        await checkApprovalStatus();
        await fetchNutritionPlanFromSupabase(clientId, planStartDate);
        setIsApprovalInProgress(false);
      }, 500); // Increased delay to ensure database consistency
    } catch (error: any) {
      console.error("Error approving nutrition plan:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({ title: "Approval Error", description: `Could not approve the nutrition plan: ${error.message || 'Unknown error'}`, variant: "destructive" });
    } finally {
      setIsApproving(false);
      setIsApprovalInProgress(false);
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
                  
                  // Set is_approved=false for this day in preview
                  const startDateString = format(planStartDate, 'yyyy-MM-dd');
                  const dayDate = getDateForDay(dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
                  const forDate = normalizeDateForStorage(format(dayDate, 'yyyy-MM-dd'));
                  supabase
                    .from('schedule_preview')
                    .update({ is_approved: false })
                    .eq('client_id', clientId)
                    .eq('type', 'meal')
                    .eq('for_date', forDate)
                    .then(() => checkApprovalStatus());
                  // Trigger auto-save
                  autoSaveToPreview(updatedMealItems);
                  
                  // Manually trigger re-render of daily targets
                  setSelectedDay(selectedDay); 
                }
              };



              const renderEditableCell = (value: string | number, dayKey: string, mealType: string, field: string) => {
                const handleSave = (newValue: string) => {
                  handleMealChange(dayKey, mealType, field, newValue);
                };

                return (
                  <ContentEditable
                    value={value}
                    onSave={handleSave}
                    className="font-medium"
                    minWidth={field === 'meal' ? '120px' : '60px'}
                    multiline={field === 'meal'}
                    numeric={['calories', 'protein', 'carbs', 'fats'].includes(field)}
                    placeholder="Click to edit"
                  />
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
                      <div className={`rounded-lg p-3 border-l-4 ${mealTypeColors[mealType as keyof typeof mealTypeColors]} shadow-sm hover:shadow-lg transition-all duration-200 min-h-[120px] group/card`}>
                        {/* Meal Title and Description Toggle */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm flex-1 min-w-0 group/edit-title">
                            {renderEditableCell(mealData.meal, dayKey, mealType, 'meal')}
                          </div>
                          {(mealData.coach_tip || mealData.recipe || mealData.amount) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const descriptionKey = `${dayKey}-${mealType}`;
                                setOpenMealDescriptions(prev => ({
                                  ...prev,
                                  [descriptionKey]: !(prev[descriptionKey] || false)
                                }));
                              }}
                              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors relative"
                              aria-label="Toggle description"
                            >
                              <ChevronDown 
                                className={`h-4 w-4 text-blue-500 transition-transform duration-200 ${
                                  openMealDescriptions[`${dayKey}-${mealType}`] ? 'rotate-180' : ''
                                }`} 
                              />
                              {/* Subtle indicator dot */}
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
                            </Button>
                          )}
                        </div>

                        {/* Description Dropdown */}
                        {openMealDescriptions[`${dayKey}-${mealType}`] && (mealData.coach_tip || mealData.recipe || mealData.amount) && (
                          <div className="mb-3 space-y-3">
                            {/* Amount Section */}
                            {mealData.amount && (
                              <div className="p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-lg">📏</span>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount</span>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {renderEditableCell(mealData.amount, dayKey, mealType, 'amount')}
                                </div>
                              </div>
                            )}

                            {/* Coach Tip Section */}
                            {mealData.coach_tip && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Coach Tip</span>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {renderEditableCell(mealData.coach_tip, dayKey, mealType, 'coach_tip')}
                                </div>
                              </div>
                            )}
                            
                            {/* Recipe Section */}
                            {mealData.recipe && (
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <Utensils className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Recipe</span>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {renderEditableCell(mealData.recipe, dayKey, mealType, 'recipe')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 group/nutrient hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <span className="text-red-600 dark:text-red-400 font-medium">Cal:</span> 
                            <span className="font-semibold group-hover:bg-red-200 dark:group-hover:bg-red-900/40 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.calories, dayKey, mealType, 'calories')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 group/nutrient hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">P:</span> 
                            <span className="font-semibold group-hover:bg-blue-200 dark:group-hover:bg-blue-900/40 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.protein, dayKey, mealType, 'protein')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1 group/nutrient hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            <span className="text-amber-600 dark:text-amber-400 font-medium">C:</span> 
                            <span className="font-semibold group-hover:bg-amber-200 dark:group-hover:bg-amber-900/40 rounded px-1 transition-colors">
                              {renderEditableCell(mealData.carbs, dayKey, mealType, 'carbs')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 group/nutrient hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                            <span className="text-green-600 dark:text-green-400 font-medium">F:</span> 
                            <span className="font-semibold group-hover:bg-green-200 dark:group-hover:bg-green-900/40 rounded px-1 transition-colors">
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
        {/* Header Row - Calories + Protein */}
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Calories</div>
              {editingTarget === 'calories' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={targetEditValue}
                    onChange={e => setTargetEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(targetEditValue, 10);
                        if (!isNaN(val)) saveClientTarget('calories', val);
                      } else if (e.key === 'Escape') {
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(targetEditValue, 10);
                      if (!isNaN(val)) saveClientTarget('calories', val);
                      else setEditingTarget(null);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-900 shadow"
                    autoFocus
                    min={0}
                    disabled={isSavingTarget}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">kcal</span>
                  {isSavingTarget && editingTarget === 'calories' && <LoadingSpinner size="small" />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {clientTargets.calories}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">kcal</span>
                  <button
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                    onClick={() => {
                      setEditingTarget('calories');
                      setTargetEditValue(clientTargets.calories?.toString() || '');
                    }}
                    title="Edit Calories"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg">
              <Beef className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Protein</div>
              {editingTarget === 'protein' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={targetEditValue}
                    onChange={e => setTargetEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(targetEditValue, 10);
                        if (!isNaN(val)) saveClientTarget('protein', val);
                      } else if (e.key === 'Escape') {
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(targetEditValue, 10);
                      if (!isNaN(val)) saveClientTarget('protein', val);
                      else setEditingTarget(null);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-900 shadow"
                    autoFocus
                    min={0}
                    disabled={isSavingTarget}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">g</span>
                  {isSavingTarget && editingTarget === 'protein' && <LoadingSpinner size="small" />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {clientTargets.protein}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">g</span>
                  <button
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                    onClick={() => {
                      setEditingTarget('protein');
                      setTargetEditValue(clientTargets.protein?.toString() || '');
                    }}
                    title="Edit Protein"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row - Carbs + Fats */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg">
              <Wheat className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Carbs</div>
              {editingTarget === 'carbs' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={targetEditValue}
                    onChange={e => setTargetEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(targetEditValue, 10);
                        if (!isNaN(val)) saveClientTarget('carbs', val);
                      } else if (e.key === 'Escape') {
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(targetEditValue, 10);
                      if (!isNaN(val)) saveClientTarget('carbs', val);
                      else setEditingTarget(null);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-900 shadow"
                    autoFocus
                    min={0}
                    disabled={isSavingTarget}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">g</span>
                  {isSavingTarget && editingTarget === 'carbs' && <LoadingSpinner size="small" />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {clientTargets.carbs}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">g</span>
                  <button
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                    onClick={() => {
                      setEditingTarget('carbs');
                      setTargetEditValue(clientTargets.carbs?.toString() || '');
                    }}
                    title="Edit Carbs"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fats</div>
              {editingTarget === 'fats' ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={targetEditValue}
                    onChange={e => setTargetEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = parseInt(targetEditValue, 10);
                        if (!isNaN(val)) saveClientTarget('fats', val);
                      } else if (e.key === 'Escape') {
                        setEditingTarget(null);
                      }
                    }}
                    onBlur={() => {
                      const val = parseInt(targetEditValue, 10);
                      if (!isNaN(val)) saveClientTarget('fats', val);
                      else setEditingTarget(null);
                    }}
                    className="w-16 px-1.5 py-0.5 rounded border-2 border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-900 shadow"
                    autoFocus
                    min={0}
                    disabled={isSavingTarget}
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">g</span>
                  {isSavingTarget && editingTarget === 'fats' && <LoadingSpinner size="small" />}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {clientTargets.fats}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">g</span>
                  <button
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ml-1"
                    onClick={() => {
                      setEditingTarget('fats');
                      setTargetEditValue(clientTargets.fats?.toString() || '');
                    }}
                    title="Edit Fats"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Data loading effect
  useEffect(() => {
    // Only fetch from the database if we are not in the middle of reviewing a newly generated plan or approving
    if (clientId && isActive && !generatedPlan && !isApprovalInProgress) {
      fetchNutritionPlanFromSupabase(clientId, planStartDate);
    }
  }, [clientId, isActive, planStartDate, generatedPlan, isApprovalInProgress]);

  // Check approval status when component loads or planStartDate changes
  useEffect(() => {
    if (clientId && isActive && !isApprovalInProgress) {
      checkApprovalStatus();
    }
  }, [clientId, isActive, planStartDate, isApprovalInProgress]);

  // Check approval status after data is loaded
  useEffect(() => {
    if (dataLoaded && clientId && isActive && !isApprovalInProgress) {
      checkApprovalStatus();
    }
  }, [dataLoaded, clientId, isActive, isApprovalInProgress]);

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
      {/* Client Nutrition & Targets Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Client Nutrition & Targets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and edit client nutritional preferences, targets, and insights</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleClientNutritionToggle}
          className="flex items-center gap-2 text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          {isClientNutritionExpanded ? 'Hide Details' : 'Show Details'}
          {isClientNutritionExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Collapsible Client Nutrition & Targets Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isClientNutritionExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
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

        {/* Client Nutritional Targets Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {client?.name || 'Client'} Nutritional Targets
          </h3>
          <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <TargetEditGrid />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Header with AI Generation */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 shadow-xl">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 whitespace-nowrap">Nutritional Planning and Management</h3>
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
            </div>
            {/* Debug Status (remove in production) */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Status: {approvalStatus} | Client: {clientId} | Date: {formatDate(planStartDate)}
            </div>
          </div>
        </div>



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
      </div>

      {/* Process Flow Controls - Single Row Above Table */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Process Flow:</div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Step 1: Select Plan Start Date */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              1
            </div>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-3 text-sm border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 shadow-lg min-w-[200px]"
                >
                  <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Select Start Date: {formatDate(planStartDate)}</span>
                  <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 shadow-xl">
                <Calendar
                  mode="single"
                  selected={planStartDate}
                  disabled={isDisabledDate}
                  onSelect={(date) => {
                    if (date && !isDisabledDate(date)) {
                      setPlanStartDate(date);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Warning message for past dates */}
            {isPastDate(planStartDate) && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    Past date selected. Please choose a future date to generate a nutrition plan.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Generate New Plan */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              2
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={isGenerating || isPastDate(planStartDate)}
              size="lg"
              className={`bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px] ${
                isPastDate(planStartDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isPastDate(planStartDate) ? 'Cannot generate plan for past dates' : 'Generate nutrition plan'}
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

          {/* Step 3: Approve Current Plan */}
          {(approvalStatus === 'not_approved' || approvalStatus === 'partial_approved') && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                3
              </div>
              <Button
                onClick={handleApprovePlan}
                disabled={isApproving}
                size="lg"
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-300 dark:border-green-700 min-w-[200px]"
              >
                {isApproving ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-3">Approving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    ✅ Approve Current Plan
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Generate Grocery List */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              {(approvalStatus === 'not_approved' || approvalStatus === 'partial_approved') ? '4' : '3'}
            </div>
            <Button
              onClick={handleGenerateGroceryList}
              disabled={isGeneratingGroceryList || isPastDate(planStartDate)}
              size="lg"
              className={`${
                isShiftHeld 
                  ? 'bg-gradient-to-r from-red-500 to-purple-500 hover:from-red-600 hover:to-purple-600' 
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              } text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px] ${
                isPastDate(planStartDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isPastDate(planStartDate) ? 'Cannot generate grocery list for past dates' : 'Hold Shift while clicking to force regenerate (ignore cached version)'}
            >
              {isGeneratingGroceryList ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-3">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  {isShiftHeld ? '🔄 Force Generate' : 'Generate Grocery List'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

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

      {/* Unified Popup Host */}
      <TrainerPopupHost
        openKey={openPopup}
        onClose={() => setOpenPopup(null)}
        context={{
          client,
          lastAIRecommendation,
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
          setLastAIRecommendation: setLastAIRecommendation || (() => {})
        }}
      />

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

      {/* Grocery List Confirmation Dialog */}
      {showGroceryListConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full flex items-start justify-center pt-32">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-200 scale-100 animate-in fade-in-0 zoom-in-95 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 mb-4">
                  <Sparkles className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Grocery List Already Exists
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  A grocery list for this week already exists. Would you like to load the existing list or generate a new one?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleLoadExistingGroceryList}
                    disabled={isGeneratingGroceryList}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGeneratingGroceryList ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Loading...</span>
                      </>
                    ) : (
                      <>
                        📋 Load Existing
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleForceRegenerateGroceryList}
                    disabled={isGeneratingGroceryList}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isGeneratingGroceryList ? (
                      <>
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      <>
                        🔄 Generate New
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => setShowGroceryListConfirmModal(false)}
                  variant="ghost"
                  className="mt-4 w-full"
                  disabled={isGeneratingGroceryList}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
        </TooltipProvider>
  )
}

export default NutritionPlanSection 