// Test script to verify improved ingredient parsing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testImprovedIngredientParsing() {
  console.log('🧪 Testing Improved Ingredient Parsing for Client 34\n');
  
  try {
    // Get sample meal data from client 34
    const { data: meals, error } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', 34)
      .eq('type', 'meal')
      .limit(5);
    
    if (error || !meals || meals.length === 0) {
      console.error('❌ No meal data found');
      return;
    }
    
    console.log('📋 Testing ingredient parsing with sample meals:\n');
    
    meals.forEach((meal, index) => {
      if (meal.details_json && meal.details_json.amount) {
        console.log(`${index + 1}. ${meal.task} (${meal.for_date}):`);
        console.log(`   Original: ${meal.details_json.amount}`);
        
        // Test the improved parsing
        const ingredients = parseIngredientsFromAmount(meal.details_json.amount);
        console.log(`   Parsed ingredients (${ingredients.length}):`);
        ingredients.forEach(ingredient => {
          console.log(`     - ${ingredient.name} (${ingredient.quantity})`);
        });
        console.log('');
      }
    });
    
    // Test specific complex cases
    console.log('🔍 Testing specific complex cases:\n');
    
    const testCases = [
      "1.5 cups vegetable khichdi (180g cooked rice and moong dal, 1:1, with carrots, peas)",
      "2 tbsp mint chutney (mint, coriander, green chili, lemon juice)",
      "1 cup cooked brown rice (150g), 3/4 cup cooked rajma (120g), 1 cup steamed mixed vegetables (carrots, beans, zucchini)",
      "1/2 cup roasted makhana (30g, no added oil)",
      "2 besan toasts (made from 40g besan, water, spices, baked)"
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`${index + 1}. Test case: ${testCase}`);
      const ingredients = parseIngredientsFromAmount(testCase);
      console.log(`   Parsed ingredients (${ingredients.length}):`);
      ingredients.forEach(ingredient => {
        console.log(`     - ${ingredient.name} (${ingredient.quantity})`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Improved ingredient parsing function (same as in ai-grocery-list.ts)
function parseIngredientsFromAmount(amount) {
  const ingredients = [];
  
  // Clean the amount string - remove parentheses and extra spaces
  let cleanAmount = amount.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  
  // Split by commas, but be more intelligent about it
  const parts = cleanAmount.split(',').map(part => part.trim()).filter(part => part.length > 0);
  
  parts.forEach(part => {
    // Skip parts that are just numbers or ratios
    if (/^\d+:\d+$/.test(part) || /^\d+$/.test(part)) {
      return;
    }
    
    // Handle complex patterns
    const mainMatch = part.match(/^([\d./\s]+)\s*(cup|g|tbsp|tsp|lb|oz|piece|pieces|slice|slices|can|cans|bag|bags|bunch|bunches|head|heads|clove|cloves|tablespoon|teaspoon|gram|grams|pound|pounds|ounce|ounces|ml|liter|liters|medium|small|large)?\s+(.+)$/i);
    
    if (mainMatch) {
      const [, quantity, unit, name] = mainMatch;
      const cleanName = name.trim();
      
      // Skip if the name is too generic or contains unwanted patterns
      if (cleanName.length > 2 && !/^(with|and|or|plus|including)$/i.test(cleanName)) {
        ingredients.push({
          name: cleanName,
          quantity: `${quantity}${unit ? ` ${unit}` : ''}`
        });
      }
      
      // Look for additional ingredients in the name part
      const additionalIngredients = extractAdditionalIngredients(cleanName);
      ingredients.push(...additionalIngredients);
    } else {
      // If no quantity pattern found, check if it's a standalone ingredient
      if (part.length > 2 && !/^(with|and|or|plus|including|mild|spices|herbs|lemon|juice)$/i.test(part)) {
        ingredients.push({
          name: part,
          quantity: '1'
        });
      }
    }
  });
  
  return ingredients;
}

// Helper function to extract additional ingredients from complex descriptions
function extractAdditionalIngredients(description) {
  const additionalIngredients = [];
  
  // Look for ingredients separated by "and", "with", "plus"
  const separators = [' and ', ' with ', ' plus ', ', '];
  
  separators.forEach(separator => {
    if (description.includes(separator)) {
      const parts = description.split(separator);
      parts.forEach(part => {
        const cleanPart = part.trim();
        if (cleanPart.length > 2 && !/^(mild|spices|herbs|lemon|juice|oil|minimal)$/i.test(cleanPart)) {
          // Try to extract quantity from the part
          const quantityMatch = cleanPart.match(/^([\d./\s]+)\s*(cup|g|tbsp|tsp|lb|oz|piece|pieces|slice|slices|can|cans|bag|bags|bunch|bunches|head|heads|clove|cloves|tablespoon|teaspoon|gram|grams|pound|pounds|ounce|ounces|ml|liter|liters|medium|small|large)?\s+(.+)$/i);
          
          if (quantityMatch) {
            const [, quantity, unit, name] = quantityMatch;
            additionalIngredients.push({
              name: name.trim(),
              quantity: `${quantity}${unit ? ` ${unit}` : ''}`
            });
          } else {
            additionalIngredients.push({
              name: cleanPart,
              quantity: '1'
            });
          }
        }
      });
    }
  });
  
  return additionalIngredients;
}

// Run the test
testImprovedIngredientParsing().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
