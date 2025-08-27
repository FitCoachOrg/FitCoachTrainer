// Test AI Analysis Generation
// Run with: node test-ai-analysis.js

const testNotes = `Date: 2024-01-15
Notes: Client completed 3 workout sessions this week. Feeling good about progress but mentioned some shoulder discomfort during overhead presses. Reduced volume on upper body work. Sleep has been inconsistent - averaging 6 hours per night.

Date: 2024-01-12
Notes: Client showed up for scheduled session. Completed full workout with good form. RPE was 6-7 throughout. Asked about nutrition - mentioned inconsistent meal timing.

Date: 2024-01-10
Notes: Missed scheduled session due to work conflict. Rescheduled for tomorrow. Client mentioned feeling tired lately - suggested focusing on recovery.`;

const testClientInfo = {
  cl_name: "Test Client",
  cl_primary_goal: "Build muscle",
  training_experience: "Beginner",
  training_days_per_week: 3,
  goal_timeline: "3 months"
};

console.log('🧪 Testing AI Analysis Generation...');
console.log('📝 Test Notes Length:', testNotes.length);
console.log('👤 Test Client:', testClientInfo.cl_name);
console.log('🎯 Expected: Should generate 1-3 concise actions');

// Simulate the filterRecentNotes function
function filterRecentNotes(notesString) {
  if (!notesString || notesString.trim().length === 0) {
    return "No trainer notes available.";
  }

  try {
    // Try to parse as JSON first (structured notes format)
    const parsedNotes = JSON.parse(notesString);
    if (Array.isArray(parsedNotes)) {
      // Filter to last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentNotes = parsedNotes.filter((note) => {
        if (note.date) {
          const noteDate = new Date(note.date);
          return noteDate >= twoWeeksAgo;
        }
        return false; // Skip notes without dates
      });

      if (recentNotes.length === 0) {
        return "No trainer notes from the last 2 weeks.";
      }

      // Convert back to readable format
      return recentNotes.map((note) =>
        `Date: ${note.date}\nNotes: ${note.notes}`
      ).join('\n\n');
    }
  } catch (error) {
    // If not JSON, treat as plain text
    console.log('📝 Notes are plain text');
  }

  // For plain text, return as-is but add instruction for LLM
  return notesString;
}

// Test the filtering
const filteredNotes = filterRecentNotes(testNotes);
console.log('\n📋 Filtered Notes:');
console.log(filteredNotes);
console.log('📏 Filtered Length:', filteredNotes.length);

console.log('\n✅ Test Complete - Check if notes are properly filtered and meet minimum length (20 chars)');
