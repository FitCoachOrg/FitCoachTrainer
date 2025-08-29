#!/usr/bin/env node

// Test script to validate JSON parsing fixes
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

// Simulate the JSON parsing function with fixes
function processWorkoutPlanDates(aiResponseText) {
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
      console.log('🔍 Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
      
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
      
      // Debug: Show what the text looks like after fixes
      console.log('🔍 Fixed text preview:', fixedText.substring(0, 300));
      
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
          const parts = value.split(',').map(part => part.trim());
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
          const parts = value.split(',').map(part => part.trim());
          return `"${key}": "${parts.join(', ')}"`;
        }
        return `"${key}": "${value}"`;
      });
      
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
        throw parseError; // Throw original error
      }
    }
    
    if (parsed.days && Array.isArray(parsed.days)) {
      console.log('✅ Successfully parsed workout plan with', parsed.days.length, 'days');
      return {
        days: parsed.days,
        workout_plan: parsed.days.flatMap((day, i) => (day.exercises || []).map((ex) => ({ ...ex, dayIndex: i })))
      };
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    throw e;
  }
}

async function testJsonParsingFixes() {
  console.log('🧪 Testing JSON Parsing Fixes');
  console.log('='.repeat(60));

  // Test with the problematic JSON from the error logs
  const problematicJson = `{
  "days": [
    {
      "focus": "Upper Body Endurance",
      "exercises": [
        {
          "exercise_name": "Incline Push-Up (on knees or hands on elevated surface)",
          "category": "Strength",
          "body_part": "Chest, Shoulders, Triceps",
          "sets": 2,
          "reps": 12,
          "duration": 6,
          "weights": "bodyweight",
          "equipment": "yoga_mat",
          "coach_tip": "3-1-3 tempo, RPE 5-6, keep core engaged, modify on knees if needed",
          "rest": 90
        },
        {
          "exercise_name": "Child's Pose to Cat-Cow Stretch",
          "category": "Flexibility",
          "body_part": "Back, Hips",
          "sets": 1,
          "reps": 1,
          "duration": 5,
          "weights": "bodyweight",
          "equipment": "yoga_mat",
          "coach_tip": "Flow gently, 5 minutes total, RPE 2, focus on breath and release",
          "rest": 0
        }
      ]
    }
  ]
}`;

  console.log('📝 Testing with problematic JSON:');
  console.log(problematicJson.substring(0, 300) + '...');

  try {
    const result = processWorkoutPlanDates(problematicJson);
    console.log('✅ JSON parsing successful!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
  }

  // Test with a more problematic JSON that has unquoted values
  const problematicJson2 = `{
  "days": [
    {
      "focus": Upper Body Endurance,
      "exercises": [
        {
          "exercise_name": Incline Push-Up,
          "category": Strength,
          "body_part": Chest, Shoulders, Triceps,
          "sets": 2,
          "reps": 12,
          "duration": 6,
          "weights": bodyweight,
          "equipment": yoga_mat,
          "coach_tip": 3-1-3 tempo, RPE 5-6, keep core engaged,
          "rest": 90
        }
      ]
    }
  ]
}`;

  console.log('\n📝 Testing with JSON containing unquoted values:');
  console.log(problematicJson2.substring(0, 300) + '...');

  try {
    const result2 = processWorkoutPlanDates(problematicJson2);
    console.log('✅ JSON parsing successful with fixes!');
    console.log('📊 Result:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('❌ JSON parsing failed:', error.message);
  }

  console.log('\n✅ JSON parsing fixes test completed!');
}

testJsonParsingFixes(); 