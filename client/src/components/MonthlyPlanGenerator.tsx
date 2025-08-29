"use client"

import React, { useState, useCallback } from 'react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { EnhancedWorkoutGenerator } from '@/lib/enhanced-workout-generator';
import { toast } from '@/hooks/use-toast';

interface MonthlyPlanGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  planStartDate: Date;
  onGenerationComplete: (monthlyPlan: any) => void;
  onGenerationError: (error: string) => void;
  onSaveWeek?: (planWeek: any[], clientId: number, planStartDate: Date) => Promise<{ success: boolean; error?: string }>;
}

interface GenerationStep {
  weekNumber: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  startDate: Date;
  endDate: Date;
  plan?: any;
  error?: string;
}

export default function MonthlyPlanGenerator({
  isOpen,
  onClose,
  clientId,
  planStartDate,
  onGenerationComplete,
  onGenerationError,
  onSaveWeek
}: MonthlyPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([]);

  // Initialize steps when modal opens
  React.useEffect(() => {
    if (isOpen && steps.length === 0) {
      const initialSteps: GenerationStep[] = [];
      for (let i = 0; i < 4; i++) {
        const weekStartDate = i === 0 ? planStartDate : addWeeks(planStartDate, i);
        const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);

        initialSteps.push({
          weekNumber: i + 1,
          status: 'pending',
          startDate: weekStartDate,
          endDate: weekEndDate
        });
      }
      setSteps(initialSteps);
    }
  }, [isOpen, planStartDate, steps.length]);

  const generateWeekPlan = useCallback(async (weekIndex: number): Promise<any> => {
    const step = steps[weekIndex];
    if (!step) throw new Error(`Invalid week index: ${weekIndex}`);

    try {
      // Update step status to generating
      setSteps(prev => prev.map((s, i) =>
        i === weekIndex ? { ...s, status: 'generating' as const } : s
      ));

      console.log(`🚀 MonthlyPlanGenerator: Generating Week ${weekIndex + 1} for ${format(step.startDate, 'MMM d, yyyy')}`);

      console.log(`🎯 MonthlyPlanGenerator: Generating Week ${weekIndex + 1} for Client ${clientId}`);
      console.log(`📅 Week ${weekIndex + 1} Date Range: ${format(step.startDate, 'MMM d, yyyy')} - ${format(step.endDate, 'MMM d, yyyy')}`);



      // Generate plan for this specific week
      const result = await EnhancedWorkoutGenerator.generateWorkoutPlan(
        clientId,
        step.startDate
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to generate plan');
      }

      // Log the progression data for verification
      if (result.progressionConfirmation) {
        console.log(`📈 Week ${weekIndex + 1} Progression Status:`, result.progressionConfirmation);
      }

      if (result.workoutPlan?.days) {
        const totalExercises = result.workoutPlan.days.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
        console.log(`🏋️ Week ${weekIndex + 1} Generated: ${result.workoutPlan.days.length} days, ${totalExercises} exercises`);


      }

      console.log(`✅ MonthlyPlanGenerator: Week ${weekIndex + 1} generated successfully`);

      // Save the plan to schedule_preview following the same process as regular generation
      if (result.workoutPlan && result.workoutPlan.days && result.workoutPlan.days.length > 0) {
        console.log(`💾 MonthlyPlanGenerator: Attempting to save Week ${weekIndex + 1}...`);
        console.log(`📊 Week ${weekIndex + 1} data:`, {
          daysCount: result.workoutPlan.days.length,
          hasExercises: result.workoutPlan.days.some((day: any) => day.exercises && day.exercises.length > 0),
          startDate: format(step.startDate, 'yyyy-MM-dd'),
          clientId: clientId
        });

        if (onSaveWeek) {
          try {
            const saveResult = await onSaveWeek(result.workoutPlan.days, clientId, step.startDate);

            if (!saveResult.success) {
              console.error(`❌ MonthlyPlanGenerator: Failed to save Week ${weekIndex + 1}:`, saveResult.error);
            } else {
              console.log(`✅ MonthlyPlanGenerator: Week ${weekIndex + 1} saved successfully to schedule_preview`);
            }
          } catch (saveError) {
            console.error(`❌ MonthlyPlanGenerator: Exception while saving Week ${weekIndex + 1}:`, saveError);
          }
        } else {
          console.error('❌ MonthlyPlanGenerator: No save function provided - plan not saved to database');
        }
      } else {
        console.warn(`⚠️ MonthlyPlanGenerator: Week ${weekIndex + 1} has no valid data to save`, {
          hasWorkoutPlan: !!result.workoutPlan,
          hasDays: !!(result.workoutPlan?.days),
          daysLength: result.workoutPlan?.days?.length || 0
        });
      }

      // Update step status to completed
      setSteps(prev => prev.map((s, i) =>
        i === weekIndex ? { ...s, status: 'completed' as const, plan: result.workoutPlan } : s
      ));

      return result.workoutPlan;

    } catch (error) {
      console.error(`❌ MonthlyPlanGenerator: Error generating Week ${weekIndex + 1}:`, error);

      // Update step status to error
      setSteps(prev => prev.map((s, i) =>
        i === weekIndex ? {
          ...s,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : s
      ));

      throw error;
    }
  }, [clientId, steps, onSaveWeek]);

  const generateMonthlyPlan = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setCurrentStep(0);



    try {
      const monthlyPlan = {
        weeks: [],
        summary: {
          totalWeeks: 4,
          generatedAt: new Date().toISOString(),
          planStartDate: planStartDate.toISOString(),
          planEndDate: addWeeks(planStartDate, 3).toISOString()
        }
      };

      // Generate each week sequentially
      for (let i = 0; i < 4; i++) {
        setCurrentStep(i);
        console.log(`🚀 MonthlyPlanGenerator: Starting Week ${i + 1} of 4...`);

        try {
          const weekPlan = await generateWeekPlan(i);

          console.log(`✅ MonthlyPlanGenerator: Week ${i + 1} completed successfully`);

          monthlyPlan.weeks.push({
            weekNumber: i + 1,
            startDate: steps[i].startDate.toISOString(),
            endDate: steps[i].endDate.toISOString(),
            plan: weekPlan
          });

          console.log(`📊 MonthlyPlanGenerator: Week ${i + 1} added to monthly plan`);

        } catch (weekError) {
          console.error(`❌ MonthlyPlanGenerator: Week ${i + 1} failed:`, weekError);
          // Continue with other weeks even if one fails
        }

        // Small delay between generations to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('✅ Monthly plan generation completed!');
      console.log('📊 Final monthly plan summary:', {
        totalWeeks: monthlyPlan.weeks.length,
        weeksWithData: monthlyPlan.weeks.filter(w => w.plan).length,
        planStartDate: monthlyPlan.summary.planStartDate,
        planEndDate: monthlyPlan.summary.planEndDate
      });



      onGenerationComplete(monthlyPlan);

    } catch (error) {
      console.error('❌ Monthly plan generation failed:', error);
      onGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, generateWeekPlan, steps, planStartDate, onGenerationComplete, onGenerationError]);

  const handleClose = useCallback(() => {
    if (!isGenerating) {
      setSteps([]);
      setCurrentStep(0);
      onClose();
    }
  }, [isGenerating, onClose]);

  const getStepIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'generating':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'generating':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const progressPercentage = Math.round(((currentStep + (steps.filter(s => s.status === 'completed').length / 4)) / 4) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Monthly Workout Plan Generation
          </DialogTitle>
          <DialogDescription>
            Generating a 4-week progressive workout plan with detailed tracking of each week's exercises and progression.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Step Indicator */}
          {isGenerating && (
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Currently generating Week {currentStep + 1} of 4
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {format(steps[currentStep]?.startDate, 'MMM d')} - {format(steps[currentStep]?.endDate, 'MMM d, yyyy')}
              </div>
            </div>
          )}

          {/* Steps List */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              Generation Steps:
            </h3>

            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.status === 'generating'
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : step.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : step.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${getStepColor(step)}`}>
                    Week {step.weekNumber}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(step.startDate, 'MMM d')} - {format(step.endDate, 'MMM d, yyyy')}
                  </div>
                  {step.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {step.error}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  {step.status === 'pending' && 'Waiting...'}
                  {step.status === 'generating' && 'Generating...'}
                  {step.status === 'completed' && 'Completed'}
                  {step.status === 'error' && 'Failed'}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Cancel'}
            </Button>

            {!isGenerating && (
              <Button
                onClick={generateMonthlyPlan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Monthly Generation
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <strong>Note:</strong> Monthly plan generation creates 4 individual weekly plans sequentially.
            Each week builds upon the previous week's performance data for optimal progression.
            All generated plans are automatically saved to your database.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
