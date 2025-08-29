# Get Your Actual Service Role Key

## 🔑 Step 1: Get the Real Service Role Key

The values you showed are encrypted/hashed secrets. You need the actual service role key from your Supabase Dashboard:

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings** → **API**
3. **Look for "service_role" key** (not the anon key)
4. **Copy the full key** (it should look like this):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.SOMETHING_VERY_LONG_HERE
   ```

## 📝 Step 2: Add to .env File

Once you have the actual service role key, replace the placeholder in your .env file:

```bash
# First, let's see what's currently in your .env file
cat .env

# Then, you'll need to manually edit the .env file to replace the placeholder
# with your actual service role key
```

## 🧪 Step 3: Test the Debug Script

After adding the real service role key, run:

```bash
node debug-engagement-function.mjs
```

## 🔍 Alternative: Check Your Current .env File

Let's see what's currently in your .env file:

```bash
cat .env
```

## 🎯 What You Should See

Your .env file should have these lines:
```
VITE_SUPABASE_URL=https://zyozeuihjptarceuipwu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://zyozeuihjptarceuipwu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3pldWloanB0YXJjZXVpcHd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU5MDM4MiwiZXhwIjoyMDYyMTY2MzgyfQ.ACTUAL_SERVICE_ROLE_KEY_HERE
```

**The service role key is different from the anon key and should be much longer!**

## 🚨 Important Notes

- **Service role key** = Full admin access (starts with `eyJ...`)
- **Anon key** = Limited access (also starts with `eyJ...` but shorter)
- **Never share your service role key publicly**
- **Use service role key only for server-side operations**

**Can you go to your Supabase Dashboard → Settings → API and copy the actual service_role key?** 