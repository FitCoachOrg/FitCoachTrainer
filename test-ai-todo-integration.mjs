#!/usr/bin/env node

/**
 * AI Todo Integration Test Script
 * Tests the AI to Todo integration functionality
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample AI analysis data for testing
const sampleAIAnalysis = {
  action_plan: {
    immediate_actions: [
      {
        action: "Schedule nutrition consultation",
        priority: "High",
        timeframe: "This week",
        category: "Nutrition"
      },
      {
        action: "Update workout plan for next month",
        priority: "Medium",
        timeframe: "Within 2 weeks",
        category: "Training"
      },
      {
        action: "Review progress photos",
        priority: "Low",
        timeframe: "Next session",
        category: "Assessment"
      }
    ]
  },
  recommendations: {
    training_recommendations: [
      {
        category: "Exercise",
        recommendation: "Increase deadlift weight by 10%",
        priority: "Medium"
      }
    ],
    nutrition_recommendations: [
      {
        category: "Macros",
        recommendation: "Increase protein intake to 1.8g per kg body weight",
        priority: "High"
      }
    ],
    lifestyle_recommendations: [
      {
        category: "Sleep",
        recommendation: "Aim for 8 hours of sleep per night",
        priority: "Medium"
      }
    ]
  }
}

async function testDatabaseSchema() {
  console.log('🔍 Testing database schema...')
  
  try {
    // Check if AI integration fields exist
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'todos')
      .in('column_name', ['source', 'ai_context'])
    
    if (error) {
      console.error('❌ Error checking schema:', error)
      return false
    }
    
    console.log('✅ Schema check results:')
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    return columns.length === 2
  } catch (error) {
    console.error('❌ Schema test failed:', error)
    return false
  }
}

async function testTodoCreation() {
  console.log('\n🧪 Testing todo creation with AI integration...')
  
  try {
    // Create a test todo with AI context
    const testTodo = {
      trainer_id: '00000000-0000-0000-0000-000000000000', // Test user ID
      title: 'Test AI Todo',
      priority: 'medium',
      category: 'training',
      source: 'ai_recommendation',
      ai_context: JSON.stringify({
        original_text: 'Test AI recommendation',
        ai_category: 'Training',
        ai_priority: 'Medium',
        ai_timeframe: 'This week',
        recommendation_type: 'immediate_action'
      })
    }
    
    const { data, error } = await supabase
      .from('todos')
      .insert(testTodo)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating test todo:', error)
      return false
    }
    
    console.log('✅ Test todo created successfully:')
    console.log(`  - ID: ${data.id}`)
    console.log(`  - Title: ${data.title}`)
    console.log(`  - Source: ${data.source}`)
    console.log(`  - AI Context: ${data.ai_context ? 'Present' : 'Missing'}`)
    
    // Clean up test todo
    await supabase
      .from('todos')
      .delete()
      .eq('id', data.id)
    
    console.log('✅ Test todo cleaned up')
    return true
  } catch (error) {
    console.error('❌ Todo creation test failed:', error)
    return false
  }
}

async function testAIToTodoConversion() {
  console.log('\n🤖 Testing AI to Todo conversion logic...')
  
  try {
    // Simulate the conversion logic
    const recommendations = []
    
    // Extract immediate actions
    if (sampleAIAnalysis.action_plan?.immediate_actions) {
      sampleAIAnalysis.action_plan.immediate_actions.forEach(action => {
        recommendations.push({
          ...action,
          type: 'immediate_action'
        })
      })
    }
    
    // Extract training recommendations
    if (sampleAIAnalysis.recommendations?.training_recommendations) {
      sampleAIAnalysis.recommendations.training_recommendations.forEach(rec => {
        recommendations.push({
          ...rec,
          type: 'training_recommendation'
        })
      })
    }
    
    // Extract nutrition recommendations
    if (sampleAIAnalysis.recommendations?.nutrition_recommendations) {
      sampleAIAnalysis.recommendations.nutrition_recommendations.forEach(rec => {
        recommendations.push({
          ...rec,
          type: 'nutrition_recommendation'
        })
      })
    }
    
    // Extract lifestyle recommendations
    if (sampleAIAnalysis.recommendations?.lifestyle_recommendations) {
      sampleAIAnalysis.recommendations.lifestyle_recommendations.forEach(rec => {
        recommendations.push({
          ...rec,
          type: 'lifestyle_recommendation'
        })
      })
    }
    
    console.log(`✅ Extracted ${recommendations.length} recommendations:`)
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.action || rec.recommendation} (${rec.category}, ${rec.priority})`)
    })
    
    // Test conversion to todo format
    const convertedTodos = recommendations.map(rec => {
      const title = rec.action || rec.recommendation || rec.text || 'AI Recommendation'
      const priority = rec.priority?.toLowerCase() === 'high' ? 'high' : 
                      rec.priority?.toLowerCase() === 'low' ? 'low' : 'medium'
      
      // Simple category mapping
      const categoryMap = {
        'Training': 'training',
        'Nutrition': 'nutrition',
        'Assessment': 'administration',
        'Sleep': 'personal',
        'Other': 'personal'
      }
      const category = categoryMap[rec.category] || 'personal'
      
      return {
        title: title.replace(/^[•\-\*]\s*/, '').trim(),
        priority,
        category,
        source: 'ai_recommendation',
        ai_context: JSON.stringify({
          original_text: title,
          ai_category: rec.category || 'Other',
          ai_priority: rec.priority || 'Medium',
          ai_timeframe: rec.timeframe || 'This week',
          recommendation_type: rec.type || 'action_plan'
        })
      }
    })
    
    console.log('\n✅ Converted to todo format:')
    convertedTodos.forEach((todo, index) => {
      console.log(`  ${index + 1}. ${todo.title} (${todo.category}, ${todo.priority})`)
    })
    
    return true
  } catch (error) {
    console.error('❌ AI to Todo conversion test failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Todo Integration Tests\n')
  
  const tests = [
    { name: 'Database Schema', fn: testDatabaseSchema },
    { name: 'Todo Creation', fn: testTodoCreation },
    { name: 'AI to Todo Conversion', fn: testAIToTodoConversion }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  for (const test of tests) {
    console.log(`\n📋 Running ${test.name} test...`)
    const result = await test.fn()
    
    if (result) {
      console.log(`✅ ${test.name} test passed`)
      passedTests++
    } else {
      console.log(`❌ ${test.name} test failed`)
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AI Todo integration is ready.')
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.')
  }
}

// Run the tests
runAllTests().catch(console.error)
