import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTrainerRecord() {
  console.log('🔧 Creating trainer record for vmalik9@gmail.com...\n');

  try {
    // Check if trainer already exists
    const { data: existingTrainer, error: checkError } = await supabase
      .from('trainer')
      .select('id, trainer_email, trainer_name')
      .eq('trainer_email', 'vmalik9@gmail.com');
    
    if (checkError) {
      console.error('❌ Error checking existing trainer:', checkError);
      return;
    }

    if (existingTrainer && existingTrainer.length > 0) {
      console.log('✅ Trainer already exists:', existingTrainer[0]);
      return;
    }

    // Create trainer record
    const trainerRecord = {
      trainer_email: 'vmalik9@gmail.com',
      trainer_name: 'Vikas Malik',
      trainer_password: null, // Using OAuth, so no password
      phone: null,
      date_of_birth: null,
      business_name: null,
      website: null,
      experience_years: null,
      profile_picture_url: null,
      certifications: null,
      certification_files: null,
      specialties: null,
      client_populations: null,
      service_offerings: null,
      session_rate: null,
      package_rates_available: false,
      online_training_rate: null,
      availability_days: null,
      preferred_hours: null,
      profile_completion_percentage: 20, // Basic info completed
      is_active: true,
      terms_accepted: true,
      privacy_accepted: true,
      updated_at: new Date().toISOString()
    };

    const { data: newTrainer, error: insertError } = await supabase
      .from('trainer')
      .insert([trainerRecord])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating trainer record:', insertError);
      return;
    }

    console.log('✅ Trainer record created successfully:', newTrainer);

    // Now create relationships with existing clients
    console.log('\n🔗 Creating trainer-client relationships...');
    
    // Get all existing clients
    const { data: clients, error: clientsError } = await supabase
      .from('client')
      .select('client_id, cl_name');
    
    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      return;
    }

    if (clients && clients.length > 0) {
      // Create relationships for all clients
      const relationships = clients.map(client => ({
        trainer_id: newTrainer.id,
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

      console.log(`✅ Created ${newRelationships?.length || 0} trainer-client relationships`);
      console.log('📊 Relationships created:');
      newRelationships?.forEach(rel => {
        const client = clients.find(c => c.client_id === rel.client_id);
        console.log(`   - ${client?.cl_name} (ID: ${rel.client_id}) - ${rel.status}`);
      });
    } else {
      console.log('⚠️  No clients found to create relationships with');
    }

    console.log('\n🎉 Setup complete! You should now see client data in the application.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTrainerRecord(); 