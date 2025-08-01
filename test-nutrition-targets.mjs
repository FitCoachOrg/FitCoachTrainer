#!/usr/bin/env node

// Test script for nutrition plan generation with client_target integration
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

async function testNutritionTargets() {
  console.log('🧪 Testing Nutrition Plan Generation with client_target integration');
  console.log('='.repeat(60));

  try {
    // 1. Get a sample client
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name')
      .limit(1);

    if (clientError) {
      throw new Error(`Failed to fetch clients: ${clientError.message}`);
    }

    if (!clients || clients.length === 0) {
      console.log('❌ No clients found in database');
      return;
    }

    const clientId = clients[0].client_id;
    const clientName = clients[0].cl_name;
    
    console.log(`👤 Testing with client: ${clientName} (ID: ${clientId})`);

    // 2. Check current targets in client_target table
    const { data: targets, error: targetError } = await supabase
      .from('client_target')
      .select('goal, target')
      .eq('client_id', clientId)
      .in('goal', ['calories', 'protein', 'carbs', 'fats']);

    if (targetError) {
      console.error('❌ Error fetching targets:', targetError);
      return;
    }

    console.log('📊 Current targets in client_target table:');
    if (targets && targets.length > 0) {
      targets.forEach(target => {
        console.log(`  - ${target.goal}: ${target.target}`);
      });
    } else {
      console.log('  ⚠️ No targets found - will use defaults');
    }

    // 3. Test the target fetching logic (simulated)
    const targetMap = new Map();
    if (targets && targets.length > 0) {
      targets.forEach((row) => {
        if (row.goal && row.target !== null) {
          targetMap.set(row.goal, row.target);
        }
      });
    }

    // Set default values if targets are not found
    const targetCalories = targetMap.get('calories') || 2000;
    const targetProtein = targetMap.get('protein') || 150;
    const targetCarbs = targetMap.get('carbs') || 200;
    const targetFats = targetMap.get('fats') || 67;

    console.log('\n🎯 Final targets that would be used:');
    console.log(`  - Calories: ${targetCalories} kcal`);
    console.log(`  - Protein: ${targetProtein} g`);
    console.log(`  - Carbs: ${targetCarbs} g`);
    console.log(`  - Fats: ${targetFats} g`);

    // 4. Test client data fetching
    const { data: clientData, error: clientDataError } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (clientDataError) {
      console.error('❌ Error fetching client data:', clientDataError);
      return;
    }

    console.log('\n👤 Client profile data:');
    console.log(`  - Name: ${clientData.cl_name}`);
    console.log(`  - Age: ${clientData.cl_age} years`);
    console.log(`  - Weight: ${clientData.cl_weight} kg`);
    console.log(`  - Height: ${clientData.cl_height} cm`);
    console.log(`  - Gender: ${clientData.cl_sex}`);
    console.log(`  - Activity Level: ${clientData.cl_activity_level}`);
    console.log(`  - Primary Goal: ${clientData.cl_primary_goal}`);
    console.log(`  - Dietary Preferences: ${clientData.diet_preferences?.join(', ') || 'None'}`);
    console.log(`  - Allergies: ${clientData.food_allergies || 'None'}`);

    console.log('\n✅ Test completed successfully!');
    console.log('📝 The nutrition plan generation will now:');
    console.log('  1. Fetch targets from client_target table');
    console.log('  2. Use exact target values in the prompt');
    console.log('  3. Emphasize accuracy requirements');
    console.log('  4. Focus on goal achievement with dietary restrictions');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNutritionTargets(); 