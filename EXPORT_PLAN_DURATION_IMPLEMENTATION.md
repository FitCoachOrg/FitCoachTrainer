# Export Plan Duration Implementation

## Overview

This implementation adds support for exporting workout plans based on the user's selected plan duration (7-day vs 30-day). The export functionality now respects the `viewMode` setting and exports the appropriate amount of data with clear duration indicators.

## Changes Made

### 1. **Updated Export Utilities** (`client/src/lib/workout-export-utils.ts`)

#### **Enhanced Functions:**
- `prepareWorkoutPlanForExport()` - Added `viewMode` parameter
- `exportWorkoutPlanAsCSV()` - Added `viewMode` parameter and duration indicators
- `exportWorkoutPlanAsExcel()` - Added `viewMode` parameter and enhanced summaries
- `exportWorkoutPlanAsJSON()` - Added `viewMode` parameter and metadata
- `generateExportFilename()` - Added `viewMode` parameter for filename generation

#### **Key Features Added:**
- **Duration Detection**: Automatically detects if user selected 7-day (weekly) or 30-day (monthly) view
- **Smart Data Processing**: Processes the correct number of days based on view mode
- **Enhanced Filenames**: Files include `_7day` or `_30day` suffix for clarity
- **Improved Metadata**: Export includes plan duration information
- **Better Summaries**: Excel exports include appropriate summary sheets

### 2. **Updated Export Button Component** (`client/src/components/WorkoutExportButton.tsx`)

#### **New Features:**
- **Dynamic Button Text**: Shows "Export 7-Day Plan" or "Export 30-Day Plan"
- **Duration-Aware Messages**: Success messages include duration information
- **Enhanced UI**: Wider dropdown menu to accommodate longer text
- **ViewMode Integration**: Accepts and passes `viewMode` parameter to export functions

#### **Props Added:**
```typescript
interface WorkoutExportButtonProps {
  // ... existing props
  viewMode?: 'weekly' | 'monthly'; // New prop
}
```

### 3. **Updated WorkoutPlanSection** (`client/src/components/WorkoutPlanSection.tsx`)

#### **Integration Changes:**
- **Data Source**: Export button now uses `getTableData()` instead of `workoutPlan.week`
- **ViewMode Passing**: Passes current `viewMode` state to export button
- **Consistent Data**: Ensures export uses the same data as the displayed table

## How It Works

### **7-Day (Weekly) Export:**
- **Data Range**: 7 days from plan start date
- **Filename**: `workout_plan_ClientName_2024-01-15_7day.csv`
- **Excel Sheets**: Overview, Exercises, Weekly Summary
- **Metadata**: "7-Day (1 Week)" duration indicator

### **30-Day (Monthly) Export:**
- **Data Range**: 28 days (4 weeks) from plan start date
- **Filename**: `workout_plan_ClientName_2024-01-15_30day.csv`
- **Excel Sheets**: Overview, Exercises, Monthly Summary (with week numbers)
- **Metadata**: "30-Day (4 Weeks)" duration indicator

## User Experience

### **Visual Indicators:**
1. **Button Text**: Dynamically shows current plan duration
   - "Export 7-Day Plan" for weekly view
   - "Export 30-Day Plan" for monthly view

2. **Success Messages**: Include duration information
   - "Your 7-day workout plan has been exported as CSV"
   - "Your 30-day workout plan has been exported as CSV"

3. **File Names**: Clear duration indicators in filenames
   - `_7day` suffix for weekly exports
   - `_30day` suffix for monthly exports

### **Data Accuracy:**
- **Weekly View**: Exports exactly 7 days of workout data
- **Monthly View**: Exports exactly 28 days (4 weeks) of workout data
- **Consistent Data**: Export matches what user sees in the interface

## Technical Implementation

### **Data Flow:**
```
User selects view mode (7-day/30-day)
    ↓
WorkoutPlanSection passes viewMode to WorkoutExportButton
    ↓
WorkoutExportButton passes viewMode to export functions
    ↓
Export functions process appropriate data range
    ↓
Files generated with duration indicators
```

### **Key Functions:**
```typescript
// Determine days to process
const totalDays = viewMode === 'monthly' ? 28 : 7;

// Calculate plan end date
const daysToAdd = viewMode === 'monthly' ? 27 : 6;
const planEndDate = new Date(planStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

// Generate filename with duration indicator
const durationSuffix = viewMode === 'monthly' ? '_30day' : '_7day';
const fileName = `workout_plan_${clientName}_${date}${durationSuffix}.${format}`;
```

## Benefits

### **For Users:**
- **Clear Expectations**: Users know exactly what duration they're exporting
- **Accurate Data**: Export matches the current view mode
- **Organized Files**: Filenames clearly indicate plan duration
- **Better Documentation**: Excel exports include appropriate summaries

### **For Trainers:**
- **Flexible Export**: Can export both short-term (7-day) and long-term (30-day) plans
- **Professional Output**: Well-organized files with clear metadata
- **Data Integrity**: Export data matches displayed data exactly

## Testing

### **Build Verification:**
- ✅ TypeScript compilation successful
- ✅ No type errors or warnings
- ✅ All export functions properly typed

### **Functionality Testing:**
- ✅ 7-day export generates correct data range
- ✅ 30-day export generates correct data range
- ✅ Filenames include appropriate duration indicators
- ✅ Excel summaries adapt to view mode
- ✅ JSON metadata includes duration information

## Future Enhancements

### **Potential Improvements:**
1. **Custom Duration**: Allow users to select custom export ranges
2. **Batch Export**: Export multiple clients' plans with duration selection
3. **Template Export**: Export empty templates for different durations
4. **Progress Tracking**: Include progress/completion data in exports
5. **Client Notes**: Include trainer notes and client feedback in exports

## Summary

The export functionality now fully supports both 7-day and 30-day plan durations, providing users with accurate, well-organized exports that match their current view mode. The implementation is robust, user-friendly, and maintains data integrity while providing clear visual indicators of the exported plan duration.
