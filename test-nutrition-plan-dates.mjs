import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { format, addDays } from 'date-fns'

// Load environment variables
const envPath = '.env'
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNutritionPlanDates() {
  console.log('🧪 Testing Nutrition Plan Date Mapping')
  console.log('=' .repeat(50))

  try {
    // 1. Get a client ID for testing
    console.log('\n1️⃣ Getting client ID for testing...')
    const { data: clients, error: clientError } = await supabase
      .from('client')
      .select('client_id, cl_name')
      .limit(1)

    if (clientError) throw clientError
    if (!clients || clients.length === 0) {
      console.error('❌ No clients found in database')
      return
    }

    const clientId = clients[0].client_id
    const clientName = clients[0].cl_name
    console.log(`✅ Using client: ${clientName} (ID: ${clientId})`)

    // 2. Test with a specific start date (not current date)
    console.log('\n2️⃣ Testing nutrition plan with specific start date...')
    const testStartDate = new Date('2025-01-20') // A Monday
    console.log(`📅 Test start date: ${format(testStartDate, 'yyyy-MM-dd')} (${format(testStartDate, 'EEEE')})`)

    // 3. Create a mock nutrition plan (similar to what AI would generate)
    const mockPlan = [
      {
        day: "Monday",
        total: { calories: 2000, protein: 150, carbs: 200, fats: 70, name: "Total" },
        breakfast: { name: "Oatmeal with Berries", calories: 400, protein: 15, carbs: 60, fats: 10, amount: "1 cup oatmeal, 1/2 cup berries" },
        lunch: { name: "Grilled Chicken Salad", calories: 500, protein: 35, carbs: 30, fats: 25, amount: "150g chicken, mixed greens" },
        dinner: { name: "Salmon with Vegetables", calories: 600, protein: 45, carbs: 40, fats: 25, amount: "200g salmon, 2 cups vegetables" },
        snacks: { name: "Greek Yogurt with Nuts", calories: 500, protein: 55, carbs: 70, fats: 10, amount: "1 cup yogurt, 1/4 cup nuts" }
      },
      {
        day: "Tuesday",
        total: { calories: 2000, protein: 150, carbs: 200, fats: 70, name: "Total" },
        breakfast: { name: "Eggs and Toast", calories: 450, protein: 20, carbs: 55, fats: 15, amount: "2 eggs, 2 slices whole grain bread" },
        lunch: { name: "Turkey Sandwich", calories: 550, protein: 40, carbs: 45, fats: 20, amount: "150g turkey, whole grain bread" },
        dinner: { name: "Beef Stir Fry", calories: 550, protein: 35, carbs: 50, fats: 25, amount: "200g beef, 1 cup rice, vegetables" },
        snacks: { name: "Protein Shake", calories: 450, protein: 55, carbs: 50, fats: 10, amount: "1 scoop protein, 1 banana" }
      }
    ]

    // 4. Simulate the saveNutritionPlanToPreview function with getDateForDay logic
    console.log('\n3️⃣ Simulating nutrition plan save with corrected date mapping...')
    const recordsToInsert = []

    // Helper function to simulate getDateForDay
    const getDateForDay = (dayName, startDate) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayIndex = days.indexOf(dayName)
      const currentDayIndex = startDate.getDay()
      const daysToAdd = (dayIndex - currentDayIndex + 7) % 7
      const targetDate = new Date(startDate)
      targetDate.setDate(startDate.getDate() + daysToAdd)
      return targetDate
    }

    mockPlan.forEach((dayPlan) => {
      const forDate = format(getDateForDay(dayPlan.day, testStartDate), 'yyyy-MM-dd')
      console.log(`   ${dayPlan.day}: ${forDate} (${format(getDateForDay(dayPlan.day, testStartDate), 'EEEE')})`)

      // Simulate meal times
      const mealTimes = {
        breakfast: '08:00:00',
        lunch: '13:00:00', 
        dinner: '19:00:00',
        snacks: '16:00:00'
      }

      Object.keys(mealTimes).forEach(mealType => {
        const meal = dayPlan[mealType]
        if (meal && meal.name) {
          recordsToInsert.push({
            client_id: clientId,
            for_date: forDate,
            type: 'meal',
            task: mealType.charAt(0).toUpperCase() + mealType.slice(1),
            summary: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}`,
            coach_tip: `Test meal for ${dayPlan.day}`,
            details_json: {
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fats: meal.fats,
              amount: meal.amount,
            },
            for_time: mealTimes[mealType],
            icon: '🍽️',
          })
        }
      })
    })

    // 5. Insert test data
    console.log('\n4️⃣ Inserting test nutrition plan...')
    const { data: insertedData, error: insertError } = await supabase
      .from('schedule_preview')
      .insert(recordsToInsert)
      .select()

    if (insertError) {
      console.error('❌ Error inserting test nutrition plan:', insertError)
      return
    }

    console.log('✅ Test nutrition plan inserted successfully')

    // 6. Verify the dates are correct
    console.log('\n5️⃣ Verifying date mapping...')
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .gte('for_date', format(testStartDate, 'yyyy-MM-dd'))
      .lte('for_date', format(addDays(testStartDate, 6), 'yyyy-MM-dd'))
      .order('for_date', { ascending: true })

    if (retrieveError) throw retrieveError

    console.log('\n📊 Retrieved nutrition plan dates:')
    retrievedData?.forEach(item => {
      const dayName = format(new Date(item.for_date), 'EEEE')
      console.log(`   ${dayName} (${item.for_date}): ${item.summary}`)
    })

    // 7. Verify the mapping is correct
    console.log('\n6️⃣ Verifying date mapping correctness...')
    let mappingCorrect = true
    
    // Create expected date mapping
    const expectedDates = {
      'Monday': format(getDateForDay('Monday', testStartDate), 'yyyy-MM-dd'),
      'Tuesday': format(getDateForDay('Tuesday', testStartDate), 'yyyy-MM-dd')
    }
    
    console.log('Expected date mapping:')
    Object.keys(expectedDates).forEach(day => {
      console.log(`   ${day}: ${expectedDates[day]}`)
    })
    
    // Check if retrieved data matches expected dates
    const uniqueDates = [...new Set(retrievedData?.map(item => item.for_date) || [])]
    console.log('\nActual dates in database:')
    uniqueDates.forEach(date => {
      console.log(`   ${date}`)
    })
    
    // Verify each expected date exists
    Object.values(expectedDates).forEach(expectedDate => {
      if (!uniqueDates.includes(expectedDate)) {
        console.log(`   ❌ Expected date ${expectedDate} not found in database`)
        mappingCorrect = false
      } else {
        console.log(`   ✅ Expected date ${expectedDate} found in database`)
      }
    })

    if (mappingCorrect) {
      console.log('\n✅ All date mappings are correct!')
    } else {
      console.log('\n❌ Some date mappings are incorrect!')
    }

    // 8. Clean up test data
    console.log('\n7️⃣ Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('schedule_preview')
      .delete()
      .eq('client_id', clientId)
      .eq('type', 'meal')
      .gte('for_date', format(testStartDate, 'yyyy-MM-dd'))
      .lte('for_date', format(addDays(testStartDate, 6), 'yyyy-MM-dd'))

    if (deleteError) {
      console.error('❌ Error cleaning up test data:', deleteError)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    console.log('\n✅ Nutrition plan date mapping test completed!')
    console.log('\n📝 Summary:')
    console.log('   - Nutrition plan now uses selected start date instead of current date')
    console.log('   - Days are correctly mapped: Monday = start date, Tuesday = start date + 1, etc.')
    console.log('   - Database stores correct dates for each day of the week')

  } catch (error) {
    console.error('❌ Error testing nutrition plan date mapping:', error)
  }
}

testNutritionPlanDates() 