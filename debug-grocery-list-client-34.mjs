// Debug script to investigate grocery list generation for client_id = 34
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugGroceryListClient34() {
  console.log('🔍 Debugging Grocery List Generation for Client ID = 34\n');
  
  try {
    // 1. Get client information
    console.log('1️⃣ Fetching client information...');
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', 34)
      .single();
    
    if (clientError) {
      console.error('❌ Error fetching client:', clientError);
      return;
    }
    
    console.log('✅ Client found:', {
      id: client.client_id,
      name: client.cl_name,
      diet_preferences: client.diet_preferences,
      food_allergies: client.food_allergies
    });
    
    // 2. Get current week's nutrition plan
    console.log('\n2️⃣ Fetching nutrition plan data...');
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
    
    console.log('📅 Week start date:', weekStart.toISOString().split('T')[0]);
    
    // Check schedule_preview table
    const { data: schedulePreview, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date');
    
    if (previewError) {
      console.error('❌ Error fetching schedule_preview:', previewError);
    } else {
      console.log(`📊 Found ${schedulePreview?.length || 0} schedule_preview records`);
      if (schedulePreview && schedulePreview.length > 0) {
        console.log('📋 Sample schedule_preview record:');
        console.log(JSON.stringify(schedulePreview[0], null, 2));
      }
    }
    
    // Check schedule table
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', 34)
      .gte('date', weekStart.toISOString().split('T')[0])
      .lte('date', new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date');
    
    if (scheduleError) {
      console.error('❌ Error fetching schedule:', scheduleError);
    } else {
      console.log(`📊 Found ${schedule?.length || 0} schedule records`);
      if (schedule && schedule.length > 0) {
        console.log('📋 Sample schedule record:');
        console.log(JSON.stringify(schedule[0], null, 2));
      }
    }
    
    // 3. Check existing grocery list
    console.log('\n3️⃣ Checking existing grocery list...');
    const { data: groceryList, error: groceryError } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('client_id', 34)
      .eq('week_start', weekStart.toISOString().split('T')[0])
      .single();
    
    if (groceryError) {
      if (groceryError.code === 'PGRST116') {
        console.log('ℹ️  No existing grocery list found for this week');
      } else {
        console.error('❌ Error fetching grocery list:', groceryError);
      }
    } else {
      console.log('📋 Existing grocery list found:');
      console.log(JSON.stringify(groceryList, null, 2));
    }
    
    // 4. Check all grocery lists for this client
    console.log('\n4️⃣ Checking all grocery lists for client 34...');
    const { data: allGroceryLists, error: allGroceryError } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('client_id', 34)
      .order('week_start', { ascending: false });
    
    if (allGroceryError) {
      console.error('❌ Error fetching all grocery lists:', allGroceryError);
    } else {
      console.log(`📊 Found ${allGroceryLists?.length || 0} total grocery lists for client 34`);
      if (allGroceryLists && allGroceryLists.length > 0) {
        console.log('📋 Most recent grocery list:');
        console.log(JSON.stringify(allGroceryLists[0], null, 2));
        
        // Check if all grocery lists are identical (static)
        if (allGroceryLists.length > 1) {
          console.log('\n🔍 Comparing grocery lists for static content...');
          const firstList = allGroceryLists[0].grocery_list;
          const secondList = allGroceryLists[1].grocery_list;
          
          if (JSON.stringify(firstList) === JSON.stringify(secondList)) {
            console.log('⚠️  WARNING: Grocery lists appear to be identical (static)!');
            console.log('   This suggests hardcoded content or caching issues.');
          } else {
            console.log('✅ Grocery lists are different (not static)');
          }
        }
      }
    }
    
    // 5. Check for hardcoded elements in the code
    console.log('\n5️⃣ Checking for hardcoded elements in code...');
    await checkForHardcodedElements();
    
    // 6. Test the actual generation process
    console.log('\n6️⃣ Testing grocery list generation process...');
    await testGroceryListGeneration();
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function checkForHardcodedElements() {
  console.log('🔍 Searching for hardcoded client_id = 34...');
  
  // Check common files for hardcoded values
  const filesToCheck = [
    'client/src/lib/grocery-list-service.ts',
    'client/src/lib/ai-grocery-list.ts',
    'client/src/components/NutritionPlanSection.tsx'
  ];
  
  for (const file of filesToCheck) {
    try {
      const fs = await import('fs');
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('34') || content.includes('client_id') || content.includes('clientId')) {
          console.log(`📄 Found potential hardcoded elements in ${file}:`);
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('34') || (line.includes('client_id') && line.includes('='))) {
              console.log(`   Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not check ${file}:`, error.message);
    }
  }
}

async function testGroceryListGeneration() {
  console.log('🧪 Testing grocery list generation...');
  
  try {
    // Import the grocery list service
    const { generateGroceryListFromPlan } = await import('./client/src/lib/grocery-list-service.ts');
    
    // Test with current date
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    console.log('📅 Testing with week start:', weekStart.toISOString().split('T')[0]);
    
    // This would require the actual function to be available
    // For now, we'll simulate the process
    console.log('ℹ️  Note: Actual generation test would require running in the application context');
    
  } catch (error) {
    console.log('⚠️  Could not test generation:', error.message);
  }
}

// Run the debug
debugGroceryListClient34().then(() => {
  console.log('\n🏁 Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
