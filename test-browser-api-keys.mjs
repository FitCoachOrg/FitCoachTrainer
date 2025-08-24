import { env } from './client/src/env.ts';

console.log('🔑 Testing API Keys in Browser Context...');

// Test the exact API key loading logic used in the browser
const YOUTUBE_API_KEYS = [
  env.VITE_YOUTUBE_API_KEY,
  env.VITE_YOUTUBE_API_KEY2,
  env.VITE_YOUTUBE_API_KEY3,
  env.VITE_YOUTUBE_API_KEY4
].filter(key => key && key !== 'your_youtube_api_key_here' && key !== undefined && key !== '');

console.log('🔑 YouTube API Keys loaded:', YOUTUBE_API_KEYS.length);

if (YOUTUBE_API_KEYS.length === 0) {
  console.log('❌ No YouTube API keys configured!');
  process.exit(1);
}

// Test each API key
async function testAPIKey(apiKey, index) {
  console.log(`\n🧪 Testing API Key ${index + 1}...`);
  
  const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=pushup&type=video&maxResults=1&key=${apiKey}`;
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ API Key ${index + 1} is WORKING!`);
      console.log(`📺 Found: ${data.items[0].snippet.title}`);
      return true;
    } else {
      console.log(`❌ API Key ${index + 1} failed: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ API Key ${index + 1} error: ${error.message}`);
    return false;
  }
}

async function testAllKeys() {
  console.log('🎯 Testing all API keys...\n');
  
  let workingKeys = 0;
  
  for (let i = 0; i < YOUTUBE_API_KEYS.length; i++) {
    const isWorking = await testAPIKey(YOUTUBE_API_KEYS[i], i);
    if (isWorking) workingKeys++;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary: ${workingKeys}/${YOUTUBE_API_KEYS.length} API keys are working`);
  
  if (workingKeys === 0) {
    console.log('🚨 All API keys have hit quota limits!');
  } else {
    console.log('✅ Some API keys are still working!');
  }
  
  return workingKeys;
}

testAllKeys().catch(console.error);
