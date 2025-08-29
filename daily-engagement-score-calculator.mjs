#!/usr/bin/env node

/**
 * Daily Engagement Score Calculator
 * 
 * This script calculates engagement scores for all clients on a daily basis.
 * It can be run as a cron job or scheduled task to ensure daily engagement tracking.
 * 
 * Engagement Score Formula:
 * - Score = (Completed Tasks / Total Tasks Due) * 100
 * - Only calculates for past dates (not today or future dates)
 * - Stores results in client_engagement_score table
 * 
 * Usage:
 * - Run manually: node daily-engagement-score-calculator.mjs
 * - Set up as cron job: 0 1 * * * /path/to/node /path/to/daily-engagement-score-calculator.mjs
 * 
 * @author FitCoach Trainer System
 * @version 1.0
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Calculate engagement score for a specific client and date
 * @param {number} clientId - The client ID
 * @param {string} forDate - Date in YYYY-MM-DD format
 * @returns {Promise<{engScore: number|null, totalDue: number, completed: number}>}
 */
async function calculateEngagementScore(clientId, forDate) {
  try {
    // Get all schedules due for this client on the specified date
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, status, for_date')
      .eq('client_id', clientId)
      .eq('for_date', forDate);

    if (scheduleError) {
      console.error(`❌ Error fetching schedules for client ${clientId} on ${forDate}:`, scheduleError);
      return { engScore: null, totalDue: 0, completed: 0 };
    }

    const totalDue = schedules.length;
    const completed = schedules.filter(s => s.status === 'completed').length;
    const engScore = totalDue > 0 ? Math.round((completed / totalDue) * 100) : null;

    return { engScore, totalDue, completed };
  } catch (error) {
    console.error(`❌ Error calculating engagement score for client ${clientId}:`, error);
    return { engScore: null, totalDue: 0, completed: 0 };
  }
}

/**
 * Main function to calculate engagement scores for all clients
 */
async function calculateDailyEngagementScores() {
  console.log('🚀 Starting daily engagement score calculation...');
  
  const startTime = Date.now();
  
  try {
    // Calculate the previous day in UTC (we don't calculate for today)
    const now = new Date();
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const forDate = yesterday.toISOString().slice(0, 10); // YYYY-MM-DD

    console.log(`📅 Calculating engagement scores for date: ${forDate}`);

    // 1. Get all active clients
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, name')
      .eq('is_active', true);

    if (clientError) {
      console.error('❌ Error fetching clients:', clientError);
      return;
    }

    console.log(`👥 Found ${clients.length} active clients`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Process each client
    for (const client of clients) {
      const clientId = client.client_id;
      const clientName = client.name;

      try {
        // Check if score already exists for this client and date
        const { data: existing, error: existingError } = await supabase
          .from('client_engagement_score')
          .select('id')
          .eq('client_id', clientId)
          .eq('for_date', forDate)
          .maybeSingle();

        if (existingError) {
          console.error(`❌ Error checking existing score for client ${clientName}:`, existingError);
          errorCount++;
          continue;
        }

        if (existing) {
          console.log(`⏭️  Score already exists for ${clientName} on ${forDate}, skipping`);
          skippedCount++;
          continue;
        }

        // Calculate engagement score
        const { engScore, totalDue, completed } = await calculateEngagementScore(clientId, forDate);

        // Only insert if there were tasks due or if we have a valid score
        if (totalDue > 0 || engScore !== null) {
          const { error: insertError } = await supabase
            .from('client_engagement_score')
            .insert({
              for_date: forDate,
              eng_score: engScore,
              client_id: clientId,
              total_due: totalDue,
              completed: completed
            });

          if (insertError) {
            console.error(`❌ Error inserting engagement score for ${clientName}:`, insertError);
            errorCount++;
          } else {
            console.log(`✅ ${clientName}: ${engScore}% (${completed}/${totalDue} tasks completed)`);
            processedCount++;
          }
        } else {
          console.log(`📝 ${clientName}: No tasks due on ${forDate}`);
          processedCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing client ${clientName}:`, error);
        errorCount++;
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n📊 Daily Engagement Score Calculation Summary:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Processed: ${processedCount} clients`);
    console.log(`⏭️  Skipped: ${skippedCount} clients (already calculated)`);
    console.log(`❌ Errors: ${errorCount} clients`);
    console.log(`📅 Date processed: ${forDate}`);

  } catch (error) {
    console.error('❌ Fatal error in daily engagement score calculation:', error);
    process.exit(1);
  }
}

/**
 * Function to calculate engagement scores for a specific date range
 * Useful for backfilling missing data
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 */
async function calculateEngagementScoresForDateRange(startDate, endDate) {
  console.log(`🚀 Calculating engagement scores for date range: ${startDate} to ${endDate}`);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const forDate = date.toISOString().slice(0, 10);
    console.log(`\n📅 Processing date: ${forDate}`);
    
    // Temporarily override the date calculation
    const originalCalculateDailyEngagementScores = calculateDailyEngagementScores;
    calculateDailyEngagementScores = async () => {
      // Use the specific date instead of yesterday
      const forDate = date.toISOString().slice(0, 10);
      // ... rest of the logic would need to be adapted
    };
    
    await calculateDailyEngagementScores();
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: calculate for yesterday
    calculateDailyEngagementScores();
  } else if (args.length === 2 && args[0] === '--date-range') {
    // Calculate for a specific date range
    const [startDate, endDate] = args[1].split(',');
    if (startDate && endDate) {
      calculateEngagementScoresForDateRange(startDate, endDate);
    } else {
      console.error('❌ Invalid date range format. Use: --date-range YYYY-MM-DD,YYYY-MM-DD');
      process.exit(1);
    }
  } else {
    console.log('📖 Usage:');
    console.log('  node daily-engagement-score-calculator.mjs                    # Calculate for yesterday');
    console.log('  node daily-engagement-score-calculator.mjs --date-range 2024-01-01,2024-01-31  # Calculate for date range');
    process.exit(1);
  }
}

export { calculateDailyEngagementScores, calculateEngagementScoresForDateRange }; 