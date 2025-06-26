
// AI Fitness Plan Generation with OpenAI Integration
import { supabase } from './supabase'
import OpenAI from 'openai'

/**
 * Helper function to get the next occurrence of a specific day of the week
 * @param dayName - Name of the day (e.g., 'Monday', 'Tuesday', etc.)
 * @param startDate - Starting date (defaults to today)
 * @returns Date object for the next occurrence of that day
 */
function getNextDayOfWeek(dayName: string, startDate: Date = new Date()): Date {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = dayNames.indexOf(dayName);
  
  if (targetDayIndex === -1) {
    throw new Error(`Invalid day name: ${dayName}`);
  }
  
  const currentDate = new Date(startDate);
  const currentDayIndex = currentDate.getDay();
  
  // Calculate days until the target day
  let daysUntilTarget = targetDayIndex - currentDayIndex;
  
  // If the target day is today or has passed this week, move to next week
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
  // Create new date with the calculated offset
  const targetDate = new Date(currentDate);
  targetDate.setDate(currentDate.getDate() + daysUntilTarget);
  
  return targetDate;
}

/**
 * Helper function to format date as YYYY-MM-DD
 * @param date - Date object to format
 * @returns Formatted date string
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Function to process AI response and update workout plan dates
 * @param aiResponseText - Raw AI response text
 * @param clientId - Client ID for the workout plan
 * @returns Processed workout plan with updated dates
 */
function processWorkoutPlanDates(aiResponseText: string, clientId: number) {
  try {
    console.log('📅 Processing workout plan dates...');
    
    // Parse the AI response JSON
    const aiData = JSON.parse(aiResponseText);
    
    if (!aiData.workout_plan || !Array.isArray(aiData.workout_plan)) {
      throw new Error('Invalid workout plan format: missing workout_plan array');
    }
    
    console.log('📋 Found workout plan with', aiData.workout_plan.length, 'exercises');
    
    // Process each workout and update dates
    const processedWorkoutPlan = aiData.workout_plan.map((workout: any) => {
      const dayName = workout.day;
      
      if (!dayName) {
        console.warn('⚠️ Workout missing day information:', workout);
        return workout;
      }
      
      try {
        // Get the next occurrence of this day
        const workoutDate = getNextDayOfWeek(dayName);
        const formattedDate = formatDateToYYYYMMDD(workoutDate);
        
        console.log(`📅 ${dayName} workout scheduled for: ${formattedDate}`);
        
        // Update the workout with the calculated date and client ID
        return {
          ...workout,
          for_date: formattedDate,
          client_id: clientId
        };
      } catch (error) {
        console.error(`❌ Error processing date for ${dayName}:`, error);
        return workout;
      }
    });
    
    console.log('✅ Successfully processed workout plan dates');
    
    return {
      ...aiData,
      workout_plan: processedWorkoutPlan
    };
    
  } catch (error) {
    console.error('❌ Error processing workout plan dates:', error);
    throw new Error(`Failed to process workout plan dates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Function to save workout plan to database
 * @param workoutPlan - Array of workout exercises with dates
 * @param clientId - Client ID
 * @returns Success status and details
 */
async function saveWorkoutPlanToDatabase(workoutPlan: any[], clientId: number) {
  try {
    console.log('💾 Saving workout plan to database...');
    console.log('📊 Workout plan items to save:', workoutPlan.length);
    
    // Prepare data for database insertion
    const workoutData = workoutPlan.map((workout) => ({
      client_id: clientId,
      workout_name: workout.workout || workout.name,
      day: workout.day,
      sets: workout.sets,
      reps: workout.reps,
      duration: workout.duration,
      weights: workout.weights,
      for_date: workout.for_date,
      for_time: workout.for_time || '08:00:00',
      body_part: workout.body_part,
      category: workout.category,
      coach_tip: workout.coach_tip,
      icon: workout.icon,
      progression_notes: workout.progression_notes,
      created_at: new Date().toISOString()
    }));
    
    console.log('📝 Prepared workout data for database:', workoutData);
    
    // Insert workout plan into database
    const { data, error } = await supabase
      .from('workout_plan')
      .insert(workoutData)
      .select();
    
    if (error) {
      console.error('❌ Database insertion error:', error);
      throw new Error(`Failed to save workout plan: ${error.message}`);
    }
    
    console.log('✅ Successfully saved workout plan to database');
    console.log('📊 Inserted records:', data?.length || 0);
    
    return {
      success: true,
      message: `Successfully saved ${data?.length || 0} workout exercises to database`,
      data: data
    };
    
  } catch (error) {
    console.error('❌ Error saving workout plan to database:', error);
    return {
      success: false,
      message: `Failed to save workout plan: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

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
      
      // Process workout plan dates
      if (!aiResponse.response) {
        throw new Error('AI response is empty or null');
      }
      const processedWorkoutPlan = processWorkoutPlanDates(aiResponse.response, clientId);
      
      // Save workout plan to database
      if (!processedWorkoutPlan.workout_plan || processedWorkoutPlan.workout_plan.length === 0) {
        console.warn('⚠️ No workout exercises found in AI response');
        return {
          success: false,
          message: 'No workout exercises found in AI response',
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse,
          workoutPlan: processedWorkoutPlan
        };
      }
      
      const saveResult = await saveWorkoutPlanToDatabase(processedWorkoutPlan.workout_plan, clientId);
      
      if (saveResult.success) {
        return {
          success: true,
          message: `Successfully generated and saved AI workout plan for client: ${clientInfo.name || clientInfo.preferredName || 'Unknown'}`,
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse,
          workoutPlan: processedWorkoutPlan
        };
      } else {
        console.error('❌ Error saving workout plan to database:', saveResult.message);
        return {
          success: false,
          message: `Failed to save workout plan: ${saveResult.message}`,
          clientData: clientData,
          clientInfo: clientInfo
        };
      }
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

// Export utility functions for testing and external use
export { getNextDayOfWeek, formatDateToYYYYMMDD, processWorkoutPlanDates, saveWorkoutPlanToDatabase };