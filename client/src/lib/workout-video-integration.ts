/**
 * Workout Video Integration Service
 * 
 * This service integrates YouTube video fetching with the workout plan generation flow.
 * It automatically fetches and assigns videos to exercises when workout plans are generated.
 * 
 * Workflow:
 * 1. AI generates workout plan with exercise names
 * 2. For each exercise, check if video exists in cache
 * 3. If not found, use YouTube API to find best video
 * 4. Update exercise with video link
 * 5. Cache the video for future use
 */

import { pickBestExerciseShort, YouTubeVideo } from './youtube-video-service';
import { supabase } from './supabase';

export interface ExerciseWithVideo {
  exercise: string;
  category?: string;
  body_part?: string;
  sets?: string;
  reps?: string;
  duration?: string;
  weight?: string;
  equipment?: string;
  coach_tip?: string;
  rest?: string;
  video_link?: string;
  video_metadata?: {
    video_id: string;
    embed_url: string;
    title: string;
    channel_title: string;
    duration_sec: number;
    score: number;
    reason: string;
  };
}

export interface WorkoutPlanWithVideos {
  success: boolean;
  exercises: ExerciseWithVideo[];
  message?: string;
  videos_found: number;
  videos_cached: number;
  videos_fetched: number;
}

/**
 * Enhance a single exercise with video
 */
export async function enhanceExerciseWithVideo(exercise: any): Promise<ExerciseWithVideo> {
  const exerciseName = exercise.exercise || exercise.exercise_name || exercise.name || exercise.workout || '';
  
  if (!exerciseName) {
    console.warn('⚠️ Exercise name is empty, skipping video enhancement');
    return exercise;
  }
  
  try {
    console.log(`🎯 Enhancing exercise with video: ${exerciseName}`);
    
    // Check if exercise already has a video link
    if (exercise.video_link && exercise.video_link.trim() !== '') {
      console.log(`✅ Exercise already has video link: ${exercise.video_link}`);
      return exercise;
    }
    
    // Fetch video from YouTube API
    const videoResult = await pickBestExerciseShort(exerciseName);
    
    if (videoResult.success && videoResult.video) {
      const video = videoResult.video;
      
      return {
        ...exercise,
        video_link: video.embed_url,
        video_metadata: {
          video_id: video.video_id,
          embed_url: video.embed_url,
          title: video.title,
          channel_title: video.channel_title,
          duration_sec: video.duration_sec,
          score: video.score,
          reason: video.reason
        }
      };
    } else {
      console.warn(`⚠️ No video found for exercise: ${exerciseName}`);
      return exercise;
    }
    
  } catch (error) {
    console.error(`❌ Error enhancing exercise ${exerciseName} with video:`, error);
    return exercise;
  }
}

/**
 * Enhance a workout plan with videos for all exercises
 */
