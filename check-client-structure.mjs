import { createClient } from '@supabase/supabase-js';
import { env } from './client/src/env.ts';

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkClientStructure() {
  console.log('🔍 Checking client table structure...');
  
  try {
    // Get a sample record to see the structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('client')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample client data:');
      console.log(JSON.stringify(sampleData[0], null, 2));
      
      console.log('\n📋 Available columns:');
      Object.keys(sampleData[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof sampleData[0][column]}`);
      });
      
      // Try to find client 34 using different possible ID fields
      const possibleIdFields = ['id', 'client_id', 'user_id', 'uid'];
      
      for (const idField of possibleIdFields) {
        if (sampleData[0].hasOwnProperty(idField)) {
          console.log(`\n🔍 Trying to find client 34 using field: ${idField}`);
          
          const { data: clientData, error: clientError } = await supabase
            .from('client')
            .select('*')
            .eq(idField, 34)
            .single();
          
          if (!clientError && clientData) {
            console.log(`✅ Found client 34 using field "${idField}":`);
            console.log(JSON.stringify(clientData, null, 2));
            return clientData;
          } else {
            console.log(`❌ No client found with ${idField} = 34`);
          }
        }
      }
      
      // If no ID field works, try to get all clients and find one
      console.log('\n🔍 Getting all clients to find client 34...');
      const { data: allClients, error: allError } = await supabase
        .from('client')
        .select('*')
        .limit(10);
      
      if (!allError && allClients) {
        console.log(`📊 Found ${allClients.length} clients:`);
        allClients.forEach((client, index) => {
          console.log(`  ${index + 1}. Client data:`, client);
        });
      }
    } else {
      console.log('❌ No data found in client table');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkClientStructure().catch(console.error);
