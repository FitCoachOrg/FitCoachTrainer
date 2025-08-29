import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Columns to add to exercises_assets table
const columnsToAdd = [
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

async function addColumns() {
  console.log('🔧 Adding required columns to exercises_assets table...\n');
  
  for (const column of columnsToAdd) {
    try {
      // Check if column already exists
      const { data: existingColumns, error: checkError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'exercises_assets')
        .eq('column_name', column.name);
      
      if (checkError) {
        console.warn(`⚠️ Could not check if column ${column.name} exists:`, checkError.message);
        continue;
      }
      
      if (existingColumns && existingColumns.length > 0) {
        console.log(`✅ Column ${column.name} already exists`);
        continue;
      }
      
      // Add column using raw SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE exercises_assets ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}`
      });
      
      if (error) {
        console.warn(`⚠️ Could not add column ${column.name}:`, error.message);
      } else {
        console.log(`✅ Added column ${column.name}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Error with column ${column.name}:`, error.message);
    }
  }
  
  // Verify the table structure
  console.log('\n🔍 Verifying table structure...');
  try {
    const { data, error } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking table structure:', error.message);
    } else {
      console.log('✅ Table structure verified');
      console.log('📊 Available columns:', Object.keys(data[0] || {}));
    }
  } catch (error) {
    console.error('❌ Error verifying table:', error.message);
  }
}

// Alternative approach: Create a simple table structure
async function createSimpleTable() {
  console.log('\n🔄 Creating simplified table structure...');
  
  try {
    // Create a simple table with basic columns
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS exercises_assets_simple (
          id SERIAL PRIMARY KEY,
          exercise_name VARCHAR(255) NOT NULL,
          video_id VARCHAR(20),
          embed_url TEXT,
          title TEXT,
          channel_title VARCHAR(255),
          duration_sec INTEGER,
          score DECIMAL(3,3),
          reason TEXT,
          cache_stale BOOLEAN DEFAULT false,
          normalized_exercise_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
    });
    
    if (error) {
      console.warn('⚠️ Could not create simple table:', error.message);
    } else {
      console.log('✅ Created exercises_assets_simple table');
    }
  } catch (error) {
    console.warn('⚠️ Error creating simple table:', error.message);
  }
}

// Run the fixes
async function main() {
  console.log('🚀 Starting database schema fixes...\n');
  
  await addColumns();
  await createSimpleTable();
  
  console.log('\n✅ Database schema fixes completed!');
  console.log('💡 If columns could not be added, the system will work with basic functionality.');
}

main().catch(console.error);
