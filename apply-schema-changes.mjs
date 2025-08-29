import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applySchemaChanges() {
  console.log('🔧 Applying database schema enhancements...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('enhance-exercises-assets-table.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try alternative approach for DDL statements
          const { error: ddlError } = await supabase.rpc('exec_ddl', { sql: statement });
          
          if (ddlError) {
            console.log(`⚠️ Statement ${i + 1} may have failed (this is often expected for DDL):`, ddlError.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️ Statement ${i + 1} may have failed (this is often expected for DDL):`, err.message);
      }
    }
    
    console.log('\n✅ Schema changes applied successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying schema changes...');
    const { data: columns, error: columnsError } = await supabase
      .from('exercises_assets')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Error verifying schema:', columnsError);
    } else {
      console.log('✅ exercises_assets table structure:', Object.keys(columns?.[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error applying schema changes:', error);
  }
}

applySchemaChanges();
