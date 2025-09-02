import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addWeeks, startOfDay } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Save, GripVertical, Dumbbell, HeartPulse, Footprints, PersonStanding, Snowflake, Weight, Zap, BedDouble, Link2, AlertTriangle, Bed, ChevronDown, ChevronUp, Calendar, Clock, Target, Play, Edit3, X, Check, CheckCircle, Clock as ClockIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { checkWeeklyWorkoutStatus, checkMonthlyWorkoutStatus, getStatusDisplay } from '@/utils/workoutStatusUtils';

import ExercisePickerModal from './ExercisePickerModal';
import VideoPlayer from './VideoPlayer';

// Week-level approval status for monthly view (exact replica from WeeklyPlanHeader)
interface WeekApprovalStatus {
  weekNumber: number;
  status: 'approved' | 'draft' | 'no_plan' | 'partial_approved';
  startDate: Date;
  endDate: Date;
  canApprove: boolean;
}

// Define the type for a single exercise item
export interface Exercise {
  id: string; // Use a unique ID for each exercise for drag-and-drop and state management
  icon?: string;
  exercise: string;
  category: string;
  body_part: string;
  sets: number | string;
  reps: number | string;
  time: string;
  weight: number | string;
  equipment: string;
  date: string;
  rest?: number | string; // Rest in seconds between sets
  other_details?: string;
  coach_tip?: string;
  details_json?: any;
  workout_id?: string; // Add this line for UUID support
  video_link?: string; // YouTube video link
  video_thumbnail?: string; // Video thumbnail URL
}

interface WorkoutPlanTableProps {
  week: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>;
  clientId: number;
  onPlanChange: (updatedWeek: any[]) => void; // Callback to notify parent of changes
  planStartDate: Date;
  clientName?: string;
  onImportSuccess?: (weekData: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>, dateRange: { start: string; end: string }) => void;
  // New flags for template mode (read/write local only, no DB persistence)
  isTemplateMode?: boolean;
  hideDates?: boolean;
  viewMode?: 'weekly' | 'monthly';
  // Exact replica props from WeeklyPlanHeader
  weekStatuses?: WeekApprovalStatus[]; // Week-level approval statuses
  onApproveWeek?: (weekIndex: number) => void; // Callback for individual week approval
  onDirtyDatesChange?: (dirtyDates: Set<string>) => void; // Callback for dirty dates changes
  dirtyDates?: Set<string>; // Parent's dirty dates to sync with
}

// Helper to get a focus icon
const getFocusIcon = (focus: string) => {
  const f = focus.toLowerCase();
  if (f.includes('rest')) return <BedDouble className="h-6 w-6 text-blue-400" />;
  if (f.includes('cardio')) return <HeartPulse className="h-6 w-6 text-red-500" />;
  if (f.includes('strength') || f.includes('upper') || f.includes('lower') || f.includes('body')) return <Dumbbell className="h-6 w-6 text-green-600" />;
  if (f.includes('core')) return <PersonStanding className="h-6 w-6 text-orange-500" />;
  if (f.includes('hiit')) return <Zap className="h-6 w-6 text-yellow-500" />;
  if (f.includes('cool') || f.includes('stretch')) return <Snowflake className="h-6 w-6 text-cyan-500" />;
  return <Dumbbell className="h-6 w-6 text-gray-400" />;
};

// Helper to get an exercise icon (optional, fallback to focus icon)
const getExerciseIcon = (ex: any) => {
  const cat = (ex.category || '').toLowerCase();
  if (cat.includes('cardio')) return <HeartPulse className="h-4 w-4 text-red-500" />;
  if (cat.includes('strength')) return <Dumbbell className="h-4 w-4 text-green-600" />;
  if (cat.includes('core')) return <PersonStanding className="h-4 w-4 text-orange-500" />;
  if (cat.includes('hiit')) return <Zap className="h-4 w-4 text-yellow-500" />;
  if (cat.includes('cool') || cat.includes('stretch')) return <Snowflake className="h-4 w-4 text-cyan-500" />;
  return <Dumbbell className="h-4 w-4 text-gray-400" />;
};

