// AI Fitness Plan Generation with Unified LLM Service
import { supabase } from './supabase'
// import { askOpenRouter } from './open-router-service'
// import { askCerebras } from './cerebras-service'
import { askLLM } from './llm-service'

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
 * Function to assign workouts to specific days based on client's workout_days
 * @param workoutDays - Array of workout days from LLM
 * @param clientWorkoutDays - Client's preferred workout days
 * @param planStartDate - Start date of the plan
 * @returns 7-day array with workouts assigned to correct days
 */
function assignWorkoutsToDays(workoutDays: any[], clientWorkoutDays: any, planStartDate: Date) {
  console.log('📅 Assigning workouts to specific days...');
  console.log('🏋️ Workout days from LLM:', workoutDays.length);
  console.log('📅 Client workout days:', clientWorkoutDays);
  
  // Create a 7-day array starting from planStartDate
  const weekDays: Array<{
    date: string;
    dayName: string;
    isWorkoutDay: boolean;
    workout: any | null;
  }> = [];
  
  console.log('📅 Plan start date for week generation:', planStartDate);
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(planStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    weekDays.push({
      date: currentDate.toISOString().split('T')[0],
      dayName: dayName,
      isWorkoutDay: false,
      workout: null
    });
  }
  
  console.log('📅 Generated week days:', weekDays.map(day => `${day.dayName} (${day.date})`));
  
  // Parse client workout days
  let clientDays: string[] = [];
  if (Array.isArray(clientWorkoutDays)) {
    clientDays = clientWorkoutDays.map((day: any) => day.toLowerCase());
  } else if (typeof clientWorkoutDays === 'string') {
    // Handle both comma-separated and object format
    if (clientWorkoutDays.includes('{') && clientWorkoutDays.includes('}')) {
      // Extract from object format like {Mon,Fri,Sat}
      const match = clientWorkoutDays.match(/\{([^}]+)\}/);
      if (match) {
        clientDays = match[1].split(',').map(day => day.trim().toLowerCase());
      }
    } else {
      // Handle comma-separated format like "Monday, Wednesday, Friday"
      clientDays = clientWorkoutDays.toLowerCase().split(',').map(day => day.trim());
    }
  }
  
  console.log('📅 Raw client workout days:', clientWorkoutDays);
  console.log('📅 Parsed client workout days:', clientDays);
  
  // Create a mapping from short day names to full day names
  const dayNameMapping: { [key: string]: string } = {
    'mon': 'monday',
    'tue': 'tuesday', 
    'wed': 'wednesday',
    'thu': 'thursday',
    'fri': 'friday',
    'sat': 'saturday',
    'sun': 'sunday'
  };
  
  // Convert short day names to full day names
  const fullClientDays = clientDays.map(day => dayNameMapping[day] || day);
  console.log('📅 Full client workout days:', fullClientDays);
  
  // Also handle full day names that might be passed
  const fullDayNameMapping: { [key: string]: string } = {
    'monday': 'monday',
    'tuesday': 'tuesday', 
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday'
  };
  
  // Convert any day names to lowercase for comparison
  const normalizedClientDays = fullClientDays.map(day => {
    const normalized = day.toLowerCase().trim();
    return fullDayNameMapping[normalized] || normalized;
  });
  console.log('📅 Normalized client workout days:', normalizedClientDays);
  
  // Find which days of the week match client's workout days
  const workoutDayIndices: number[] = [];
  weekDays.forEach((day, index) => {
    if (normalizedClientDays.includes(day.dayName)) {
      workoutDayIndices.push(index);
      day.isWorkoutDay = true;
      console.log(`✅ Found workout day: ${day.dayName} at index ${index}`);
    } else {
      console.log(`❌ Day ${day.dayName} not in client preferences: ${normalizedClientDays.join(', ')}`);
    }
  });
  
  console.log('📅 Workout day indices:', workoutDayIndices);
  
  // Assign workouts to the correct days
  // First, let's log what we're working with
  console.log('📅 Available workouts to assign:', workoutDays.length);
  console.log('📅 Client workout day indices:', workoutDayIndices);
  
  // Create a mapping of workout index to the actual day index
  const workoutAssignment = workoutDayIndices.slice(0, workoutDays.length).map((dayIndex, workoutIndex) => ({
    workoutIndex,
    dayIndex,
    dayName: weekDays[dayIndex].dayName
  }));
  
  console.log('📅 Workout assignment mapping:', workoutAssignment);
  
  // Assign workouts to the correct days
  workoutAssignment.forEach(({ workoutIndex, dayIndex, dayName }) => {
    if (workoutDays[workoutIndex]) {
      weekDays[dayIndex].workout = workoutDays[workoutIndex];
      console.log(`✅ Assigned workout ${workoutIndex + 1} to ${dayName} (day index ${dayIndex})`);
    }
  });
  
  // Convert to the expected format
  const result = weekDays.map(day => ({
    date: day.date,
    focus: day.workout ? day.workout.focus : 'Rest Day',
    exercises: day.workout ? day.workout.exercises : []
  }));
  
  console.log('📅 Final 7-day plan:', result);
  return result;
}

