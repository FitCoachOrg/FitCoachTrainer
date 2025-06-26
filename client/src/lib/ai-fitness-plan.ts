
// AI Fitness Plan Generation with OpenAI Integration
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
  
  console.log('📋 Preparing comprehensive fitness coach prompt...');
  
  // Use the comprehensive world-class fitness coach prompt template
  const fitnessCoachPrompt = `You are a world-class fitness coach. Based on the inputs below, create a personalized, evidence-based training program tailored to the client's goals, preferences, and constraints.

Inputs:
Goal: ${clientInfo.primaryGoal || 'N/A'}
Specific Outcome: ${clientInfo.specificOutcome || 'N/A'}
Goal Deadline: ${clientInfo.goalTimeline || 'N/A'}
Confidence Rating (1–10): ${clientInfo.confidenceLevel || 'N/A'}
Challenges/Obstacles: ${clientInfo.obstacles || 'N/A'}
Training Experience: ${clientInfo.trainingExperience || 'Beginner'}
Training History (Last 6 Months): ${clientInfo.previousTraining || 'Unknown'}
Training Frequency: ${clientInfo.trainingDaysPerWeek || '3'}x/week
Session Duration: ${clientInfo.trainingTimePerSession || '30-45 min'}
Training Location: ${clientInfo.trainingLocation || 'Home'}
Available Equipment: ${Array.isArray(clientInfo.availableEquipment) ? clientInfo.availableEquipment.join(', ') : clientInfo.availableEquipment || 'Bodyweight only'}
Limitations/Injuries: ${clientInfo.injuriesLimitations || 'None'}
Body Area Focus: ${Array.isArray(clientInfo.focusAreas) ? clientInfo.focusAreas.join(', ') : clientInfo.focusAreas || 'None'}
Workout Style Preferences: ${clientInfo.activityLevel || 'General'}

Additional Client Information:
Name: ${clientInfo.name || clientInfo.preferredName || 'N/A'}
Age: ${clientInfo.age || 'N/A'}
Sex: ${clientInfo.sex || 'N/A'}
Height: ${clientInfo.height || 'N/A'} cm
Current Weight: ${clientInfo.weight || 'N/A'} kg
Target Weight: ${clientInfo.targetWeight || 'N/A'} kg
Sleep Hours: ${clientInfo.sleepHours || 'N/A'}
Stress Level: ${clientInfo.stress || 'N/A'}
Motivation Style: ${clientInfo.motivationStyle || 'N/A'}

Guidelines:
Use the correct training philosophy based on the goal and training age
Choose appropriate progression models (linear, undulating, or block periodization) based on experience and timeline.
Structure training based on available days and session duration.
Respect equipment limitations and substitute intelligently.
Adjust exercises based on injury/limitation info.
Emphasize specified body areas without neglecting full-body balance.
Include progression triggers.
Insert deload every 4–6 weeks with 40% volume reduction if program spans 8+ weeks.
If timeline is <6 weeks, consider a short cycle without deload.

Output Format (in JSON):
{
  "overview": "...",
  "split": "...",
  "progression_model": "...",
  "weekly_breakdown": {
    "Monday": "...",
    "Tuesday": "...",
    "Wednesday": "...",
    "Thursday": "...",
    "Friday": "...",
    "Saturday": "...",
    "Sunday": "..."
  },
  "workout_plan": [
    {
      "workout": "Glute Bridges",
      "day": "Monday",
      "sets": 3,
      "reps": 15,
      "duration": 30,
      "weights": "bodyweight",
      "for_date": "2025-06-21",
      "for_time": "08:00:00",
      "body_part": "Glutes",
      "category": "Strength",
      "coach_tip": "Push through the heels",
      "icon": "🏋️‍♂️",
      "progression_notes": "Add 2 reps when RPE ≤ 8"
    }
  ]
}`;
  
  console.log('📝 Fitness coach prompt prepared with client data');
  
  console.log('🚀 Sending request to OpenAI using client SDK...');
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: fitnessCoachPrompt
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
 * Function to retrieve client data and generate AI workout plan
 * @param clientId - The ID of the client to fetch data for
 */
export async function generateAIWorkoutPlan(clientId: number) {
  console.log('🤖 Starting AI workout plan generation for client:', clientId);
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
    
    // Generate AI response using the comprehensive fitness coach prompt
    console.log('🤖 Starting OpenAI ChatGPT integration...');
    
    try {
      const aiResponse = await generateAIResponse(clientInfo);
      console.log('✅ AI Response generated successfully');
      console.log('🎯 AI Response:', aiResponse);
      
      return {
        success: true,
        message: `Successfully generated AI workout plan for client: ${clientInfo.name || clientInfo.preferredName || 'Unknown'}`,
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

