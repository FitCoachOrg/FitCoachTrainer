#!/usr/bin/env node

/**
 * Test Action Items Removal Functionality
 * This test validates that action items are properly removed from the screen when added to todos
 */

// Mock the action items data structure
const mockActionItems = [
  {
    id: "action-0",
    text: "Schedule nutrition consultation",
    priority: "High",
    category: "Nutrition",
    timeframe: "This week",
    added_to_todo: false
  },
  {
    id: "action-1", 
    text: "Update workout plan for next month",
    priority: "Medium",
    category: "Training",
    timeframe: "Within 2 weeks",
    added_to_todo: false
  },
  {
    id: "action-2",
    text: "Review progress photos",
    priority: "Low", 
    category: "Assessment",
    timeframe: "Next session",
    added_to_todo: false
  }
]

// Mock the addedToTodos state
let addedToTodos = new Set()
let showAddedItems = false

// Simulate the getActionItems function logic
function getActionItems() {
  return mockActionItems
    .map(item => ({
      ...item,
      added_to_todo: item.added_to_todo || addedToTodos.has(item.id)
    }))
    .filter(item => {
      const isAddedToTodo = addedToTodos.has(item.id) || item.added_to_todo
      return showAddedItems || !isAddedToTodo
    })
}

// Simulate the getAllActionItems function logic
function getAllActionItems() {
  return mockActionItems
    .map(item => ({
      ...item,
      added_to_todo: item.added_to_todo || addedToTodos.has(item.id)
    }))
}

// Test scenarios
function testActionItemsRemoval() {
  console.log('🧪 Testing Action Items Removal Functionality...\n')

  console.log('📋 Initial State:')
  console.log(`  Total action items: ${mockActionItems.length}`)
  console.log(`  Added to todos: ${addedToTodos.size}`)
  console.log(`  Show added items: ${showAddedItems}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 1: Add first item to todos
  console.log('🔄 Test 1: Adding first item to todos')
  addedToTodos.add("action-0")
  console.log(`  Added to todos: ${addedToTodos.size}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 2: Add second item to todos
  console.log('🔄 Test 2: Adding second item to todos')
  addedToTodos.add("action-1")
  console.log(`  Added to todos: ${addedToTodos.size}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 3: Show added items
  console.log('🔄 Test 3: Showing added items')
  showAddedItems = true
  console.log(`  Show added items: ${showAddedItems}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 4: Hide added items again
  console.log('🔄 Test 4: Hiding added items again')
  showAddedItems = false
  console.log(`  Show added items: ${showAddedItems}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 5: Add all items
  console.log('🔄 Test 5: Adding all items to todos')
  addedToTodos.add("action-2")
  console.log(`  Added to todos: ${addedToTodos.size}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Test 6: Show all added items
  console.log('🔄 Test 6: Showing all added items')
  showAddedItems = true
  console.log(`  Show added items: ${showAddedItems}`)
  console.log(`  Visible items: ${getActionItems().length}`)
  console.log('  Items:', getActionItems().map(item => item.text))
  console.log('')

  // Calculate final statistics
  const allItems = getAllActionItems()
  const totalActions = allItems.length
  const addedActions = allItems.filter(item => 
    addedToTodos.has(item.id) || item.added_to_todo
  ).length
  const remainingActions = getActionItems().length

  console.log('📊 Final Statistics:')
  console.log(`  Total actions: ${totalActions}`)
  console.log(`  Added actions: ${addedActions}`)
  console.log(`  Remaining actions: ${remainingActions}`)
  console.log(`  All actions added: ${totalActions > 0 && remainingActions === 0}`)

  // Validate results
  const expectedTotal = 3
  const expectedAdded = 3
  const expectedRemaining = showAddedItems ? 3 : 0
  const expectedAllAdded = !showAddedItems // Only true when not showing added items

  const passed = totalActions === expectedTotal && 
                 addedActions === expectedAdded && 
                 remainingActions === expectedRemaining &&
                 (totalActions > 0 && remainingActions === 0) === expectedAllAdded

  console.log(`\n📊 Test Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Expected: ${expectedTotal} total, ${expectedAdded} added, ${expectedRemaining} remaining`)
  console.log(`  Got: ${totalActions} total, ${addedActions} added, ${remainingActions} remaining`)

  return passed
}

// Test the completion message logic
function testCompletionMessage() {
  console.log('\n🧪 Testing Completion Message Logic...\n')

  const allItems = getAllActionItems()
  const totalActions = allItems.length
  const addedActions = allItems.filter(item => 
    addedToTodos.has(item.id) || item.added_to_todo
  ).length
  const remainingActions = getActionItems().length
  const allActionsAdded = totalActions > 0 && remainingActions === 0

  console.log('📋 Completion Message Conditions:')
  console.log(`  Total actions: ${totalActions}`)
  console.log(`  Added actions: ${addedActions}`)
  console.log(`  Remaining actions: ${remainingActions}`)
  console.log(`  All actions added: ${allActionsAdded}`)
  console.log(`  Show completion message: ${totalActions > 0 && allActionsAdded}`)

  const shouldShowCompletion = totalActions > 0 && allActionsAdded
  const expectedShowCompletion = !showAddedItems // Only show completion when not showing added items

  const passed = shouldShowCompletion === expectedShowCompletion

  console.log(`\n📊 Completion Test Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Expected: ${expectedShowCompletion}`)
  console.log(`  Got: ${shouldShowCompletion}`)

  return passed
}

// Run tests
console.log('🚀 Starting Action Items Removal Tests...\n')

const test1Passed = testActionItemsRemoval()
const test2Passed = testCompletionMessage()

console.log('\n📊 Overall Test Results:')
console.log(`  Action Items Removal: ${test1Passed ? '✅ PASS' : '❌ FAIL'}`)
console.log(`  Completion Message: ${test2Passed ? '✅ PASS' : '❌ FAIL'}`)
console.log(`  Overall: ${test1Passed && test2Passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

console.log('\n✨ Test suite completed!')
