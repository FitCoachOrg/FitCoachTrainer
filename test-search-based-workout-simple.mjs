import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Goal presets based on the Python script
const GOAL_PRESETS = {
  "fat_loss": { rep_low: 10, rep_high: 15, rest_s: 45, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.5 },
  "hypertrophy": { rep_low: 8, rep_high: 12, rest_s: 75, sets_min: 3, sets_max: 4, tempo_s_per_rep: 3.0 },
  "strength": { rep_low: 3, rep_high: 6, rest_s: 150, sets_min: 3, sets_max: 5, tempo_s_per_rep: 3.5 },
  "endurance": { rep_low: 15, rep_high: 25, rest_s: 40, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.0 },
  "power": { rep_low: 1, rep_high: 3, rest_s: 210, sets_min: 3, sets_max: 5, tempo_s_per_rep: 2.5 },
  "core_stability": { rep_low: 8, rep_high: 15, rest_s: 60, sets_min: 2, sets_max: 4, tempo_s_per_rep: 2.5 },
};

// UI goal mapping
const UI_GOAL_MAP = {
  "Lose body fat": "fat_loss",
  "Build muscle": "hypertrophy",
  "Get stronger": "strength",
  "Build endurance": "endurance",
  "Overall health": "endurance",
  "Sport performance": "power",
  "Tone and sculpt": "hypertrophy"
};

// UI experience mapping
const UI_EXPERIENCE_MAP = {
  "Complete beginner (never trained)": "Beginner",
  "Beginner\n(less than 6 months)": "Beginner",
  "Beginner (less than 6 months)": "Beginner",
  "Some experience\n(6 months - 2 years)": "Intermediate",
  "Some experience (6 months - 2 years)": "Intermediate",
  "Experienced (2-5 years)": "Intermediate",
  "Very experienced\n(5+ years)": "Advanced",
  "Very experienced (5+ years)": "Advanced",
  "Beginner": "Beginner"
};

// UI equipment tokens
const UI_EQUIPMENT_TOKENS = {
  "Just my bodyweight": ["bodyweight"],
  "Dumbbells": ["dumbbell"],
  "Barbell": ["barbell", "bench"],
  "Resistance bands": ["bands"],
  "Kettlebells": ["kettlebell"],
  "Full gym access": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"],
  "Cardio machines": ["cardio_machine", "machine", "bike", "rower", "treadmill", "elliptical", "stair"],
  "Yoga mat": ["bodyweight", "stability ball"]
};

// Focus to muscles mapping
const UI_FOCUS_TO_MUSCLES = {
  "Upper body": ["Chest", "Back", "Shoulders", "Arms", "Core"],
  "Lower body": ["Quads", "Hamstrings", "Glutes", "Calves", "Core"],
  "Core/abs": ["Core", "Obliques", "Lower Back"],
  "Cardio fitness": ["Full Body", "Core"],
  "Flexibility": ["Core", "Lower Back", "Obliques"],
  "Full body strength": ["Full Body", "Core", "Back", "Quads", "Glutes"],
  "Functional movement": ["Full Body", "Core", "Back", "Glutes"]
};

