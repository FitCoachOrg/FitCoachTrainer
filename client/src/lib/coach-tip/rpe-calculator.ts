import { Exercise } from './types';

export class RPECalculator {
  private static readonly GOAL_RPE_MAPPING = {
    "fat_loss": {
      phase1: "RPE 7-8",
      phase2: "RPE 7.5-8", 
      phase3: "RPE 8",
      phase4: "RPE 6-7"
    },
    "hypertrophy": {
      phase1: "RPE 7-8",
      phase2: "RPE 7.5-8",
      phase3: "RPE 8", 
      phase4: "RPE 6-7"
    },
    "strength": {
      phase1: "RPE 7",
      phase2: "RPE 8",
      phase3: "RPE 8.5",
      phase4: "RPE 6-7"
    },
    "endurance": {
      phase1: "RPE 6-7",
      phase2: "RPE 6.5-7.5",
      phase3: "RPE 7-8",
      phase4: "RPE 5-6"
    },
    "power": {
      phase1: "RPE 8-9",
      phase2: "RPE 8.5-9",
      phase3: "RPE 9",
      phase4: "RPE 7-8"
    }
  } as const;

  /**
   * Calculate RPE based on goal, phase, exercise, and experience
   */
  static calculateRPE(
    goal: keyof typeof RPECalculator.GOAL_RPE_MAPPING,
    phase: 1 | 2 | 3 | 4,
    exercise: Exercise,
    experience: 'Beginner' | 'Intermediate' | 'Advanced'
  ): string {
    // Get base RPE for goal and phase
    const baseRPE = this.GOAL_RPE_MAPPING[goal]?.[`phase${phase}`] || "RPE 7-8";
    
    // Apply exercise-specific modifier
    const exerciseModifier = this.getExerciseModifier(exercise);
    
    // Apply experience modifier
    const experienceModifier = this.getExperienceModifier(experience);
    
    // Calculate final RPE
    const totalModifier = exerciseModifier + experienceModifier;
    const finalRPE = this.adjustRPE(baseRPE, totalModifier);
    
    return finalRPE;
  }

  /**
   * Get exercise-specific RPE modifier
   */
  private static getExerciseModifier(exercise: Exercise): number {
    const exerciseName = exercise.exercise_name.toLowerCase();
    const equipment = exercise.equipment?.toLowerCase() || '';
    const category = exercise.category?.toLowerCase() || '';
    
    // Check for compound movements
    if (this.isCompoundMovement(exerciseName)) {
      return +0.5;
    }
    
    // Check for isolation movements
    if (this.isIsolationMovement(exerciseName)) {
      return -0.5;
    }
    
    // Check for conditioning exercises
    if (this.isConditioningExercise(exerciseName)) {
      return -1.0;
    }
    
    // Check for core exercises (typically lower RPE)
    if (this.isCoreExercise(exerciseName, category)) {
      return -0.5;
    }
    
    // Check for stability/balance exercises
    if (this.isStabilityExercise(exerciseName, equipment)) {
      return -0.5;
    }
    
    // Check for bodyweight exercises
    if (equipment.includes('bodyweight') || this.isBodyweightExercise(exerciseName)) {
      return 0; // Neutral modifier for bodyweight
    }
    
    return 0; // Default modifier
  }

  /**
   * Get experience-based RPE modifier
   */
  private static getExperienceModifier(experience: string): number {
    const modifiers = {
      'Beginner': -0.5,
      'Intermediate': 0,
      'Advanced': +0.5
    };
    
    return modifiers[experience as keyof typeof modifiers] || 0;
  }

  /**
   * Adjust RPE string based on modifier
   */
  private static adjustRPE(baseRPE: string, modifier: number): string {
    if (modifier === 0) return baseRPE;
    
    // Parse RPE range (e.g., "RPE 7-8" -> [7, 8])
    const rpeMatch = baseRPE.match(/RPE (\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/);
    if (!rpeMatch) return baseRPE;
    
    const [_, minRPE, maxRPE] = rpeMatch;
    const adjustedMin = Math.max(1, Math.min(10, parseFloat(minRPE) + modifier));
    const adjustedMax = Math.max(1, Math.min(10, parseFloat(maxRPE) + modifier));
    
    // Format back to RPE string
    if (adjustedMin === adjustedMax) {
      return `RPE ${adjustedMin}`;
    } else {
      return `RPE ${adjustedMin}-${adjustedMax}`;
    }
  }

  /**
   * Movement classification helpers
   */
  private static isCompoundMovement(exerciseName: string): boolean {
    const compoundKeywords = [
      'deadlift', 'squat', 'bench press', 'overhead press', 
      'barbell row', 'power clean', 'snatch', 'thruster',
      'turkish get-up', 'clean', 'jerk'
    ];
    return compoundKeywords.some(keyword => exerciseName.includes(keyword));
  }

  private static isIsolationMovement(exerciseName: string): boolean {
    const isolationKeywords = [
      'curl', 'extension', 'fly', 'lateral raise', 'front raise',
      'tricep', 'bicep', 'calf raise', 'leg extension', 'leg curl',
      'external rotation', 'cuban press'
    ];
    return isolationKeywords.some(keyword => exerciseName.includes(keyword));
  }

  private static isConditioningExercise(exerciseName: string): boolean {
    const conditioningKeywords = [
      'burpee', 'mountain climber', 'jumping jack', 'high knee',
      'jump rope', 'box jump', 'wall ball', 'thruster',
      'slam ball', 'medicine ball throw'
    ];
    return conditioningKeywords.some(keyword => exerciseName.includes(keyword));
  }

  private static isCoreExercise(exerciseName: string, category: string): boolean {
    const coreKeywords = [
      'plank', 'crunch', 'sit-up', 'leg raise', 'ab wheel',
      'bird dog', 'dead bug', 'russian twist', 'flutter kicks',
      'heel taps', 'side plank', 'glute bridge'
    ];
    return coreKeywords.some(keyword => exerciseName.includes(keyword)) || 
           category.includes('core');
  }

  private static isStabilityExercise(exerciseName: string, equipment: string): boolean {
    const stabilityKeywords = [
      'stability ball', 'suspension', 'gymnastic rings', 'parallette',
      'balance', 'single leg', 'unilateral'
    ];
    const stabilityEquipment = [
      'stability ball', 'suspension trainer', 'gymnastic rings', 'parallette bars',
      'sliders', 'miniband'
    ];
    return stabilityKeywords.some(keyword => exerciseName.includes(keyword)) ||
           stabilityEquipment.some(eq => equipment.includes(eq));
  }

  private static isBodyweightExercise(exerciseName: string): boolean {
    const bodyweightKeywords = [
      'push-up', 'pull-up', 'dip', 'plank', 'crunch',
      'sit-up', 'mountain climber', 'burpee', 'bird dog',
      'dead bug', 'glute bridge', 'flutter kicks', 'heel taps'
    ];
    return bodyweightKeywords.some(keyword => exerciseName.includes(keyword));
  }
}

// RPE Scale for reference
export const RPE_SCALE = {
  1: "Very light - No exertion",
  2: "Light - Minimal exertion",
  3: "Moderate - Some exertion",
  4: "Somewhat hard - Moderate exertion",
  5: "Hard - Challenging exertion",
  6: "Harder - Difficult exertion",
  7: "Very hard - Very difficult",
  8: "Extremely hard - Extremely difficult",
  9: "Maximum effort - Almost maximum",
  10: "Maximum effort - Absolute maximum"
} as const;
