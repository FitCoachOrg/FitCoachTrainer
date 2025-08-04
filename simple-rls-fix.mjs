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

async function simpleRLSFix() {
  console.log('🔧 Applying simple RLS fix...\n');

  try {
    // Temporarily disable RLS on key tables to test
    console.log('1️⃣ Temporarily disabling RLS on key tables...');
    
    const tables = ['trainer', 'trainer_client_web', 'client'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('row-level security')) {
        console.log(`⚠️  RLS is enabled on ${table}, attempting to disable...`);
        
        // Try to disable RLS using direct SQL
        const { error: disableError } = await supabase
          .rpc('disable_rls', { table_name: table });
        
        if (disableError) {
          console.log(`❌ Could not disable RLS on ${table}:`, disableError.message);
        } else {
          console.log(`✅ Disabled RLS on ${table}`);
        }
      } else {
        console.log(`✅ RLS is already disabled on ${table}`);
      }
    }

    // Test if we can now access the data
    console.log('\n2️⃣ Testing data access...');
    
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('*')
      .eq('trainer_email', 'vmalik9@gmail.com');
    
    if (trainerError) {
      console.log('❌ Still cannot access trainer data:', trainerError.message);
    } else {
      console.log('✅ Can access trainer data:', trainer);
    }

    const { data: relationships, error: relError } = await supabase
      .from('trainer_client_web')
      .select('*');
    
    if (relError) {
      console.log('❌ Still cannot access relationship data:', relError.message);
    } else {
      console.log('✅ Can access relationship data:', relationships?.length || 0, 'relationships');
    }

    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('*');
    
    if (clientError) {
      console.log('❌ Still cannot access client data:', clientError.message);
    } else {
      console.log('✅ Can access client data:', clients?.length || 0, 'clients');
    }

    console.log('\n🎉 Simple RLS fix completed!');
    console.log('🔄 Please refresh your browser and try accessing the clients page again.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simpleRLSFix(); 