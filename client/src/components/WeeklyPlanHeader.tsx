"use client"
import React, { useMemo, useState, useEffect } from 'react';
import { format, parseISO, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, Check, X, Calendar, CalendarDays } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  checkMonthlyWorkoutStatus, 
  getStatusDisplay,
  type WorkoutStatusResult 
} from '@/utils/workoutStatusUtils';

type WeekDay = {
  date: string;
  focus: string;
  exercises: any[];
};

interface WeeklyPlanHeaderProps {
  week: WeekDay[];
  planStartDate: Date;
  onReorder: (updatedWeek: WeekDay[]) => void;
  onPlanChange: (updatedWeek: WeekDay[]) => void;
  onMonthlyChange?: (updatedMonthlyData: WeekDay[][]) => void;
  clientId?: number; // Add clientId for fetching multi-week data
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

export default function WeeklyPlanHeader({ week, planStartDate, onReorder, onPlanChange, onMonthlyChange, clientId }: WeeklyPlanHeaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
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

  // For weekly view, ensure we're using the planStartDate consistently
  const days = useMemo(() => {
    if (viewMode === 'weekly') {
      // Always generate week data from planStartDate to ensure consistency
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = dayDate.toISOString().slice(0, 10);
        
        // Find matching data from the week prop if it exists
        const existingDay = week?.find(d => d.date === dateStr);
        if (existingDay) {
          weekDays.push(existingDay);
        } else {
          weekDays.push({ date: dateStr, focus: 'Rest Day', exercises: [] });
        }
      }
      return weekDays;
    }
    return week || [];
  }, [week, planStartDate, viewMode]);

  // Function to fetch multi-week data using unified status logic
  const fetchMultiWeekData = async () => {
    if (!clientId || viewMode !== 'monthly') return;
    
    setIsLoadingMultiWeek(true);
    try {
      console.log('[fetchMultiWeekData] Fetching monthly workout data using unified logic');
      
      // Use the unified monthly status function
      const monthlyResult: WorkoutStatusResult = await checkMonthlyWorkoutStatus(supabase, clientId, planStartDate);
      
      console.log('[fetchMultiWeekData] Monthly status result:', monthlyResult);
      
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
            let dayData = weekData.previewData?.find(d => d.for_date === dateStr);
            
            // If no preview data, try schedule data (for comparison only)
            if (!dayData) {
              dayData = weekData.scheduleData?.find(d => d.for_date === dateStr);
            }
            
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
        console.log('[fetchMultiWeekData] Set multi-week data:', weeks.length, 'weeks');
      } else {
        // Fallback to generating placeholder data if no breakdown available
        console.log('[fetchMultiWeekData] No weekly breakdown, generating placeholder data');
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

  // Fetch multi-week data when view mode changes to monthly
  useEffect(() => {
    if (viewMode === 'monthly' && clientId) {
      fetchMultiWeekData();
    }
  }, [viewMode, clientId, planStartDate]);

  // Function to persist monthly changes to the database
  const persistMonthlyChangeToDatabase = async (targetDate: string, sourceDay: WeekDay) => {
    if (!clientId) return;
    
    try {
      console.log(`Persisting workout copy from ${copySourceDate} to ${targetDate}`);
      
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
        console.error('Error checking existing data:', checkError);
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
        console.error('Error persisting workout data:', result.error);
      } else {
        console.log(`Successfully persisted workout data to ${tableName} for ${targetDate}`);
      }
    } catch (error) {
      console.error('Error in persistMonthlyChangeToDatabase:', error);
    }
  };

  // Function to persist deletions to the database
  const persistDeletionToDatabase = async (date: string) => {
    if (!clientId) return;
    
    try {
      console.log(`Persisting workout deletion for ${date}`);
      
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
        console.error('Error deleting workout data:', error);
      } else {
        console.log(`Successfully deleted workout data from ${tableName} for ${date}`);
      }
    } catch (error) {
      console.error('Error in persistDeletionToDatabase:', error);
    }
  };

