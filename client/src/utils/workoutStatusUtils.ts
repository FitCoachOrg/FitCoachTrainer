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
    // Get data from both tables with logging and timeout protection
    RequestLogger.logDatabaseQuery('schedule_preview', 'select', 'checkWorkoutApprovalStatus', {
      clientId,
      dateRange: `${startDateStr} to ${endDateStr}`,
      totalDays
    });
    
    // Add timeout protection to database queries with proper cancellation
    const createTimeoutPromise = (timeoutMs: number, operation: string) => {
      return new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`${operation} timeout after ${timeoutMs}ms`));
        }, timeoutMs);
        
        // Store timeout ID for potential cleanup
        (reject as any).timeoutId = timeoutId;
      });
    };

    // SEQUENTIAL QUERIES: Run queries one at a time to prevent database overload

    const previewQuery = supabase
      .from('schedule_preview')
      .select('id, for_date, summary, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);

    const { data: previewData, error: previewError } = await Promise.race([
      previewQuery,
      createTimeoutPromise(8000, 'Preview query') // Reduced to 8 seconds
    ]) as any;

    if (previewError) {
      console.error('Preview check error:', previewError);
      RequestLogger.logError('checkWorkoutApprovalStatus', new Error(`Preview query failed: ${previewError.message}`), {
        clientId,
        dateRange: `${startDateStr} to ${endDateStr}`,
        error: previewError
      });
      
      // If it's a timeout error, continue with empty data instead of throwing
      if (previewError.message.includes('timeout')) {
        return {
          status: 'no_plan' as const,
          source: 'timeout_fallback' as const,
          previewData: [],
          scheduleData: [],
          totalDays,
          approvedDays: 0,
          unapprovedDays: 0,
          weeklyBreakdown: []
        };
      }
      
      throw previewError;
    }

    RequestLogger.logDatabaseQuery('schedule', 'select', 'checkWorkoutApprovalStatus', {
      clientId,
      dateRange: `${startDateStr} to ${endDateStr}`,
      totalDays
    });

    // Get data from schedule table for comparison (but UI still only uses schedule_preview) with timeout protection
    const scheduleQuery = supabase
      .from('schedule')
      .select('id, for_date, summary, details_json')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', startDateStr)
      .lte('for_date', endDateStr);

    const { data: scheduleData, error: scheduleError } = await Promise.race([
      scheduleQuery,
      createTimeoutPromise(8000, 'Schedule query') // Use same timeout function
    ]) as any;

    if (scheduleError) {
      console.error('Schedule check error:', scheduleError);
      RequestLogger.logError('checkWorkoutApprovalStatus', new Error(`Schedule query failed: ${scheduleError.message}`), {
        clientId,
        dateRange: `${startDateStr} to ${endDateStr}`,
        error: scheduleError
      });
      
      // If it's a timeout error, continue with empty data instead of throwing
      if (scheduleError.message.includes('timeout')) {
        // Continue with empty schedule data
      } else {
        throw scheduleError;
      }
    }


    // ----------------------------------------------------
    // NEW SIMPLIFIED STATUS LOGIC  (2025-09-xx)
    // ----------------------------------------------------
    // We ignore the schedule table for status; the preview table is now the single source of truth.
    // Rules (weekly or arbitrary date-range):
    //   • totalRows === 0               ⇒   no_plan
    //   • totalRows === expectedDays AND every row is_approved ⇒ approved
    //   • otherwise                    ⇒   draft  (needs approval)
    //   NOTE: expectedDays == totalDays computed earlier.

    let status: WorkoutStatus = 'no_plan';
    let source: WorkoutSource = 'database';

    const totalRows = previewData?.length || 0;
    const approvedRows = (previewData || []).filter(r => r.is_approved === true).length;

    if (totalRows === 0) {
      status = 'no_plan';
      source = 'database';
    } else if (totalRows === totalDays && approvedRows === totalRows) {
      status = 'approved';
      source = 'database';
    } else {
      status = 'draft'; // renamed upstream to "not_approved" / needs approval.
      source = 'generated';
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
  
  const endDate = new Date(planStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  const result = await checkWorkoutApprovalStatus(supabase, clientId, planStartDate, endDate);
  
  const duration = Date.now() - startTime;
  
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
  
  const endDate = new Date(planStartDate.getTime() + 27 * 24 * 60 * 60 * 1000);
  const result = await checkWorkoutApprovalStatus(supabase, clientId, planStartDate, endDate);

  // Add weekly breakdown for monthly views
  if (result.previewData.length > 0 || result.scheduleData.length > 0) {
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
      if (weekPreviewData.length > 0) {
        // Use the new is_approved system: check if all days in this week are approved
        const approvedDaysInWeek = weekPreviewData.filter(day => day.is_approved === true).length;
        const totalDaysInWeek = weekPreviewData.length;
        
        if (totalDaysInWeek > 0 && approvedDaysInWeek === totalDaysInWeek) {
          weekStatus = 'approved';
        } else {
          weekStatus = 'draft';
        }
        
      }
      
      
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

