# Implementation Plan: Fix Workout Plan Workflow

## Immediate Actions Required

### 1. **Audit Current Data (Client 34, Date 2025-08-31)**

First, let's examine the current state of both tables:

```sql
-- Check schedule_preview data
SELECT client_id, for_date, summary, details_json, is_approved 
FROM schedule_preview 
WHERE client_id = 34 AND for_date = '2025-08-31';

-- Check schedule data  
SELECT client_id, for_date, summary, details_json
FROM schedule 
WHERE client_id = 34 AND for_date = '2025-08-31';
```

### 2. **Fix Status Calculation Logic**

The current `checkPlanApprovalStatus` function needs to be updated to implement the new strategy:

```typescript
// Updated status calculation logic
const checkPlanApprovalStatus = async () => {
  if (!numericClientId || !planStartDate) return;
  
  const startDateStr = format(planStartDate, 'yyyy-MM-dd');
  const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  try {
    // Get data from both tables
    const { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('*')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    // Determine status based on data presence and consistency
    let newStatus: 'no_plan' | 'draft' | 'approved' | 'template' = 'no_plan';
    
    if (!previewData || previewData.length === 0) {
      if (scheduleData && scheduleData.length > 0) {
        // Edge case: approved data exists but no preview
        newStatus = 'approved';
        setPlanApprovalStatus('approved');
        setIsDraftPlan(false);
      } else {
        // No data in either table
        newStatus = 'no_plan';
        setPlanApprovalStatus('pending');
        setIsDraftPlan(false);
      }
    } else {
      // Preview data exists
      if (!scheduleData || scheduleData.length === 0) {
        // Only preview data exists = draft
        newStatus = 'draft';
        setPlanApprovalStatus('not_approved');
        setIsDraftPlan(true);
      } else {
        // Both tables have data - check if they match
        const dataMatches = compareData(previewData, scheduleData);
        if (dataMatches) {
          newStatus = 'approved';
          setPlanApprovalStatus('approved');
          setIsDraftPlan(false);
        } else {
          newStatus = 'draft';
          setPlanApprovalStatus('not_approved');
          setIsDraftPlan(true);
        }
      }
    }
    
    updateWorkoutPlanState({
      status: newStatus,
      source: 'database'
    });
    
  } catch (error) {
    console.error('Error checking approval status:', error);
    setPlanApprovalStatus('pending');
  }
};

// Helper function to compare data between tables
const compareData = (previewData: any[], scheduleData: any[]): boolean => {
  if (previewData.length !== scheduleData.length) return false;
  
  // Sort both arrays by date for comparison
  const sortedPreview = previewData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  const sortedSchedule = scheduleData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  
  for (let i = 0; i < sortedPreview.length; i++) {
    const preview = sortedPreview[i];
    const schedule = sortedSchedule[i];
    
    if (preview.for_date !== schedule.for_date) return false;
    if (JSON.stringify(preview.details_json) !== JSON.stringify(schedule.details_json)) return false;
  }
  
  return true;
};
```

### 3. **Update UI Data Source Logic**

Modify the `fetchPlan` function to always read from `schedule_preview`:

