import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCategories() {
  console.log('🔍 === CHECKING EXERCISES_RAW CATEGORIES ===\n');

  try {
    // Get all unique category values
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('category, exercise_name')
      .limit(100);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (exercises.length === 0) {
      console.log('❌ No exercises found in table');
      return;
    }

    console.log(`📊 Found ${exercises.length} exercises`);
    
    // Get unique categories
    const categories = new Set(exercises.map(ex => ex.category).filter(Boolean));
    console.log('\n📋 UNIQUE CATEGORIES:');
    console.log('=====================');
    Array.from(categories).sort().forEach(category => {
      const count = exercises.filter(ex => ex.category === category).length;
      console.log(`• ${category}: ${count} exercises`);
    });

    // Show some examples for each category
    console.log('\n📝 EXAMPLES BY CATEGORY:');
    console.log('=========================');
    Array.from(categories).sort().forEach(category => {
      const examples = exercises.filter(ex => ex.category === category).slice(0, 3);
      console.log(`\n${category}:`);
      examples.forEach(ex => {
        console.log(`  - ${ex.exercise_name}`);
      });
    });

    // Check for null/undefined categories
    const nullCategories = exercises.filter(ex => !ex.category);
    if (nullCategories.length > 0) {
      console.log(`\n⚠️ Found ${nullCategories.length} exercises with null/undefined categories`);
      console.log('Examples:');
      nullCategories.slice(0, 3).forEach(ex => {
        console.log(`  - ${ex.exercise_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCategories().catch(console.error);
