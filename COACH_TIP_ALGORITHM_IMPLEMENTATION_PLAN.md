# Coach Tip Algorithm Implementation Plan

## **📋 Project Overview**

### **Objective**
Create a comprehensive, rule-based Coach Tip generation system that provides personalized, actionable coaching guidance without AI dependencies.

### **Goals**
- ✅ Generate consistent, high-quality coach tips for every exercise
- ✅ Provide goal-specific RPE recommendations
- ✅ Include exercise-specific form cues and tempo guidance
- ✅ Support experience-level and injury-based customization
- ✅ Ensure instant, reliable generation with no external dependencies

---

## **🏗️ System Architecture**

### **1. Core Components**

#### **A. RPE Calculation Engine**
```typescript
interface RPECalculationEngine {
  calculateRPE(goal: string, phase: number, exercise: Exercise, experience: string): string;
  getExerciseModifier(exercise: Exercise): number;
  getExperienceModifier(experience: string): number;
  adjustRPE(baseRPE: string, modifier: number): string;
}
```

#### **B. Coach Tip Generator**
```typescript
interface CoachTipGenerator {
  generateCoachTip(exercise: Exercise, context: CoachTipContext): string;
  getFormCues(exercise: Exercise): string[];
  getTempoRecommendation(goal: string, exercise: Exercise): string;
  getEquipmentNotes(exercise: Exercise): string;
  getProgressionNotes(context: CoachTipContext): string;
}
```

#### **C. Exercise Database**
```typescript
interface ExerciseDatabase {
  formCues: Record<string, string[]>;
  tempoRecommendations: Record<string, Record<string, string>>;
  equipmentNotes: Record<string, string>;
  breathingCues: Record<string, string>;
}
```

### **2. Data Flow**

```
Exercise Data → RPE Calculator → Coach Tip Generator → Formatted Output
     ↓              ↓                    ↓                    ↓
Exercise Name → Goal + Phase → Form Cues + Tempo → Final Coach Tip
Experience    → Modifiers    → Equipment Notes   → "RPE 7-8, 3-1-3 tempo, keep chest up"
Injuries      → Final RPE    → Progression Notes → "brace core, progression applied"
```

---

## **📊 Implementation Phases**

### **Phase 1: Core RPE System (Week 1)**

#### **A. RPE Calculation Framework**
```typescript
// File: src/lib/coach-tip/rpe-calculator.ts
export class RPECalculator {
  private static GOAL_RPE_MAPPING = {
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
    }
  };

  static calculateRPE(goal: string, phase: number, exercise: Exercise, experience: string): string {
    // Implementation details
  }
}
```

#### **B. Exercise-Specific Modifiers**
```typescript
// File: src/lib/coach-tip/exercise-modifiers.ts
export const EXERCISE_RPE_MODIFIERS = {
  // Compound movements - higher RPE
  "deadlift": { modifier: +0.5, reason: "Compound movement" },
  "squat": { modifier: +0.5, reason: "Compound movement" },
  "bench press": { modifier: +0.5, reason: "Compound movement" },
  "overhead press": { modifier: +0.5, reason: "Compound movement" },
  "barbell row": { modifier: +0.5, reason: "Compound movement" },
  
  // Isolation movements - lower RPE
  "curl": { modifier: -0.5, reason: "Isolation movement" },
  "extension": { modifier: -0.5, reason: "Isolation movement" },
  "fly": { modifier: -0.5, reason: "Isolation movement" },
  "lateral raise": { modifier: -0.5, reason: "Isolation movement" },
  
  // Bodyweight exercises - moderate RPE
  "push-up": { modifier: 0, reason: "Bodyweight exercise" },
  "pull-up": { modifier: 0, reason: "Bodyweight exercise" },
  "dip": { modifier: 0, reason: "Bodyweight exercise" },
  "plank": { modifier: 0, reason: "Bodyweight exercise" },
  
  // Cardio/conditioning - lower RPE
  "burpee": { modifier: -1, reason: "High-intensity conditioning" },
  "mountain climber": { modifier: -1, reason: "Conditioning exercise" },
  "jumping jack": { modifier: -1, reason: "Conditioning exercise" },
  "high knee": { modifier: -1, reason: "Conditioning exercise" }
};
```

