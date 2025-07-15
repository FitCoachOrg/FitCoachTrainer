"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  X
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { generateAIWorkoutPlanForReview, saveReviewedWorkoutPlanToDatabase } from "@/lib/ai-fitness-plan"
import { addWorkoutSchedule } from "@/lib/schedule-service"

import { FitnessPlanHeader } from './fitness-plan-overview/FitnessPlanHeader'
import { FitnessPlanSummary } from './fitness-plan-overview/FitnessPlanSummary'
import { ExerciseCard } from './fitness-plan-overview/ExerciseCard'
import { SortableExerciseCard } from './fitness-plan-overview/SortableExerciseCard'

// Types
interface WorkoutExercise {
  id?: string
  workout: string
  day?: string
  sets: number
  reps: string
  duration: number
  weights: string
  for_date: string
  for_time: string
  body_part: string
  category: string
  coach_tip: string
  icon: string
  workout_yt_link?: string
  progression_notes?: string
}

interface FitnessPlanData {
  overview?: string
  split?: string
  progression_model?: string
  weekly_breakdown?: Record<string, string>
  workout_plan: WorkoutExercise[]
  clientInfo?: any
  generatedAt?: string
}

interface FitnessPlanOverviewProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  initialPlanData?: FitnessPlanData | null
  onPlanSaved?: (success: boolean, message: string) => void
  embedded?: boolean
}

const FitnessPlanOverview: React.FC<FitnessPlanOverviewProps> = ({
  isOpen,
  onClose,
  clientId,
  initialPlanData,
  onPlanSaved,
  embedded = false
}) => {
  const { toast } = useToast()
  
  // State management
  const [planData, setPlanData] = useState<FitnessPlanData | null>(initialPlanData || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedPlan, setEditedPlan] = useState<WorkoutExercise[]>([])
  const [currentView, setCurrentView] = useState<'table' | 'calendar' | 'weekly' | 'daily'>('table')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialPlanData) {
      setPlanData(initialPlanData)
      const exercisesWithIds = initialPlanData.workout_plan.map((exercise, index) => ({
        ...exercise,
        id: exercise.id || `exercise-${Date.now()}-${index}`
      }))
      setEditedPlan(exercisesWithIds)
    }
  }, [initialPlanData])

  const handleGenerateNewPlan = async () => {
    setIsLoading(true)
    try {
      const result = await generateAIWorkoutPlanForReview(clientId)
      
      if (result.success && result.workoutPlan) {
        const newPlanData: FitnessPlanData = {
          ...result.workoutPlan,
          clientInfo: result.clientInfo,
          generatedAt: result.generatedAt
        }
        
        setPlanData(newPlanData)
        const exercisesWithIds = newPlanData.workout_plan.map((exercise, index) => ({
          ...exercise,
          id: exercise.id || `exercise-${Date.now()}-${index}`
        }))
        setEditedPlan(exercisesWithIds)
        
        toast({
          title: "Plan Generated Successfully",
          description: "Your AI fitness plan is ready for review and customization.",
        })
      } else {
        toast({
          title: "Generation Failed",
          description: result.message || "Failed to generate fitness plan.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating the plan.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePlan = async () => {
    if (!editedPlan.length) {
      toast({
        title: "No Plan to Save",
        description: "Please generate or edit a fitness plan first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await saveReviewedWorkoutPlanToDatabase(editedPlan, clientId)
      
      if (result.success) {
        toast({
          title: "Plan Saved Successfully",
          description: `Saved ${editedPlan.length} exercises to the database.`,
        })
        onPlanSaved?.(true, result.message)
        onClose()
      } else {
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save fitness plan.",
          variant: "destructive",
        })
        onPlanSaved?.(false, result.message)
      }
    } catch (error: any) {
      console.error('Error saving plan:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the plan.",
        variant: "destructive",
      })
      onPlanSaved?.(false, "Unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExerciseEdit = (index: number, field: string, value: any) => {
    const newPlan = [...editedPlan];
    (newPlan[index] as any)[field] = value;
    setEditedPlan(newPlan);
  };

  const handleAddExercise = () => {
    const newExercise: WorkoutExercise = {
      id: `new-${Date.now()}`,
      workout: "New Exercise",
      day: "Monday",
      sets: 3,
      reps: "10-12",
      duration: 60,
      weights: "Bodyweight",
      for_date: new Date().toISOString().split('T')[0],
      for_time: "10:00",
      body_part: "Full Body",
      category: "Strength",
      coach_tip: "Focus on form.",
      icon: "💪",
    };
    setEditedPlan([...editedPlan, newExercise]);
  };

  const handleRemoveExercise = (index: number) => {
    const newPlan = editedPlan.filter((_, i) => i !== index);
    setEditedPlan(newPlan);
  };

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setEditedPlan((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const renderTableView = () => (
    <div>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={editedPlan.map(e => ({...e, id: e.id || ''}))}
            strategy={verticalListSortingStrategy}
          >
            {editedPlan.map((exercise, index) => (
              <SortableExerciseCard
                key={exercise.id}
                id={exercise.id!}
                exercise={exercise}
                index={index}
                isEditing={isEditing}
                handleExerciseEdit={handleExerciseEdit}
                handleRemoveExercise={handleRemoveExercise}
              />
            ))}
          </SortableContext>
        </DndContext>
      {isEditing && (
        <div className="mt-4">
          <Button onClick={handleAddExercise} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      )}
    </div>
  );

  const renderCalendarView = () => (
    <Card>
      <CardContent className="p-4">
        <p>Calendar view coming soon!</p>
      </CardContent>
    </Card>
  );

  const renderContent = () => (
    <div className={`p-4 sm:p-6 ${!embedded ? 'max-h-[85vh] overflow-y-auto' : ''}`}>
      <FitnessPlanHeader
        isLoading={isLoading}
        isSaving={isSaving}
        isEditing={isEditing}
        handleGenerateNewPlan={handleGenerateNewPlan}
        handleSavePlan={handleSavePlan}
        setIsEditing={setIsEditing}
        setCurrentView={setCurrentView}
        currentView={currentView}
      />
      
      <div className="mt-6">
        <div className="flex justify-end mb-4">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Plan</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={() => setIsEditing(false)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done Editing
                </Button>
              </div>
            )}
        </div>
        {currentView === 'table' ? renderTableView() : renderCalendarView()}
      </div>

      {planData && (
        <FitnessPlanSummary
          overview={planData.overview}
          split={planData.split}
          progressionModel={planData.progression_model}
        />
      )}
    </div>
  );

  if (embedded) {
    return <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg">{renderContent()}</div>;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FitnessPlanOverview; 