```typescript
const fetchPlan = async () => {
  if (!numericClientId) return;
  
  setLoading('fetching', 'Loading workout plan...');
  setIsFetchingPlan(true);
  
  const startDateStr = format(planStartDate, 'yyyy-MM-dd');
  const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  
  try {
    // ALWAYS fetch from schedule_preview first
    let { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', numericClientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr)
      .order('for_date', { ascending: true });
    
    if (previewError) {
      console.warn('Error fetching from schedule_preview:', previewError);
    }
    
    let data = previewData || [];
    let isFromPreview = true;
    
    // If no preview data, try to get from schedule as fallback
    if (data.length === 0) {
      console.log('No preview data found, checking schedule table...');
      let { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', numericClientId)
        .eq('type', 'workout')
        .gte('for_date', startDateStr)
        .lte('for_date', endDateStr)
        .order('for_date', { ascending: true });
      
      if (!scheduleError && scheduleData && scheduleData.length > 0) {
        data = scheduleData;
        isFromPreview = false;
        console.log('Using schedule data as fallback');
      }
    }
    
    // Process the data and update state
    if (data.length > 0) {
      const weekDates = buildWeekFromData(data, planStartDate);
      const workoutPlan = {
        week: weekDates,
        hasAnyWorkouts: weekDates.some(day => day.exercises && day.exercises.length > 0),
        planStartDate: startDateStr,
        planEndDate: endDateStr
      };
      
      setWorkoutPlan(workoutPlan);
      
      // Update status based on data source
      if (isFromPreview) {
        setIsDraftPlan(true);
        // Check if this matches approved data
        await checkPlanApprovalStatus();
      } else {
        setIsDraftPlan(false);
        setPlanApprovalStatus('approved');
      }
    } else {
      setWorkoutPlan(null);
      setPlanApprovalStatus('pending');
      setIsDraftPlan(false);
    }
    
  } catch (error) {
    console.error('Error fetching plan:', error);
    toast({ title: 'Error', description: 'Failed to load workout plan', variant: 'destructive' });
  } finally {
    setIsFetchingPlan(false);
    clearLoading();
  }
};
```

### 4. **Update Approval Process**

Modify the `approvePlan` function to maintain both tables:

```typescript
const approvePlan = async (clientId: number, planStartDate: Date) => {
  try {
    const startDateStr = format(planStartDate, 'yyyy-MM-dd');
    const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    // 1. Get data from schedule_preview
    const { data: previewRows, error: fetchError } = await supabase
      .from('schedule_preview')
      .select('*')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    if (fetchError) {
      console.error('Error fetching from schedule_preview:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!previewRows || previewRows.length === 0) {
      return { success: false, error: 'No draft plan found to approve.' };
    }
    
    // 2. Delete existing data from schedule table
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    if (deleteError) {
      console.error('Error deleting old schedule rows:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    // 3. Copy data to schedule table (remove preview-specific fields)
    const rowsToInsert = previewRows.map(({ id, created_at, is_approved, ...rest }) => rest);
    const { error: insertError } = await supabase
      .from('schedule')
      .insert(rowsToInsert);
    
    if (insertError) {
      console.error('Error inserting into schedule:', insertError);
      return { success: false, error: insertError.message };
    }
    
    // 4. Mark as approved in schedule_preview (don't delete)
    const { error: updateError } = await supabase
      .from('schedule_preview')
      .update({ is_approved: true })
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);
    
    if (updateError) {
      console.warn('Warning: Could not update is_approved flag:', updateError);
      // Don't fail the approval process for this
    }
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Unexpected error in approvePlan:', error);
    return { success: false, error: error.message };
  }
};
```

## Testing Strategy

### 1. **Unit Tests**
- Test status calculation logic with various data scenarios
- Test data comparison function
- Test approval process

### 2. **Integration Tests**
- Test complete workflow from generation to approval
- Test data consistency between tables
- Test UI state updates

### 3. **Manual Testing**
- Test with client 34 on 2025-08-31
- Verify status indicators work correctly
- Verify approve button visibility logic

## Rollback Plan

If issues arise during implementation:

1. **Database Rollback**: Restore from backup if needed
2. **Code Rollback**: Revert to previous version of status logic
3. **Data Sync**: Manually sync data between tables if needed

## Success Criteria

1. ✅ **UI always shows data from schedule_preview**
2. ✅ **Status accurately reflects data consistency**
3. ✅ **Approve button appears when data differs between tables**
4. ✅ **No data loss during approval process**
5. ✅ **Clear audit trail maintained**

## Timeline

- **Phase 1 (Immediate)**: Audit and fix current data inconsistency
- **Phase 2 (1-2 days)**: Implement updated status logic
- **Phase 3 (1 day)**: Update UI data source logic
- **Phase 4 (1 day)**: Testing and validation
- **Phase 5 (1 day)**: Deployment and monitoring

