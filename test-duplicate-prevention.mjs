#!/usr/bin/env node

/**
 * Test Duplicate Prevention Logic for AI Todo Integration
 * This test validates the enhanced duplicate checking functionality
 */

// Test the similarity calculation function
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

// Levenshtein distance calculation for similarity
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Test duplicate detection logic
function testDuplicateDetection() {
  console.log('🧪 Testing Duplicate Detection Logic...\n')

  // Test cases for similarity calculation
  const testCases = [
    {
      title1: "Schedule nutrition consultation",
      title2: "Schedule nutrition consultation",
      expected: true,
      description: "Exact match"
    },
    {
      title1: "Schedule nutrition consultation",
      title2: "schedule nutrition consultation",
      expected: true,
      description: "Case insensitive match"
    },
    {
      title1: "Schedule nutrition consultation",
      title2: "Schedule nutrition consultation.",
      expected: true,
      description: "Minor punctuation difference"
    },
    {
      title1: "Schedule nutrition consultation",
      title2: "Schedule nutrition consult",
      expected: true,
      description: "Similar but not exact (should be detected as duplicate)"
    },
    {
      title1: "Schedule nutrition consultation",
      title2: "Update workout plan",
      expected: false,
      description: "Completely different (should not be detected as duplicate)"
    },
    {
      title1: "Monitor shoulder discomfort during overhead presses",
      title2: "Monitor shoulder discomfort during overhead press",
      expected: true,
      description: "Singular/plural difference (should be detected as duplicate)"
    },
    {
      title1: "Focus on consistent meal timing",
      title2: "Focus on consistent meal timing and portion control",
      expected: true,
      description: "Extended version (should be detected as duplicate)"
    }
  ]

  let passedTests = 0
  let totalTests = testCases.length

  testCases.forEach((testCase, index) => {
    const similarity = calculateSimilarity(
      testCase.title1.toLowerCase().trim(),
      testCase.title2.toLowerCase().trim()
    )
    
         const isDuplicate = similarity > 0.7
    const passed = isDuplicate === testCase.expected
    
    console.log(`Test ${index + 1}: ${testCase.description}`)
    console.log(`  Title 1: "${testCase.title1}"`)
    console.log(`  Title 2: "${testCase.title2}"`)
    console.log(`  Similarity: ${(similarity * 100).toFixed(1)}%`)
    console.log(`  Expected: ${testCase.expected}, Got: ${isDuplicate}`)
    console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`)
    
    if (passed) passedTests++
  })

  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Duplicate detection logic is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Please review the duplicate detection logic.')
  }
}

// Test bulk duplicate checking logic
function testBulkDuplicateChecking() {
  console.log('\n🧪 Testing Bulk Duplicate Checking Logic...\n')

  // Mock existing todos
  const existingTodos = [
    { title: "Schedule nutrition consultation", id: 1 },
    { title: "Update workout plan for next month", id: 2 },
    { title: "Review progress photos", id: 3 }
  ]

  // Mock new action items
  const newItems = [
    { id: "action-1", text: "Schedule nutrition consultation" }, // Exact duplicate
    { id: "action-2", text: "Update workout plan" }, // Similar duplicate
    { id: "action-3", text: "Plan recovery week" }, // New item
    { id: "action-4", text: "schedule nutrition consultation" } // Case insensitive duplicate
  ]

  // Simulate bulk duplicate checking
  const existingTitles = new Set(existingTodos.map(todo => todo.title.toLowerCase().trim()))
  const duplicateItems = []
  const newItemsToAdd = []

  for (const item of newItems) {
    const normalizedTitle = item.text.toLowerCase().trim()
    
    // Check for exact matches and similar matches
    const isDuplicate = Array.from(existingTitles).some(existingTitle => {
      if (existingTitle === normalizedTitle) return true
      
             const similarity = calculateSimilarity(existingTitle, normalizedTitle)
       return similarity > 0.7
    })

    if (isDuplicate) {
      duplicateItems.push(item)
    } else {
      newItemsToAdd.push(item)
    }
  }

  console.log('📋 Existing Todos:')
  existingTodos.forEach(todo => console.log(`  - ${todo.title}`))
  
  console.log('\n📝 New Action Items:')
  newItems.forEach(item => console.log(`  - ${item.text}`))
  
  console.log('\n🔍 Duplicate Detection Results:')
  console.log(`  Duplicates found: ${duplicateItems.length}`)
  duplicateItems.forEach(item => console.log(`    - ${item.text}`))
  
  console.log(`  New items to add: ${newItemsToAdd.length}`)
  newItemsToAdd.forEach(item => console.log(`    - ${item.text}`))

  // Validate results
  const expectedDuplicates = 3 // action-1, action-2, action-4
  const expectedNew = 1 // action-3
  
  const passed = duplicateItems.length === expectedDuplicates && newItemsToAdd.length === expectedNew
  
  console.log(`\n📊 Bulk Test Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`  Expected: ${expectedDuplicates} duplicates, ${expectedNew} new items`)
  console.log(`  Got: ${duplicateItems.length} duplicates, ${newItemsToAdd.length} new items`)
}

// Run tests
console.log('🚀 Starting Duplicate Prevention Tests...\n')
testDuplicateDetection()
testBulkDuplicateChecking()
console.log('\n✨ Test suite completed!')
