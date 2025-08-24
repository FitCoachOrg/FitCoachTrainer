// Test time parsing logic for client 40
function testTimeParsing() {
  console.log('🧪 === TESTING TIME PARSING FOR CLIENT 40 ===\n');
  
  const timeStr = "15_30"; // Client 40's training time
  
  console.log(`📊 Testing time format: "${timeStr}"`);
  
  let sessionMinutes = 45; // Default fallback
  
  // Handle various time formats
  if (timeStr) {
    // Format: "45_minutes"
    const minutesMatch = timeStr.match(/(\d+)_minutes/);
    if (minutesMatch) {
      sessionMinutes = parseInt(minutesMatch[1]);
      console.log(`✅ Parsed as minutes format: ${sessionMinutes} minutes`);
    }
    // Format: "30_45" (range format)
    else if (timeStr.includes('_')) {
      const rangeMatch = timeStr.match(/(\d+)_(\d+)/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1]);
        const max = parseInt(rangeMatch[2]);
        sessionMinutes = Math.round((min + max) / 2); // Use average
        console.log(`✅ Parsed as range format: ${min}-${max} minutes, using average: ${sessionMinutes} minutes`);
      }
    }
    // Format: just a number
    else if (!isNaN(parseInt(timeStr))) {
      sessionMinutes = parseInt(timeStr);
      console.log(`✅ Parsed as number format: ${sessionMinutes} minutes`);
    }
  }
  
  console.log(`\n📊 FINAL RESULT: ${sessionMinutes} minutes`);
  console.log(`📈 Expected session time for client 40: ${sessionMinutes} minutes`);
  console.log(`📊 Expected total weekly time: ${sessionMinutes * 4} minutes (4 days)`);
  
  // Test other formats for comparison
  console.log('\n🔍 TESTING OTHER TIME FORMATS:');
  
  const testFormats = [
    "45_minutes",
    "30_45", 
    "60",
    "15_30"
  ];
  
  testFormats.forEach(format => {
    let testMinutes = 45;
    
    if (format.includes('_minutes')) {
      const match = format.match(/(\d+)_minutes/);
      if (match) testMinutes = parseInt(match[1]);
    } else if (format.includes('_')) {
      const match = format.match(/(\d+)_(\d+)/);
      if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        testMinutes = Math.round((min + max) / 2);
      }
    } else if (!isNaN(parseInt(format))) {
      testMinutes = parseInt(format);
    }
    
    console.log(`   "${format}" → ${testMinutes} minutes`);
  });
}

testTimeParsing();
