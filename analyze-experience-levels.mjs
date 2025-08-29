import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Analyze experience levels in exercises_raw table
async function analyzeExperienceLevels() {
  console.log('🔍 === ANALYZING EXPERIENCE LEVELS ===\n');

  try {
    // Fetch all exercises to analyze experience levels
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('exercise_name, experience, Experience')
      .limit(1000); // Sample size

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    console.log(`📊 Analyzing ${exercises.length} exercises...\n`);

    // Collect all unique experience values
    const experienceLevels = new Set();
    const experienceCounts = {};
    const sampleExercises = {};

    exercises.forEach(exercise => {
      // Check both 'experience' and 'Experience' fields
      const exp1 = exercise.experience?.trim();
      const exp2 = exercise.Experience?.trim();
      
      if (exp1) {
        experienceLevels.add(exp1);
        experienceCounts[exp1] = (experienceCounts[exp1] || 0) + 1;
        if (!sampleExercises[exp1]) {
          sampleExercises[exp1] = exercise.exercise_name;
        }
      }
      
      if (exp2) {
        experienceLevels.add(exp2);
        experienceCounts[exp2] = (experienceCounts[exp2] || 0) + 1;
        if (!sampleExercises[exp2]) {
          sampleExercises[exp2] = exercise.exercise_name;
        }
      }
    });

    // Display findings
    console.log('📋 UNIQUE EXPERIENCE LEVELS FOUND:');
    console.log('=====================================');
    
    const sortedLevels = Array.from(experienceLevels).sort();
    sortedLevels.forEach(level => {
      const count = experienceCounts[level] || 0;
      const sample = sampleExercises[level] || 'N/A';
      console.log(`• "${level}" (${count} exercises) - Sample: ${sample}`);
    });

    console.log('\n📊 EXPERIENCE LEVEL DISTRIBUTION:');
    console.log('===================================');
    
    Object.entries(experienceCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([level, count]) => {
        const percentage = ((count / exercises.length) * 100).toFixed(1);
        console.log(`• "${level}": ${count} exercises (${percentage}%)`);
      });

    // Analyze current mapping
    console.log('\n🔧 CURRENT EXPERIENCE MAPPING:');
    console.log('===============================');
    
    const currentMapping = {
      "beginner": "Beginner",
      "intermediate": "Intermediate", 
      "advanced": "Advanced"
    };

    Object.entries(currentMapping).forEach(([ui, system]) => {
      console.log(`• UI: "${ui}" → System: "${system}"`);
    });

    // Check for mismatches
    console.log('\n⚠️ POTENTIAL MAPPING ISSUES:');
    console.log('=============================');
    
    const mappedLevels = new Set(Object.values(currentMapping));
    const unmappedLevels = sortedLevels.filter(level => !mappedLevels.has(level));
    
    if (unmappedLevels.length > 0) {
      console.log('❌ UNMAPPED EXPERIENCE LEVELS:');
      unmappedLevels.forEach(level => {
        console.log(`• "${level}" - No mapping found`);
      });
    } else {
      console.log('✅ All experience levels are mapped');
    }

    // Test current mapping logic
    console.log('\n🧪 TESTING CURRENT MAPPING LOGIC:');
    console.log('===================================');
    
    const testCases = [
      { ui: 'beginner', expected: 'Beginner' },
      { ui: 'intermediate', expected: 'Intermediate' },
      { ui: 'advanced', expected: 'Advanced' },
      { ui: 'Beginner', expected: 'Beginner' },
      { ui: 'Intermediate', expected: 'Intermediate' },
      { ui: 'Advanced', expected: 'Advanced' }
    ];

    testCases.forEach(testCase => {
      const mapped = currentMapping[testCase.ui.toLowerCase()] || "Beginner";
      const status = mapped === testCase.expected ? '✅' : '❌';
      console.log(`${status} UI: "${testCase.ui}" → Mapped: "${mapped}" (Expected: "${testCase.expected}")`);
    });

    // Test exercise matching logic
    console.log('\n🔍 TESTING EXERCISE MATCHING LOGIC:');
    console.log('=====================================');
    
    const testExperience = 'Beginner';
    const testExercises = exercises.slice(0, 5); // Test first 5 exercises
    
    testExercises.forEach(exercise => {
      const exerciseExperience = exercise.experience?.toLowerCase() || '';
      const matches = exerciseExperience.includes(testExperience.toLowerCase());
      const status = matches ? '✅' : '❌';
      console.log(`${status} Exercise: "${exercise.exercise_name}" (Experience: "${exercise.experience}") → Matches "${testExperience}": ${matches}`);
    });

    console.log('\n✅ Experience level analysis completed!');

  } catch (error) {
    console.error('❌ Error analyzing experience levels:', error);
  }
}

// Run the analysis
analyzeExperienceLevels().catch(console.error);
