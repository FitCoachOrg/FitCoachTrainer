# Nutrition Plan Approval Status Fix

## Issue Description

When users approved a nutrition plan on the nutrition plan screen, the status indicator would not change immediately. Users had to refresh the screen to see the updated "Approved Plan" status.

## Root Cause Analysis

The issue was caused by a **race condition and incorrect status setting** in the `fetchNutritionPlanFromSupabase` function:

1. **Hardcoded Status Setting**: The `fetchNutritionPlanFromSupabase` function was hardcoding the approval status to `'not_approved'` for preview data, regardless of the actual approval state.

2. **Race Condition**: After approval, the function would call `fetchNutritionPlanFromSupabase` which would override the correctly set approval status.

3. **Timing Issues**: The approval process would set the status correctly, but then immediately fetch data again, which would reset the status incorrectly.

## Code Changes Made

### 1. Fixed `fetchNutritionPlanFromSupabase` Function

**Before:**
```typescript
// Set approval status based on data source
if (dataSource === 'preview') {
  setApprovalStatus('not_approved');  // ← This was the problem!
  toast({ title: "Preview Plan Loaded", description: "Nutrition plan from preview has been loaded. Changes will be auto-saved." });
} else {
  setApprovalStatus('pending');
  toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
}
```

**After:**
```typescript
// Don't set approval status here - let checkApprovalStatus handle it
if (dataSource === 'preview') {
  toast({ title: "Preview Plan Loaded", description: "Nutrition plan from preview has been loaded. Changes will be auto-saved." });
} else {
  toast({ title: "No Plan Found", description: "No nutrition plan found for the selected week. You can generate a new one." });
}
```

### 2. Improved Approval Process

**Before:**
```typescript
toast({ title: "Plan Approved", description: "The nutrition plan has been approved and saved to the main schedule." });
// Force refresh after approval
typeof window !== 'undefined' && setTimeout(async () => {
  await checkApprovalStatus();
  await fetchNutritionPlanFromSupabase(clientId, planStartDate);
  // Force re-render by updating state
  setMealItems({ ...mealItems });
  setSelectedDay(selectedDay);
}, 300);
```

**After:**
```typescript
toast({ title: "Plan Approved", description: "The nutrition plan has been approved and saved to the main schedule." });
// Update status immediately after approval
setApprovalStatus('approved');
// Force refresh after approval with a small delay to ensure database consistency
setTimeout(async () => {
  await checkApprovalStatus();
  await fetchNutritionPlanFromSupabase(clientId, planStartDate);
  setIsApprovalInProgress(false);
}, 100);
```

### 3. Added Approval Progress Tracking

Added a new state variable to prevent race conditions:

```typescript
const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
```

### 4. Updated useEffect Hooks

Modified the data loading and status checking effects to respect the approval progress flag:

```typescript
// Data loading effect
useEffect(() => {
  // Only fetch from the database if we are not in the middle of reviewing a newly generated plan or approving
  if (clientId && isActive && !generatedPlan && !isApprovalInProgress) {
    fetchNutritionPlanFromSupabase(clientId, planStartDate);
  }
}, [clientId, isActive, planStartDate, generatedPlan, isApprovalInProgress]);

// Check approval status when component loads or planStartDate changes
useEffect(() => {
  if (clientId && isActive && !isApprovalInProgress) {
    checkApprovalStatus();
  }
}, [clientId, isActive, planStartDate, isApprovalInProgress]);
```

## How the Fix Works

1. **Immediate Status Update**: When a plan is approved, the status is immediately set to `'approved'` in the UI.

2. **Prevented Race Conditions**: The `isApprovalInProgress` flag prevents other effects from overriding the approval status during the approval process.

3. **Proper Status Calculation**: The `checkApprovalStatus` function now properly calculates the status based on the actual `is_approved` values in the database.

4. **Consistent Data Flow**: The approval status is now consistently managed by the `checkApprovalStatus` function, not by the data loading function.

## Testing

A test script (`test-nutrition-approval-fix.mjs`) has been created to verify that:
- The approval process correctly updates the database
- The status calculation works properly
- The data flow is consistent

## Summary

The fix ensures that:
- ✅ Status updates immediately when a plan is approved
- ✅ No race conditions between data loading and status checking
- ✅ Consistent status calculation based on actual database state
- ✅ Better user experience with immediate feedback
- ✅ No need for page refresh to see status changes

## Files Modified

- `client/src/components/NutritionPlanSection.tsx` - Main component with approval logic
- `test-nutrition-approval-fix.mjs` - Test script for verification
- `NUTRITION_PLAN_APPROVAL_STATUS_FIX.md` - This documentation
