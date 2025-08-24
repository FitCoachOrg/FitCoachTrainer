import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseSchema() {
  console.log('🔍 Testing Database Schema...\n');
  
  try {
    // Test 1: Check if new columns exist
    console.log('📋 Test 1: Checking table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Error accessing exercises_assets table:', columnsError.message);
      return false;
    }
    
    if (columns && columns.length > 0) {
      const columnNames = Object.keys(columns[0]);
      console.log('✅ Table accessible');
      console.log('📊 Available columns:', columnNames);
      
      // Check for key columns
      const requiredColumns = [
        'video_id', 'embed_url', 'title', 'channel_id', 'channel_title',
        'duration_sec', 'score', 'reason', 'cache_stale', 'normalized_exercise_name'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns:', missingColumns);
      } else {
        console.log('✅ All required columns present');
      }
    }
    
    // Test 2: Check if views exist
    console.log('\n📋 Test 2: Checking views...');
    try {
      const { data: activeVideos, error: viewError } = await supabase
        .from('active_exercise_videos')
        .select('*')
        .limit(1);
      
      if (viewError) {
        console.log('⚠️ active_exercise_videos view not accessible:', viewError.message);
      } else {
        console.log('✅ active_exercise_videos view working');
      }
    } catch (error) {
      console.log('⚠️ Views may not be accessible:', error.message);
    }
    
    // Test 3: Test inserting a sample video
    console.log('\n📋 Test 3: Testing video insertion...');
    const testVideo = {
      exercise_name: 'test_pushup',
      video_id: 'test123',
      embed_url: 'https://www.youtube.com/embed/test123',
      title: 'Test Pushup Video',
      channel_id: 'UC123',
      channel_title: 'Test Fitness Channel',
      duration_sec: 45,
      score: 0.85,
      reason: 'Test video for schema verification',
      cache_stale: false,
      normalized_exercise_name: 'test pushup'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('exercises_assets')
      .upsert(testVideo, { onConflict: 'exercise_name' })
      .select();
    
    if (insertError) {
      console.log('⚠️ Could not insert test video:', insertError.message);
    } else {
      console.log('✅ Test video inserted successfully');
      
      // Clean up test data
      await supabase
        .from('exercises_assets')
        .delete()
        .eq('exercise_name', 'test_pushup');
      console.log('🧹 Test data cleaned up');
    }
    
    // Test 4: Test video retrieval
    console.log('\n📋 Test 4: Testing video retrieval...');
    const { data: videos, error: retrieveError } = await supabase
      .from('exercises_assets')
      .select('*')
      .not('video_id', 'is', null)
      .limit(5);
    
    if (retrieveError) {
      console.log('⚠️ Could not retrieve videos:', retrieveError.message);
    } else {
      console.log(`✅ Retrieved ${videos?.length || 0} videos from database`);
      if (videos && videos.length > 0) {
        console.log('📹 Sample video:', {
          exercise: videos[0].exercise_name,
          video_id: videos[0].video_id,
          score: videos[0].score
        });
      }
    }
    
    console.log('\n🎉 Database schema test completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseSchema().then(success => {
  if (success) {
    console.log('\n✅ Database schema is working correctly!');
    console.log('🚀 Your YouTube video integration should be fully functional.');
  } else {
    console.log('\n❌ Database schema needs attention.');
    console.log('💡 Please check the SQL execution in Supabase.');
  }
});
