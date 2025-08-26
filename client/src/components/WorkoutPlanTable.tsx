import React, { useState, useEffect, useMemo } from 'react';
import { format, addWeeks } from 'date-fns';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

import ExercisePickerModal from './ExercisePickerModal';
import VideoPlayer from './VideoPlayer';

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
  if (cat.includes('cardio')) return <HeartPulse className="h-5 w-5 text-red-500" />;
  if (cat.includes('strength')) return <Dumbbell className="h-5 w-5 text-green-600" />;
  if (cat.includes('core')) return <PersonStanding className="h-5 w-5 text-orange-500" />;
  if (cat.includes('hiit')) return <Zap className="h-5 w-5 text-yellow-500" />;
  if (cat.includes('cool') || cat.includes('stretch')) return <Snowflake className="h-5 w-5 text-cyan-500" />;
  return <Dumbbell className="h-5 w-5 text-gray-400" />;
};

// Helper to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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
  value: string | number;
  onSave: (newValue: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
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
      <span className="truncate">{value || placeholder}</span>
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
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
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
                title="YouTube video player"
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
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1 text-gray-500"
      onClick={() => setIsEditing(true)}
    >
      <span>Add video</span>
      <Edit3 className="h-3 w-3" />
    </div>
  );
};

export const WorkoutPlanTable = ({ week, clientId, onPlanChange, planStartDate, clientName, onImportSuccess, isTemplateMode = false, hideDates = false, viewMode = 'weekly' }: WorkoutPlanTableProps) => {
  // Debug logging
  console.log('[WorkoutPlanTable] Rendering with week data:', week);
  
  // State for delete confirmation
  const [deleteDayIdx, setDeleteDayIdx] = useState<number | null>(null);

  // State for exercise picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState<number | null>(null);
  const [pickerDateStr, setPickerDateStr] = useState<string | null>(null);

  // Local copy of the week for editing
  const [editableWeek, setEditableWeek] = useState(week);

  useEffect(() => {
    // Keep local state in sync with parent prop
    setEditableWeek(week);
  }, [week]);

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
    console.log(`[WorkoutPlanTable] handlePlanChange triggered. Day: ${dayIdx}, Ex: ${exIdx}, Field: ${field}, Value:`, value);
    
    const updatedWeek = [...normalizedWeek];
    const newExercises = [...updatedWeek[dayIdx].exercises];
    newExercises[exIdx] = { ...newExercises[exIdx], [field]: value };
    updatedWeek[dayIdx] = { ...updatedWeek[dayIdx], exercises: newExercises };
    
    console.log('[WorkoutPlanTable] Setting editableWeek to:', updatedWeek);
    setEditableWeek(updatedWeek); // Update local state immediately for responsiveness
    onPlanChange(updatedWeek); // Pass the entire updated plan to the parent
    console.log('[WorkoutPlanTable] Called onPlanChange with updated week:', updatedWeek);
  };

  const { toast } = useToast();

  // Delete all exercises for a day and remove the row from schedule_preview
  const handleDeleteDay = async (dayIdx: number) => {
    if (!window.confirm('Are you sure you want to delete all workouts for this day?')) return;
    const day = editableWeek[dayIdx];
    try {
      if (!isTemplateMode) {
        // Delete the row from schedule_preview for this client and date
        console.log(`[Delete Day] Deleting row for clientId ${clientId}, date ${day.date}`);
        const { error } = await supabase
          .from('schedule_preview')
          .delete()
          .eq('client_id', clientId)
          .eq('for_date', day.date)
          .eq('type', 'workout');
        if (error) {
          console.error('[Delete Day] Error deleting row:', error);
          toast({ title: 'Delete Failed', description: 'Could not delete the day from the database.', variant: 'destructive' });
          return;
        }
      }
      // Remove the day from local state
      const updatedWeek = editableWeek.map((d, idx) => idx === dayIdx ? { ...d, exercises: [] } : d);
      setEditableWeek(updatedWeek);
      onPlanChange(updatedWeek);
      toast({ title: 'Day Deleted', description: 'The day has been removed from the plan.' });
      console.log('[Delete Day] Successfully deleted row and updated UI.');
    } catch (err) {
      console.error('[Delete Day] Unexpected error:', err);
      toast({ title: 'Delete Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  // Always render the appropriate number of days, filling missing days as null
  // Use useMemo to recalculate when editableWeek changes
  const fullWeek = useMemo(() => {
    console.log('[WorkoutPlanTable] Recalculating fullWeek with editableWeek:', editableWeek);
    const result = getFullWeek(planStartDate, editableWeek, viewMode);
    console.log('[WorkoutPlanTable] fullWeek result:', result);
    return result;
  }, [planStartDate, editableWeek, viewMode]);

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
          .update({ details_json: { ...details, exercises }, summary: row.summary || summaryFallback })
          .eq('id', row.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('schedule_preview').insert({
          client_id: clientId,
          type: 'workout',
          for_date: dateStr,
          details_json: { exercises },
          summary: summaryFallback,
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
      sets: '',
      reps: '',
      duration: '',
      weight: '',
      equipment: selected.equipment || '',
      coach_tip: '',
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

    // Persist to schedule_preview
    const exercisesForDate = (existingDay ? existingDay.exercises : [newExercise]);
    await persistExercisesForDate(targetDate, exercisesForDate, existingDay?.focus || 'Workout');

    setIsPickerOpen(false);
    setPickerDayIdx(null);
    setPickerDateStr(null);
  };

  const handleDeleteExercise = async (dayIdx: number, exIdx: number) => {
    const day = editableWeek[dayIdx];
    const newExercises = [...(day.exercises || [])];
    newExercises.splice(exIdx, 1);
    const updatedWeek = [...editableWeek];
    updatedWeek[dayIdx] = { ...day, exercises: newExercises };
    setEditableWeek(updatedWeek);
    onPlanChange(updatedWeek);
    await persistExercisesForDate(day.date, newExercises, day.focus || 'Workout');
  };

  const renderDay = (day: any, dayIdx: number, weekIdx: number) => {
    // Calculate the global day index across all weeks
    const globalDayIdx = weekIdx * 7 + dayIdx;
    const currentDate = new Date(planStartDate.getTime() + globalDayIdx * 24 * 60 * 60 * 1000);
        const dateStr = currentDate.toISOString().slice(0, 10);
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-12">Icon</TableHead>
                    <TableHead className="w-32">Exercise</TableHead>
                    <TableHead className="w-20">Category</TableHead>
                    <TableHead className="w-20">Body Part</TableHead>
                    <TableHead className="w-16">Sets</TableHead>
                    <TableHead className="w-16">Reps</TableHead>
                    <TableHead className="w-16">Rest</TableHead>
                    <TableHead className="w-20">Weight</TableHead>
                    <TableHead className="w-16">Duration</TableHead>
                                         <TableHead className="w-20">Equipment</TableHead>
                     <TableHead className="w-24">Video</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {day.exercises.map((ex: any, exIdx: number) => (
                    <TableRow key={exIdx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                      <TableCell className="font-medium text-gray-600 dark:text-gray-400">{exIdx + 1}</TableCell>
                      <TableCell>{getExerciseIcon(ex)}</TableCell>
                      <TableCell>
                        <EditableCell
                          value={ex.exercise}
                          onSave={(newValue) => handlePlanChange(globalDayIdx, exIdx, 'exercise', newValue)}
                          placeholder="Exercise name"
                          className="font-medium text-gray-900 dark:text-white"
                        />
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
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExercise(globalDayIdx, exIdx)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
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
      {/* Professional Header with Legend */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full border">
                <Bed className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Rest Day</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full border">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-700 dark:text-gray-300">Plan Not Generated</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-gray-800 rounded-full border">
                <Dumbbell className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Workout Day</span>
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              💡 Click any cell to edit inline • Press Enter to save • Press Escape to cancel
            </div>
          </div>
        </CardContent>
      </Card>

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
                        {(() => {
                          const approvedDays = weekDays.filter(day => day && day.exercises && day.exercises.length > 0 && day.is_approved).length;
                          const totalWorkoutDays = workoutDaysCount;
                          
                          if (totalWorkoutDays === 0) {
                            return (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <ClockIcon className="h-3 w-3" />
                                <span>No workouts</span>
                                </div>
                            );
                          } else if (approvedDays === totalWorkoutDays) {
                            return (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span>Approved</span>
                              </div>
                            );
                          } else if (approvedDays > 0) {
                            return (
                              <div className="flex items-center gap-1 text-xs text-yellow-600">
                                <ClockIcon className="h-3 w-3" />
                                <span>Partial ({approvedDays}/{totalWorkoutDays})</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <ClockIcon className="h-3 w-3" />
                                <span>Pending</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
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
                    {/* Approval Status Indicator */}
                    {(() => {
                      const approvedDays = weekDays.filter(day => day && day.exercises && day.exercises.length > 0 && day.is_approved).length;
                      const totalWorkoutDays = weekDays.filter(day => day && day.exercises && day.exercises.length > 0).length;
                      
                      if (totalWorkoutDays === 0) {
                        return (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <ClockIcon className="h-3 w-3" />
                            <span>No workouts</span>
                          </div>
                        );
                      } else if (approvedDays === totalWorkoutDays) {
                        return (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Approved</span>
                          </div>
                        );
                      } else if (approvedDays > 0) {
                        return (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <ClockIcon className="h-3 w-3" />
                            <span>Partial ({approvedDays}/{totalWorkoutDays})</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>Pending</span>
                          </div>
                        );
                      }
                    })()}
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