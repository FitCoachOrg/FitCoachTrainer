// Core interfaces for the Coach Tip system
export interface Exercise {
  exercise_name: string;
  category: string;
  body_part: string;
  equipment: string;
  experience_level: string;
  primary_muscle: string;
  secondary_muscles?: string[];
}

export interface CoachTipContext {
  goal: 'fat_loss' | 'hypertrophy' | 'strength' | 'endurance' | 'power';
  phase: 1 | 2 | 3 | 4;
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  injuries: Array<{ injury: string; severity: string; affectedMuscles: string[] }>;
  progression?: ProgressionContext;
  equipment?: string;
}

export interface CoachTipComponents {
  rpe: string;
  tempo?: string;
  formCues: string[];
  equipmentNotes?: string;
  progressionNotes?: string;
  injuryNotes?: string;
  breathingCues?: string;
}

export interface ProgressionContext {
  currentPhase: number;
  previousPerformance?: {
    improvement?: number;
    plateau?: boolean;
    regression?: boolean;
  };
  goal: string;
  sets: number;
  reps: string;
}

export interface QualityReport {
  totalTips: number;
  validTips: number;
  qualityScore: number;
  averageLength: number;
}
