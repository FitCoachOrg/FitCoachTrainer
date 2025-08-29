import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import csv from 'csv-parser';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importExercises() {
  console.log('📥 Starting exercise import...');
  
  const exercises = [];
  
  // Read the CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream('./attached_assets/800Exercise_DB_with_youtube.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Transform the data to match the exercises_raw table structure
        const exercise = {
          exercise_name: row.exercise_name,
          video_link: row.youtube_search_url || null,
          video_explanation: row.instructions ? row.instructions.replace(/\[|\]/g, '').split(',').join('\n') : null,
          expereince_level: row.level || 'beginner',
          target_muscle: row.primaryMuscles ? row.primaryMuscles.replace(/\[|\]/g, '').split(',').join(', ') : null,
          primary_muscle: row.primaryMuscles ? row.primaryMuscles.replace(/\[|\]/g, '').split(',')[0] : null,
          equipment: row.equipment || 'body only',
          category: row.category || 'strength'
        };
        
        exercises.push(exercise);
      })
      .on('end', async () => {
        console.log(`📋 Read ${exercises.length} exercises from CSV`);
        
        try {
          // Clear existing data
          console.log('🗑️ Clearing existing exercises...');
          const { error: deleteError } = await supabase
            .from('exercises_raw')
            .delete()
            .neq('id', 0); // Delete all rows
          
          if (deleteError) {
            console.error('❌ Error clearing table:', deleteError);
            reject(deleteError);
            return;
          }
          
          console.log('✅ Table cleared');
          
          // Insert new data in batches
          const batchSize = 100;
          let inserted = 0;
          
          for (let i = 0; i < exercises.length; i += batchSize) {
            const batch = exercises.slice(i, i + batchSize);
            
            const { data, error } = await supabase
              .from('exercises_raw')
              .insert(batch);
            
            if (error) {
              console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
              reject(error);
              return;
            }
            
            inserted += batch.length;
            console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} exercises (${inserted}/${exercises.length})`);
          }
          
          console.log(`🎉 Successfully imported ${inserted} exercises!`);
          resolve(inserted);
          
        } catch (error) {
          console.error('❌ Import failed:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

// Run the import
importExercises()
  .then((count) => {
    console.log(`\n🏁 Import completed successfully!`);
    console.log(`📊 Total exercises imported: ${count}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
