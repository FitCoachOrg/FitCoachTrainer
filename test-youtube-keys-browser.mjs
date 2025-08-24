import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

console.log('🔍 Testing YouTube API Keys in Browser Context...');

// Check environment variables
const youtubeKeys = [
  process.env.VITE_YOUTUBE_API_KEY,
  process.env.VITE_YOUTUBE_API_KEY2,
  process.env.VITE_YOUTUBE_API_KEY3,
  process.env.VITE_YOUTUBE_API_KEY4
].filter(key => key && key !== 'your_youtube_api_key_here' && key !== undefined && key !== '');

console.log('🔑 YouTube API Keys found:', youtubeKeys.length);

if (youtubeKeys.length === 0) {
  console.log('❌ No YouTube API keys found!');
  process.exit(1);
}

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
  } else {
    console.log('❌ YouTube API test failed:', data.error?.message || 'Unknown error');
  }
} catch (error) {
  console.log('❌ YouTube API test failed:', error.message);
}

console.log('🎉 Test completed!');
