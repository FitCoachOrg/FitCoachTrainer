#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🚀 Running Admin Access Migration...\n')

  try {
    // 1. Add admin_access column if it doesn't exist
    console.log('1️⃣ Adding admin_access column...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE trainer 
        ADD COLUMN IF NOT EXISTS admin_access BOOLEAN DEFAULT false;
      `
    })

    if (alterError) {
      console.log('ℹ️  Column might already exist or error occurred:', alterError.message)
    } else {
      console.log('✅ admin_access column added successfully')
    }

    // 2. Create index for better performance
    console.log('\n2️⃣ Creating index for admin_access...')
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_trainer_admin_access ON trainer(admin_access);
      `
    })

    if (indexError) {
      console.log('ℹ️  Index might already exist or error occurred:', indexError.message)
    } else {
      console.log('✅ Index created successfully')
    }

    // 3. Set admin access for specific trainer (vmalik9@gmail.com)
    console.log('\n3️⃣ Setting admin access for vmalik9@gmail.com...')
    const { data: updateData, error: updateError } = await supabase
      .from('trainer')
      .update({ admin_access: true })
      .eq('trainer_email', 'vmalik9@gmail.com')
      .select('trainer_email, trainer_name, admin_access')

    if (updateError) {
      console.error('❌ Error updating admin access:', updateError)
    } else if (updateData && updateData.length > 0) {
      console.log('✅ Admin access updated successfully:')
      updateData.forEach(trainer => {
        console.log(`   - ${trainer.trainer_email} (${trainer.trainer_name}): ${trainer.admin_access ? '✅ Admin' : '❌ No Admin'}`)
      })
    } else {
      console.log('ℹ️  No trainers were updated (might already have admin access)')
    }

    // 4. Verify final state
    console.log('\n4️⃣ Verifying final state...')
    const { data: finalCheck, error: finalError } = await supabase
      .from('trainer')
      .select('trainer_email, trainer_name, admin_access')
      .order('admin_access', { ascending: false })

    if (finalError) {
      console.error('❌ Error in final verification:', finalError)
      return
    }

    if (finalCheck && finalCheck.length > 0) {
      console.log('✅ Final trainer admin status:')
      finalCheck.forEach(trainer => {
        const status = trainer.admin_access ? '✅ Admin' : '❌ No Admin'
        console.log(`   - ${trainer.trainer_email} (${trainer.trainer_name}): ${status}`)
      })

      const adminCount = finalCheck.filter(t => t.admin_access).length
      const totalCount = finalCheck.length
      
      console.log(`\n📊 Summary:`)
      console.log(`   Total trainers: ${totalCount}`)
      console.log(`   Admin trainers: ${adminCount}`)
      console.log(`   Regular trainers: ${totalCount - adminCount}`)
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('   The admin access system is now ready to use.')
    console.log('   Run the test script to verify: node test-admin-access.mjs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
runMigration()
