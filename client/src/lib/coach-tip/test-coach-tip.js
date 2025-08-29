// Test file for Coach Tip system
import { CoachTipGenerator, CoachTipUtils } from './index.js';

// Test exercises
const testExercises = [
  {
    exercise_name: 'Deadlift',
    category: 'Strength',
    body_part: 'Full Body',
    equipment: 'Barbell',
    experience_level: 'Intermediate',
    primary_muscle: 'Lower Back'
  },
  {
    exercise_name: 'Push-up',
    category: 'Strength',
    body_part: 'Upper Body',
    equipment: 'Bodyweight',
    experience_level: 'Beginner',
    primary_muscle: 'Chest'
  },
  {
    exercise_name: 'Bicep Curl',
    category: 'Strength',
    body_part: 'Upper Body',
    equipment: 'Dumbbell',
    experience_level: 'Advanced',
    primary_muscle: 'Biceps'
  }
];

// Test contexts
const testContexts = [
  {
    goal: 'strength',
    phase: 1,
    experience: 'Intermediate',
    injuries: [],
    progression: undefined
  },
  {
    goal: 'fat_loss',
    phase: 2,
    experience: 'Beginner',
    injuries: [{ injury: 'knee', severity: 'moderate', affectedMuscles: ['quadriceps'] }],
    progression: undefined
  },
  {
    goal: 'hypertrophy',
    phase: 3,
    experience: 'Advanced',
    injuries: [],
    progression: {
      currentPhase: 3,
      previousPerformance: { improvement: 0.15 },
      goal: 'hypertrophy',
      sets: 4,
      reps: '8-12'
    }
  }
];

console.log('🧪 Testing Coach Tip System\n');

// Test each exercise with each context
testExercises.forEach((exercise, exerciseIndex) => {
  console.log(`\n📋 Exercise ${exerciseIndex + 1}: ${exercise.exercise_name}`);
  console.log('─'.repeat(50));
  
  testContexts.forEach((context, contextIndex) => {
    console.log(`\n🎯 Context ${contextIndex + 1}: ${context.goal} (Phase ${context.phase}) - ${context.experience}`);
    
    try {
      const coachTip = CoachTipGenerator.generateCoachTip(exercise, context);
      console.log(`✅ Coach Tip: ${coachTip}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });
});

// Test utility functions
console.log('\n🔧 Testing Utility Functions');
console.log('─'.repeat(50));

const testExercise = testExercises[0];
const normalizedExercise = CoachTipUtils.normalizeExercise(testExercise);
console.log(`✅ Normalized Exercise:`, normalizedExercise);

const rpeValue = CoachTipUtils.extractRPE('RPE 7-8');
console.log(`✅ Extracted RPE: ${rpeValue}`);

const sanitizedName = CoachTipUtils.sanitizeExerciseName('Dead-lift (Barbell)');
console.log(`✅ Sanitized Name: ${sanitizedName}`);

console.log('\n🎉 Coach Tip System Test Complete!');
