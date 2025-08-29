import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMissingClients() {
  console.log('🧪 Testing Missing Clients for 2025-08-02...');
  
  const forDate = '2025-08-02';
  
  // Get clients that don't have scores for this date
  const { data: clients, error: clientError } = await supabase
    .from('client')
    .select('client_id, cl_name')
    .limit(10);
    
  if (clientError) {
    console.error('❌ Error fetching clients:', clientError);
    return;
  }
  
  console.log(`👥 Found ${clients.length} clients to check`);
  
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const client of clients) {
    const clientId = client.client_id;
    const clientName = client.cl_name || `Client ${clientId}`;
    
    try {
      // Check if score already exists
      const { data: existing, error: existingError } = await supabase
        .from('client_engagement_score')
        .select('id')
        .eq('client_id', clientId)
        .eq('for_date', forDate)
        .maybeSingle();
        
      if (existingError) {
        console.error(`❌ Error checking existing score for client ${clientName}:`, existingError);
        errorCount++;
        continue;
      }
      
      if (existing) {
        console.log(`⏭️  Score already exists for ${clientName} on ${forDate}, skipping`);
        skippedCount++;
        continue;
      }
      
      // Get schedules for this client
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedule')
        .select('id, status, for_date')
        .eq('client_id', clientId)
        .eq('for_date', forDate);
        
      if (scheduleError) {
        console.error(`❌ Error fetching schedules for client ${clientName}:`, scheduleError);
        errorCount++;
        continue;
      }
      
      const totalDue = schedules.length;
      const completed = schedules.filter(s => s.status === 'completed').length;
      const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;
      
      console.log(`📊 ${clientName}: ${totalDue} tasks due, ${completed} completed, score: ${engScore}%`);
      
      // Insert the score
      if (totalDue > 0 || engScore !== null) {
        const { error: insertError } = await supabase
          .from('client_engagement_score')
          .insert({
            for_date: forDate,
            eng_score: engScore,
            client_id: clientId,
            total_due: totalDue,
            completed: completed
          });
          
        if (insertError) {
          console.error(`❌ Error inserting engagement score for ${clientName}:`, insertError);
          errorCount++;
        } else {
          console.log(`✅ ${clientName}: ${engScore}% (${completed}/${totalDue} tasks completed) - INSERTED`);
          processedCount++;
        }
      } else {
        console.log(`📝 ${clientName}: No tasks due on ${forDate} - INSERTED`);
        processedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing client ${clientName}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Processed: ${processedCount} clients`);
  console.log(`⏭️  Skipped: ${skippedCount} clients (already calculated)`);
  console.log(`❌ Errors: ${errorCount} clients`);
  console.log(`📅 Date processed: ${forDate}`);
}

testMissingClients(); 