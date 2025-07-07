// AI Nutrition Plan Generation with OpenAI Integration
import { supabase } from './supabase'
import OpenAI from 'openai'

/**
 * Function to generate AI response using OpenAI ChatGPT
 * @param clientInfo - Organized client information
 */
async function generateAIResponse(clientInfo: any) {
  console.log('🔑 Checking for OpenAI API key...');
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file');
  }
  
  console.log('✅ OpenAI API key found');
  console.log('🔧 Initializing OpenAI client...');
  
  // Initialize OpenAI client
  const client = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
  
  console.log('📋 Preparing comprehensive nutrition coach prompt...');
  
  // Use the comprehensive world-class nutrition coach prompt template
const nutritionCoachPrompt = `You are a world-class nutrition coach and registered dietitian. Create a comprehensive 7-day nutrition plan with detailed meals for each day based on the client information below.

CLIENT INFORMATION:
Physical Stats:
- Age: ${clientInfo.age || 'N/A'} years
- Sex: ${clientInfo.sex || 'N/A'}
- Height: ${clientInfo.height || 'N/A'} cm
- Current Weight: ${clientInfo.weight || 'N/A'} kg  
- Target Weight: ${clientInfo.targetWeight || 'N/A'} kg
- Activity Level: ${clientInfo.activityLevel || 'Moderate'}

Goals & Timeline:
- Primary Goal: ${clientInfo.primaryGoal || 'N/A'}
- Specific Outcome: ${clientInfo.specificOutcome || 'N/A'}
- Goal Timeline: ${clientInfo.goalTimeline || 'N/A'}

Dietary Information:
- Eating Habits: ${clientInfo.eatingHabits || 'N/A'}
- Diet Preferences: ${Array.isArray(clientInfo.dietPreferences) ? clientInfo.dietPreferences.join(', ') : clientInfo.dietPreferences || 'None'}
- Food Allergies: ${Array.isArray(clientInfo.foodAllergies) ? clientInfo.foodAllergies.join(', ') : clientInfo.foodAllergies || 'None'}
- Preferred Meals Per Day: ${clientInfo.preferredMealsPerDay || '3 meals + 2 snacks'}
- Gastric Issues: ${clientInfo.gastricIssues || 'None'}
- Current Supplements: ${clientInfo.supplements || 'None'}

Schedule (if provided):
- Wake Time: ${clientInfo.wakeTime || 'N/A'}
- Breakfast Time: ${clientInfo.breakfastTime || 'N/A'}
- Lunch Time: ${clientInfo.lunchTime || 'N/A'}
- Dinner Time: ${clientInfo.dinnerTime || 'N/A'}
- Snack Time: ${clientInfo.snackTime || 'N/A'}
- Workout Time: ${clientInfo.workoutTime || 'N/A'}

REQUIREMENTS:
1. Generate EXACTLY 7 days of meals (Day 1 through Day 7)
2. Each day must include: Breakfast, Lunch, Dinner, and 2 Snacks (minimum 5 items per day)
3. Calculate appropriate daily caloric intake based on BMR, activity level, and goals
4. Determine optimal macronutrient ratios based on goals and activity level
5. Consider meal timing around workouts for optimal performance and recovery
6. Respect all dietary preferences, restrictions, and allergies
7. Account for gastric issues and food sensitivities
8. Provide practical meal suggestions that fit the client's lifestyle
9. Include variety across the week to prevent boredom
10. Ensure nutritional adequacy and sustainability

OUTPUT FORMAT (Strict JSON):
{
  "overview": "Brief summary of the nutrition plan approach and rationale",
  "daily_targets": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fats": 80,
    "fiber": 30,
    "water_liters": 3
  },
  "meal_timing": {
    "breakfast": "07:00",
    "lunch": "12:00",
    "dinner": "19:00",
    "snacks": ["10:00", "15:00"]
  },
  "nutrition_plan": [
    {
      "food_name": "Greek Yogurt with Berries and Granola",
      "meal_type": "breakfast",
      "portion_size": "1 cup yogurt + 1/2 cup berries + 2 tbsp granola",
      "calories": 320,
      "protein": 20,
      "carbs": 35,
      "fats": 8,
      "fiber": 5,
      "for_day": "day1",
      "for_time": "07:00",
      "coach_tip": "High protein breakfast to kickstart metabolism",
      "icon": "🥣",
      "category": "protein_rich",
      "dietary_tags": ["vegetarian", "gluten_free_option"]
    }
  ],
  "hydration_plan": "Drink 8-10 glasses of water daily. Start with 2 glasses upon waking, have 1 glass before each meal, and maintain consistent intake throughout the day.",
  "supplement_recommendations": "Based on your current routine and goals, consider adding...",
  "meal_prep_tips": "Prepare proteins in bulk on Sunday. Pre-cut vegetables and store in containers...",
  "progress_tracking": "Track daily weight, energy levels, and hunger patterns. Adjust portions if needed after week 1."
}

IMPORTANT: Generate at least 35 meal items total (7 days × 5 meals per day). Ensure each day has exactly 3 main meals and 2 snacks. Make each meal unique and varied across the week.`;
  
  console.log('📝 Nutrition coach prompt prepared with client data');
  
  console.log('🚀 Sending request to OpenAI using client SDK...');
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: nutritionCoachPrompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    console.log('📊 OpenAI Response received:', response);
    
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const aiResponse = response.choices[0].message.content;
    console.log('✅ AI Response extracted:', aiResponse);
    
    return {
      response: aiResponse,
      usage: response.usage,
      model: response.model,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Function to retrieve client data and generate AI nutrition plan
 * @param clientId - The ID of the client to fetch data for
 */
export async function generateAINutritionPlan(clientId: number) {
  console.log('🤖 Starting AI nutrition plan generation for client:', clientId);
  console.log('📊 Target Table: client');
  console.log('🔍 Query Parameters:', { client_id: clientId });
  
  try {
    // Fetch client data from Supabase
    console.log('📋 Executing Supabase query...');
    console.log('🔗 Query: SELECT * FROM client WHERE client_id = ?', clientId);
    
    const { data: clientData, error } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    console.log('📡 Raw Supabase Response:');
    console.log('  - Data:', clientData);
    console.log('  - Error:', error);

    if (error) {
      console.error('❌ Database Error Details:');
      console.error('  - Message:', error.message);
      console.error('  - Details:', error.details);
      console.error('  - Hint:', error.hint);
      console.error('  - Code:', error.code);
      return {
        success: false,
        message: `Failed to fetch client data: ${error.message}`
      };
    }

    if (!clientData) {
      console.error('❌ No client found with ID:', clientId);
      console.log('🔍 This could mean:');
      console.log('  - Client ID does not exist in database');
      console.log('  - Client table is empty');
      console.log('  - Database connection issue');
      return {
        success: false,
        message: `No client found with ID: ${clientId}`
      };
    }

    console.log('✅ Successfully retrieved client data!');
    console.log('📋 Client Data Structure:');
    console.log('  - Type:', typeof clientData);
    console.log('  - Is Array:', Array.isArray(clientData));
    console.log('  - Keys:', Object.keys(clientData));
    console.log('  - Total Fields:', Object.keys(clientData).length);
    
    console.log('👤 Client Information:');
    console.log('  - ID:', clientData.client_id);
    console.log('  - Name:', clientData.cl_name);
    console.log('  - Preferred Name:', clientData.cl_prefer_name);
    console.log('  - Email:', clientData.cl_email);
    console.log('  - Username:', clientData.cl_username);
    console.log('  - Age:', clientData.cl_age);
    console.log('  - Sex:', clientData.cl_sex);
    console.log('  - Height:', clientData.cl_height);
    console.log('  - Weight:', clientData.cl_weight);
    console.log('  - Target Weight:', clientData.cl_target_weight);
    console.log('  - Phone:', clientData.cl_phone);
    console.log('  - Primary Goal:', clientData.cl_primary_goal);
    console.log('  - Activity Level:', clientData.cl_activity_level);
    console.log('  - Training Experience:', clientData.training_experience);
    console.log('  - Training Days/Week:', clientData.training_days_per_week);
    console.log('  - Training Time/Session:', clientData.training_time_per_session);
    console.log('  - Available Equipment:', clientData.available_equipment);
    console.log('  - Focus Areas:', clientData.focus_areas);
    console.log('  - Injuries/Limitations:', clientData.injuries_limitations);
    console.log('  - Sleep Hours:', clientData.sleep_hours);
    console.log('  - Created At:', clientData.created_at);
    
    console.log('📊 Complete Client Data Object:');
    console.log(JSON.stringify(clientData, null, 2));
    
    // Save client data in organized variables
    const clientInfo = {
      // Basic Information
      id: clientData.client_id,
      name: clientData.cl_name,
      preferredName: clientData.cl_prefer_name,
      email: clientData.cl_email,
      username: clientData.cl_username,
      phone: clientData.cl_phone,
      age: clientData.cl_age,
      sex: clientData.cl_sex,
      
      // Physical Information
      height: clientData.cl_height,
      weight: clientData.cl_weight,
      targetWeight: clientData.cl_target_weight,
      
      // Goals & Preferences
      primaryGoal: clientData.cl_primary_goal,
      activityLevel: clientData.cl_activity_level,
      specificOutcome: clientData.specific_outcome,
      goalTimeline: clientData.goal_timeline,
      obstacles: clientData.obstacles,
      confidenceLevel: clientData.confidence_level,
      
      // Training Information
      trainingExperience: clientData.training_experience,
      previousTraining: clientData.previous_training,
      trainingDaysPerWeek: clientData.training_days_per_week,
      trainingTimePerSession: clientData.training_time_per_session,
      trainingLocation: clientData.training_location,
      availableEquipment: clientData.available_equipment,
      focusAreas: clientData.focus_areas,
      injuriesLimitations: clientData.injuries_limitations,
      
      // Nutrition Information
      eatingHabits: clientData.eating_habits,
      dietPreferences: clientData.diet_preferences,
      foodAllergies: clientData.food_allergies,
      preferredMealsPerDay: clientData.preferred_meals_per_day,
      
      // Lifestyle Information
      sleepHours: clientData.sleep_hours,
      stress: clientData.cl_stress,
      alcohol: clientData.cl_alcohol,
      supplements: clientData.cl_supplements,
      gastricIssues: clientData.cl_gastric_issues,
      motivationStyle: clientData.motivation_style,
      
      // Schedule Information
      wakeTime: clientData.wake_time,
      bedTime: clientData.bed_time,
      workoutTime: clientData.workout_time,
      workoutDays: clientData.workout_days,
      breakfastTime: clientData.bf_time,
      lunchTime: clientData.lunch_time,
      dinnerTime: clientData.dinner_time,
      snackTime: clientData.snack_time,
      
      // System Information
      onboardingCompleted: clientData.onboarding_completed,
      onboardingProgress: clientData.onboarding_progress,
      trainerId: clientData.trainer_id,
      createdAt: clientData.created_at,
      lastLogin: clientData.last_login,
      lastCheckIn: clientData.last_checkIn
    };
    
    console.log('💾 Organized Client Variables:');
    console.log(clientInfo);
    
    // Generate AI response using the comprehensive nutrition coach prompt
    console.log('🤖 Starting OpenAI ChatGPT integration...');
    
    try {
      const aiResponse = await generateAIResponse(clientInfo);
      console.log('✅ AI Response generated successfully');
      console.log('🎯 AI Response:', aiResponse);
      
      return {
        success: true,
        message: `Successfully generated AI nutrition plan for client: ${clientInfo.name || clientInfo.preferredName || 'Unknown'}`,
        clientData: clientData,
        clientInfo: clientInfo,
        aiResponse: aiResponse
      };
    } catch (aiError) {
      console.error('❌ Error generating AI response:', aiError);
      return {
        success: false,
        message: `Failed to generate AI response: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
        clientData: clientData,
        clientInfo: clientInfo
      };
    }

  } catch (error) {
    console.error('💥 Unexpected Error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Helper function to calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param sex - 'male' or 'female'
 */
export function calculateBMR(weight: number, height: number, age: number, sex: string): number {
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  return sex.toLowerCase() === 'male' ? baseBMR + 5 : baseBMR - 161;
}

/**
 * Helper function to calculate TDEE (Total Daily Energy Expenditure)
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Activity level multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: { [key: string]: number } = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extremely_active': 1.9
  };
  
  const multiplier = activityMultipliers[activityLevel.toLowerCase()] || 1.55;
  return bmr * multiplier;
}

/**
 * Helper function to calculate caloric needs based on goals
 * @param tdee - Total Daily Energy Expenditure
 * @param goal - 'weight_loss', 'maintenance', or 'weight_gain'
 */
export function calculateCaloricNeeds(tdee: number, goal: string): number {
  switch (goal.toLowerCase()) {
    case 'weight_loss':
    case 'fat_loss':
      return Math.round(tdee - 500); // 500 calorie deficit for ~1lb/week loss
    case 'weight_gain':
    case 'muscle_gain':
      return Math.round(tdee + 300); // 300 calorie surplus for lean gains
    case 'maintenance':
    default:
      return Math.round(tdee);
  }
}

/**
 * Helper function to calculate macronutrient distribution
 * @param calories - Total daily calories
 * @param goal - Primary goal
 * @param weight - Body weight in kg
 */
export function calculateMacros(calories: number, goal: string, weight: number) {
  let proteinRatio, carbRatio, fatRatio;
  
  switch (goal.toLowerCase()) {
    case 'weight_loss':
    case 'fat_loss':
      proteinRatio = 0.35; // Higher protein for satiety and muscle preservation
      fatRatio = 0.25;
      carbRatio = 0.40;
      break;
    case 'muscle_gain':
    case 'weight_gain':
      proteinRatio = 0.25;
      fatRatio = 0.25;
      carbRatio = 0.50; // Higher carbs for energy
      break;
    case 'maintenance':
    default:
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45;
      break;
  }
  
  const proteinCalories = calories * proteinRatio;
  const carbCalories = calories * carbRatio;
  const fatCalories = calories * fatRatio;
  
  return {
    protein: Math.round(proteinCalories / 4), // 4 calories per gram
    carbs: Math.round(carbCalories / 4), // 4 calories per gram
    fats: Math.round(fatCalories / 9), // 9 calories per gram
    fiber: Math.round(weight * 0.5), // 0.5g per kg body weight
  };
} 