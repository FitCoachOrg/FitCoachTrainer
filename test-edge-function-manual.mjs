import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testManualEngagementCalculation() {
  console.log('🧪 Testing Manual Engagement Calculation...');
  
  // Test with a date that likely doesn't have scores
  const testDate = '2025-08-01'; // Day before yesterday
  
  console.log(`📅 Testing for date: ${testDate}`);
  
  // Get all clients
  const { data: clients, error: clientError } = await supabase
    .from("client")
    .select("client_id, cl_name")
    .limit(10);
    
  if (clientError) {
    console.error('❌ Client fetch error:', clientError);
    return;
  }
  
  console.log(`👥 Found ${clients.length} clients`);
  
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Process each client
  for (const client of clients) {
    const clientId = client.client_id;
    const clientName = client.cl_name || `Client ${clientId}`;
    
    try {
      // Check if score already exists
      const { data: existing, error: existingError } = await supabase
        .from("client_engagement_score")
        .select("id")
        .eq("client_id", clientId)
        .eq("for_date", testDate)
        .maybeSingle();
        
      if (existingError) {
        console.error(`❌ Error checking existing score for client ${clientName}:`, existingError);
        errorCount++;
        continue;
      }
      
      if (existing) {
        console.log(`⏭️  Score already exists for ${clientName} on ${testDate}, skipping`);
        skippedCount++;
        continue;
      }
      
      // Get schedules for this client on test date
      const { data: schedules, error: scheduleError } = await supabase
        .from("schedule")
        .select("id, status, for_date")
        .eq("client_id", clientId)
        .eq("for_date", testDate);
        
      if (scheduleError) {
        console.error(`❌ Error fetching schedules for client ${clientName}:`, scheduleError);
        errorCount++;
        continue;
      }
      
      const totalDue = schedules.length;
      const completed = schedules.filter(s => s.status === "completed").length;
      const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
      
      // Insert the score
      if (totalDue > 0 || engScore !== null) {
        const { error: insertError } = await supabase
          .from("client_engagement_score")
          .insert({
            for_date: testDate,
            eng_score: engScore,
            client_id: clientId,
            total_due: totalDue,
            completed: completed
          });
          
        if (insertError) {
          console.error(`❌ Error inserting engagement score for ${clientName}:`, insertError);
          errorCount++;
        } else {
          console.log(`✅ ${clientName}: ${engScore}% (${completed}/${totalDue} tasks completed)`);
          processedCount++;
        }
      } else {
        console.log(`📝 ${clientName}: No tasks due on ${testDate}`);
        processedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing client ${clientName}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Manual Test Summary:');
  console.log(`✅ Processed: ${processedCount} clients`);
  console.log(`⏭️  Skipped: ${skippedCount} clients (already calculated)`);
  console.log(`❌ Errors: ${errorCount} clients`);
  console.log(`📅 Date processed: ${testDate}`);
  
  // Verify the results
  console.log('\n🔍 Verifying results...');
  const { data: newScores, error: verifyError } = await supabase
    .from("client_engagement_score")
    .select("*")
    .eq("for_date", testDate)
    .order("created_at", { ascending: false });
    
  if (verifyError) {
    console.error('❌ Error verifying results:', verifyError);
  } else {
    console.log(`✅ Found ${newScores.length} new scores for ${testDate}:`);
    newScores.forEach(score => {
      console.log(`  - Client ${score.client_id}: ${score.eng_score}% (${score.completed}/${score.total_due})`);
    });
  }
}

testManualEngagementCalculation(); 