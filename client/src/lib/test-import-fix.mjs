import { parseCSVFile, validateImportedData } from './workout-import-utils.ts';

// Test CSV content
const testCSV = `Date,Day,Focus,Exercise,Category,Body Part,Sets,Reps,Duration (min),Rest (sec),Weight,Equipment,Coach Tip,Video Link,Other Details
2024-01-15,Monday,Upper Body Strength,Push-ups,Strength,Chest,3,10-12,5,60,Bodyweight,None,Keep your core tight and maintain proper form,https://example.com/pushups,
2024-01-16,Tuesday,Lower Body Strength,Squats,Strength,Legs,4,12-15,8,120,Bodyweight,None,Keep your knees behind your toes and chest up,https://example.com/squats,
2024-01-17,Wednesday,Cardio,Running,Cardio,Full Body,1,30 minutes,30,0,Bodyweight,None,Maintain steady pace throughout the run,,`;

console.log('Testing CSV parsing...');

try {
  // Parse CSV
  const exercises = parseCSVFile(testCSV);
  console.log('Parsed exercises:', exercises.length);
  console.log('First exercise:', exercises[0]);
  
  // Validate data
  const validation = validateImportedData(exercises);
  console.log('Validation result:', validation);
  
  if (validation.isValid) {
    console.log('✅ Import validation passed!');
  } else {
    console.log('❌ Import validation failed:', validation.errors);
  }
  
} catch (error) {
  console.error('❌ Error during import:', error);
} 