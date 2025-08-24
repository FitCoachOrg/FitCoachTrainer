import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Check the table structure
async function checkTableStructure() {
  console.log('🔍 === CHECKING EXERCISES_RAW TABLE STRUCTURE ===\n');

  try {
    // Fetch one exercise to see the structure
    const { data: exercises, error } = await supabase
      .from('exercises_raw')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (exercises.length === 0) {
      console.log('❌ No exercises found in table');
      return;
    }

    const exercise = exercises[0];
    
    console.log('📋 AVAILABLE COLUMNS:');
    console.log('=====================');
    Object.keys(exercise).forEach(column => {
      console.log(`• ${column}`);
    });

    console.log('\n📊 SAMPLE EXERCISE DATA:');
    console.log('=========================');
    console.log(JSON.stringify(exercise, null, 2));

    // Check for experience-related fields
    console.log('\n🔍 EXPERIENCE-RELATED FIELDS:');
    console.log('==============================');
    
    const experienceFields = Object.keys(exercise).filter(key => 
      key.toLowerCase().includes('experience') || 
      key.toLowerCase().includes('level') || 
      key.toLowerCase().includes('difficulty') ||
      key.toLowerCase().includes('skill')
    );

    if (experienceFields.length > 0) {
      experienceFields.forEach(field => {
        console.log(`• ${field}: "${exercise[field]}"`);
      });
    } else {
      console.log('❌ No experience-related fields found');
    }

    console.log('\n✅ Table structure analysis completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the analysis
checkTableStructure().catch(console.error);
