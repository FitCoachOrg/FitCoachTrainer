import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applySchemaChanges() {
  console.log('🔧 Applying database schema enhancements...');
  
  try {
    // First, let's check the current structure
    const { data: currentData, error: currentError } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Error accessing exercises_assets table:', currentError);
      return;
    }
    
    console.log('📋 Current table structure:', Object.keys(currentData?.[0] || {}));
    
    // Add new columns one by one using raw SQL
    const newColumns = [
      { name: 'video_id', type: 'VARCHAR(20)' },
      { name: 'embed_url', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'channel_id', type: 'VARCHAR(50)' },
      { name: 'channel_title', type: 'VARCHAR(255)' },
      { name: 'duration_sec', type: 'INTEGER' },
      { name: 'published_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'view_count', type: 'BIGINT' },
      { name: 'like_count', type: 'INTEGER' },
      { name: 'comment_count', type: 'INTEGER' },
      { name: 'view_velocity_30d', type: 'DECIMAL(10,2)' },
      { name: 'score', type: 'DECIMAL(3,3)' },
      { name: 'reason', type: 'TEXT' },
      { name: 'is_curated_channel', type: 'BOOLEAN DEFAULT false' },
      { name: 'last_updated', type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'cache_stale', type: 'BOOLEAN DEFAULT false' },
      { name: 'search_query', type: 'TEXT' },
      { name: 'normalized_exercise_name', type: 'VARCHAR(255)' }
    ];
    
    console.log(`\n🔄 Adding ${newColumns.length} new columns...`);
    
    for (const column of newColumns) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `ALTER TABLE exercises_assets ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};` 
        });
        
        if (error) {
          console.log(`⚠️ Column ${column.name} may already exist or failed to add:`, error.message);
        } else {
          console.log(`✅ Added column: ${column.name}`);
        }
      } catch (err) {
        console.log(`⚠️ Column ${column.name} may already exist:`, err.message);
      }
    }
    
    // Verify the final structure
    console.log('\n🔍 Verifying final table structure...');
    const { data: finalData, error: finalError } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Error verifying final structure:', finalError);
    } else {
      console.log('✅ Final table structure:', Object.keys(finalData?.[0] || {}));
      console.log(`📊 Total columns: ${Object.keys(finalData?.[0] || {}).length}`);
    }
    
    console.log('\n✅ Schema enhancement completed!');
    
  } catch (error) {
    console.error('❌ Error applying schema changes:', error);
  }
}

applySchemaChanges();
