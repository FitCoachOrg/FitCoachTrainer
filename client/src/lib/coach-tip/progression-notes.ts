import { ProgressionContext } from './types';

export class ProgressionNoteGenerator {
  /**
   * Generate progression note based on context
   */
  static generateNote(context: ProgressionContext): string {
    const { currentPhase, previousPerformance, goal, sets, reps } = context;
    
    if (currentPhase === 1) {
      return "Start with baseline loading, focus on form";
    }
    
    if (previousPerformance?.improvement && previousPerformance.improvement > 0.1) {
      return `Progression applied: ${sets} sets, ${reps} reps (10% increase)`;
    }
    
    if (previousPerformance?.plateau) {
      return "Maintain current loading, focus on form and consistency";
    }
    
    if (previousPerformance?.regression) {
      return "Reduced loading to focus on form and recovery";
    }
    
    return ""; // Don't show generic progression message
  }
}
