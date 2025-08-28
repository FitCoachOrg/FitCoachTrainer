// Main export file for the Coach Tip system
export { CoachTipGenerator } from './coach-tip-generator';
export { RPECalculator, RPE_SCALE } from './rpe-calculator';
export { TempoGenerator, TEMPO_FORMAT } from './tempo-recommendations';
export { FormCueGenerator } from './form-cues-database';
export { EquipmentNoteGenerator } from './equipment-notes';
export { ProgressionNoteGenerator } from './progression-notes';
export { InjuryNoteGenerator } from './injury-notes';
export { CoachTipUtils } from './utils';

// Types
export type {
  Exercise,
  CoachTipContext,
  CoachTipComponents,
  ProgressionContext,
  QualityReport
} from './types';
