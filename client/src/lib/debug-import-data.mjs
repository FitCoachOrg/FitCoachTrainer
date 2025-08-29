/**
 * Debug Import Data Structure
 * 
 * This script helps debug the import data structure to understand
 * why rest and duration fields might not be showing up correctly.
 */

// Sample data from the console log
const sampleImportedData = {
  "client_id": 34,
  "type": "workout",
  "task": "workout",
  "icon": "dumbell",
  "summary": "Lower Body Strength",
  "for_date": "2025-08-06",
  "for_time": "23:00:00",
  "workout_id": "2133221a-598a-4075-823f-d42371c2cffa",
  "details_json": {
    "focus": "Lower Body Strength",
    "exercises": [
      {
        "exercise": "Leg Press",
        "body_part": "Quads, Hamstrings, Glutes",
        "sets": "15",
        "reps": "10",
        "rest": "60",
        "weight": "barbell",
        "duration": "15",
        "equipment": "Leg Press Machine",
        "coach_tip": "2-1-2 tempo, RPE 7-8, keep back straight",
        "video_link": "",
        "tempo": "",
        "order": 1
      }
    ]
  },
  "is_approved": false
};

// Simulate the normalizeExercise function
function normalizeExercise(ex) {
  return {
    ...ex,
    exercise: ex.exercise || ex.exercise_name || ex.name || '',
    category: ex.category || '',
    body_part: ex.body_part || ex.bodyPart || '',
    sets: String(ex.sets ?? ''),
    reps: ex.reps ?? '',
    duration: ex.duration ?? ex.time ?? '',
    weight: ex.weight ?? ex.weights ?? '',
    equipment: ex.equipment ?? '',
    coach_tip: ex.coach_tip ?? ex.tips ?? '',
    rest: ex.rest ?? '',
    video_link: ex.video_link ?? ex.videoLink ?? '',
  };
}

// Test the data processing
console.log('=== DEBUG IMPORT DATA ===');
console.log('Original exercise data:', sampleImportedData.details_json.exercises[0]);
console.log('');

const normalized = normalizeExercise(sampleImportedData.details_json.exercises[0]);
console.log('Normalized exercise data:', normalized);
console.log('');

console.log('Field checks:');
console.log('- rest:', normalized.rest, '(type:', typeof normalized.rest, ')');
console.log('- duration:', normalized.duration, '(type:', typeof normalized.duration, ')');
console.log('');

// Test display logic
const restDisplay = normalized.rest || '-';
const durationDisplay = normalized.duration ? `${normalized.duration} min` : '-';

console.log('Display values:');
console.log('- rest display:', restDisplay);
console.log('- duration display:', durationDisplay);

console.log('=== END DEBUG ==='); 