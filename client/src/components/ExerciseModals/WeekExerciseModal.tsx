"use client"
import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { X, Play, Pause, Save, Edit3, Trash2, Plus, Check, Undo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoThumbnail from '@/components/VideoThumbnail';
import VideoModal from '@/components/VideoModal';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import AddExerciseModal from '@/components/AddExerciseModal';

// Enhanced Inline Editable Cell Component with auto-save and clean UX
const EditableCell = ({ 
  value, 
  onSave, 
  type = 'text',
  placeholder = '',
  className = '',
  showTooltip = false,
  maxLength = 50,
  showButtons = false // New prop to control button visibility
}: {
  value: string | number | undefined | null;
  onSave: (newValue: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  showTooltip?: boolean;
  maxLength?: number;
  showButtons?: boolean; // For wide columns that can accommodate buttons
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [showFullText, setShowFullText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue !== value?.toString()) {
      setIsSaving(true);
      try {
        await onSave(editValue);
        // Show brief success feedback
        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        setIsSaving(false);
        // Revert on error
        setEditValue(value?.toString() || '');
      }
    }
    setIsEditing(false);
    setShowFullText(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
    setShowFullText(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const displayValue = value?.toString() || '';
  const isLongText = displayValue.length > maxLength;
  const truncatedValue = isLongText ? displayValue.substring(0, maxLength) + '...' : displayValue;

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 w-full ${showButtons ? '' : 'justify-center'}`}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className={`h-8 text-sm ${showButtons ? 'flex-1 min-w-0' : 'w-full'} ${className} ${isSaving ? 'bg-green-50 border-green-300' : ''}`}
          placeholder={placeholder}
          disabled={isSaving}
        />
        {showButtons && (
          <>
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0 flex-shrink-0" disabled={isSaving}>
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0 flex-shrink-0" disabled={isSaving}>
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </>
        )}
        {isSaving && (
          <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1 group relative ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="truncate flex-1 min-w-0">
        {showFullText ? displayValue : truncatedValue}
      </span>
      {isLongText && !showFullText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFullText(true);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 ml-1"
          title="Show full text"
        >
          more
        </button>
      )}
      {isLongText && showFullText && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFullText(false);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 ml-1"
          title="Show less"
        >
          less
        </button>
      )}
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      
      {/* Tooltip for long text */}
      {showTooltip && isLongText && !showFullText && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {displayValue}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Exercise interface matching the existing structure
interface Exercise {
  id?: string;
  exercise: string; // Changed from 'name' to 'exercise' to match actual data structure
  category?: string;
  body_part?: string;
  sets?: number | string;
  reps?: number | string;
  duration?: string; // Duration in minutes
  weight?: number | string;
  equipment?: string;
  video_link?: string; // Changed from 'video_url' to 'video_link' to match actual data structure
  video_thumbnail?: string; // Added video_thumbnail property
  rest?: number | string;
  other_details?: string;
  coach_tip?: string;
  details_json?: any;
  workout_id?: string;
}

interface WeekDay {
  date: string;
  focus: string;
  exercises: Exercise[];
}

// Undo operation interface
interface UndoableOperation {
  id: string;
  type: 'update' | 'add' | 'delete' | 'select';
  dayIndex: number;
  exerciseIndex?: number;
  field?: keyof Exercise;
  oldValue?: any;
  newValue?: any;
  timestamp: number;
  description: string; // User-friendly description
}

interface WeekExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  week: WeekDay[];
  planStartDate: Date;
  clientId: number;
  onSave: (updatedWeek: WeekDay[]) => void;
}

export default function WeekExerciseModal({ isOpen, onClose, week, planStartDate, clientId, onSave }: WeekExerciseModalProps) {
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [originalWeekData, setOriginalWeekData] = useState<WeekDay[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Undo functionality state
  const [undoHistory, setUndoHistory] = useState<UndoableOperation[]>([]);
  const [undoIndex, setUndoIndex] = useState(-1);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  
  // Exercise picker and add exercise modals
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [selectedDayForExercise, setSelectedDayForExercise] = useState<number | null>(null);
  
  // Date filter state
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [filteredWeekData, setFilteredWeekData] = useState<WeekDay[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Initialize week data when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialData = week || [];
      setWeekData(initialData);
      setOriginalWeekData(JSON.parse(JSON.stringify(initialData))); // Deep copy
      setHasUnsavedChanges(false);
      setIsSaving(false); // Reset saving state when modal opens
      
      // Reset undo state
      setUndoHistory([]);
      setUndoIndex(-1);
    }
  }, [isOpen, week]);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    if (isOpen && originalWeekData.length > 0) {
      const hasChanges = JSON.stringify(weekData) !== JSON.stringify(originalWeekData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [weekData, originalWeekData, isOpen]);

  // Undo helper functions
  const addToUndoHistory = (operation: Omit<UndoableOperation, 'id' | 'timestamp'>) => {
    const newOperation: UndoableOperation = {
      ...operation,
      id: uuidv4(),
      timestamp: Date.now()
    };
    
    // Remove any operations after current index (when user makes new changes after undoing)
    const newHistory = undoHistory.slice(0, undoIndex + 1);
    newHistory.push(newOperation);
    
    setUndoHistory(newHistory);
    setUndoIndex(newHistory.length - 1);
    
    console.log('[WeekExerciseModal] Added to undo history:', newOperation.description);
  };

  const handleUndo = () => {
    if (undoIndex >= 0 && undoHistory[undoIndex]) {
      const operation = undoHistory[undoIndex];
      console.log('[WeekExerciseModal] Undoing operation:', operation.description);
      
      // Apply the undo based on operation type
      setWeekData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        
        switch (operation.type) {
          case 'update':
            if (operation.dayIndex !== undefined && operation.exerciseIndex !== undefined && operation.field) {
              newData[operation.dayIndex].exercises[operation.exerciseIndex][operation.field] = operation.oldValue;
            }
            break;
            
          case 'add':
            if (operation.dayIndex !== undefined && operation.exerciseIndex !== undefined) {
              newData[operation.dayIndex].exercises.splice(operation.exerciseIndex, 1);
            }
            break;
            
          case 'delete':
            if (operation.dayIndex !== undefined && operation.exerciseIndex !== undefined && operation.oldValue) {
              newData[operation.dayIndex].exercises.splice(operation.exerciseIndex, 0, operation.oldValue);
            }
            break;
            
          case 'select':
            if (operation.dayIndex !== undefined && operation.exerciseIndex !== undefined) {
              newData[operation.dayIndex].exercises.splice(operation.exerciseIndex, 1);
            }
            break;
        }
        
        return newData;
      });
      
      // Move to previous operation
      setUndoIndex(prev => prev - 1);
      
      // Show feedback
      console.log(`[WeekExerciseModal] Undid: ${operation.description}`);
    }
  };

  const canUndo = undoIndex >= 0;

  // Fetch data based on date filter
  const fetchDataByDateRange = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate || !clientId) return;
    
    setIsLoadingData(true);
    try {
      console.log('[WeekExerciseModal] Fetching data for date range:', { startDate, endDate, clientId });
      // Normalize inputs to local-calendar dates without any week alignment.
      // We intentionally keep filtering in LOCAL timezone context.
      // Convert the input strings to Date at local midnight and back to yyyy-MM-dd.
      const toLocalYmd = (d: string) => {
        const local = new Date(`${d}T00:00:00`);
        const y = local.getFullYear();
        const m = String(local.getMonth() + 1).padStart(2, '0');
        const day = String(local.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const startLocal = toLocalYmd(startDate);
      const endLocal = toLocalYmd(endDate);
      
      const { data, error } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .gte('for_date', startLocal)
        .lte('for_date', endLocal)
        .order('for_date', { ascending: true });

      if (error) {
        console.error('[WeekExerciseModal] Error fetching data:', error);
        throw error;
      }

      console.log('[WeekExerciseModal] Fetched data:', data);

      // Group data by date and convert to WeekDay format
      const groupedData: { [key: string]: any[] } = {};
      data?.forEach(item => {
        const date = item.for_date;
        if (!groupedData[date]) {
          groupedData[date] = [];
        }
        groupedData[date].push(item);
      });

      // Convert to WeekDay format
      const weekDays: WeekDay[] = Object.keys(groupedData)
        .sort()
        .map(date => {
          const dayData = groupedData[date];
          const firstItem = dayData[0];
          
          // Parse the details_json to get exercises
          let exercises: any[] = [];
          if (firstItem.details_json && firstItem.details_json.exercises) {
            exercises = firstItem.details_json.exercises.map((exercise: any) => ({
              exercise: exercise.exercise || exercise.exercise_name || 'Unnamed Exercise',
              duration: exercise.duration || exercise.time || 0,
              sets: exercise.sets || 0,
              reps: exercise.reps || 0,
              weight: exercise.weight || 0,
              equipment: exercise.equipment || '',
              video_link: exercise.video_link || '',
              video_thumbnail: exercise.video_thumbnail || ''
            }));
          }
          
          return {
            date,
            focus: firstItem.focus || 'General',
            exercises
          };
        });

      setFilteredWeekData(weekDays);
      setWeekData(weekDays);
      setOriginalWeekData(JSON.parse(JSON.stringify(weekDays)));
      
      console.log('[WeekExerciseModal] Processed week data:', weekDays);
      
    } catch (error) {
      console.error('[WeekExerciseModal] Error in fetchDataByDateRange:', error);
      alert('Failed to fetch workout data. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle date filter changes
  const handleDateFilterChange = () => {
    if (dateFilterStart && dateFilterEnd) {
      fetchDataByDateRange(dateFilterStart, dateFilterEnd);
    }
  };

  // Initialize date filter with default range (current week)
  useEffect(() => {
    if (isOpen && week.length > 0) {
      const startDate = week[0]?.date || format(planStartDate, 'yyyy-MM-dd');
      const endDate = week[week.length - 1]?.date || format(addDays(planStartDate, 6), 'yyyy-MM-dd');
      
      setDateFilterStart(startDate);
      setDateFilterEnd(endDate);
    }
  }, [isOpen, week, planStartDate]);

  // Keyboard shortcut for undo (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && !isSaving) {
          handleUndo();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, canUndo, isSaving, handleUndo]);
  const getLastOperationDescription = () => {
    if (undoIndex >= 0 && undoHistory[undoIndex]) {
      return undoHistory[undoIndex].description;
    }
    return '';
  };

  // Handle video modal
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

  // Handle exercise picker
  const handleExerciseSelect = (selectedExercise: any) => {
    if (selectedDayForExercise === null) return;
    
    const newExercise: Exercise = {
      exercise: selectedExercise.exercise_name,
      category: selectedExercise.category || '',
      body_part: selectedExercise.target_muscle || selectedExercise.primary_muscle || '',
      sets: 0,
      reps: 0,
      duration: '',
      weight: 0,
      equipment: selectedExercise.equipment || '',
      video_link: selectedExercise.video_link || '',
      video_thumbnail: '',
      rest: 0,
      other_details: selectedExercise.video_explanation || '',
      coach_tip: ''
    };
    
    const dayName = format(addDays(planStartDate, selectedDayForExercise), 'EEEE');
    const exerciseIndex = weekData[selectedDayForExercise]?.exercises.length || 0;
    
    // Add to undo history
    addToUndoHistory({
      type: 'select',
      dayIndex: selectedDayForExercise,
      exerciseIndex,
      description: `Added "${selectedExercise.exercise_name}" to ${dayName}`
    });
    
    const updatedWeek = weekData.map((day, index) => 
      index === selectedDayForExercise 
        ? { ...day, exercises: [...day.exercises, newExercise] }
        : day
    );
    setWeekData(updatedWeek);
    setExercisePickerOpen(false);
    setSelectedDayForExercise(null);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Handle add exercise modal success
  const handleAddExerciseSuccess = () => {
    setAddExerciseOpen(false);
    setSelectedDayForExercise(null);
    // Refresh the exercise list or show success message
  };

  // Add new exercise to a specific day
  const addExercise = (dayIndex: number) => {
    const newExercise: Exercise = {
      exercise: '',
      duration: '',
      sets: 0,
      reps: 0,
      weight: 0,
      equipment: '',
      video_link: '',
      video_thumbnail: '',
      category: '',
      body_part: '',
      rest: 0,
      other_details: '',
      coach_tip: ''
    };
    
    const dayName = format(addDays(planStartDate, dayIndex), 'EEEE');
    const exerciseIndex = weekData[dayIndex]?.exercises.length || 0;
    
    // Add to undo history
    addToUndoHistory({
      type: 'add',
      dayIndex,
      exerciseIndex,
      description: `Added new exercise to ${dayName}`
    });
    
    const updatedWeek = weekData.map((day, index) => 
      index === dayIndex 
        ? { ...day, exercises: [...day.exercises, newExercise] }
        : day
    );
    setWeekData(updatedWeek);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Delete exercise from a specific day - update local state only
  const deleteExercise = (dayIndex: number, exerciseIndex: number) => {
    // Get the exercise being deleted for undo
    const deletedExercise = weekData[dayIndex]?.exercises[exerciseIndex];
    const exerciseName = deletedExercise?.exercise || 'Exercise';
    const dayName = format(addDays(planStartDate, dayIndex), 'EEEE');
    
    // Add to undo history
    addToUndoHistory({
      type: 'delete',
      dayIndex,
      exerciseIndex,
      oldValue: deletedExercise,
      description: `Deleted "${exerciseName}" from ${dayName}`
    });
    
    const updatedWeek = weekData.map((day, index) => 
      index === dayIndex 
        ? { ...day, exercises: day.exercises.filter((_, i) => i !== exerciseIndex) }
        : day
    );
    setWeekData(updatedWeek);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Update exercise field - update local state only
  const updateExercise = (dayIndex: number, exerciseIndex: number, field: keyof Exercise, value: string | number) => {
    // Get the old value for undo
    const oldValue = weekData[dayIndex]?.exercises[exerciseIndex]?.[field];
    const exerciseName = weekData[dayIndex]?.exercises[exerciseIndex]?.exercise || 'Exercise';
    const dayName = format(addDays(planStartDate, dayIndex), 'EEEE');
    
    // Add to undo history
    addToUndoHistory({
      type: 'update',
      dayIndex,
      exerciseIndex,
      field,
      oldValue,
      newValue: value,
      description: `Changed ${field} for "${exerciseName}" on ${dayName}`
    });
    
    const updatedWeek = weekData.map((day, index) => 
      index === dayIndex 
        ? {
            ...day,
            exercises: day.exercises.map((exercise, exIndex) => 
              exIndex === exerciseIndex 
                ? { ...exercise, [field]: value }
                : exercise
            )
          }
        : day
    );
    setWeekData(updatedWeek);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Save changes to database and notify parent
  const handleSave = async () => {
    if (isSaving) {
      console.log('[WeekExerciseModal] Save already in progress, ignoring click');
      return; // Prevent multiple saves
    }
    
    console.log('[WeekExerciseModal] handleSave called with:', {
      weekDataLength: weekData.length,
      clientId,
      hasUnsavedChanges,
      isSaving
    });
    
    setIsSaving(true);
    
    // Set up timeout to prevent modal from getting stuck
    const timeoutId = setTimeout(() => {
      console.error('[WeekExerciseModal] Save operation timed out after 30 seconds');
      setIsSaving(false);
      alert('Save operation timed out. Please try again.');
    }, 30000); // 30 second timeout
    
    try {
      console.log('[WeekExerciseModal] Starting batch save operation...');
      
      // Save to schedule_preview table using batch operation
      await saveWeekToDatabase(weekData, clientId);
      
      // Clear timeout since operation completed
      clearTimeout(timeoutId);
      
      console.log('[WeekExerciseModal] Batch save completed successfully');
      console.log('[WeekExerciseModal] Notifying parent component with onSave...');
      
      // Notify parent component
      onSave(weekData);
      
      console.log('[WeekExerciseModal] Parent notified, closing modal...');
      
      // Close modal
      onClose();
      
    } catch (error) {
      // Clear timeout since operation failed
      clearTimeout(timeoutId);
      
      console.error('[WeekExerciseModal] Error saving week data:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save changes: ${errorMessage}\n\nPlease try again.`);
      
      // Don't close modal on error - let user retry
      console.log('[WeekExerciseModal] Save failed, keeping modal open for retry');
      
    } finally {
      // Always reset saving state, even on error
      console.log('[WeekExerciseModal] Resetting saving state');
      setIsSaving(false);
    }
  };

  // Save week data to schedule_preview table using batch operations
  const saveWeekToDatabase = async (weekData: WeekDay[], clientId: number) => {
    console.log('[WeekExerciseModal] Starting batch save operation for week data:', {
      weekDataLength: weekData.length,
      clientId
    });
    
    const workout_id = uuidv4();
    
    try {
      // First, get all existing entries for this week in one query
      const weekDates = weekData.map(day => day.date);
      const { data: existingEntries, error: fetchError } = await supabase
        .from('schedule_preview')
        .select('id, for_date')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .in('for_date', weekDates);
      
      if (fetchError) {
        console.error('[WeekExerciseModal] Error fetching existing entries:', fetchError);
        throw new Error(`Failed to fetch existing data: ${fetchError.message}`);
      }
      
      console.log('[WeekExerciseModal] Found existing entries:', existingEntries?.length || 0);
      
      // Create a map of existing entries by date
      const existingByDate = new Map();
      existingEntries?.forEach(entry => {
        existingByDate.set(entry.for_date, entry.id);
      });
      
      // Prepare batch operations
      const updates = [];
      const inserts = [];
      
      for (const day of weekData) {
        const workoutData = {
          client_id: clientId,
          type: 'workout',
          task: 'workout',
          icon: 'dumbell',
          summary: day.focus || 'Workout',
          for_date: day.date,
          for_time: '16:00:00', // Default time
          workout_id: workout_id,
          details_json: {
            focus: day.focus || 'Workout',
            exercises: (day.exercises || []).map((ex, idx) => ({
              exercise: String(ex.exercise || ''),
              category: String(ex.category || ''),
              body_part: String(ex.body_part || ''),
              sets: String(ex.sets || ''),
              reps: String(ex.reps || ''),
              duration: String(ex.duration || ''),
              weight: String(ex.weight || ''),
              equipment: String(ex.equipment || ''),
              video_link: String(ex.video_link || ''),
              video_thumbnail: String(ex.video_thumbnail || ''),
              rest: String(ex.rest || ''),
              coach_tip: String(ex.coach_tip || ''),
              other_details: String(ex.other_details || ''),
              order: idx + 1
            }))
          },
          is_approved: false
        };
        
        const existingId = existingByDate.get(day.date);
        if (existingId) {
          // Add to updates batch
          updates.push({ id: existingId, ...workoutData });
        } else {
          // Add to inserts batch
          inserts.push(workoutData);
        }
      }
      
      console.log('[WeekExerciseModal] Batch operations prepared:', {
        updates: updates.length,
        inserts: inserts.length
      });
      
      // Execute batch operations
      const promises = [];
      
      // Batch update existing entries
      if (updates.length > 0) {
        console.log('[WeekExerciseModal] Executing batch updates...');
        const updatePromises = updates.map(update => 
          supabase
            .from('schedule_preview')
            .update(update)
            .eq('id', update.id)
        );
        promises.push(...updatePromises);
      }
      
      // Batch insert new entries
      if (inserts.length > 0) {
        console.log('[WeekExerciseModal] Executing batch inserts...');
        const insertPromise = supabase
          .from('schedule_preview')
          .insert(inserts);
        promises.push(insertPromise);
      }
      
      // Wait for all operations to complete
      console.log('[WeekExerciseModal] Waiting for all batch operations to complete...');
      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('[WeekExerciseModal] Batch operation errors:', errors);
        throw new Error(`Failed to save week data: ${errors.map(e => e.error?.message || 'Unknown error').join(', ')}`);
      }
      
      console.log('[WeekExerciseModal] Batch save operation completed successfully');
      
    } catch (error) {
      console.error('[WeekExerciseModal] Batch save operation failed:', error);
      throw error;
    }
  };

  // Cancel editing with unsaved changes warning
  const cancelEdit = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.'
      );
      if (!confirmed) {
        return; // User cancelled, don't close
      }
    }
    setWeekData(originalWeekData);
    onClose();
  };

  // Handle modal close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving? Your changes will be lost.'
      );
      if (!confirmed) {
        return; // User cancelled, don't close
      }
    }
    onClose();
  };

  // Get day name and date based on the day's for_date from data (local TZ, no alignment)
  const getDayInfo = (dateStr: string) => {
    // Ensure local-midnight interpretation to avoid UTC off-by-one issues
    const local = new Date(`${dateStr}T00:00:00`);
    return {
      name: format(local, 'EEEE'),
      date: format(local, 'MMM d'),
      fullDate: format(local, 'yyyy-MM-dd')
    };
  };

  // Get alternating row colors for days
  const getDayRowColor = (dayIndex: number) => {
    return dayIndex % 2 === 0 
      ? 'bg-blue-50 dark:bg-blue-900/20' 
      : 'bg-green-50 dark:bg-green-900/20';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-[80vw] max-h-[90vh] overflow-hidden">
          <CardHeader className="space-y-4 pb-4">
            {/* Date Filter + Actions Row */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* Left: Date Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="start-date" className="text-sm font-medium whitespace-nowrap">
                    From:
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateFilterStart}
                    onChange={(e) => setDateFilterStart(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-date" className="text-sm font-medium whitespace-nowrap">
                    To:
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateFilterEnd}
                    onChange={(e) => setDateFilterEnd(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button
                  onClick={handleDateFilterChange}
                  disabled={!dateFilterStart || !dateFilterEnd || isLoadingData}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {isLoadingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    'Load Data'
                  )}
                </Button>
                {weekData.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {weekData.length} days
                  </div>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo || isSaving}
                  className="flex items-center gap-1"
                  title={canUndo ? `Undo: ${getLastOperationDescription()}` : 'No changes to undo'}
                >
                  <Undo className="h-4 w-4" />
                  Undo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    console.log('[WeekExerciseModal] Top Save button clicked!', {
                      isSaving,
                      hasUnsavedChanges,
                      weekDataLength: weekData.length
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            {/* Title and Stats */}
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Weekly Workout Plan
                  {dateFilterStart && dateFilterEnd && (
                    <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
                      - {format(parseISO(dateFilterStart), 'MMM d')} to {format(parseISO(dateFilterEnd), 'MMM d, yyyy')}
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-sm text-orange-600 font-normal">
                      (Unsaved changes)
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {weekData.reduce((total, day) => total + day.exercises.length, 0)} total exercises across {weekData.length} days
                </p>
              </div>
              <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading workout data...</p>
                </div>
              </div>
            ) : weekData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">No workout data found for the selected date range.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Please select a date range and click "Load Data" to fetch workout data.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Weekly Exercises Table */}
                <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-24 min-w-24">Day</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-[35%] min-w-[200px]">Exercise</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-20 min-w-20">Duration (min)</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-18 min-w-18">Sets</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-18 min-w-18">Reps</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-20 min-w-20">Weight (lbs)</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-[15%] min-w-[120px]">Equipment</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-12 min-w-12">Video</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-20 min-w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((day, dayIndex) => {
                    const dayInfo = getDayInfo(day.date);
                    const dayRowColor = getDayRowColor(dayIndex);
                    
                    if (day.exercises.length === 0) {
                      // Show empty day row
                      return (
                        <tr key={dayIndex} className={`${dayRowColor} hover:bg-opacity-80`}>
                          <td className="border border-gray-200 dark:border-gray-700 px-4 py-4 text-center font-medium" rowSpan={1}>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold">{dayInfo.name}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{dayInfo.date}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{day.focus}</span>
                            </div>
                          </td>
                          <td className="border border-gray-200 dark:border-gray-700 px-4 py-4 text-center text-gray-500" colSpan={7}>
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-sm">No exercises</span>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDayForExercise(dayIndex);
                                    setExercisePickerOpen(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Pick
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addExercise(dayIndex)}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return day.exercises.map((exercise, exerciseIndex) => (
                      <tr key={`${dayIndex}-${exerciseIndex}`} className={`${dayRowColor} hover:bg-opacity-80`}>
                        {/* Day Column - only show for first exercise of each day */}
                        {exerciseIndex === 0 && (
                          <td className="border border-gray-200 dark:border-gray-700 px-4 py-4 text-center font-medium" rowSpan={day.exercises.length}>
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold">{dayInfo.name}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{dayInfo.date}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">{day.focus}</span>
                            </div>
                          </td>
                        )}

                        {/* Exercise Name */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.exercise}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'exercise', value)}
                            placeholder="Exercise name"
                            className="w-full min-w-0"
                            showTooltip={true}
                            maxLength={40}
                            showButtons={true}
                          />
                        </td>

                        {/* Duration */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.duration}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'duration', value)}
                            placeholder="Duration"
                            className="w-full min-w-0"
                            showButtons={false}
                          />
                        </td>

                        {/* Sets */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.sets}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'sets', parseInt(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                            showButtons={false}
                          />
                        </td>

                        {/* Reps */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.reps}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'reps', parseInt(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                            showButtons={false}
                          />
                        </td>

                        {/* Weight */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.weight}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'weight', parseFloat(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                            showButtons={false}
                          />
                        </td>

                        {/* Equipment */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <EditableCell
                            value={exercise.equipment}
                            onSave={(value) => updateExercise(dayIndex, exerciseIndex, 'equipment', value)}
                            placeholder="Equipment"
                            className="w-full min-w-0"
                            showTooltip={true}
                            maxLength={25}
                            showButtons={true}
                          />
                        </td>

                        {/* Video */}
                        <td className="border border-gray-200 dark:border-gray-700 px-2 py-3">
                          {exercise.video_link || exercise.video_thumbnail ? (
                            <div className="flex items-center justify-center">
                              <VideoThumbnail
                                videoUrl={exercise.video_link || exercise.video_thumbnail || ''}
                                exerciseName={exercise.exercise}
                                onClick={() => openVideoModal(exercise.video_link || exercise.video_thumbnail || '', exercise.exercise)}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => {
                                  const newVideoLink = prompt('Enter video URL:');
                                  if (newVideoLink && newVideoLink.trim()) {
                                    updateExercise(dayIndex, exerciseIndex, 'video_link', newVideoLink.trim());
                                  }
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded hover:bg-gray-100"
                                title="Add video link"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="border border-gray-200 dark:border-gray-700 px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteExercise(dayIndex, exerciseIndex)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedDayForExercise(dayIndex);
                                setExercisePickerOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="Pick from Library"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addExercise(dayIndex)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Add Empty Exercise"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  onClick={handleUndo}
                  disabled={!canUndo || isSaving}
                  className="flex items-center gap-2"
                  title={canUndo ? `Undo: ${getLastOperationDescription()}` : 'No changes to undo'}
                >
                  <Undo className="h-4 w-4" />
                  Undo
                </Button>
                <Button 
                  variant="outline" 
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={(e) => {
                    console.log('[WeekExerciseModal] Save button clicked!', {
                      isSaving,
                      hasUnsavedChanges,
                      weekDataLength: weekData.length
                    });
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Video Modal */}
      <VideoModal
        open={videoModalOpen}
        onClose={closeVideoModal}
        videoUrl={selectedVideoUrl}
        exerciseName={selectedExerciseName}
      />

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        open={exercisePickerOpen}
        onClose={() => {
          setExercisePickerOpen(false);
          setSelectedDayForExercise(null);
        }}
        onSelect={handleExerciseSelect}
      />

      {/* Add Exercise Modal */}
      <AddExerciseModal
        open={addExerciseOpen}
        onClose={() => {
          setAddExerciseOpen(false);
          setSelectedDayForExercise(null);
        }}
        onSuccess={handleAddExerciseSuccess}
      />
    </>
  );
}
