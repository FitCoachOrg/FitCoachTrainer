import { Exercise } from './types';

export class FormCueGenerator {
  private static readonly EXERCISE_FORM_CUES = {
    // Compound Movements
    "deadlift": [
      "Keep chest up throughout the movement",
      "Push through your heels",
      "Keep the bar close to your shins",
      "Brace your core throughout the lift",
      "Hinge at the hips, not the waist"
    ],
    "squat": [
      "Knees track over your toes",
      "Keep your chest up",
      "Push through your full foot",
      "Brace your core",
      "Go to parallel or below"
    ],
    "bench press": [
      "Retract your scapula",
      "Keep your feet flat on the ground",
      "Control the descent",
      "Drive through your full foot",
      "Keep your elbows at 45 degrees"
    ],
    "overhead press": [
      "Keep your core tight",
      "Press directly overhead",
      "Don't lean back excessively",
      "Keep your head forward",
      "Brace your core throughout"
    ],
    
    // Upper Body Isolation
    "curl": [
      "Keep your elbows at your sides",
      "Control the movement",
      "Don't swing the weight",
      "Squeeze at the top",
      "Full range of motion"
    ],
    "push-up": [
      "Keep your body in a straight line",
      "Lower your chest to the ground",
      "Engage your core",
      "Full range of motion",
      "Keep your elbows at 45 degrees"
    ],
    "pull-up": [
      "Pull your elbows to your sides",
      "Engage your lats",
      "Full range of motion",
      "Control the descent",
      "Keep your core tight"
    ],
    
    // Core Exercises (from database)
    "plank": [
      "Keep your body in a straight line",
      "Engage your core",
      "Don't let your hips sag",
      "Breathe steadily",
      "Hold the position"
    ],
    "crunch": [
      "Keep your lower back on the ground",
      "Engage your abs",
      "Don't pull on your neck",
      "Control the movement",
      "Focus on the contraction"
    ],
    "russian twist": [
      "Keep your core engaged",
      "Rotate from your torso",
      "Keep your feet off the ground",
      "Control the movement",
      "Focus on oblique contraction"
    ],
    "bird dog": [
      "Keep your core stable",
      "Extend opposite arm and leg",
      "Maintain balance",
      "Keep your back straight",
      "Control the movement"
    ],
    "dead bug": [
      "Keep your lower back pressed to the ground",
      "Extend opposite arm and leg",
      "Maintain core tension",
      "Control the movement",
      "Don't let your back arch"
    ],
    "glute bridge": [
      "Keep your feet flat on the ground",
      "Drive through your heels",
      "Squeeze your glutes at the top",
      "Keep your core engaged",
      "Control the movement"
    ],
    "mountain climber": [
      "Keep your body in a straight line",
      "Drive your knees toward your chest",
      "Engage your core",
      "Maintain plank position",
      "Keep your hips level"
    ],
    "flutter kicks": [
      "Keep your lower back on the ground",
      "Engage your core",
      "Keep your legs straight",
      "Control the movement",
      "Focus on lower abs"
    ],
    "heel taps": [
      "Keep your lower back on the ground",
      "Engage your core",
      "Tap your heels alternately",
      "Control the movement",
      "Don't let your back arch"
    ],
    "side plank": [
      "Keep your body in a straight line",
      "Engage your core",
      "Stack your feet",
      "Hold the position",
      "Don't let your hips sag"
    ],
    "ab wheel": [
      "Keep your core tight",
      "Control the rollout",
      "Don't let your hips sag",
      "Roll out as far as you can control",
      "Pull back with your core"
    ],
    "hanging": [
      "Keep your core engaged",
      "Control the movement",
      "Full range of motion",
      "Don't swing",
      "Focus on the target muscles"
    ],
    "suspension": [
      "Maintain body tension",
      "Control the movement",
      "Adjust difficulty with foot position",
      "Keep your core engaged",
      "Focus on stability"
    ],
    "stability ball": [
      "Maintain ball stability",
      "Control the movement",
      "Engage your core throughout",
      "Keep your balance",
      "Focus on the target muscles"
    ],
    "medicine ball": [
      "Control the ball",
      "Maintain proper form",
      "Focus on power transfer",
      "Engage your core",
      "Follow through with the movement"
    ],
    "slam ball": [
      "Control the slam",
      "Maintain proper form",
      "Focus on explosive movement",
      "Engage your core",
      "Absorb the impact properly"
    ],
    "cable": [
      "Maintain cable tension",
      "Control the movement",
      "Full range of motion",
      "Keep your core engaged",
      "Focus on the target muscles"
    ],
    "miniband": [
      "Maintain band tension",
      "Control the movement",
      "Focus on resistance",
      "Keep proper form",
      "Don't let the band slack"
    ],
    "sliders": [
      "Control the slide",
      "Maintain stability",
      "Focus on smooth movement",
      "Keep your core engaged",
      "Don't let your form break"
    ],
    "parallette": [
      "Maintain proper hand position",
      "Control the movement",
      "Keep your body aligned",
      "Engage your core",
      "Focus on stability"
    ],
    "gymnastic rings": [
      "Maintain ring stability",
      "Control the movement",
      "Focus on shoulder stability",
      "Keep your core engaged",
      "Don't let the rings swing"
    ]
  } as const;

