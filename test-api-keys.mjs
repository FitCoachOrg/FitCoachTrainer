import { env } from './client/src/env.ts';

console.log('🔑 Testing All YouTube API Keys...');

const apiKeys = [
  { name: 'API Key 1', key: env.VITE_YOUTUBE_API_KEY },
  { name: 'API Key 2', key: env.VITE_YOUTUBE_API_KEY2 },
  { name: 'API Key 3', key: env.VITE_YOUTUBE_API_KEY3 },
  { name: 'API Key 4', key: env.VITE_YOUTUBE_API_KEY4 }
];

async function testAPIKey(apiKey, keyName) {
  console.log(`\n🧪 Testing ${keyName}...`);
  
  const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=pushup&type=video&maxResults=1&key=${apiKey}`;
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (response.ok && data.items && data.items.length > 0) {
      console.log(`✅ ${keyName} is WORKING!`);
      console.log(`📺 Found: ${data.items[0].snippet.title}`);
      return true;
    } else {
      console.log(`❌ ${keyName} failed: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${keyName} error: ${error.message}`);
    return false;
  }
}

async function testAllKeys() {
  console.log('🎯 Testing all API keys...\n');
  
  let workingKeys = 0;
  
  for (const { name, key } of apiKeys) {
    const isWorking = await testAPIKey(key, name);
    if (isWorking) workingKeys++;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Summary: ${workingKeys}/${apiKeys.length} API keys are working`);
  
  if (workingKeys === 0) {
    console.log('🚨 All API keys have hit quota limits!');
    console.log('💡 Solutions:');
    console.log('   1. Wait for quota reset (usually daily)');
    console.log('   2. Add more API keys to the .env file');
    console.log('   3. Use a different YouTube API project');
  } else {
    console.log('✅ Some API keys are still working!');
  }
}

testAllKeys().catch(console.error);
