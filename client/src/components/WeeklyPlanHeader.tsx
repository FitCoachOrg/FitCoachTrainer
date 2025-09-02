"use client"
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { format, parseISO, addWeeks, startOfWeek, endOfWeek, startOfDay } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Check, X, Calendar, CalendarDays } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import VideoModal from '@/components/VideoModal';
import VideoThumbnail from '@/components/VideoThumbnail';
import {
  checkMonthlyWorkoutStatus,
  checkWeeklyWorkoutStatus,
  getStatusDisplay,
  type WorkoutStatusResult
} from '@/utils/workoutStatusUtils';

type WeekDay = {
  date: string;
  focus: string;
  exercises: any[];
};

// Week-level approval status for monthly view
interface WeekApprovalStatus {
  weekNumber: number;
  status: 'approved' | 'draft' | 'no_plan';
  startDate: Date;
  endDate: Date;
  canApprove: boolean;
}

interface WeeklyPlanHeaderProps {
  week: WeekDay[];
  planStartDate: Date;
  onReorder: (updatedWeek: WeekDay[]) => void;
  onPlanChange: (updatedWeek: WeekDay[], isFromSave?: boolean) => void;
  onMonthlyChange?: (updatedMonthlyData: WeekDay[][]) => void;
  clientId?: number; // Add clientId for fetching multi-week data
  viewMode: 'weekly' | 'monthly'; // View mode passed from parent
  onMonthlyDataChange?: (monthlyData: WeekDay[][]) => void;
  onApprovalStatusCheck?: () => void; // Callback to trigger approval status check
  onForceRefreshStatus?: () => void; // Callback to force refresh status
  weekStatuses?: WeekApprovalStatus[]; // Week-level approval statuses
  onApproveWeek?: (weekIndex: number) => void; // Callback for individual week approval
  dirtyDates?: Set<string>; // New prop for dirty dates
  onDirtyDatesChange?: (dirtyDates: Set<string>) => void; // Callback to notify about dirty dates
}

type ViewMode = 'weekly' | 'monthly';

function SortableHeaderBox({ id, children, disabled = false }: { id: string; children: React.ReactNode; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    cursor: 'grab',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(disabled ? {} : listeners)}>
      {children}
    </div>
  );
}

