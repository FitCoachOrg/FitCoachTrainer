import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('🔍 === CHECKING DATABASE TABLES ===\n');

  try {
    // Try to get table information by querying different tables
    const tables = [
      'exercises_raw',
      'exercises',
      'client',
      'schedule',
      'schedule_preview'
    ];

    for (const tableName of tables) {
      console.log(`📋 Checking table: ${tableName}`);
      
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (error) {
          console.log(`  ❌ Error: ${error.message}`);
        } else {
          console.log(`  ✅ Table exists`);
          if (data && data.length > 0) {
            console.log(`  📊 Has data: ${count || data.length} rows`);
            console.log(`  📝 Sample columns: ${Object.keys(data[0]).join(', ')}`);
          } else {
            console.log(`  📊 Empty table`);
          }
        }
      } catch (err) {
        console.log(`  ❌ Table doesn't exist or access denied`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables().catch(console.error);
