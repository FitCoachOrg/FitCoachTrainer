#!/usr/bin/env node

// Test script to show the exact LLM prompt for workout plan for client_id = 34
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

async function generateWorkoutPromptForClient34() {
  console.log('🧪 Generating Enhanced Workout LLM Prompt for Client ID = 34');
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
      training_experience: clientData.training_experience,
      training_days_per_week: clientData.training_days_per_week,
      training_time_per_session: clientData.training_time_per_session,
      available_equipment: clientData.available_equipment,
      focus_areas: clientData.focus_areas,
      injuries_limitations: clientData.injuries_limitations,
      sleep_hours: clientData.sleep_hours,
      stress: clientData.cl_stress,
      motivation_style: clientData.motivation_style,
      wake_time: clientData.wake_time,
      bed_time: clientData.bed_time,
      workout_time: clientData.workout_time,
      workout_days: clientData.workout_days
    });

    // 2. Organize client data as it would be in the actual prompt
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

    // 3. Enhanced client data processing (same as in the improved prompt)
    const formatWorkoutDays = (workoutDays) => {
      if (!workoutDays) return 'N/A';
      if (typeof workoutDays === 'string') return workoutDays;
      if (Array.isArray(workoutDays)) return workoutDays.join(', ');
      if (typeof workoutDays === 'object') {
        return Object.keys(workoutDays).filter(day => workoutDays[day]).join(', ');
      }
      return 'N/A';
    };

    // Calculate BMI for exercise intensity guidance
    const calculateBMI = (height, weight) => {
      if (!height || !weight) return null;
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    };

    const bmi = calculateBMI(clientInfo.height, clientInfo.weight);
    const isOverweight = bmi && parseFloat(bmi) > 25;
    const isUnderweight = bmi && parseFloat(bmi) < 18.5;

    // Enhanced injury processing
    const processInjuries = (injuries) => {
      if (!injuries || injuries.toLowerCase().includes('none')) return { adaptations: 'None', forbidden: 'None' };
      
      const injuryList = injuries.toLowerCase().split('\n').filter(i => i.trim());
      const adaptations = [];
      const forbidden = [];
      
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
    const getTrainingParams = (goal, experience) => {
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

    // 4. Construct the enhanced prompt that would be sent to LLM
    const numDays = 7;
    
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
Session Duration: ${clientInfo.trainingTimePerSession || '45'} minutes per session
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
1. Create EXACTLY ${clientInfo.trainingDaysPerWeek || '3'} training days with exercises (not 7 days)
2. TOTAL duration of ALL exercises per session MUST equal ${clientInfo.trainingTimePerSession || '45'} minutes
3. Calculate: sum of all exercise durations = ${clientInfo.trainingTimePerSession || '45'} minutes
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

    console.log('\n📤 ENHANCED WORKOUT LLM PROMPT FOR CLIENT ID = 34:');
    console.log('='.repeat(80));
    console.log(fitnessCoachPrompt);
    console.log('='.repeat(80));
    console.log('📝 END OF PROMPT');
    console.log('='.repeat(80));
    
    console.log('\n📊 Enhanced Prompt Statistics:');
    console.log(`- Total characters: ${fitnessCoachPrompt.length}`);
    console.log(`- Total words: ${fitnessCoachPrompt.split(' ').length}`);
    console.log(`- Estimated tokens: ${Math.ceil(fitnessCoachPrompt.length / 4)}`);
    
    console.log('\n🔍 Enhanced Features Analysis:');
    console.log(`- BMI calculated: ${bmi || 'N/A'}`);
    console.log(`- Weight status: ${isOverweight ? 'Overweight' : isUnderweight ? 'Underweight' : 'Normal'}`);
    console.log(`- Injury adaptations: ${injuryAnalysis.adaptations}`);
    console.log(`- Forbidden exercises: ${injuryAnalysis.forbidden}`);
    console.log(`- Training focus: ${trainingParams.focus}`);
    console.log(`- Recommended reps: ${trainingParams.reps}`);
    console.log(`- Recommended sets: ${trainingParams.sets}`);
    console.log(`- Rest periods: ${trainingParams.rest}`);
    console.log(`- Intensity level: ${trainingParams.intensity}`);
    
    console.log('\n✅ Enhanced workout prompt generated successfully!');
    console.log('💡 This prompt is optimized for token efficiency while including more personalized data.');

  } catch (error) {
    console.error('❌ Error generating enhanced workout prompt:', error);
  }
}

generateWorkoutPromptForClient34(); 