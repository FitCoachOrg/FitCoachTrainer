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
import { Trash2, PlusCircle, Save, GripVertical, Dumbbell, HeartPulse, Footprints, PersonStanding, Snowflake, Weight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  other_details?: string;
  coach_tip?: string;
  details_json?: any;
  workout_id?: string; // Add this line for UUID support
}

interface WorkoutPlanTableProps {
  initialPlanData: any[];
  clientId: number;
}

// Helper to get an icon based on exercise category/body part
const getExerciseIcon = (exercise: Exercise) => {
    const category = exercise.category?.toLowerCase() || '';
    const bodyPart = exercise.body_part?.toLowerCase() || '';

    if (category.includes('cardio')) return <HeartPulse className="h-5 w-5 text-red-500" />;
    if (category.includes('stretch')) return <PersonStanding className="h-5 w-5 text-blue-500" />;
    if (category.includes('warmup')) return <Zap className="h-5 w-5 text-yellow-500" />;
    if (category.includes('cooldown')) return <Snowflake className="h-5 w-5 text-cyan-500" />;

    if (bodyPart.includes('leg')) return <Footprints className="h-5 w-5 text-green-500" />;
    if (bodyPart.includes('chest')) return <HeartPulse className="h-5 w-5 text-red-600" />;
    if (bodyPart.includes('back')) return <PersonStanding className="h-5 w-5 text-gray-500" />;
    if (bodyPart.includes('arm')) return <Dumbbell className="h-5 w-5 text-indigo-500" />;
    if (bodyPart.includes('shoulder')) return <Dumbbell className="h-5 w-5 text-purple-500" />;
    if (bodyPart.includes('core')) return <Weight className="h-5 w-5 text-orange-500" />;


    return <Dumbbell className="h-5 w-5 text-muted-foreground" />;
}

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


