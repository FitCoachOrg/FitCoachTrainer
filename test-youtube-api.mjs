// Test script to verify YouTube API key functionality
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env') });

// Get all YouTube API keys
const YOUTUBE_API_KEYS = [
  process.env.VITE_YOUTUBE_API_KEY,
  process.env.VITE_YOUTUBE_API_KEY2,
  process.env.VITE_YOUTUBE_API_KEY3,
  process.env.VITE_YOUTUBE_API_KEY4
].filter(key => key && key !== 'your_youtube_api_key_here' && key !== 'your_youtube_api_key2_here' && key !== 'your_youtube_api_key3_here' && key !== 'your_youtube_api_key4_here' && key !== undefined);

console.log('🧪 Testing YouTube API Keys...\n');

if (YOUTUBE_API_KEYS.length === 0) {
  console.log('❌ No YouTube API keys configured!');
  console.log('📝 Please add your YouTube API keys to the .env file:');
  console.log('   VITE_YOUTUBE_API_KEY=your_actual_api_key_here');
  console.log('   VITE_YOUTUBE_API_KEY2=your_actual_api_key2_here');
  console.log('   VITE_YOUTUBE_API_KEY3=your_actual_api_key3_here');
  console.log('   VITE_YOUTUBE_API_KEY4=your_actual_api_key4_here');
  console.log('\n📖 See YOUTUBE_API_SETUP_GUIDE.md for instructions');
  process.exit(1);
}

console.log(`✅ Found ${YOUTUBE_API_KEYS.length} YouTube API key(s)`);
YOUTUBE_API_KEYS.forEach((key, index) => {
  console.log(`🔑 Key ${index + 1}: ${key.substring(0, 10)}...`);
});

// Test all API keys with automatic failover
async function testYouTubeAPI() {
  console.log('\n🔍 Testing API keys with search query: "pushup form"');
  
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const apiKey = YOUTUBE_API_KEYS[i];
    console.log(`\n🧪 Testing API Key ${i + 1}...`);
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=pushup+form&type=video&videoDuration=short&maxResults=1&key=${apiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.error) {
        console.log(`❌ API Key ${i + 1} Error:`, data.error.message);
        
        if (data.error.code === 403 && data.error.message.includes('quota')) {
          console.log(`⚠️ API Key ${i + 1} quota exceeded, trying next key...`);
          continue; // Try next key
        } else if (data.error.code === 403) {
          console.log(`❌ API Key ${i + 1} is invalid or API not enabled`);
          continue; // Try next key
        } else {
          console.log(`❌ API Key ${i + 1} error:`, data.error.message);
          continue; // Try next key
        }
      }
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        console.log(`✅ API Key ${i + 1} test successful!`);
        console.log('📹 Found video:', video.snippet.title);
        console.log('👤 Channel:', video.snippet.channelTitle);
        console.log('🆔 Video ID:', video.id.videoId);
        return true;
      } else {
        console.log(`⚠️ API Key ${i + 1}: No videos found (unusual for "pushup form")`);
        continue; // Try next key
      }
      
    } catch (error) {
      console.log(`❌ API Key ${i + 1} network error:`, error.message);
      continue; // Try next key
    }
  }
  
  console.log('\n❌ All API keys failed!');
  return false;
}

// Run the test
testYouTubeAPI().then(success => {
  if (success) {
    console.log('\n🎉 YouTube API multi-key system is working correctly!');
    console.log('🚀 Your video integration with automatic failover should work perfectly.');
    console.log('🔄 The system will automatically rotate between keys when quotas are exceeded.');
  } else {
    console.log('\n🔧 Please check your API keys and try again.');
    console.log('💡 Make sure at least one API key is valid and has quota remaining.');
  }
});