#### **C. Experience-Based Modifiers**
```typescript
// File: src/lib/coach-tip/experience-modifiers.ts
export const EXPERIENCE_RPE_MODIFIERS = {
  "Beginner": { 
    modifier: -0.5, 
    reason: "Focus on form over intensity",
    additionalNotes: "Start with lighter weights to perfect form"
  },
  "Intermediate": { 
    modifier: 0, 
    reason: "Standard RPE",
    additionalNotes: "Balance intensity with proper form"
  },
  "Advanced": { 
    modifier: +0.5, 
    reason: "Can handle higher intensity",
    additionalNotes: "Push intensity while maintaining form"
  }
};
```

### **Phase 2: Form Cues Database (Week 2)**

#### **A. Exercise-Specific Form Cues**
```typescript
// File: src/lib/coach-tip/form-cues-database.ts
export const EXERCISE_FORM_CUES = {
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
  
  // Lower Body
  "lunge": [
    "Keep your front knee over your toe",
    "Lower your back knee toward the ground",
    "Keep your torso upright",
    "Push through your front foot",
    "Keep your core engaged"
  ],
  "calf raise": [
    "Full range of motion",
    "Squeeze at the top",
    "Control the descent",
    "Keep your knees straight",
    "Focus on the contraction"
  ],
  
  // Core Exercises
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
  ]
};
```

#### **B. Movement Pattern Recognition**
```typescript
// File: src/lib/coach-tip/movement-patterns.ts
export const MOVEMENT_PATTERNS = {
  "hinge": ["deadlift", "romanian deadlift", "good morning"],
  "squat": ["squat", "lunge", "step-up", "wall sit"],
  "push": ["bench press", "push-up", "overhead press", "dip"],
  "pull": ["pull-up", "row", "lat pulldown", "face pull"],
  "carry": ["farmer's walk", "suitcase carry", "waiter's walk"],
  "rotation": ["russian twist", "wood chop", "pallof press"]
};

export const PATTERN_FORM_CUES = {
  "hinge": ["Hinge at the hips, not the waist", "Keep your back straight"],
  "squat": ["Knees track over toes", "Keep chest up"],
  "push": ["Keep core engaged", "Full range of motion"],
  "pull": ["Engage lats", "Keep shoulders down"],
  "carry": ["Keep core tight", "Maintain posture"],
  "rotation": ["Control the movement", "Engage obliques"]
};
```

### **Phase 3: Tempo Recommendations (Week 3)**

#### **A. Goal-Based Tempo System**
```typescript
// File: src/lib/coach-tip/tempo-recommendations.ts
export const TEMPO_RECOMMENDATIONS = {
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
};
```

#### **B. Exercise-Specific Tempo Adjustments**
```typescript
export const EXERCISE_TEMPO_ADJUSTMENTS = {
  // Bodyweight exercises - faster tempo
  "push-up": { adjustment: "1-0-1", reason: "Bodyweight exercise" },
  "pull-up": { adjustment: "2-0-1", reason: "Bodyweight exercise" },
  "dip": { adjustment: "2-0-1", reason: "Bodyweight exercise" },
  
  // Isolation exercises - standard tempo
  "curl": { adjustment: "2-1-2", reason: "Isolation movement" },
  "extension": { adjustment: "2-1-2", reason: "Isolation movement" },
  
  // Compound exercises - use goal-based tempo
  "deadlift": { adjustment: "goal-based", reason: "Compound movement" },
  "squat": { adjustment: "goal-based", reason: "Compound movement" },
  "bench press": { adjustment: "goal-based", reason: "Compound movement" }
};
```

