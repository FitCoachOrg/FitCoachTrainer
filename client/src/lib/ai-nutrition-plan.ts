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
const nutritionCoachPrompt = `You are a world-class nutrition coach and registered dietitian. Based on the inputs below, create a personalized, evidence-based nutrition plan tailored to the client's goals, preferences, dietary restrictions, and lifestyle. Make sure you provide with meals for atleastr

Inputs:
Primary Goal: ${clientInfo.primaryGoal || 'N/A'}
Specific Outcome: ${clientInfo.specificOutcome || 'N/A'}
Goal Deadline: ${clientInfo.goalTimeline || 'N/A'}
Current Weight: ${clientInfo.weight || 'N/A'} kg
Target Weight: ${clientInfo.targetWeight || 'N/A'} kg
Height: ${clientInfo.height || 'N/A'} cm
Age: ${clientInfo.age || 'N/A'}
Sex: ${clientInfo.sex || 'N/A'}
Activity Level: ${clientInfo.activityLevel || 'Moderate'}
Training Days/Week: ${clientInfo.trainingDaysPerWeek || '3'}

Dietary Information:
Eating Habits: ${clientInfo.eatingHabits || 'N/A'}
Diet Preferences: ${Array.isArray(clientInfo.dietPreferences) ? clientInfo.dietPreferences.join(', ') : clientInfo.dietPreferences || 'None'}
Food Allergies: ${Array.isArray(clientInfo.foodAllergies) ? clientInfo.foodAllergies.join(', ') : clientInfo.foodAllergies || 'None'}
Preferred Meals Per Day: ${clientInfo.preferredMealsPerDay || '3 meals + 2 snacks'}
Gastric Issues: ${clientInfo.gastricIssues || 'None'}
Supplements: ${clientInfo.supplements || 'None'}

Schedule Information:
Wake Time: ${clientInfo.wakeTime || 'N/A'}
Bed Time: ${clientInfo.bedTime || 'N/A'}
Breakfast Time: ${clientInfo.breakfastTime || 'N/A'}
Lunch Time: ${clientInfo.lunchTime || 'N/A'}
Dinner Time: ${clientInfo.dinnerTime || 'N/A'}
Snack Time: ${clientInfo.snackTime || 'N/A'}
Workout Time: ${clientInfo.workoutTime || 'N/A'}

Lifestyle Information:
Sleep Hours: ${clientInfo.sleepHours || 'N/A'}
Stress Level: ${clientInfo.stress || 'N/A'}
Alcohol Consumption: ${clientInfo.alcohol || 'N/A'}

Additional Client Information:
Name: ${clientInfo.name || clientInfo.preferredName || 'N/A'}
Motivation Style: ${clientInfo.motivationStyle || 'N/A'}
Obstacles: ${clientInfo.obstacles || 'N/A'}
Confidence Level (1–10): ${clientInfo.confidenceLevel || 'N/A'}

Guidelines:
Calculate appropriate caloric intake based on BMR, activity level, and goals (weight loss, maintenance, or gain).
Determine optimal macronutrient ratios (protein, carbs, fats) based on goals and activity level.
Consider meal timing around workouts for optimal performance and recovery.
Respect dietary preferences, restrictions, and allergies.
Account for gastric issues and food sensitivities.
Include hydration recommendations.
Provide practical meal suggestions that fit the client's schedule.
Consider supplement recommendations if appropriate.
Include progression and adjustment guidelines.
Ensure nutritional adequacy and sustainability.
Make sure the plan is atleast 7 days long.
Make sure the plan is atleast 3 meals per day(Breakfast, Lunch, Dinner, Snacks).

Output Format (in JSON):
{
  "overview": "Brief summary of the nutrition plan approach and rationale",
  "daily_targets": {
    "calories": int,
    "protein": int,
    "carbs": int,
    "fats": int,
    "fiber": int,
    "water_liters": int
  },
  "meal_timing": {
    "breakfast": "07:00",
    "lunch": "12:00",
    "dinner": "19:00",
    "snacks": ["10:00", "15:00"]
  },
  "nutrition_plan": [
    {
      "food_name": "",
      "meal_type": "breakfast/lunch/snack/dinner",
      "portion_size": "",
      "calories": int,
      "protein": int,
      "carbs": int,
      "fats": int,
      "fiber": int,
      "for_date": "",
      "for_time": "",
      "coach_tip": "",
      "icon": "🥣",
      "category": "",
      "dietary_tags": ["..", "..."]
      ..........
    }.....
  ],
  "hydration_plan": "Drink 500ml upon waking, 250ml before each meal...",
  "supplement_recommendations": "Based on your goals and dietary intake...",
  "meal_prep_tips": "Practical suggestions for meal preparation...",
  "progress_tracking": "How to monitor and adjust the plan..."
}`;
  
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