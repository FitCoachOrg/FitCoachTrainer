import { Exercise } from './types';

export class TempoGenerator {
  private static readonly TEMPO_RECOMMENDATIONS = {
    "strength": {
      compound: "3-1-3", // 3s down, 1s pause, 3s up
      isolation: "2-1-2",
      reason: "Slower tempo for strength development"
    },
    "hypertrophy": {
      compound: "3-1-2", // Slower eccentric for muscle damage
      isolation: "2-1-2",
      reason: "Emphasize eccentric phase for muscle growth"
    },
    "endurance": {
      compound: "2-1-2", // Faster tempo for endurance
      isolation: "2-1-2",
      reason: "Moderate tempo for endurance training"
    },
    "fat_loss": {
      compound: "2-1-2", // Moderate tempo
      isolation: "2-1-2",
      reason: "Balanced tempo for fat loss"
    },
    "power": {
      compound: "1-0-1", // Explosive tempo
      isolation: "2-0-1",
      reason: "Explosive concentric for power development"
    }
  } as const;

  /**
   * Get tempo recommendation for exercise and goal
   */
  static getTempo(
    goal: keyof typeof TempoGenerator.TEMPO_RECOMMENDATIONS,
    exercise: Exercise
  ): string {
    const exerciseName = exercise.exercise_name.toLowerCase();
    const equipment = exercise.equipment?.toLowerCase() || '';
    const category = exercise.category?.toLowerCase() || '';
    
    // Check for exercise-specific tempo adjustments
    const specificTempo = this.getExerciseSpecificTempo(exerciseName, equipment);
    if (specificTempo) {
      return specificTempo;
    }
    
    // Use goal-based tempo
    const goalTempo = this.TEMPO_RECOMMENDATIONS[goal];
    const isCompound = this.isCompoundMovement(exerciseName);
    
    return isCompound ? goalTempo.compound : goalTempo.isolation;
  }

  /**
   * Get exercise-specific tempo adjustments
   */
  private static getExerciseSpecificTempo(exerciseName: string, equipment: string): string | null {
    const specificTempos = {
      // Bodyweight exercises - faster tempo
      "push-up": "1-0-1",
      "pull-up": "2-0-1",
      "dip": "2-0-1",
      "burpee": "1-0-1",
      "mountain climber": "1-0-1",
      
      // Explosive movements
      "clean": "1-0-1",
      "snatch": "1-0-1",
      "jump": "1-0-1",
      "slam ball": "1-0-1",
      "medicine ball": "1-0-1",
      
      // Isometric holds
      "plank": "hold",
      "wall sit": "hold",
      "dead hang": "hold",
      "side plank": "hold",
      "l-sit": "hold",
      
      // Core exercises
      "crunch": "2-1-2",
      "sit-up": "2-1-2",
      "russian twist": "2-1-2",
      "flutter kicks": "2-1-2",
      "heel taps": "2-1-2",
      "bird dog": "hold",
      "dead bug": "2-1-2",
      "glute bridge": "2-1-2",
      
      // Stability exercises
      "stability ball": "2-1-2",
      "suspension": "2-1-2",
      "gymnastic rings": "2-1-2",
      "parallette": "2-1-2",
      "sliders": "2-1-2",
      "miniband": "2-1-2",
      
      // Cable exercises
      "cable": "2-1-2",
      
      // Ab wheel
      "ab wheel": "3-1-3"
    };
    
    // Check for exact matches first
    for (const [pattern, tempo] of Object.entries(specificTempos)) {
      if (exerciseName.includes(pattern)) {
        return tempo;
      }
    }
    
    // Check for equipment-based matches
    for (const [pattern, tempo] of Object.entries(specificTempos)) {
      if (equipment.includes(pattern)) {
        return tempo;
      }
    }
    
    return null;
  }

  /**
   * Check if exercise is compound movement
   */
  private static isCompoundMovement(exerciseName: string): boolean {
    const compoundKeywords = [
      'deadlift', 'squat', 'bench press', 'overhead press', 
      'barbell row', 'power clean', 'snatch', 'thruster',
      'turkish get-up', 'clean', 'jerk'
    ];
    return compoundKeywords.some(keyword => exerciseName.includes(keyword));
  }
}

// Tempo format explanation
export const TEMPO_FORMAT = {
  "3-1-3": "3 seconds down (eccentric), 1 second pause, 3 seconds up (concentric)",
  "2-1-2": "2 seconds down, 1 second pause, 2 seconds up",
  "1-0-1": "1 second down, no pause, 1 second up (explosive)",
  "hold": "Hold position for specified duration",
  "emom": "Every minute on the minute",
  "amrap": "As many rounds as possible"
} as const;
