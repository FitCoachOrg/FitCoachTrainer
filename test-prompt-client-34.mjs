#!/usr/bin/env node

// Test script to show the exact LLM prompt for client_id = 34
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generatePromptForClient34() {
  console.log('🧪 Generating LLM Prompt for Client ID = 34');
  console.log('='.repeat(60));

  const clientId = 34;

  try {
    // 1. Fetch client data from Supabase
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('❌ Error fetching client data:', error);
      return;
    }

    if (!clientData) {
      console.error('❌ Client with ID 34 not found');
      return;
    }

    console.log('👤 Client Data:', {
      name: clientData.cl_name,
      dietary_preferences: clientData.diet_preferences,
      allergies: clientData.food_allergies,
      primary_goal: clientData.cl_primary_goal,
      height: clientData.cl_height,
      weight: clientData.cl_weight,
      age: clientData.cl_age,
      sex: clientData.cl_sex,
      activity_level: clientData.cl_activity_level,
      target_weight: clientData.cl_target_weight,
      specific_outcome: clientData.specific_outcome,
      goal_timeline: clientData.goal_timeline,
      obstacles: clientData.obstacles,
      preferred_meals_per_day: clientData.preferred_meals_per_day,
      supplements: clientData.cl_supplements,
      gastric_issues: clientData.cl_gastric_issues
    });

    // 2. Fetch Nutritional Targets from client_target table
    const { data: targetData, error: targetError } = await supabase
      .from('client_target')
      .select('goal, target')
      .eq('client_id', clientId)
      .in('goal', ['calories', 'protein', 'carbs', 'fats']);

    if (targetError) {
      console.error('❌ Error fetching client targets:', targetError);
      return;
    }

    // Extract targets from the fetched data
    const targetMap = new Map();
    if (targetData && targetData.length > 0) {
      targetData.forEach((row) => {
        if (row.goal && row.target !== null) {
          targetMap.set(row.goal, row.target);
        }
      });
    }

    // Set default values if targets are not found
    const targetCalories = targetMap.get('calories') || 2000;
    const targetProtein = targetMap.get('protein') || 150;
    const targetCarbs = targetMap.get('carbs') || 200;
    const targetFats = targetMap.get('fats') || 67;

    console.log('📊 Nutritional Targets from client_target table:', {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats
    });

    // 3. Build dietary restrictions based on preferences
    const dietaryPreferences = clientData.diet_preferences || [];
    const allergies = clientData.food_allergies || '';
    
    const restrictionsList = [];
    const forbiddenList = [];
    
    console.log('🔍 Processing dietary preferences:', dietaryPreferences);
    
    // Handle dietary preferences as an array
    if (Array.isArray(dietaryPreferences) && dietaryPreferences.length > 0) {
      const preferencesString = dietaryPreferences.join(', ').toLowerCase();
      
      if (preferencesString.includes('vegetarian')) {
        restrictionsList.push('STRICT VEGETARIAN: No meat, fish, poultry, or animal products. Use plant-based proteins only.');
        forbiddenList.push('meat, fish, poultry, beef, pork, lamb, chicken, turkey, seafood, eggs, gelatin');
        console.log('🥬 Applied VEGETARIAN restrictions');
      }
      if (preferencesString.includes('vegan')) {
        restrictionsList.push('STRICT VEGAN: No animal products whatsoever. Use plant-based alternatives only.');
        forbiddenList.push('meat, fish, poultry, dairy, eggs, honey, gelatin, any animal products');
        console.log('🌱 Applied VEGAN restrictions');
      }
      if (preferencesString.includes('pescatarian')) {
        restrictionsList.push('PESCATARIAN: Fish and seafood allowed, no other meat.');
        forbiddenList.push('beef, pork, lamb, chicken, turkey, other land animals');
        console.log('🐟 Applied PESCATARIAN restrictions');
      }
      if (preferencesString.includes('gluten-free')) {
        restrictionsList.push('GLUTEN-FREE: No wheat, barley, rye, or gluten-containing ingredients.');
        forbiddenList.push('wheat, barley, rye, gluten, bread, pasta, flour');
        console.log('🚫 Applied GLUTEN-FREE restrictions');
      }
      if (preferencesString.includes('dairy-free')) {
        restrictionsList.push('DAIRY-FREE: No milk, cheese, yogurt, or dairy products.');
        forbiddenList.push('milk, cheese, yogurt, butter, cream, dairy');
        console.log('🥛 Applied DAIRY-FREE restrictions');
      }
      if (preferencesString.includes('keto')) {
        restrictionsList.push('KETO: Very low carb, high fat. Max 20g net carbs per day.');
        forbiddenList.push('sugar, bread, pasta, rice, potatoes, high-carb foods');
        console.log('🥑 Applied KETO restrictions');
      }
      if (preferencesString.includes('paleo')) {
        restrictionsList.push('PALEO: No grains, legumes, dairy, or processed foods.');
        forbiddenList.push('grains, legumes, dairy, processed foods, sugar');
        console.log('🦴 Applied PALEO restrictions');
      }
    }
    
    // Add allergies to forbidden ingredients
    if (allergies && typeof allergies === 'string' && allergies.trim()) {
      // Replace newlines with commas for a clean list
      const cleanedAllergies = allergies.replace(/\n/g, ', ').split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
      forbiddenList.push(...cleanedAllergies);
      console.log('⚠️ Added allergies to forbidden list:', cleanedAllergies);
    }

    const dietaryRestrictions = restrictionsList.join('\n');
    const forbiddenIngredients = Array.from(new Set(forbiddenList)).join(', '); // Use Set to remove duplicates

    console.log('🚫 Final Forbidden Ingredients:', forbiddenIngredients);
    console.log('📋 Final Dietary Restrictions:', dietaryRestrictions);

    // 4. Construct the exact prompt that would be sent to LLM
    const clientName = clientData.cl_name || 'Client';
    const targetWeight = clientData.cl_target_weight ? `${clientData.cl_target_weight} kg` : 'Not specified';
    const primaryGoal = clientData.cl_primary_goal || 'General fitness';
    const specificOutcome = clientData.specific_outcome || 'Improve overall health';
    const goalTimeline = clientData.goal_timeline || 'Not specified';
    const obstacles = clientData.obstacles || 'None';
    const preferredMeals = clientData.preferred_meals_per_day || '3';
    const dietaryPrefs = Array.isArray(dietaryPreferences) ? dietaryPreferences.join(', ') : 'None';
    const knownAllergies = typeof allergies === 'string' && allergies.trim() ? allergies : 'None';
    const supplements = clientData.cl_supplements || 'None';
    const gastricIssues = clientData.cl_gastric_issues || 'None';

    const prompt = `You are a world-class nutritionist and chef. Create a personalized 7-day nutrition plan for a client.

Client Profile:
- Name: ${clientName}
- Age: ${clientData.cl_age || 30} years
- Weight: ${clientData.cl_weight} kg
- Height: ${clientData.cl_height} cm
- Gender: ${clientData.cl_sex}
- Target Weight: ${targetWeight}
- Primary Goal: ${primaryGoal}
- Specific Outcome: ${specificOutcome}
- Goal Timeline: ${goalTimeline}
- Obstacles: ${obstacles}
- Activity Level: ${clientData.cl_activity_level || 'sedentary'}
- Preferred Meals Per Day: ${preferredMeals}
- Dietary Preferences: ${dietaryPrefs}
- Known Allergies: ${knownAllergies}
- Supplements: ${supplements}
- Gastric Issues: ${gastricIssues}

Daily Nutritional Targets (CRITICAL - MUST MATCH EXACTLY):
- Calories: ${targetCalories} kcal
- Protein: ${targetProtein} g
- Carbohydrates: ${targetCarbs} g
- Fats: ${targetFats} g

Instructions:
1. Create a 7-day (Monday to Sunday) meal plan.
2. For each day, provide meals for breakfast, lunch, dinner, and one snack.
3. For each meal, provide:
   - Meal name
   - Specific amounts/quantities for each ingredient (e.g., "1 cup brown rice", "150g chicken breast", "2 tbsp olive oil")
   - Nutritional values (calories, protein, carbs, fats) for the specified amounts
4. CRITICAL ACCURACY REQUIREMENT: The total nutritional values for each day MUST EXACTLY match the daily targets provided above. The sum of all meals for a day MUST equal the day's total. If the initial meal plan doesn't meet the targets, ADJUST the quantities/amounts of ingredients to ensure the total calories and macros match the targets exactly.
5. Select nutritional plan to achieve goals while respecting dietary restrictions.
6. Provide a brief, actionable "Coach Tip" for each meal (e.g., "Drink a full glass of water before this meal to aid digestion.").
7. The plan must respect the client's dietary preferences and allergies.
8. Consider the client's specific goals, obstacles, and timeline when designing meals.
9. Account for any gastric issues or supplements mentioned.
10. Ensure variety in meals throughout the week.
11. Use realistic, measurable quantities (grams, cups, tablespoons, pieces, etc.).
12. Consider the preferred number of meals per day if specified.

${dietaryRestrictions ? `DIETARY RESTRICTIONS (MANDATORY):
${dietaryRestrictions}
FORBIDDEN: ${forbiddenIngredients}` : ''}

Output Format:
Return ONLY a single, valid JSON object. Do not include any text, notes, or explanations before or after the JSON object.
The JSON structure should be:
{
  "nutrition_plan": [
    {
      "day": "Monday",
      "total": {"name": "Daily Total", "calories": ${targetCalories}, "protein": ${targetProtein}, "carbs": ${targetCarbs}, "fats": ${targetFats}},
      "breakfast": {"name": "Meal Name", "amount": "Specific quantities (e.g., 1 cup oats, 1 banana, 1 cup milk)", "calories": number, "protein": number, "carbs": number, "fats": number, "coach_tip": "string"},
      "lunch": {"name": "Meal Name", "amount": "Specific quantities (e.g., 200g chicken, 1 cup rice, 2 cups vegetables)", "calories": number, "protein": number, "carbs": number, "fats": number, "coach_tip": "string"},
      "dinner": {"name": "Meal Name", "amount": "Specific quantities (e.g., 150g salmon, 1 cup quinoa, 1 cup broccoli)", "calories": number, "protein": number, "carbs": number, "fats": number, "coach_tip": "string"},
      "snacks": {"name": "Meal Name", "amount": "Specific quantities (e.g., 1 apple, 1 tbsp peanut butter)", "calories": number, "protein": number, "carbs": number, "fats": number, "coach_tip": "string"}
    }
    // ... repeat for all 7 days
  ]
}`;

    console.log('\n📤 EXACT LLM PROMPT FOR CLIENT ID = 34:');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));
    console.log('📝 END OF PROMPT');
    console.log('='.repeat(80));
    
    console.log('\n📊 Prompt Statistics:');
    console.log(`- Total characters: ${prompt.length}`);
    console.log(`- Total words: ${prompt.split(' ').length}`);
    console.log(`- Target calories: ${targetCalories}`);
    console.log(`- Target protein: ${targetProtein}g`);
    console.log(`- Target carbs: ${targetCarbs}g`);
    console.log(`- Target fats: ${targetFats}g`);
    
    console.log('\n✅ Prompt generated successfully!');
    console.log('💡 You can now copy this prompt and test it directly with your LLM model.');

  } catch (error) {
    console.error('❌ Error generating prompt:', error);
  }
}

generatePromptForClient34(); 