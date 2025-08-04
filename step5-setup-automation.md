# Step 5: Set Up Daily Automation

## Install Dependencies

First, make sure you have the required Node.js packages:

```bash
npm install @supabase/supabase-js dotenv
```

## Make Scripts Executable

```bash
chmod +x daily-engagement-score-calculator.mjs
chmod +x setup-daily-engagement-cron.sh
```

## Test the Automation Script

Run a test to make sure the automation script works:

```bash
node daily-engagement-score-calculator.mjs
```

You should see output like:
```
🚀 Starting daily engagement score calculation...
📅 Calculating engagement scores for date: 2024-01-15
👥 Found 25 active clients
✅ John Doe: 80% (4/5 tasks completed)
✅ Jane Smith: 100% (3/3 tasks completed)
⏭️  Score already exists for Bob Johnson on 2024-01-15, skipping

📊 Daily Engagement Score Calculation Summary:
⏱️  Duration: 12.34 seconds
✅ Processed: 23 clients
⏭️  Skipped: 2 clients (already calculated)
❌ Errors: 0 clients
📅 Date processed: 2024-01-15
```

## Set Up Cron Job

### Option A: Use the Setup Script (Recommended)

```bash
./setup-daily-engagement-cron.sh
```

This script will:
- Check prerequisites
- Test the automation script
- Create a cron job that runs daily at 1:00 AM
- Provide monitoring instructions

### Option B: Manual Cron Setup

If you prefer to set up the cron job manually:

1. **Open your crontab:**
   ```bash
   crontab -e
   ```

2. **Add this line:**
   ```bash
   0 1 * * * cd /path/to/your/project && node daily-engagement-score-calculator.mjs >> engagement-scores.log 2>&1
   ```

3. **Save and exit** (usually Ctrl+X, then Y, then Enter)

## Verify Cron Job Setup

```bash
# Check if cron job was created
crontab -l

# You should see something like:
# 0 1 * * * cd /Users/vikas/Documents/FitCoachTrainer && node daily-engagement-score-calculator.mjs >> engagement-scores.log 2>&1
```

## Test the Cron Job

You can test the cron job by running it manually:

```bash
# Test for yesterday
node daily-engagement-score-calculator.mjs

# Test for a specific date range
node daily-engagement-score-calculator.mjs --date-range 2024-01-01,2024-01-31
```

## Monitor the Automation

### Check Logs
```bash
# View recent logs
tail -f engagement-scores.log

# View all logs
cat engagement-scores.log
```

### Check Database
You can verify that scores are being calculated by checking your Supabase database:

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Select the `client_engagement_score` table
4. You should see new entries being added daily

## Troubleshooting

### Common Issues

1. **Script not found**
   ```bash
   # Make sure you're in the right directory
   pwd
   ls -la daily-engagement-score-calculator.mjs
   ```

2. **Permission denied**
   ```bash
   # Make script executable
   chmod +x daily-engagement-score-calculator.mjs
   ```

3. **Environment variables not found**
   ```bash
   # Check your .env file
   cat .env
   ```

4. **Cron job not running**
   ```bash
   # Check cron service
   sudo service cron status
   
   # Check cron logs
   grep CRON /var/log/syslog
   ```

## Next Steps

Once the automation is set up:

1. **Monitor for a few days** to ensure it's working correctly
2. **Check the logs** daily to verify scores are being calculated
3. **Verify in your app** that engagement scores are displaying correctly

## Success Indicators

You'll know the automation is working when:

- ✅ Daily logs show successful calculations
- ✅ New entries appear in `client_engagement_score` table
- ✅ No errors in the log files
- ✅ Engagement scores display correctly in your app

## Next Step

Once you've completed this step, proceed to Step 6: Verify Integration with Your App. 