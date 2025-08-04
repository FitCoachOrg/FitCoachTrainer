# Step 2: Set Up Environment Variables

## Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get your Supabase URL**
   - Go to **Settings** → **API**
   - Copy the **Project URL** (looks like: `https://your-project-id.supabase.co`)

3. **Get your Service Role Key**
   - In the same **Settings** → **API** section
   - Copy the **service_role** key (starts with `eyJ...`)
   - ⚠️ **Important**: This is a secret key - keep it secure!

## Create Environment File

1. **In your project directory**, create a `.env` file:
   ```bash
   touch .env
   ```

2. **Add your credentials** to the `.env` file:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Verify the file** was created:
   ```bash
   cat .env
   ```

## Test the Connection

Run this command to test if your environment variables are working:
```bash
node -e "
import dotenv from 'dotenv';
dotenv.config();
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
"
```

## Security Notes

- ✅ **Do**: Keep your `.env` file secure and never commit it to version control
- ✅ **Do**: Use the service role key only for server-side operations
- ❌ **Don't**: Share your service role key publicly
- ❌ **Don't**: Use the service role key in client-side code

## Next Step

Once you've completed this step, proceed to Step 3: Test Database Connection. 