  /**
   * Get form cues for a specific exercise
   */
  static getFormCues(exercise: Exercise, maxCues: number = 2): string[] {
    const exerciseName = exercise.exercise_name.toLowerCase();
    
    // Find exact match first
    for (const [pattern, cues] of Object.entries(this.EXERCISE_FORM_CUES)) {
      if (exerciseName.includes(pattern)) {
        return cues.slice(0, maxCues);
      }
    }
    
    // Fallback to movement pattern cues
    const patternCues = this.getMovementPatternCues(exercise);
    if (patternCues.length > 0) {
      return patternCues.slice(0, maxCues);
    }
    
    // Default cues
    return ["Focus on proper form", "Control the movement"];
  }

  /**
   * Get movement pattern-based cues
   */
  private static getMovementPatternCues(exercise: Exercise): string[] {
    const exerciseName = exercise.exercise_name.toLowerCase();
    
    const movementPatterns = {
      "hinge": ["Hinge at the hips, not the waist", "Keep your back straight"],
      "squat": ["Knees track over toes", "Keep chest up"],
      "push": ["Keep core engaged", "Full range of motion"],
      "pull": ["Engage lats", "Keep shoulders down"],
      "carry": ["Keep core tight", "Maintain posture"],
      "rotation": ["Control the movement", "Engage obliques"],
      "core": ["Keep your core engaged", "Control the movement"],
      "stability": ["Maintain stability", "Keep your core engaged"],
      "balance": ["Maintain balance", "Keep your core engaged"]
    };
    
    for (const [pattern, cues] of Object.entries(movementPatterns)) {
      if (this.matchesMovementPattern(exerciseName, pattern)) {
        return cues;
      }
    }
    
    return [];
  }

  /**
   * Check if exercise matches a movement pattern
   */
  private static matchesMovementPattern(exerciseName: string, pattern: string): boolean {
    const patternExercises = {
      "hinge": ["deadlift", "romanian deadlift", "good morning", "kettlebell swing"],
      "squat": ["squat", "lunge", "step-up", "wall sit", "goblet squat"],
      "push": ["bench press", "push-up", "overhead press", "dip", "shoulder press"],
      "pull": ["pull-up", "row", "lat pulldown", "face pull", "barbell row"],
      "carry": ["farmer's walk", "suitcase carry", "waiter's walk", "rack carry"],
      "rotation": ["russian twist", "wood chop", "pallof press", "cable rotation"],
      "core": ["plank", "crunch", "sit-up", "leg raise", "ab wheel", "bird dog", "dead bug"],
      "stability": ["stability ball", "suspension", "gymnastic rings", "parallette"],
      "balance": ["single leg", "balance", "stability", "unilateral"]
    };
    
    const exercises = patternExercises[pattern as keyof typeof patternExercises] || [];
    return exercises.some(ex => exerciseName.includes(ex));
  }
}
