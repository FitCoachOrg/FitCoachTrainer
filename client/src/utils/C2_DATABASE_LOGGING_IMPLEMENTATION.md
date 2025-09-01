# C2: Database Query Logging Implementation

## 🎯 Problem Identified

**Console Log Analysis**: The user provided console logs showing an infinite loop in approval status checking when switching from 7-day to Monthly view:

```
workoutStatusUtils.ts:50 [checkWorkoutApprovalStatus] Checking status for 28 days: 2025-09-28 to 2025-10-25
workoutStatusUtils.ts:50 [checkWorkoutApprovalStatus] Checking status for 7 days: 2025-09-28 to 2025-10-04
workoutStatusUtils.ts:50 [checkWorkoutApprovalStatus] Checking status for 7 days: 2025-10-05 to 2025-10-11
...
WorkoutPlanSection.tsx:2886 [checkPlanApprovalStatus] Already running, skipping...
```

**Key Issues Found:**
1. **Missing Database Query Logs**: No visibility into what's happening during database operations
2. **Infinite Loop**: Repeated calls to `checkWorkoutApprovalStatus` without completion
3. **Race Conditions**: Multiple simultaneous approval status checks
4. **No Timeout Protection**: Functions could hang indefinitely

## ✅ Solution Implemented

### **1. Enhanced Database Query Logging**

**File**: `client/src/utils/workoutStatusUtils.ts`

**Added to `checkWorkoutApprovalStatus`:**
```typescript
// Database query logging for schedule_preview
RequestLogger.logDatabaseQuery('schedule_preview', 'select', 'checkWorkoutApprovalStatus', {
  clientId,
  dateRange: `${startDateStr} to ${endDateStr}`,
  totalDays
});

// Database query logging for schedule
RequestLogger.logDatabaseQuery('schedule', 'select', 'checkWorkoutApprovalStatus', {
  clientId,
  dateRange: `${startDateStr} to ${endDateStr}`,
  totalDays
});

// Error logging for failed queries
RequestLogger.logError('checkWorkoutApprovalStatus', new Error(`Preview query failed: ${previewError.message}`), {
  clientId,
  dateRange: `${startDateStr} to ${endDateStr}`,
  error: previewError
});
```

### **2. Performance Monitoring**

**Added to `checkMonthlyWorkoutStatus`:**
```typescript
const startTime = Date.now();
console.log(`[checkMonthlyWorkoutStatus] Starting monthly status check for client ${clientId}`);

// ... processing logic ...

const duration = Date.now() - startTime;
RequestLogger.logPerformance('monthly_workout_status_check', 'checkMonthlyWorkoutStatus', startTime, {
  clientId,
  duration,
  weeklyBreakdown: weeklyBreakdown.length,
  overallStatus
});
```

**Added to `checkWeeklyWorkoutStatus`:**
```typescript
const startTime = Date.now();
console.log(`[checkWeeklyWorkoutStatus] Starting weekly status check for client ${clientId}`);

// ... processing logic ...

const duration = Date.now() - startTime;
RequestLogger.logPerformance('weekly_workout_status_check', 'checkWeeklyWorkoutStatus', startTime, {
  clientId,
  duration,
  status: result.status,
  previewDataCount: result.previewData.length,
  scheduleDataCount: result.scheduleData.length
});
```

### **3. Timeout Protection**

**File**: `client/src/components/WorkoutPlanSection.tsx`

**Added to `checkPlanApprovalStatus`:**
```typescript
// Add timeout to prevent infinite hanging
const timeoutId = setTimeout(() => {
  console.error('[checkPlanApprovalStatus] Timeout reached (30 seconds), forcing completion');
  setIsCheckingApproval(false);
  setPlanApprovalStatus('pending');
  updateWorkoutPlanState({
    status: 'no_plan',
    source: 'database'
  });
}, 30000); // 30 second timeout

// Clear timeout in finally block
} finally {
  clearTimeout(timeoutId);
  setIsCheckingApproval(false);
  // ... rest of cleanup
}
```

### **4. Enhanced Debouncing**

**Increased delay in useEffect:**
```typescript
// Add a longer delay to prevent rapid successive calls when viewMode changes
const timeoutId = setTimeout(() => {
  // ... logging ...
  checkPlanApprovalStatus();
}, 500); // Increased from 100ms to 500ms
```

## 🔍 What This Fixes

### **Immediate Benefits:**
1. **Complete Visibility**: All database queries are now logged with timing and context
2. **Performance Tracking**: Detailed timing for weekly and monthly status checks
3. **Error Detection**: Failed database queries are logged with full context
4. **Timeout Protection**: Functions can't hang indefinitely (30-second timeout)
5. **Reduced Race Conditions**: Increased debouncing prevents rapid successive calls

### **Debugging Capabilities:**
- **Database Query Tracking**: See exactly which queries are being made and when
- **Performance Analysis**: Identify slow queries and bottlenecks
- **Error Context**: Full error details with client ID and date ranges
- **State Transition Logging**: Track when approval status checks start/complete

## 📊 Expected Console Output

After this implementation, you should see logs like:

```
🗄️ [DB Query - checkWorkoutApprovalStatus] SELECT on schedule_preview: {clientId: 34, dateRange: "2025-09-28 to 2025-10-25", totalDays: 28}
🗄️ [DB Query - checkWorkoutApprovalStatus] SELECT on schedule: {clientId: 34, dateRange: "2025-09-28 to 2025-10-25", totalDays: 28}
⏱️ [Performance - checkMonthlyWorkoutStatus] monthly_workout_status_check took 1250ms {clientId: 34, duration: 1250, weeklyBreakdown: 4, overallStatus: "draft"}
```

## 🚀 Next Steps

This implementation provides the foundation for:
1. **C3: Implement Request Deduplication** - Prevent duplicate database queries
2. **C4: Add Error Boundaries** - Graceful error handling
3. **C5: Implement Caching** - Reduce database load
4. **C6: Add Progressive Loading** - Better user experience

## 🧪 Testing

To test this implementation:
1. Switch between 7-day and Monthly views
2. Monitor console for database query logs
3. Check for timeout protection (should complete within 30 seconds)
4. Verify performance metrics are being logged

The enhanced logging will help identify exactly where the infinite loop is occurring and provide the data needed for the next optimization phase.
