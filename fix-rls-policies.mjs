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

async function checkAndFixRLSPolicies() {
  console.log('🔍 Checking and fixing RLS policies...\n');

  try {
    // Check current RLS policies
    console.log('1️⃣ Checking current RLS policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'trainer' });
    
    if (policiesError) {
      console.log('⚠️  Could not fetch policies, will create them...');
    } else {
      console.log('📊 Current trainer table policies:', policies);
    }

    // Create or update RLS policies for trainer table
    console.log('\n2️⃣ Creating/updating trainer table RLS policies...');
    
    // Policy for trainers to view their own profile
    const { error: trainerSelectError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'trainer',
      policy_name: 'Trainers can view own profile',
      operation: 'SELECT',
      definition: 'trainer_email = auth.uid()::text'
    });

    if (trainerSelectError) {
      console.log('⚠️  Error creating trainer SELECT policy:', trainerSelectError.message);
    } else {
      console.log('✅ Trainer SELECT policy created/updated');
    }

    // Policy for trainers to update their own profile
    const { error: trainerUpdateError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'trainer',
      policy_name: 'Trainers can update own profile',
      operation: 'UPDATE',
      definition: 'trainer_email = auth.uid()::text'
    });

    if (trainerUpdateError) {
      console.log('⚠️  Error creating trainer UPDATE policy:', trainerUpdateError.message);
    } else {
      console.log('✅ Trainer UPDATE policy created/updated');
    }

    // Create or update RLS policies for trainer_client_web table
    console.log('\n3️⃣ Creating/updating trainer_client_web table RLS policies...');
    
    // Policy for trainers to view their client relationships
    const { error: relSelectError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'trainer_client_web',
      policy_name: 'Trainers can view their client relationships',
      operation: 'SELECT',
      definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
    });

    if (relSelectError) {
      console.log('⚠️  Error creating relationship SELECT policy:', relSelectError.message);
    } else {
      console.log('✅ Relationship SELECT policy created/updated');
    }

    // Policy for trainers to insert their client relationships
    const { error: relInsertError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'trainer_client_web',
      policy_name: 'Trainers can insert their client relationships',
      operation: 'INSERT',
      definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
    });

    if (relInsertError) {
      console.log('⚠️  Error creating relationship INSERT policy:', relInsertError.message);
    } else {
      console.log('✅ Relationship INSERT policy created/updated');
    }

    // Policy for trainers to update their client relationships
    const { error: relUpdateError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'trainer_client_web',
      policy_name: 'Trainers can update their client relationships',
      operation: 'UPDATE',
      definition: 'EXISTS (SELECT 1 FROM trainer t WHERE t.id = trainer_client_web.trainer_id AND t.trainer_email = auth.uid()::text)'
    });

    if (relUpdateError) {
      console.log('⚠️  Error creating relationship UPDATE policy:', relUpdateError.message);
    } else {
      console.log('✅ Relationship UPDATE policy created/updated');
    }

    // Create or update RLS policies for client table
    console.log('\n4️⃣ Creating/updating client table RLS policies...');
    
    // Policy for trainers to view clients they have relationships with
    const { error: clientSelectError } = await supabase.rpc('create_policy_if_not_exists', {
      table_name: 'client',
      policy_name: 'Trainers can view their clients',
      operation: 'SELECT',
      definition: 'EXISTS (SELECT 1 FROM trainer_client_web tcw JOIN trainer t ON t.id = tcw.trainer_id WHERE tcw.client_id = client.client_id AND t.trainer_email = auth.uid()::text)'
    });

    if (clientSelectError) {
      console.log('⚠️  Error creating client SELECT policy:', clientSelectError.message);
    } else {
      console.log('✅ Client SELECT policy created/updated');
    }

    console.log('\n🎉 RLS policies setup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAndFixRLSPolicies(); 