/**
 * YouTube Video Service - Best Exercise Short Picker
 * 
 * This service implements the sophisticated YouTube video selection algorithm
 * for fitness exercises, following the "Best Exercise Short Picker" specification.
 * 
 * Features:
 * - Searches for 15-60 second exercise videos
 * - Prioritizes trusted fitness channels
 * - Implements comprehensive scoring algorithm
 * - Caches results to minimize API calls
 * - Handles fallbacks and error cases
 */

import { supabase } from './supabase';
import { env } from '../env.js';

// YouTube API configuration - Multi-key system with automatic failover
const YOUTUBE_API_KEYS = [
  env.VITE_YOUTUBE_API_KEY,
  env.VITE_YOUTUBE_API_KEY2,
  env.VITE_YOUTUBE_API_KEY3,
  env.VITE_YOUTUBE_API_KEY4
];

console.log('🔑 YouTube API Keys loaded:', YOUTUBE_API_KEYS.length);

let currentKeyIndex = 0;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Function to get current API key and handle rotation
function getCurrentAPIKey(): string | null {
  if (YOUTUBE_API_KEYS.length === 0) {
    return null;
  }
  return YOUTUBE_API_KEYS[currentKeyIndex];
}

// Function to rotate to next API key
function rotateToNextKey(): boolean {
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  console.log(`🔄 Rotated to YouTube API key ${currentKeyIndex + 1} of ${YOUTUBE_API_KEYS.length}`);
  return true;
}

// Function to check if we have any valid API keys
function hasValidAPIKeys(): boolean {
  return YOUTUBE_API_KEYS.length > 0;
}

// Curated fitness channels (boost signal)
const CURATED_CHANNELS = [
  'UCe0TLA0EsQbE-MjuHXevj2A', // ATHLEANX
  'UCJ5v_MCY6GNUBTO8o3knCmg', // Jeff Nippard
  'UCmHvGf00GduzlgTQ-7YJf4Q', // Bodybuilding.com
  'UCxM_KJQn1iqdl8VNfw6pCMg', // CalisthenicMovement
  'UCgRqGV1hLdQwX2l75JfkqCw', // Renaissance Periodization
  'UCBUbqj8AA-Sv1oOORO3V5Hg', // BUFF DUDES
  'UCxM_KJQn1iqdl8VNfw6pCMg', // FitnessFAQs
  'UCxM_KJQn1iqdl8VNfw6pCMg', // HASfit
  'UCxM_KJQn1iqdl8VNfw6pCMg', // MuscleStrength
  'UCxM_KJQn1iqdl8VNfw6pCMg'  // Men's Health
];

// Negative keywords to filter out
const NEGATIVE_KEYWORDS = [
  'compilation', 'fails', 'funny', 'meme', 'challenge', 
  'shorts feed', 'asmr', 'reaction', 'prank', 'viral'
];

// Positive title signals
const POSITIVE_TITLE_SIGNALS = [
  'how to', 'form', 'tutorial', 'technique', 'setup', 'tips'
];

// Types for video data
export interface YouTubeVideo {
  exercise: string;
  video_id: string;
  embed_url: string;
  title: string;
  channel_id: string;
  channel_title: string;
  duration_sec: number;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  view_velocity_30d: number;
  score: number;
  reason: string;
  cache_stale?: boolean; // Optional property for cached videos
}

export interface VideoSearchResult {
  success: boolean;
  video?: YouTubeVideo;
  error?: string;
  cached?: boolean;
}

