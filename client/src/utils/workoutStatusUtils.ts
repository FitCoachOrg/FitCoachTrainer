import { format } from 'date-fns';
import { RequestLogger } from './requestLogger';

export type WorkoutStatus = 'no_plan' | 'draft' | 'approved' | 'partial_approved';
export type WorkoutSource = 'generated' | 'template' | 'database';

export interface WorkoutStatusResult {
  status: WorkoutStatus;
  source: WorkoutSource;
  previewData: any[];
  scheduleData: any[];
  totalDays: number;
  weeklyBreakdown?: WeeklyStatus[];
  error?: string;
}

export interface WeeklyStatus {
  week: number;
  status: WorkoutStatus;
  startDate: Date;
  endDate: Date;
  previewData: any[];
  scheduleData: any[];
}

/**
 * Generic function to check workout plan approval status for any date range
 */
export async function checkWorkoutApprovalStatus(
  supabase: any,
  clientId: number,
  startDate: Date,
  endDate: Date
): Promise<WorkoutStatusResult> {
  if (!clientId) {
    return {
      status: 'no_plan',
      source: 'database',
      previewData: [],
      scheduleData: [],
      totalDays: 0,
      error: 'No client ID provided'
    };
  }

  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  try {
    console.log(`[checkWorkoutApprovalStatus] Checking status for ${totalDays} days: ${startDateStr} to ${endDateStr}`);

    // Get data from both tables with logging
    RequestLogger.logDatabaseQuery('schedule_preview', 'select', 'checkWorkoutApprovalStatus', {
      clientId,
      dateRange: `${startDateStr} to ${endDateStr}`,
      totalDays
    });
    
    const { data: previewData, error: previewError } = await supabase
      .from('schedule_preview')
      .select('id, for_date, summary, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);

    if (previewError) {
      console.error('Preview check error:', previewError);
      RequestLogger.logError('checkWorkoutApprovalStatus', new Error(`Preview query failed: ${previewError.message}`), {
        clientId,
        dateRange: `${startDateStr} to ${endDateStr}`,
        error: previewError
      });
    }

    RequestLogger.logDatabaseQuery('schedule', 'select', 'checkWorkoutApprovalStatus', {
      clientId,
      dateRange: `${startDateStr} to ${endDateStr}`,
      totalDays
    });

    // Get data from schedule table for comparison (but UI still only uses schedule_preview)
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('schedule')
      .select('id, for_date, summary, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);

    if (scheduleError) {
      console.error('Schedule check error:', scheduleError);
      RequestLogger.logError('checkWorkoutApprovalStatus', new Error(`Schedule query failed: ${scheduleError.message}`), {
        clientId,
        dateRange: `${startDateStr} to ${endDateStr}`,
        error: scheduleError
      });
    }

    console.log(`[checkWorkoutApprovalStatus] Preview data: ${previewData?.length || 0} entries`);
    console.log(`[checkWorkoutApprovalStatus] Schedule data: ${scheduleData?.length || 0} entries`);

    // Determine status based on data presence and consistency
    let status: WorkoutStatus = 'no_plan';
    let source: WorkoutSource = 'database';

    if (!previewData || previewData.length === 0) {
      if (scheduleData && scheduleData.length > 0) {
        // Edge case: approved data exists but no preview
        console.log('[checkWorkoutApprovalStatus] ✅ Found approved plan in schedule table (no preview data)');
        status = 'approved';
        source = 'database';
      } else {
        // No data in either table
        console.log('[checkWorkoutApprovalStatus] ⚪ No plan found in either table');
        status = 'no_plan';
        source = 'database';
      }
    } else {
      // Preview data exists
      if (!scheduleData || scheduleData.length === 0) {
        // Only preview data exists = draft
        console.log('[checkWorkoutApprovalStatus] 📝 Found draft plan in schedule_preview table');
        status = 'draft';
        source = 'generated';
      } else {
        // Both tables have data - check if they match
        const dataMatches = compareWorkoutData(previewData, scheduleData);
        if (dataMatches) {
          console.log('[checkWorkoutApprovalStatus] ✅ Data matches between tables - marking as approved');
          status = 'approved';
          source = 'database';
        } else {
          console.log('[checkWorkoutApprovalStatus] 📝 Data differs between tables - marking as draft');
          status = 'draft';
          source = 'generated';
        }
      }
    }

    return {
      status,
      source,
      previewData: previewData || [],
      scheduleData: scheduleData || [],
      totalDays
    };

  } catch (error: any) {
    console.error('Error checking workout approval status:', error);
    RequestLogger.logError('checkWorkoutApprovalStatus', error, {
      clientId,
      dateRange: `${startDateStr} to ${endDateStr}`,
      totalDays
    });
    return {
      status: 'no_plan',
      source: 'database',
      previewData: [],
      scheduleData: [],
      totalDays,
      error: error.message
    };
  }
}

/**
 * Check weekly workout approval status (7 days)
 */
export async function checkWeeklyWorkoutStatus(
  supabase: any,
  clientId: number,
  planStartDate: Date
): Promise<WorkoutStatusResult> {
  const startTime = Date.now();
  console.log(`[checkWeeklyWorkoutStatus] Starting weekly status check for client ${clientId}, start date: ${planStartDate.toISOString()}`);
  
  const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const result = await checkWorkoutApprovalStatus(supabase, clientId, planStartDate, endDate);
  
  const duration = Date.now() - startTime;
  console.log(`[checkWeeklyWorkoutStatus] Completed in ${duration}ms: status=${result.status}, previewData=${result.previewData.length}, scheduleData=${result.scheduleData.length}`);
  
  RequestLogger.logPerformance('weekly_workout_status_check', 'checkWeeklyWorkoutStatus', startTime, {
    clientId,
    duration,
    status: result.status,
    previewDataCount: result.previewData.length,
    scheduleDataCount: result.scheduleData.length
  });
  
  return result;
}

/**
 * Check monthly workout approval status (28 days) with weekly breakdown
 */
export async function checkMonthlyWorkoutStatus(
  supabase: any,
  clientId: number,
  planStartDate: Date
): Promise<WorkoutStatusResult> {
  const startTime = Date.now();
  console.log(`[checkMonthlyWorkoutStatus] Starting monthly status check for client ${clientId}, start date: ${planStartDate.toISOString()}`);
  
  const endDate = new Date(planStartDate.getTime() + 27 * 24 * 60 * 60 * 1000);
  const result = await checkWorkoutApprovalStatus(supabase, clientId, planStartDate, endDate);

  console.log(`[checkMonthlyWorkoutStatus] Base result received: status=${result.status}, previewData=${result.previewData.length}, scheduleData=${result.scheduleData.length}`);

  // Add weekly breakdown for monthly views
  if (result.previewData.length > 0 || result.scheduleData.length > 0) {
    console.log(`[checkMonthlyWorkoutStatus] Processing weekly breakdown...`);
    const weeklyBreakdown: WeeklyStatus[] = [];
    
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(planStartDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekPreviewData = result.previewData.filter(day => 
        day.for_date >= format(weekStart, 'yyyy-MM-dd') && 
        day.for_date <= format(weekEnd, 'yyyy-MM-dd')
      );
      
      const weekScheduleData = result.scheduleData.filter(day => 
        day.for_date >= format(weekStart, 'yyyy-MM-dd') && 
        day.for_date <= format(weekEnd, 'yyyy-MM-dd')
      );
      
      let weekStatus: WorkoutStatus = 'no_plan';
      if (weekPreviewData.length > 0 || weekScheduleData.length > 0) {
        if (weekPreviewData.length > 0 && weekScheduleData.length > 0) {
          weekStatus = compareWorkoutData(weekPreviewData, weekScheduleData) ? 'approved' : 'draft';
        } else if (weekPreviewData.length > 0) {
          weekStatus = 'draft';
        } else {
          weekStatus = 'approved';
        }
      }
      
      console.log(`[checkMonthlyWorkoutStatus] Week ${week + 1}: status=${weekStatus}, previewData=${weekPreviewData.length}, scheduleData=${weekScheduleData.length}`);
      
      weeklyBreakdown.push({
        week: week + 1,
        status: weekStatus,
        startDate: weekStart,
        endDate: weekEnd,
        previewData: weekPreviewData,
        scheduleData: weekScheduleData
      });
    }
    
    // Determine overall status based on weekly breakdown
    const approvedWeeks = weeklyBreakdown.filter(w => w.status === 'approved').length;
    const draftWeeks = weeklyBreakdown.filter(w => w.status === 'draft').length;
    const noPlanWeeks = weeklyBreakdown.filter(w => w.status === 'no_plan').length;
    
    let overallStatus: WorkoutStatus = 'no_plan';
    if (approvedWeeks === 4) {
      overallStatus = 'approved';
    } else if (draftWeeks > 0) {
      overallStatus = 'draft';
    } else if (noPlanWeeks === 4) {
      overallStatus = 'no_plan';
    } else {
      overallStatus = 'partial_approved';
    }
    
    console.log(`[checkMonthlyWorkoutStatus] Final status: ${overallStatus} (approved: ${approvedWeeks}, draft: ${draftWeeks}, noPlan: ${noPlanWeeks})`);
    
    const duration = Date.now() - startTime;
    RequestLogger.logPerformance('monthly_workout_status_check', 'checkMonthlyWorkoutStatus', startTime, {
      clientId,
      duration,
      weeklyBreakdown: weeklyBreakdown.length,
      overallStatus
    });
    
    return {
      ...result,
      status: overallStatus,
      weeklyBreakdown
    };
  }
  
  console.log(`[checkMonthlyWorkoutStatus] No data found, returning base result`);
  const duration = Date.now() - startTime;
  RequestLogger.logPerformance('monthly_workout_status_check', 'checkMonthlyWorkoutStatus', startTime, {
    clientId,
    duration,
    weeklyBreakdown: 0,
    overallStatus: result.status
  });
  
  return result;
}

/**
 * Compare workout data between preview and schedule tables
 */
export function compareWorkoutData(previewData: any[], scheduleData: any[]): boolean {
  console.log('[compareWorkoutData] Starting comparison with', previewData.length, 'preview rows and', scheduleData.length, 'schedule rows');
  
  if (previewData.length !== scheduleData.length) {
    console.log('[compareWorkoutData] Length mismatch:', previewData.length, 'vs', scheduleData.length);
    return false;
  }
  
  // Sort both arrays by date for comparison
  const sortedPreview = previewData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  const sortedSchedule = scheduleData.sort((a, b) => a.for_date.localeCompare(b.for_date));
  
  console.log('[compareWorkoutData] Preview dates:', sortedPreview.map(p => p.for_date));
  console.log('[compareWorkoutData] Schedule dates:', sortedSchedule.map(s => s.for_date));
  
  for (let i = 0; i < sortedPreview.length; i++) {
    const preview = sortedPreview[i];
    const schedule = sortedSchedule[i];
    
    if (preview.for_date !== schedule.for_date) {
      console.log('[compareWorkoutData] Date mismatch at index', i, ':', preview.for_date, 'vs', schedule.for_date);
      return false;
    }
    
    // Compare details_json (the actual workout data)
    const previewJson = JSON.stringify(preview.details_json);
    const scheduleJson = JSON.stringify(schedule.details_json);
    
    if (previewJson !== scheduleJson) {
      console.log('[compareWorkoutData] Data mismatch for date', preview.for_date);
      console.log('[compareWorkoutData] Preview data:', preview.details_json);
      console.log('[compareWorkoutData] Schedule data:', schedule.details_json);
      return false;
    }
  }
  
  console.log('[compareWorkoutData] All data matches between tables');
  return true;
}

/**
 * Get status display text and styling
 */
export function getStatusDisplay(status: WorkoutStatus, isMonthly = false) {
  switch (status) {
    case 'approved':
      return {
        text: isMonthly ? 'All Weeks Approved' : 'Current Plan Approved',
        className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
        icon: '✅'
      };
    case 'draft':
      return {
        text: isMonthly ? 'Some Weeks Need Approval' : 'Current Plan Draft',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        icon: '📝'
      };
    case 'partial_approved':
      return {
        text: isMonthly ? 'Mixed Approval Status' : 'Partially Approved',
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
        icon: '⚠️'
      };
    case 'no_plan':
    default:
      return {
        text: isMonthly ? 'No Plans This Month' : 'No Current Plan',
        className: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700',
        icon: '⚪'
      };
  }
}

