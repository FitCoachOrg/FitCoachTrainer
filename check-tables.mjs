import { createClient } from '@supabase/supabase-js';
import { env } from './client/src/env.ts';

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 Checking available tables...');
  
  try {
    // Try to get table information
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('❌ Error accessing information_schema:', error);
      
      // Try some common table names
      const commonTables = [
        'clients',
        'client',
        'users',
        'user',
        'profiles',
        'profile',
        'trainers',
        'trainer'
      ];
      
      console.log('🔍 Trying common table names...');
      
      for (const tableName of commonTables) {
        try {
          const { data: testData, error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!testError) {
            console.log(`✅ Table "${tableName}" exists!`);
            
            // Try to get client 34 from this table
            const { data: clientData, error: clientError } = await supabase
              .from(tableName)
              .select('*')
              .eq('id', 34)
              .single();
            
            if (!clientError && clientData) {
              console.log(`✅ Found client 34 in table "${tableName}":`);
              console.log(JSON.stringify(clientData, null, 2));
              return clientData;
            }
          } else {
            console.log(`❌ Table "${tableName}" does not exist`);
          }
        } catch (e) {
          console.log(`❌ Error checking table "${tableName}":`, e.message);
        }
      }
    } else {
      console.log('📋 Available tables:');
      data.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables().catch(console.error);