// Helper to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to calculate week status consistently with WeeklyPlanHeader
const calculateWeekStatus = async (weekDays: any[], weekStartDate: Date, clientId: number) => {
  try {
    // Use the same unified status calculation as WeeklyPlanHeader
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const result = await checkWeeklyWorkoutStatus(supabase, clientId, weekStartDate);
    
    // Filter data for this specific week
    const weekPreviewData = result.previewData.filter(day =>
      day.for_date >= format(weekStartDate, 'yyyy-MM-dd') &&
      day.for_date <= format(weekEndDate, 'yyyy-MM-dd')
    );
    
    const weekScheduleData = result.scheduleData.filter(day =>
      day.for_date >= format(weekStartDate, 'yyyy-MM-dd') &&
      day.for_date <= format(weekEndDate, 'yyyy-MM-dd')
    );
    
    // Calculate status based on unified logic
    const hasPreviewData = weekPreviewData.length > 0;
    const hasScheduleData = weekScheduleData.length > 0;
    
    if (!hasPreviewData && !hasScheduleData) {
      return { status: 'no_plan', approvedDays: 0, totalDays: 0 };
    } else if (hasPreviewData && hasScheduleData) {
      // Use the new is_approved system: check if all days in this week are approved
      const approvedDaysInWeek = weekPreviewData.filter(day => day.is_approved === true).length;
      const totalDaysInWeek = weekPreviewData.length;
      
      if (totalDaysInWeek > 0 && approvedDaysInWeek === totalDaysInWeek) {
        return { status: 'approved', approvedDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length, totalDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length };
      } else {
        return { status: 'draft', approvedDays: 0, totalDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length };
      }
    } else if (hasPreviewData) {
      return { status: 'draft', approvedDays: 0, totalDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length };
    } else {
      return { status: 'approved', approvedDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length, totalDays: weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length };
    }
  } catch (error) {
    console.error('Error calculating week status:', error);
    // Fallback to old logic
    const approvedDays = weekDays.filter(day => day && day.exercises && day.exercises.length > 0 && day.is_approved).length;
    const totalDays = weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length;
    return { status: 'pending', approvedDays, totalDays };
  }
};

// Component for displaying week status (exact replica from WeeklyPlanHeader)
const WeekStatusDisplay = ({ weekDays, weekStartDate, clientId, weekIndex, weekStatuses, onApproveWeek }: { 
  weekDays: any[]; 
  weekStartDate: Date; 
  clientId: number; 
  weekIndex: number;
  weekStatuses?: WeekApprovalStatus[];
  onApproveWeek?: (weekIndex: number) => void;
}) => {
  // Week approval state (exact replica from WeeklyPlanHeader)
  const [approvingWeek, setApprovingWeek] = useState<number | null>(null);

  if (!weekStatuses || !weekStatuses[weekIndex]) {
    // Show a default status when weekStatuses is not provided
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span className="h-2 w-2 rounded-full bg-gray-400"></span>
        <span>Pending</span>
      </div>
    );
  }

  const { status } = weekStatuses[weekIndex];
  
  if (status === 'approved') {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" />
        <span>Approved</span>
      </div>
    );
  }

  const label = status === 'draft' ? 'Plan Not Approved' : 'Plan Not Created';

  return (
    <div className="flex items-center gap-1 text-xs text-red-600">
      {/* Flashing red dot (exact replica from WeeklyPlanHeader) */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
      </span>
      <span>{label}</span>
    </div>
  );
};

// Helper to get YouTube thumbnail URL
const getYouTubeThumbnail = (videoId: string) => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

// Helper to get a full array for the week/month, filling missing days as null
function getFullWeek(startDate: Date, week: any[], viewMode: 'weekly' | 'monthly') {
  const days = [];
  const totalDays = viewMode === 'monthly' ? 28 : 7;
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = format(date, 'yyyy-MM-dd');
    const day = week.find((d) => d && d.date === dateStr);
    days.push(day || null);
  }
  return days;
}

