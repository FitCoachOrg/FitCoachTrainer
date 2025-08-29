import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check if we can access the database directly
async function checkDatabaseAccess() {
  try {
    console.log('🔍 Checking database access...');
    
    // Try to query the trainer table
    const { data, error } = await supabase
      .from('trainer')
      .select('id, trainer_email')
      .limit(1);
    
    if (error) {
      console.error('❌ Cannot access database directly:', error);
      console.log('💡 You may need to run the script manually in the Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ Database access confirmed');
    console.log('📊 Sample trainer data:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Error checking database access:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Database Setup Script');
  console.log('========================');
  
  const canAccess = await checkDatabaseAccess();
  
  if (canAccess) {
    console.log('\n📋 Database is accessible!');
    console.log('\n📝 Here\'s the SQL script to run in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    
    // Read and display the SQL script
    const fs = await import('fs');
    const sqlScript = fs.readFileSync('check-and-fix-table.sql', 'utf8');
    console.log(sqlScript);
    console.log('='.repeat(80));
    
    console.log('\n🚀 To execute this script:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the script above');
    console.log('4. Click "Run" to execute');
    
  } else {
    console.log('\n❌ Cannot access database directly.');
    console.log('📝 Please run the script manually in the Supabase SQL Editor.');
  }
}

main();
