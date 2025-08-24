import { env } from './client/src/env.ts';

console.log('🔍 Testing YouTube API Keys with direct import...');

// Check if we have the API keys
const youtubeKeys = [
  env.VITE_YOUTUBE_API_KEY,
  env.VITE_YOUTUBE_API_KEY2,
  env.VITE_YOUTUBE_API_KEY3,
  env.VITE_YOUTUBE_API_KEY4
];

console.log('🔑 YouTube API Keys found:', youtubeKeys.length);

// Test the first API key
const testKey = youtubeKeys[0];
const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=pushup+form&type=video&videoDuration=short&maxResults=1&key=${testKey}`;

console.log('🧪 Testing YouTube API with first key...');

try {
  const response = await fetch(testUrl);
  const data = await response.json();
  
  if (response.ok && data.items && data.items.length > 0) {
    console.log('✅ YouTube API test successful!');
    console.log('📺 Found video:', data.items[0].snippet.title);
    console.log('🎉 Your YouTube video integration should now work!');
  } else {
    console.log('❌ YouTube API test failed:', data.error?.message || 'Unknown error');
  }
} catch (error) {
  console.log('❌ YouTube API test failed:', error.message);
}

console.log('🎉 Test completed!');
