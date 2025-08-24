import { env } from './client/src/env.ts';

console.log('🧪 Testing Specific Exercises with Known Channels...');

// Test with specific known exercises
const testExercises = [
  'push up',
  'squat',
  'deadlift',
  'bench press',
  'pull up'
];

// Known fitness channels that should work
const knownChannels = [
  'UCe0TLA0EsQbE-MjuHXevj2A', // ATHLEANX
  'UCJ5v_MCY6GNUBTO8o3knCmg', // Jeff Nippard
  'UCmHvGf00GduzlgTQ-7YJf4Q'  // Bodybuilding.com
];

async function testExerciseSearch(exerciseName, channelId = null) {
  const apiKey = env.VITE_YOUTUBE_API_KEY;
  
  // Build search query
  const query = `${exerciseName} how to form tutorial`;
  
  // Build URL
  let url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&maxResults=5&order=relevance&key=${apiKey}`;
  
  if (channelId) {
    url += `&channelId=${channelId}`;
  }
  
  console.log(`\n🔍 Testing: "${exerciseName}"${channelId ? ` (Channel: ${channelId})` : ''}`);
  console.log(`📡 URL: ${url.substring(0, 100)}...`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ Found ${data.items.length} videos for "${exerciseName}"`);
      console.log(`📺 First video: ${data.items[0].snippet.title}`);
      console.log(`👤 Channel: ${data.items[0].snippet.channelTitle}`);
      console.log(`📅 Published: ${data.items[0].snippet.publishedAt}`);
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
  console.log('🎯 Starting specific exercise tests...\n');
  
  // Test 1: Global search for each exercise
  console.log('=== TEST 1: Global Search ===');
  for (const exercise of testExercises) {
    await testExerciseSearch(exercise);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }
  
  // Test 2: Channel-specific search
  console.log('\n=== TEST 2: Channel-Specific Search ===');
  for (const exercise of testExercises.slice(0, 2)) { // Test first 2 exercises
    for (const channelId of knownChannels) {
      await testExerciseSearch(exercise, channelId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
  }
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
