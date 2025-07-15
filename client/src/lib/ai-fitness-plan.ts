// AI Fitness Plan Generation with OpenRouter Integration
import { supabase } from './supabase'
import { askOpenRouter } from './open-router-service'

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
    console.log('📅 === PROCESSING WORKOUT PLAN DATES ===');
    console.log('📅 Processing workout plan dates...');
    if (typeof aiResponseText !== 'string') {
      console.error('❌ processWorkoutPlanDates received a non-string input:', aiResponseText);
      throw new Error('Invalid input: Expected a string response from AI.');
    }
    console.log('📅 AI Response Text Length:', aiResponseText.length);
    console.log('📅 AI Response Preview (first 500 chars):', aiResponseText.substring(0, 500));
    
    // Try to extract JSON from response using a robust regex
    console.log('🔍 Attempting to extract JSON from AI response...');
    let jsonText = aiResponseText;
    // Find the first {...} block (greedy, but stops at the last closing brace)
    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
      console.log('🔍 Found JSON match in response');
      console.log('🔍 Extracted JSON length:', jsonText.length);
    } else {
      console.log('🔍 No JSON brackets found, using full response');
    }
    // Try parsing, and if it fails, show a user-friendly error and log the raw response
    let aiData;
    try {
      aiData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('❌ Raw AI response:', aiResponseText);
      throw new Error('The AI returned invalid JSON. Please try again or check the raw response in the console.');
    }
    
    console.log('✅ JSON parsing successful');
    console.log('📊 Parsed AI Data Keys:', Object.keys(aiData));
    
    console.log('🔍 Validating workout plan structure...');
    console.log('🔍 Has workout_plan property:', !!aiData.workout_plan);
    console.log('🔍 workout_plan type:', typeof aiData.workout_plan);
    console.log('🔍 workout_plan is array:', Array.isArray(aiData.workout_plan));
    
    if (!aiData.workout_plan || !Array.isArray(aiData.workout_plan)) {
      console.error('❌ Invalid workout plan format: missing workout_plan array');
      console.error('❌ AI Data structure:', aiData);
      throw new Error('Invalid workout plan format: missing workout_plan array');
    }
    
    console.log('✅ Workout plan structure is valid');
    console.log('📋 Found workout plan with', aiData.workout_plan.length, 'exercises');
    console.log('📋 Sample exercise:', aiData.workout_plan[0]);
    
    // Helper function to validate and clean workout data
    const cleanWorkoutData = (workout: any) => {
      console.log('🧹 Cleaning workout data:', workout);
      
      // Helper function to extract numbers from strings
      const extractNumber = (value: any, defaultValue: number = 0): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Extract first number from string (e.g., "30 minutes" -> 30)
          const match = value.match(/(\d+)/);
          return match ? parseInt(match[1]) : defaultValue;
        }
        return defaultValue;
      };
      
      // Helper function to ensure string values
      const ensureString = (value: any, defaultValue: string = ''): string => {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        return defaultValue;
      };
      
      // Clean and validate reps - should be numeric or numeric string
      let cleanReps = workout.reps;
      if (typeof cleanReps === 'string' && cleanReps.includes('minute')) {
        // If reps contains "minute", it's probably duration that got mixed up
        console.warn('⚠️ Found duration value in reps field, moving to duration:', cleanReps);
        if (!workout.duration || workout.duration === 0) {
          workout.duration = extractNumber(cleanReps, 15);
        }
        cleanReps = '10'; // Default reps
      }
      
      // Ensure reps is a string representation of a number
      const repsNumber = extractNumber(cleanReps, 10);
      cleanReps = repsNumber.toString();
      
      // Clean duration - should be numeric
      let cleanDuration = extractNumber(workout.duration, 15);
      
      // If duration is unreasonably large (like if it got confused with reps), fix it
      if (cleanDuration > 180) { // More than 3 hours seems wrong for a single exercise
        console.warn('⚠️ Duration seems too large, capping at 60 minutes:', cleanDuration);
        cleanDuration = 60;
      }
      
      const cleanedWorkout = {
        ...workout,
        sets: extractNumber(workout.sets, 3),
        reps: cleanReps,
        duration: cleanDuration,
        weights: ensureString(workout.weights, 'bodyweight'),
        equipment: ensureString(workout.equipment, 'bodyweight'),
        body_part: ensureString(workout.body_part, 'Full Body'),
        category: ensureString(workout.category, 'Strength'),
        coach_tip: ensureString(workout.coach_tip, 'Focus on proper form'),
        icon: ensureString(workout.icon, '💪'),
        workout_yt_link: ensureString(workout.workout_yt_link, '')
      };
      
      console.log('✅ Cleaned workout data:', cleanedWorkout);
      return cleanedWorkout;
    };

    // Process each workout and update dates
    const processedWorkoutPlan = aiData.workout_plan.map((workout: any) => {
      // First clean the workout data
      const cleanedWorkout = cleanWorkoutData(workout);
      
      const dayName = cleanedWorkout.day;
      
      if (!dayName) {
        console.warn('⚠️ Workout missing day information:', cleanedWorkout);
        return {
          ...cleanedWorkout,
          for_date: new Date().toISOString().split('T')[0], // Default to today
          client_id: clientId
        };
      }
      
      try {
        // Get the next occurrence of this day
        const workoutDate = getNextDayOfWeek(dayName);
        const formattedDate = formatDateToYYYYMMDD(workoutDate);
        
        console.log(`📅 ${dayName} workout scheduled for: ${formattedDate}`);
        
        // Update the workout with the calculated date and client ID
        return {
          ...cleanedWorkout,
          for_date: formattedDate,
          client_id: clientId
        };
      } catch (error) {
        console.error(`❌ Error processing date for ${dayName}:`, error);
        return {
          ...cleanedWorkout,
          for_date: new Date().toISOString().split('T')[0], // Default to today
          client_id: clientId
        };
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
    console.log('💾 === STARTING DATABASE SAVE OPERATION ===');
    console.log('💾 Saving workout plan to database...');
    console.log('📊 Workout plan items to save:', workoutPlan.length);
    console.log('🆔 Client ID:', clientId);
    console.log('📋 Input workout plan structure:', workoutPlan);
    console.log('📋 First workout raw data:', workoutPlan[0]);
    
    // Helper function to validate and format time
    const validateTime = (timeValue: any): string | null => {
      if (!timeValue) return '08:00:00'; // Default time
      
      // If it's already a valid time format (HH:MM:SS or HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (typeof timeValue === 'string' && timeRegex.test(timeValue)) {
        // Ensure HH:MM:SS format
        return timeValue.includes(':') && timeValue.split(':').length === 2 
          ? `${timeValue}:00` 
          : timeValue;
      }
      
      // If it's not a valid time or contains text like "not applicable", return default
      return '08:00:00';
    };

    // Prepare data for database insertion
    console.log('🔄 Starting data transformation for database...');
    
    const workoutData = workoutPlan.map((workout, index) => {
      console.log(`🏋️ Processing workout ${index + 1}:`, workout);
      
      const originalTime = workout.for_time;
      const validatedTime = validateTime(workout.for_time);
      
      if (originalTime !== validatedTime) {
        console.log(`⚠️ Time validation changed: "${originalTime}" → "${validatedTime}"`);
      }
      
      // Ensure proper types for database insertion
      const ensureNumber = (value: any, defaultValue: number = 0): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseInt(value);
          return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
      };
      
      const ensureString = (value: any, defaultValue: string = ''): string => {
        if (value === null || value === undefined) return defaultValue;
        return String(value);
      };
      
      const dbRecord = {
        client_id: clientId,
        workout: ensureString(workout.workout || workout.name, 'Unknown Exercise'),
        sets: ensureNumber(workout.sets, 3),
        reps: ensureString(workout.reps, '10'), // reps can be "10-12" or "10", so keep as string
        duration: ensureNumber(workout.duration, 15),
        weights: ensureString(workout.weights, 'bodyweight'),
        for_date: ensureString(workout.for_date, new Date().toISOString().split('T')[0]),
        for_time: validatedTime,
        body_part: ensureString(workout.body_part, 'Full Body'),
        category: ensureString(workout.category, 'Strength'),
        coach_tip: ensureString(workout.coach_tip, 'Focus on proper form'),
        icon: ensureString(workout.icon, '💪'),
        workout_yt_link: ensureString(workout.workout_yt_link, '')
        // workout_id is optional and will be auto-generated by Supabase if needed
      };
      
      console.log(`✅ Transformed workout ${index + 1} for DB:`, dbRecord);
      return dbRecord;
    });
    
    console.log('📝 === FINAL DATABASE PAYLOAD ===');
    console.log('📝 Prepared workout data for database:', workoutData);
    console.log('📝 Total records to insert:', workoutData.length);
    
    // Insert workout plan into database
    console.log('🗄️ === STARTING SUPABASE DATABASE INSERTION ===');
    console.log('🗄️ Table: workout_plan');
    console.log('🗄️ Operation: INSERT');
    console.log('🗄️ Data being inserted:', JSON.stringify(workoutData, null, 2));
    
    const { data, error } = await supabase
      .from('workout_plan')
      .insert(workoutData)
      .select();
    
    console.log('🗄️ === SUPABASE RESPONSE ===');
    console.log('🗄️ Error:', error);
    console.log('🗄️ Data:', data);
    console.log('🗄️ Data type:', typeof data);
    console.log('🗄️ Data length:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (error) {
      console.error('❌ === DATABASE INSERTION FAILED ===');
      console.error('❌ Database insertion error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      throw new Error(`Failed to save workout plan: ${error.message}`);
    }
    
    console.log('✅ === DATABASE INSERTION SUCCESSFUL ===');
    console.log('✅ Successfully saved workout plan to database');
    console.log('📊 Inserted records:', data?.length || 0);
    console.log('📊 Inserted data:', data);
    
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
 * Function to generate AI response using OpenRouter
 * @param clientInfo - Organized client information
 */
async function generateAIResponse(clientInfo: any) {
  console.log('🔑 Checking for OpenRouter API key...');
  
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to your .env file');
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('📋 Preparing comprehensive fitness coach prompt...');
  
  // Use the comprehensive world-class fitness coach prompt template
  // Helper to format client's preferred workout days
  const formatWorkoutDays = (workoutDays: any) => {
    if (!workoutDays) return 'N/A';
    if (typeof workoutDays === 'string') return workoutDays;
    if (Array.isArray(workoutDays)) return workoutDays.join(', ');
    if (typeof workoutDays === 'object') {
      // If it's an object like {"Monday": true, "Wednesday": true, "Friday": true}
      return Object.keys(workoutDays).filter(day => workoutDays[day]).join(', ');
    }
    return 'N/A';
  };

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
Preferred Workout Days: ${formatWorkoutDays(clientInfo.workoutDays)}
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
CRITICAL: Respect the exact number of training days per week specified in "Training Frequency" (${clientInfo.trainingDaysPerWeek || '3'} days)
CRITICAL: If "Preferred Workout Days" are specified, prioritize scheduling workouts on those specific days of the week
Respect equipment limitations and substitute intelligently. Only use exercises that can be performed with the available equipment.
Adjust exercises based on injury/limitation info.
Emphasize specified body areas without neglecting full-body balance.
Include progression triggers.
Insert deload every 4–6 weeks with 40% volume reduction if program spans 8+ weeks.
If timeline is <6 weeks, consider a short cycle without deload.

IMPORTANT: Create a complete weekly plan that includes every day of the week (Monday through Sunday). If a day is dedicated for rest, clearly indicate it as a rest day in the weekly_breakdown and include it in the workout_plan array with appropriate rest day information.

ICONS: Provide thoughtful, exercise-appropriate emojis that match the exercise type:
- Strength training: 🏋️‍♂️, 💪, 🔥
- Cardio: 🏃‍♂️, 🚴‍♂️, ❤️, 🫀
- Flexibility/Stretching: 🧘‍♂️, 🤸‍♂️, 🌟
- Core: 🔥, 💪, ⚡
- Upper body: 💪, 🏋️‍♂️, 🔥
- Lower body: 🦵, 🏃‍♂️, 💪
- Full body: 🔥, ⚡, 🎯
- Warm-up: 🌟, ⚡, 🔥
- Cool-down: 🧘‍♂️, 😌, 🌟

Respond with ONLY valid JSON. Do not include any text, comments, or explanations before or after the JSON.

IMPORTANT: Use clean, simple exercise names in the "workout" field (e.g., "Push-ups", "Squats", "Deadlifts"). Do not include category or body part in the exercise name itself.

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
      "equipment": "None - bodyweight only",
      "for_time": "08:00:00",
      "body_part": "Glutes",
      "category": "Strength",
      "coach_tip": "Provide a unique, actionable coaching tip for this exercise (e.g., 'Push through the heels to engage glutes fully. Maintain a neutral spine.')",
      "icon": "🔥",
      "progression_notes": "Add 2 reps when RPE ≤ 8"
    }
  ]
}`;
  
  console.log('📝 Fitness coach prompt prepared with client data');
  
  console.log('🚀 Sending request to OpenRouter...');
  
  try {
    const aiResponse = await askOpenRouter(fitnessCoachPrompt);
    console.log('📊 OpenRouter Response received');
    console.log('✅ AI Response extracted');
    
    return {
      response: aiResponse.response, // Correctly unpack the response string
      model: 'qwen/qwen3-8b:free',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error);
    throw new Error(`OpenRouter API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  console.log('⏰ Start Time:', new Date().toISOString());
  
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
    console.log('👤 Client Info Being Sent to AI:', {
      name: clientInfo.name,
      age: clientInfo.age,
      primaryGoal: clientInfo.primaryGoal,
      trainingDaysPerWeek: clientInfo.trainingDaysPerWeek,
      availableEquipment: clientInfo.availableEquipment
    });
    
    try {
      const startTime = Date.now();
      const aiResponse = await generateAIResponse(clientInfo);
      const endTime = Date.now();
      console.log('✅ AI Response generated successfully');
      console.log('⏱️ AI Generation took:', endTime - startTime, 'ms');
      console.log('🎯 AI Response Type:', typeof aiResponse);
      console.log('🎯 AI Response Keys:', Object.keys(aiResponse || {}));
      console.log('🎯 AI Response:', aiResponse);
      
      // Check if response contains expected structure
      if (aiResponse?.response) {
        console.log('📝 AI Response Text Length:', aiResponse.response.length);
        console.log('📝 AI Response Preview (first 200 chars):', aiResponse.response.substring(0, 200));
        console.log('🔍 Contains JSON brackets:', aiResponse.response.includes('{') && aiResponse.response.includes('}'));
      } else {
        console.error('❌ AI Response missing response field:', aiResponse);
      }
      
      // Process workout plan dates
      console.log('📅 Starting workout plan date processing...');
      if (!aiResponse.response) {
        console.error('❌ AI response is empty or null');
        throw new Error('AI response is empty or null');
      }
      
      console.log('🔄 Processing workout plan dates...');
      const processedWorkoutPlan = processWorkoutPlanDates(aiResponse.response, clientId);
      console.log('✅ Date processing completed');
      console.log('📊 Processed Workout Plan Keys:', Object.keys(processedWorkoutPlan || {}));
      console.log('📊 Workout Plan Array Length:', processedWorkoutPlan?.workout_plan?.length || 0);
      
      if (processedWorkoutPlan?.workout_plan?.length > 0) {
        console.log('📋 First Workout Sample:', processedWorkoutPlan.workout_plan[0]);
      }
      
      // Save workout plan to database
      console.log('💾 Checking if workout plan should be saved to database...');
      if (!processedWorkoutPlan.workout_plan || processedWorkoutPlan.workout_plan.length === 0) {
        console.warn('⚠️ No workout exercises found in AI response');
        console.log('❌ WILL NOT SAVE TO DATABASE - No exercises found');
        return {
          success: false,
          message: 'No workout exercises found in AI response',
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse,
          workoutPlan: processedWorkoutPlan
        };
      }
      
      console.log('✅ Workout exercises found, PROCEEDING WITH DATABASE SAVE');
      console.log('📊 Number of exercises to save:', processedWorkoutPlan.workout_plan.length);
      
      // Prepare the data that will be sent to database for debugging
      const validateTime = (timeValue: any): string | null => {
        if (!timeValue) return '08:00:00';
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (typeof timeValue === 'string' && timeRegex.test(timeValue)) {
          return timeValue.includes(':') && timeValue.split(':').length === 2 
            ? `${timeValue}:00` 
            : timeValue;
        }
        return '08:00:00';
      };

      const debugParsedData = processedWorkoutPlan.workout_plan.map((workout: any) => ({
        client_id: clientId,
        workout: workout.workout || workout.name,
        sets: workout.sets,
        reps: workout.reps,
        duration: workout.duration,
        weights: workout.weights,
        for_date: workout.for_date,
        for_time: validateTime(workout.for_time),
        body_part: workout.body_part,
        category: workout.category,
        coach_tip: workout.coach_tip,
        icon: workout.icon,
        workout_yt_link: workout.workout_yt_link || ''
      }));

      console.log('🚀 CALLING saveWorkoutPlanToDatabase function...');
      console.log('📝 About to save workout plan with:', {
        workoutPlanLength: processedWorkoutPlan.workout_plan.length,
        clientId: clientId,
        sampleWorkout: processedWorkoutPlan.workout_plan[0]
      });
      
      const saveResult = await saveWorkoutPlanToDatabase(processedWorkoutPlan.workout_plan, clientId);
      
      console.log('📤 Database save operation completed');
      console.log('✅ Save Result:', saveResult);
      console.log('🎯 Save Success:', saveResult.success);
      
      if (saveResult.success) {
        console.log('🎉 DATABASE SAVE SUCCESSFUL!');
        console.log('📊 Records saved:', saveResult.data?.length || 0);
        console.log('🔍 === OPERATION SUMMARY (SUCCESS) ===');
        console.log('🔍 1. ✅ Client data retrieved from database');
        console.log('🔍 2. ✅ AI response generated successfully');
        console.log('🔍 3. ✅ AI response parsed successfully');
        console.log('🔍 4. ✅ Workout plan dates processed');
        console.log('🔍 5. ✅ DATABASE SAVE COMPLETED');
        console.log('🔍 FINAL RESULT: YES, THE CODE AUTOMATICALLY PUSHES TO DATABASE');
        console.log('🔍 Records saved to workout_plan table:', saveResult.data?.length || 0);
        return {
          success: true,
          message: `Successfully generated and saved AI workout plan for client: ${clientInfo.name || clientInfo.preferredName || 'Unknown'}`,
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse,
          workoutPlan: processedWorkoutPlan,
          debugData: {
            rawResponse: aiResponse,
            parsedData: debugParsedData
          }
        };
      } else {
        console.error('❌ Error saving workout plan to database:', saveResult.message);
        console.log('🔍 === OPERATION SUMMARY (FAILED) ===');
        console.log('🔍 1. ✅ Client data retrieved from database');
        console.log('🔍 2. ✅ AI response generated successfully');
        console.log('🔍 3. ✅ AI response parsed successfully');
        console.log('🔍 4. ✅ Workout plan dates processed');
        console.log('🔍 5. ❌ DATABASE SAVE FAILED');
        console.log('🔍 ERROR DETAILS:', saveResult.message);
        return {
          success: false,
          message: `Failed to save workout plan: ${saveResult.message}`,
          clientData: clientData,
          clientInfo: clientInfo,
          debugData: {
            rawResponse: aiResponse,
            parsedData: debugParsedData,
            error: saveResult.message
          }
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

/**
 * Function to retrieve client data and generate AI workout plan for REVIEW ONLY
 * This version does NOT automatically save to Supabase - allows for review and editing first
 * @param clientId - The ID of the client to fetch data for
 */
export async function generateAIWorkoutPlanForReview(clientId: number) {
  console.log('🤖 Starting AI workout plan generation for REVIEW for client:', clientId);
  console.log('📊 Target Table: client');
  console.log('🔍 Query Parameters:', { client_id: clientId });
  console.log('⏰ Start Time:', new Date().toISOString());
  console.log('🔒 REVIEW MODE: Will NOT automatically save to Supabase');
  
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
      return {
        success: false,
        message: `No client found with ID: ${clientId}`
      };
    }

    console.log('✅ Successfully retrieved client data!');
    
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
    console.log('👤 Client Info Being Sent to AI:', {
      name: clientInfo.name,
      age: clientInfo.age,
      primaryGoal: clientInfo.primaryGoal,
      trainingDaysPerWeek: clientInfo.trainingDaysPerWeek,
      availableEquipment: clientInfo.availableEquipment
    });
    
    try {
      const startTime = Date.now();
      const aiResponse = await generateAIResponse(clientInfo);
      const endTime = Date.now();
      console.log('✅ AI Response generated successfully');
      console.log('⏱️ AI Generation took:', endTime - startTime, 'ms');
      
      // After receiving the OpenRouter response:
      // Assume 'aiResponse' is the parsed response from OpenRouter
      // Add this check after parsing:
      if (!aiResponse || !aiResponse.response || aiResponse.response.trim() === '') {
        console.error('❌ AI Response missing or empty:', aiResponse);
        throw new Error('Failed to generate AI response: AI response is empty or null');
      }
      
      console.log('🔄 Processing workout plan dates...');
      const processedWorkoutPlan = processWorkoutPlanDates(aiResponse.response, clientId);
      console.log('✅ Date processing completed');
      console.log('📊 Processed Workout Plan Keys:', Object.keys(processedWorkoutPlan || {}));
      console.log('📊 Workout Plan Array Length:', processedWorkoutPlan?.workout_plan?.length || 0);
      
      if (processedWorkoutPlan?.workout_plan?.length > 0) {
        console.log('📋 First Workout Sample:', processedWorkoutPlan.workout_plan[0]);
      }
      
      // Check if workout plan exists
      if (!processedWorkoutPlan.workout_plan || processedWorkoutPlan.workout_plan.length === 0) {
        console.warn('⚠️ No workout exercises found in AI response');
        return {
          success: false,
          message: 'No workout exercises found in AI response',
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse
        };
      }
      
      console.log('✅ AI Workout Plan generated successfully for REVIEW');
      console.log('🔒 REVIEW MODE: Plan returned for review, NOT saved to database');
      console.log('📊 Number of exercises generated:', processedWorkoutPlan.workout_plan.length);
      
      return {
        success: true,
        message: `Successfully generated AI workout plan for review: ${clientInfo.name || clientInfo.preferredName || 'Unknown'}`,
        clientData: clientData,
        clientInfo: clientInfo,
        aiResponse: aiResponse,
        workoutPlan: processedWorkoutPlan,
        generatedAt: new Date().toISOString(),
        autoSaved: false 
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
 * Function to manually save a reviewed and approved workout plan to Supabase
 * @param workoutPlan - Array of workout exercises with dates (already processed)
 * @param clientId - Client ID
 * @returns Success status and details
 */
export async function saveReviewedWorkoutPlanToDatabase(workoutPlan: any[], clientId: number) {
  console.log('💾 === SAVING REVIEWED WORKOUT PLAN TO DATABASE ===');
  console.log('💾 This plan was reviewed and approved by the user');
  console.log('📊 Workout plan items to save:', workoutPlan.length);
  console.log('🆔 Client ID:', clientId);
  
  try {
    const result = await saveWorkoutPlanToDatabase(workoutPlan, clientId);
    console.log('✅ Reviewed workout plan saved successfully');
    return result;
  } catch (error) {
    console.error('❌ Error saving reviewed workout plan:', error);
    throw error;
  }
}

// Export utility functions for testing and external use
export { getNextDayOfWeek, formatDateToYYYYMMDD, processWorkoutPlanDates, saveWorkoutPlanToDatabase };