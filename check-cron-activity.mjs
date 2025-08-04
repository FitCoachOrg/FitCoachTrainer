import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCronJobActivity() {
  console.log('🔍 Checking Cron Job Activity Pattern...');
  
  const { data: scores, error } = await supabase
    .from('client_engagement_score')
    .select('created_at, client_id, for_date, eng_score')
    .order('created_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${scores.length} recent scores`);
  
  // Group by hour to see patterns
  const hourlyGroups = {};
  scores.forEach(score => {
    const hour = new Date(score.created_at).toISOString().slice(0, 13) + ':00:00Z';
    if (!hourlyGroups[hour]) {
      hourlyGroups[hour] = [];
    }
    hourlyGroups[hour].push(score);
  });
  
  console.log('\n📅 Activity by Hour:');
  Object.entries(hourlyGroups)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([hour, scores]) => {
      const clientCount = new Set(scores.map(s => s.client_id)).size;
      console.log(`${hour}: ${scores.length} scores, ${clientCount} clients`);
    });
  
  // Check for 8-hour intervals
  console.log('\n🔍 Checking for 8-hour intervals...');
  const timestamps = scores.map(s => new Date(s.created_at).getTime());
  const uniqueHours = [...new Set(timestamps.map(t => new Date(t).getUTCHours()))];
  uniqueHours.sort((a, b) => a - b);
  
  console.log('Hours with activity:', uniqueHours);
  
  // Check if we have activity at 0, 8, 16 hours (every 8 hours)
  const expectedHours = [0, 8, 16];
  const hasExpectedPattern = expectedHours.some(hour => uniqueHours.includes(hour));
  
  if (hasExpectedPattern) {
    console.log('✅ Found activity at expected 8-hour intervals!');
  } else {
    console.log('⚠️  No clear 8-hour pattern found yet');
  }
  
  // Check last 24 hours
  console.log('\n📊 Last 24 Hours Activity:');
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentScores = scores.filter(s => new Date(s.created_at) > yesterday);
  console.log(`Scores in last 24 hours: ${recentScores.length}`);
  
  if (recentScores.length > 0) {
    const hours = recentScores.map(s => new Date(s.created_at).getUTCHours());
    const uniqueHours24h = [...new Set(hours)];
    console.log('Hours with activity in last 24h:', uniqueHours24h.sort((a, b) => a - b));
  }
}

checkCronJobActivity(); 