export const WorkoutPlanTable = ({ initialPlanData, clientId }: WorkoutPlanTableProps) => {
  console.log('WorkoutPlanTable initialPlanData (first item):', initialPlanData && initialPlanData[0]);
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingCell, setEditingCell] = useState<{ exerciseId: string; field: keyof Exercise } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletedExerciseIds, setDeletedExerciseIds] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    // Always use an array for mapping
    const safePlanData = Array.isArray(initialPlanData) ? initialPlanData : [];
    if (safePlanData.length > 0) {
      const formattedExercises: Exercise[] = safePlanData.map((item, index) => {
        // Helper to get a value from top-level, details_json, or details_json.main_workout[0]
        const getField = (field: string, fallback: any = 'N/A') => {
          if (item[field] !== undefined && item[field] !== null) return item[field];
          if (item.details_json && item.details_json[field] !== undefined && item.details_json[field] !== null) return item.details_json[field];
          if (item.details_json && item.details_json.main_workout && Array.isArray(item.details_json.main_workout) && item.details_json.main_workout[0] && item.details_json.main_workout[0][field] !== undefined) {
            return item.details_json.main_workout[0][field];
          }
          return fallback;
        };

        return {
          id: item.id?.toString() || `new-${new Date().getTime()}-${index}`,
          exercise: getField('exercise_name', item.workout || item.summary || 'New Exercise'),
          category: getField('category', 'N/A'),
          body_part: getField('body_part', 'N/A'),
          sets: getField('sets', 0),
          reps: getField('reps', 0),
          time: getField('duration', '0s'),
          weight: getField('weights', getField('weight', 0)),
          equipment: getField('equipment', 'bodyweight'),
          date: item.for_date || item.date || '',
          other_details: getField('other_details', ''),
          coach_tip: getField('coach_tip', ''),
          details_json: item.details_json || item,
        };
      });
      console.log('WorkoutPlanTable formattedExercises (first item):', formattedExercises && formattedExercises[0]);
      setExercises(formattedExercises);
    } else {
      setExercises([]);
    }
  }, [initialPlanData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCellClick = (exerciseId: string, field: keyof Exercise) => {
    setEditingCell({ exerciseId, field });
  };

  const handleInputChange = (exerciseId: string, field: keyof Exercise, value: any) => {
    setExercises(prev =>
      prev.map(ex =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };
  
  const handleDeleteExercise = (exerciseId: string) => {
    // Check if this is a database ID (not a temporary one)
    const isValidDatabaseId = (id: string): boolean => {
      return /^\d+$/.test(id) && !isNaN(parseInt(id)) && parseInt(id) > 0;
    };
    
    if (isValidDatabaseId(exerciseId)) {
      setDeletedExerciseIds(prev => [...prev, exerciseId]);
    }
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  }

  // Check if there are existing workouts for the same date range
  const checkExistingWorkouts = async () => {
    const newExercises = exercises.filter(ex => !/^\d+$/.test(ex.id));
    if (newExercises.length === 0) return false;
    
    const dates = newExercises.map(ex => ex.date).filter(Boolean);
    if (dates.length === 0) return false;
    
    const minDate = dates.reduce((a, b) => a < b ? a : b);
    const maxDate = dates.reduce((a, b) => a > b ? a : b);
    
    const { data, error } = await supabase
      .from('schedule')
      .select('id')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', minDate)
      .lte('for_date', maxDate);
      
    return data && data.length > 0;
  };

  const handleSaveClick = async () => {
    const hasExisting = await checkExistingWorkouts();
    if (hasExisting) {
      setIsConfirmDialogOpen(true);
    } else {
      handleSaveChanges();
    }
  };

  // Helper to get date range for confirmation dialog
  const getDateRange = () => {
    const newExercises = exercises.filter(ex => !/^\d+$/.test(ex.id));
    const dates = newExercises.map(ex => ex.date).filter(Boolean);
    if (dates.length === 0) return { minDate: '', maxDate: '' };
    
    const minDate = dates.reduce((a, b) => a < b ? a : b);
    const maxDate = dates.reduce((a, b) => a > b ? a : b);
    return { minDate, maxDate };
  };


  const handleSaveChanges = async () => {
    setIsSaving(true);
    toast({
        title: 'Saving...',
        description: 'Your workout plan is being saved.',
    });

    // 1. Fetch for_time from client table for the clientId
    let forTime = '08:00:00'; // default
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('workout_time')
        .eq('client_id', clientId)
        .single();
      if (clientData && clientData.workout_time) {
        forTime = clientData.workout_time;
      }
    } catch (err) {
      // fallback to default
      console.warn('Could not fetch client workout_time, using default:', err);
    }

    // 2. Separate new exercises from existing ones based on proper ID validation
    // Valid database IDs are bigint (numbers), invalid ones should be treated as new
    const isValidDatabaseId = (id: string): boolean => {
      // Database IDs are bigint (numeric strings), not containing dashes or letters
      return /^\d+$/.test(id) && !isNaN(parseInt(id)) && parseInt(id) > 0;
    };

    const newExercises = exercises.filter(ex => !isValidDatabaseId(ex.id));
    const existingExercises = exercises.filter(ex => isValidDatabaseId(ex.id));

    console.log('💾 Saving workout plan:', {
      total: exercises.length,
      new: newExercises.length,
      existing: existingExercises.length,
      clientId,
      forTime,
      exerciseIds: exercises.map(ex => ({ id: ex.id, isValid: isValidDatabaseId(ex.id), exercise: ex.exercise }))
    });

    try {
      // 3. STRATEGY: Replace and Clean - Delete existing workouts for the same date range
      if (newExercises.length > 0) {
        // Get the date range from the new exercises
        const dates = newExercises.map(ex => ex.date).filter(Boolean);
        if (dates.length > 0) {
          const minDate = dates.reduce((a, b) => a < b ? a : b);
          const maxDate = dates.reduce((a, b) => a > b ? a : b);
          
          console.log('🗑️ Cleaning existing workouts for date range:', { minDate, maxDate });
          
          // Delete existing workouts for this client and date range
          const { error: deleteError } = await supabase
            .from('schedule')
            .delete()
            .eq('client_id', clientId)
            .eq('type', 'workout')
            .gte('for_date', minDate)
            .lte('for_date', maxDate);
            
          if (deleteError) {
            console.warn('⚠️ Failed to clean existing workouts:', deleteError.message);
            // Continue anyway - we'll try to insert new ones
          } else {
            console.log('✅ Successfully cleaned existing workouts for date range');
            toast({
              title: 'Replacing Plan',
              description: `Replaced existing workout plan for ${minDate} to ${maxDate}`,
            });
          }
        }
      }

      // 4. Handle new exercises (INSERT) - Now safe to insert since we cleaned old ones
      if (newExercises.length > 0) {
        const newExerciseData = newExercises.map(ex => {
          // Validate required fields
          if (!ex.exercise || !ex.date) {
            throw new Error(`Missing required fields for exercise: ${ex.exercise || 'Unknown'}`);
          }

          // Structure details_json in the specified format
          const details_json = {
            category: ex.category || 'General',
            body_part: ex.body_part || 'Full Body',
            cool_down: [], // Empty array as specified
            main_workout: [{
              reps: typeof ex.reps === 'string' ? ex.reps : ex.reps?.toString() || '0',
              sets: typeof ex.sets === 'string' ? parseInt(ex.sets) || 0 : ex.sets || 0,
              coach_tip: ex.coach_tip || '',
              exercise_name: ex.exercise,
              is_time_based: ex.time && ex.time !== '0s' && ex.time !== '0',
              equipment_type: ex.weight && ex.weight !== '0' && ex.weight !== 'bodyweight' ? 'Yes' : 'No',
              equipment: ex.equipment || 'bodyweight',
              youtube_video_id: '',
              weight_applicable: ex.weight && ex.weight !== '0' && ex.weight !== 'bodyweight',
              weight: ex.weight || '0',
              duration: ex.time || '0s',
              other_details: ex.other_details || ''
            }],
            warm_up_details: [], // Empty array as specified
            session_duration_minutes: 30 // Default session duration
          };

          return {
            // Don't include id for new exercises - let DB generate it
            client_id: clientId,
            type: 'workout',
            task: 'workout',
            for_date: ex.date,
            for_time: forTime,
            icon: ex.icon || 'dumbbell',
            coach_tip: ex.coach_tip || '',
            summary: `${ex.category || 'General'} + ${ex.body_part || 'Full Body'} + ${ex.exercise}`, // New summary format
            details_json,
          };
        });

        const { error: insertError } = await supabase
          .from('schedule')
          .insert(newExerciseData);

        if (insertError) {
          throw new Error(`Failed to insert new exercises: ${insertError.message}`);
        }
        console.log('✅ Successfully inserted new exercises:', newExerciseData.length);
      }

      // 5. Handle existing exercises (UPDATE) - Only for exercises that were already in DB
      if (existingExercises.length > 0) {
        for (const ex of existingExercises) {
          // Double-check ID validation before attempting update
          if (!isValidDatabaseId(ex.id)) {
            console.warn(`⚠️ Skipping update for exercise with invalid ID: ${ex.id} (${ex.exercise})`);
            continue; // Skip this exercise, don't try to update it
          }

          // Validate required fields
          if (!ex.exercise || !ex.date || !ex.id) {
            throw new Error(`Missing required fields for exercise update: ${ex.exercise || 'Unknown'}`);
          }

          // Structure details_json in the specified format (same as INSERT)
          const details_json = {
            category: ex.category || 'General',
            body_part: ex.body_part || 'Full Body',
            cool_down: [], // Empty array as specified
            main_workout: [{
              reps: typeof ex.reps === 'string' ? ex.reps : ex.reps?.toString() || '0',
              sets: typeof ex.sets === 'string' ? parseInt(ex.sets) || 0 : ex.sets || 0,
              coach_tip: ex.coach_tip || '',
              exercise_name: ex.exercise,
              is_time_based: ex.time && ex.time !== '0s' && ex.time !== '0',
              equipment_type: ex.weight && ex.weight !== '0' && ex.weight !== 'bodyweight' ? 'Yes' : 'No',
              equipment: ex.equipment || 'bodyweight',
              youtube_video_id: '',
              weight_applicable: ex.weight && ex.weight !== '0' && ex.weight !== 'bodyweight',
              weight: ex.weight || '0',
              duration: ex.time || '0s',
              other_details: ex.other_details || ''
            }],
            warm_up_details: [], // Empty array as specified
            session_duration_minutes: 30 // Default session duration
          };

          const updateData = {
            client_id: clientId,
            type: 'workout',
            task: 'workout',
            for_date: ex.date,
            for_time: forTime,
            icon: ex.icon || 'dumbbell',
            coach_tip: ex.coach_tip || '',
            summary: `${ex.category || 'General'} + ${ex.body_part || 'Full Body'} + ${ex.exercise}`, // New summary format
            workout_id: ex.workout_id || uuidv4(),
            details_json,
          };

          console.log(`🔄 Updating exercise ${ex.exercise} with ID: ${ex.id}`);
          const { error: updateError } = await supabase
            .from('schedule')
            .update(updateData)
            .eq('id', parseInt(ex.id)); // Convert to number to ensure proper bigint matching

          if (updateError) {
            throw new Error(`Failed to update exercise ${ex.exercise} (ID: ${ex.id}): ${updateError.message}`);
          }
        }
        console.log('✅ Successfully updated existing exercises:', existingExercises.length);
      }

      // 6. Perform the delete operation for any removed exercises (from table editing)
      if (deletedExerciseIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('schedule')
          .delete()
          .in('id', deletedExerciseIds);

        if (deleteError) {
          console.warn('⚠️ Failed to delete some exercises:', deleteError.message);
          // Continue even if delete fails, as the main save succeeded
        } else {
          setDeletedExerciseIds([]); // Clear the list on successful deletion
          console.log('✅ Successfully deleted exercises:', deletedExerciseIds.length);
        }
      }

      setIsSaving(false);
      toast({
        title: 'Plan Saved!',
        description: 'The workout plan has been successfully saved to the database.',
      });
      
      // Close confirmation dialog if it was open
      setIsConfirmDialogOpen(false);

    } catch (error: any) {
      console.error('❌ Error saving workout plan:', error);
      toast({
        title: 'Save Failed',
        description: `Could not save the plan. Error: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const handleConfirmSave = () => {
    setIsConfirmDialogOpen(false);
    handleSaveChanges();
  };

  const handleAddExercise = () => {
    const newExercise: Exercise = {
        id: `new-${new Date().getTime()}`,
        exercise: 'New Exercise',
        category: 'Strength',
        body_part: 'Full Body',
        sets: 3,
        reps: 10,
        time: '60s',
        weight: '10kg',
        equipment: 'bodyweight',
        date: new Date().toISOString().split('T')[0], // Default to today
        other_details: '',
    };
    setExercises(prev => [...prev, newExercise]);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Workout Plan</CardTitle>
            <CardDescription>Drag and drop to reorder exercises. Click on a field to edit.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddExercise} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Exercise
            </Button>
            <Button onClick={handleSaveClick} disabled={isSaving}>
              {isSaving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Plan</>}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Body Part</TableHead>
                  <TableHead>Sets</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Other Details</TableHead>
                  <TableHead>Coach Tip</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.map(exercise => (
                  <SortableExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    isEditing={(field) =>
                      editingCell?.exerciseId === exercise.id && editingCell?.field === field
                    }
                    onCellClick={(field) => handleCellClick(exercise.id, field)}
                    onInputChange={(field, value) => handleInputChange(exercise.id, field, value)}
                    onInputBlur={() => setEditingCell(null)}
                    onDelete={() => handleDeleteExercise(exercise.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </CardContent>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Replacement</DialogTitle>
            <DialogDescription>
              You have existing workouts for the date range of the new exercises.
              This will replace the existing plan for {getDateRange().minDate} to {getDateRange().maxDate}.
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmSave}>Replace Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}; 