### **Phase 4: Equipment & Progression Notes (Week 4)**

#### **A. Equipment-Specific Notes**
```typescript
// File: src/lib/coach-tip/equipment-notes.ts
export const EQUIPMENT_NOTES = {
  "bodyweight": {
    note: "No equipment needed",
    tips: ["Focus on form", "Full range of motion", "Control the movement"]
  },
  "dumbbell": {
    note: "Dumbbell exercise",
    tips: ["Keep weights controlled", "Maintain balance", "Full range of motion"]
  },
  "barbell": {
    note: "Barbell exercise",
    tips: ["Proper grip", "Keep bar path straight", "Brace core"]
  },
  "machine": {
    note: "Machine exercise",
    tips: ["Adjust seat/backrest", "Follow machine path", "Control the movement"]
  },
  "cable": {
    note: "Cable exercise",
    tips: ["Maintain cable tension", "Control the movement", "Full range of motion"]
  },
  "kettlebell": {
    note: "Kettlebell exercise",
    tips: ["Proper grip", "Control the swing", "Engage core"]
  }
};
```

#### **B. Progression Tracking**
```typescript
// File: src/lib/coach-tip/progression-notes.ts
export class ProgressionNoteGenerator {
  static generateProgressionNote(context: ProgressionContext): string {
    const { currentPhase, previousPerformance, goal } = context;
    
    if (currentPhase === 1) {
      return "Start with baseline loading, focus on form";
    }
    
    if (previousPerformance?.improvement > 0.1) {
      return `Progression applied: ${context.sets} sets, ${context.reps} reps (10% increase)`;
    }
    
    if (previousPerformance?.plateau) {
      return "Maintain current loading, focus on form and consistency";
    }
    
    return "Progressive loading will be applied based on performance";
  }
}
```

### **Phase 5: Integration & Testing (Week 5)**

#### **A. Main Coach Tip Generator**
```typescript
// File: src/lib/coach-tip/coach-tip-generator.ts
export class CoachTipGenerator {
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
      progressionNotes: ProgressionNoteGenerator.generateNote(context),
      injuryNotes: InjuryNoteGenerator.getNotes(context.injuries)
    };
    
    return this.formatCoachTip(components);
  }
  
  private static formatCoachTip(components: CoachTipComponents): string {
    const parts = [];
    
    // RPE and Tempo
    parts.push(`${components.rpe}`);
    if (components.tempo) {
      parts.push(`${components.tempo} tempo`);
    }
    
    // Form cues (top 2)
    if (components.formCues.length > 0) {
      parts.push(components.formCues.slice(0, 2).join(', '));
    }
    
    // Equipment notes
    if (components.equipmentNotes) {
      parts.push(components.equipmentNotes);
    }
    
    // Progression notes
    if (components.progressionNotes) {
      parts.push(components.progressionNotes);
    }
    
    // Injury notes
    if (components.injuryNotes) {
      parts.push(components.injuryNotes);
    }
    
    return parts.join(', ');
  }
}
```

#### **B. Integration with Existing Systems**
```typescript
// File: src/lib/enhanced-workout-generator.ts (modification)
import { CoachTipGenerator } from './coach-tip/coach-tip-generator';

// Replace existing generateTrainerNotes with:
private static generateTrainerNotes(exercise: any, context: any): string {
  return CoachTipGenerator.generateCoachTip(exercise, {
    goal: context.goal || 'fat_loss',
    phase: context.phase || 1,
    experience: context.experience || 'Beginner',
    injuries: context.injuries || [],
    progression: context.progression
  });
}
```

---

## **🧪 Testing Strategy**

### **1. Unit Tests**
```typescript
// File: src/lib/coach-tip/__tests__/rpe-calculator.test.ts
describe('RPECalculator', () => {
  test('should calculate correct RPE for fat loss phase 1', () => {
    const rpe = RPECalculator.calculateRPE('fat_loss', 1, mockExercise, 'Intermediate');
    expect(rpe).toBe('RPE 7-8');
  });
  
  test('should apply exercise modifier for deadlift', () => {
    const rpe = RPECalculator.calculateRPE('strength', 1, deadliftExercise, 'Advanced');
    expect(rpe).toBe('RPE 7.5');
  });
});
```

