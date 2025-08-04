# Daily Engagement Score Implementation Checklist

## Complete Step-by-Step Implementation Guide

Follow these steps in order to implement daily engagement score calculation in your Supabase project.

---

## ✅ Step 1: Create the Database Table

**File**: `step1-create-table.sql`

**Action**: Run the SQL script in your Supabase SQL Editor

**Commands**:
```bash
# Copy the SQL from step1-create-table.sql and run it in Supabase SQL Editor
```

**Verification**: 
- ✅ Table `client_engagement_score` exists
- ✅ Indexes are created
- ✅ Unique constraint prevents duplicates

---

## ✅ Step 2: Set Up Environment Variables

**File**: `step2-env-setup.md`

**Action**: Configure your Supabase credentials

**Commands**:
```bash
# Create .env file
touch .env

# Add your credentials (replace with your actual values)
echo "SUPABASE_URL=https://your-project-id.supabase.co" >> .env
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env
```

**Verification**:
- ✅ `.env` file exists with correct credentials
- ✅ Environment variables are accessible

---

## ✅ Step 3: Test Database Connection

**File**: `step3-test-connection.mjs`

**Action**: Verify database connectivity

**Commands**:
```bash
node step3-test-connection.mjs
```

**Verification**:
- ✅ Successfully connected to Supabase
- ✅ `client_engagement_score` table is accessible
- ✅ `schedule` table is accessible

---

## ✅ Step 4: Test Engagement Score Calculation

**File**: `step4-test-calculation.mjs`

**Action**: Test the calculation logic with real data

**Commands**:
```bash
node step4-test-calculation.mjs
```

**Verification**:
- ✅ Single calculation test passed
- ✅ Multiple dates test passed
- ✅ Calculation logic is working correctly

---

## ✅ Step 5: Set Up Daily Automation

**File**: `step5-setup-automation.md`

**Action**: Configure automated daily execution

**Commands**:
```bash
# Install dependencies
npm install @supabase/supabase-js dotenv

# Make scripts executable
chmod +x daily-engagement-score-calculator.mjs
chmod +x setup-daily-engagement-cron.sh

# Test the automation script
node daily-engagement-score-calculator.mjs

# Set up cron job
./setup-daily-engagement-cron.sh
```

**Verification**:
- ✅ Automation script runs without errors
- ✅ Cron job is created and scheduled
- ✅ Logs show successful execution

---

## ✅ Step 6: Verify Integration with Your App

**File**: `step6-verify-integration.md`

**Action**: Test the complete system integration

**Commands**:
```bash
# Start your development server
cd client
npm run dev
```

**Verification**:
- ✅ Engagement scores display in client dashboard
- ✅ Scores update when tasks are completed
- ✅ Historical data shows correctly
- ✅ Performance remains good

---

## 🎯 Final Verification

### Database Verification
```sql
-- Check if table exists and has data
SELECT COUNT(*) FROM client_engagement_score;

-- Check recent entries
SELECT * FROM client_engagement_score 
ORDER BY for_date DESC 
LIMIT 5;
```

### Automation Verification
```bash
# Check cron job
crontab -l

# Check recent logs
tail -f engagement-scores.log

# Test manual execution
node daily-engagement-score-calculator.mjs
```

### Frontend Verification
- ✅ Client dashboard shows engagement scores
- ✅ Scores are color-coded appropriately
- ✅ Historical trends are visible
- ✅ No performance degradation

---

## 📊 Success Metrics

You'll know the implementation is successful when:

1. **Daily Automation**: Script runs daily at 1:00 AM without errors
2. **Database**: New engagement scores are added daily
3. **Frontend**: Client dashboard displays engagement metrics
4. **Accuracy**: Scores match expected calculations
5. **Performance**: App loads quickly with engagement data

---

## 🔧 Troubleshooting Quick Reference

### Common Issues

| Issue | Solution |
|-------|----------|
| Missing environment variables | Check `.env` file and credentials |
| Database connection failed | Verify Supabase URL and service role key |
| Table not found | Run Step 1 SQL script |
| Calculation errors | Check schedule table data |
| Cron job not running | Verify cron service and permissions |
| Frontend not showing scores | Check client-side function and API calls |

### Debug Commands

```bash
# Test database connection
node step3-test-connection.mjs

# Test calculation
node step4-test-calculation.mjs

# Test automation
node daily-engagement-score-calculator.mjs

# Check logs
tail -f engagement-scores.log

# Check cron jobs
crontab -l
```

---

## 📝 Post-Implementation Tasks

1. **Monitor for 1 week** to ensure stability
2. **Set up alerts** for automation failures (optional)
3. **Document any customizations** you made
4. **Train your team** on the new engagement metrics
5. **Plan for scaling** if client count grows significantly

---

## 🎉 Completion Checklist

- [ ] Step 1: Database table created
- [ ] Step 2: Environment variables configured
- [ ] Step 3: Database connection tested
- [ ] Step 4: Calculation logic tested
- [ ] Step 5: Automation set up
- [ ] Step 6: Frontend integration verified
- [ ] Daily automation running successfully
- [ ] Engagement scores displaying in app
- [ ] Performance verified
- [ ] Documentation completed

**🎉 Congratulations!** Your daily engagement score calculation system is now fully implemented and operational. 