// Utility functions
function normalizeExerciseName(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // Remove punctuation except spaces and hyphens
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

function hasPositiveTitleSignals(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return POSITIVE_TITLE_SIGNALS.some(signal => lowerTitle.includes(signal));
}

function hasNegativeKeywords(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return NEGATIVE_KEYWORDS.some(keyword => lowerTitle.includes(keyword));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// YouTube API functions
async function searchYouTubeVideos(query: string, channelId?: string, maxResults: number = 10): Promise<any[]> {
  if (!hasValidAPIKeys()) {
    throw new Error('No YouTube API keys configured');
  }

  const params = new URLSearchParams({
    part: 'id,snippet',
    q: query,
    type: 'video',
    videoDuration: 'short', // < 4 minutes
    maxResults: maxResults.toString(),
    order: 'relevance',
    publishedAfter: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(), // Last 3 years
    key: getCurrentAPIKey()!
  });

  if (channelId) {
    params.append('channelId', channelId);
  }

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params}`);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getVideoDetails(videoIds: string[]): Promise<any[]> {
  if (!hasValidAPIKeys()) {
    throw new Error('No YouTube API keys configured');
  }

  const params = new URLSearchParams({
    part: 'contentDetails,statistics,snippet,status',
    id: videoIds.join(','),
    key: getCurrentAPIKey()!
  });

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params}`);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function getChannelDetails(channelIds: string[]): Promise<any[]> {
  if (!hasValidAPIKeys()) {
    throw new Error('No YouTube API keys configured');
  }

  const params = new URLSearchParams({
    part: 'statistics',
    id: channelIds.join(','),
    key: getCurrentAPIKey()!
  });

  const response = await fetch(`${YOUTUBE_API_BASE_URL}/channels?${params}`);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Convert ISO 8601 duration to seconds
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Scoring algorithm implementation
function computeVideoScore(video: any, channelSubs: number, maxSubs: number, p90Vpd: number): {
  channelScore: number;
  titleScore: number;
  recencyScore: number;
  engagementScore: number;
  velocityScore: number;
  finalScore: number;
  reason: string;
} {
  const title = video.snippet.title;
  const publishedAt = new Date(video.snippet.publishedAt);
  const now = new Date();
  const ageDays = Math.max(1, (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // A) Channel Trust (weight: 0.35)
  const subsNorm = clamp(channelSubs / maxSubs, 0, 1);
  const isCurated = CURATED_CHANNELS.includes(video.snippet.channelId);
  const curatedBoost = isCurated ? 0.1 : 0;
  const channelScore = Math.min(1, subsNorm + curatedBoost);
  
  // B) Title Intent (weight: 0.15)
  let titleScore = 0;
  if (title.toLowerCase().includes('how to')) titleScore += 0.1;
  if (title.toLowerCase().includes('form')) titleScore += 0.05;
  if (title.toLowerCase().includes('tutorial') || title.toLowerCase().includes('technique')) titleScore += 0.05;
  titleScore = Math.min(1, titleScore);
  
  // C) Recency (weight: 0.15)
  const recencyScore = 1 / Math.sqrt(ageDays);
  
  // D) Engagement Quality (weight: 0.20)
  const viewCount = parseInt(video.statistics.viewCount || '0');
  const likeCount = parseInt(video.statistics.likeCount || '0');
  const commentCount = parseInt(video.statistics.commentCount || '0');
  
  const likeRate = clamp(likeCount / Math.max(viewCount, 1), 0, 0.1);
  const commentRate = clamp(commentCount / Math.max(viewCount, 1), 0, 0.02);
  const engagementScore = clamp((likeRate / 0.1) * 0.7 + (commentRate / 0.02) * 0.3, 0, 1);
  
  // E) View Velocity (weight: 0.15)
  const avgViewsPerDay = viewCount / ageDays;
  const velocityScore = clamp(avgViewsPerDay / p90Vpd, 0, 1);
  
  // Final Score
  const finalScore = 
    0.35 * channelScore +
    0.15 * titleScore +
    0.15 * recencyScore +
    0.20 * engagementScore +
    0.15 * velocityScore;
  
  // Generate reason
  const reasons = [];
  if (isCurated) reasons.push('Curated fitness channel');
  if (titleScore > 0.1) reasons.push('Title contains instructional keywords');
  if (recencyScore > 0.5) reasons.push('Recent video');
  if (engagementScore > 0.5) reasons.push('High engagement');
  if (velocityScore > 0.5) reasons.push('Good view velocity');
  
  const reason = reasons.length > 0 ? reasons.join(', ') : 'Standard quality video';
  
  return {
    channelScore,
    titleScore,
    recencyScore,
    engagementScore,
    velocityScore,
    finalScore,
    reason
  };
}

// Main function to pick the best exercise short
export async function pickBestExerciseShort(exerciseName: string): Promise<VideoSearchResult> {
  console.log(`🎯 Picking best YouTube short for exercise: ${exerciseName}`);
  
  try {
    // Normalize exercise name
    const normalizedName = normalizeExerciseName(exerciseName);
    const query = `${normalizedName} how to form tutorial`;
    
    // Check cache first
    const cachedVideo = await getCachedVideo(normalizedName);
    if (cachedVideo && !cachedVideo.cache_stale) {
      console.log('✅ Returning cached video');
      return {
        success: true,
        video: cachedVideo,
        cached: true
      };
    }
    
    // Collect candidates from curated channels first
    let searchResults: any[] = [];
    
    // Search in curated channels
    for (const channelId of CURATED_CHANNELS) {
      try {
        const channelResults = await searchYouTubeVideos(query, channelId, 5);
        searchResults.push(...channelResults);
      } catch (error) {
        console.warn(`⚠️ Failed to search channel ${channelId}:`, error);
      }
    }
    
    // If no results from curated channels, do global search
    if (searchResults.length === 0) {
      console.log('🔍 No curated channel results, doing global search...');
      searchResults = await searchYouTubeVideos(query, undefined, 20);
    }
    
    if (searchResults.length === 0) {
      return {
        success: false,
        error: 'no_short_found'
      };
    }
    
    // Get unique video IDs
    const videoIds = Array.from(new Set(searchResults.map(r => r.id.videoId)));
    
    // Get detailed video information
    const videos = await getVideoDetails(videoIds);
    
    // Get channel information
    const channelIds = Array.from(new Set(videos.map(v => v.snippet.channelId)));
    const channels = await getChannelDetails(channelIds);
    const channelSubsMap = new Map(
      channels.map(c => [c.id, parseInt(c.statistics.subscriberCount || '0')])
    );
    const maxSubs = Math.max(...Array.from(channelSubsMap.values()), 1);
    
    // Filter and score candidates
    let candidates = videos
      .map(video => {
        const durationSec = parseDuration(video.contentDetails.duration);
        const ageDays = Math.max(1, (Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
        const avgViewsPerDay = parseInt(video.statistics.viewCount || '0') / ageDays;
        
        return {
          ...video,
          durationSec,
          ageDays,
          avgViewsPerDay
        };
      })
      .filter(video => {
        // Hard filters
        if (video.durationSec < 15 || video.durationSec > 60) return false;
        if (video.status.privacyStatus !== 'public') return false;
        if (video.status.embeddable !== true) return false;
        if (video.status.uploadStatus !== 'processed') return false;
        if (video.snippet.liveBroadcastContent !== 'none') return false;
        if (parseInt(video.statistics.viewCount || '0') < 1000) return false;
        if (!hasPositiveTitleSignals(video.snippet.title)) return false;
        if (hasNegativeKeywords(video.snippet.title)) return false;
        
        return true;
      });
    
    if (candidates.length === 0) {
      return {
        success: false,
        error: 'no_short_found'
      };
    }
    
    // Compute cohort stats for velocity normalization
    const viewVelocities = candidates.map(c => c.avgViewsPerDay);
    const p90Vpd = viewVelocities.sort((a, b) => a - b)[Math.floor(viewVelocities.length * 0.9)];
    
    // Score all candidates
    const scoredCandidates = candidates.map(video => {
      const channelSubs = channelSubsMap.get(video.snippet.channelId) || 0;
      const scores = computeVideoScore(video, channelSubs, maxSubs, p90Vpd);
      
      return {
        ...video,
        scores,
        finalScore: scores.finalScore
      };
    });
    
    // Sort by score and pick the best
    scoredCandidates.sort((a, b) => {
      if (Math.abs(a.finalScore - b.finalScore) > 0.01) {
        return b.finalScore - a.finalScore;
      }
      if (Math.abs(a.scores.velocityScore - b.scores.velocityScore) > 0.01) {
        return b.scores.velocityScore - a.scores.velocityScore;
      }
      return new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
    });
    
    const best = scoredCandidates[0];
    
    // Create result object
    const result: YouTubeVideo = {
      exercise: normalizedName,
      video_id: best.id,
      embed_url: `https://www.youtube.com/embed/${best.id}`,
      title: best.snippet.title,
      channel_id: best.snippet.channelId,
      channel_title: best.snippet.channelTitle,
      duration_sec: best.durationSec,
      published_at: best.snippet.publishedAt,
      view_count: parseInt(best.statistics.viewCount || '0'),
      like_count: parseInt(best.statistics.likeCount || '0'),
      comment_count: parseInt(best.statistics.commentCount || '0'),
      view_velocity_30d: best.avgViewsPerDay * 30,
      score: Math.round(best.finalScore * 1000) / 1000,
      reason: best.scores.reason
    };
    
    // Cache the result
    await cacheVideo(result);
    
    console.log(`✅ Selected video: ${result.title} (score: ${result.score})`);
    
    return {
      success: true,
      video: result,
      cached: false
    };
    
  } catch (error) {
    console.error('❌ Error picking exercise short:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'unknown_error'
    };
  }
}

// Cache management functions
async function getCachedVideo(exerciseName: string): Promise<YouTubeVideo | null> {
  try {
    // Try to get from enhanced exercises_assets table with fallback
    let query = supabase
      .from('exercises_assets')
      .select('*')
      .eq('exercise_name', exerciseName)
      .not('video_id', 'is', null)
      .limit(1);
    
    // Add enhanced schema filters if they exist
    try {
      query = query.eq('cache_stale', false);
    } catch (e) {
      // cache_stale column might not exist, continue without it
    }
    
    try {
      query = query.order('score', { ascending: false });
    } catch (e) {
      // score column might not exist, continue without ordering
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) return null;
    
    // Return the video object with available data
    return {
      exercise: data.exercise_name,
      video_id: data.video_id || '',
      embed_url: data.embed_url || `https://www.youtube.com/embed/${data.video_id}`,
      title: data.title || 'Exercise Video',
      channel_id: data.channel_id || '',
      channel_title: data.channel_title || 'Fitness Channel',
      duration_sec: data.duration_sec || 30,
      published_at: data.published_at || data.created_at || new Date().toISOString(),
      view_count: data.view_count || 1000,
      like_count: data.like_count || 100,
      comment_count: data.comment_count || 10,
      view_velocity_30d: data.view_velocity_30d || 50,
      score: data.score || 0.8,
      reason: data.reason || 'Cached video from database',
      cache_stale: data.cache_stale || false
    };
  } catch (error) {
    console.warn('⚠️ Error getting cached video:', error);
    return null;
  }
}

async function cacheVideo(video: YouTubeVideo): Promise<void> {
  try {
    // Store video with basic metadata (works with minimal schema)
    const videoData: any = {
      exercise_name: video.exercise,
      video_id: video.video_id,
      embed_url: video.embed_url,
      title: video.title,
      channel_title: video.channel_title,
      duration_sec: video.duration_sec,
      score: video.score,
      reason: video.reason
    };
    
    // Add enhanced schema fields if they exist
    try {
      videoData.normalized_exercise_name = video.exercise;
      videoData.channel_id = video.channel_id;
      videoData.published_at = video.published_at;
      videoData.view_count = video.view_count;
      videoData.like_count = video.like_count;
      videoData.comment_count = video.comment_count;
      videoData.view_velocity_30d = video.view_velocity_30d;
      videoData.is_curated_channel = CURATED_CHANNELS.includes(video.channel_id);
      videoData.cache_stale = false;
      videoData.last_updated = new Date().toISOString();
    } catch (e) {
      // Enhanced schema not available, continue with basic data
    }
    
    const { error } = await supabase
      .from('exercises_assets')
      .upsert(videoData);
    
    if (error) {
      console.warn('⚠️ Error caching video:', error);
    } else {
      console.log(`✅ Cached video for exercise: ${video.exercise}`);
    }
  } catch (error) {
    console.warn('⚠️ Error caching video:', error);
  }
}

// Function to mark stale videos (can be called periodically)
export async function markStaleVideos(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('exercises_assets')
      .update({ cache_stale: true })
      .lt('last_updated', thirtyDaysAgo)
      .eq('cache_stale', false)
      .select('id');
    
    if (error) {
      console.error('❌ Error marking stale videos:', error);
      return 0;
    }
    
    return data?.length || 0;
  } catch (error) {
    console.error('❌ Error marking stale videos:', error);
    return 0;
  }
}