export default function WeeklyPlanHeader({ week, planStartDate, onReorder, onPlanChange, onMonthlyChange, clientId, viewMode, onMonthlyDataChange, onApprovalStatusCheck, onForceRefreshStatus, weekStatuses, onApproveWeek, dirtyDates = new Set(), onDirtyDatesChange }: WeeklyPlanHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // View mode is now passed from parent component
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [copySourceDate, setCopySourceDate] = useState<string | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState<string | null>(null);
  const [localMonthlyData, setLocalMonthlyData] = useState<WeekDay[][]>([]);
  const [multiWeekData, setMultiWeekData] = useState<WeekDay[][]>([]);
  const [isLoadingMultiWeek, setIsLoadingMultiWeek] = useState(false);
  
  // Week-level copy/paste state
  const [copySourceWeek, setCopySourceWeek] = useState<number | null>(null);
  const [copyTargetWeek, setCopyTargetWeek] = useState<number | null>(null);
  const [showWeekCopyConfirm, setShowWeekCopyConfirm] = useState(false);
  const [monthlyStatus, setMonthlyStatus] = useState<WorkoutStatusResult | null>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<WorkoutStatusResult | null>(null);

  // Normalize planStartDate to start of local day to avoid timezone drift
  const baseStartDate = useMemo(() => startOfDay(planStartDate), [planStartDate]);

  // Helper function to check if a week has any dirty dates
  const isWeekDirty = useCallback((weekIndex: number) => {
    if (dirtyDates.size === 0) return false;
    
    const weekStartDate = weekIndex === 0 ? baseStartDate : addWeeks(baseStartDate, weekIndex);
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = format(dayDate, 'yyyy-MM-dd');
      if (dirtyDates.has(dateStr)) {
        return true;
      }
    }
    return false;
  }, [dirtyDates, baseStartDate]);

  // Helper function to get display status for a week (overriding with unsaved changes if dirty)
  const getWeekDisplayStatus = useCallback((weekIndex: number, originalStatus: string) => {
    if (isWeekDirty(weekIndex)) {
      return 'unsaved_changes';
    }
    return originalStatus;
  }, [isWeekDirty]);

  // Week approval state
  const [approvingWeek, setApprovingWeek] = useState<number | null>(null);
  
  // Add debouncing for approval status checks
  const [lastApprovalCheck, setLastApprovalCheck] = useState<number>(0);

  // Video modal state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState('');

  // Video modal handlers
  const openVideoModal = (videoUrl: string, exerciseName: string) => {
    setSelectedVideoUrl(videoUrl);
    setSelectedExerciseName(exerciseName);
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideoUrl('');
    setSelectedExerciseName('');
  };

  const debouncedApprovalCheck = useCallback(() => {
    const now = Date.now();
    if (now - lastApprovalCheck > 500) { // Reduced to 500ms for more responsive updates
      setLastApprovalCheck(now);
      if (onApprovalStatusCheck) {
        onApprovalStatusCheck();
      }
    }
  }, [onApprovalStatusCheck, lastApprovalCheck]);

  // Generate monthly data (4 weeks) from the current week data
  const monthlyData = useMemo(() => {
    if (viewMode === 'weekly') return [week || []];
    
    // If we have local monthly data, use it
    if (localMonthlyData.length > 0) {
      return localMonthlyData;
    }
    
    // If we have fetched multi-week data, use it
    if (multiWeekData.length > 0) {
      return multiWeekData;
    }
    
    // Fallback to generating placeholder data
    const weeks = [];
    for (let i = 0; i < 4; i++) {
              // For the first week, start from the selected date
        // For subsequent weeks, add weeks to the selected date
        const weekStartDate = i === 0 ? planStartDate : addWeeks(planStartDate, i);
      const weekDays = [];
      
      for (let j = 0; j < 7; j++) {
        const dayDate = new Date(weekStartDate.getTime() + j * 24 * 60 * 60 * 1000);
        const dateStr = dayDate.toISOString().slice(0, 10);
        
        // If this is the first week, use the actual data, otherwise create placeholder data
        if (i === 0) {
          weekDays.push(week[j] || { date: dateStr, focus: 'Rest Day', exercises: [] });
        } else {
          weekDays.push({ date: dateStr, focus: 'Rest Day', exercises: [] });
        }
      }
      weeks.push(weekDays);
    }
    return weeks;
  }, [week, planStartDate, viewMode, localMonthlyData, multiWeekData]);

  // For weekly view, use the week prop directly
  const days = useMemo(() => {
    if (viewMode === 'weekly') {
      return week || [];
    }
    return week || [];
  }, [week, viewMode]);

  // Function to fetch multi-week data using unified status logic
  const fetchMultiWeekData = async () => {
    if (!clientId || viewMode !== 'monthly') return;
    
    setIsLoadingMultiWeek(true);
    try {
      // Use the unified monthly status function
      const monthlyResult: WorkoutStatusResult = await checkMonthlyWorkoutStatus(supabase, clientId, planStartDate);
      
      // Set the monthly status for display
      setMonthlyStatus(monthlyResult);
      
      if (monthlyResult.weeklyBreakdown) {
        // Convert the weekly breakdown to WeekDay format
        const weeks = monthlyResult.weeklyBreakdown.map(weekData => {
          const weekDays = [];
          for (let j = 0; j < 7; j++) {
            const dayDate = new Date(weekData.startDate.getTime() + j * 24 * 60 * 60 * 1000);
            const dateStr = dayDate.toISOString().slice(0, 10);
            
            // Find matching data for this date from preview data (primary source)
            // UI should ONLY display data from schedule_preview table, never from schedule table
            let dayData = weekData.previewData?.find(d => d.for_date === dateStr);
            
            if (dayData && dayData.details_json && Array.isArray(dayData.details_json.exercises)) {
              weekDays.push({
                date: dateStr,
                focus: dayData.summary || 'Workout',
                exercises: dayData.details_json.exercises
              });
            } else {
              weekDays.push({
                date: dateStr,
                focus: 'Rest Day',
                exercises: []
              });
            }
          }
          return weekDays;
        });
        
        setMultiWeekData(weeks);
      } else {
        // Fallback to generating placeholder data if no breakdown available
        const weeks = [];
        for (let i = 0; i < 4; i++) {
          const weekStartDate = i === 0 ? planStartDate : addWeeks(planStartDate, i);
          const weekDays = [];
          
          for (let j = 0; j < 7; j++) {
            const dayDate = new Date(weekStartDate.getTime() + j * 24 * 60 * 60 * 1000);
            const dateStr = dayDate.toISOString().slice(0, 10);
            
            weekDays.push({
              date: dateStr,
              focus: 'Rest Day',
              exercises: []
            });
          }
          weeks.push(weekDays);
        }
        setMultiWeekData(weeks);
      }
    } catch (error) {
      console.error('Error fetching multi-week data:', error);
    } finally {
      setIsLoadingMultiWeek(false);
    }
  };

  // Fetch weekly status data when view mode changes to weekly
  const fetchWeeklyStatus = async () => {
    if (!clientId) return;
    
    try {
      const weeklyResult: WorkoutStatusResult = await checkWeeklyWorkoutStatus(supabase, clientId, planStartDate);
      setWeeklyStatus(weeklyResult);
    } catch (error) {
      console.error('Error fetching weekly status:', error);
    }
  };

  // Fetch multi-week data when view mode changes to monthly
  useEffect(() => {
    if (viewMode === 'monthly' && clientId) {
      fetchMultiWeekData();
    }
  }, [viewMode, clientId, planStartDate]);

  // Fetch weekly status when view mode changes to weekly
  useEffect(() => {
    if (viewMode === 'weekly' && clientId) {
      fetchWeeklyStatus();
    }
  }, [viewMode, clientId, planStartDate]);



  // Notify parent when monthlyData changes
  useEffect(() => {
    if (onMonthlyDataChange && monthlyData.length > 0) {
      onMonthlyDataChange(monthlyData);
    }
  }, [monthlyData, onMonthlyDataChange]);

  // Function to persist monthly changes to the database
  const persistMonthlyChangeToDatabase = async (targetDate: string, sourceDay: WeekDay) => {
    if (!clientId) return;
    
    try {
      // ALWAYS save to schedule_preview to match the parent component's strategy
      // The parent component (WorkoutPlanSection) tries schedule_preview first, then falls back to schedule
      const tableName = 'schedule_preview';
      
      // Prepare the data to insert/update
      const workoutData = {
        client_id: clientId,
        type: 'workout',
        task: 'workout',
        icon: 'dumbell',
        summary: sourceDay.focus,
        for_date: targetDate,
        for_time: '16:00:00', // Default time, could be made configurable
        workout_id: crypto.randomUUID(), // Generate new workout ID
        details_json: {
          focus: sourceDay.focus,
          exercises: sourceDay.exercises || []
        },
        is_approved: false
      };
      
      // Check if there's already an entry for this date
      const { data: existingData, error: checkError } = await supabase
        .from(tableName)
        .select('id')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .eq('for_date', targetDate)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[WeeklyPlanHeader] Error checking existing data:', checkError);
        return;
      }
      
      let result;
      if (existingData) {
        // Update existing entry
        result = await supabase
          .from(tableName)
          .update(workoutData)
          .eq('id', existingData.id);
      } else {
        // Insert new entry
        result = await supabase
          .from(tableName)
          .insert(workoutData);
      }
      
      if (result.error) {
        console.error('[WeeklyPlanHeader] Error persisting workout data:', result.error);
      }
    } catch (error) {
      console.error('[WeeklyPlanHeader] Error in persistMonthlyChangeToDatabase:', error);
    }
  };

  // Function to persist deletions to the database
  const persistDeletionToDatabase = async (date: string) => {
    if (!clientId) return;
    
    try {
      // ALWAYS delete from schedule_preview to match the parent component's strategy
      const tableName = 'schedule_preview';
      
      // Delete the workout entry for this date
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .eq('for_date', date);
      
      if (error) {
        console.error('[WeeklyPlanHeader] Error deleting workout data:', error);
      }
    } catch (error) {
      console.error('[WeeklyPlanHeader] Error in persistDeletionToDatabase:', error);
    }
  };

  // Function to persist week copy to the database
  const persistWeekCopyToDatabase = async (sourceWeekIndex: number, targetWeekIndex: number, sourceWeek: WeekDay[]) => {
    if (!clientId) return;
    
    try {

      
      // Calculate the date offset between source and target weeks
      const weekOffset = targetWeekIndex - sourceWeekIndex;
      const daysOffset = weekOffset * 7;
      
      // Process each day in the source week
      for (const sourceDay of sourceWeek) {
        if (sourceDay.exercises.length === 0) continue; // Skip rest days
        
        // Calculate the target date
        const sourceDate = new Date(sourceDay.date);
        const targetDate = new Date(sourceDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        const targetDateStr = targetDate.toISOString().slice(0, 10);
        
        // Prepare the data to insert/update
        const workoutData = {
          client_id: clientId,
          type: 'workout',
          task: 'workout',
          icon: 'dumbell',
          summary: sourceDay.focus,
          for_date: targetDateStr,
          for_time: '16:00:00', // Default time
          workout_id: crypto.randomUUID(), // Generate new workout ID
          details_json: {
            focus: sourceDay.focus,
            exercises: sourceDay.exercises || []
          },
          is_approved: false
        };
        
        // Check if there's already an entry for this date
        const { data: existingData, error: checkError } = await supabase
          .from('schedule_preview')
          .select('id')
          .eq('client_id', clientId)
          .eq('type', 'workout')
          .eq('for_date', targetDateStr)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing data:', checkError);
          continue;
        }
        
        let result;
        if (existingData) {
          // Update existing entry
          result = await supabase
            .from('schedule_preview')
            .update(workoutData)
            .eq('id', existingData.id);
        } else {
          // Insert new entry
          result = await supabase
            .from('schedule_preview')
            .insert(workoutData);
        }
        
        if (result.error) {
          console.error('Error persisting workout data:', result.error);
        }
      }
    } catch (error) {
      console.error('Error in persistWeekCopyToDatabase:', error);
    }
  };

  // Create a flat array of all days for monthly operations
  const allDays = useMemo(() => {
    if (viewMode === 'weekly') return days;
    return monthlyData.flat();
  }, [viewMode, days, monthlyData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    // Parse week and day indices from the IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    if (viewMode === 'weekly') {
      const activeIndex = parseInt(activeId.replace('hdr-', ''), 10);
      const overIndex = parseInt(overId.replace('hdr-', ''), 10);
    const reordered = arrayMove(days, activeIndex, overIndex);
    const updated = reordered.map((day, idx) => {
      const newDate = new Date(planStartDate.getTime() + idx * 24 * 60 * 60 * 1000);
      const newDateStr = newDate.toISOString().slice(0, 10);
      return { ...day, date: newDateStr };
    });
    onReorder(updated);
    } else {
      // For monthly view, we'll handle drag and drop within the same week for now
      // This could be expanded to allow cross-week dragging
      const activeMatch = activeId.match(/hdr-(\d+)-(\d+)/);
      const overMatch = overId.match(/hdr-(\d+)-(\d+)/);
      
      if (activeMatch && overMatch) {
        const activeWeek = parseInt(activeMatch[1], 10);
        const activeDay = parseInt(activeMatch[2], 10);
        const overWeek = parseInt(overMatch[1], 10);
        const overDay = parseInt(overMatch[2], 10);
        
        // Only allow dragging within the same week for now
        if (activeWeek === overWeek) {
          const currentWeek = monthlyData[activeWeek];
          const reordered = arrayMove(currentWeek, activeDay, overDay);
          // Update the monthly data (this would need to be handled by parent component)
        }
      }
    }
  };

  const startCopy = (date: string) => {
    setCopySourceDate(date);
    setCopyTargetDate(null);
    setMenuOpenFor(null);
  };

  const deleteWorkout = async (date: string) => {
    if (viewMode === 'weekly') {
      // For weekly view, update the current week
      const updated = days.map((d) => (d.date === date ? { ...d, focus: 'Rest Day', exercises: [] } : d));
      
      // Call onPlanChange to update parent component (no auto-save in explicit save model)
      onPlanChange(updated, false);
      
      // Mark the deleted date as dirty for explicit save model
      if (onDirtyDatesChange) {
        // Merge with existing dirty dates instead of replacing
        const newDirtyDates = new Set([...Array.from(dirtyDates), date]);
        onDirtyDatesChange(newDirtyDates);
      }
      
      // No need to trigger approval status check immediately - will be updated when saved
    } else {
      // For monthly view, update the entire monthly data structure
      const updatedMonthlyData = monthlyData.map(week => 
        week.map(day => 
          day.date === date 
            ? { ...day, focus: 'Rest Day', exercises: [] }
            : day
        )
      );
      
      // Update local state to reflect changes
      setLocalMonthlyData(updatedMonthlyData);
      
      // Update the current week data (for backward compatibility)
      const updatedCurrentWeek = updatedMonthlyData[0];
      onPlanChange(updatedCurrentWeek, false);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Also update the monthly data state for the table
      if (onMonthlyDataChange) {
        onMonthlyDataChange(updatedMonthlyData);
      }
      
      // Mark the deleted date as dirty for explicit save model
      if (onDirtyDatesChange) {
        // Merge with existing dirty dates instead of replacing
        const newDirtyDates = new Set([...Array.from(dirtyDates), date]);
        onDirtyDatesChange(newDirtyDates);
      }
      
      // No immediate database persistence - changes are stored locally until explicitly saved
    }
    setMenuOpenFor(null);
  };

  const selectTarget = (date: string) => {
    if (copySourceDate == null) return;
    if (date === copySourceDate) return;
    setCopyTargetDate(date);
  };

  const confirmPaste = async () => {
    if (copySourceDate == null || copyTargetDate == null) return;
    
    if (viewMode === 'weekly') {
      // For weekly view, find source and target days in current week
      const sourceDay = days.find(d => d.date === copySourceDate);
      if (!sourceDay) {
        return;
      }
      
      const updated = days.map((d) => 
        d.date === copyTargetDate 
          ? { ...d, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] }
          : d
      );
      
      // Call onPlanChange to update parent component (no auto-save in explicit save model)
      onPlanChange(updated, false);
      
      // Mark the target date as dirty for explicit save model
      if (onDirtyDatesChange) {
        // Merge with existing dirty dates instead of replacing
        const newDirtyDates = new Set([...Array.from(dirtyDates), copyTargetDate]);
        onDirtyDatesChange(newDirtyDates);
      }
      
      // No need to trigger approval status check immediately - will be updated when saved
    } else {
      // For monthly view, find source and target days in all days
      const sourceDay = allDays.find(d => d.date === copySourceDate);
      if (!sourceDay) {
        return;
      }
      
      // Update the entire monthly data structure
      const updatedMonthlyData = monthlyData.map(week => 
        week.map(day => 
          day.date === copyTargetDate 
            ? { ...day, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] }
            : day
        )
      );
      
      // Update local state to reflect changes
      setLocalMonthlyData(updatedMonthlyData);
      
      // Update the current week data (for backward compatibility)
      const updatedCurrentWeek = updatedMonthlyData[0];
      onPlanChange(updatedCurrentWeek, false);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Also update the monthly data state for the table
      if (onMonthlyDataChange) {
        onMonthlyDataChange(updatedMonthlyData);
      }
      
      // Mark the target date as dirty for explicit save model
      if (onDirtyDatesChange) {
        // Merge with existing dirty dates instead of replacing
        const newDirtyDates = new Set([...Array.from(dirtyDates), copyTargetDate]);
        onDirtyDatesChange(newDirtyDates);
      }
      
      // No immediate database persistence - changes are stored locally until explicitly saved
    }
    
    setCopySourceDate(null);
    setCopyTargetDate(null);
  };

  const cancelPaste = () => {
    setCopySourceDate(null);
    setCopyTargetDate(null);
  };

  // Week-level copy/paste functions
  const startWeekCopy = (weekIndex: number) => {
    setCopySourceWeek(weekIndex);
    setCopyTargetWeek(null);
    setMenuOpenFor(null);
  };

  const selectWeekTarget = (weekIndex: number) => {
    if (copySourceWeek == null) return;
    if (weekIndex === copySourceWeek) return;
    setCopyTargetWeek(weekIndex);
    setShowWeekCopyConfirm(true);
  };

  const confirmWeekPaste = async () => {
    if (copySourceWeek == null || copyTargetWeek == null) return;
    
    try {
      const sourceWeek = monthlyData[copySourceWeek];
      if (!sourceWeek) return;
      
      // Update the entire monthly data structure
      const updatedMonthlyData = monthlyData.map((week, weekIndex) => 
        weekIndex === copyTargetWeek 
          ? sourceWeek.map(day => ({
              ...day,
              date: new Date(new Date(day.date).getTime() + (copyTargetWeek - copySourceWeek) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            }))
          : week
      );
      
      // Update local state to reflect changes
      setLocalMonthlyData(updatedMonthlyData);
      
      // Update the current week data (for backward compatibility)
      const updatedCurrentWeek = updatedMonthlyData[0];
      onPlanChange(updatedCurrentWeek, false);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Also update the monthly data state for the table
      if (onMonthlyDataChange) {
        onMonthlyDataChange(updatedMonthlyData);
      }
      
      // Mark all dates in the target week as dirty for explicit save model
      if (onDirtyDatesChange) {
        const targetWeekStartDate = copyTargetWeek === 0 ? baseStartDate : addWeeks(baseStartDate, copyTargetWeek);
        const targetWeekDates = [];
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(targetWeekStartDate.getTime() + i * 24 * 60 * 60 * 1000);
          targetWeekDates.push(format(dayDate, 'yyyy-MM-dd'));
        }
        // Merge with existing dirty dates instead of replacing
        const newDirtyDates = new Set([...Array.from(dirtyDates), ...targetWeekDates]);
        onDirtyDatesChange(newDirtyDates);
      }
      
      // No immediate database persistence - changes are stored locally until explicitly saved
      
      // Reset state
      setCopySourceWeek(null);
      setCopyTargetWeek(null);
      setShowWeekCopyConfirm(false);
    } catch (error) {
      console.error('Error in confirmWeekPaste:', error);
    }
  };

  const cancelWeekPaste = () => {
    setCopySourceWeek(null);
    setCopyTargetWeek(null);
    setShowWeekCopyConfirm(false);
  };

  // Helper function to get equipment icon
  const getEquipmentIcon = (equipment: string) => {
    const lowerEquipment = equipment.toLowerCase();
    if (lowerEquipment.includes('dumbbell')) return '🏋️';
    if (lowerEquipment.includes('barbell')) return '🏋️‍♂️';
    if (lowerEquipment.includes('kettlebell')) return '🏋️';
    if (lowerEquipment.includes('resistance') || lowerEquipment.includes('band')) return '🏋️';
    if (lowerEquipment.includes('machine')) return '🏋️‍♀️';
    if (lowerEquipment.includes('bodyweight') || lowerEquipment.includes('none')) return '🏃';
    return '💪';
  };

  // Helper function to format tooltip content for exercises - DISABLED FOR NOW
  // const formatExerciseTooltip = (day: WeekDay) => { ... };

  const renderDayBox = (day: WeekDay, index: number, weekIndex: number = 0) => {
    const isSource = copySourceDate === day.date;
    const isTarget = copyTargetDate === day.date;
    const isCopyMode = copySourceDate != null;
    
    let baseColors = day.exercises.length > 0 ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200';
            const sourceColors = 'bg-blue-600 text-white border-blue-700';
            const targetColors = 'bg-blue-100 text-blue-800 border-blue-200';
    const copyModeColors = 'bg-yellow-50 text-gray-700 border border-yellow-300';
    
    let boxClasses = baseColors;
    if (isSource) {
      boxClasses = sourceColors;
    } else if (isTarget) {
      boxClasses = targetColors;
    } else if (isCopyMode && !isSource) {
      boxClasses = copyModeColors;
    }
    
    const boxId = viewMode === 'weekly' ? `hdr-${index}` : `hdr-${weekIndex}-${index}`;
    const menuId = `menu-${day.date}`;

    // Determine tooltip position based on box location to prevent cutoff - DISABLED FOR NOW
    /*
    const getTooltipSide = () => {
      const totalBoxes = 7; // Always 7 days per week regardless of view mode
      const isFirstBox = index === 0;
      const isLastBox = index === totalBoxes - 1;
      const isSecondBox = index === 1;
      const isSecondToLastBox = index === totalBoxes - 2;

      // For edge boxes, use bottom positioning to avoid screen cutoff
      if (isFirstBox) return "bottom";
      if (isSecondBox) return "bottom";
      if (isSecondToLastBox) return "bottom";
      if (isLastBox) return "bottom";

      // For middle boxes, use top (default)
      return "top";
    };

    const getTooltipAlign = () => {
      const totalBoxes = 7;
      const isFirstBox = index === 0;
      const isLastBox = index === totalBoxes - 1;

      // Align tooltips to prevent cutoff
      if (isFirstBox) return "start";
      if (isLastBox) return "end";
      return "center";
    };
    */

            return (
      <SortableHeaderBox key={boxId} id={boxId} disabled={copySourceDate != null}>
                {/* <TooltipProvider delayDuration={0} skipDelayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild> */}
                      <div
                        className={`relative p-2 rounded text-center ${boxClasses} cursor-pointer`}
                        onClick={() => {
                          if (copySourceDate != null) selectTarget(day.date);
                        }}
                      >
                        {/* 3-dots menu (popover) */}
                        <Popover open={menuOpenFor === menuId} onOpenChange={(open) => setMenuOpenFor(open ? menuId : null)}>
                          <PopoverTrigger asChild>
                            <button
                              className="absolute top-1 right-1 p-1 rounded hover:bg-black/10"
                              // title="More"
                              onMouseDown={(e) => { e.stopPropagation(); }}
                              onPointerDown={(e) => { e.stopPropagation(); }}
                              onPointerUp={(e) => { e.stopPropagation(); }}
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" side="right" className="w-40 p-1" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                            <button
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => { e.stopPropagation(); startCopy(day.date); }}
                            >
                              Copy workout
                            </button>
                            <button
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => { e.stopPropagation(); deleteWorkout(day.date); }}
                            >
                              Delete workout
                            </button>
                          </PopoverContent>
                        </Popover>

                        <div className="font-medium">{day.focus}</div>
                        <div className="text-xs">{format(parseISO(day.date), 'MMM d')} • {format(parseISO(day.date), 'EEEE')}</div>
                        <div className="text-xs mt-1">
                          {day.exercises.length > 0 ? `${day.exercises.length} exercise${day.exercises.length > 1 ? 's' : ''}` : 'Rest day'}
                        </div>

                        {/* Paste controls on target */}
                        {isTarget && (
                          <div className="absolute top-1 left-1 flex gap-1"
                               onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 rounded bg-white/80 hover:bg-white" /* title="Save" */ onClick={confirmPaste}>
                              <Check className="h-4 w-4 text-green-600" />
                            </button>
                            <button className="p-1 rounded bg-white/80 hover:bg-white" /* title="Cancel" */ onClick={cancelPaste}>
                              <X className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    {/* </TooltipTrigger>
                    <TooltipContent
                      side={getTooltipSide()}
                      align={getTooltipAlign()}
                      className="p-0 border-0 shadow-xl"
                    >
                      {formatExerciseTooltip(day)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider> */}
              </SortableHeaderBox>
            );
  };

  const renderWeeklyView = () => (
    <div className="space-y-4">
      {/* Weekly Status Indicator */}
      {viewMode === 'weekly' && weekStatuses && weekStatuses.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center gap-3">
            {(() => {
              const originalStatus = weekStatuses[0]?.status || 'draft';
              const displayStatus = getWeekDisplayStatus(0, originalStatus);
              
              if (displayStatus === 'approved') {
                return (
                  <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    Approved
                  </span>
                );
              }

              if (displayStatus === 'unsaved_changes') {
                return (
                  <span className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300">
                    <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                    Unsaved Changes
                  </span>
                );
              }

              const label = originalStatus === 'draft' ? 'Plan Not Approved' : 'Plan Not Created';

              return (
                <span className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                  {/* Flashing red dot */}
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
                  </span>
                  {label}
                </span>
              );
            })()}
          </div>
          
          {/* Weekly Approval Button */}
          {weekStatuses[0]?.canApprove && onApproveWeek && (
            <button
              onClick={async () => {
                setApprovingWeek(0);
                try {
                  await onApproveWeek(0);
                } finally {
                  setApprovingWeek(null);
                }
              }}
              disabled={approvingWeek === 0 || isWeekDirty(0)}
                                            /* title={isWeekDirty(0) ? "Save your changes before approving this week" : ""} */
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit"
            >
              {approvingWeek === 0 ? (
                <>
                  <Check className="h-3 w-3 mr-1 animate-spin" />
                  Approving...
                </>
              ) : isWeekDirty(0) ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Save First
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Approve Week
                </>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Weekly Plan Grid */}
      <div className="grid grid-cols-7 gap-2 text-sm">
        {days.map((day, index) => renderDayBox(day, index))}
      </div>
    </div>
  );

  const renderMonthlyView = () => (
    <div className="space-y-6">
      {isLoadingMultiWeek ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading workout data...</p>
          </div>
        </div>
      ) : (
        monthlyData.map((week, weekIndex) => {
          // Calculate the actual start and end dates for this week
          const weekStartDate = weekIndex === 0 ? planStartDate : addWeeks(planStartDate, weekIndex);
          const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          
          return (
            <div key={weekIndex} className="space-y-3">
              <div className={`flex items-center justify-between px-2 py-1 rounded-lg border ${
                copySourceWeek === weekIndex
                  ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/40 dark:border-blue-600'
                  : copyTargetWeek === weekIndex
                  ? 'bg-green-100 border-green-300 dark:bg-green-900/40 dark:border-green-600'
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    copySourceWeek === weekIndex
                      ? 'bg-blue-600'
                      : copyTargetWeek === weekIndex
                      ? 'bg-green-600'
                      : 'bg-blue-500'
                  }`}></div>
                  <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Week {weekIndex + 1}: {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                  </div>

                  {/* Status Indicator */}
                  {weekStatuses && weekStatuses[weekIndex] && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {(() => {
                          const originalStatus = weekStatuses[weekIndex].status;
                          const displayStatus = getWeekDisplayStatus(weekIndex, originalStatus);
                          
                          if (displayStatus === 'approved') {
                            return (
                              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                                <span className="h-2 w-2 rounded-full bg-green-400"></span>
                                Approved
                              </span>
                            );
                          }

                          if (displayStatus === 'unsaved_changes') {
                            return (
                              <span className="flex items-center gap-1 text-xs font-semibold text-orange-400">
                                <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                                Unsaved Changes
                              </span>
                            );
                          }

                          const label = originalStatus === 'draft' ? 'Plan Not Approved' : 'Plan Not Created';
                          return (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                              </span>
                              {label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Week-level controls */}
                <div className="flex items-center gap-1">
                  {/* Approval Button - only show for weeks that can be approved */}
                  {weekStatuses && weekStatuses[weekIndex]?.canApprove && onApproveWeek && (
                    <button
                      onClick={async () => {
                        setApprovingWeek(weekIndex);
                        try {
                          await onApproveWeek(weekIndex);
                        } finally {
                          setApprovingWeek(null);
                        }
                      }}
                      disabled={approvingWeek === weekIndex || isWeekDirty(weekIndex)}
                      /* title={isWeekDirty(weekIndex) ? "Save your changes before approving this week" : ""} */
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit"
                    >
                      {approvingWeek === weekIndex ? (
                        <>
                          <Check className="h-3 w-3 mr-1 animate-spin" />
                          Approving...
                        </>
                      ) : isWeekDirty(weekIndex) ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Save First
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </>
                      )}
                    </button>
                  )}

                  {/* Copy/Paste controls */}
                  {copySourceWeek === null && (
                    <button
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-fit"
                      onClick={() => startWeekCopy(weekIndex)}
                      /* title="Copy entire week" */
                    >
                      Copy Week
                    </button>
                  )}

                  {copySourceWeek !== null && copySourceWeek !== weekIndex && (
                    <button
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-fit"
                      onClick={() => selectWeekTarget(weekIndex)}
                      /* title="Paste week here" */
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Paste Week
                    </button>
                  )}

                  {copySourceWeek === weekIndex && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-600 font-medium">Source</span>
                      <button
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap flex items-center justify-center min-w-fit"
                        onClick={cancelWeekPaste}
                        /* title="Cancel copy" */
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {week.map((day, dayIndex) => renderDayBox(day, dayIndex, weekIndex))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Week Copy Confirmation Dialog */}
      {showWeekCopyConfirm && copySourceWeek !== null && copyTargetWeek !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl border border-gray-200 dark:border-gray-700 transform -translate-y-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Copy Week {copySourceWeek + 1} to Week {copyTargetWeek + 1}?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will copy all workouts from Week {copySourceWeek + 1} to Week {copyTargetWeek + 1}. 
                Any existing workouts in the target week will be replaced.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={cancelWeekPaste}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmWeekPaste}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Confirm Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Status Indicator */}
      {viewMode === 'monthly' && monthlyStatus && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            {(() => {
              const statusDisplay = getStatusDisplay(monthlyStatus.status, true);
              return (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusDisplay.className}`}>
                  <span>{statusDisplay.icon}</span>
                  <span>{statusDisplay.text}</span>
                  {monthlyStatus.weeklyBreakdown && (
                    <span className="text-xs opacity-75">
                      ({monthlyStatus.weeklyBreakdown.filter(w => w.status === 'approved').length}/4 weeks)
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Weekly Status Indicator */}
      {viewMode === 'weekly' && weeklyStatus && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            {(() => {
              const statusDisplay = getStatusDisplay(weeklyStatus.status, false);
              return (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusDisplay.className}`}>
                  <span>{statusDisplay.icon}</span>
                  <span>{statusDisplay.text}</span>
                  <span className="text-xs opacity-75">
                    ({weeklyStatus.previewData.filter(d => d.is_approved).length}/7 days)
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Plan Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={
            viewMode === 'weekly' 
              ? days.map((_, idx) => `hdr-${idx}`)
              : monthlyData.flatMap((week, weekIdx) => 
                  week.map((_, dayIdx) => `hdr-${weekIdx}-${dayIdx}`)
                )
          } 
          strategy={horizontalListSortingStrategy}
        >
          {viewMode === 'weekly' ? renderWeeklyView() : renderMonthlyView()}
      </SortableContext>
    </DndContext>

    {/* Video Modal */}
    <VideoModal
      open={videoModalOpen}
      onClose={closeVideoModal}
      videoUrl={selectedVideoUrl}
      exerciseName={selectedExerciseName}
    />
    </div>
  );
}


