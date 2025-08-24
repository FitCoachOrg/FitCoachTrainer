import { env } from './client/src/env.ts';

console.log('🔍 Testing Exercise Name Extraction...');

// Simulate the workout plan data structure that comes from the AI
const sampleWorkoutPlan = [
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
  },
  {
    exercise_name: "Squats",
    sets: 4,
    reps: "12-15",
    rest: "120 seconds",
    notes: "Go as deep as comfortable"
  }
];

// Test the exercise name extraction logic
function extractExerciseName(exercise) {
  return exercise.exercise || exercise.exercise_name || exercise.name || exercise.workout || '';
}

console.log('📋 Sample Workout Plan:');
sampleWorkoutPlan.forEach((exercise, index) => {
  const extractedName = extractExerciseName(exercise);
  console.log(`  ${index + 1}. Original: "${exercise.exercise_name}" -> Extracted: "${extractedName}"`);
});

// Test with a working API key
async function testExerciseSearch(exerciseName) {
  const apiKey = env.VITE_YOUTUBE_API_KEY2; // Use API Key 2 which we know works
  
  console.log(`\n🧪 Testing exercise search for: "${exerciseName}"`);
  
  const query = `${exerciseName} how to form tutorial`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=3&order=relevance&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ Found ${data.items.length} videos for "${exerciseName}"`);
      data.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.snippet.title}`);
        console.log(`     Channel: ${item.snippet.channelTitle}`);
        console.log(`     Duration: ${item.snippet.duration || 'Unknown'}`);
      });
      return true;
    } else {
      console.log(`❌ No videos found for "${exerciseName}"`);
      if (data.error) {
        console.log(`🚨 Error: ${data.error.message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Error searching for "${exerciseName}": ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🎯 Testing exercise search with extracted names...\n');
  
  for (const exercise of sampleWorkoutPlan) {
    const exerciseName = extractExerciseName(exercise);
    await testExerciseSearch(exerciseName);
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Exercise extraction test completed!');
}

runTests().catch(console.error);
