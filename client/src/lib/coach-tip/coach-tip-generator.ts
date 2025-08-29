import { Exercise, CoachTipContext, CoachTipComponents } from './types';
import { RPECalculator } from './rpe-calculator';
import { TempoGenerator } from './tempo-recommendations';
import { FormCueGenerator } from './form-cues-database';
import { EquipmentNoteGenerator } from './equipment-notes';
import { ProgressionNoteGenerator } from './progression-notes';
import { InjuryNoteGenerator } from './injury-notes';

export class CoachTipGenerator {
  /**
   * Generate a complete coach tip for an exercise
   * @param exercise - The exercise object
   * @param context - The coaching context (goal, phase, experience, etc.)
   * @returns Formatted coach tip string
   */
  static generateCoachTip(
    exercise: Exercise,
    context: CoachTipContext
  ): string {
    const components = {
      rpe: RPECalculator.calculateRPE(
        context.goal,
        context.phase,
        exercise,
        context.experience
      ),
      tempo: TempoGenerator.getTempo(context.goal, exercise),
      formCues: FormCueGenerator.getFormCues(exercise),
      equipmentNotes: EquipmentNoteGenerator.getNotes(exercise),
      progressionNotes: context.progression ? ProgressionNoteGenerator.generateNote(context.progression) : undefined,
      injuryNotes: InjuryNoteGenerator.getNotes(context.injuries)
    };
    
    return this.formatCoachTip(components);
  }

  /**
   * Format coach tip components into a readable string
   * Only includes RPE info and proper form info as requested
   */
  private static formatCoachTip(components: CoachTipComponents): string {
    const parts = [];

    // RPE and Tempo (keep these)
    parts.push(`${components.rpe}`);
    if (components.tempo) {
      parts.push(`${components.tempo} tempo`);
    }

    // Form cues (keep these - top 2 for proper form)
    if (components.formCues.length > 0) {
      parts.push(components.formCues.slice(0, 2).join(', '));
    }

    // REMOVED: Equipment notes - not needed
    // REMOVED: Progression notes - not needed
    // REMOVED: Injury notes - not needed

    // Join all parts and clean up any newlines or extra spaces
    return parts.join(', ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate a simple coach tip (for backward compatibility)
   */
  static generateSimpleCoachTip(exercise: Exercise, goal: string = 'fat_loss'): string {
    return this.generateCoachTip(exercise, {
      goal: goal as any,
      phase: 1,
      experience: 'Intermediate',
      injuries: [],
      progression: undefined
    });
  }
}
