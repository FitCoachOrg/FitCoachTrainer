import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Check the actual column names in exercises_raw table
async function checkExerciseColumns() {
  console.log('🔍 === CHECKING EXERCISES_RAW TABLE COLUMNS ===\n');

  try {
    // Fetch a few exercises to see the actual structure
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(3);

    if (error) {
      throw new Error(`Failed to fetch exercises: ${error.message}`);
    }

    console.log('📋 TABLE STRUCTURE:');
    console.log('===================');
    
    if (exercises.length > 0) {
      const firstExercise = exercises[0];
      console.log('Available columns:');
      Object.keys(firstExercise).forEach(column => {
        console.log(`• ${column}`);
      });

      console.log('\n📊 SAMPLE EXERCISE DATA:');
      console.log('=========================');
      console.log(JSON.stringify(firstExercise, null, 2));
    }

    // Now let's check for experience-related columns
    console.log('\n🔍 LOOKING FOR EXPERIENCE-RELATED COLUMNS:');
    console.log('============================================');
    
    const experienceColumns = [];
    if (exercises.length > 0) {
      const firstExercise = exercises[0];
      Object.keys(firstExercise).forEach(column => {
        if (column.toLowerCase().includes('experience') || 
            column.toLowerCase().includes('level') ||
            column.toLowerCase().includes('difficulty')) {
          experienceColumns.push(column);
        }
      });
    }

    if (experienceColumns.length > 0) {
      console.log('Found experience-related columns:');
      experienceColumns.forEach(col => {
        console.log(`• ${col}`);
      });
    } else {
      console.log('❌ No experience-related columns found');
    }

    // Let's also check what values are in some common columns
    console.log('\n📊 ANALYZING COMMON COLUMNS:');
    console.log('=============================');
    
    const commonColumns = ['Exercise', 'exercise_name', 'Category', 'category', 'Equipment', 'equipment'];
    const columnValues = {};

    commonColumns.forEach(col => {
      if (exercises[0] && exercises[0][col] !== undefined) {
        const values = new Set();
        exercises.forEach(ex => {
          if (ex[col]) values.add(ex[col]);
        });
        columnValues[col] = Array.from(values);
      }
    });

    Object.entries(columnValues).forEach(([col, values]) => {
      console.log(`\n${col} (${values.length} unique values):`);
      values.slice(0, 10).forEach(val => console.log(`  • ${val}`));
      if (values.length > 10) {
        console.log(`  ... and ${values.length - 10} more`);
      }
    });

    console.log('\n✅ Column analysis completed!');

  } catch (error) {
    console.error('❌ Error checking columns:', error);
  }
}

// Run the analysis
checkExerciseColumns().catch(console.error);