### **2. Integration Tests**
```typescript
// File: src/lib/coach-tip/__tests__/coach-tip-generator.test.ts
describe('CoachTipGenerator', () => {
  test('should generate complete coach tip for deadlift', () => {
    const coachTip = CoachTipGenerator.generateCoachTip(deadliftExercise, context);
    expect(coachTip).toContain('RPE 7-8');
    expect(coachTip).toContain('3-1-3 tempo');
    expect(coachTip).toContain('keep chest up');
  });
});
```

### **3. Performance Tests**
```typescript
// File: src/lib/coach-tip/__tests__/performance.test.ts
describe('Performance', () => {
  test('should generate 100 coach tips in under 100ms', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      CoachTipGenerator.generateCoachTip(mockExercise, context);
    }
    const end = performance.now();
    expect(end - start).toBeLessThan(100);
  });
});
```

---

## **📈 Success Metrics**

### **1. Quality Metrics**
- ✅ **Coach tip completeness**: 95% of tips include RPE, tempo, and form cues
- ✅ **Exercise coverage**: 90% of exercises have specific form cues
- ✅ **Goal alignment**: 100% of RPE values align with client goals

### **2. Performance Metrics**
- ⚡ **Generation speed**: <1ms per coach tip
- 🔄 **Reliability**: 100% uptime (no external dependencies)
- 💰 **Cost**: $0 (no AI API calls)

### **3. User Experience Metrics**
- 📊 **Client satisfaction**: Measured through feedback
- 🎯 **Exercise adherence**: Track if clients follow coach tips
- 📈 **Progress tracking**: Monitor if RPE guidance improves results

---

## **🚀 Deployment Plan**

### **Week 1: Core RPE System**
- ✅ Implement RPE calculation framework
- ✅ Add exercise and experience modifiers
- ✅ Create basic unit tests

### **Week 2: Form Cues Database**
- ✅ Build comprehensive form cues database
- ✅ Implement movement pattern recognition
- ✅ Add pattern-specific form cues

### **Week 3: Tempo System**
- ✅ Implement goal-based tempo recommendations
- ✅ Add exercise-specific tempo adjustments
- ✅ Create tempo validation tests

### **Week 4: Equipment & Progression**
- ✅ Build equipment-specific notes
- ✅ Implement progression tracking
- ✅ Add injury-based modifications

### **Week 5: Integration & Testing**
- ✅ Integrate with existing workout generators
- ✅ Comprehensive testing suite
- ✅ Performance optimization
- ✅ Documentation and deployment

---

## **📚 Documentation**

### **1. API Documentation**
- ✅ Complete TypeScript interfaces
- ✅ Usage examples for each component
- ✅ Integration guides

### **2. User Documentation**
- ✅ Coach tip interpretation guide
- ✅ RPE scale explanation
- ✅ Tempo instruction guide

### **3. Maintenance Documentation**
- ✅ Adding new exercises
- ✅ Updating form cues
- ✅ Modifying RPE calculations

---

## **🎯 Expected Outcomes**

### **Before Implementation**
```
Coach Tip: "Focus on proper form"
RPE: "RPE 7-8" (static)
Tempo: None
Form Cues: Generic
```

### **After Implementation**
```
Coach Tip: "RPE 7-8, 3-1-3 tempo, keep chest up, brace core, progression applied: 3 sets, 10-12 reps"
RPE: Dynamic based on goal, phase, exercise, experience
Tempo: Goal and exercise-specific
Form Cues: Exercise-specific, actionable
```

This implementation will provide **comprehensive, personalized, and actionable coaching guidance** while maintaining **instant generation, zero costs, and 100% reliability**.
