import { createClient } from '@supabase/supabase-js';
import { env } from './client/src/env.ts';

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function getClient34Data() {
  console.log('🔍 Fetching client 34 data...');
  
  try {
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', 34)
      .single();
    
    if (clientError) {
      console.error('❌ Error fetching client data:', clientError);
      return null;
    }
    
    console.log('✅ Client 34 data fetched successfully');
    return clientData;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

function formatTrainingTime(timeCode) {
  if (!timeCode) return 'Not specified';
  
  const timeMap = {
    '15_30': '15-30 minutes',
    '30_45': '30-45 minutes',
    '45_60': '45-60 minutes',
    '60_90': '60-90 minutes'
  };
  
  return timeMap[timeCode] || timeCode;
}

function formatWorkoutDays(daysString) {
  if (!daysString) return 'Not specified';
  
  // Remove curly braces and split by comma
  const days = daysString.replace(/[{}]/g, '').split(',').map(day => day.trim());
  return days.join(', ');
}

function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
}

function analyzeInjuries(injuries) {
  if (!injuries) {
    return {
      adaptations: 'None',
      forbidden: 'None'
    };
  }
  
  const injuryList = injuries.split('\n').map(injury => injury.trim()).filter(injury => injury);
  
  if (injuryList.length === 0) {
    return {
      adaptations: 'None',
      forbidden: 'None'
    };
  }
  
  const adaptations = injuryList.map(injury => {
    switch (injury.toLowerCase()) {
      case 'knee injury':
        return 'Avoid deep squats, use knee-friendly alternatives';
      case 'back pain':
        return 'Avoid heavy deadlifts, focus on core stability';
      case 'arm injury':
        return 'Avoid heavy pressing movements, focus on rehabilitation';
      default:
        return `Modify exercises for ${injury}`;
    }
  }).join('; ');
  
  const forbidden = injuryList.map(injury => {
    switch (injury.toLowerCase()) {
      case 'knee injury':
        return 'Deep squats, lunges, jumping exercises';
      case 'back pain':
        return 'Heavy deadlifts, bent-over rows';
      case 'arm injury':
        return 'Heavy bench press, overhead presses';
      default:
        return injury;
    }
  }).join(', ');
  
  return { adaptations, forbidden };
}

function generateTrainingParams(experience) {
  const params = {
    focus: 'General fitness',
    intensity: 'Moderate',
    reps: '8-12',
    sets: '3',
    rest: '60-90 seconds'
  };
  
  if (experience === 'beginner') {
    params.focus = 'Form and technique';
    params.intensity = 'Light to moderate';
    params.reps = '10-15';
    params.sets = '2-3';
    params.rest = '90-120 seconds';
  } else if (experience === 'intermediate') {
    params.focus = 'Strength and muscle building';
    params.intensity = 'Moderate to heavy';
    params.reps = '6-12';
    params.sets = '3-4';
    params.rest = '60-90 seconds';
  } else if (experience === 'advanced') {
    params.focus = 'Maximum strength and power';
    params.intensity = 'Heavy';
    params.reps = '1-6';
    params.sets = '4-5';
    params.rest = '120-180 seconds';
  }
  
  return params;
}

async function generateCompletePrompt() {
  const clientData = await getClient34Data();
  
  if (!clientData) {
    console.log('❌ Could not fetch client data');
    return;
  }
  
  // Calculate BMI
  const bmi = calculateBMI(clientData.cl_weight, clientData.cl_height);
  const isOverweight = bmi && bmi > 25;
  const isUnderweight = bmi && bmi < 18.5;
  
  // Analyze injuries
  const injuryAnalysis = analyzeInjuries(clientData.injuries_limitations);
  
  // Generate training parameters
  const trainingParams = generateTrainingParams(clientData.training_experience);
  
  const numDays = clientData.training_days_per_week || 3;
  
  const completePrompt = `Create a ${numDays}-day workout plan for:

CLIENT PROFILE:
Name: ${clientData.cl_name || 'Unknown'}
Age: ${clientData.cl_age || 'N/A'} years | Gender: ${clientData.cl_sex || 'N/A'}
Height: ${clientData.cl_height || 'N/A'}cm | Weight: ${clientData.cl_weight || 'N/A'}kg${bmi ? ` | BMI: ${bmi}` : ''}
${isOverweight ? '⚠️ Overweight - focus on compound movements, longer rest' : ''}${isUnderweight ? '⚠️ Underweight - emphasize progressive overload' : ''}

GOALS & TIMELINE:
Primary: ${clientData.cl_primary_goal || 'General fitness'}
Specific: ${clientData.specific_outcome || 'Improve health'}
Timeline: ${clientData.goal_timeline || 'Not specified'}
Obstacles: ${clientData.obstacles || 'None'}

CRITICAL TRAINING CONSTRAINTS (MUST FOLLOW EXACTLY):
Training Frequency: ${clientData.training_days_per_week || '3'} days per week
Session Duration: ${formatTrainingTime(clientData.training_time_per_session)}
Schedule: ${formatWorkoutDays(clientData.workout_days)}
Workout Time: ${clientData.workout_time || 'Not specified'}

TRAINING PARAMETERS:
Experience: ${clientData.training_experience || 'Beginner'}
Focus: ${trainingParams.focus} | Intensity: ${trainingParams.intensity}
Reps: ${trainingParams.reps} | Sets: ${trainingParams.sets} | Rest: ${trainingParams.rest}

EQUIPMENT & LIMITATIONS:
Available: ${Array.isArray(clientData.available_equipment) ? clientData.available_equipment.join(', ') : clientData.available_equipment || 'Bodyweight only'}
Focus Areas: ${Array.isArray(clientData.focus_areas) ? clientData.focus_areas.join(', ') : clientData.focus_areas || 'Full body'}
Injuries: ${injuryAnalysis.adaptations}
Avoid: ${injuryAnalysis.forbidden}

LIFESTYLE FACTORS:
Sleep: ${clientData.sleep_hours || 'N/A'} hours | Stress: ${clientData.cl_stress || 'N/A'}
Motivation: ${clientData.motivation_style || 'N/A'}
Activity Level: ${clientData.cl_activity_level || 'General'}

CRITICAL REQUIREMENTS (PRIORITY 1):
1. Create EXACTLY ${clientData.training_days_per_week || '3'} training days with exercises
2. TOTAL duration of ALL exercises per session MUST equal ${formatTrainingTime(clientData.training_time_per_session)}
3. Calculate: sum of all exercise durations = ${formatTrainingTime(clientData.training_time_per_session)}
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

  console.log('\n🎯 COMPLETE PROMPT FOR CLIENT 34 (Vikas Malik):');
  console.log('=' .repeat(100));
  console.log(completePrompt);
  console.log('=' .repeat(100));
  
  // Also save to a file for easy copying
  const fs = require('fs');
  fs.writeFileSync('client-34-prompt.txt', completePrompt);
  console.log('\n💾 Prompt saved to client-34-prompt.txt');
  
  return completePrompt;
}

generateCompletePrompt().catch(console.error);
