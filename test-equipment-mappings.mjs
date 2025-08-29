import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test the new equipment mappings
async function testEquipmentMappings() {
  console.log('🧪 === TESTING EQUIPMENT MAPPINGS ===\n');

  // Test data for different equipment types
  const testEquipment = [
    'bodyweight',
    'dumbbells',
    'barbell',
    'resistance_bands',
    'kettlebells',
    'cardio_machines',
    'yoga_mat',
    'full_gym'
  ];

  // Equipment mapping from the enhanced generator
  const EQUIPMENT_MAPPING = {
    "bodyweight": ["bodyweight"],
    "dumbbells": ["dumbbell"],
    "barbell": ["barbell", "bench"], // Includes bench as accessory for barbell moves
    "resistance_bands": ["bands"],
    "kettlebells": ["kettlebell"],
    "cardio_machines": ["cardio_machine", "machine", "bike", "rower", "treadmill", "elliptical", "stair"],
    "yoga_mat": ["bodyweight", "stability ball"], // Proxy for floor/core work
    "full_gym": ["barbell", "dumbbell", "cable", "machine", "bench", "kettlebell", "bands", "bodyweight", "cardio_machine"]
  };

  for (const equipment of testEquipment) {
    console.log(`📦 Testing equipment: "${equipment}"`);
    
    // Get the mapped tokens
    const mappedTokens = EQUIPMENT_MAPPING[equipment] || [];
    console.log(`   → Mapped to: [${mappedTokens.map(token => `"${token}"`).join(', ')}]`);
    
    // Test cardio machine special handling
    if (equipment === 'cardio_machines') {
      const hasCardioMachines = mappedTokens.some(eq => 
        ["cardio_machine", "bike", "rower", "treadmill", "elliptical", "stair"].includes(eq)
      );
      console.log(`   🏃‍♂️ Cardio machine detection: ${hasCardioMachines ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
    }
    
    // Test yoga mat special handling
    if (equipment === 'yoga_mat') {
      const hasBodyweight = mappedTokens.includes('bodyweight');
      const hasStabilityBall = mappedTokens.includes('stability ball');
      console.log(`   🧘‍♀️ Yoga mat proxy: bodyweight=${hasBodyweight}, stability_ball=${hasStabilityBall}`);
    }
    
    // Test barbell bench inclusion
    if (equipment === 'barbell') {
      const hasBarbell = mappedTokens.includes('barbell');
      const hasBench = mappedTokens.includes('bench');
      console.log(`   🏋️‍♂️ Barbell + bench: barbell=${hasBarbell}, bench=${hasBench}`);
    }
    
    console.log('');
  }

  // Test equipment parsing logic
  console.log('🔧 === TESTING EQUIPMENT PARSING LOGIC ===\n');
  
  const testClientEquipment = ['cardio_machines', 'dumbbells'];
  console.log(`📋 Test client equipment: [${testClientEquipment.map(eq => `"${eq}"`).join(', ')}]`);
  
  // Simulate the parsing logic
  const availableEquipment = [];
  testClientEquipment.forEach((item) => {
    const equipmentTokens = EQUIPMENT_MAPPING[item] || [];
    availableEquipment.push(...equipmentTokens);
  });
  
  console.log(`   → Parsed equipment tokens: [${availableEquipment.map(eq => `"${eq}"`).join(', ')}]`);
  
  // Test cardio machine detection
  const hasCardioMachines = testClientEquipment.includes("cardio_machines") || 
    availableEquipment.some(eq => 
      ["cardio_machine", "bike", "rower", "treadmill", "elliptical", "stair"].includes(eq)
    );
  
  console.log(`   🏃‍♂️ Cardio machine detection: ${hasCardioMachines ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
  
  if (hasCardioMachines) {
    console.log(`   📝 Should inject Conditioning/Cardio focus`);
  }

  console.log('\n✅ Equipment mapping test completed!');
}

// Test the changes
testEquipmentMappings().catch(console.error);