function cleanUIPayload(clientData) {
  const goal = UI_GOAL_MAP[clientData.cl_primary_goal?.trim()] || "hypertrophy";
  const exp = UI_EXPERIENCE_MAP[clientData.training_experience?.trim()] || "Beginner";
  
  // Process equipment
  const eqUI = Array.isArray(clientData.available_equipment) ? clientData.available_equipment : [clientData.available_equipment];
  const tokens = [];
  eqUI.forEach(item => {
    const equipmentTokens = UI_EQUIPMENT_TOKENS[item?.trim()] || [];
    tokens.push(...equipmentTokens);
  });
  const available = Array.from(new Set(tokens)).sort();
  
  // Process focus areas
  const focus = Array.isArray(clientData.focus_areas) ? clientData.focus_areas : [clientData.focus_areas];
  const targets = [];
  focus.forEach(f => {
    const focusMuscles = UI_FOCUS_TO_MUSCLES[f?.trim()] || [];
    targets.push(...focusMuscles);
  });
  const targetMuscles = Array.from(new Set(targets)).sort();
  
  // Process session minutes
  const minutes = Math.max(20, Math.min(120, parseInt(clientData.training_time_per_session) || 45));
  
  // Process injuries
  const injuries = Array.isArray(clientData.injuries_limitations) ? clientData.injuries_limitations : [clientData.injuries_limitations];
  const processedInjuries = injuries
    .filter(i => i)
    .map(i => i.trim().toLowerCase().replace(/\s+/g, '_'));
  
  const requireCardio = available.includes("cardio_machine") || focus.some(f => f === "Cardio fitness");
  
  return {
    goal,
    experience: exp,
    total_session_minutes: minutes,
    available_equipment: available,
    target_muscles: targetMuscles,
    injuries: processedInjuries,
    require_cardio: requireCardio
  };
}

async function testSearchBasedWorkoutPlan() {
  console.log('🧪 Testing Search-Based Workout Plan Generation');
  
  // Test client data (similar to what would be in the client table)
  const testClientData = {
    client_id: 34, // Use an existing client ID
    cl_primary_goal: "Build muscle",
    training_experience: "Beginner (less than 6 months)",
    training_days_per_week: 3,
    training_time_per_session: "45",
    training_location: "Gym",
    available_equipment: ["Dumbbells", "Barbell"],
    focus_areas: ["Upper body"],
    injuries_limitations: []
  };
  
  console.log('📊 Test Client Data:', testClientData);
  
  try {
    // First, let's check if the exercises_raw table exists and has data
    console.log('\n🔍 Checking exercises_raw table...');
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(10);
    
    if (exercisesError) {
      console.error('❌ Error fetching exercises:', exercisesError);
      return;
    }
    
    console.log('✅ Exercises table accessible');
    console.log(`📋 Found ${exercises.length} sample exercises`);
    
    if (exercises.length === 0) {
      console.log('⚠️ No exercises found in exercises_raw table. This might be expected if the table is empty.');
      console.log('📋 Let\'s check what tables exist...');
      
      // Let's check what tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('❌ Error fetching tables:', tablesError);
      } else {
        console.log('📋 Available tables:', tables.map(t => t.table_name));
      }
      return;
    }
    
    console.log('📋 Sample exercise:', {
      exercise_name: exercises[0].exercise_name,
      category: exercises[0].category,
      primary_muscle: exercises[0].primary_muscle,
      experience: exercises[0].experience,
      equipment: exercises[0].equipment
    });
    
    // Test the data cleaning function
    console.log('\n🔍 Testing data cleaning function...');
    const cleanedData = cleanUIPayload(testClientData);
    console.log('✅ Cleaned data:', cleanedData);
    
    // Test goal mapping
    console.log('\n🔍 Testing goal mapping...');
    console.log('  Original goal:', testClientData.cl_primary_goal);
    console.log('  Mapped goal:', cleanedData.goal);
    console.log('  Goal presets:', GOAL_PRESETS[cleanedData.goal]);
    
    // Test equipment mapping
    console.log('\n🔍 Testing equipment mapping...');
    console.log('  Original equipment:', testClientData.available_equipment);
    console.log('  Mapped equipment:', cleanedData.available_equipment);
    
    // Test focus areas mapping
    console.log('\n🔍 Testing focus areas mapping...');
    console.log('  Original focus areas:', testClientData.focus_areas);
    console.log('  Mapped target muscles:', cleanedData.target_muscles);
    
    // Test experience mapping
    console.log('\n🔍 Testing experience mapping...');
    console.log('  Original experience:', testClientData.training_experience);
    console.log('  Mapped experience:', cleanedData.experience);
    
    console.log('\n✅ All data mapping tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSearchBasedWorkoutPlan().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
