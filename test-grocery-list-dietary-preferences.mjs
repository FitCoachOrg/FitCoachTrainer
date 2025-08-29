// Test script to verify grocery list generation respects dietary preferences
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGroceryListDietaryPreferences() {
  console.log('🧪 Testing Grocery List Dietary Preferences...\n');
  
  try {
    // Get a test client with dietary preferences
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name, diet_preferences, food_allergies')
      .limit(5);
    
    if (clientError || !clients || clients.length === 0) {
      console.error('❌ No clients found for testing');
      return;
    }
    
    console.log('📋 Found clients with dietary preferences:');
    clients.forEach(client => {
      console.log(`  - Client ${client.client_id} (${client.cl_name}): ${client.diet_preferences?.join(', ') || 'None'} | Allergies: ${client.food_allergies || 'None'}`);
    });
    
    // Test with a vegetarian client
    const vegetarianClient = clients.find(c => c.diet_preferences?.includes('vegetarian'));
    const testClient = vegetarianClient || clients[0];
    
    console.log(`\n🎯 Testing with client: ${testClient.cl_name} (ID: ${testClient.client_id})`);
    console.log(`   Dietary preferences: ${testClient.diet_preferences?.join(', ') || 'None'}`);
    console.log(`   Allergies: ${testClient.food_allergies || 'None'}`);
    
    // Test date range (current week)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const endDateString = endDate.toISOString().split('T')[0];
    
    console.log(`\n📅 Testing date range: ${startDateString} to ${endDateString}`);
    
    // Step 1: Check if nutrition plan exists
    console.log('\n1️⃣ Checking nutrition plan data...');
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', testClient.client_id)
      .eq('type', 'meal')
      .gte('for_date', startDateString)
      .lte('for_date', endDateString);
    
    if (scheduleError) {
      console.error('❌ Error fetching schedule data:', scheduleError);
      return;
    }
    
    console.log(`📊 Found ${scheduleData?.length || 0} nutrition plan entries`);
    
    if (!scheduleData || scheduleData.length === 0) {
      console.log('ℹ️  No nutrition plan found. Creating a test plan...');
      
      // Create a simple test nutrition plan
      const testPlan = [
        {
          day: 'Monday',
          breakfast: { name: 'Oatmeal with Berries', amount: '1 cup oats, 1/2 cup berries' },
          lunch: { name: 'Quinoa Salad', amount: '1 cup quinoa, 2 cups vegetables' },
          dinner: { name: 'Lentil Soup', amount: '2 cups lentils, 1 cup vegetables' },
          snacks: { name: 'Apple with Nuts', amount: '1 apple, 1/4 cup nuts' }
        }
      ];
      
      console.log('📝 Test nutrition plan created');
      console.log('   Breakfast:', testPlan[0].breakfast.name);
      console.log('   Lunch:', testPlan[0].lunch.name);
      console.log('   Dinner:', testPlan[0].dinner.name);
      console.log('   Snacks:', testPlan[0].snacks.name);
      
      // Test the grocery list generation with dietary preferences
      await testGroceryListGeneration(testPlan, testClient);
    } else {
      console.log('📝 Using existing nutrition plan data');
      
      // Transform schedule data to DayPlan format
      const nutritionPlan = transformScheduleDataToDayPlan(scheduleData);
      console.log(`📊 Transformed to ${nutritionPlan.length} days`);
      
      // Test the grocery list generation with dietary preferences
      await testGroceryListGeneration(nutritionPlan, testClient);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testGroceryListGeneration(nutritionPlan, client) {
  console.log('\n2️⃣ Testing grocery list generation with dietary preferences...');
  
  try {
    // Import the grocery list generation function
    const { generateGroceryList } = await import('./client/src/lib/ai-grocery-list.ts');
    
    // Generate grocery list with dietary preferences
    const groceryListJson = await generateGroceryList(
      nutritionPlan, 
      client.diet_preferences, 
      client.food_allergies
    );
    
    console.log('✅ Grocery list generated successfully');
    console.log('\n📋 Generated grocery list:');
    console.log(groceryListJson);
    
    // Parse and analyze the grocery list
    try {
      const groceryListData = JSON.parse(groceryListJson);
      
      if (groceryListData.categories) {
        console.log('\n3️⃣ Analyzing grocery list for dietary compliance...');
        
        const allItems = [];
        groceryListData.categories.forEach(category => {
          category.items.forEach(item => {
            allItems.push(item.text.toLowerCase());
          });
        });
        
        console.log(`📊 Total items: ${allItems.length}`);
        
        // Check for non-vegetarian items if client is vegetarian
        if (client.diet_preferences?.includes('vegetarian')) {
          const nonVegItems = allItems.filter(item => 
            item.includes('chicken') || 
            item.includes('beef') || 
            item.includes('pork') || 
            item.includes('lamb') || 
            item.includes('turkey') || 
            item.includes('fish') || 
            item.includes('salmon') || 
            item.includes('tuna') || 
            item.includes('meat') || 
            item.includes('seafood') ||
            item.includes('egg') ||
            item.includes('gelatin')
          );
          
          if (nonVegItems.length > 0) {
            console.log('❌ NON-VEGETARIAN ITEMS FOUND:');
            nonVegItems.forEach(item => console.log(`   - ${item}`));
          } else {
            console.log('✅ No non-vegetarian items found - dietary preferences respected!');
          }
        }
        
        // Check for vegan violations if client is vegan
        if (client.diet_preferences?.includes('vegan')) {
          const nonVeganItems = allItems.filter(item => 
            item.includes('milk') || 
            item.includes('cheese') || 
            item.includes('yogurt') || 
            item.includes('butter') || 
            item.includes('cream') || 
            item.includes('honey') ||
            item.includes('egg') ||
            item.includes('gelatin')
          );
          
          if (nonVeganItems.length > 0) {
            console.log('❌ NON-VEGAN ITEMS FOUND:');
            nonVeganItems.forEach(item => console.log(`   - ${item}`));
          } else {
            console.log('✅ No non-vegan items found - dietary preferences respected!');
          }
        }
        
        // Check for gluten if client is gluten-free
        if (client.diet_preferences?.includes('gluten-free')) {
          const glutenItems = allItems.filter(item => 
            item.includes('wheat') || 
            item.includes('bread') || 
            item.includes('pasta') || 
            item.includes('cereal') || 
            item.includes('flour') ||
            item.includes('barley') ||
            item.includes('rye')
          );
          
          if (glutenItems.length > 0) {
            console.log('❌ GLUTEN-CONTAINING ITEMS FOUND:');
            glutenItems.forEach(item => console.log(`   - ${item}`));
          } else {
            console.log('✅ No gluten-containing items found - dietary preferences respected!');
          }
        }
        
        // Check for dairy if client is dairy-free
        if (client.diet_preferences?.includes('dairy-free')) {
          const dairyItems = allItems.filter(item => 
            item.includes('milk') || 
            item.includes('cheese') || 
            item.includes('yogurt') || 
            item.includes('butter') || 
            item.includes('cream') ||
            item.includes('dairy')
          );
          
          if (dairyItems.length > 0) {
            console.log('❌ DAIRY ITEMS FOUND:');
            dairyItems.forEach(item => console.log(`   - ${item}`));
          } else {
            console.log('✅ No dairy items found - dietary preferences respected!');
          }
        }
        
        // Check for allergy violations
        if (client.food_allergies) {
          const allergies = client.food_allergies.toLowerCase().split(',').map(a => a.trim());
          const allergyViolations = allItems.filter(item => 
            allergies.some(allergy => item.includes(allergy))
          );
          
          if (allergyViolations.length > 0) {
            console.log('❌ ALLERGY VIOLATIONS FOUND:');
            allergyViolations.forEach(item => console.log(`   - ${item}`));
          } else {
            console.log('✅ No allergy violations found - allergies respected!');
          }
        }
        
      } else {
        console.log('⚠️  Invalid grocery list format - no categories found');
      }
      
    } catch (parseError) {
      console.error('❌ Error parsing grocery list JSON:', parseError);
      console.log('Raw response:', groceryListJson);
    }
    
  } catch (error) {
    console.error('❌ Error generating grocery list:', error);
  }
}

function transformScheduleDataToDayPlan(scheduleData) {
  const dayPlanMap = new Map();
  
  scheduleData.forEach(item => {
    const day = new Date(item.for_date).toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!dayPlanMap.has(day)) {
      dayPlanMap.set(day, {
        day: day,
        breakfast: { name: '', amount: '' },
        lunch: { name: '', amount: '' },
        dinner: { name: '', amount: '' },
        snacks: { name: '', amount: '' }
      });
    }
    
    const dayPlan = dayPlanMap.get(day);
    const mealType = item.summary.toLowerCase().includes('breakfast') ? 'breakfast' :
                    item.summary.toLowerCase().includes('lunch') ? 'lunch' :
                    item.summary.toLowerCase().includes('dinner') ? 'dinner' : 'snacks';
    
    dayPlan[mealType] = {
      name: item.summary.replace(/^[\w ]+:\s*/, ''),
      amount: item.details_json?.amount || ''
    };
  });
  
  return Array.from(dayPlanMap.values());
}

// Run the test
testGroceryListDietaryPreferences().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
