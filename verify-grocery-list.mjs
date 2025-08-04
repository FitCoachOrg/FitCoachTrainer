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

async function verifyGroceryList() {
  console.log('🔍 Verifying grocery_list table...\n');

  try {
    // Check if grocery_list table exists
    console.log('1️⃣ Checking grocery_list table structure...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('grocery_list')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing grocery_list table:', tableError.message);
      
      if (tableError.message.includes('does not exist')) {
        console.log('💡 The grocery_list table does not exist. You may need to create it.');
        return;
      }
    } else {
      console.log('✅ grocery_list table exists and is accessible');
    }

    // Check existing data
    console.log('\n2️⃣ Checking existing grocery_list data...');
    const { data: existingData, error: dataError } = await supabase
      .from('grocery_list')
      .select('*')
      .limit(5);
    
    if (dataError) {
      console.error('❌ Error fetching grocery_list data:', dataError.message);
    } else {
      console.log(`📊 Found ${existingData?.length || 0} existing records`);
      if (existingData && existingData.length > 0) {
        console.log('📋 Sample record structure:');
        console.log(JSON.stringify(existingData[0], null, 2));
      }
    }

    // Check if trainer can access their clients' grocery list data
    console.log('\n3️⃣ Testing trainer access to grocery_list...');
    
    // Get trainer record
    const { data: trainer, error: trainerError } = await supabase
      .from('trainer')
      .select('id')
      .eq('trainer_email', 'vmalik9@gmail.com')
      .single();
    
    if (trainerError) {
      console.error('❌ Error fetching trainer:', trainerError.message);
      return;
    }

    // Get trainer's client relationships
    const { data: relationships, error: relError } = await supabase
      .from('trainer_client_web')
      .select('client_id')
      .eq('trainer_id', trainer.id);
    
    if (relError) {
      console.error('❌ Error fetching relationships:', relError.message);
      return;
    }

    let clientIds = [];
    if (relationships && relationships.length > 0) {
      clientIds = relationships.map(r => r.client_id).filter(id => id !== null);
      console.log(`📊 Trainer has ${clientIds.length} valid client relationships`);
      
      if (clientIds.length > 0) {
        // Try to access grocery_list for these clients
        const { data: groceryData, error: groceryError } = await supabase
          .from('grocery_list')
          .select('*')
          .in('client_id', clientIds)
          .limit(5);
        
        if (groceryError) {
          console.error('❌ Error accessing grocery_list for clients:', groceryError.message);
        } else {
          console.log(`📊 Found ${groceryData?.length || 0} grocery list records for trainer's clients`);
          if (groceryData && groceryData.length > 0) {
            console.log('📋 Sample grocery list record:');
            console.log(JSON.stringify(groceryData[0], null, 2));
          }
        }
      }
    } else {
      console.log('⚠️  No valid client relationships found for trainer');
    }

    // Test inserting a sample record
    console.log('\n4️⃣ Testing insert capability...');
    if (clientIds.length > 0) {
      const testRecord = {
        client_id: clientIds[0], // Use first client ID
        item_name: 'Test Item',
        quantity: 1,
        unit: 'piece',
        category: 'test',
        is_checked: false,
        notes: 'Test grocery item'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('grocery_list')
        .insert([testRecord])
        .select();

      if (insertError) {
        console.error('❌ Error inserting test record:', insertError.message);
      } else {
        console.log('✅ Successfully inserted test record');
        
        // Clean up - delete the test record
        if (insertData && insertData.length > 0) {
          const { error: deleteError } = await supabase
            .from('grocery_list')
            .delete()
            .eq('id', insertData[0].id);
          
          if (deleteError) {
            console.log('⚠️  Could not clean up test record:', deleteError.message);
          } else {
            console.log('✅ Cleaned up test record');
          }
        }
      }
    } else {
      console.log('⚠️  No valid client IDs available for testing insert');
    }

    console.log('\n💡 If you see errors, the RLS policies need to be fixed.');
    console.log('🔄 Run the updated comprehensive SQL script to fix all RLS policies including grocery_list table.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyGroceryList(); 