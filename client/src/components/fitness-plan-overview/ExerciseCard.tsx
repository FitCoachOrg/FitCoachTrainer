import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Repeat, Timer, Weight, Info, Trash2, GripVertical } from "lucide-react";

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

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  isEditing: boolean;
  handleExerciseEdit: (index: number, field: string, value: any) => void;
  handleRemoveExercise: (index: number) => void;
  isDragging?: boolean;
}

const ExerciseDetail: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isEditing: boolean;
  onChange: (value: string) => void;
  inputType?: string;
}> = ({ icon, label, value, isEditing, onChange, inputType = "text" }) => (
  <div className="flex items-center gap-2 text-sm">
    <div className="text-gray-500 dark:text-gray-400">{icon}</div>
    <span className="font-medium text-gray-700 dark:text-gray-300 w-12">{label}:</span>
    {isEditing ? (
      <Input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-24"
      />
    ) : (
      <span className="text-gray-900 dark:text-white">{value}</span>
    )}
  </div>
);

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  isEditing,
  handleExerciseEdit,
  handleRemoveExercise,
}) => {
  return (
    <Card className="mb-4 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-start gap-4">
        {isEditing && (
          <div className="flex items-center h-full pt-2">
            <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
          </div>
        )}
        <div className="flex-shrink-0">
          <span className="text-2xl">{exercise.icon || '💪'}</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{exercise.workout}</h4>
            <Badge variant="secondary">{exercise.day}</Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.coach_tip}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-4">
            <ExerciseDetail
              icon={<Repeat className="h-4 w-4" />}
              label="Sets"
              value={exercise.sets}
              isEditing={isEditing}
              onChange={(v) => handleExerciseEdit(index, "sets", v)}
              inputType="number"
            />
            <ExerciseDetail
              icon={<Dumbbell className="h-4 w-4" />}
              label="Reps"
              value={exercise.reps}
              isEditing={isEditing}
              onChange={(v) => handleExerciseEdit(index, "reps", v)}
            />
            <ExerciseDetail
              icon={<Timer className="h-4 w-4" />}
              label="Time"
              value={`${exercise.duration} min`}
              isEditing={isEditing}
              onChange={(v) => handleExerciseEdit(index, "duration", v)}
              inputType="number"
            />
            <ExerciseDetail
              icon={<Weight className="h-4 w-4" />}
              label="Weight"
              value={exercise.weights}
              isEditing={isEditing}
              onChange={(v) => handleExerciseEdit(index, "weights", v)}
            />
          </div>
        </div>
        {isEditing && (
          <div className="flex items-center h-full">
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={() => handleRemoveExercise(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 