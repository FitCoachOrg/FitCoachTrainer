import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testMinimalEdgeFunction() {
  console.log('🧪 Testing Minimal Edge Function Logic...');
  
  try {
    // Minimal test - just fetch one client
    console.log('📋 Fetching one client...');
    const { data: clients, error: clientError } = await supabase
      .from("client")
      .select("client_id, cl_name")
      .limit(1);
      
    if (clientError) {
      console.error('❌ Client fetch error:', clientError);
      return;
    }
    
    if (clients && clients.length > 0) {
      console.log(`✅ Successfully fetched client: ${clients[0].cl_name} (ID: ${clients[0].client_id})`);
    } else {
      console.log('⚠️  No clients found');
    }
    
    console.log('✅ Minimal test passed!');
    
  } catch (error) {
    console.error('❌ Error in minimal test:', error);
  }
}

testMinimalEdgeFunction(); 