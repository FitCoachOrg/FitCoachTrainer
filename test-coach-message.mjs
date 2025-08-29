// Test for coach message functionality
function testCoachMessageMapping() {
  console.log('🧪 Testing coach message mapping...')
  
  // Test cases for coach_tip field priority
  const testCases = [
    {
      name: "With coach message",
      coachMessage: "Stay hydrated! Drink 8 glasses of water today.",
      otherDetails: "Water Intake",
      expected: "Stay hydrated! Drink 8 glasses of water today."
    },
    {
      name: "No coach message, with other details",
      coachMessage: "",
      otherDetails: "Custom reminder",
      expected: "Custom reminder"
    },
    {
      name: "No coach message, no other details",
      coachMessage: "",
      otherDetails: "",
      expected: "Water Intake" // fallback to display name
    }
  ]

  testCases.forEach((testCase, index) => {
    const coach_tip = testCase.coachMessage || testCase.otherDetails || "Water Intake"
    const match = coach_tip === testCase.expected ? "✅" : "❌"
    
    console.log(`\n  Test ${index + 1}: ${testCase.name}`)
    console.log(`    Coach Message: "${testCase.coachMessage}"`)
    console.log(`    Other Details: "${testCase.otherDetails}"`)
    console.log(`    Result: "${coach_tip}"`)
    console.log(`    Expected: "${testCase.expected}"`)
    console.log(`    Match: ${match}`)
  })

  console.log('\n📋 Coach message priority order:')
  console.log('  1. Coach Message (if provided)')
  console.log('  2. Other Details (if provided)')
  console.log('  3. Task Display Name (fallback)')
}

testCoachMessageMapping() 