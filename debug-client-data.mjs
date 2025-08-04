import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugClientData() {
  console.log('🔍 Debugging Client Data Issue...\n');

  try {
    // 1. Check if we can connect to Supabase
    console.log('1️⃣ Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('trainer')
      .select('id, trainer_email')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    console.log('✅ Connection successful\n');

    // 2. Check trainer table
    console.log('2️⃣ Checking trainer table...');
    const { data: trainers, error: trainerError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name');
    
    if (trainerError) {
      console.error('❌ Error fetching trainers:', trainerError);
      return;
    }
    console.log(`📊 Found ${trainers?.length || 0} trainers:`);
    trainers?.forEach(t => console.log(`   - ${t.trainer_email} (ID: ${t.id})`));
    console.log('');

    // 3. Check client table
    console.log('3️⃣ Checking client table...');
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name');
    
    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return;
    }
    console.log(`📊 Found ${clients?.length || 0} clients:`);
    clients?.forEach(c => console.log(`   - ${c.cl_name} (ID: ${c.client_id})`));
    console.log('');

    // 4. Check trainer_client_web table
    console.log('4️⃣ Checking trainer_client_web table...');
    const { data: relationships, error: relError } = await supabase
      .from('trainer_client_web')
      .select('trainer_id, client_id, status');
    
    if (relError) {
      console.error('❌ Error fetching relationships:', relError);
      return;
    }
    console.log(`📊 Found ${relationships?.length || 0} trainer-client relationships:`);
    relationships?.forEach(r => console.log(`   - Trainer ${r.trainer_id} -> Client ${r.client_id} (${r.status})`));
    console.log('');

    // 5. Check for specific trainer (vmalik9@gmail.com)
    console.log('5️⃣ Checking for trainer vmalik9@gmail.com...');
    const { data: specificTrainer, error: specificTrainerError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name')
      .eq('trainer_email', 'vmalik9@gmail.com');
    
    if (specificTrainerError) {
      console.error('❌ Error fetching specific trainer:', specificTrainerError);
      return;
    }
    
    if (specificTrainer && specificTrainer.length > 0) {
      const trainer = specificTrainer[0];
      console.log(`✅ Found trainer: ${trainer.trainer_name} (ID: ${trainer.id})`);
      
      // Check relationships for this trainer
      const { data: trainerRels, error: trainerRelError } = await supabase
        .from('trainer_client_web')
        .select('client_id, status')
        .eq('trainer_id', trainer.id);
      
      if (trainerRelError) {
        console.error('❌ Error fetching trainer relationships:', trainerRelError);
        return;
      }
      
      console.log(`📊 Trainer has ${trainerRels?.length || 0} client relationships:`);
      trainerRels?.forEach(rel => console.log(`   - Client ${rel.client_id} (${rel.status})`));
      
      if (trainerRels && trainerRels.length > 0) {
        const clientIds = trainerRels.map(r => r.client_id);
        console.log(`\n🔍 Fetching client details for IDs: ${clientIds.join(', ')}`);
        
        const { data: clientDetails, error: clientDetailsError } = await supabase
          .from('client')
          .select('client_id, cl_name, last_checkIn, last_active')
          .in('client_id', clientIds);
        
        if (clientDetailsError) {
          console.error('❌ Error fetching client details:', clientDetailsError);
          return;
        }
        
        console.log(`📊 Found ${clientDetails?.length || 0} client details:`);
        clientDetails?.forEach(c => console.log(`   - ${c.cl_name} (ID: ${c.client_id}) - Last active: ${c.last_active || 'N/A'}`));
      } else {
        console.log('❌ No client relationships found for this trainer');
      }
    } else {
      console.log('❌ Trainer vmalik9@gmail.com not found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugClientData(); 