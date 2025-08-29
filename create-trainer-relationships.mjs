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

async function createTrainerRelationships() {
  console.log('🔗 Creating trainer-client relationships...\n');

  try {
    // Get the trainer record
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name')
      .eq('trainer_email', 'vmalik9@gmail.com')
      .single();
    
    if (trainerError) {
      console.error('❌ Error fetching trainer:', trainerError);
      return;
    }

    console.log('✅ Found trainer:', trainer);

    // Get all existing clients
    const { data: clients, error: clientsError } = await supabase
      .from('client')
      .select('client_id, cl_name');
    
    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      return;
    }

    console.log(`📊 Found ${clients?.length || 0} clients`);

    if (clients && clients.length > 0) {
      // Check existing relationships
      const { data: existingRels, error: relCheckError } = await supabase
        .from('trainer_client_web')
        .select('client_id, status')
        .eq('trainer_id', trainer.id);
      
      if (relCheckError) {
        console.error('❌ Error checking existing relationships:', relCheckError);
        return;
      }

      console.log(`📊 Found ${existingRels?.length || 0} existing relationships`);

      // Find clients that don't have relationships
      const existingClientIds = existingRels?.map(rel => rel.client_id) || [];
      const clientsNeedingRelationships = clients.filter(client => 
        !existingClientIds.includes(client.client_id)
      );

      console.log(`📊 Need to create relationships for ${clientsNeedingRelationships.length} clients`);

      if (clientsNeedingRelationships.length > 0) {
        // Create relationships for missing clients
        const relationships = clientsNeedingRelationships.map(client => ({
          trainer_id: trainer.id,
          client_id: client.client_id,
          status: 'active', // Set as active by default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data: newRelationships, error: relError } = await supabase
          .from('trainer_client_web')
          .insert(relationships)
          .select();

        if (relError) {
          console.error('❌ Error creating relationships:', relError);
          return;
        }

        console.log(`✅ Created ${newRelationships?.length || 0} new trainer-client relationships`);
        console.log('📊 New relationships created:');
        newRelationships?.forEach(rel => {
          const client = clients.find(c => c.client_id === rel.client_id);
          console.log(`   - ${client?.cl_name} (ID: ${rel.client_id}) - ${rel.status}`);
        });
      } else {
        console.log('✅ All clients already have relationships');
      }
    } else {
      console.log('⚠️  No clients found to create relationships with');
    }

    console.log('\n🎉 Setup complete! You should now see client data in the application.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTrainerRelationships(); 