// Test script to compare meal plan with grocery list for client 34
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function compareMealPlanVsGroceryList() {
  console.log('🔍 Comparing Meal Plan vs Grocery List for Client 34\n');
  
  try {
    // 1. Get the most recent grocery list
    console.log('1️⃣ Fetching most recent grocery list...');
    const { data: groceryLists, error: groceryError } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('client_id', 34)
      .order('week_start', { ascending: false })
      .limit(1);
    
    if (groceryError || !groceryLists || groceryLists.length === 0) {
      console.error('❌ No grocery lists found for client 34');
      return;
    }
    
    const latestGroceryList = groceryLists[0];
    console.log('📅 Grocery list week:', latestGroceryList.week_start);
    console.log('📋 Grocery list categories:', latestGroceryList.grocery_list.categories.map(c => c.name));
    
    // 2. Get meal plan data for the same week
    console.log('\n2️⃣ Fetching meal plan data for the same week...');
    const weekStart = new Date(latestGroceryList.week_start);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    console.log('📅 Week range:', weekStart.toISOString().split('T')[0], 'to', weekEnd.toISOString().split('T')[0]);
    
    // Get schedule_preview data
    const { data: schedulePreview, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .eq('type', 'meal')
      .gte('for_date', weekStart.toISOString().split('T')[0])
      .lte('for_date', weekEnd.toISOString().split('T')[0])
      .order('for_date');
    
    if (previewError) {
      console.error('❌ Error fetching schedule_preview:', previewError);
      return;
    }
    
    console.log(`📊 Found ${schedulePreview?.length || 0} meal records for the week`);
    
    // 3. Extract ingredients from meal plan
    console.log('\n3️⃣ Extracting ingredients from meal plan...');
    const extractedIngredients = [];
    
    if (schedulePreview && schedulePreview.length > 0) {
      schedulePreview.forEach(meal => {
        if (meal.details_json && meal.details_json.amount) {
          console.log(`🍽️ ${meal.task} (${meal.for_date}): ${meal.details_json.amount}`);
          
          // Parse ingredients from amount field
          const ingredients = parseIngredientsFromAmount(meal.details_json.amount);
          ingredients.forEach(ingredient => {
            extractedIngredients.push({
              name: ingredient.name,
              quantity: ingredient.quantity,
              day: meal.for_date,
              meal: meal.task
            });
          });
        }
      });
    }
    
    console.log(`📋 Extracted ${extractedIngredients.length} ingredients from meal plan`);
    
    // 4. Compare with grocery list
    console.log('\n4️⃣ Comparing extracted ingredients with grocery list...');
    const groceryItems = [];
    latestGroceryList.grocery_list.categories.forEach(category => {
      category.items.forEach(item => {
        groceryItems.push(item.text.toLowerCase());
      });
    });
    
    console.log(`🛒 Grocery list has ${groceryItems.length} items`);
    
    // 5. Check for matches and mismatches
    console.log('\n5️⃣ Analyzing ingredient matches...');
    const matchedIngredients = [];
    const unmatchedIngredients = [];
    
    extractedIngredients.forEach(ingredient => {
      const ingredientName = ingredient.name.toLowerCase();
      const found = groceryItems.some(groceryItem => 
        groceryItem.includes(ingredientName) || ingredientName.includes(groceryItem.split(' - ')[0])
      );
      
      if (found) {
        matchedIngredients.push(ingredient);
      } else {
        unmatchedIngredients.push(ingredient);
      }
    });
    
    console.log(`✅ Matched ingredients: ${matchedIngredients.length}/${extractedIngredients.length}`);
    console.log(`❌ Unmatched ingredients: ${unmatchedIngredients.length}/${extractedIngredients.length}`);
    
    if (unmatchedIngredients.length > 0) {
      console.log('\n❌ Unmatched ingredients from meal plan:');
      unmatchedIngredients.forEach(ingredient => {
        console.log(`   - ${ingredient.name} (${ingredient.quantity}) - ${ingredient.day} ${ingredient.meal}`);
      });
    }
    
    // 6. Check for extra items in grocery list
    console.log('\n6️⃣ Checking for extra items in grocery list...');
    const extraItems = [];
    
    groceryItems.forEach(groceryItem => {
      const itemName = groceryItem.split(' - ')[0];
      const found = extractedIngredients.some(ingredient => 
        ingredient.name.toLowerCase().includes(itemName) || itemName.includes(ingredient.name.toLowerCase())
      );
      
      if (!found) {
        extraItems.push(groceryItem);
      }
    });
    
    console.log(`➕ Extra items in grocery list: ${extraItems.length}`);
    if (extraItems.length > 0) {
      console.log('📋 Extra items:');
      extraItems.forEach(item => console.log(`   - ${item}`));
    }
    
    // 7. Check if grocery list appears static
    console.log('\n7️⃣ Checking if grocery list appears static...');
    if (extractedIngredients.length === 0) {
      console.log('⚠️  WARNING: No ingredients extracted from meal plan!');
      console.log('   This suggests the grocery list is not connected to the meal plan.');
      console.log('   Possible causes:');
      console.log('   - Meal plan data is missing for this week');
      console.log('   - Ingredient extraction is not working');
      console.log('   - Grocery list was generated from a different source');
    } else if (matchedIngredients.length === 0) {
      console.log('⚠️  WARNING: No ingredients match between meal plan and grocery list!');
      console.log('   This suggests the grocery list is static or from a different source.');
    } else {
      console.log('✅ Grocery list appears to be connected to meal plan');
      console.log(`   Match rate: ${(matchedIngredients.length / extractedIngredients.length * 100).toFixed(1)}%`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Helper function to parse ingredients from amount string
function parseIngredientsFromAmount(amountString) {
  const ingredients = [];
  
  // Split by commas and process each ingredient
  const parts = amountString.split(',').map(part => part.trim());
  
  parts.forEach(part => {
    // Look for quantity patterns like "1 cup", "2 tbsp", etc.
    const quantityMatch = part.match(/^([\d./\s]+)\s+(.+)$/);
    if (quantityMatch) {
      const [, quantity, name] = quantityMatch;
      ingredients.push({
        name: name.trim(),
        quantity: quantity.trim()
      });
    } else {
      // If no quantity pattern, treat the whole part as an ingredient
      ingredients.push({
        name: part,
        quantity: '1'
      });
    }
  });
  
  return ingredients;
}

// Run the comparison
compareMealPlanVsGroceryList().then(() => {
  console.log('\n🏁 Comparison completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});
