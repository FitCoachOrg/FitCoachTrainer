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

async function verifyCurrentState() {
  console.log('🔍 Verifying current database state...\n');

  try {
    // Check trainer table
    console.log('1️⃣ Checking trainer table...');
    const { data: trainers, error: trainerError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name');
    
    if (trainerError) {
      console.error('❌ Error fetching trainers:', trainerError);
    } else {
      console.log(`📊 Found ${trainers?.length || 0} trainers:`);
      trainers?.forEach(t => console.log(`   - ${t.trainer_email} (ID: ${t.id}) - ${t.trainer_name}`));
    }

    // Check client table
    console.log('\n2️⃣ Checking client table...');
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name');
    
    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
    } else {
      console.log(`📊 Found ${clients?.length || 0} clients:`);
      clients?.forEach(c => console.log(`   - ${c.cl_name} (ID: ${c.client_id})`));
    }

    // Check trainer_client_web table
    console.log('\n3️⃣ Checking trainer_client_web table...');
    const { data: relationships, error: relError } = await supabase
      .from('trainer_client_web')
      .select('trainer_id, client_id, status');
    
    if (relError) {
      console.error('❌ Error fetching relationships:', relError);
    } else {
      console.log(`📊 Found ${relationships?.length || 0} relationships:`);
      relationships?.forEach(r => console.log(`   - Trainer ${r.trainer_id} -> Client ${r.client_id} (${r.status})`));
    }

    // Check specific trainer (vmalik9@gmail.com)
    console.log('\n4️⃣ Checking specific trainer...');
    const { data: specificTrainer, error: specificError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name')
      .eq('trainer_email', 'vmalik9@gmail.com');
    
    if (specificError) {
      console.error('❌ Error fetching specific trainer:', specificError);
    } else if (specificTrainer && specificTrainer.length > 0) {
      const trainer = specificTrainer[0];
      console.log(`✅ Found trainer: ${trainer.trainer_name} (ID: ${trainer.id})`);
      
      // Check relationships for this trainer
      const { data: trainerRels, error: trainerRelError } = await supabase
        .from('trainer_client_web')
        .select('client_id, status')
        .eq('trainer_id', trainer.id);
      
      if (trainerRelError) {
        console.error('❌ Error fetching trainer relationships:', trainerRelError);
      } else {
        console.log(`📊 Trainer has ${trainerRels?.length || 0} client relationships`);
        
        if (trainerRels && trainerRels.length > 0) {
          const clientIds = trainerRels.map(r => r.client_id);
          console.log(`🔍 Client IDs: ${clientIds.join(', ')}`);
          
          // Get client details
          const { data: clientDetails, error: clientDetailsError } = await supabase
            .from('client')
            .select('client_id, cl_name, last_checkIn, last_active')
            .in('client_id', clientIds);
          
          if (clientDetailsError) {
            console.error('❌ Error fetching client details:', clientDetailsError);
          } else {
            console.log(`📊 Found ${clientDetails?.length || 0} client details:`);
            clientDetails?.forEach(c => console.log(`   - ${c.cl_name} (ID: ${c.client_id}) - Last active: ${c.last_active || 'N/A'}`));
          }
        }
      }
    } else {
      console.log('❌ Trainer vmalik9@gmail.com not found');
    }

    console.log('\n📋 Summary:');
    console.log(`   - Trainers: ${trainers?.length || 0}`);
    console.log(`   - Clients: ${clients?.length || 0}`);
    console.log(`   - Relationships: ${relationships?.length || 0}`);
    
    if (specificTrainer && specificTrainer.length > 0) {
      const trainer = specificTrainer[0];
      const trainerRels = relationships?.filter(r => r.trainer_id === trainer.id) || [];
      console.log(`   - Your trainer relationships: ${trainerRels.length}`);
    }

    console.log('\n💡 If you see relationships but no client data in the app, the issue is likely with RLS policies.');
    console.log('🔄 Run the SQL script in your Supabase dashboard to fix RLS policies.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyCurrentState(); 