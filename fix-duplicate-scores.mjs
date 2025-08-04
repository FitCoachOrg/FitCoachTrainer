import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAndFixDuplicates() {
  console.log('🔍 Checking for duplicate engagement scores...');
  
  const { data: scores, error } = await supabase
    .from('client_engagement_score')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Found ${scores.length} total scores`);
  
  // Group by client_id and for_date
  const grouped = {};
  scores.forEach(score => {
    const key = `${score.client_id}-${score.for_date}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(score);
  });
  
  // Find duplicates
  const duplicates = Object.entries(grouped)
    .filter(([key, scores]) => scores.length > 1)
    .map(([key, scores]) => ({ key, scores }));
    
  console.log(`🔍 Found ${duplicates.length} duplicate groups:`);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }
  
  duplicates.forEach(({ key, scores }) => {
    console.log(`\n📅 ${key}:`);
    scores.forEach(score => {
      console.log(`  - ID: ${score.id}, Score: ${score.eng_score}%, Created: ${score.created_at}`);
    });
  });
  
  // Fix duplicates by keeping only the most recent
  console.log('\n🧹 Fixing duplicates...');
  
  for (const { key, scores } of duplicates) {
    // Sort by created_at descending and keep only the first (most recent)
    const sortedScores = scores.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const toKeep = sortedScores[0];
    const toDelete = sortedScores.slice(1);
    
    console.log(`\n📅 ${key}: Keeping ID ${toKeep.id}, deleting ${toDelete.length} duplicates`);
    
    // Delete duplicates
    for (const score of toDelete) {
      const { error: deleteError } = await supabase
        .from('client_engagement_score')
        .delete()
        .eq('id', score.id);
        
      if (deleteError) {
        console.error(`❌ Error deleting score ${score.id}:`, deleteError);
      } else {
        console.log(`✅ Deleted duplicate score ${score.id}`);
      }
    }
  }
  
  console.log('\n✅ Duplicate cleanup completed!');
}

checkAndFixDuplicates(); 