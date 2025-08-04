import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyAllTablesAccess() {
  console.log('🔍 Verifying access to all tables...\n');

  try {
    // Get all tables in the database
    console.log('1️⃣ Getting list of all tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');
    
    if (tablesError) {
      console.log('⚠️  Could not get tables via RPC, trying alternative method...');
      
      // Alternative: Get tables by querying information_schema
      const { data: tablesAlt, error: tablesAltError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%')
        .not('table_name', 'like', 'information_schema%');
      
      if (tablesAltError) {
        console.error('❌ Error getting tables:', tablesAltError.message);
        return;
      }
      
      const tableNames = tablesAlt?.map(t => t.table_name) || [];
      console.log(`📊 Found ${tableNames.length} tables:`, tableNames);
      
      // Test access to each table
      for (const tableName of tableNames) {
        await testTableAccess(tableName);
      }
    } else {
      console.log(`📊 Found ${tables?.length || 0} tables`);
      
      // Test access to each table
      for (const table of tables || []) {
        await testTableAccess(table.table_name);
      }
    }

    console.log('\n🎉 Verification complete!');
    console.log('💡 If you see errors, run the comprehensive SQL script to fix RLS policies.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testTableAccess(tableName) {
  console.log(`\n🔍 Testing access to table: ${tableName}`);
  
  try {
    // Test SELECT access
    const { data: selectData, error: selectError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log(`  ❌ SELECT error: ${selectError.message}`);
    } else {
      console.log(`  ✅ SELECT: ${selectData?.length || 0} records`);
    }

    // Test INSERT access (only for tables with client_id)
    if (tableName !== 'trainer' && tableName !== 'trainer_client_web') {
      const testRecord = {
        client_id: 34, // Use a known client ID
        test_field: 'test_value',
        created_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from(tableName)
        .insert([testRecord])
        .select();

      if (insertError) {
        console.log(`  ❌ INSERT error: ${insertError.message}`);
      } else {
        console.log(`  ✅ INSERT: Success`);
        
        // Clean up - delete the test record
        if (insertData && insertData.length > 0) {
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', insertData[0].id);
          
          if (deleteError) {
            console.log(`  ⚠️  Could not clean up test record: ${deleteError.message}`);
          } else {
            console.log(`  ✅ Cleaned up test record`);
          }
        }
      }
    } else {
      console.log(`  ⏭️  Skipping INSERT test for ${tableName} (special table)`);
    }

  } catch (error) {
    console.log(`  ❌ Unexpected error for ${tableName}: ${error.message}`);
  }
}

verifyAllTablesAccess(); 