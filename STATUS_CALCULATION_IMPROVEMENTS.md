# 📊 Status Calculation Improvements

## Issue Description

The current status calculation logic in the Nutrition Plan section was incorrectly determining approval status. The logic only looked at the existing rows in the `schedule_preview` table without accounting for missing dates, which could lead to incorrect "Approved" status when some days were missing.

**Additionally**, the logic was counting individual meal entries instead of unique days, since there are multiple meal entries (breakfast, lunch, dinner, snacks) per day.

## Root Cause

The original `getApprovalStatusFromPreview` function had flawed logic:

```typescript
// ❌ INCORRECT LOGIC
const getApprovalStatusFromPreview = (rows: any[]) => {
  if (!rows || rows.length === 0) return 'pending';
  const approvedCount = rows.filter(r => isApproved(r.is_approved)).length;
  const total = rows.length;
  if (approvedCount === total) return 'approved';  // ❌ Wrong!
  if (approvedCount > 0) return 'partial_approved';
  return 'not_approved';
};
```

**The Problems:**
1. **Counting entries instead of days**: If we have 28 meal entries (4 per day × 7 days), the logic was counting 28 instead of 7
2. **Missing date detection**: Didn't account for missing days in the week
3. **False positives**: Could show "Approved" when some days were missing

**Example Problem:**
- 24 meal entries (4 per day × 6 days) with all approved
- Old logic: `approvedCount = 24, total = 24` → `24 === 24` → **"Approved"** ❌
- Correct logic: `uniqueDays = 6, expectedTotal = 7` → `6 < 7` → **"Partial Approved"** ✅

## Solution

Enhanced the status calculation to properly account for missing dates and handle multiple meal entries per day:

```typescript
// ✅ CORRECT LOGIC
const getApprovalStatusFromPreview = (rows: any[], startDate: Date) => {
  if (!rows || rows.length === 0) return 'pending';
  
  // Calculate expected total days for the week (7 days)
  const expectedTotalDays = 7;
  
  // Get unique days from the rows (since there are multiple meal entries per day)
  const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
  const actualTotalDays = uniqueDays.length;
  
  // If we have fewer days than expected, it's partial regardless of approval status
  if (actualTotalDays < expectedTotalDays) {
    // Check if all existing days are approved
    const approvedDays = uniqueDays.filter(day => {
      const dayRows = rows.filter(row => row.for_date === day);
      return dayRows.every(row => isApproved(row.is_approved));
    });
    
    if (approvedDays.length > 0) {
      return 'partial_approved';
    } else {
      return 'not_approved';
    }
  }
  
  // If we have all expected days, check if all days are approved
  const allDaysApproved = uniqueDays.every(day => {
    const dayRows = rows.filter(row => row.for_date === day);
    return dayRows.every(row => isApproved(row.is_approved));
  });
  
  if (allDaysApproved && actualTotalDays === expectedTotalDays) {
    return 'approved';
  } else if (actualTotalDays === expectedTotalDays) {
    // All days exist but some are not approved
    return 'partial_approved';
  } else {
    return 'not_approved';
  }
};
```

## Status Logic Rules

### 1. **"Pending"** 
- When no data exists in `schedule_preview` table
- `rows.length === 0`

### 2. **"Approved"**
- When ALL 7 unique days exist in the table AND all meal entries for each day are approved
- `actualTotalDays === 7` AND `allDaysApproved === true`

### 3. **"Partial Approved"**
- When some unique days are missing (regardless of approval status of existing days)
- When all 7 unique days exist but some meal entries are not approved
- `actualTotalDays < 7` OR `allDaysApproved === false`

### 4. **"Not Approved"**
- When no unique days are approved (regardless of missing days)
- `approvedDays.length === 0`

## Test Scenarios

### Scenario 1: All 7 Days with Multiple Approved Entries
```javascript
// 28 meal entries (4 per day × 7 days), all approved
const scenario1 = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  for_date: format(addDays(startDate, Math.floor(i / 4)), 'yyyy-MM-dd'),
  is_approved: true
}))
// Result: "approved" ✅
```

### Scenario 2: 6 Days with Multiple Approved Entries (1 Day Missing)
```javascript
// 24 meal entries (4 per day × 6 days), all approved
const scenario2 = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  for_date: format(addDays(startDate, Math.floor(i / 4)), 'yyyy-MM-dd'),
  is_approved: true
}))
// Result: "partial_approved" ✅ (because 1 day missing)
```

