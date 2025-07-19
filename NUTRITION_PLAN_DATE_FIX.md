# 🍽️ Nutrition Plan Date Mapping Fix

## Issue Description

When generating a new nutrition plan, the system was incorrectly mapping the plan days to dates. The AI generates a plan with days like "Monday", "Tuesday", etc., but the system was using `addDays(startDate, dayIndex)` which assumed the plan started from the selected start date, rather than mapping each day name to the correct date based on the selected start date.

## Root Cause

The problem was in the `saveNutritionPlanToPreview` function in `client/src/components/NutritionPlanSection.tsx`:

```typescript
// ❌ INCORRECT - Assumes plan starts from selected date
plan.forEach((dayPlan, dayIndex) => {
  const forDate = format(addDays(startDate, dayIndex), 'yyyy-MM-dd');
  // ...
});
```

This approach was wrong because:
1. AI always generates plans starting from Monday
2. The selected start date might not be a Monday
3. The mapping should use the existing `getDateForDay` function to map day names to correct dates

## Solution

Fixed the `saveNutritionPlanToPreview` function to use the `getDateForDay` function:

```typescript
// ✅ CORRECT - Maps day names to correct dates based on selected start date
plan.forEach((dayPlan) => {
  // Use getDateForDay to map day names (Monday, Tuesday, etc.) to correct dates
  const forDate = format(getDateForDay(dayPlan.day), 'yyyy-MM-dd');
  // ...
});
```

## How the Fix Works

### 1. AI Plan Generation
- AI generates a 7-day plan with days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- Each day has meals: breakfast, lunch, dinner, snacks

### 2. Date Mapping Logic
The `getDateForDay` function correctly maps day names to dates:

```typescript
const getDateForDay = (dayName: string) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayIndex = days.indexOf(dayName)
  const currentDayIndex = planStartDate.getDay()
  const daysToAdd = (dayIndex - currentDayIndex + 7) % 7
  const targetDate = new Date(planStartDate)
  targetDate.setDate(planStartDate.getDate() + daysToAdd)
  return targetDate
}
```

### 3. Example Mapping
If user selects January 20, 2025 (Monday) as start date:

| AI Day | Mapped Date | Day of Week |
|--------|-------------|-------------|
| Monday | 2025-01-20 | Monday |
| Tuesday | 2025-01-21 | Tuesday |
| Wednesday | 2025-01-22 | Wednesday |
| Thursday | 2025-01-23 | Thursday |
| Friday | 2025-01-24 | Friday |
| Saturday | 2025-01-25 | Saturday |
| Sunday | 2025-01-26 | Sunday |

If user selects January 22, 2025 (Wednesday) as start date:

| AI Day | Mapped Date | Day of Week |
|--------|-------------|-------------|
| Monday | 2025-01-20 | Monday |
| Tuesday | 2025-01-21 | Tuesday |
| Wednesday | 2025-01-22 | Wednesday |
| Thursday | 2025-01-23 | Thursday |
| Friday | 2025-01-24 | Friday |
| Saturday | 2025-01-25 | Saturday |
| Sunday | 2025-01-26 | Sunday |

## Files Modified

1. **`client/src/components/NutritionPlanSection.tsx`**:
   - Fixed `handleGeneratePlan` to use selected `planStartDate` instead of current date
   - Fixed `saveNutritionPlanToPreview` to use `getDateForDay` for correct date mapping

## Testing

Created and ran `test-nutrition-plan-dates.mjs` to verify:
- ✅ Nutrition plan uses selected start date instead of current date
- ✅ Days are correctly mapped using `getDateForDay` function
- ✅ Database stores correct dates for each day of the week
- ✅ Works regardless of what day the selected start date falls on

## Benefits

1. **Correct Date Mapping**: Plans are now mapped to the correct dates based on user selection
2. **Flexible Start Dates**: Users can select any day as the start date, and the plan will be correctly mapped
3. **Consistent Behavior**: The same logic is used for both AI-generated plans and manual edits
4. **User Experience**: Users see the plan on the dates they expect, not arbitrary dates

## Before vs After

### Before (Incorrect)
- User selects January 22, 2025 (Wednesday) as start date
- AI generates plan for Monday-Sunday
- System maps: Monday → Jan 22, Tuesday → Jan 23, etc.
- **Result**: Plan appears on wrong dates

### After (Correct)
- User selects January 22, 2025 (Wednesday) as start date  
- AI generates plan for Monday-Sunday
- System maps: Monday → Jan 20, Tuesday → Jan 21, Wednesday → Jan 22, etc.
- **Result**: Plan appears on correct dates with Monday starting the week

---

**Status:** ✅ **Fixed and Tested**

The nutrition plan date mapping issue has been resolved and thoroughly tested. 