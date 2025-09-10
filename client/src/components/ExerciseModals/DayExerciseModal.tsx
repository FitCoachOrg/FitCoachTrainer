"use client"
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Play, Pause, Save, Edit3, Trash2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoThumbnail from '@/components/VideoThumbnail';
import VideoModal from '@/components/VideoModal';
import ExercisePickerModal from '@/components/ExercisePickerModal';
import AddExerciseModal from '@/components/AddExerciseModal';

// Inline Editable Cell Component (from WorkoutPlanTable)
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

interface DayExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: {
    date: string;
    focus: string;
    exercises: Exercise[];
  };
  onSave: (updatedExercises: Exercise[]) => void;
}

export default function DayExerciseModal({ isOpen, onClose, day, onSave }: DayExerciseModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [originalExercises, setOriginalExercises] = useState<Exercise[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  
  // Exercise picker and add exercise modals
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);

  // Initialize exercises when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialExercises = day.exercises || [];
      setExercises(initialExercises);
      setOriginalExercises(JSON.parse(JSON.stringify(initialExercises))); // Deep copy
      setHasUnsavedChanges(false);
    }
  }, [isOpen, day.exercises]);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    if (isOpen && originalExercises.length >= 0) {
      const hasChanges = JSON.stringify(exercises) !== JSON.stringify(originalExercises);
      setHasUnsavedChanges(hasChanges);
    }
  }, [exercises, originalExercises, isOpen]);

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
    
    const updatedExercises = [...exercises, newExercise];
    setExercises(updatedExercises);
    setExercisePickerOpen(false);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Handle add exercise modal success
  const handleAddExerciseSuccess = () => {
    setAddExerciseOpen(false);
    // Refresh the exercise list or show success message
  };

  // Add new exercise - automatically save locally
  const addExercise = () => {
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
    const updatedExercises = [...exercises, newExercise];
    setExercises(updatedExercises);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Delete exercise - update local state only
  const deleteExercise = (index: number) => {
    const updatedExercises = exercises.filter((_, i) => i !== index);
    setExercises(updatedExercises);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Update exercise field - update local state only
  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updatedExercises = exercises.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    );
    setExercises(updatedExercises);
    
    // Don't call onSave here - only update local state
    // onSave will be called when user explicitly saves the modal
  };

  // Save changes
  const handleSave = () => {
    onSave(exercises);
    onClose();
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
    setExercises(originalExercises);
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

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">
                {day.focus} - {format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}
                {hasUnsavedChanges && (
                  <span className="ml-2 text-sm text-orange-600 font-normal">
                    (Unsaved changes)
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Add Exercise Buttons */}
            <div className="mb-4 flex gap-2">
              <Button 
                onClick={() => setExercisePickerOpen(true)} 
                className="flex items-center gap-2"
                variant="default"
              >
                <Plus className="h-4 w-4" />
                Pick from Library
              </Button>
              <Button 
                onClick={() => setAddExerciseOpen(true)} 
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Create Custom
              </Button>
              <Button 
                onClick={addExercise} 
                className="flex items-center gap-2"
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                Add Empty
              </Button>
            </div>

            {/* Exercises Table */}
            {exercises.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 table-fixed">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-1/4">Exercise</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-20">Duration (min)</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-16">Sets</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-16">Reps</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-20">Weight (lbs)</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-1/6">Equipment</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-24">Video</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-sm font-medium w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((exercise, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {/* Exercise Name */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.exercise}
                            onSave={(value) => updateExercise(index, 'exercise', value)}
                            placeholder="Exercise name"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Duration */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.duration}
                            onSave={(value) => updateExercise(index, 'duration', value)}
                            placeholder="Duration"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Sets */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.sets}
                            onSave={(value) => updateExercise(index, 'sets', parseInt(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Reps */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.reps}
                            onSave={(value) => updateExercise(index, 'reps', parseInt(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Weight */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.weight}
                            onSave={(value) => updateExercise(index, 'weight', parseFloat(value) || 0)}
                            type="number"
                            placeholder="0"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Equipment */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <EditableCell
                            value={exercise.equipment}
                            onSave={(value) => updateExercise(index, 'equipment', value)}
                            placeholder="Equipment"
                            className="w-full min-w-0"
                          />
                        </td>

                        {/* Video */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          {exercise.video_link || exercise.video_thumbnail ? (
                            <div className="flex items-center gap-1">
                              <VideoThumbnail
                                videoUrl={exercise.video_link || exercise.video_thumbnail || ''}
                                exerciseName={exercise.exercise}
                                onClick={() => openVideoModal(exercise.video_link || exercise.video_thumbnail || '', exercise.exercise)}
                                className="w-10 h-6 flex-shrink-0"
                              />
                              <EditableCell
                                value={exercise.video_link}
                                onSave={(value) => updateExercise(index, 'video_link', value)}
                                placeholder="Video Link"
                                className="w-full text-xs opacity-0 hover:opacity-100 transition-opacity min-w-0"
                              />
                            </div>
                          ) : (
                            <EditableCell
                              value={exercise.video_link}
                              onSave={(value) => updateExercise(index, 'video_link', value)}
                              placeholder="Video Link"
                              className="w-full text-xs min-w-0"
                            />
                          )}
                        </td>

                        {/* Actions */}
                        <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteExercise(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No exercises added yet.</p>
                <p className="text-sm mt-1">Click "Add Exercise" to get started.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
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
        onClose={() => setExercisePickerOpen(false)}
        onSelect={handleExerciseSelect}
      />

      {/* Add Exercise Modal */}
      <AddExerciseModal
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        onSuccess={handleAddExerciseSuccess}
      />
    </>
  );
}
