import { CoachTipContext } from './types';

export class CoachTipUtils {
  /**
   * Validate coach tip context
   */
  static validateContext(context: CoachTipContext): boolean {
    const validGoals = ['fat_loss', 'hypertrophy', 'strength', 'endurance', 'power'];
    const validPhases = [1, 2, 3, 4];
    const validExperiences = ['Beginner', 'Intermediate', 'Advanced'];
    
    return (
      validGoals.includes(context.goal) &&
      validPhases.includes(context.phase) &&
      validExperiences.includes(context.experience)
    );
  }

  /**
   * Sanitize exercise name for matching
   */
  static sanitizeExerciseName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract RPE number from string
   */
  static extractRPE(rpeString: string): number | null {
    const match = rpeString.match(/RPE\s+(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Convert exercise object to standardized format
   */
  static normalizeExercise(exercise: any): any {
    return {
      exercise_name: exercise.exercise_name || exercise.Exercise || exercise.name || "Exercise",
      category: exercise.category || exercise.Category || "Strength",
      body_part: exercise.body_part || exercise.primary_muscle || exercise["Primary muscle"] || "Full Body",
      equipment: exercise.equipment || exercise.Equipment || "Dumbbell",
      experience_level: exercise.experience_level || exercise.Experience || "Intermediate",
      primary_muscle: exercise.primary_muscle || exercise["Primary muscle"] || "Full Body",
      secondary_muscles: exercise.secondary_muscles || []
    };
  }
}