/**
 * Function to process AI response and update workout plan dates
 * @param aiResponseText - Raw AI response text
 * @param clientId - Client ID for the workout plan
 * @param clientWorkoutDays - Client's preferred workout days
 * @param planStartDate - Start date of the plan
 * @returns Processed workout plan with updated dates
 */
function processWorkoutPlanDates(aiResponseText: string, clientId: number, clientWorkoutDays?: any, planStartDate?: Date) {
  try {
    let cleanText = aiResponseText.trim();
    console.log('🔍 Processing AI response text length:', cleanText.length);
    console.log('🔍 First 500 characters:', cleanText.substring(0, 500));
    console.log('🔍 Last 500 characters:', cleanText.substring(Math.max(0, cleanText.length - 500)));
    
    // Remove Markdown code block markers if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }
    
    // Try to extract JSON from response that might contain explanatory text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
      console.log('🔍 Extracted JSON from response with explanatory text');
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
      console.log('🔍 Error position:', (parseError as Error).message.match(/position (\d+)/)?.[1] || 'unknown');
      
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
      
      // Fix missing quotes around string values
      fixedText = fixedText.replace(/"coach_tip":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"coach_tip": "$1"');
      fixedText = fixedText.replace(/"equipment":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"equipment": "$1"');
      fixedText = fixedText.replace(/"body_part":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"body_part": "$1"');
      fixedText = fixedText.replace(/"category":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"category": "$1"');
      fixedText = fixedText.replace(/"weights":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"weights": "$1"');
      
      // Fix missing quotes around exercise names
      fixedText = fixedText.replace(/"exercise_name":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"exercise_name": "$1"');
      
      // Fix missing quotes around focus
      fixedText = fixedText.replace(/"focus":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"focus": "$1"');
      
      // Fix missing quotes around any string value that should be quoted
      fixedText = fixedText.replace(/"([^"]+)":\s*([^",}\]]+)(?=\s*[,}\]])/g, '"$1": "$2"');
      
      // Fix specific issue with unquoted values after colons
      fixedText = fixedText.replace(/:\s*([^",}\]]+)(?=\s*[,}\]])/g, (match, value) => {
        // Don't quote numbers, booleans, or already quoted values
        if (/^\d+$/.test(value) || /^(true|false|null)$/.test(value) || value.startsWith('"')) {
          return match;
        }
        return `: "${value}"`;
      });
      
      // Fix any remaining unquoted string values in the JSON structure
      fixedText = fixedText.replace(/"([^"]+)":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"$1": "$2"');
      
      // More aggressive fix for unquoted values - handle spaces in values
      fixedText = fixedText.replace(/"([^"]+)":\s*([^",}\]]+?)(?=\s*[,}\]])/g, (match, key, value) => {
        // Don't quote numbers, booleans, or already quoted values
        if (/^\d+$/.test(value) || /^(true|false|null)$/.test(value) || value.startsWith('"')) {
          return match;
        }
        return `"${key}": "${value}"`;
      });
      
      // Fix unquoted property names (this is the main issue we're seeing)
      fixedText = fixedText.replace(/([a-zA-Z_][a-zA-Z0-9_]*):\s*([^",}\]]+?)(?=\s*[,}\]])/g, (match, key, value) => {
        // Don't quote numbers, booleans, or already quoted values
        if (/^\d+$/.test(value) || /^(true|false|null)$/.test(value) || value.startsWith('"')) {
          return `"${key}": ${value}`;
        }
        return `"${key}": "${value}"`;
      });
      
      // Additional fix for the specific pattern we're seeing
      fixedText = fixedText.replace(/"focus":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"focus": "$1"');
      fixedText = fixedText.replace(/"exercise_name":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"exercise_name": "$1"');
      fixedText = fixedText.replace(/"category":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"category": "$1"');
      fixedText = fixedText.replace(/"weights":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"weights": "$1"');
      fixedText = fixedText.replace(/"equipment":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"equipment": "$1"');
      fixedText = fixedText.replace(/"coach_tip":\s*([^",}\]]+?)(?=\s*[,}\]])/g, '"coach_tip": "$1"');
      
      // Fix the specific issue with body_part having multiple unquoted values
      fixedText = fixedText.replace(/"body_part":\s*([^",}\]]+?)(?=\s*[,}\]])/g, (match, value) => {
        // Handle the case where value contains multiple unquoted parts
        if (value.includes(',')) {
          const parts = value.split(',').map((part: string) => part.trim());
          return `"body_part": "${parts.join(', ')}"`;
        }
        return `"body_part": "${value}"`;
      });
      
      // Fix any remaining unquoted values that might have spaces and commas
      fixedText = fixedText.replace(/"([^"]+)":\s*([^",}\]]+?)(?=\s*[,}\]])/g, (match, key, value) => {
        // Don't quote numbers, booleans, or already quoted values
        if (/^\d+$/.test(value) || /^(true|false|null)$/.test(value) || value.startsWith('"')) {
          return match;
        }
                 // Handle values with commas
         if (value.includes(',')) {
           const parts = value.split(',').map((part: string) => part.trim());
           return `"${key}": "${parts.join(', ')}"`;
         }
        return `"${key}": "${value}"`;
      });
      
      // Debug: Show what the text looks like after fixes
      console.log('🔍 Fixed text preview:', fixedText.substring(0, 300));
      
      // More aggressive fix for unquoted property names with spaces
      fixedText = fixedText.replace(/([a-zA-Z_][a-zA-Z0-9_\s]*):\s*([^",}\]]+?)(?=\s*[,}\]])/g, (match, key, value) => {
        // Don't quote numbers, booleans, or already quoted values
        if (/^\d+$/.test(value) || /^(true|false|null)$/.test(value) || value.startsWith('"')) {
          return `"${key.trim()}": ${value}`;
        }
        return `"${key.trim()}": "${value}"`;
      });
      
      if (beforeValueFixes !== fixedText) {
        console.log('🔧 Fixed malformed values (units)');
      }
      
      // Try to parse the fixed text
      try {
        parsed = JSON.parse(fixedText);
        console.log('✅ JSON parse successful after fixes');
      } catch (fixError) {
        console.error('❌ JSON parse still failed after fixes:', fixError);
        
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
              console.log('✅ JSON reconstruction successful');
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
              
              // If all else fails, try to extract any valid JSON objects
              console.log('🔧 Last resort: extracting any valid JSON objects...');
              const jsonObjects = fixedText.match(/\{[^{}]*\}/g);
              if (jsonObjects && jsonObjects.length > 0) {
                const validObjects = jsonObjects.map(obj => {
                  try {
                    return JSON.parse(obj);
                  } catch {
                    return null;
                  }
                }).filter(obj => obj !== null);
                
                if (validObjects.length > 0) {
                  console.log('✅ Extracted', validObjects.length, 'valid JSON objects');
                  // Try to construct a minimal valid response
                  const exercises = validObjects.filter(obj => obj.exercise_name);
                  if (exercises.length > 0) {
                    return {
                      days: [{ focus: 'Workout', exercises }],
                      workout_plan: exercises.map((ex: any, i: number) => ({ ...ex, dayIndex: 0 }))
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
    }
    
    if (parsed.days && Array.isArray(parsed.days)) {
      // If we have client workout days and plan start date, assign workouts to specific days
      if (clientWorkoutDays && planStartDate) {
        console.log('📅 Using day assignment logic...');
        console.log('📅 Client workout days:', clientWorkoutDays);
        console.log('📅 Plan start date:', planStartDate);
        console.log('📅 Parsed days from AI:', parsed.days.length);
        console.log('📅 First parsed day:', parsed.days[0]);
        
        const assignedDays = assignWorkoutsToDays(parsed.days, clientWorkoutDays, planStartDate);
        console.log('📅 Assigned days result:', assignedDays);
        
        return {
          days: assignedDays,
          workout_plan: assignedDays.flatMap((day: any, i: number) => (day.exercises || []).map((ex: any) => ({ ...ex, dayIndex: i })))
        };
      } else {
        // Fallback to original logic
        console.log('📅 Using fallback day assignment...');
        console.log('📅 Client workout days:', clientWorkoutDays);
        console.log('📅 Plan start date:', planStartDate);
        return {
          days: parsed.days,
          workout_plan: parsed.days.flatMap((day: any, i: number) => (day.exercises || []).map((ex: any) => ({ ...ex, dayIndex: i })))
        };
      }
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
 * Function to generate AI response using OpenRouter with enhanced error handling
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
  
  // Enhanced client data processing
  const formatWorkoutDays = (workoutDays: any) => {
    if (!workoutDays) return 'N/A';
    if (typeof workoutDays === 'string') return workoutDays;
    if (Array.isArray(workoutDays)) return workoutDays.join(', ');
    if (typeof workoutDays === 'object') {
      return Object.keys(workoutDays).filter(day => workoutDays[day]).join(', ');
    }
    return 'N/A';
  };

  // Helper function to format training time duration
  const formatTrainingTime = (trainingTime: any): string => {
    if (!trainingTime) return '45';
    
    // Handle underscore format (e.g., "45_60" -> "45-60 minutes")
    if (typeof trainingTime === 'string' && trainingTime.includes('_')) {
      const [min, max] = trainingTime.split('_');
      return `${min}-${max} minutes`;
    }
    
    // Handle single number
    if (typeof trainingTime === 'string' || typeof trainingTime === 'number') {
      return `${trainingTime} minutes`;
    }
    
    return '45 minutes';
  };

  // Calculate BMI for exercise intensity guidance
  const calculateBMI = (height: number, weight: number) => {
    if (!height || !weight) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const bmi = calculateBMI(clientInfo.height, clientInfo.weight);
  const isOverweight = bmi && parseFloat(bmi) > 25;
  const isUnderweight = bmi && parseFloat(bmi) < 18.5;

  // Enhanced injury processing
  const processInjuries = (injuries: string): { adaptations: string; forbidden: string } => {
    if (!injuries || injuries.toLowerCase().includes('none')) {
      return { adaptations: 'None', forbidden: 'None' };
    }
    
    const injuryList = injuries.toLowerCase().split('\n').filter(i => i.trim());
    const adaptations: string[] = [];
    const forbidden: string[] = [];
    
    injuryList.forEach(injury => {
      if (injury.includes('knee')) {
        adaptations.push('Low-impact alternatives for knee exercises');
        forbidden.push('heavy squats, lunges, jumping, deep knee bends');
      }
      if (injury.includes('back') || injury.includes('spine')) {
        adaptations.push('Core-focused, avoid heavy deadlifts initially');
        forbidden.push('heavy deadlifts, overhead press, bent-over rows');
      }
      if (injury.includes('shoulder')) {
        adaptations.push('Focus on rotator cuff, avoid overhead movements');
        forbidden.push('overhead press, pull-ups, heavy bench press');
      }
      if (injury.includes('ankle')) {
        adaptations.push('Stability exercises, avoid high-impact cardio');
        forbidden.push('running, jumping, plyometrics');
      }
    });
    
    return {
      adaptations: adaptations.length > 0 ? adaptations.join('; ') : 'None',
      forbidden: forbidden.length > 0 ? forbidden.join(', ') : 'None'
    };
  };

  const injuryAnalysis = processInjuries(clientInfo.injuriesLimitations);

  // Goal-specific training parameters
  const getTrainingParams = (goal: string, experience: string) => {
    const params = {
      reps: '8-12',
      sets: '3-4',
      rest: '60-90s',
      intensity: 'moderate',
      focus: 'hypertrophy'
    };
    
    if (goal?.includes('strength')) {
      params.reps = '1-5';
      params.sets = '4-6';
      params.rest = '90-180s';
      params.intensity = 'high';
      params.focus = 'strength';
    } else if (goal?.includes('endurance') || goal?.includes('marathon')) {
      params.reps = '12-20';
      params.sets = '2-3';
      params.rest = '30-60s';
      params.intensity = 'low';
      params.focus = 'endurance';
    } else if (goal?.includes('weight_loss')) {
      params.reps = '10-15';
      params.sets = '3-4';
      params.rest = '45-90s';
      params.intensity = 'moderate';
      params.focus = 'metabolic';
    }
    
    if (experience?.includes('beginner')) {
      params.sets = Math.max(2, parseInt(params.sets.split('-')[0]) - 1) + '-' + Math.max(3, parseInt(params.sets.split('-')[1]) - 1);
      params.rest = '90-120s';
    }
    
    return params;
  };

  const trainingParams = getTrainingParams(clientInfo.primaryGoal, clientInfo.trainingExperience);

  // Enhanced prompt with token optimization
  const numDays = clientInfo.trainingDaysPerWeek || 3;
  const fitnessCoachPrompt = `Create a ${numDays}-day workout plan for:

CLIENT PROFILE:
Name: ${clientInfo.name || 'Unknown'}
Age: ${clientInfo.age || 'N/A'} years | Gender: ${clientInfo.sex || 'N/A'}
Height: ${clientInfo.height || 'N/A'}cm | Weight: ${clientInfo.weight || 'N/A'}kg${bmi ? ` | BMI: ${bmi}` : ''}
${isOverweight ? '⚠️ Overweight - focus on compound movements, longer rest' : ''}${isUnderweight ? '⚠️ Underweight - emphasize progressive overload' : ''}

GOALS & TIMELINE:
Primary: ${clientInfo.primaryGoal || 'General fitness'}
Specific: ${clientInfo.specificOutcome || 'Improve health'}
Timeline: ${clientInfo.goalTimeline || 'Not specified'}
Obstacles: ${clientInfo.obstacles || 'None'}

CRITICAL TRAINING CONSTRAINTS (MUST FOLLOW EXACTLY):
Training Frequency: ${clientInfo.trainingDaysPerWeek || '3'} days per week
Session Duration: ${formatTrainingTime(clientInfo.trainingTimePerSession)}
Schedule: ${formatWorkoutDays(clientInfo.workoutDays)}
Workout Time: ${clientInfo.workoutTime || 'Not specified'}

TRAINING PARAMETERS:
Experience: ${clientInfo.trainingExperience || 'Beginner'}
Focus: ${trainingParams.focus} | Intensity: ${trainingParams.intensity}
Reps: ${trainingParams.reps} | Sets: ${trainingParams.sets} | Rest: ${trainingParams.rest}

EQUIPMENT & LIMITATIONS:
Available: ${Array.isArray(clientInfo.availableEquipment) ? clientInfo.availableEquipment.join(', ') : clientInfo.availableEquipment || 'Bodyweight only'}
Focus Areas: ${Array.isArray(clientInfo.focusAreas) ? clientInfo.focusAreas.join(', ') : clientInfo.focusAreas || 'Full body'}
Injuries: ${injuryAnalysis.adaptations}
Avoid: ${injuryAnalysis.forbidden}

LIFESTYLE FACTORS:
Sleep: ${clientInfo.sleepHours || 'N/A'} hours | Stress: ${clientInfo.stress || 'N/A'}
Motivation: ${clientInfo.motivationStyle || 'N/A'}
Activity Level: ${clientInfo.activityLevel || 'General'}

CRITICAL REQUIREMENTS (PRIORITY 1):
1. Create EXACTLY ${clientInfo.trainingDaysPerWeek || '3'} training days with exercises
2. TOTAL duration of ALL exercises per session MUST equal ${formatTrainingTime(clientInfo.trainingTimePerSession)}
3. Calculate: sum of all exercise durations = ${formatTrainingTime(clientInfo.trainingTimePerSession)}
4. Use available equipment only
5. Respect injury limitations strictly

TRAINING GUIDELINES:
- Include compound movements first
- Balance push/pull, upper/lower body
- Include specific coach tips: tempo, RPE, form cues
- Ensure proper warm-up and cool-down within session time
- Each exercise should have realistic duration (5-20 minutes per exercise)

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text, comments, or additional information before or after the JSON object.

OUTPUT FORMAT - Valid JSON only:
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
          "duration": 15,
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
          "duration": 12,
          "weights": "barbell",
          "equipment": "Barbell",
          "coach_tip": "2-1-2 tempo, RPE 7-8, keep back straight",
          "rest": 90
        },
        {
          "exercise_name": "Overhead Press",
          "category": "Strength",
          "body_part": "Shoulders, Triceps",
          "sets": 3,
          "reps": 8,
          "duration": 10,
          "weights": "dumbbells",
          "equipment": "Dumbbells",
          "coach_tip": "2-1-2 tempo, RPE 7-8, core tight",
          "rest": 75
        }
      ]
    }
  ]
}`;
  
  console.log('📝 Enhanced fitness coach prompt prepared');
  console.log('📊 Prompt length:', fitnessCoachPrompt.length, 'characters');
  console.log('📊 Token estimate:', Math.ceil(fitnessCoachPrompt.length / 4), 'tokens');
  
  // ===== COMPLETE PROMPT LOGGING =====
  console.log('🔍 ===== EXACT PROMPT BEING SENT TO LLM =====');
  console.log('📋 PROMPT START:');
  console.log('='.repeat(80));
  console.log(fitnessCoachPrompt);
  console.log('='.repeat(80));
  console.log('📋 PROMPT END');
  console.log('🔍 ===== END OF PROMPT =====');
  
  console.log('🚀 Sending request to LLM service...');
  console.log('🎯 Using model:', model || 'default');
  
  try {
    // Try with the specified model first
    const aiResult = await askLLM(fitnessCoachPrompt, model || undefined);
    console.log('📊 LLM Response received');
    console.log('✅ AI Response extracted');
    
    // ===== COMPLETE LLM RESPONSE LOGGING =====
    console.log('🔍 ===== COMPLETE LLM RESPONSE =====');
    console.log('📋 RESPONSE START:');
    console.log('='.repeat(80));
    console.log('Response length:', aiResult.response?.length || 0, 'characters');
    console.log('Response model:', aiResult.model || 'unknown');
    console.log('Fallback used:', aiResult.fallbackModelUsed || false);
    console.log('📋 RESPONSE CONTENT:');
    console.log(aiResult.response || 'NO RESPONSE');
    console.log('='.repeat(80));
    console.log('📋 RESPONSE END');
    console.log('🔍 ===== END OF LLM RESPONSE =====');
    
    return {
      response: aiResult.response,
      model: aiResult.model || 'unknown',
      timestamp: new Date().toISOString(),
      fallbackModelUsed: aiResult.fallbackModelUsed,
    };
    
      } catch (error) {
      console.error('❌ Primary LLM request failed:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback: Try with a different model if available
      try {
        console.log('🔄 Attempting fallback with different model...');
        const fallbackModel = model?.includes('qwen') ? 'meta-llama/llama-3.1-8b-instruct:free' : 'qwen/qwen-32b:free';
        console.log('🔄 Using fallback model:', fallbackModel);
        
        const fallbackResult = await askLLM(fitnessCoachPrompt, fallbackModel);
        
        console.log('✅ Fallback LLM request successful');
        
        // ===== FALLBACK LLM RESPONSE LOGGING =====
        console.log('🔍 ===== FALLBACK LLM RESPONSE =====');
        console.log('📋 FALLBACK RESPONSE START:');
        console.log('='.repeat(80));
        console.log('Fallback response length:', fallbackResult.response?.length || 0, 'characters');
        console.log('Fallback response model:', fallbackResult.model || fallbackModel);
        console.log('Fallback used: true');
        console.log('📋 FALLBACK RESPONSE CONTENT:');
        console.log(fallbackResult.response || 'NO FALLBACK RESPONSE');
        console.log('='.repeat(80));
        console.log('📋 FALLBACK RESPONSE END');
        console.log('🔍 ===== END OF FALLBACK LLM RESPONSE =====');
        
        return {
          response: fallbackResult.response,
          model: fallbackResult.model || fallbackModel,
          timestamp: new Date().toISOString(),
          fallbackModelUsed: true,
        };
      
    } catch (fallbackError) {
      console.error('❌ Fallback LLM request also failed:', fallbackError);
      throw new Error(`All LLM providers failed. Primary error: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
    }
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
export async function generateAIWorkoutPlanForReview(clientId: number, model?: string, planStartDate?: Date) {
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
      console.log('🚀 ===== STARTING AI RESPONSE GENERATION =====');
      console.log('📋 Client Info Summary:');
      console.log('  - Name:', clientInfo.name);
      console.log('  - Age:', clientInfo.age);
      console.log('  - Primary Goal:', clientInfo.primaryGoal);
      console.log('  - Training Days:', clientInfo.trainingDaysPerWeek);
      console.log('  - Available Equipment:', clientInfo.availableEquipment);
      console.log('  - Injuries:', clientInfo.injuriesLimitations);
      console.log('🚀 ===== END CLIENT INFO SUMMARY =====');
      
      const aiResponse = await generateAIResponse(clientInfo, model);
      const endTime = Date.now();
      console.log('✅ AI Response generated successfully');
      console.log('⏱️ AI Generation took:', endTime - startTime, 'ms');
      
      // ===== COMPLETE AI RESPONSE VALIDATION =====
      console.log('🔍 ===== AI RESPONSE VALIDATION =====');
      console.log('📊 Response object type:', typeof aiResponse);
      console.log('📊 Response object keys:', Object.keys(aiResponse || {}));
      console.log('📊 Response.response type:', typeof aiResponse?.response);
      console.log('📊 Response.response length:', aiResponse?.response?.length || 0);
      console.log('📊 Response.response preview:', aiResponse?.response?.substring(0, 200) || 'NO RESPONSE');
      console.log('🔍 ===== END AI RESPONSE VALIDATION =====');
      
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
      console.log('📋 Raw AI Response being processed:');
      console.log('='.repeat(60));
      console.log(aiResponse.response);
      console.log('='.repeat(60));
      
      try {
        console.log('📅 About to process workout plan dates...');
        console.log('📅 Client workout days being passed:', clientInfo.workoutDays);
        console.log('📅 Plan start date being passed:', planStartDate || new Date());
        
        const processedWorkoutPlan = processWorkoutPlanDates(
          aiResponse.response, 
          clientId, 
          clientInfo.workoutDays, 
          planStartDate || new Date() // Use passed plan start date or current date
        );
        console.log('✅ Date processing completed');
        console.log('📊 Processed Workout Plan Keys:', Object.keys(processedWorkoutPlan || {}));
        console.log('📊 Workout Plan Array Length:', processedWorkoutPlan?.workout_plan?.length || 0);
        
        // ===== COMPLETE PROCESSED WORKOUT PLAN LOGGING =====
        console.log('🔍 ===== FINAL PROCESSED WORKOUT PLAN =====');
        console.log('📋 PROCESSED PLAN START:');
        console.log('='.repeat(80));
        console.log('📊 Complete processed workout plan:');
        console.log(JSON.stringify(processedWorkoutPlan, null, 2));
        console.log('='.repeat(80));
        console.log('📋 PROCESSED PLAN END');
        console.log('🔍 ===== END OF PROCESSED WORKOUT PLAN =====');
        
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