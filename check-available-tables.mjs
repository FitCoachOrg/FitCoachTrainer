import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Check available tables and their structure
async function checkAvailableTables() {
  console.log('🔍 === CHECKING AVAILABLE TABLES ===\n');

  try {
    // Try to fetch from different possible table names
    const possibleTables = [
      'exercises_raw',
      'exercises',
      'exercise',
      'workout_exercises',
      'fitness_exercises'
    ];

    for (const tableName of possibleTables) {
      console.log(`\n📋 Testing table: "${tableName}"`);
      console.log('='.repeat(30));
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Error: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`✅ Table exists with ${data.length} row(s)`);
          console.log('Columns:', Object.keys(data[0]));
          
          // Check for experience-related columns
          const experienceCols = Object.keys(data[0]).filter(col => 
            col.toLowerCase().includes('experience') || 
            col.toLowerCase().includes('level') || 
            col.toLowerCase().includes('difficulty') ||
            col.toLowerCase().includes('skill')
          );
          
          if (experienceCols.length > 0) {
            console.log('Experience-related columns:', experienceCols);
          }
          
          // Show sample data
          console.log('Sample data:', JSON.stringify(data[0], null, 2));
          break; // Found the table, stop searching
        } else {
          console.log('✅ Table exists but is empty');
        }
      } catch (err) {
        console.log(`❌ Exception: ${err.message}`);
      }
    }

    // Also try to get table count
    console.log('\n📊 TABLE COUNTS:');
    console.log('================');
    
    for (const tableName of possibleTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          console.log(`• ${tableName}: ${count} rows`);
        }
      } catch (err) {
        // Table doesn't exist or no access
      }
    }

    console.log('\n✅ Table analysis completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the analysis
checkAvailableTables().catch(console.error); 