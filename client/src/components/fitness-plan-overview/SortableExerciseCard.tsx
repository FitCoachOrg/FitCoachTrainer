import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseCard } from './ExerciseCard';

interface WorkoutExercise {
  id?: string;
  workout: string;
  day?: string;
  sets: number;
  reps: string;
  duration: number;
  weights: string;
  for_date: string;
  for_time: string;
  body_part: string;
  category: string;
  coach_tip: string;
  icon: string;
  workout_yt_link?: string;
  progression_notes?: string;
}

interface SortableExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isEditing: boolean;
  handleExerciseEdit: (index: number, field: string, value: any) => void;
  handleRemoveExercise: (index: number) => void;
  id: string;
}

export const SortableExerciseCard: React.FC<SortableExerciseCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ExerciseCard {...props} isDragging={isDragging} />
    </div>
  );
}; 