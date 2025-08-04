# Engagement Score System Documentation

## Overview

The Engagement Score System calculates daily engagement scores for all clients based on their task completion rates. This helps trainers track client engagement and identify clients who may need additional support.

## How It Works

### Engagement Score Formula
```
Engagement Score = (Completed Tasks / Total Tasks Due) × 100
```

**Example:**
- Client has 5 tasks due on a specific day
- Client completes 3 tasks
- Engagement Score = (3/5) × 100 = 60%

### Key Features
- ✅ **Daily Calculation**: Calculates scores for each day (not real-time)
- ✅ **Past Dates Only**: Only calculates for completed days, not today or future dates
- ✅ **Duplicate Prevention**: Skips calculation if score already exists for that date
- ✅ **Comprehensive Logging**: Detailed logs for monitoring and debugging
- ✅ **Error Handling**: Robust error handling with detailed error messages

## Database Schema

The system uses the `client_engagement_score` table with the following structure:

```sql
CREATE TABLE client_engagement_score (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client(client_id),
  for_date DATE NOT NULL,
  eng_score INTEGER, -- Percentage (0-100) or NULL if no tasks
  total_due INTEGER NOT NULL, -- Total number of tasks due
  completed INTEGER NOT NULL, -- Number of completed tasks
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_client_engagement_score_client_date ON client_engagement_score(client_id, for_date);
CREATE UNIQUE INDEX idx_client_engagement_score_unique ON client_engagement_score(client_id, for_date);
```

## Components

### 1. Client-Side Function (`client/src/lib/client-engagement.ts`)
- **Purpose**: Calculates engagement scores for individual clients
- **Usage**: Called when viewing client details or engagement metrics
- **Features**: 
  - Calculates scores for the last 30 days
  - Fills in missing daily scores
  - Returns the most recent score

### 2. Supabase Edge Function (`supabase/functions/calculate_engagement_score/index.ts`)
- **Purpose**: Server-side calculation for all clients
- **Usage**: Can be triggered via HTTP request
- **Features**:
  - Processes all active clients
  - Calculates for the previous day only
  - Designed for scheduled execution

### 3. Daily Automation Script (`daily-engagement-score-calculator.mjs`)
- **Purpose**: Standalone script for daily automation
- **Usage**: Can be run manually or as a cron job
- **Features**:
  - Comprehensive logging and error handling
  - Progress tracking and summary reports
  - Support for date range calculations
  - Environment variable configuration

## Setup Instructions

### Prerequisites
1. Node.js installed on your system
2. Supabase project with proper database schema
3. Environment variables configured

### Environment Variables
Create a `.env` file with:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation Steps

1. **Make scripts executable:**
   ```bash
   chmod +x daily-engagement-score-calculator.mjs
   chmod +x setup-daily-engagement-cron.sh
   ```

2. **Run the setup script:**
   ```bash
   ./setup-daily-engagement-cron.sh
   ```

3. **Test the script manually:**
   ```bash
   node daily-engagement-score-calculator.mjs
   ```

## Usage

### Manual Execution
```bash
# Calculate for yesterday (default)
node daily-engagement-score-calculator.mjs

# Calculate for a specific date range
node daily-engagement-score-calculator.mjs --date-range 2024-01-01,2024-01-31
```

### Automated Execution (Cron Job)
The setup script will create a cron job that runs daily at 1:00 AM:
```bash
0 1 * * * cd /path/to/project && node daily-engagement-score-calculator.mjs >> engagement-scores.log 2>&1
```

### Monitoring
```bash
# View recent logs
tail -f engagement-scores.log

# Check cron jobs
crontab -l

# Edit cron jobs
crontab -e
```

## Output Examples

### Successful Run
```
🚀 Starting daily engagement score calculation...
📅 Calculating engagement scores for date: 2024-01-15
👥 Found 25 active clients
✅ John Doe: 80% (4/5 tasks completed)
✅ Jane Smith: 100% (3/3 tasks completed)
⏭️  Score already exists for Bob Johnson on 2024-01-15, skipping
📝 Alice Brown: No tasks due on 2024-01-15

📊 Daily Engagement Score Calculation Summary:
⏱️  Duration: 12.34 seconds
✅ Processed: 23 clients
⏭️  Skipped: 2 clients (already calculated)
❌ Errors: 0 clients
📅 Date processed: 2024-01-15
```

### Error Handling
```
❌ Error fetching schedules for client 123 on 2024-01-15: {error: "connection timeout"}
❌ Error inserting engagement score for John Doe: {error: "duplicate key"}
```

## Integration with Frontend

### Displaying Engagement Scores
The frontend can fetch engagement scores using the existing client-side function:

```typescript
import { getOrCreateEngagementScore } from '../lib/client-engagement';

// Get engagement score for a specific client
const score = await getOrCreateEngagementScore(clientId);
```

### Dashboard Integration
Engagement scores are displayed in:
- Client dashboard cards
- Client list with engagement metrics
- Detailed client profiles
- Analytics and reporting sections

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   ❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
   ```
   **Solution**: Check your `.env` file and ensure all variables are set.

2. **Database Connection Errors**
   ```
   ❌ Error fetching clients: {error: "connection failed"}
   ```
   **Solution**: Verify your Supabase URL and service role key.

3. **Permission Errors**
   ```
   ❌ Error inserting engagement score: {error: "permission denied"}
   ```
   **Solution**: Ensure your service role key has proper permissions.

4. **Duplicate Entry Errors**
   ```
   ❌ Error inserting engagement score: {error: "duplicate key"}
   ```
   **Solution**: The script should handle this automatically, but you can manually delete duplicate entries.

### Debugging Tips

1. **Check Logs**: Always review the log file for detailed error messages
2. **Test Manually**: Run the script manually to test configuration
3. **Verify Database**: Ensure the `client_engagement_score` table exists
4. **Check Permissions**: Verify service role key has proper database access

## Performance Considerations

### Optimization Tips
- The script processes clients sequentially to avoid overwhelming the database
- Existing scores are skipped to prevent duplicate calculations
- Database indexes are used for efficient queries
- Logging is comprehensive but not excessive

### Scaling Considerations
- For large numbers of clients (>1000), consider batch processing
- Monitor database performance during peak usage
- Consider running during off-peak hours

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use service role keys only for server-side operations
- Rotate keys regularly

### Database Access
- Use Row Level Security (RLS) policies in Supabase
- Limit service role permissions to necessary operations
- Monitor database access logs

## Maintenance

### Regular Tasks
1. **Monitor Logs**: Check for errors and performance issues
2. **Review Scores**: Periodically verify score accuracy
3. **Update Dependencies**: Keep Node.js and Supabase SDK updated
4. **Backup Data**: Ensure engagement scores are included in backups

### Data Cleanup
```sql
-- Remove old engagement scores (older than 1 year)
DELETE FROM client_engagement_score 
WHERE for_date < CURRENT_DATE - INTERVAL '1 year';
```

## Support

For issues or questions:
1. Check the logs first for error details
2. Verify environment configuration
3. Test with manual execution
4. Review database schema and permissions

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Author**: FitCoach Trainer System 