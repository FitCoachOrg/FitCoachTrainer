import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugEdgeFunction() {
  console.log('🔍 Debugging Edge Function Logic...');
  
  try {
    // Test 1: Environment variables
    console.log('\n1️⃣ Testing Environment Variables:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    
    // Test 2: Database connection
    console.log('\n2️⃣ Testing Database Connection:');
    const { data: testData, error: testError } = await supabase
      .from('client')
      .select('client_id')
      .limit(1);
      
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Test 3: Date calculation (same as Edge Function)
    console.log('\n3️⃣ Testing Date Calculation:');
    const now = new Date();
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const forDate = yesterday.toISOString().slice(0, 10);
    console.log('Current UTC:', now.toISOString());
    console.log('Yesterday UTC:', yesterday.toISOString());
    console.log('For Date:', forDate);
    
    // Test 4: Client fetch (same as Edge Function)
    console.log('\n4️⃣ Testing Client Fetch:');
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select("client_id, cl_name")
      .limit(5);
      
    if (clientError) {
      console.error('❌ Client fetch failed:', clientError);
      return;
    }
    console.log(`✅ Found ${clients.length} clients`);
    clients.forEach(client => {
      console.log(`  - Client ${client.client_id}: ${client.cl_name}`);
    });
    
    // Test 5: Schedule fetch for first client
    if (clients.length > 0) {
      console.log('\n5️⃣ Testing Schedule Fetch:');
      const testClient = clients[0];
      const { data: schedules, error: scheduleError } = await supabase
        .from("schedule")
        .select("id, status, for_date")
        .eq("client_id", testClient.client_id)
        .eq("for_date", forDate);
        
      if (scheduleError) {
        console.error('❌ Schedule fetch failed:', scheduleError);
        return;
      }
      console.log(`✅ Found ${schedules.length} schedules for client ${testClient.client_id} on ${forDate}`);
      schedules.forEach(schedule => {
        console.log(`  - Schedule ${schedule.id}: ${schedule.status || 'null'}`);
      });
      
      // Test 6: Engagement score calculation
      console.log('\n6️⃣ Testing Engagement Score Calculation:');
      const totalDue = schedules.length;
      const completed = schedules.filter(s => s.status === "completed").length;
      const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
      console.log(`Total due: ${totalDue}, Completed: ${completed}, Score: ${engScore}%`);
      
      // Test 7: Existing score check
      console.log('\n7️⃣ Testing Existing Score Check:');
      const { data: existing, error: existingError } = await supabase
        .from("client_engagement_score")
        .select("id")
        .eq("client_id", testClient.client_id)
        .eq("for_date", forDate)
        .maybeSingle();
        
      if (existingError) {
        console.error('❌ Existing score check failed:', existingError);
        return;
      }
      console.log('Existing score:', existing ? 'Found' : 'Not found');
      
      // Test 8: Score insertion (if no existing score)
      if (!existing && (totalDue > 0 || engScore !== null)) {
        console.log('\n8️⃣ Testing Score Insertion:');
        const { error: insertError } = await supabase
          .from("client_engagement_score")
          .insert({
            for_date: forDate,
            eng_score: engScore,
            client_id: testClient.client_id,
            total_due: totalDue,
            completed: completed
          });
          
        if (insertError) {
          console.error('❌ Score insertion failed:', insertError);
          return;
        }
        console.log('✅ Score insertion successful');
      } else {
        console.log('\n8️⃣ Skipping score insertion (existing score or no tasks)');
      }
    }
    
    console.log('\n✅ All tests passed! The logic should work in the Edge Function.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

debugEdgeFunction(); 