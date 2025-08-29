export class InjuryNoteGenerator {
  /**
   * Generate injury-specific notes
   */
  static getNotes(injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>): string {
    if (!injuries || injuries.length === 0) {
      return "";
    }
    
    const injuryNames = injuries.map(injury => injury.injury).join(', ');
    return `Selected to avoid: ${injuryNames}`;
  }

  /**
   * Check if exercise should be avoided due to injuries
   */
  static shouldAvoidExercise(
    exercise: { exercise_name: string; primary_muscle: string; secondary_muscles?: string[] },
    injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>
  ): boolean {
    if (!injuries || injuries.length === 0) {
      return false;
    }

    const exerciseMuscles = [
      exercise.primary_muscle.toLowerCase(),
      ...(exercise.secondary_muscles || []).map(m => m.toLowerCase())
    ];

    return injuries.some(injury => 
      injury.affectedMuscles.some(affectedMuscle => 
        exerciseMuscles.some(exerciseMuscle => 
          exerciseMuscle.includes(affectedMuscle.toLowerCase()) ||
          affectedMuscle.toLowerCase().includes(exerciseMuscle)
        )
      )
    );
  }
}
