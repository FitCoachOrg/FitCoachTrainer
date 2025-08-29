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

async function applyRLSFixes() {
  console.log('🔧 Applying RLS policy fixes...\n');

  try {
    // Enable RLS on tables
    console.log('1️⃣ Enabling RLS on tables...');
    
    const tables = ['trainer', 'trainer_client_web', 'client'];
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      if (error) {
        console.log(`⚠️  Error enabling RLS on ${table}:`, error.message);
      } else {
        console.log(`✅ Enabled RLS on ${table}`);
      }
    }

    // Drop existing policies and create new ones
    console.log('\n2️⃣ Creating trainer table policies...');
    
    const trainerPolicies = [
      {
        name: 'Trainers can view own profile',
        operation: 'SELECT',
        definition: 'trainer_email = auth.uid()::text'
      },
      {
        name: 'Trainers can update own profile',
        operation: 'UPDATE',
        definition: 'trainer_email = auth.uid()::text'
      }
    ];

    for (const policy of trainerPolicies) {
      // Drop existing policy
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON trainer;`
      });
      
      // Create new policy
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "${policy.name}" ON trainer FOR ${policy.operation} USING (${policy.definition});`
      });
      
      if (createError) {
        console.log(`⚠️  Error creating ${policy.name}:`, createError.message);
      } else {
        console.log(`✅ Created ${policy.name}`);
      }
    }

    console.log('\n3️⃣ Creating trainer_client_web table policies...');
    
    const relationshipPolicies = [
      {
        name: 'Trainers can view their client relationships',
        operation: 'SELECT',
        definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
      },
      {
        name: 'Trainers can insert their client relationships',
        operation: 'INSERT',
        definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
      },
      {
        name: 'Trainers can update their client relationships',
        operation: 'UPDATE',
        definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
      }
    ];

    for (const policy of relationshipPolicies) {
      // Drop existing policy
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON trainer_client_web;`
      });
      
      // Create new policy
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "${policy.name}" ON trainer_client_web FOR ${policy.operation} USING (${policy.definition});`
      });
      
      if (createError) {
        console.log(`⚠️  Error creating ${policy.name}:`, createError.message);
      } else {
        console.log(`✅ Created ${policy.name}`);
      }
    }

    console.log('\n4️⃣ Creating client table policies...');
    
    const clientPolicies = [
      {
        name: 'Trainers can view their clients',
        operation: 'SELECT',
        definition: 'EXISTS (SELECT 1 FROM trainer_client_web tcw JOIN trainer t ON t.id = tcw.trainer_id WHERE tcw.client_id = client.client_id AND t.trainer_email = auth.uid()::text)'
      }
    ];

    for (const policy of clientPolicies) {
      // Drop existing policy
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON client;`
      });
      
      // Create new policy
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY "${policy.name}" ON client FOR ${policy.operation} USING (${policy.definition});`
      });
      
      if (createError) {
        console.log(`⚠️  Error creating ${policy.name}:`, createError.message);
      } else {
        console.log(`✅ Created ${policy.name}`);
      }
    }

    console.log('\n🎉 RLS policy fixes applied successfully!');
    console.log('🔄 Please refresh your browser and try accessing the clients page again.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyRLSFixes(); 