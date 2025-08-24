import { env } from './client/src/env.ts';

console.log('🔍 Debugging AI Workout Plan Flow...');

// Simulate the exact structure that comes from AI workout plan generation
const mockAIWorkoutPlan = [
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

// Test the exact exercise name extraction logic used in the app
function extractExerciseName(exercise) {
  return exercise.exercise || exercise.exercise_name || exercise.name || exercise.workout || '';
}

// Test the exact video search logic
async function testVideoSearch(exerciseName) {
  console.log(`\n🎯 Testing video search for: "${exerciseName}"`);
  
  // Use API Key 2 which we know works
  const apiKey = env.VITE_YOUTUBE_API_KEY2;
  
  // Build the exact query used in the app
  const query = `${exerciseName} how to form tutorial`;
  console.log(`🔍 Search query: "${query}"`);
  
  const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=5&order=relevance&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ Found ${data.items.length} videos`);
      
      // Show first video details
      const firstVideo = data.items[0];
      console.log(`📺 First video: ${firstVideo.snippet.title}`);
      console.log(`👤 Channel: ${firstVideo.snippet.channelTitle}`);
      console.log(`🆔 Video ID: ${firstVideo.id.videoId}`);
      
      // Test if we can get video details (duration, etc.)
      await testVideoDetails(firstVideo.id.videoId, apiKey);
      
      return {
        success: true,
        video: {
          video_id: firstVideo.id.videoId,
          embed_url: `https://www.youtube.com/embed/${firstVideo.id.videoId}`,
          title: firstVideo.snippet.title,
          channel_title: firstVideo.snippet.channelTitle
        }
      };
    } else {
      console.log(`❌ No videos found`);
      if (data.error) {
        console.log(`🚨 Error: ${data.error.message}`);
      }
      return { success: false, error: data.error?.message || 'No videos found' };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test getting video details (duration, statistics, etc.)
async function testVideoDetails(videoId, apiKey) {
  console.log(`🔍 Getting details for video: ${videoId}`);
  
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet,status&id=${videoId}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      const video = data.items[0];
      console.log(`✅ Video details retrieved:`);
      console.log(`   Duration: ${video.contentDetails.duration}`);
      console.log(`   Views: ${video.statistics.viewCount}`);
      console.log(`   Likes: ${video.statistics.likeCount}`);
      console.log(`   Status: ${video.status.privacyStatus}, Embeddable: ${video.status.embeddable}`);
    } else {
      console.log(`❌ Could not get video details`);
    }
  } catch (error) {
    console.log(`❌ Error getting video details: ${error.message}`);
  }
}

// Simulate the exact enhancement flow
async function enhanceExerciseWithVideo(exercise) {
  const exerciseName = extractExerciseName(exercise);
  
  if (!exerciseName) {
    console.log(`⚠️ Exercise name is empty, skipping`);
    return exercise;
  }
  
  console.log(`🎯 Enhancing exercise: "${exerciseName}"`);
  
  // Check if already has video
  if (exercise.video_link && exercise.video_link.trim() !== '') {
    console.log(`✅ Already has video: ${exercise.video_link}`);
    return exercise;
  }
  
  // Search for video
  const videoResult = await testVideoSearch(exerciseName);
  
  if (videoResult.success && videoResult.video) {
    console.log(`✅ Video found and added!`);
    return {
      ...exercise,
      video_link: videoResult.video.embed_url,
      video_metadata: {
        video_id: videoResult.video.video_id,
        embed_url: videoResult.video.embed_url,
        title: videoResult.video.title,
        channel_title: videoResult.video.channel_title
      }
    };
  } else {
    console.log(`⚠️ No video found for: ${exerciseName}`);
    return exercise;
  }
}

// Test the full workout plan enhancement
async function enhanceWorkoutPlanWithVideos(workoutPlan) {
  console.log(`\n🎬 Enhancing workout plan with ${workoutPlan.length} exercises...`);
  
  const enhancedExercises = [];
  let videosFound = 0;
  
  for (let i = 0; i < workoutPlan.length; i++) {
    const exercise = workoutPlan[i];
    console.log(`\n🔄 Processing exercise ${i + 1}/${workoutPlan.length}: ${extractExerciseName(exercise)}`);
    
    const enhancedExercise = await enhanceExerciseWithVideo(exercise);
    enhancedExercises.push(enhancedExercise);
    
    if (enhancedExercise.video_link && enhancedExercise.video_link !== exercise.video_link) {
      videosFound++;
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Enhancement completed!`);
  console.log(`📊 Videos found: ${videosFound}/${workoutPlan.length}`);
  
  return {
    success: true,
    exercises: enhancedExercises,
    videos_found: videosFound
  };
}

// Run the full test
async function runFullTest() {
  console.log('🧪 Starting full AI workout plan flow test...\n');
  
  // Test 1: Exercise name extraction
  console.log('=== TEST 1: Exercise Name Extraction ===');
  mockAIWorkoutPlan.forEach((exercise, index) => {
    const extractedName = extractExerciseName(exercise);
    console.log(`  ${index + 1}. "${exercise.exercise_name}" -> "${extractedName}"`);
  });
  
  // Test 2: Full workout plan enhancement
  console.log('\n=== TEST 2: Full Workout Plan Enhancement ===');
  const result = await enhanceWorkoutPlanWithVideos(mockAIWorkoutPlan);
  
  // Test 3: Show final results
  console.log('\n=== TEST 3: Final Results ===');
  result.exercises.forEach((exercise, index) => {
    console.log(`  ${index + 1}. ${exercise.exercise_name}`);
    if (exercise.video_link) {
      console.log(`     ✅ Video: ${exercise.video_link}`);
      console.log(`     📺 Title: ${exercise.video_metadata?.title}`);
    } else {
      console.log(`     ❌ No video`);
    }
  });
  
  console.log(`\n🎉 Full test completed! Videos found: ${result.videos_found}/${mockAIWorkoutPlan.length}`);
}

runFullTest().catch(console.error);