export async function enhanceWorkoutPlanWithVideos(workoutPlan: any[]): Promise<WorkoutPlanWithVideos> {
  console.log(`🎯 Enhancing workout plan with videos for ${workoutPlan.length} exercises`);
  
  const enhancedExercises: ExerciseWithVideo[] = [];
  let videosFound = 0;
  let videosCached = 0;
  let videosFetched = 0;
  
  try {
    // Process exercises sequentially to avoid API rate limits
    for (let i = 0; i < workoutPlan.length; i++) {
      const exercise = workoutPlan[i];
      console.log(`\n🔄 Processing exercise ${i + 1}/${workoutPlan.length}: ${exercise.exercise || exercise.exercise_name || exercise.name || 'Unknown'}`);
      
      const enhancedExercise = await enhanceExerciseWithVideo(exercise);
      enhancedExercises.push(enhancedExercise);
      
      // Count video statistics
      if (enhancedExercise.video_link && enhancedExercise.video_link !== exercise.video_link) {
        videosFound++;
        if (enhancedExercise.video_metadata) {
          videosFetched++;
        } else {
          videosCached++;
        }
      }
      
      // Add small delay to avoid overwhelming the API
      if (i < workoutPlan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ Workout plan enhancement completed!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total exercises: ${workoutPlan.length}`);
    console.log(`   - Videos found: ${videosFound}`);
    console.log(`   - Videos cached: ${videosCached}`);
    console.log(`   - Videos fetched: ${videosFetched}`);
    
    return {
      success: true,
      exercises: enhancedExercises,
      videos_found: videosFound,
      videos_cached: videosCached,
      videos_fetched: videosFetched
    };
    
  } catch (error) {
    console.error('❌ Error enhancing workout plan with videos:', error);
    return {
      success: false,
      exercises: workoutPlan,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      videos_found: 0,
      videos_cached: 0,
      videos_fetched: 0
    };
  }
}

/**
 * Enhance exercises within a weekly workout plan structure
 */
export async function enhanceWeeklyWorkoutPlanWithVideos(weeklyPlan: any[]): Promise<WorkoutPlanWithVideos> {
  console.log(`🎯 Enhancing weekly workout plan with videos`);
  
  const allExercises: any[] = [];
  
  // Flatten the weekly plan to get all exercises
  weeklyPlan.forEach((day, dayIndex) => {
    if (day.exercises && Array.isArray(day.exercises)) {
      day.exercises.forEach((exercise: any, exerciseIndex: number) => {
        allExercises.push({
          ...exercise,
          day_index: dayIndex,
          exercise_index: exerciseIndex
        });
      });
    }
  });
  
  console.log(`📋 Found ${allExercises.length} exercises across ${weeklyPlan.length} days`);
  
  // Enhance all exercises with videos
  const enhancedResult = await enhanceWorkoutPlanWithVideos(allExercises);
  
  if (enhancedResult.success) {
    // Reconstruct the weekly plan structure with enhanced exercises
    const enhancedWeeklyPlan = weeklyPlan.map((day, dayIndex) => {
      if (day.exercises && Array.isArray(day.exercises)) {
        const dayExercises = enhancedResult.exercises.filter(
          ex => ex.day_index === dayIndex
        ).map(ex => {
          const { day_index, exercise_index, ...exercise } = ex;
          return exercise;
        });
        
        return {
          ...day,
          exercises: dayExercises
        };
      }
      return day;
    });
    
    return {
      ...enhancedResult,
      exercises: enhancedWeeklyPlan
    };
  }
  
  return enhancedResult;
}

/**
 * Update existing workout plan in database with video links
 */
export async function updateWorkoutPlanWithVideos(workoutPlanId: string, exercises: ExerciseWithVideo[]): Promise<boolean> {
  try {
    console.log(`🔄 Updating workout plan ${workoutPlanId} with video links`);
    
    // Update each exercise with video information
    for (const exercise of exercises) {
      if (exercise.video_link && exercise.video_metadata) {
        // Update the exercise record in the database
        const { error } = await supabase
          .from('workout_plan') // Adjust table name as needed
          .update({
            workout_yt_link: exercise.video_link,
            video_metadata: exercise.video_metadata
          })
          .eq('workout_id', workoutPlanId)
          .eq('workout', exercise.exercise);
        
        if (error) {
          console.warn(`⚠️ Error updating exercise ${exercise.exercise}:`, error);
        }
      }
    }
    
    console.log(`✅ Workout plan ${workoutPlanId} updated with video links`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error updating workout plan ${workoutPlanId}:`, error);
    return false;
  }
}

/**
 * Batch process multiple workout plans for video enhancement
 */
export async function batchEnhanceWorkoutPlans(workoutPlans: any[]): Promise<{
  success: boolean;
  results: WorkoutPlanWithVideos[];
  summary: {
    total_plans: number;
    total_exercises: number;
    total_videos_found: number;
    total_videos_cached: number;
    total_videos_fetched: number;
  };
}> {
  console.log(`🎯 Batch enhancing ${workoutPlans.length} workout plans`);
  
  const results: WorkoutPlanWithVideos[] = [];
  let totalExercises = 0;
  let totalVideosFound = 0;
  let totalVideosCached = 0;
  let totalVideosFetched = 0;
  
  try {
    for (let i = 0; i < workoutPlans.length; i++) {
      const plan = workoutPlans[i];
      console.log(`\n🔄 Processing plan ${i + 1}/${workoutPlans.length}`);
      
      const result = await enhanceWorkoutPlanWithVideos(plan);
      results.push(result);
      
      totalExercises += result.exercises.length;
      totalVideosFound += result.videos_found;
      totalVideosCached += result.videos_cached;
      totalVideosFetched += result.videos_fetched;
      
      // Add delay between plans to avoid API rate limits
      if (i < workoutPlans.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const summary = {
      total_plans: workoutPlans.length,
      total_exercises: totalExercises,
      total_videos_found: totalVideosFound,
      total_videos_cached: totalVideosCached,
      total_videos_fetched: totalVideosFetched
    };
    
    console.log(`\n✅ Batch enhancement completed!`);
    console.log(`📊 Summary:`, summary);
    
    return {
      success: true,
      results,
      summary
    };
    
  } catch (error) {
    console.error('❌ Error in batch enhancement:', error);
    return {
      success: false,
      results,
      summary: {
        total_plans: workoutPlans.length,
        total_exercises: totalExercises,
        total_videos_found: totalVideosFound,
        total_videos_cached: totalVideosCached,
        total_videos_fetched: totalVideosFetched
      }
    };
  }
}

/**
 * Get video statistics for monitoring
 */
export async function getVideoStatistics(): Promise<{
  total_cached_videos: number;
  stale_videos: number;
  average_score: number;
  top_channels: Array<{ channel_title: string; video_count: number }>;
}> {
  try {
    // Get total cached videos
    const { count: totalCached } = await supabase
      .from('exercises_assets')
      .select('*', { count: 'exact', head: true })
      .not('video_id', 'is', null);
    
    // Get stale videos
    const { count: staleVideos } = await supabase
      .from('exercises_assets')
      .select('*', { count: 'exact', head: true })
      .eq('cache_stale', true);
    
    // Get average score
    const { data: scoreData } = await supabase
      .from('exercises_assets')
      .select('score')
      .not('score', 'is', null);
    
    const averageScore = scoreData && scoreData.length > 0
      ? scoreData.reduce((sum, item) => sum + (item.score || 0), 0) / scoreData.length
      : 0;
    
    // Get top channels
    const { data: channelData } = await supabase
      .from('exercises_assets')
      .select('channel_title')
      .not('channel_title', 'is', null);
    
    const channelCounts = channelData?.reduce((acc, item) => {
      const title = item.channel_title || 'Unknown';
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    const topChannels = Object.entries(channelCounts)
      .map(([title, count]) => ({ channel_title: title, video_count: count }))
      .sort((a, b) => b.video_count - a.video_count)
      .slice(0, 10);
    
    return {
      total_cached_videos: totalCached || 0,
      stale_videos: staleVideos || 0,
      average_score: Math.round(averageScore * 1000) / 1000,
      top_channels: topChannels
    };
    
  } catch (error) {
    console.error('❌ Error getting video statistics:', error);
    return {
      total_cached_videos: 0,
      stale_videos: 0,
      average_score: 0,
      top_channels: []
    };
  }
}
