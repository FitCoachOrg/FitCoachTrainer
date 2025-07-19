// AI Nutrition Plan Generation with Cerebras AI Integration
import { supabase } from './supabase';
// import { askOpenRouter, OpenRouterResponse } from './open-router-service';
// import { askCerebras } from './cerebras-service';
import { askLLM } from './llm-service';

export interface NutritionPlanResult {
  success: boolean;
  response: string;
  message?: string; // Optional message
  raw_prompt?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  timestamp?: string;
  generationTime?: string;
}

// Function to generate nutrition plan using OpenRouter
export async function generateNutritionPlan(clientId: number): Promise<NutritionPlanResult> {
  console.log(`🍽️ Generating nutrition plan for client: ${clientId}`);

  try {
    // 1. Fetch client data from Supabase
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!clientData) throw new Error(`Client with ID ${clientId} not found.`);

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

    // 2. Calculate Nutritional Targets (BMR, TDEE, Macros)
    const age = clientData.cl_age || 30;
    const weight = clientData.cl_weight; // in kg
    const height = clientData.cl_height; // in cm
    const gender = clientData.cl_sex; // Use cl_sex instead of cl_gender
    const activityLevel = clientData.cl_activity_level || 'sedentary';

    // Mifflin-St Jeor Equation for BMR
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);

    // TDEE Calculation
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const tdee = bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2);

    // Adjust calories for goal (e.g., -500 for weight loss, +500 for muscle gain)
    let targetCalories = tdee;
    if (clientData.cl_primary_goal?.includes('loss')) {
      targetCalories -= 500;
    } else if (clientData.cl_primary_goal?.includes('gain')) {
      targetCalories += 500;
    }
    targetCalories = Math.round(targetCalories);

    // Macronutrient Split (example: 40% carbs, 30% protein, 30% fat)
    const targetProtein = Math.round((targetCalories * 0.30) / 4);
    const targetCarbs = Math.round((targetCalories * 0.40) / 4);
    const targetFats = Math.round((targetCalories * 0.30) / 9);

    console.log('📊 Nutritional Targets:', {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats
    });

    // 3. Build dietary restrictions based on preferences
    const dietaryPreferences = clientData.diet_preferences || [];
    const allergies = clientData.food_allergies || '';
    
    const restrictionsList: string[] = [];
    const forbiddenList: string[] = [];
    
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

    // 4. Construct optimized prompt with cleaner format
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
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- Gender: ${gender}
- Target Weight: ${targetWeight}
- Primary Goal: ${primaryGoal}
- Specific Outcome: ${specificOutcome}
- Goal Timeline: ${goalTimeline}
- Obstacles: ${obstacles}
- Activity Level: ${activityLevel}
- Preferred Meals Per Day: ${preferredMeals}
- Dietary Preferences: ${dietaryPrefs}
- Known Allergies: ${knownAllergies}
- Supplements: ${supplements}
- Gastric Issues: ${gastricIssues}

Daily Nutritional Targets:
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
4. CRITICAL: Ensure the total nutritional values for each day EXACTLY match the daily targets provided above. The sum of all meals for a day MUST equal the day's total.
5. If the initial meal plan doesn't meet the calorific target, ADJUST the quantities/amounts of ingredients to ensure the total calories match the target.
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

    console.log('📤 Sending prompt to LLM:');
    console.log('='.repeat(80));
    console.log('Prompt length:', prompt.length, 'characters');
    console.log('📝 COMPLETE PROMPT FOR TESTING:');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));
    console.log('📝 END OF PROMPT');
    console.log('='.repeat(80));

    // 5. Call the unified LLM service
    const startTime = Date.now();
    const aiResult = await askLLM(prompt);
    const endTime = Date.now();
    const generationTime = endTime - startTime;
    
    console.log('📥 Received response from LLM:');
    console.log('='.repeat(80));
    console.log('Response:', aiResult.response);
    console.log('='.repeat(80));
    console.log(`⏱️ Generation time: ${generationTime}ms`);
    if (aiResult.model) {
      console.log('🤖 Model used:', aiResult.model);
    }
    if (aiResult.usage) {
      console.log('🔢 Token usage:', aiResult.usage);
    }

    /* Previous implementations (commented for easy reversion)
    // const aiResult: OpenRouterResponse = await askOpenRouter(prompt);
    // const aiResult = await askCerebras(prompt);
    */

    // 6. Validate response for forbidden ingredients
    if (forbiddenIngredients && aiResult.response) {
      const forbiddenList = forbiddenIngredients.split(',').map(item => item.trim().toLowerCase());
      const responseLower = aiResult.response.toLowerCase();
      
      console.log('🔍 Checking for forbidden ingredients in response...');
      console.log('Forbidden list:', forbiddenList);
      
      const foundForbidden = forbiddenList.filter(ingredient => 
        responseLower.includes(ingredient)
      );
      
      if (foundForbidden.length > 0) {
        console.error('❌ VIOLATION DETECTED! Found forbidden ingredients:', foundForbidden);
        console.error('Response contains forbidden items:', foundForbidden);
      } else {
        console.log('✅ No forbidden ingredients detected in response');
      }
    }
      
      return {
        success: true,
      response: aiResult.response,
      raw_prompt: prompt,
      model: aiResult.model,
      usage: aiResult.usage,
      generationTime: `${generationTime}ms`,
    };

  } catch (error: any) {
    console.error("❌ Error generating nutrition plan:", error);
    return {
      success: false,
      response: '',
      message: `Failed to generate plan: ${error.message}`
    };
  }
} 