// Helper to organize days into weeks
function organizeIntoWeeks(days: any[], viewMode: 'weekly' | 'monthly') {
  if (viewMode === 'weekly') {
    return [days]; // Single week
  }
  
  // For monthly view, organize into 4 weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

// Inline Editable Cell Component
const EditableCell = ({ 
  value, 
  onSave, 
  type = 'text',
  placeholder = '',
  className = ''
}: {
  value: string | number | undefined | null;
  onSave: (newValue: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
      return (
      <div className="flex items-center gap-1">
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className={`h-8 text-sm ${className}`}
          placeholder={placeholder}
        />
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

    return (
    <div 
      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className="truncate">{value?.toString() || placeholder}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

// Video Cell Component
const VideoCell = ({ 
  videoLink, 
  onVideoChange 
}: { 
  videoLink?: string;
  onVideoChange: (newLink: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(videoLink || '');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const videoId = getYouTubeVideoId(videoLink || '');

  const handleSave = () => {
    onVideoChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(videoLink || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
  return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="h-8 text-sm"
          placeholder="Paste YouTube URL"
        />
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  if (videoId) {
    return (
      <>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer" onClick={() => setIsVideoModalOpen(true)}>
            <img
              src={getYouTubeThumbnail(videoId)}
              alt="Video thumbnail"
              className="w-16 h-12 object-cover rounded border"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Video Modal */}
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Watch Video</DialogTitle>
            </DialogHeader>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                /* title="YouTube video player" */
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 text-gray-500"
      onClick={() => setIsEditing(true)}
    >
      <span>Add video</span>
    </div>
  );
};

export const WorkoutPlanTable = ({ week, clientId, onPlanChange, planStartDate, clientName, onImportSuccess, isTemplateMode = false, hideDates = false, viewMode = 'weekly', weekStatuses, onApproveWeek, onDirtyDatesChange, dirtyDates: dirtyDatesProp }: WorkoutPlanTableProps) => {
  
  // State for delete confirmation
  const [deleteDayIdx, setDeleteDayIdx] = useState<number | null>(null);

  // Week approval state (exact replica from WeeklyPlanHeader)
  const [approvingWeek, setApprovingWeek] = useState<number | null>(null);

  // Approval status state (exact replica from WeeklyPlanHeader)
  const [monthlyStatus, setMonthlyStatus] = useState<any>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<any>(null);
  const [localWeekStatuses, setLocalWeekStatuses] = useState<WeekApprovalStatus[]>([]);

  // State for exercise picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null);
  const [pickerDateStr, setPickerDateStr] = useState<string | null>(null);

  // Local copy of the week for editing
  const [editableWeek, setEditableWeek] = useState(week);
  
  // Force refresh state removed - no longer needed with explicit save model

  // Normalize the planStartDate to local start-of-day to avoid UTC offset issues
  const baseStartDate = useMemo(() => startOfDay(planStartDate), [planStartDate]);

  // Local dirty tracking: set of dates with unsaved changes
  const [localDirtyDates, setLocalDirtyDates] = useState<Set<string>>(new Set());

  const markDateDirty = useCallback((dateStr: string) => {
    // Update local state immediately for instant UI feedback
    setLocalDirtyDates(prev => new Set(prev).add(dateStr));
    
    // Notify parent asynchronously to avoid blocking UI updates
    if (onDirtyDatesChange) {
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        const mergedDirtyDates = new Set([...Array.from(dirtyDatesProp || []), dateStr]);
        onDirtyDatesChange(mergedDirtyDates);
      }, 0);
    }
  }, [onDirtyDatesChange, dirtyDatesProp]);

  const clearDirtyDates = () => {
    setLocalDirtyDates(new Set());
    // Notify parent that all dirty dates are cleared
    if (onDirtyDatesChange) {
      onDirtyDatesChange(new Set());
    }
  };

  // Use local dirty dates for immediate UI feedback, merge with parent for consistency
  const dirtyDates = new Set([...Array.from(localDirtyDates), ...Array.from(dirtyDatesProp || [])]);

  // Derived states for dirty tracking - use merged dirty dates for accurate count
  const hasUnsavedChanges = dirtyDates.size > 0;
  const unsavedChangesCount = dirtyDates.size;

  // Sync local dirty dates with parent's dirty dates
  useEffect(() => {
    if (dirtyDatesProp) {
      // Only update if parent has new dirty dates that we don't have locally
      const newDirtyDates = Array.from(dirtyDatesProp).filter(date => !localDirtyDates.has(date));
      if (newDirtyDates.length > 0) {
        setLocalDirtyDates(prev => new Set([...Array.from(prev), ...newDirtyDates]));
      }
    }
  }, [dirtyDatesProp]);

  // Note: onDirtyDatesChange is now called directly in markDateDirty for immediate notification

  useEffect(() => {
    // Keep local state in sync with parent prop
    setEditableWeek(week);
    // Force refresh removed - no longer needed with explicit save model
  }, [week]);

  // Fetch approval status when component mounts or when relevant props change
  useEffect(() => {
    if (clientId && planStartDate) {
      fetchApprovalStatus();
    }
  }, [clientId, planStartDate, viewMode]);

  // Function to fetch approval status (exact replica from WeeklyPlanHeader)
  const fetchApprovalStatus = async () => {
    if (!clientId) return;
    
    try {
      if (viewMode === 'monthly') {
        const monthlyResult = await checkMonthlyWorkoutStatus(supabase, clientId, baseStartDate);
        setMonthlyStatus(monthlyResult);
        
        if (monthlyResult.weeklyBreakdown) {
          const weekStatuses = monthlyResult.weeklyBreakdown.map((weekData, weekIndex) => ({
            weekNumber: weekIndex,
            status: weekData.status,
            startDate: weekData.startDate,
            endDate: weekData.endDate,
            canApprove: (weekData.status === 'draft' || weekData.status === 'partial_approved') && weekData.previewData?.some(d => d.is_approved === false)
          }));
          setLocalWeekStatuses(weekStatuses);
        }
      } else {
        const weeklyResult = await checkWeeklyWorkoutStatus(supabase, clientId, baseStartDate);
        setWeeklyStatus(weeklyResult);
        
        // Create a single week status for weekly view
        const weekStatus = {
          weekNumber: 0,
          status: weeklyResult.status,
          startDate: baseStartDate,
          endDate: new Date(baseStartDate.getTime() + 6 * 24 * 60 * 60 * 1000),
          canApprove: (weeklyResult.status === 'draft' || weeklyResult.status === 'partial_approved') && weeklyResult.previewData?.some(d => d.is_approved === false)
        };
        setLocalWeekStatuses([weekStatus]);
      }
    } catch (error) {
      console.error('Error fetching approval status:', error);
    }
  };

  // Function to refresh approval status removed - no longer needed with explicit save model

  // --- Normalization function ---
  function normalizeExercise(ex: any): any {
    return {
      ...ex,
      exercise: ex.exercise || ex.exercise_name || ex.name || '',
      category: ex.category || '',
      body_part: ex.body_part || ex.bodyPart || '',
      sets: ex.sets !== undefined && ex.sets !== null ? String(ex.sets) : '',
      reps: ex.reps ?? '',
      duration: ex.duration ?? ex.time ?? '',
      weight: ex.weight ?? ex.weights ?? '',
      equipment: ex.equipment ?? '',
      coach_tip: ex.coach_tip ?? ex.tips ?? '',
      rest: ex.rest ?? '',
      video_link: ex.video_link ?? ex.videoLink ?? '',
      video_thumbnail: ex.video_thumbnail ?? '',
    };
  }
  // ---

  const normalizedWeek = editableWeek.map(day => ({
    ...day,
    exercises: (day.exercises || []).map(normalizeExercise),
  }));

  const handlePlanChange = (dayIdx: number, exIdx: number, field: string, value: any) => {
    console.log(`[Plan Change] Updating day ${dayIdx}, exercise ${exIdx}, field ${field} to ${value}`);
    
    // Map the global day index to an actual date, then update by date
    const fullWeekArray = getFullWeek(baseStartDate, editableWeek, viewMode);
    const targetDay = fullWeekArray[dayIdx];
    if (!targetDay) {
      console.error(`[Plan Change] No target day found for index: ${dayIdx}`);
      return; // safety
    }

    // Find or create the target day in editableWeek by date
    const existingIndex = editableWeek.findIndex(d => d && d.date === targetDay.date);
    let updatedWeek = [...editableWeek];

    if (existingIndex === -1) {
      // Create a new day entry if missing
      updatedWeek = [
        ...updatedWeek,
        { date: targetDay.date, focus: 'Workout', exercises: [] as any[] }
      ].sort((a: any, b: any) => a.date.localeCompare(b.date));
    }

    const idx = existingIndex === -1
      ? updatedWeek.findIndex(d => d && d.date === targetDay.date)
      : existingIndex;

    const currentDay = updatedWeek[idx];
    const dayExercises = [...(currentDay.exercises || [])];
    if (!dayExercises[exIdx]) return; // only editing existing rows here

    // Update the exercise with the new value
    dayExercises[exIdx] = { ...dayExercises[exIdx], [field]: value };
    updatedWeek[idx] = { ...currentDay, exercises: dayExercises } as any;

    // Update local state immediately for UI responsiveness
    setEditableWeek(updatedWeek);
    
    // Notify parent component of the change
    onPlanChange(updatedWeek);

    // Mark date dirty; no DB writes in explicit-save mode
    markDateDirty(targetDay.date);
    // Force refresh removed - no longer needed with explicit save model
  };

  const { toast } = useToast();

  // Delete all exercises for a day and remove the row from schedule_preview
  const handleDeleteDay = async (globalDayIdx: number) => {
    if (!window.confirm('Are you sure you want to delete all workouts for this day?')) return;
    
    // Map the global day index to the actual date
    const fullWeekArray = getFullWeek(baseStartDate, editableWeek, viewMode);
    const targetDay = fullWeekArray[globalDayIdx];
    
    if (!targetDay || !targetDay.date) {
      console.error('[Delete Day] No target day found for index:', globalDayIdx);
      toast({ title: 'Delete Failed', description: 'Could not find the day to delete.', variant: 'destructive' });
      return;
    }
    
    try {
      // Find the day in editableWeek by date and clear its exercises (local-only)
      const updatedWeek = editableWeek.map(d => 
        d && d.date === targetDay.date 
          ? { ...d, exercises: [] }
          : d
      );
      
      // Update local state
      setEditableWeek(updatedWeek);
      
      // Mark date dirty; no DB writes in explicit-save mode
      markDateDirty(targetDay.date);
      // Force UI refresh removed - no longer needed with explicit save model
      
      // Notify parent component
      onPlanChange(updatedWeek);
      
      toast({ title: 'Day Deleted', description: 'The day has been removed from the plan.' });
      console.log('[Delete Day] Successfully deleted row and updated UI.');
      
      // Close the delete confirmation dialog
      setDeleteDayIdx(null);
      
    } catch (err) {
      console.error('[Delete Day] Unexpected error:', err);
      toast({ title: 'Delete Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  // Always render the appropriate number of days, filling missing days as null
  // Use useMemo to recalculate when editableWeek changes
  const fullWeek = useMemo(() => {
    return getFullWeek(baseStartDate, editableWeek, viewMode);
  }, [baseStartDate, editableWeek, viewMode]);

  // Organize days into weeks
  const weeks = useMemo(() => {
    return organizeIntoWeeks(fullWeek, viewMode);
  }, [fullWeek, viewMode]);

  // Helper: persist updated exercises array for a given date to schedule_preview
  const persistExercisesForDate = async (dateStr: string, exercises: any[], summaryFallback: string = 'Workout') => {
    try {
      if (isTemplateMode) return; // no DB writes in template mode
      const { data: existingRows, error: fetchErr } = await supabase
        .from('schedule_preview')
        .select('*')
        .eq('client_id', clientId)
        .eq('for_date', dateStr)
        .eq('type', 'workout');
      if (fetchErr) throw fetchErr;
      if (existingRows && existingRows.length > 0) {
        const row = existingRows[0];
        const details = row.details_json || {};
        const { error: updErr } = await supabase
          .from('schedule_preview')
          .update({ details_json: { ...details, exercises }, summary: row.summary || summaryFallback, is_approved: false })
          .eq('id', row.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('schedule_preview').insert({
          client_id: clientId,
          type: 'workout',
          for_date: dateStr,
          details_json: { exercises },
          summary: summaryFallback,
          is_approved: false,
        });
        if (insErr) throw insErr;
      }
    } catch (err) {
      console.error('[Persist Exercises] Failed:', err);
    }
  };

  const openPickerForDay = (dayIdx: number, dateStr: string) => {
    setPickerDayIdx(dayIdx);
    setPickerDateStr(dateStr);
    setIsPickerOpen(true);
  };

  const handleSelectExercise = async (selected: any) => {
    if (pickerDayIdx == null || !pickerDateStr) return;
    const targetDate = pickerDateStr;

    // Build normalized exercise from exercises_raw
    const newExercise = {
      exercise: selected.exercise_name,
      category: selected.category || '',
      body_part: selected.target_muscle || selected.primary_muscle || '',
      sets: '3',
      reps: '10',
      duration: '15',
      weight: 'Bodyweight',
      equipment: selected.equipment || '',
      coach_tip: 'Focus on proper form',
      rest: '60',
      video_link: selected.video_link || '',
      date: targetDate,
    } as any;

    // Update local state (ensure day exists)
    const updatedWeek = [...editableWeek];
    const existingDay = updatedWeek.find((d) => d && d.date === targetDate);
    if (existingDay) {
      existingDay.exercises = [...(existingDay.exercises || []), newExercise];
    } else {
      // If day missing, create it with default focus
      updatedWeek.push({ date: targetDate, focus: 'Workout', exercises: [newExercise] });
      // Keep array sorted by date
      updatedWeek.sort((a: any, b: any) => a.date.localeCompare(b.date));
    }
    setEditableWeek(updatedWeek);
    onPlanChange(updatedWeek);

    // Mark date dirty; no DB writes in explicit-save mode
    markDateDirty(targetDate);

    setIsPickerOpen(false);
    setPickerDayIdx(null);
    setPickerDateStr(null);
  };

  const handleDeleteExercise = async (dayIdx: number, exIdx: number) => {
    // Find the actual day in editableWeek that corresponds to the global day index
    const fullWeekArray = getFullWeek(planStartDate, editableWeek, viewMode);
    const targetDay = fullWeekArray[dayIdx];
    
    if (!targetDay) {
      console.error('[Delete Exercise] No target day found for index:', dayIdx);
      return;
    }
    
    // Find the day in editableWeek by date
    const dayInEditableWeek = editableWeek.find(d => d && d.date === targetDay.date);
    if (!dayInEditableWeek) {
      console.error('[Delete Exercise] Day not found in editableWeek for date:', targetDay.date);
      return;
    }
    
    const newExercises = [...(dayInEditableWeek.exercises || [])];
    newExercises.splice(exIdx, 1);
    
    const updatedWeek = editableWeek.map(d => 
      d && d.date === targetDay.date 
        ? { ...d, exercises: newExercises }
        : d
    );
    
    // Update local state immediately for UI responsiveness
    setEditableWeek(updatedWeek);
    
    // Notify parent component
    onPlanChange(updatedWeek);

    // Mark date dirty; no DB writes in explicit-save mode
    markDateDirty(targetDay.date);
    // Force refresh removed - no longer needed with explicit save model
  };

  const renderDay = (day: any, dayIdx: number, weekIdx: number) => {
    // Calculate the global day index across all weeks
    const globalDayIdx = weekIdx * 7 + dayIdx;
    const currentDate = new Date(baseStartDate.getTime() + globalDayIdx * 24 * 60 * 60 * 1000);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateDisplay = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (!day) {
          // Plan Not Generated
          return (
        <Card key={globalDayIdx} className="mb-4 border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{dateDisplay}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{dayName}</span>
                </div>
                  <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">Plan Not Generated</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">No workout plan exists for this day.</p>
              </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => openPickerForDay(globalDayIdx, dateStr)}>
                <PlusCircle className="h-4 w-4" />
                Add Exercise
                </Button>
              </div>
          </CardContent>
        </Card>
          );
        }

        if (day.exercises.length === 0) {
          // Rest Day
          return (
        <Card key={globalDayIdx} className="mb-4 border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Bed className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{dateDisplay}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{dayName}</span>
                </div>
                  <h4 className="text-lg font-bold text-blue-800 dark:text-blue-200">Rest Day</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Enjoy your recovery and prepare for the next workout!</p>
              </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => openPickerForDay(globalDayIdx, dateStr)}>
                <PlusCircle className="h-4 w-4" />
                Add Exercise
                </Button>
              </div>
          </CardContent>
        </Card>
          );
        }

    // Workout Day
        return (
      <Card key={globalDayIdx} className="mb-4 border-l-4 border-l-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    {getFocusIcon(day.focus)}
              </div>
                    <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{dateDisplay}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{dayName}</span>
                      </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {day.focus}
                </h3>
                      {day.timeBreakdown && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Total: {day.timeBreakdown.total} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {day.exercises.length} exercises
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => openPickerForDay(globalDayIdx, dateStr)}>
                <PlusCircle className="h-4 w-4" />
                Add Exercise
                </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setDeleteDayIdx(globalDayIdx)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Day
              </Button>
              </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Responsive Table Info Banner */}
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-medium">Responsive Table:</span> Some columns are hidden on smaller screens to ensure the table fits properly. 
              <span className="hidden sm:inline"> Category hidden on mobile, </span>
              <span className="hidden lg:inline"> Body Part & Rest hidden on small screens, </span>
              <span className="hidden xl:inline"> Weight & Duration hidden on medium screens, </span>
              <span className="hidden 2xl:inline"> Equipment & Video hidden on large screens.</span>
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="workout-plan-table-container max-w-full overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="w-3">#</TableHead>
                    <TableHead className="w-3">Icon</TableHead>
                    <TableHead className="w-10 sm:w-14">Exercise</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden sm:table-cell w-6 md:w-8' : 'w-10'}>Category</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden lg:table-cell w-6 md:w-8' : 'w-10'}>Body Part</TableHead>
                    <TableHead className="w-5 sm:w-6">Sets</TableHead>
                    <TableHead className="w-5 sm:w-6">Reps</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden lg:table-cell w-5 sm:w-6' : 'w-6'}>Rest</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden xl:table-cell w-6 md:w-8' : 'w-10'}>Weight</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden xl:table-cell w-5 sm:w-6' : 'w-6'}>Duration</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden 2xl:table-cell w-6 md:w-8' : 'w-10'}>Equipment</TableHead>
                    <TableHead className={(viewMode === 'weekly' || viewMode === 'monthly') ? 'hidden 2xl:table-cell w-8 sm:w-10' : 'w-14'}>Video</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.exercises.map((ex: any, exIdx: number) => (
                    <TableRow key={exIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <TableCell className="font-medium text-gray-600 dark:text-gray-400">{exIdx + 1}</TableCell>
                      <TableCell className="text-center">{getExerciseIcon(ex)}</TableCell>
                      <TableCell>
                        <div className="exercise-cell">
                          <EditableCell
                            value={ex.exercise}
                            onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'exercise', newValue)}
                            placeholder="Exercise name"
                            className="font-medium text-gray-900 dark:text-white flex-1 editable-cell"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteExercise(globalDayIdx, exIdx)}
                            className="delete-btn hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.category}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'category', newValue)}
                          placeholder="Category"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.body_part}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'body_part', newValue)}
                          placeholder="Body part"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.sets}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'sets', newValue)}
                          type="number"
                          placeholder="Sets"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.reps}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'reps', newValue)}
                          placeholder="Reps"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.rest || ''}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'rest', newValue)}
                          type="number"
                          placeholder="Rest"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.weight || ''}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'weight', newValue)}
                          placeholder="Weight"
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.duration || ''}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'duration', newValue)}
                          type="number"
                          placeholder="Duration"
                        />
                      </TableCell>
                      <TableCell>
                         <EditableCell
                           value={ex.equipment || ''}
                           onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'equipment', newValue)}
                           placeholder="Equipment"
                         />
                       </TableCell>
                       <TableCell>
                        <VideoCell
                          videoLink={ex.video_link}
                          onVideoChange={(newLink) => handlePlanChange(globalDayIdx, exIdx, 'video_link', newLink)}
                        />
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Save Changes Button - Only show when there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="h-4 w-4 rounded-full bg-orange-500"></span>
            </div>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              You have {unsavedChangesCount} unsaved change{unsavedChangesCount === 1 ? '' : 's'}.
            </span>
          </div>
          <Button
            onClick={async () => {
              // Save all changes to the database
              try {
                // Save all dirty dates to the database
                const savePromises = Array.from(dirtyDates).map(async (dateStr) => {
                  const dayIndex = editableWeek.findIndex(day => day && day.date === dateStr);
                  if (dayIndex !== -1 && editableWeek[dayIndex]) {
                    const day = editableWeek[dayIndex];
                    await persistExercisesForDate(dateStr, day.exercises, day.focus);
                  }
                });
                
                await Promise.all(savePromises);
                
                toast({ title: 'Changes Saved', description: 'Your changes have been saved successfully.' });
                clearDirtyDates();
                
                // Notify parent component that changes have been saved
                onPlanChange(editableWeek);
              } catch (error) {
                console.error('Save failed:', error);
                toast({ title: 'Save Failed', description: 'An error occurred while saving.', variant: 'destructive' });
              }
            }}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Weekly Status Indicator (exact replica from WeeklyPlanHeader) */}
      {viewMode === 'weekly' && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center gap-3">
            {(() => {
              // If any date within this week is dirty, show Unsaved Changes
              const weekDirty = (() => {
                const start = baseStartDate;
                for (let i = 0; i < 7; i++) {
                  const d = format(new Date(start.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                  if (dirtyDates.has(d as string)) return true;
                }
                return false;
              })();

              if (weekDirty) {
                return (
                  <span className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-300">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-600"></span>
                    </span>
                    Unsaved Changes
                  </span>
                );
              }

              if (!localWeekStatuses || localWeekStatuses.length === 0) {
                return (
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                    Loading...
                  </span>
                );
              }

              const { status } = localWeekStatuses[0];
              if (status === 'approved') {
                return (
                  <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    Approved
                  </span>
                );
              }

              const label = status === 'draft' ? 'Plan Not Approved' : 'Plan Not Created';

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
          {onApproveWeek && localWeekStatuses && localWeekStatuses[0] && localWeekStatuses[0].canApprove && (() => {
            // Disable Approve if any day in this week is dirty
            const weekDirty = (() => {
              const start = baseStartDate;
              for (let i = 0; i < 7; i++) {
                const d = format(new Date(start.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                if (dirtyDates.has(d as string)) return true;
              }
              return false;
            })();
            return !weekDirty;
          })() && (
            <Button
              onClick={async () => {
                setApprovingWeek(0);
                try {
                  await onApproveWeek(0);
                } finally {
                  setApprovingWeek(null);
                }
              }}
              disabled={approvingWeek === 0}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit"
            >
              {approvingWeek === 0 ? (
                <>
                  <Check className="h-3 w-3 mr-1 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Approve Week
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Weeks Organization */}
      {viewMode === 'monthly' ? (
        // Monthly view with accordion at week level
        <Accordion type="multiple" className="space-y-4">
          {weeks.map((weekDays, weekIdx) => {
            const weekStartDate = weekIdx === 0 ? planStartDate : addWeeks(planStartDate, weekIdx);
            const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
            const workoutDaysCount = weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length;
            
            return (
              <AccordionItem key={weekIdx} value={`week-${weekIdx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Week {weekIdx + 1}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                        </span>
                                </div>
                                </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {workoutDaysCount} workout days
                        </span>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Click to {workoutDaysCount > 0 ? 'expand' : 'view'}
                                </div>
                                </div>
                      {/* Approval Status Indicator */}
                      <div className="flex items-center gap-1">
                        <WeekStatusDisplay 
                          weekDays={weekDays} 
                          weekStartDate={weekStartDate} 
                          clientId={clientId} 
                          weekIndex={weekIdx}
                          weekStatuses={localWeekStatuses}
                          onApproveWeek={onApproveWeek}
                        />
                      </div>
                      
                      {/* Weekly Approval Button (disabled if week has dirty dates) */}
                      {onApproveWeek && localWeekStatuses && localWeekStatuses[weekIdx] && localWeekStatuses[weekIdx].canApprove && (() => {
                        const start = weekStartDate;
                        const weekDirty = (() => {
                          for (let i = 0; i < 7; i++) {
                            const d = format(new Date(start.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                            if (dirtyDates.has(d as string)) return true;
                          }
                          return false;
                        })();
                        return !weekDirty;
                      })() && (
                        <Button
                          onClick={async () => {
                            setApprovingWeek(weekIdx);
                            try {
                              await onApproveWeek(weekIdx);
                              // Refresh status after approval
                              await fetchApprovalStatus();
                            } finally {
                              setApprovingWeek(null);
                            }
                          }}
                          disabled={approvingWeek === weekIdx}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit"
                        >
                        {approvingWeek === weekIdx ? (
                          <>
                            <Check className="h-3 w-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {weekDays.map((day, dayIdx) => renderDay(day, dayIdx, weekIdx))}
                </div>
              </AccordionContent>
            </AccordionItem>
        );
      })}
        </Accordion>
      ) : (
        // Weekly view (unchanged)
        weeks.map((weekDays, weekIdx) => {
          const weekStartDate = weekIdx === 0 ? planStartDate : addWeeks(planStartDate, weekIdx);
          const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          
          return (
            <Card key={weekIdx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
              {/* Week Header */}
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Week {weekIdx + 1}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length} workout days
                    </span>
                    {/* Approval Status Indicator with Unsaved override */}
                    {(() => {
                      const weekDirty = (() => {
                        for (let i = 0; i < 7; i++) {
                          const d = format(new Date(weekStartDate.getTime() + i * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                          if (dirtyDates.has(d as string)) return true;
                        }
                        return false;
                      })();
                      if (weekDirty) {
                        return (
                          <span className="flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-300">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
                            </span>
                            Unsaved Changes
                          </span>
                        );
                      }
                      return (
                        <WeekStatusDisplay 
                          weekDays={weekDays} 
                          weekStartDate={weekStartDate} 
                          clientId={clientId} 
                          weekIndex={weekIdx}
                          weekStatuses={localWeekStatuses}
                          onApproveWeek={onApproveWeek}
                        />
                      );
                    })()}
                    
                    {/* Weekly Approval Button (exact replica from WeeklyPlanHeader) */}
                    {onApproveWeek && localWeekStatuses && localWeekStatuses[weekIdx] && localWeekStatuses[weekIdx].canApprove && (
                      <Button
                        onClick={async () => {
                          setApprovingWeek(weekIdx);
                          try {
                            await onApproveWeek(weekIdx);
                            // Refresh status after approval
                            await fetchApprovalStatus();
                          } finally {
                            setApprovingWeek(null);
                          }
                        }}
                        disabled={approvingWeek === weekIdx}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit"
                      >
                        {approvingWeek === weekIdx ? (
                          <>
                            <Check className="h-3 w-3 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Approve Week
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {/* Days in Week */}
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {weekDays.map((day, dayIdx) => renderDay(day, dayIdx, weekIdx))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDayIdx !== null && (
        <Dialog open={deleteDayIdx !== null} onOpenChange={() => setDeleteDayIdx(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Day</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this day? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDayIdx(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteDay(deleteDayIdx)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ExercisePickerModal
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectExercise}
      />
    </div>
  );
}; 