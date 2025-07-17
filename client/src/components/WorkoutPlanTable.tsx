import React, { useState, useEffect } from 'react';
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
import { Trash2, PlusCircle, Save, GripVertical, Dumbbell, HeartPulse, Footprints, PersonStanding, Snowflake, Weight, Zap, BedDouble, Link2, AlertTriangle, Bed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
}

interface WorkoutPlanTableProps {
  week: Array<{
    date: string;
    focus: string;
    exercises: any[];
  }>;
  clientId: number;
  onPlanChange: (updatedWeek: any[]) => void; // Callback to notify parent of changes
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

// A single sortable row in the table
const SortableExerciseRow = ({
  exercise,
  isEditing,
  onCellClick,
  onInputChange,
  onInputBlur,
  onDelete,
}: {
  exercise: Exercise;
  isEditing: (field: keyof Exercise) => boolean;
  onCellClick: (field: keyof Exercise) => void;
  onInputChange: (field: keyof Exercise, value: any) => void;
  onInputBlur: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderCell = (field: keyof Exercise, type: 'text' | 'number' = 'text') => {
    if (isEditing(field)) {
      return (
        <Input
          type={type}
          value={exercise[field] as string}
          onChange={(e) => onInputChange(field, e.target.value)}
          onBlur={onInputBlur}
          onKeyDown={(e) => e.key === 'Enter' && onInputBlur()}
          autoFocus
          className="h-8"
        />
      );
    }
    return (
      <div onClick={() => onCellClick(field)} className="min-h-[32px] px-3 py-1">
        {exercise[field]}
      </div>
    );
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="w-12">
        <div {...listeners} className="cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-12">{getExerciseIcon(exercise)}</TableCell>
      <TableCell>{renderCell('exercise')}</TableCell>
      <TableCell>{renderCell('category')}</TableCell>
      <TableCell>{renderCell('body_part')}</TableCell>
      <TableCell>{renderCell('sets', 'number')}</TableCell>
      <TableCell>{renderCell('reps', 'number')}</TableCell>
      <TableCell>{renderCell('time')}</TableCell>
      <TableCell>{renderCell('rest', 'number')}</TableCell> {/* New Rest column */}
      <TableCell>{renderCell('weight', 'number')}</TableCell>
      <TableCell>{renderCell('equipment')}</TableCell>
      <TableCell>{exercise.date}</TableCell>
      <TableCell>{renderCell('other_details')}</TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate max-w-[120px] inline-block align-middle cursor-pointer">
                {(exercise.coach_tip ?? '').length > 0 ? (exercise.coach_tip ?? '').slice(0, 24) + ((exercise.coach_tip ?? '').length > 24 ? '…' : '') : '—'}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="whitespace-pre-line">{exercise.coach_tip ?? 'No tip provided.'}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Helper to get a 7-day array for the week, filling missing days as null
function getFullWeek(startDate: Date, week: any[]) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    const day = week.find((d) => d && d.date === dateStr);
    days.push(day || null);
  }
  return days;
}

export const WorkoutPlanTable = ({ week, clientId, onPlanChange, planStartDate }: WorkoutPlanTableProps & { planStartDate: Date }) => {
  // Debug logging
  console.log('[WorkoutPlanTable] Rendering with week data:', week);
  
  // State for editing sets x reps
  const [editIdx, setEditIdx] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editDurationIdx, setEditDurationIdx] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [editDuration, setEditDuration] = useState('');
  const [editRestIdx, setEditRestIdx] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [editRest, setEditRest] = useState('');
  const [editWeightIdx, setEditWeightIdx] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [editWeight, setEditWeight] = useState('');
  // Accordion open panels state
  const [openPanels, setOpenPanels] = useState<string[]>([]);
  // State for delete confirmation
  const [deleteDayIdx, setDeleteDayIdx] = useState<number | null>(null);

  // Local copy of the week for editing
  const [editableWeek, setEditableWeek] = useState(week);

  useEffect(() => {
    // Keep local state in sync with parent prop
    setEditableWeek(week);
  }, [week]);

  // Expand all by default on initial load or when week changes
  useEffect(() => {
    setOpenPanels(editableWeek.map(day => day.date));
  }, [editableWeek]);

  const handleExpandAll = () => setOpenPanels(editableWeek.map(day => day.date));
  const handleCollapseAll = () => setOpenPanels([]);

  // --- Normalization function ---
  function normalizeExercise(ex: any): any {
    return {
      ...ex,
      exercise: ex.exercise || ex.exercise_name || ex.name || '',
      category: ex.category || '',
      body_part: ex.body_part || ex.bodyPart || '',
      sets: String(ex.sets ?? ''), // Always coerce sets to string
      reps: ex.reps ?? '',
      duration: ex.duration ?? ex.time ?? '',
      weight: ex.weight ?? ex.weights ?? '',
      equipment: ex.equipment ?? '',
      coach_tip: ex.coach_tip ?? ex.tips ?? '',
      rest: ex.rest ?? '',
      video_link: ex.video_link ?? ex.videoLink ?? '',
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
    
    setEditableWeek(updatedWeek); // Update local state immediately for responsiveness
    onPlanChange(updatedWeek); // Pass the entire updated plan to the parent
    console.log('[WorkoutPlanTable] Called onPlanChange with updated week:', updatedWeek);
  };

  const handleEditClick = (dayIdx: number, exIdx: number, sets: any, reps: any) => {
    setEditIdx({ dayIdx, exIdx });
    setEditSets(sets?.toString() || '');
    setEditReps(reps?.toString() || '');
  };
  const handleSaveEdit = (onChange: (sets: string, reps: string) => void) => {
    onChange(editSets, editReps);
    setEditIdx(null);
  };

  const { toast } = useToast();

  // Delete all exercises for a day and remove the row from schedule_preview
  const handleDeleteDay = async (dayIdx: number) => {
    if (!window.confirm('Are you sure you want to delete all workouts for this day?')) return;
    const day = editableWeek[dayIdx];
    try {
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

  // Always render 7 days, filling missing days as null
  const fullWeek = getFullWeek(planStartDate, editableWeek);

  return (
    <div>
      {/* Legend for day types */}
      <div className="mb-2 flex gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> Rest Day</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-500" /> Plan Not Generated</span>
      </div>
      {/* Render each day */}
      {fullWeek.map((day, dayIdx) => {
        if (!day) {
          // Plan Not Generated
          return (
            <div key={dayIdx} className="border rounded p-4 mb-2 flex items-center gap-2 bg-yellow-50">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">Plan Not Generated</span>
              <span className="ml-2 text-xs text-muted-foreground">No workout plan exists for this day.</span>
            </div>
          );
        }
        if (day.exercises.length === 0) {
          // Rest Day
          return (
            <div key={dayIdx} className="border rounded p-4 mb-2 flex items-center gap-2 bg-gray-50">
              <Bed className="w-5 h-5" />
              <span className="font-semibold">Rest Day</span>
              <span className="ml-2 text-xs text-muted-foreground">Enjoy your recovery!</span>
            </div>
          );
        }
        // Normal workout day
        return (
          <Accordion key={day.date} type="multiple" value={openPanels} onValueChange={setOpenPanels} className="w-full">
            <AccordionItem value={day.date}>
              <AccordionTrigger>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full justify-between">
                  <div className="flex items-center gap-3">
                    {getFocusIcon(day.focus)}
                    <div>
                      <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                        {day.focus}
                      </div>
                    </div>
                  </div>
                  {/* Delete Day Button */}
                  <button
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold"
                    title="Delete all workouts for this day"
                    onClick={async e => { e.stopPropagation(); await handleDeleteDay(dayIdx); }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Day
                  </button>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                        <th className="text-left p-3">Icon</th>
                        <th className="text-left p-3">Exercise</th>
                        <th className="text-left p-3">Category</th>
                        <th className="text-left p-3">Body Part</th>
                        <th className="text-left p-3">Sets x Reps</th>
                        <th className="text-left p-3">Rest (sec)</th>
                        <th className="text-left p-3">Weight</th>
                        <th className="text-left p-3">Duration</th>
                        <th className="text-left p-3">Equipment</th>
                        <th className="text-left p-3">Coach Tip</th>
                        <th className="text-left p-3">Video Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((ex: any, exIdx: number) => (
                        <tr key={exIdx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="p-3">{getExerciseIcon(ex)}</td>
                          <td className="p-3 font-semibold">{ex.exercise}</td>
                          <td className="p-3">{ex.category}</td>
                          <td className="p-3">{ex.body_part}</td>
                          <td className="p-3">
                            <Popover open={editIdx?.dayIdx === dayIdx && editIdx?.exIdx === exIdx} onOpenChange={open => { if (!open) setEditIdx(null); }}>
                              <PopoverTrigger asChild>
                                <button className="underline text-blue-600 dark:text-blue-400 flex items-center gap-1" onClick={() => handleEditClick(dayIdx, exIdx, ex.sets, ex.reps)}>
                                  {ex.sets} x {ex.reps}
                                  <span className="ml-1 text-xs">✎</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs">Sets</label>
                                  <input type="number" min="1" value={editSets} onChange={e => setEditSets(e.target.value)} className="border rounded px-2 py-1" />
                                  <label className="text-xs">Reps</label>
                                  <input type="text" value={editReps} onChange={e => setEditReps(e.target.value)} className="border rounded px-2 py-1" />
                                  <button
                                    className="mt-2 bg-blue-600 text-white rounded px-3 py-1"
                                    onClick={() => {
                                      console.log(`[WorkoutPlanTable] Saving Sets/Reps. Day: ${dayIdx}, Ex: ${exIdx}`);
                                      handlePlanChange(dayIdx, exIdx, 'sets', editSets);
                                      handlePlanChange(dayIdx, exIdx, 'reps', editReps);
                                      setEditIdx(null);
                                    }}
                                  >Save</button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">
                            <Popover open={editRestIdx?.dayIdx === dayIdx && editRestIdx?.exIdx === exIdx} onOpenChange={open => { if (!open) setEditRestIdx(null); }}>
                              <PopoverTrigger asChild>
                                <button className="underline text-blue-600 dark:text-blue-400 flex items-center gap-1" onClick={() => { setEditRestIdx({ dayIdx, exIdx }); setEditRest(ex.rest?.toString() || ''); }}>
                                  {ex.rest || '-'} <span className="ml-1 text-xs">✎</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-32">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs">Rest (sec)</label>
                                  <input type="number" min="0" value={editRest} onChange={e => setEditRest(e.target.value)} className="border rounded px-2 py-1" />
                                  <button 
                                    className="mt-2 bg-blue-600 text-white rounded px-3 py-1" 
                                    onClick={() => {
                                      console.log(`[WorkoutPlanTable] Saving Rest. Day: ${dayIdx}, Ex: ${exIdx}`);
                                      handlePlanChange(dayIdx, exIdx, 'rest', editRest);
                                      setEditRestIdx(null);
                                    }}
                                  >Save</button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">
                            <Popover open={editWeightIdx?.dayIdx === dayIdx && editWeightIdx?.exIdx === exIdx} onOpenChange={open => { if (!open) setEditWeightIdx(null); }}>
                              <PopoverTrigger asChild>
                                <button className="underline text-blue-600 dark:text-blue-400 flex items-center gap-1" onClick={() => { setEditWeightIdx({ dayIdx, exIdx }); setEditWeight(ex.weight?.toString() || ''); }}>
                                  {ex.weight || '-'} <span className="ml-1 text-xs">✎</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-32">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs">Weight</label>
                                  <input type="text" value={editWeight} onChange={e => setEditWeight(e.target.value)} className="border rounded px-2 py-1" />
                                  <button 
                                    className="mt-2 bg-blue-600 text-white rounded px-3 py-1"
                                    onClick={() => {
                                      console.log(`[WorkoutPlanTable] Saving Weight. Day: ${dayIdx}, Ex: ${exIdx}`);
                                      handlePlanChange(dayIdx, exIdx, 'weight', editWeight);
                                      setEditWeightIdx(null);
                                    }}
                                  >Save</button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">
                            <Popover open={editDurationIdx?.dayIdx === dayIdx && editDurationIdx?.exIdx === exIdx} onOpenChange={open => { if (!open) setEditDurationIdx(null); }}>
                              <PopoverTrigger asChild>
                                <button className="underline text-blue-600 dark:text-blue-400 flex items-center gap-1" onClick={() => { setEditDurationIdx({ dayIdx, exIdx }); setEditDuration(ex.duration?.toString() || ''); }}>
                                  {ex.duration} min <span className="ml-1 text-xs">✎</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-32">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs">Duration (min)</label>
                                  <input type="number" min="1" value={editDuration} onChange={e => setEditDuration(e.target.value)} className="border rounded px-2 py-1" />
                                  <button 
                                    className="mt-2 bg-blue-600 text-white rounded px-3 py-1" 
                                    onClick={() => {
                                      console.log(`[WorkoutPlanTable] Saving Duration. Day: ${dayIdx}, Ex: ${exIdx}`);
                                      handlePlanChange(dayIdx, exIdx, 'duration', editDuration);
                                      setEditDurationIdx(null);
                                    }}
                                  >Save</button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                          <td className="p-3">{ex.equipment}</td>
                          <td className="p-3 text-sm text-gray-600 dark:text-gray-400">{ex.coach_tip}</td>
                          <td className="p-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="flex items-center gap-1 text-blue-500 underline">
                                  <Link2 className="h-4 w-4" />
                                  {ex.video_link}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64">
                                <input 
                                  type="text" 
                                  className="border rounded px-2 py-1 w-full" 
                                  placeholder="Paste video link here" 
                                  value={ex.video_link || ''} 
                                  onChange={e => handlePlanChange(dayIdx, exIdx, 'video_link', e.target.value)} 
                                />
                              </PopoverContent>
                            </Popover>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </div>
  );
}; 