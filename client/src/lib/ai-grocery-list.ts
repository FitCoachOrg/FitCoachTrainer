import { supabase } from './supabase';
import { askLLM } from './llm-service';

// Define the structure of a meal item
interface Meal {
  name: string;
  amount?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// Define the structure of a daily nutrition plan
interface DayPlan {
  day: string;
  total: Meal;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal;
}

// Function to extract ingredients and use LLM for intelligent consolidation
export async function generateGroceryList(nutritionPlan: DayPlan[], dietaryPreferences?: string[], allergies?: string): Promise<string> {
  console.log('🥬 Extracting ingredients from nutrition plan...');
  
  // Extract all ingredients from the nutrition plan
  const extractedIngredients = extractIngredientsFromNutritionPlan(nutritionPlan);
  
  console.log('📊 Extracted ingredients:', extractedIngredients);
  
  console.log('🔍 === RAW INGREDIENTS EXTRACTED ===');
  console.log('📋 Total ingredients extracted:', extractedIngredients.length);
  console.log('📝 Raw ingredients list:');
  extractedIngredients.forEach((ingredient, index) => {
    console.log(`${index + 1}. ${ingredient.name} - ${ingredient.quantity} (${ingredient.day} ${ingredient.meal})`);
  });
  
  // Simple text format for easy copying
  console.log('\n📋 === RAW INGREDIENTS (COPY-PASTE FORMAT) ===');
  console.log('INGREDIENTS:');
  extractedIngredients.forEach((ingredient, index) => {
    console.log(`${index + 1}. ${ingredient.name} - ${ingredient.quantity} (${ingredient.day} ${ingredient.meal})`);
  });
  console.log('END_INGREDIENTS');
  
  // Build dietary restrictions section
  let dietaryRestrictionsSection = '';
  let forbiddenIngredients = '';
  
  if (dietaryPreferences && dietaryPreferences.length > 0) {
    const preferencesString = dietaryPreferences.join(', ').toLowerCase();
    
    if (preferencesString.includes('vegetarian')) {
      dietaryRestrictionsSection += 'STRICT VEGETARIAN: No meat, fish, poultry, or animal products. Use plant-based proteins only.\n';
      forbiddenIngredients += 'meat, fish, poultry, beef, pork, lamb, chicken, turkey, seafood, eggs, gelatin';
    }
    if (preferencesString.includes('vegan')) {
      dietaryRestrictionsSection += 'STRICT VEGAN: No animal products whatsoever. Use plant-based alternatives only.\n';
      forbiddenIngredients += 'meat, fish, poultry, dairy, eggs, honey, gelatin, any animal products';
    }
    if (preferencesString.includes('pescatarian')) {
      dietaryRestrictionsSection += 'PESCATARIAN: Fish and seafood allowed, no other meat.\n';
      forbiddenIngredients += 'beef, pork, lamb, chicken, turkey, other land animals';
    }
    if (preferencesString.includes('gluten-free')) {
      dietaryRestrictionsSection += 'GLUTEN-FREE: No wheat, barley, rye, or gluten-containing ingredients.\n';
      forbiddenIngredients += 'wheat, barley, rye, gluten, bread, pasta, cereal';
    }
    if (preferencesString.includes('dairy-free')) {
      dietaryRestrictionsSection += 'DAIRY-FREE: No milk, cheese, yogurt, or dairy products.\n';
      forbiddenIngredients += 'milk, cheese, yogurt, butter, cream, dairy';
    }
  }
  
  if (allergies && allergies.trim()) {
    dietaryRestrictionsSection += `FOOD ALLERGIES: ${allergies}\n`;
    forbiddenIngredients += `, ${allergies.toLowerCase()}`;
  }

  // Create prompt for LLM to consolidate and format the extracted ingredients
  const prompt = `
    You are a professional grocery list organizer. I have extracted ingredients from a weekly nutrition plan and need you to consolidate, format, and organize them into a proper grocery list.

    ${dietaryRestrictionsSection ? `DIETARY RESTRICTIONS (MANDATORY TO FOLLOW):
${dietaryRestrictionsSection}
FORBIDDEN INGREDIENTS: ${forbiddenIngredients}

CRITICAL: Do NOT include any of the forbidden ingredients in the grocery list.` : ''}

    EXTRACTED INGREDIENTS FROM NUTRITION PLAN:
${formatExtractedIngredientsForLLM(extractedIngredients)}

    TASK: Create a comprehensive, well-organized grocery list by:
    1. Consolidating similar ingredients and adding up quantities
    2. Converting units where appropriate (e.g., 4 x 1/4 cup = 1 cup)
    3. Organizing into logical grocery categories
    4. Estimating total quantities needed for the week
    5. Using standard grocery store terminology
    6. Ensuring all quantities are practical for shopping

    IMPORTANT REQUIREMENTS:
    - Use ONLY the ingredients provided above
    - Do NOT add any ingredients not in the extracted list
    - Consolidate quantities intelligently (e.g., "2 x 1/2 cup olive oil" becomes "1 cup olive oil")
    - Organize into clear categories (PRODUCE, PROTEIN, DAIRY, GRAINS, PANTRY, CONDIMENTS, etc.)
    - Use realistic, shoppable quantities
    - Return ONLY valid JSON format

    REQUIRED JSON FORMAT:
    {
      "categories": [
        {
          "name": "PRODUCE",
          "items": [
            {"id": "1", "text": "Spinach - 2 bags", "checked": false},
            {"id": "2", "text": "Carrots - 1 lb", "checked": false}
          ]
        },
        {
          "name": "PROTEIN", 
          "items": [
            {"id": "3", "text": "Chicken breast - 2 lbs", "checked": false},
            {"id": "4", "text": "Lentils - 1 lb", "checked": false}
          ]
        }
      ],
      "generated_at": "2024-01-15T10:30:00Z"
    }

    Generate ONLY the grocery list items in the specified JSON format. No other content.
  `;

  console.log('🤖 === SENDING TO LLM ===');
  console.log('📤 Sending extracted ingredients to LLM for consolidation...');
  console.log('📝 Prompt length:', prompt.length, 'characters');
  
  // Call the LLM service to consolidate and format the grocery list
  const response = await askLLM(prompt);
  
  console.log('📥 === LLM RESPONSE RECEIVED ===');
  console.log('📋 Consolidated grocery list from LLM:');
  console.log('📄 Raw LLM response:');
  console.log(response.response);
  
  // Simple text format for easy copying
  console.log('\n📋 === CONSOLIDATED GROCERY LIST (COPY-PASTE FORMAT) ===');
  console.log('GROCERY_LIST:');
  console.log(response.response);
  console.log('END_GROCERY_LIST');
  
  return response.response;
}

// Helper function to extract ingredients from nutrition plan
function extractIngredientsFromNutritionPlan(nutritionPlan: DayPlan[]): Array<{ name: string, quantity: string, day: string, meal: string }> {
  const extractedIngredients: Array<{ name: string, quantity: string, day: string, meal: string }> = [];
  
  nutritionPlan.forEach(day => {
    const meals = [
      { type: 'breakfast', meal: day.breakfast },
      { type: 'lunch', meal: day.lunch },
      { type: 'dinner', meal: day.dinner },
      { type: 'snacks', meal: day.snacks }
    ];
    
    meals.forEach(({ type, meal }) => {
      if (meal && meal.amount) {
        // Parse the amount field to extract individual ingredients
        const ingredients = parseIngredientsFromAmount(meal.amount);
        
        ingredients.forEach(ingredient => {
          extractedIngredients.push({
            name: ingredient.name,
            quantity: ingredient.quantity,
            day: day.day,
            meal: type
          });
        });
      }
    });
  });
  
  return extractedIngredients;
}

// Helper function to format extracted ingredients for LLM prompt
function formatExtractedIngredientsForLLM(extractedIngredients: Array<{ name: string, quantity: string, day: string, meal: string }>): string {
  // Group by ingredient name to show all occurrences
  const ingredientGroups: { [key: string]: Array<{ quantity: string, day: string, meal: string }> } = {};
  
  extractedIngredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase().trim();
    if (!ingredientGroups[key]) {
      ingredientGroups[key] = [];
    }
    ingredientGroups[key].push({
      quantity: ingredient.quantity,
      day: ingredient.day,
      meal: ingredient.meal
    });
  });
  
  // Format for LLM
  let formattedIngredients = '';
  Object.entries(ingredientGroups).forEach(([ingredientName, occurrences]) => {
    formattedIngredients += `\n${ingredientName.toUpperCase()}:\n`;
    occurrences.forEach(occurrence => {
      formattedIngredients += `  - ${occurrence.quantity} (${occurrence.day} ${occurrence.meal})\n`;
    });
  });
  
  return formattedIngredients;
}

// Helper function to parse ingredients from meal amount string
function parseIngredientsFromAmount(amount: string): Array<{ name: string, quantity: string }> {
  const ingredients: Array<{ name: string, quantity: string }> = [];
  
  // Clean the amount string - remove parentheses and extra spaces
  let cleanAmount = amount.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  
  // Split by commas, but be more intelligent about it
  const parts = cleanAmount.split(',').map(part => part.trim()).filter(part => part.length > 0);
  
  parts.forEach(part => {
    // Skip parts that are just numbers or ratios
    if (/^\d+:\d+$/.test(part) || /^\d+$/.test(part)) {
      return;
    }
    
    // Handle complex patterns like "1.5 cups vegetable khichdi (180g cooked rice and moong dal, 1:1, with carrots, peas)"
    // Extract the main ingredient first
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
function extractAdditionalIngredients(description: string): Array<{ name: string, quantity: string }> {
  const additionalIngredients: Array<{ name: string, quantity: string }> = [];
  
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


