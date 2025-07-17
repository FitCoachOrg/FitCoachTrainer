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
    let cleanText = aiResponseText.trim();
    console.log('🔍 Processing AI response text length:', cleanText.length);
    console.log('🔍 First 500 characters:', cleanText.substring(0, 500));
    console.log('🔍 Last 500 characters:', cleanText.substring(Math.max(0, cleanText.length - 500)));
    
    // Remove Markdown code block markers if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }
    
    // Check if the JSON appears to be incomplete
    const lastChar = cleanText.charAt(cleanText.length - 1);
    const openBraces = (cleanText.match(/\{/g) || []).length;
    const closeBraces = (cleanText.match(/\}/g) || []).length;
    const openBrackets = (cleanText.match(/\[/g) || []).length;
    const closeBrackets = (cleanText.match(/\]/g) || []).length;
    
    console.log('🔍 JSON structure check:');
    console.log('  - Open braces:', openBraces, 'Close braces:', closeBraces);
    console.log('  - Open brackets:', openBrackets, 'Close brackets:', closeBrackets);
    console.log('  - Last character:', lastChar);
    
    // Check for common JSON malformation issues
    const hasUnclosedQuotes = (cleanText.match(/"/g) || []).length % 2 !== 0;
    const hasUnclosedBraces = openBraces !== closeBraces;
    const hasUnclosedBrackets = openBrackets !== closeBrackets;
    
    if (hasUnclosedQuotes) {
      console.warn('⚠️ JSON has unclosed quotes');
      throw new Error('AI response contains malformed JSON with unclosed quotes. Please try again.');
    }
    
    if (hasUnclosedBraces || hasUnclosedBrackets) {
      console.warn('⚠️ JSON appears to be incomplete - missing closing brackets/braces');
      throw new Error('AI response appears to be incomplete. The JSON was cut off mid-response. Please try again.');
    }
    
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Initial JSON parse failed:', parseError);
      
      // Try to fix common JSON issues
      let fixedText = cleanText;
      
      console.log('🔧 Attempting JSON fixes...');
      
      // Remove trailing commas before closing braces/brackets
      const beforeTrailingComma = fixedText;
      fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1');
      if (beforeTrailingComma !== fixedText) {
        console.log('🔧 Fixed trailing commas');
      }
      
      // Fix common malformed values
      const beforeValueFixes = fixedText;
      fixedText = fixedText.replace(/(\d+)_([a-zA-Z]+)/g, '"$1 $2"'); // Fix 30_min -> "30 min"
      fixedText = fixedText.replace(/(\d+)min/g, '"$1 min"'); // Fix 30min -> "30 min"
      fixedText = fixedText.replace(/(\d+)sec/g, '"$1 sec"'); // Fix 60sec -> "60 sec"
      fixedText = fixedText.replace(/(\d+)kg/g, '"$1 kg"'); // Fix 50kg -> "50 kg"
      fixedText = fixedText.replace(/(\d+)lb/g, '"$1 lb"'); // Fix 100lb -> "100 lb"
      
      // Fix specific patterns that cause JSON errors
      fixedText = fixedText.replace(/"reps":\s*(\d+)_([a-zA-Z]+)/g, '"reps": "$1 $2"'); // Fix reps: 30_min
      fixedText = fixedText.replace(/"duration":\s*(\d+)_([a-zA-Z]+)/g, '"duration": "$1 $2"'); // Fix duration: 30_min
      fixedText = fixedText.replace(/"weights":\s*(\d+)_([a-zA-Z]+)/g, '"weights": "$1 $2"'); // Fix weights: 50_kg
      
      if (beforeValueFixes !== fixedText) {
        console.log('🔧 Fixed malformed values (units)');
      }
      
      // Try to find the last complete object
      const lastCompleteMatch = fixedText.match(/\{[^{}]*\}/g);
      if (lastCompleteMatch) {
        const lastComplete = lastCompleteMatch[lastCompleteMatch.length - 1];
        const lastCompleteIndex = fixedText.lastIndexOf(lastComplete);
        if (lastCompleteIndex > 0) {
          // Try to reconstruct a valid JSON
          const beforeLast = fixedText.substring(0, lastCompleteIndex);
          const reconstructed = beforeLast + lastComplete + ']}';
          console.log('🔧 Attempting to reconstruct JSON from:', reconstructed.substring(0, 200) + '...');
          
          try {
            parsed = JSON.parse(reconstructed);
          } catch (reconstructError) {
            console.error('❌ JSON reconstruction failed:', reconstructError);
            
            // Last resort: try to extract just the first few days
            console.log('🔧 Attempting to extract partial workout plan...');
            const daysMatch = cleanText.match(/"days":\s*\[([\s\S]*?)\]/);
            if (daysMatch) {
              const daysContent = daysMatch[1];
              const dayMatches = daysContent.match(/\{[^{}]*\}/g);
              if (dayMatches && dayMatches.length > 0) {
                const partialDays = dayMatches.map(day => {
                  try {
                    return JSON.parse(day);
                  } catch {
                    return null;
                  }
                }).filter(day => day !== null);
                
                if (partialDays.length > 0) {
                  console.log('✅ Successfully extracted partial workout plan with', partialDays.length, 'days');
                  return {
                    days: partialDays,
                    workout_plan: partialDays.flatMap((day: any, i: number) => (day.exercises || []).map((ex: any) => ({ ...ex, dayIndex: i })))
                  };
                }
              }
            }
            
            throw parseError; // Throw original error
          }
        } else {
          throw parseError;
        }
      } else {
        throw parseError;
      }
    }
    
    if (parsed.days && Array.isArray(parsed.days)) {
      // Assign dates to each day based on planStartDate (to be done in UI)
      return {
        days: parsed.days,
        workout_plan: parsed.days.flatMap((day: any, i: number) => (day.exercises || []).map((ex: any) => ({ ...ex, dayIndex: i })))
      };
    }
    // fallback for legacy
    return parsed;
  } catch (e) {
    console.error('Failed to parse AI response as new days schema:', e);
    console.error('Raw response length:', aiResponseText.length);
    console.error('Raw response preview:', aiResponseText.substring(0, 1000));
    
    if (e instanceof SyntaxError) {
      throw new Error(`AI response contains invalid JSON. The response may have been cut off. Please try again. Original error: ${e.message}`);
    }
    
    return { workout_plan: [] };
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
        sets: String(workout.sets ?? '3'), // sets is always a string
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
async function generateAIResponse(clientInfo: any, model?: string): Promise<{ response: string, model: string, timestamp: string, fallbackModelUsed?: boolean }> {
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

  // --- NEW AI RESPONSE SCHEMA ---
  // The AI should return a JSON object like:
  // {
  //   "week": [
  //     {
  //       "date": "2025-06-01",
  //       "focus": "Upper Body Strength",
  //       "exercises": [
  //         { "exercise_name": "Bench Press", "category": "Strength", "body_part": "Chest", "sets": 3, "reps": 10, "duration": 15, "weights": "barbell", "equipment": "Barbell", "coach_tip": "Keep elbows at 45 degrees." },
  //         ...
  //       ]
  //     },
  //     ...
  //     {
  //       "date": "2025-06-02",
  //       "focus": "Rest Day",
  //       "exercises": []
  //     }
  //   ]
  // }

  // Update the AI prompt in generateAIResponse
  const numDays = 7; // You can make this dynamic if needed
  const fitnessCoachPrompt = `Create a ${numDays}-day workout plan for a client with these details:

Goal: ${clientInfo.primaryGoal || 'General fitness'}
Experience: ${clientInfo.trainingExperience || 'Beginner'}
Frequency: ${clientInfo.trainingDaysPerWeek || '3'} days/week
Duration: ${clientInfo.trainingTimePerSession || '45 min'}
Equipment: ${Array.isArray(clientInfo.availableEquipment) ? clientInfo.availableEquipment.join(', ') : clientInfo.availableEquipment || 'Bodyweight only'}
Limitations/Injuries: ${clientInfo.injuriesLimitations || 'None'}
Workout Style: ${clientInfo.activityLevel || 'General'}
Focus Areas: ${Array.isArray(clientInfo.focusAreas) ? clientInfo.focusAreas.join(', ') : clientInfo.focusAreas || 'Full body'}

Client: ${clientInfo.name || 'Unknown'}, ${clientInfo.age || 'N/A'} years, ${clientInfo.sex || 'N/A'}

Guidelines:
- Use correct training philosophy based on goal and experience level
- Choose appropriate progression (linear, undulating, or block periodization)
- Insert deload every 4-6 weeks with 40% volume reduction if program spans 8+ weeks
- If timeline <6 weeks, consider short cycle without deload
- Respect injury limitations and adjust exercises accordingly
- Emphasize specified focus areas while maintaining balance
- Select exercises based on: goal requirements, available time, and progression needs
- Calculate total time: (sets × reps × duration) + rest periods = target session time
- Include compound movements for efficiency and multi-joint exercises for time optimization
- Use gym-standard exercise names only (e.g., "Bench Press", "Squats", "Deadlifts")
- Include specific notes in coach_tip: tempo, progressive overload cues, RPE targets
- Avoid generic advice - provide actionable, specific coaching cues
- Design multiple exercises per day to achieve comprehensive training stimulus
- Ensure proper exercise variety: compound + isolation, push + pull, upper + lower body balance

Requirements:
- Create exactly ${numDays} days
- Each day has a focus (e.g., "Upper Body", "Cardio", "Rest Day")
- Rest days have empty exercises array
- Sum of all exercise durations must equal target session time
- Use available equipment only
- Include rest periods between sets
- Adjust exercises based on limitations/injuries
- Focus on specified body areas
- Calculate exercises needed based on: session duration, sets, reps, rest periods, and goal requirements
- Ensure sufficient volume and variety to achieve client goals within timeline
- Include 4-8 exercises per training day for comprehensive stimulus
- Calculate rest periods: 60-90s for strength, 30-60s for hypertrophy, 15-30s for endurance
- Ensure sets and reps align with training goal: 1-5 reps (strength), 6-12 reps (hypertrophy), 12+ reps (endurance)
- Balance exercise selection: compound movements first, then isolation exercises

Respond with ONLY valid JSON in this format:
{
  "days": [
    {
      "focus": "Upper Body Strength",
      "exercises": [
        {
          "exercise_name": "Bench Press",
          "category": "Strength",
          "body_part": "Chest, Shoulders, Triceps",
          "sets": 4,
          "reps": 6,
          "duration": 45,
          "weights": "barbell",
          "equipment": "Barbell, Bench",
          "coach_tip": "3-1-3 tempo, RPE 7-8, retract scapula, feet flat",
          "rest": 90
        },
        {
          "exercise_name": "Bent Over Row",
          "category": "Strength",
          "body_part": "Back, Biceps",
          "sets": 3,
          "reps": 8,
          "duration": 40,
          "weights": "barbell",
          "equipment": "Barbell",
          "coach_tip": "2-1-2 tempo, RPE 7-8, keep back straight, pull to lower chest",
          "rest": 90
        },
        {
          "exercise_name": "Overhead Press",
          "category": "Strength",
          "body_part": "Shoulders, Triceps",
          "sets": 3,
          "reps": 8,
          "duration": 35,
          "weights": "dumbbells",
          "equipment": "Dumbbells",
          "coach_tip": "2-1-2 tempo, RPE 7-8, core tight, avoid arching back",
          "rest": 75
        },
        {
          "exercise_name": "Lat Pulldown",
          "category": "Strength",
          "body_part": "Back, Biceps",
          "sets": 3,
          "reps": 10,
          "duration": 30,
          "weights": "cable machine",
          "equipment": "Cable Machine",
          "coach_tip": "2-1-2 tempo, RPE 6-7, retract shoulder blades, wide grip",
          "rest": 60
        }
      ]
    }
  ]
}`;
  
  console.log('📝 Fitness coach prompt prepared with client data');
  
  console.log('🚀 Sending request to OpenRouter...');
  
  try {
    const aiResult = await askOpenRouter(fitnessCoachPrompt, model);
    console.log('📊 OpenRouter Response received');
    console.log('✅ AI Response extracted');
    
    return {
      response: aiResult.response, // Correctly unpack the response string
      model: aiResult.model,
      timestamp: new Date().toISOString(),
      fallbackModelUsed: aiResult.fallbackModelUsed,
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
export async function generateAIWorkoutPlanForReview(clientId: number, model?: string) {
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
      const aiResponse = await generateAIResponse(clientInfo, model);
      const endTime = Date.now();
      console.log('✅ AI Response generated successfully');
      console.log('⏱️ AI Generation took:', endTime - startTime, 'ms');
      
      // Improved error handling: Check for missing/invalid response
      if (!aiResponse || typeof aiResponse.response !== 'string' || !aiResponse.response.trim()) {
        console.error('❌ AI Response missing or empty:', aiResponse);
        throw new Error('Failed to generate AI response: The AI service returned an error or no data. Please try again later.');
      }
      
      // After receiving the OpenRouter response:
      // Assume 'aiResponse' is the parsed response from OpenRouter
      // Add this check after parsing:
      if (!aiResponse || !aiResponse.response || aiResponse.response.trim() === '') {
        console.error('❌ AI Response missing or empty:', aiResponse);
        throw new Error('Failed to generate AI response: AI response is empty or null');
      }
      
      console.log('🔄 Processing workout plan dates...');
      try {
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
            message: 'No workout exercises found in AI response. The AI response may have been incomplete or cut off.',
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
          autoSaved: false,
          fallbackModelUsed: aiResponse.fallbackModelUsed,
          aiModel: aiResponse.model,
        };
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
        return {
          success: false,
          message: parseError instanceof Error ? parseError.message : 'Failed to parse AI response. The response may have been incomplete.',
          clientData: clientData,
          clientInfo: clientInfo,
          aiResponse: aiResponse
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