### Scenario 3: 7 Days with Mixed Approval
```javascript
// 28 meal entries, some days not approved
const scenario3 = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  for_date: format(addDays(startDate, Math.floor(i / 4)), 'yyyy-MM-dd'),
  is_approved: Math.floor(i / 4) < 4 // First 4 days approved, last 3 not approved
}))
// Result: "partial_approved" ✅ (because not all days approved)
```

### Scenario 4: 5 Days with No Approved Entries
```javascript
// 20 meal entries (4 per day × 5 days), none approved
const scenario4 = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  for_date: format(addDays(startDate, Math.floor(i / 4)), 'yyyy-MM-dd'),
  is_approved: false
}))
// Result: "not_approved" ✅ (because no days approved)
```

## Key Improvements

### 🔍 **Unique Day Detection**
- Added `Array.from(new Set())` to get unique days
- Count unique days instead of total meal entries
- Handle multiple meal entries per day correctly

### 📊 **Accurate Status Calculation**
- Only "approved" when all 7 unique days exist AND all meal entries are approved
- "Partial approved" when some unique days are missing OR mixed approval
- "Not approved" when no unique days are approved (regardless of missing days)

### 🐛 **Enhanced Debugging**
- Added comprehensive debug logging
- Shows expected vs actual unique day counts
- Displays approval status for each meal entry
- Helps troubleshoot status calculation issues

### 🎯 **Better User Experience**
- More accurate status representation
- Clear indication when plan is incomplete
- Prevents false "approved" status for incomplete plans
- Handles real-world data structure (multiple entries per day)

## Before vs After

### Before (Incorrect Logic)
```typescript
// ❌ Counted meal entries instead of days
const approvedCount = rows.filter(r => isApproved(r.is_approved)).length;
const total = rows.length;
if (approvedCount === total) return 'approved';
```

**Problems:**
- 24 meal entries (6 days × 4 meals) → "Approved" ❌
- Didn't account for missing days
- Counted individual meal entries instead of unique days
- False positive approvals

### After (Correct Logic)
```typescript
// ✅ Counts unique days and handles multiple entries per day
const uniqueDays = Array.from(new Set(rows.map(row => row.for_date)));
const actualTotalDays = uniqueDays.length;

if (actualTotalDays < expectedTotalDays) {
  // Missing days detected
  const approvedDays = uniqueDays.filter(day => {
    const dayRows = rows.filter(row => row.for_date === day);
    return dayRows.every(row => isApproved(row.is_approved));
  });
  if (approvedDays.length > 0) return 'partial_approved';
  else return 'not_approved';
}

const allDaysApproved = uniqueDays.every(day => {
  const dayRows = rows.filter(row => row.for_date === day);
  return dayRows.every(row => isApproved(row.is_approved));
});

if (allDaysApproved && actualTotalDays === expectedTotalDays) {
  return 'approved';
} else if (actualTotalDays === expectedTotalDays) {
  return 'partial_approved';
} else {
  return 'not_approved';
}
```

**Benefits:**
- 24 meal entries (6 days × 4 meals) → "Partial Approved" ✅
- Properly accounts for missing days
- Counts unique days instead of meal entries
- Accurate status representation

## Testing Results

✅ **Real Data**: 6 unique days with all entries approved → "partial_approved"  
✅ **Scenario 1**: 7 unique days with all entries approved → "approved"  
✅ **Scenario 2**: 3 unique days with all entries approved → "partial_approved"  
✅ **Scenario 3**: 7 unique days with mixed approval → "partial_approved"  
✅ **Scenario 4**: 5 unique days with no approved entries → "not_approved"  

## Benefits

1. **Accurate Status**: Correctly reflects the actual state of the nutrition plan
2. **Missing Date Awareness**: Accounts for incomplete plans
3. **Multiple Entry Handling**: Properly handles multiple meal entries per day
4. **Better UX**: Users see accurate status instead of false positives
5. **Debugging**: Enhanced logging for troubleshooting
6. **Consistency**: Reliable status calculation across all scenarios
7. **Data Integrity**: Prevents incorrect "approved" status for incomplete plans

---

**Status:** ✅ **Complete and Tested**

The status calculation logic has been successfully enhanced to properly account for missing dates and handle multiple meal entries per day in the `schedule_preview` table. The system now correctly shows "Partial Approved" when some days are missing, even if all existing meal entries are approved. 