// Test script to verify hybrid grocery list approach (extraction + LLM consolidation)
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHybridGroceryList() {
  console.log('🧪 Testing Hybrid Grocery List Approach (Extraction + LLM)...\n');
  
  try {
    // Get a test client
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name, diet_preferences, food_allergies')
      .limit(1);
    
    if (clientError || !clients || clients.length === 0) {
      console.error('❌ No clients found for testing');
      return;
    }
    
    const testClient = clients[0];
    console.log(`📋 Using client: ${testClient.cl_name} (ID: ${testClient.client_id})`);
    console.log(`   Dietary preferences: ${testClient.diet_preferences?.join(', ') || 'None'}`);
    console.log(`   Allergies: ${testClient.food_allergies || 'None'}`);
    
    // Create a comprehensive test nutrition plan with various ingredients
    const testPlan = [
      {
        day: 'Monday',
        breakfast: { 
          name: 'Oatmeal with Berries', 
          amount: '1 cup oats, 1/2 cup berries, 1 cup milk, 1 tbsp honey' 
        },
        lunch: { 
          name: 'Quinoa Salad', 
          amount: '1 cup quinoa, 2 cups spinach, 1/2 cup cherry tomatoes, 1/4 cup olive oil' 
        },
        dinner: { 
          name: 'Lentil Soup', 
          amount: '2 cups lentils, 1 cup carrots, 1 cup onions, 2 tbsp olive oil, 1 tsp salt' 
        },
        snacks: { 
          name: 'Apple with Nuts', 
          amount: '1 apple, 1/4 cup almonds' 
        }
      },
      {
        day: 'Tuesday',
        breakfast: { 
          name: 'Greek Yogurt Bowl', 
          amount: '1 cup greek yogurt, 1/2 cup granola, 1 banana, 1 tbsp honey' 
        },
        lunch: { 
          name: 'Chicken Salad', 
          amount: '150g chicken breast, 2 cups mixed greens, 1/2 cup cucumber, 1 tbsp olive oil' 
        },
        dinner: { 
          name: 'Salmon with Rice', 
          amount: '200g salmon, 1 cup brown rice, 1 cup broccoli, 1 tbsp butter' 
        },
        snacks: { 
          name: 'Carrot Sticks', 
          amount: '1 cup carrot sticks, 2 tbsp hummus' 
        }
      },
      {
        day: 'Wednesday',
        breakfast: { 
          name: 'Smoothie Bowl', 
          amount: '1 cup frozen berries, 1 banana, 1 cup almond milk, 1 tbsp honey' 
        },
        lunch: { 
          name: 'Tofu Stir Fry', 
          amount: '200g tofu, 1 cup brown rice, 2 cups mixed vegetables, 2 tbsp soy sauce' 
        },
        dinner: { 
          name: 'Bean Burrito', 
          amount: '1 cup black beans, 2 tortillas, 1 cup lettuce, 1/2 cup tomatoes, 1/4 cup cheese' 
        },
        snacks: { 
          name: 'Mixed Nuts', 
          amount: '1/2 cup mixed nuts' 
        }
      }
    ];
    
    console.log('📝 Test nutrition plan created with comprehensive ingredients');
    console.log('   This plan includes repeated ingredients to test consolidation:');
    console.log('   - olive oil (appears 3 times)');
    console.log('   - honey (appears 3 times)');
    console.log('   - carrots (appears 2 times)');
    console.log('   - berries (appears 2 times)');
    console.log('   - brown rice (appears 2 times)');
    
    // Test the hybrid approach
    await testHybridGroceryListGeneration(testPlan, testClient);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testHybridGroceryListGeneration(nutritionPlan, client) {
  console.log('\n1️⃣ Testing hybrid grocery list generation...');
  
  try {
    // Import the grocery list generation function
    const { generateGroceryList } = await import('./client/src/lib/ai-grocery-list.ts');
    
    // Generate grocery list using hybrid approach
    const groceryListJson = await generateGroceryList(
      nutritionPlan, 
      client.diet_preferences, 
      client.food_allergies
    );
    
    console.log('✅ Grocery list generated successfully using hybrid approach');
    console.log('\n📋 Generated grocery list:');
    console.log(groceryListJson);
    
    // Parse and analyze the grocery list
    try {
      const groceryListData = JSON.parse(groceryListJson);
      
      if (groceryListData.categories) {
        console.log('\n2️⃣ Analyzing consolidated ingredients...');
        
        const allItems = [];
        groceryListData.categories.forEach(category => {
          console.log(`\n📂 Category: ${category.name}`);
          category.items.forEach(item => {
            console.log(`   - ${item.text}`);
            allItems.push(item.text.toLowerCase());
          });
        });
        
        console.log(`\n📊 Total consolidated items: ${allItems.length}`);
        
        // Check for intelligent consolidation
        console.log('\n3️⃣ Checking for intelligent consolidation...');
        
        // Look for consolidated quantities
        const oliveOilItems = allItems.filter(item => item.includes('olive oil'));
        const honeyItems = allItems.filter(item => item.includes('honey'));
        const carrotItems = allItems.filter(item => item.includes('carrot'));
        const berryItems = allItems.filter(item => item.includes('berry') || item.includes('berries'));
        const riceItems = allItems.filter(item => item.includes('rice'));
        
        console.log('🔍 Consolidation Analysis:');
        console.log(`   Olive Oil: ${oliveOilItems.length} item(s) - ${oliveOilItems.join(', ')}`);
        console.log(`   Honey: ${honeyItems.length} item(s) - ${honeyItems.join(', ')}`);
        console.log(`   Carrots: ${carrotItems.length} item(s) - ${carrotItems.join(', ')}`);
        console.log(`   Berries: ${berryItems.length} item(s) - ${berryItems.join(', ')}`);
        console.log(`   Rice: ${riceItems.length} item(s) - ${riceItems.join(', ')}`);
        
        // Check if consolidation worked
        if (oliveOilItems.length === 1 && oliveOilItems[0].includes('3 tbsp')) {
          console.log('✅ Olive oil properly consolidated (3 tbsp total)');
        } else {
          console.log('⚠️  Olive oil consolidation may need improvement');
        }
        
        if (honeyItems.length === 1 && honeyItems[0].includes('3 tbsp')) {
          console.log('✅ Honey properly consolidated (3 tbsp total)');
        } else {
          console.log('⚠️  Honey consolidation may need improvement');
        }
        
        // Check for dietary compliance
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
        
        // Check for proper categorization
        const categories = groceryListData.categories.map(cat => cat.name);
        console.log('\n📂 Categories used:', categories);
        
        const expectedCategories = ['PRODUCE', 'PROTEIN', 'DAIRY', 'GRAINS', 'CONDIMENTS', 'SNACKS'];
        const missingCategories = expectedCategories.filter(cat => !categories.includes(cat));
        
        if (missingCategories.length > 0) {
          console.log('⚠️  Missing expected categories:', missingCategories);
        } else {
          console.log('✅ All expected categories present');
        }
        
        // Check for practical quantities
        const practicalQuantities = allItems.filter(item => 
          item.includes('lb') || 
          item.includes('bag') || 
          item.includes('bunch') || 
          item.includes('package') ||
          item.includes('bottle') ||
          item.includes('jar')
        );
        
        console.log(`\n🛒 Items with practical shopping quantities: ${practicalQuantities.length}/${allItems.length}`);
        if (practicalQuantities.length > 0) {
          console.log('   Examples:', practicalQuantities.slice(0, 3).join(', '));
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

// Run the test
testHybridGroceryList().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
