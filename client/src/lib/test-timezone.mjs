// Test timezone handling functions directly
function localDateToUTC(dateString) {
  const localDate = new Date(dateString + 'T00:00:00');
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
  return utcDate.toISOString().split('T')[0];
}

function normalizeDateForStorage(dateString) {
  if (!dateString.includes('T') || !dateString.includes('Z')) {
    return localDateToUTC(dateString);
  }
  return dateString.split('T')[0];
}

function createDateFromString(dateString) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T00:00:00');
  }
  return new Date(dateString);
}

console.log('Testing timezone handling...');

// Test cases
const testDates = [
  '2025-09-01',
  '2025-09-15',
  '2025-08-05'
];

console.log('Original dates:', testDates);

console.log('\nTesting normalizeDateForStorage:');
testDates.forEach(date => {
  const normalized = normalizeDateForStorage(date);
  console.log(`${date} -> ${normalized}`);
});

console.log('\nTesting createDateFromString:');
testDates.forEach(date => {
  const dateObj = createDateFromString(date);
  console.log(`${date} -> ${dateObj.toISOString()}`);
});

console.log('\nTimezone offset:', new Date().getTimezoneOffset(), 'minutes');
console.log('Current local date:', new Date().toISOString().split('T')[0]); 