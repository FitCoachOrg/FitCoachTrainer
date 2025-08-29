import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRecentScores() {
  console.log('🔍 Checking recent engagement scores...');
  
  const { data: scores, error } = await supabase
    .from('client_engagement_score')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${scores.length} recent scores:`);
  scores.forEach(score => {
    console.log(`  - ID: ${score.id}, Client: ${score.client_id}, Date: ${score.for_date}, Score: ${score.eng_score}%, Created: ${score.created_at}`);
  });
  
  // Check what date the function is trying to process
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const forDate = yesterday.toISOString().slice(0, 10);
  
  console.log(`\n📅 Function is trying to process date: ${forDate}`);
  
  // Check if any scores exist for this date
  const { data: existingScores, error: existingError } = await supabase
    .from('client_engagement_score')
    .select('*')
    .eq('for_date', forDate);
    
  if (existingError) {
    console.error('❌ Error checking existing scores:', existingError);
  } else {
    console.log(`📋 Found ${existingScores.length} existing scores for ${forDate}:`);
    existingScores.forEach(score => {
      console.log(`  - Client ${score.client_id}: ${score.eng_score}%`);
    });
  }
  
  // Check if there are any clients without scores for this date
  const { data: clients, error: clientError } = await supabase
    .from('client')
    .select('client_id, cl_name')
    .limit(5);
    
  if (clientError) {
    console.error('❌ Error fetching clients:', clientError);
    return;
  }
  
  console.log(`\n👥 Checking first 5 clients for ${forDate}:`);
  
  for (const client of clients) {
    const { data: existingScore, error: scoreError } = await supabase
      .from('client_engagement_score')
      .select('id')
      .eq('client_id', client.client_id)
      .eq('for_date', forDate)
      .maybeSingle();
      
    if (scoreError) {
      console.error(`❌ Error checking score for client ${client.client_id}:`, scoreError);
    } else if (existingScore) {
      console.log(`  - Client ${client.client_id} (${client.cl_name}): Score exists`);
    } else {
      console.log(`  - Client ${client.client_id} (${client.cl_name}): No score exists`);
    }
  }
}

checkRecentScores(); 