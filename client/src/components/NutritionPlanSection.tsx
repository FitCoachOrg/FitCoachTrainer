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
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Side popup states
  const [showFitnessGoals, setShowFitnessGoals] = useState(false)
  const [showAICoachInsights, setShowAICoachInsights] = useState(false)
  const [showTrainerNotes, setShowTrainerNotes] = useState(false)
  const [showNutritionalPreferences, setShowNutritionalPreferences] = useState(false)
  const [showTrainingPreferences, setShowTrainingPreferences] = useState(false)
  
  const { toast } = useToast()
  
  // This state will hold the applied plan, becoming the source of truth for the UI
  const [mealItems, setMealItems] = useState<Record<string, Record<string, any[]>>>({})
  const [selectedDay, setSelectedDay] = useState('Monday')
  
  // Plan start date state
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // State for the newly generated plan and saving status
  const [generatedPlan, setGeneratedPlan] = useState<DayPlan[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for inline editing
  const [editingCell, setEditingCell] = useState<{ day: string; mealType: string; field: string; } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');

  // Daily targets state
  const [dailyTargets, setDailyTargets] = useState([
    { name: "Calories", current: 0, target: 2000, unit: "kcal", icon: Flame, color: "from-red-500 to-orange-500" },
    { name: "Protein", current: 0, target: 150, unit: "g", icon: Beef, color: "from-sky-500 to-blue-500" },
    { name: "Carbs", current: 0, target: 200, unit: "g", icon: Wheat, color: "from-amber-500 to-yellow-500" },
    { name: "Fats", current: 0, target: 70, unit: "g", icon: Droplets, color: "from-green-500 to-emerald-500" }
  ])

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
            // Set the plan start date to today when generating a new plan
            const newPlanStartDate = new Date();
            setPlanStartDate(newPlanStartDate);
            
            // Hold the generated plan in state until user saves it
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
            toast({ title: "Success", description: "AI nutrition plan has been applied!" });
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

  // Save Nutrition Plan to Supabase
  const handleSavePlan = async () => {
    if (!clientId || !generatedPlan) {
      toast({
        title: "Error",
        description: "No plan to save or client not selected.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveNutritionPlanToSupabase(generatedPlan, clientId, planStartDate);
      setGeneratedPlan(null); // Clear generated plan after saving
      toast({ title: "Plan Saved", description: "The new nutrition plan has been saved to the database." });
      // Optionally, update mealItems state to reflect the saved plan
      const newMealItemsData: Record<string, Record<string, any[]>> = {};
      generatedPlan.forEach((dayPlan) => {
        const dayKey = dayPlan.day.toLowerCase();
        newMealItemsData[dayKey] = {
          breakfast: dayPlan.breakfast ? [{ meal: dayPlan.breakfast.name, amount: dayPlan.breakfast.amount, ...dayPlan.breakfast }] : [],
          lunch: dayPlan.lunch ? [{ meal: dayPlan.lunch.name, amount: dayPlan.lunch.amount, ...dayPlan.lunch }] : [],
          dinner: dayPlan.dinner ? [{ meal: dayPlan.dinner.name, amount: dayPlan.dinner.amount, ...dayPlan.dinner }] : [],
          snacks: dayPlan.snacks ? [{ meal: dayPlan.snacks.name, amount: dayPlan.snacks.amount, ...dayPlan.snacks }] : [],
        };
      });
      setMealItems(newMealItemsData);
    } catch (error: any) {
      console.error("Error saving nutrition plan to Supabase:", error);
        toast({
        title: "Database Error",
        description: "Could not save the nutrition plan. Please check the console for details.",
          variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveNutritionPlanToSupabase = async (plan: DayPlan[], clientId: number, startDate: Date) => {
    try {
      const mealTimes: { [key: string]: string } = {
        breakfast: '08:00:00',
        lunch: '13:00:00',
        dinner: '19:00:00',
        snacks: '16:00:00',
      };
      
      // Professional icons for each meal type
      const mealIcons: { [key: string]: string } = {
        breakfast: 'Coffee', // Coffee cup for breakfast
        lunch: 'Sun', // Sun for lunch (midday meal)
        dinner: 'Moon', // Moon for dinner (evening meal)
        snacks: 'Apple', // Apple for snacks
      };
      
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
              summary: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}`,
              coach_tip: meal.coach_tip,
              details_json: {
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fats: meal.fats,
                amount: meal.amount,
              },
              for_time: mealTimes[mealType],
              icon: mealIcons[mealType],
            });
          }
        });
      });

      if (recordsToInsert.length > 0) {
        // First, delete existing meal entries for the upcoming week
        const startDateString = format(startDate, 'yyyy-MM-dd');
        const endDateString = format(addDays(startDate, 6), 'yyyy-MM-dd');

        const { error: deleteError } = await supabase
          .from('schedule')
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
          .from('schedule')
          .insert(recordsToInsert);

        if (insertError) {
          throw insertError;
        }
        
        toast({ title: "Plan Saved", description: "The new nutrition plan has been saved to the database." });
      }
    } catch (error: any) {
      console.error("Error saving nutrition plan to Supabase:", error);
      toast({
        title: "Database Error",
        description: "Could not save the nutrition plan. Please check the console for details.",
        variant: "destructive",
      });
    }
  };

  const fetchNutritionPlanFromSupabase = async (clientId: number, startDate: Date) => {
    setLoading(true);
    try {
      const startDateString = format(startDate, 'yyyy-MM-dd');
      const endDateString = format(addDays(startDate, 6), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'meal')
        .gte('for_date', startDateString)
        .lte('for_date', endDateString);

      if (error) throw error;

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
        toast({ title: "Plan Loaded", description: "Nutrition plan for the selected week has been loaded." });
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

              const handleMealChange = (dayKey: string, mealType: string, field: string, value: any) => {
                const updatedMealItems = { ...mealItems };
                const mealToUpdate = updatedMealItems[dayKey]?.[mealType]?.[0];

                if (mealToUpdate) {
                  // Ensure numeric fields are stored as numbers
                  const numericFields = ['calories', 'protein', 'carbs', 'fats'];
                  const finalValue = numericFields.includes(field) ? Number(value) || 0 : value;
                  
                  mealToUpdate[field] = finalValue;
                  setMealItems(updatedMealItems);
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

  // Data loading effect
  useEffect(() => {
    // Only fetch from the database if we are not in the middle of reviewing a newly generated plan.
    if (clientId && isActive && !generatedPlan) {
      fetchNutritionPlanFromSupabase(clientId, planStartDate);
    }
  }, [clientId, isActive, planStartDate, generatedPlan]);

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

            {generatedPlan && (
            <Button
                onClick={handleSavePlan}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-3">Saving...</span>
                </>
              ) : (
                <>
                    <Sparkles className="h-5 w-5 mr-3" />
                    Save Plan
                </>
              )}
            </Button>
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