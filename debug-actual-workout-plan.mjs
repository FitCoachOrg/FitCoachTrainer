import { env } from './client/src/env.ts';

console.log('🔍 Debugging Actual Workout Plan Structure...');

// This is what the AI typically generates - let's test with real examples
const sampleAIResponses = [
  // Example 1: Standard format
  {
    workout_plan: [
      {
        exercise_name: "Seated Leg Press",
        sets: 3,
        reps: "10-12",
        rest: "90 seconds",
        notes: "Focus on full range of motion"
      },
      {
        exercise_name: "Push-ups",
        sets: 3,
        reps: "8-12",
        rest: "60 seconds",
        notes: "Keep body straight"
      }
    ]
  },
  
  // Example 2: Different field names
  {
    workout_plan: [
      {
        exercise: "Squats",
        sets: 4,
        reps: "12-15",
        rest: "120 seconds",
        notes: "Go as deep as comfortable"
      },
      {
        exercise: "Deadlift",
        sets: 3,
        reps: "8-10",
        rest: "180 seconds",
        notes: "Keep back straight"
      }
    ]
  },
  
  // Example 3: Mixed format
  {
    workout_plan: [
      {
        exercise_name: "Bench Press",
        sets: 3,
        reps: "8-10",
        rest: "120 seconds"
      },
      {
        name: "Pull-ups",
        sets: 3,
        reps: "5-8",
        rest: "90 seconds"
      }
    ]
  }
];

// Test the exact exercise name extraction logic
function extractExerciseName(exercise) {
  return exercise.exercise || exercise.exercise_name || exercise.name || exercise.workout || '';
}

// Test each sample response
sampleAIResponses.forEach((response, responseIndex) => {
  console.log(`\n=== SAMPLE RESPONSE ${responseIndex + 1} ===`);
  
  if (!response.workout_plan || !Array.isArray(response.workout_plan)) {
    console.log('❌ No workout_plan array found');
    return;
  }
  
  console.log(`📊 Found ${response.workout_plan.length} exercises`);
  
  response.workout_plan.forEach((exercise, exerciseIndex) => {
    console.log(`\n  Exercise ${exerciseIndex + 1}:`);
    console.log(`    Raw exercise object:`, exercise);
    
    const extractedName = extractExerciseName(exercise);
    console.log(`    Extracted name: "${extractedName}"`);
    
    if (!extractedName) {
      console.log(`    ❌ WARNING: No exercise name could be extracted!`);
      console.log(`    Available fields:`, Object.keys(exercise));
    } else {
      console.log(`    ✅ Exercise name extracted successfully`);
    }
  });
});

// Test video search with a working API key
async function testVideoSearchForExercise(exerciseName) {
  console.log(`\n🎯 Testing video search for: "${exerciseName}"`);
  
  const apiKey = env.VITE_YOUTUBE_API_KEY2; // Use working key
  const query = `${exerciseName} how to form tutorial`;
  
  const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=1&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ Video found: ${data.items[0].snippet.title}`);
      return true;
    } else {
      console.log(`❌ No video found: ${data.error?.message || 'No results'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

// Test video search for each sample
async function testAllSamples() {
  console.log('\n🎬 Testing video search for all sample exercises...\n');
  
  for (const response of sampleAIResponses) {
    if (response.workout_plan && Array.isArray(response.workout_plan)) {
      for (const exercise of response.workout_plan) {
        const exerciseName = extractExerciseName(exercise);
        if (exerciseName) {
          await testVideoSearchForExercise(exerciseName);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between requests
        }
      }
    }
  }
  
  console.log('\n🎉 All tests completed!');
}

testAllSamples().catch(console.error);
