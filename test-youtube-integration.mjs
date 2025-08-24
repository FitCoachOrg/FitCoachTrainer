import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { pickBestExerciseShort } from './client/src/lib/youtube-video-service.js';
import { enhanceExerciseWithVideo } from './client/src/lib/workout-video-integration.js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testYouTubeIntegration() {
  console.log('🧪 Testing YouTube Video Integration');
  console.log('=====================================');
  
  // Test 1: Check if YouTube API key is configured
  console.log('\n🔑 Test 1: YouTube API Key Configuration');
  if (!process.env.VITE_YOUTUBE_API_KEY) {
    console.log('❌ YouTube API key not found in environment variables');
    console.log('ℹ️ Please add VITE_YOUTUBE_API_KEY to your .env file');
    return;
  } else {
    console.log('✅ YouTube API key found');
  }
  
  // Test 2: Test single exercise video fetching
  console.log('\n🎯 Test 2: Single Exercise Video Fetching');
  const testExercises = [
    'push up',
    'squat',
    'deadlift',
    'bench press',
    'pull up'
  ];
  
  for (const exercise of testExercises) {
    console.log(`\n🔄 Testing exercise: ${exercise}`);
    try {
      const result = await pickBestExerciseShort(exercise);
      
      if (result.success && result.video) {
        console.log(`✅ Video found for ${exercise}:`);
        console.log(`   - Title: ${result.video.title}`);
        console.log(`   - Channel: ${result.video.channel_title}`);
        console.log(`   - Duration: ${result.video.duration_sec}s`);
        console.log(`   - Score: ${result.video.score}`);
        console.log(`   - Reason: ${result.video.reason}`);
        console.log(`   - Cached: ${result.cached ? 'Yes' : 'No'}`);
      } else {
        console.log(`❌ No video found for ${exercise}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${exercise}:`, error.message);
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test 3: Test exercise enhancement
  console.log('\n🎬 Test 3: Exercise Enhancement');
  const testExercise = {
    exercise: 'inverted row',
    category: 'Strength',
    body_part: 'Back',
    sets: '3',
    reps: '10',
    duration: '15',
    weight: 'Bodyweight',
    equipment: 'None',
    coach_tip: 'Focus on proper form'
  };
  
  try {
    console.log('🔄 Enhancing exercise with video...');
    const enhancedExercise = await enhanceExerciseWithVideo(testExercise);
    
    if (enhancedExercise.video_link) {
      console.log('✅ Exercise enhanced successfully:');
      console.log(`   - Original exercise: ${testExercise.exercise}`);
      console.log(`   - Video link: ${enhancedExercise.video_link}`);
      if (enhancedExercise.video_metadata) {
        console.log(`   - Video title: ${enhancedExercise.video_metadata.title}`);
        console.log(`   - Channel: ${enhancedExercise.video_metadata.channel_title}`);
        console.log(`   - Score: ${enhancedExercise.video_metadata.score}`);
      }
    } else {
      console.log('❌ Exercise enhancement failed');
    }
  } catch (error) {
    console.log('❌ Error enhancing exercise:', error.message);
  }
  
  // Test 4: Check database cache
  console.log('\n💾 Test 4: Database Cache Check');
  try {
    const { data: cachedVideos, error } = await supabase
      .from('exercises_assets')
      .select('exercise_name, video_id, title, channel_title, score, last_updated')
      .not('video_id', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error checking cache:', error.message);
    } else {
      console.log('✅ Cached videos found:', cachedVideos?.length || 0);
      if (cachedVideos && cachedVideos.length > 0) {
        console.log('📋 Recent cached videos:');
        cachedVideos.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.exercise_name} - ${video.title} (Score: ${video.score})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking database cache:', error.message);
  }
  
  // Test 5: Test workout plan enhancement
  console.log('\n📋 Test 5: Workout Plan Enhancement');
  const testWorkoutPlan = [
    {
      exercise: 'push up',
      category: 'Strength',
      body_part: 'Chest',
      sets: '3',
      reps: '10',
      duration: '15',
      weight: 'Bodyweight',
      equipment: 'None',
      coach_tip: 'Keep core tight'
    },
    {
      exercise: 'squat',
      category: 'Strength',
      body_part: 'Legs',
      sets: '3',
      reps: '12',
      duration: '20',
      weight: 'Bodyweight',
      equipment: 'None',
      coach_tip: 'Keep chest up'
    }
  ];
  
  try {
    console.log('🔄 Enhancing workout plan with videos...');
    const { enhanceWorkoutPlanWithVideos } = await import('./client/src/lib/workout-video-integration.js');
    const enhancedResult = await enhanceWorkoutPlanWithVideos(testWorkoutPlan);
    
    if (enhancedResult.success) {
      console.log('✅ Workout plan enhanced successfully:');
      console.log(`   - Total exercises: ${enhancedResult.exercises.length}`);
      console.log(`   - Videos found: ${enhancedResult.videos_found}`);
      console.log(`   - Videos cached: ${enhancedResult.videos_cached}`);
      console.log(`   - Videos fetched: ${enhancedResult.videos_fetched}`);
      
      enhancedResult.exercises.forEach((exercise, index) => {
        console.log(`   Exercise ${index + 1}: ${exercise.exercise}`);
        if (exercise.video_link) {
          console.log(`     - Video: ${exercise.video_link}`);
        } else {
          console.log(`     - No video found`);
        }
      });
    } else {
      console.log('❌ Workout plan enhancement failed:', enhancedResult.message);
    }
  } catch (error) {
    console.log('❌ Error enhancing workout plan:', error.message);
  }
  
  console.log('\n✅ YouTube Integration Testing Completed!');
}

testYouTubeIntegration().catch(console.error);