  // Function to persist week copy to the database
  const persistWeekCopyToDatabase = async (sourceWeekIndex: number, targetWeekIndex: number, sourceWeek: WeekDay[]) => {
    if (!clientId) return;
    
    try {
      console.log(`Persisting week copy from week ${sourceWeekIndex + 1} to week ${targetWeekIndex + 1}`);
      
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
        } else {
          console.log(`Successfully persisted workout data for ${targetDateStr}`);
        }
      }
      
      console.log(`Successfully completed week copy from week ${sourceWeekIndex + 1} to week ${targetWeekIndex + 1}`);
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
    onPlanChange(updated);
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
      onPlanChange(updatedCurrentWeek);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Persist the deletion to the database
      await persistDeletionToDatabase(date);
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
      if (!sourceDay) return;
      
      const updated = days.map((d) => 
        d.date === copyTargetDate 
          ? { ...d, focus: sourceDay.focus, exercises: [...(sourceDay.exercises || [])] }
          : d
      );
    onPlanChange(updated);
    } else {
      // For monthly view, find source and target days in all days
      const sourceDay = allDays.find(d => d.date === copySourceDate);
      if (!sourceDay) return;
      
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
      onPlanChange(updatedCurrentWeek);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Persist the change to the database
      await persistMonthlyChangeToDatabase(copyTargetDate, sourceDay);
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
      onPlanChange(updatedCurrentWeek);
      
      // If we have the monthly change callback, also update the full monthly data
      if (onMonthlyChange) {
        onMonthlyChange(updatedMonthlyData);
      }
      
      // Persist the week copy to the database
      await persistWeekCopyToDatabase(copySourceWeek, copyTargetWeek, sourceWeek);
      
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

            return (
      <SortableHeaderBox key={boxId} id={boxId} disabled={copySourceDate != null}>
                <div
                  className={`relative p-2 rounded text-center ${boxClasses}`}
                  onClick={() => {
            if (copySourceDate != null) selectTarget(day.date);
                  }}
                >
                  {/* 3-dots menu (popover) */}
          <Popover open={menuOpenFor === menuId} onOpenChange={(open) => setMenuOpenFor(open ? menuId : null)}>
                    <PopoverTrigger asChild>
                      <button
                        className="absolute top-1 right-1 p-1 rounded hover:bg-black/10"
                        title="More"
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
                      <button className="p-1 rounded bg-white/80 hover:bg-white" title="Save" onClick={confirmPaste}>
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                      <button className="p-1 rounded bg-white/80 hover:bg-white" title="Cancel" onClick={cancelPaste}>
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </SortableHeaderBox>
            );
  };

  const renderWeeklyView = () => (
    <div className="grid grid-cols-7 gap-2 text-sm">
      {days.map((day, index) => renderDayBox(day, index))}
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
                </div>
                
                {/* Week-level copy/paste controls */}
                <div className="flex items-center gap-1">
                  {copySourceWeek === null && (
                    <button
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      onClick={() => startWeekCopy(weekIndex)}
                      title="Copy entire week"
                    >
                      Copy Week
                    </button>
                  )}
                  
                  {copySourceWeek !== null && copySourceWeek !== weekIndex && (
                    <button
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      onClick={() => selectWeekTarget(weekIndex)}
                      title="Paste week here"
                    >
                      Paste Week
                    </button>
                  )}
                  
                  {copySourceWeek === weekIndex && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-600 font-medium">Source</span>
                      <button
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        onClick={cancelWeekPaste}
                        title="Cancel copy"
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

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan View</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Monthly Status Indicator */}
          {viewMode === 'monthly' && monthlyStatus && (
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
          )}
          
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              7 Day
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="text-xs"
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Monthly
            </Button>
          </div>
        </div>
      </div>

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
    </div>
  );
}


