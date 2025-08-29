// Integration example for Coach Tip system with existing workout generators
import { CoachTipGenerator, CoachTipUtils } from './index';

/**
 * Example: Integration with Enhanced Workout Generator
 * Replace the existing generateTrainerNotes function
 */
export function integrateWithEnhancedGenerator() {
  // Example of how to replace the existing generateTrainerNotes function
  const generateTrainerNotes = (
    exercise: any, 
    context: { 
      injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>;
      progression?: any;
      goal?: string;
      phase?: number;
      experience?: string;
    }
  ): string => {
    // Normalize exercise object
    const normalizedExercise = CoachTipUtils.normalizeExercise(exercise);
    
    // Create coach tip context
    const coachTipContext = {
      goal: context.goal || 'fat_loss',
      phase: context.phase || 1,
      experience: context.experience || 'Beginner',
      injuries: context.injuries || [],
      progression: context.progression
    };
    
    // Generate coach tip using the new system
    return CoachTipGenerator.generateCoachTip(normalizedExercise, coachTipContext);
  };
  
  return generateTrainerNotes;
}

/**
 * Example: Integration with Search-Based Workout Plan
 * Replace the existing coach_tip generation
 */
export function integrateWithSearchBasedPlan() {
  // Example of how to replace existing coach_tip generation
  const generateCoachTipForSearchBased = (exercise: any, clientGoal: string, clientExperience: string, clientInjuries: any[]) => {
    // Normalize exercise object
    const normalizedExercise = CoachTipUtils.normalizeExercise(exercise);
    
    // Create coach tip context
    const coachTipContext = {
      goal: clientGoal || 'fat_loss',
      phase: 1, // Search-based typically uses phase 1
      experience: clientExperience || 'Beginner',
      injuries: clientInjuries || [],
      progression: null
    };
    
    // Generate coach tip using the new system
    return CoachTipGenerator.generateCoachTip(normalizedExercise, coachTipContext);
  };
  
  return generateCoachTipForSearchBased;
}

/**
 * Example: Integration with AI-Based System
 * Enhance AI-generated coach tips with structured components
 */
export function integrateWithAISystem() {
  const enhanceAICoachTip = (aiCoachTip: string, exercise: any, context: any) => {
    // Normalize exercise object
    const normalizedExercise = CoachTipUtils.normalizeExercise(exercise);
    
    // Create coach tip context
    const coachTipContext = {
      goal: context.goal || 'fat_loss',
      phase: context.phase || 1,
      experience: context.experience || 'Intermediate',
      injuries: context.injuries || [],
      progression: context.progression
    };
    
    // Generate structured coach tip
    const structuredTip = CoachTipGenerator.generateCoachTip(normalizedExercise, coachTipContext);
    
    // Combine AI creativity with structured components
    return `${structuredTip} | ${aiCoachTip}`;
  };
  
  return enhanceAICoachTip;
}

/**
 * Example: Usage in workout plan generation
 */
export function exampleWorkoutPlanUsage() {
  // Example exercise data
  const exercise = {
    exercise_name: 'Deadlift',
    category: 'Strength',
    body_part: 'Full Body',
    equipment: 'Barbell',
    experience_level: 'Intermediate',
    primary_muscle: 'Lower Back'
  };
  
  // Example context
  const context = {
    goal: 'strength',
    phase: 1,
    experience: 'Intermediate',
    injuries: [],
    progression: {
      currentPhase: 1,
      previousPerformance: { improvement: 0.1 },
      goal: 'strength',
      sets: 3,
      reps: '5-8'
    }
  };
  
  // Generate coach tip
  const coachTip = CoachTipGenerator.generateCoachTip(exercise, context);
  
  console.log('Example Coach Tip:', coachTip);
  // Output: "RPE 7.5, 3-1-3 tempo, Keep chest up throughout the movement, Push through your heels, Barbell exercise, Progression applied: 3 sets, 5-8 reps (10% increase)"
  
  return coachTip;
}

/**
 * Example: Batch generation for multiple exercises
 */
export function exampleBatchGeneration() {
  const exercises = [
    {
      exercise_name: 'Deadlift',
      category: 'Strength',
      body_part: 'Full Body',
      equipment: 'Barbell',
      experience_level: 'Intermediate',
      primary_muscle: 'Lower Back'
    },
    {
      exercise_name: 'Push-up',
      category: 'Strength',
      body_part: 'Upper Body',
      equipment: 'Bodyweight',
      experience_level: 'Beginner',
      primary_muscle: 'Chest'
    },
    {
      exercise_name: 'Bicep Curl',
      category: 'Strength',
      body_part: 'Upper Body',
      equipment: 'Dumbbell',
      experience_level: 'Advanced',
      primary_muscle: 'Biceps'
    }
  ];
  
  const context = {
    goal: 'hypertrophy',
    phase: 2,
    experience: 'Intermediate',
    injuries: [],
    progression: null
  };
  
  // Generate coach tips for all exercises
  const coachTips = exercises.map(exercise => ({
    exercise: exercise.exercise_name,
    coachTip: CoachTipGenerator.generateCoachTip(exercise, context)
  }));
  
  console.log('Batch Coach Tips:', coachTips);
  
  return coachTips;
}
