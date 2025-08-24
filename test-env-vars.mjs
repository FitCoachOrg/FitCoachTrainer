import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔍 Environment Variables Test');
console.log('============================');

const vars = [
  'VITE_YOUTUBE_API_KEY',
  'VITE_YOUTUBE_API_KEY2', 
  'VITE_YOUTUBE_API_KEY3',
  'VITE_YOUTUBE_API_KEY4'
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'your_youtube_api_key_here' && value !== '') {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: Not configured`);
  }
});

console.log('\n🎯 Summary:');
const configuredKeys = vars.filter(varName => {
  const value = process.env[varName];
  return value && value !== 'your_youtube_api_key_here' && value !== '';
}).length;

console.log(`📊 Configured API keys: ${configuredKeys}/4`);
