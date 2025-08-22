// Test script to verify ingredient extraction from nutrition plan
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIngredientExtraction() {
  console.log('🧪 Testing Ingredient Extraction from Nutrition Plan...\n');
  
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
      
      // Create a test nutrition plan with specific ingredients
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
        }
      ];
      
      console.log('📝 Test nutrition plan created with specific ingredients');
      testPlan.forEach(day => {
        console.log(`   ${day.day}:`);
        console.log(`     Breakfast: ${day.breakfast.amount}`);
        console.log(`     Lunch: ${day.lunch.amount}`);
        console.log(`     Dinner: ${day.dinner.amount}`);
        console.log(`     Snacks: ${day.snacks.amount}`);
      });
      
      // Test the ingredient extraction
      await testIngredientExtractionFromPlan(testPlan, testClient);
    } else {
      console.log('📝 Using existing nutrition plan data');
      
      // Transform schedule data to DayPlan format
      const nutritionPlan = transformScheduleDataToDayPlan(scheduleData);
      console.log(`📊 Transformed to ${nutritionPlan.length} days`);
      
      // Show the meal amounts
      nutritionPlan.forEach(day => {
        console.log(`   ${day.day}:`);
        if (day.breakfast?.amount) console.log(`     Breakfast: ${day.breakfast.amount}`);
        if (day.lunch?.amount) console.log(`     Lunch: ${day.lunch.amount}`);
        if (day.dinner?.amount) console.log(`     Dinner: ${day.dinner.amount}`);
        if (day.snacks?.amount) console.log(`     Snacks: ${day.snacks.amount}`);
      });
      
      // Test the ingredient extraction
      await testIngredientExtractionFromPlan(nutritionPlan, testClient);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testIngredientExtractionFromPlan(nutritionPlan, client) {
  console.log('\n2️⃣ Testing ingredient extraction from nutrition plan...');
  
  try {
    // Import the grocery list generation function
    const { generateGroceryList } = await import('./client/src/lib/ai-grocery-list.ts');
    
    // Generate grocery list using ingredient extraction
    const groceryListJson = await generateGroceryList(
      nutritionPlan, 
      client.diet_preferences, 
      client.food_allergies
    );
    
    console.log('✅ Grocery list generated successfully using ingredient extraction');
    console.log('\n📋 Generated grocery list:');
    console.log(groceryListJson);
    
    // Parse and analyze the grocery list
    try {
      const groceryListData = JSON.parse(groceryListJson);
      
      if (groceryListData.categories) {
        console.log('\n3️⃣ Analyzing extracted ingredients...');
        
        const allItems = [];
        groceryListData.categories.forEach(category => {
          console.log(`\n📂 Category: ${category.name}`);
          category.items.forEach(item => {
            console.log(`   - ${item.text}`);
            allItems.push(item.text.toLowerCase());
          });
        });
        
        console.log(`\n📊 Total items extracted: ${allItems.length}`);
        
        // Verify that ingredients match the meal plan
        console.log('\n4️⃣ Verifying ingredient consistency...');
        
        // Extract all ingredients from the nutrition plan for comparison
        const planIngredients = new Set();
        nutritionPlan.forEach(day => {
          const meals = [day.breakfast, day.lunch, day.dinner, day.snacks];
          meals.forEach(meal => {
            if (meal && meal.amount) {
              const ingredients = parseIngredientsFromAmount(meal.amount);
              ingredients.forEach(ingredient => {
                planIngredients.add(ingredient.name.toLowerCase().trim());
              });
            }
          });
        });
        
        console.log('📝 Ingredients from meal plan:', Array.from(planIngredients));
        
        // Check if grocery list items correspond to meal plan ingredients
        const groceryIngredients = allItems.map(item => {
          const match = item.match(/^(.+?)\s*-\s*.+$/);
          return match ? match[1].toLowerCase().trim() : item;
        });
        
        console.log('🛒 Ingredients in grocery list:', groceryIngredients);
        
        // Find missing or extra ingredients
        const missingIngredients = Array.from(planIngredients).filter(ingredient => 
          !groceryIngredients.some(groceryItem => groceryItem.includes(ingredient))
        );
        
        const extraIngredients = groceryIngredients.filter(groceryItem => 
          !Array.from(planIngredients).some(planIngredient => groceryItem.includes(planIngredient))
        );
        
        if (missingIngredients.length > 0) {
          console.log('❌ Missing ingredients from meal plan:');
          missingIngredients.forEach(ingredient => console.log(`   - ${ingredient}`));
        } else {
          console.log('✅ All meal plan ingredients are included in grocery list');
        }
        
        if (extraIngredients.length > 0) {
          console.log('⚠️  Extra ingredients not in meal plan:');
          extraIngredients.forEach(ingredient => console.log(`   - ${ingredient}`));
        } else {
          console.log('✅ No extra ingredients found');
        }
        
        // Check dietary compliance
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
  const dayPlans: { [key: string]: any } = {};

  scheduleData.forEach(item => {
    const day = new Date(item.for_date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayPlans[day]) {
      dayPlans[day] = {
        day,
        breakfast: {},
        lunch: {},
        dinner: {},
        snacks: {},
      };
    }

    const mealType = item.task.toLowerCase();
    dayPlans[day][mealType] = {
      name: item.summary.replace(/^[^:]*: /, ''),
      amount: item.details_json?.amount || '',
      ...item.details_json,
    };
  });

  return Object.values(dayPlans);
}

function parseIngredientsFromAmount(amount) {
  const ingredients = [];
  
  // Split by common separators
  const parts = amount.split(/[,;]/).map(part => part.trim()).filter(part => part.length > 0);
  
  parts.forEach(part => {
    // Match patterns like "1 cup oats", "150g chicken", "2 tbsp olive oil"
    const match = part.match(/^([\d.]+)\s*(cup|g|tbsp|tsp|lb|oz|piece|pieces|slice|slices|can|cans|bag|bags|bunch|bunches|head|heads|clove|cloves|tablespoon|teaspoon|gram|grams|pound|pounds|ounce|ounces|ml|liter|liters)?\s+(.+)$/i);
    
    if (match) {
      const [, quantity, unit, name] = match;
      ingredients.push({
        name: name.trim(),
        quantity: `${quantity}${unit ? ` ${unit}` : ''}`
      });
    } else {
      // If no quantity pattern found, treat the whole part as an ingredient name
      ingredients.push({
        name: part,
        quantity: '1'
      });
    }
  });
  
  return ingredients;
}

// Run the test
testIngredientExtraction().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
