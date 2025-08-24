import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkExercisesData() {
  console.log('🔍 === CHECKING EXERCISES_RAW DATA ===\n');

  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('exercises_raw')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting count:', countError.message);
      return;
    }

    console.log(`📊 Total exercises in database: ${count}`);

    if (count === 0) {
      console.log('❌ No exercises found in database');
      return;
    }

    // Get sample data
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Error fetching exercises:', error.message);
      return;
    }

    console.log('\n📋 SAMPLE EXERCISES:');
    console.log('=====================');
    exercises.forEach((exercise, index) => {
      console.log(`\n${index + 1}. ${exercise.exercise_name}`);
      console.log(`   Category: ${exercise.category || 'null'}`);
      console.log(`   Primary Muscle: ${exercise.primary_muscle || 'null'}`);
      console.log(`   Target Muscle: ${exercise.target_muscle || 'null'}`);
      console.log(`   Equipment: ${exercise.equipment || 'null'}`);
      console.log(`   Experience Level: ${exercise.expereince_level || 'null'}`);
    });

    // Get unique categories
    const { data: categoryData, error: categoryError } = await supabase
      .from('exercises_raw')
      .select('category')
      .not('category', 'is', null);

    if (!categoryError && categoryData) {
      const categories = new Set(categoryData.map(ex => ex.category));
      console.log('\n📊 UNIQUE CATEGORIES:');
      console.log('=====================');
      Array.from(categories).sort().forEach(category => {
        const count = categoryData.filter(ex => ex.category === category).length;
        console.log(`• ${category}: ${count} exercises`);
      });
    }

    // Get unique primary muscles
    const { data: muscleData, error: muscleError } = await supabase
      .from('exercises_raw')
      .select('primary_muscle')
      .not('primary_muscle', 'is', null);

    if (!muscleError && muscleData) {
      const muscles = new Set(muscleData.map(ex => ex.primary_muscle));
      console.log('\n💪 UNIQUE PRIMARY MUSCLES:');
      console.log('===========================');
      Array.from(muscles).sort().forEach(muscle => {
        const count = muscleData.filter(ex => ex.primary_muscle === muscle).length;
        console.log(`• ${muscle}: ${count} exercises`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExercisesData().catch(console.error);
