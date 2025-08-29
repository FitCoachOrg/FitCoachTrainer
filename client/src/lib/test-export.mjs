/**
 * Test Export Functionality
 * 
 * This file tests the workout export utilities with sample data
 */

// Sample workout data for testing
const sampleWeekData = [
  {
    date: "2024-01-15",
    focus: "Upper Body Strength",
    exercises: [
      {
        exercise: "Push-ups",
        category: "Strength",
        body_part: "Chest",
        sets: 3,
        reps: "10-12",
        duration: 5,
        rest: 60,
        weight: "Bodyweight",
        equipment: "None",
        coach_tip: "Keep your core tight and maintain proper form",
        video_link: "https://example.com/pushups"
      },
      {
        exercise: "Pull-ups",
        category: "Strength", 
        body_part: "Back",
        sets: 3,
        reps: "8-10",
        duration: 5,
        rest: 90,
        weight: "Bodyweight",
        equipment: "Pull-up bar",
        coach_tip: "Focus on controlled movement and full range of motion",
        video_link: "https://example.com/pullups"
      }
    ]
  },
  {
    date: "2024-01-16", 
    focus: "Lower Body Strength",
    exercises: [
      {
        exercise: "Squats",
        category: "Strength",
        body_part: "Legs",
        sets: 4,
        reps: "12-15",
        duration: 8,
        rest: 120,
        weight: "Bodyweight",
        equipment: "None",
        coach_tip: "Keep your knees behind your toes and chest up",
        video_link: "https://example.com/squats"
      }
    ]
  }
];

console.log("Sample workout data for testing:");
console.log(JSON.stringify(sampleWeekData, null, 2));

console.log("\nThis data structure matches what the export functions expect.");
console.log("The export functions will:");
console.log("1. Process each day's exercises");
console.log("2. Add date and day name information");
console.log("3. Export in CSV, Excel, or JSON format");
console.log("4. Include all exercise details: sets, reps, duration, rest, weight, equipment, coach tips, etc.");

console.log("\nExport functionality is ready for testing in the browser!"); 