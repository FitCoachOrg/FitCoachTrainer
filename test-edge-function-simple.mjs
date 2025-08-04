import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testEdgeFunctionLogic() {
  console.log('🧪 Testing Edge Function Logic...');
  
  // Calculate the previous day in UTC (same as Edge Function)
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const forDate = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD
  
  console.log(`📅 Testing for date: ${forDate}`);
  console.log(`🕐 Current UTC time: ${now.toISOString()}`);
  console.log(`📅 Yesterday UTC: ${yesterday.toISOString()}`);
  
  // Test client fetch
  console.log('\n👥 Testing client fetch...');
  const { data: clients, error: clientError } = await supabase
    .from("client")
    .select("client_id, cl_name")
    .limit(5);
    
  if (clientError) {
    console.error('❌ Client fetch error:', clientError);
    return;
  }
  
  console.log(`✅ Found ${clients.length} clients`);
  clients.forEach(client => {
    console.log(`  - Client ${client.client_id}: ${client.cl_name}`);
  });
  
  // Test schedule fetch for first client
  if (clients.length > 0) {
    const testClient = clients[0];
    console.log(`\n📋 Testing schedule fetch for client ${testClient.client_id}...`);
    
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule")
      .select("id, status, for_date")
      .eq("client_id", testClient.client_id)
      .eq("for_date", forDate);
      
    if (scheduleError) {
      console.error('❌ Schedule fetch error:', scheduleError);
      return;
    }
    
    console.log(`✅ Found ${schedules.length} schedules for ${forDate}`);
    schedules.forEach(schedule => {
      console.log(`  - Schedule ${schedule.id}: ${schedule.status || 'null'}`);
    });
    
    // Test engagement score calculation
    const totalDue = schedules.length;
    const completed = schedules.filter(s => s.status === "completed").length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
    
    console.log(`\n📊 Calculation result:`);
    console.log(`  - Total due: ${totalDue}`);
    console.log(`  - Completed: ${completed}`);
    console.log(`  - Engagement score: ${engScore}%`);
    
    // Test existing score check
    console.log(`\n🔍 Testing existing score check...`);
    const { data: existing, error: existingError } = await supabase
      .from("client_engagement_score")
      .select("id")
      .eq("client_id", testClient.client_id)
      .eq("for_date", forDate)
      .maybeSingle();
      
    if (existingError) {
      console.error('❌ Existing score check error:', existingError);
    } else if (existing) {
      console.log(`⏭️  Score already exists for client ${testClient.client_id} on ${forDate}`);
    } else {
      console.log(`✅ No existing score found, can insert new score`);
    }
  }
  
  console.log('\n✅ Test completed successfully!');
}

testEdgeFunctionLogic(); 