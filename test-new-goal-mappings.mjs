import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test the new goal mappings
async function testNewGoalMappings() {
  console.log('🧪 === TESTING NEW GOAL MAPPINGS ===\n');

  // Test data for different goals
  const testGoals = [
    'tone_and_sculpt',
    'build_endurance', 
    'sport_performance',
    'core_abs_focus',
    'functional_movement'
  ];

  for (const goal of testGoals) {
    console.log(`📋 Testing goal: "${goal}"`);
    
    // Create a test client with the goal
    const testClient = {
      client_id: 999, // Test ID
      cl_primary_goal: goal,
      training_experience: 'beginner',
      training_time_per_session: '45_minutes',
      workout_days: ['mon', 'wed', 'fri'],
      available_equipment: ['dumbbells'],
      focus_areas: ['full_body'],
      injuries_limitations: null
    };

    // Simulate the goal mapping logic
    const GOAL_MAPPING = {
      "improve_health": "endurance",
      "build_muscle": "hypertrophy", 
      "lose_weight": "fat_loss",
      "get_stronger": "strength",
      "improve_fitness": "endurance",
      "tone_and_sculpt": "hypertrophy", // (lighter volume)
      "build_endurance": "endurance",
      "sport_performance": "power",
      "core_abs_focus": "core_stability",
      "functional_movement": "endurance" // or hybrid approach
    };

    const WORKOUT_TEMPLATES = {
      "endurance": {
        sets: 3,
        reps: "15-25",
        rest: 40,
        exercises_per_day: 4
      },
      "hypertrophy": {
        sets: 4,
        reps: "8-12", 
        rest: 75,
        exercises_per_day: 4
      },
      "strength": {
        sets: 4,
        reps: "3-6",
        rest: 150,
        exercises_per_day: 3
      },
      "fat_loss": {
        sets: 3,
        reps: "10-15",
        rest: 45,
        exercises_per_day: 5
      },
      "power": {
        sets: 4,
        reps: "1-3",
        rest: 210,
        exercises_per_day: 3
      },
      "core_stability": {
        sets: 3,
        reps: "8-15",
        rest: 60,
        exercises_per_day: 4
      }
    };

    // Map the goal
    const mappedGoal = GOAL_MAPPING[goal] || "endurance";
    console.log(`   → Mapped to: "${mappedGoal}"`);

    // Get the template
    const template = WORKOUT_TEMPLATES[mappedGoal];
    if (template) {
      console.log(`   → Template: ${template.sets} sets, ${template.reps} reps, ${template.rest}s rest`);
    } else {
      console.log(`   ❌ No template found for "${mappedGoal}"`);
    }

    // Special handling for tone_and_sculpt
    if (goal === 'tone_and_sculpt') {
      const toneTemplate = {
        ...template,
        sets: 2, // Lighter volume: 2-3 sets
        reps: "10-15", // Lighter volume: 10-15 reps
        rest: 60, // 60s rest
        exercises_per_day: 4
      };
      console.log(`   🎨 Tone & Sculpt template: ${toneTemplate.sets} sets, ${toneTemplate.reps} reps, ${toneTemplate.rest}s rest`);
    }

    console.log('');
  }

  console.log('✅ Goal mapping test completed!');
}

// Test the changes
testNewGoalMappings().catch(console.error);
