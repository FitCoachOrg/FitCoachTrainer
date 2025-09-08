/**
 * Centralized Exercise Normalization Utility
 * 
 * This utility ensures consistent exercise data normalization across all components.
 * It handles all possible variations of property names from different AI models and data sources.
 */

export interface NormalizedExercise {
  exercise: string;
  category: string;
  body_part: string;
  sets: string;
  reps: string;
  duration: string;
  weight: string;
  equipment: string;
  coach_tip: string;
  rest: string;
  video_link: string;
  timeBreakdown?: any;
  experience: string;
  rpe_target: string;
  phase: number;
  session_id: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Comprehensive normalization function for all AI models and data sources
 * 
 * @param ex - Raw exercise data from any source (AI models, database, imports, etc.)
 * @returns Normalized exercise object with consistent property names
 */
export function normalizeExercise(ex: any): NormalizedExercise {
  // Handle all possible variations of property names from different AI models
  const normalized = {
    // Exercise name variations
    exercise: ex.exercise || ex.exercise_name || ex.name || ex.workout || ex.title || '',
    
    // Category variations
    category: ex.category || ex.type || ex.exercise_type || ex.workout_type || '',
    
    // Body part variations
    body_part: ex.body_part || ex.bodyPart || ex.body_parts || ex.target_area || ex.muscle_group || '',
    
    // Sets variations - ensure we preserve the actual value
    sets: ex.sets !== undefined && ex.sets !== null ? String(ex.sets) : String(ex.set_count ?? ex.number_of_sets ?? ''),
    
    // Reps variations
    reps: ex.reps ?? ex.repetitions ?? ex.rep_count ?? ex.number_of_reps ?? '',
    
    // Duration variations
    duration: ex.duration ?? ex.time ?? ex.exercise_duration ?? ex.minutes ?? '',
    
    // Weight variations
    weight: ex.weight ?? ex.weights ?? ex.weight_amount ?? ex.load ?? ex.resistance ?? '',
    
    // Equipment variations
    equipment: ex.equipment ?? ex.equipment_needed ?? ex.tools ?? ex.machines ?? '',
    
    // Coach tip variations
    coach_tip: ex.coach_tip ?? ex.tips ?? ex.tip ?? ex.instruction ?? ex.notes ?? ex.cue ?? '',
    
    // Rest variations
    rest: ex.rest ?? ex.rest_time ?? ex.rest_period ?? ex.rest_duration ?? '',
    
    // Video link variations
    video_link: ex.video_link ?? ex.videoLink ?? ex.video_url ?? ex.video ?? ex.link ?? '',
    
    // Enhanced generator specific fields
    timeBreakdown: ex.timeBreakdown || null,
    experience: ex.experience || 'Beginner',
    rpe_target: ex.rpe_target || 'RPE 7-8',
    phase: ex.phase || 1,
    session_id: ex.session_id || '',
    
    // Preserve any other properties that might be useful
    ...ex
  };
  
  // Ensure all required fields have fallback values
  return {
    ...normalized,
    exercise: normalized.exercise || 'Unknown Exercise',
    category: normalized.category || 'Strength',
    body_part: normalized.body_part || 'Full Body',
    sets: normalized.sets && String(normalized.sets).trim() !== '' ? String(normalized.sets) : '3',
    reps: normalized.reps || '10',
    duration: normalized.duration || '15',
    weight: normalized.weight || 'Bodyweight',
    equipment: normalized.equipment || 'None',
    coach_tip: normalized.coach_tip || 'Focus on proper form',
    rest: normalized.rest || '60',
    video_link: normalized.video_link || '',
    experience: normalized.experience || 'Beginner',
    rpe_target: normalized.rpe_target || 'RPE 7-8',
    phase: normalized.phase || 1,
    session_id: normalized.session_id || '',
    timeBreakdown: normalized.timeBreakdown
  };
}

/**
 * Normalize an array of exercises
 * 
 * @param exercises - Array of raw exercise data
 * @returns Array of normalized exercises
 */
export function normalizeExercises(exercises: any[]): NormalizedExercise[] {
  return (exercises || []).map(normalizeExercise);
}

/**
 * Validate that an exercise has the minimum required fields
 * 
 * @param exercise - Normalized exercise object
 * @returns true if exercise is valid, false otherwise
 */
export function isValidExercise(exercise: NormalizedExercise): boolean {
  return !!(
    exercise.exercise && 
    exercise.exercise.trim() !== '' && 
    exercise.exercise !== 'Unknown Exercise'
  );
}

/**
 * Get a summary of exercise data for debugging
 * 
 * @param exercises - Array of exercises (raw or normalized)
 * @returns Summary object with counts and sample data
 */
export function getExerciseSummary(exercises: any[]): {
  total: number;
  valid: number;
  invalid: number;
  sampleValid?: NormalizedExercise;
  sampleInvalid?: any;
} {
  const normalized = normalizeExercises(exercises);
  const valid = normalized.filter(isValidExercise);
  const invalid = normalized.filter(ex => !isValidExercise(ex));
  
  return {
    total: exercises.length,
    valid: valid.length,
    invalid: invalid.length,
    sampleValid: valid[0],
    sampleInvalid: invalid[0]
  };
}
