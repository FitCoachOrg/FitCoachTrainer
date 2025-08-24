import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testVideoIntegration() {
  console.log('🧪 Testing Video Integration (Simple)');
  console.log('=====================================');
  
  // Test 1: Check database structure
  console.log('\n🔍 Test 1: Database Structure Check');
  try {
    const { data: tableStructure, error } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing exercises_assets table:', error.message);
    } else {
      console.log('✅ exercises_assets table accessible');
      console.log('📋 Table columns:', Object.keys(tableStructure?.[0] || {}));
    }
  } catch (error) {
    console.log('❌ Error checking database structure:', error.message);
  }
  
  // Test 2: Check if we have any cached videos
  console.log('\n💾 Test 2: Cached Videos Check');
  try {
    const { data: cachedVideos, error } = await supabase
      .from('exercises_assets')
      .select('exercise_name, video_id, title, channel_title, score, last_updated')
      .not('video_id', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error checking cached videos:', error.message);
    } else {
      console.log(`✅ Found ${cachedVideos?.length || 0} cached videos`);
      if (cachedVideos && cachedVideos.length > 0) {
        console.log('📋 Recent cached videos:');
        cachedVideos.forEach((video, index) => {
          console.log(`   ${index + 1}. ${video.exercise_name}`);
          console.log(`      - Video ID: ${video.video_id}`);
          console.log(`      - Title: ${video.title || 'N/A'}`);
          console.log(`      - Channel: ${video.channel_title || 'N/A'}`);
          console.log(`      - Score: ${video.score || 'N/A'}`);
          console.log(`      - Updated: ${video.last_updated || 'N/A'}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking cached videos:', error.message);
  }
  
  // Test 3: Check exercises_raw table for existing video links
  console.log('\n📋 Test 3: Existing Video Links Check');
  try {
    const { data: exercisesWithVideos, error } = await supabase
      .from('exercises_raw')
      .select('exercise_name, video_link')
      .not('video_link', 'is', null)
      .not('video_link', 'eq', '')
      .limit(5);
    
    if (error) {
      console.log('❌ Error checking exercises with videos:', error.message);
    } else {
      console.log(`✅ Found ${exercisesWithVideos?.length || 0} exercises with existing video links`);
      if (exercisesWithVideos && exercisesWithVideos.length > 0) {
        console.log('📋 Exercises with video links:');
        exercisesWithVideos.forEach((exercise, index) => {
          console.log(`   ${index + 1}. ${exercise.exercise_name}`);
          console.log(`      - Video Link: ${exercise.video_link}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking exercises with videos:', error.message);
  }
  
  // Test 4: Test video URL parsing (without API)
  console.log('\n🔗 Test 4: Video URL Parsing Test');
  const testUrls = [
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/v/dQw4w9WgXcQ',
    'invalid-url'
  ];
  
  function getVideoId(url) {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }
  
  testUrls.forEach((url, index) => {
    const videoId = getVideoId(url);
    console.log(`   ${index + 1}. ${url}`);
    console.log(`      - Video ID: ${videoId || 'Invalid URL'}`);
    if (videoId) {
      console.log(`      - Thumbnail: https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      console.log(`      - Embed: https://www.youtube.com/embed/${videoId}`);
    }
  });
  
  // Test 5: Check environment variables
  console.log('\n🔑 Test 5: Environment Variables Check');
  console.log(`   - VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`   - VITE_YOUTUBE_API_KEY: ${process.env.VITE_YOUTUBE_API_KEY ? '✅ Set' : '❌ Not set'}`);
  
  if (!process.env.VITE_YOUTUBE_API_KEY) {
    console.log('\n⚠️  YouTube API key not found. To enable video fetching:');
    console.log('   1. Get a YouTube Data API v3 key from Google Cloud Console');
    console.log('   2. Add VITE_YOUTUBE_API_KEY=your_api_key to your .env file');
    console.log('   3. Restart your development server');
  }
  
  console.log('\n✅ Video Integration Testing Completed!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Add YouTube API key to .env file');
  console.log('   2. Run the full integration test with: node test-youtube-integration.mjs');
  console.log('   3. Generate a workout plan to see videos in action');
}

testVideoIntegration().catch(console.error);
