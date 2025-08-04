# Get Your Service Role Key

## 🔑 Step 1: Get Service Role Key from Supabase Dashboard

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings** → **API**
3. **Copy your service_role key** (it starts with `eyJ...`)

## 📝 Step 2: Add to .env File

Once you have your service role key, add it to your .env file:

```bash
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." >> .env
```

**Replace the `eyJ...` part with your actual service role key.**

## 🧪 Step 3: Test the Debug Script

After adding the service role key, run:

```bash
node debug-engagement-function.mjs
```

## 📊 What the Debug Script Will Check

The debug script will test:

1. ✅ **Database connection**
2. ✅ **Active clients** (should have `is_active = true`)
3. ✅ **Schedule data** (tasks for clients)
4. ✅ **Existing engagement scores**
5. ✅ **Score calculation logic**
6. ✅ **Database insertion**

## 🎯 Expected Results

If everything is working, you should see:

```
🔍 Debugging Engagement Score Calculation...

🚀 Starting debug process...

1️⃣ Testing database connection...
✅ Database connection successful

2️⃣ Checking for active clients...
✅ Found 5 active clients:
   - John Doe (ID: 1)
   - Jane Smith (ID: 2)
   ...

3️⃣ Checking schedule data...
✅ Found 15 schedule entries:
   - Client 1: completed on 2024-01-15
   - Client 2: pending on 2024-01-15
   ...

4️⃣ Checking existing engagement scores...
✅ Found 3 existing engagement scores:
   - Client 1: 80% on 2024-01-15
   ...

5️⃣ Testing calculation for a specific client...
Testing calculation for John Doe on 2024-01-15...
📋 Found 3 schedules for John Doe on 2024-01-15:
   - completed (ID: 123)
   - completed (ID: 124)
   - pending (ID: 125)
📊 Calculation result: 67% (2/3 tasks completed)

6️⃣ Testing score insertion...
✅ Score inserted successfully!

📊 Debug Summary:
   - Active clients: 5
   - Schedule entries: 15
   - Existing scores: 3
   - Test client: John Doe
   - Test date: 2024-01-15
   - Test result: 67% (2/3)
```

## 🚨 If You See Issues

### No Active Clients
```sql
-- Run in Supabase SQL Editor
UPDATE client SET is_active = true WHERE client_id = 1;
```

### No Schedule Data
```sql
-- Run in Supabase SQL Editor
INSERT INTO schedule (client_id, for_date, status) 
VALUES (1, '2024-01-15', 'completed');
```

### Database Permission Issues
- Check if your service role key has proper permissions
- Verify RLS policies on tables

**Once you add your service role key to the .env file, run the debug script and share the output with me!** 