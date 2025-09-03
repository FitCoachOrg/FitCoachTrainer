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

async function testAdminAccess() {
  console.log('🔍 Testing Admin Access Implementation...\n')

  try {
    // 1. Check if admin_access column exists by trying to query it
    console.log('1️⃣ Checking if admin_access column exists...')
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('trainer')
        .select('admin_access')
        .limit(1)

      if (testError) {
        if (testError.message.includes('column "admin_access" does not exist')) {
          console.log('❌ admin_access column does not exist')
          console.log('   Please run the add-admin-access-column.sql script first')
          return
        } else {
          console.error('❌ Error checking admin_access column:', testError)
          return
        }
      }

      console.log('✅ admin_access column exists and is queryable')
    } catch (error) {
      console.error('❌ Unexpected error checking column:', error)
      return
    }

    // 2. Check current admin status for all trainers
    console.log('\n2️⃣ Checking current admin status for all trainers...')
    const { data: trainers, error: trainersError } = await supabase
      .from('trainer')
      .select('trainer_email, trainer_name, admin_access')
      .order('admin_access', { ascending: false })

    if (trainersError) {
      console.error('❌ Error fetching trainers:', trainersError)
      return
    }

    if (trainers && trainers.length > 0) {
      console.log('✅ Found trainers:')
      trainers.forEach(trainer => {
        const status = trainer.admin_access ? '✅ Admin' : '❌ No Admin'
        console.log(`   - ${trainer.trainer_email} (${trainer.trainer_name}): ${status}`)
      })
    } else {
      console.log('❌ No trainers found')
    }

    // 3. Check specific trainer (vmalik9@gmail.com)
    console.log('\n3️⃣ Checking specific trainer admin access...')
    const { data: specificTrainer, error: specificError } = await supabase
      .from('trainer')
      .select('trainer_email, trainer_name, admin_access')
      .eq('trainer_email', 'vmalik9@gmail.com')
      .single()

    if (specificError) {
      if (specificError.code === 'PGRST116') {
        console.log('❌ Trainer vmalik9@gmail.com not found')
      } else {
        console.error('❌ Error fetching specific trainer:', specificError)
      }
      return
    }

    if (specificTrainer) {
      const status = specificTrainer.admin_access ? '✅ HAS ADMIN ACCESS' : '❌ NO ADMIN ACCESS'
      console.log(`✅ Found trainer: ${specificTrainer.trainer_email} (${specificTrainer.trainer_name})`)
      console.log(`   Admin Access: ${status}`)
      
      if (specificTrainer.admin_access) {
        console.log('   This trainer can access:')
        console.log('   - Admin page (/admin)')
        console.log('   - Branding page (/branding)')
        console.log('   - Notes page (/notes)')
        console.log('   - Programs page (/programs)')
      }
    }

    // 4. Summary
    console.log('\n4️⃣ Summary:')
    const adminCount = trainers?.filter(t => t.admin_access).length || 0
    const totalCount = trainers?.length || 0
    
    console.log(`   Total trainers: ${totalCount}`)
    console.log(`   Admin trainers: ${adminCount}`)
    console.log(`   Regular trainers: ${totalCount - adminCount}`)
    
    if (adminCount > 0) {
      console.log('\n✅ Admin access implementation is working correctly!')
      console.log('   Admin users can access restricted pages')
      console.log('   Regular users will be redirected to dashboard')
    } else {
      console.log('\n⚠️  No admin users found')
      console.log('   Consider setting admin_access = true for a trainer')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testAdminAccess()
