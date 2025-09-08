/**
 * SchedulePreviewService - Unified Workout Rendering Service
 * 
 * Single source of truth for workout data display:
 * - ONLY fetches from schedule_preview table
 * - Supports both weekly (7 days) and monthly (28 days) views
 * - Fetches 1 week at a time for monthly view
 * - Handles "no plan exists" scenarios
 * - Real-time refresh when schedule_preview is updated
 */

import { supabase } from '@/lib/supabase';
import DateManager from '@/utils/dateManager';
import { format, addDays } from 'date-fns';

export interface SchedulePreviewData {
  id: number;
  for_date: string;
  summary: string;
  details_json: {
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: number;
      weight?: number;
      duration?: number;
      rest?: number;
      notes?: string;
    }>;
  };
  is_approved: boolean;
}

export interface WorkoutDay {
  date: string;
  focus: string;
  exercises: Array<{
    id: string;
    icon?: string;
    exercise: string;
    category: string;
    body_part: string;
    sets: number | string;
    reps: number | string;
    time: string;
    weight: number | string;
    equipment: string;
    date: string;
    rest?: number | string;
    other_details?: string;
    coach_tip?: string;
    details_json?: any;
  }>;
  hasPlan: boolean;
}

export interface UnifiedWorkoutData {
  days: WorkoutDay[];
  viewMode: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalDays: number;
  hasAnyPlans: boolean;
  fetchedAt: number;
}

export interface FetchParams {
  clientId: number;
  startDate: Date;
  viewMode: 'weekly' | 'monthly';
}

class SchedulePreviewService {
  private static readonly WEEK_DAYS = 7;
  private static readonly MONTH_DAYS = 28; // 4 weeks
  
  /**
   * Main method to fetch workout data for both weekly and monthly views
   */
  static async fetchWorkoutData(params: FetchParams): Promise<UnifiedWorkoutData> {
    console.log('[SchedulePreviewService] Fetching workout data:', {
      clientId: params.clientId,
      startDate: params.startDate.toISOString(),
      viewMode: params.viewMode
    });

    // Validate parameters
    if (!params.clientId) {
      throw new Error('clientId is required');
    }

    const dateValidation = DateManager.validateDate(params.startDate);
    if (!dateValidation.isValid) {
      throw new Error(`Invalid startDate: ${dateValidation.error}`);
    }

    const safeStartDate = dateValidation.date!;
    const totalDays = params.viewMode === 'weekly' ? this.WEEK_DAYS : this.MONTH_DAYS;
    const endDate = DateManager.safeAddDays(safeStartDate, totalDays - 1);

    console.log('[SchedulePreviewService] Date range:', {
      startDate: DateManager.safeFormat(safeStartDate, 'yyyy-MM-dd'),
      endDate: DateManager.safeFormat(endDate, 'yyyy-MM-dd'),
      totalDays
    });

    // Fetch data based on view mode
    let allDays: WorkoutDay[] = [];
    
    if (params.viewMode === 'weekly') {
      // Fetch single week
      allDays = await this.fetchWeekData(params.clientId, safeStartDate);
    } else {
      // Fetch 4 weeks (1 week at a time)
      allDays = await this.fetchMonthlyData(params.clientId, safeStartDate);
    }

    const hasAnyPlans = allDays.some(day => day.hasPlan);

    const result: UnifiedWorkoutData = {
      days: allDays,
      viewMode: params.viewMode,
      startDate: DateManager.safeFormat(safeStartDate, 'yyyy-MM-dd'),
      endDate: DateManager.safeFormat(endDate, 'yyyy-MM-dd'),
      totalDays,
      hasAnyPlans,
      fetchedAt: Date.now()
    };

    console.log('[SchedulePreviewService] Fetch completed:', {
      totalDays: result.days.length,
      hasAnyPlans: result.hasAnyPlans,
      plansCount: result.days.filter(d => d.hasPlan).length
    });

    return result;
  }

  /**
   * Fetch data for a single week (7 days)
   */
  private static async fetchWeekData(clientId: number, startDate: Date): Promise<WorkoutDay[]> {
    const endDate = DateManager.safeAddDays(startDate, this.WEEK_DAYS - 1);
    
    console.log('[SchedulePreviewService] Fetching week data:', {
      startDate: DateManager.safeFormat(startDate, 'yyyy-MM-dd'),
      endDate: DateManager.safeFormat(endDate, 'yyyy-MM-dd')
    });

    // Fetch from schedule_preview table only
    const { data: scheduleData, error } = await supabase
      .from('schedule_preview')
      .select('id, for_date, summary, details_json, is_approved')
      .eq('client_id', clientId)
      .eq('type', 'workout')
      .gte('for_date', DateManager.safeFormat(startDate, 'yyyy-MM-dd'))
      .lte('for_date', DateManager.safeFormat(endDate, 'yyyy-MM-dd'))
      .order('for_date', { ascending: true });

    if (error) {
      console.error('[SchedulePreviewService] Error fetching week data:', error);
      throw new Error(`Failed to fetch schedule preview data: ${error.message}`);
    }

    console.log('[SchedulePreviewService] Raw schedule data:', {
      count: scheduleData?.length || 0,
      dates: scheduleData?.map(d => d.for_date) || []
    });

    // Generate all 7 days, filling in data where available
    const days: WorkoutDay[] = [];
    for (let i = 0; i < this.WEEK_DAYS; i++) {
      const currentDate = DateManager.safeAddDays(startDate, i);
      const dateStr = DateManager.safeFormat(currentDate, 'yyyy-MM-dd');
      
      // Find matching data from schedule_preview
      const dayData = scheduleData?.find(d => d.for_date === dateStr);
      
      if (dayData && dayData.details_json?.exercises) {
        // Has plan data - transform to match Exercise interface
        const workoutDay: WorkoutDay = {
          date: dateStr,
          focus: dayData.summary || 'Workout',
          exercises: dayData.details_json.exercises.map((exercise: any) => ({
            id: exercise.id || `exercise-${dateStr}-${Math.random()}`,
            icon: exercise.icon || '',
            exercise: exercise.name || exercise.exercise || 'Unknown Exercise',
            category: exercise.category || 'General',
            body_part: exercise.body_part || 'Full Body',
            sets: exercise.sets || 1,
            reps: exercise.reps || 10,
            time: exercise.time || exercise.duration || '30s',
            weight: exercise.weight || 0,
            equipment: exercise.equipment || 'Body Weight',
            date: dateStr,
            rest: exercise.rest || 60,
            other_details: exercise.notes || exercise.other_details || '',
            coach_tip: exercise.coach_tip || '',
            details_json: exercise.details_json || exercise
          })),
          hasPlan: true
        };
        days.push(workoutDay);
      } else {
        // No plan data - show "no plan exists"
        const workoutDay: WorkoutDay = {
          date: dateStr,
          focus: 'No Plan Exists',
          exercises: [],
          hasPlan: false
        };
        days.push(workoutDay);
      }
    }

    return days;
  }

  /**
   * Fetch data for monthly view (4 weeks, fetched 1 week at a time)
   */
  private static async fetchMonthlyData(clientId: number, startDate: Date): Promise<WorkoutDay[]> {
    console.log('[SchedulePreviewService] Fetching monthly data (4 weeks):', {
      startDate: DateManager.safeFormat(startDate, 'yyyy-MM-dd')
    });

    const allDays: WorkoutDay[] = [];

    // Fetch 4 weeks, one at a time
    for (let week = 0; week < 4; week++) {
      const weekStartDate = DateManager.safeAddDays(startDate, week * this.WEEK_DAYS);
      console.log(`[SchedulePreviewService] Fetching week ${week + 1}:`, {
        startDate: DateManager.safeFormat(weekStartDate, 'yyyy-MM-dd')
      });

      try {
        const weekDays = await this.fetchWeekData(clientId, weekStartDate);
        allDays.push(...weekDays);
      } catch (error) {
        console.error(`[SchedulePreviewService] Error fetching week ${week + 1}:`, error);
        // Continue with other weeks even if one fails
        // Add empty days for this week
        for (let day = 0; day < this.WEEK_DAYS; day++) {
          const currentDate = DateManager.safeAddDays(weekStartDate, day);
          const dateStr = DateManager.safeFormat(currentDate, 'yyyy-MM-dd');
          allDays.push({
            date: dateStr,
            focus: 'No Plan Exists',
            exercises: [],
            hasPlan: false
          });
        }
      }
    }

    console.log('[SchedulePreviewService] Monthly data fetch completed:', {
      totalDays: allDays.length,
      weeks: Math.ceil(allDays.length / this.WEEK_DAYS)
    });

    return allDays;
  }

  /**
   * Check if schedule_preview data has been updated for a client
   * Since there's no updated_at column, we'll use a simple count-based approach
   */
  static async checkForUpdates(clientId: number, lastCheckTime: number): Promise<boolean> {
    try {
      // Simple approach: check if there are any records for the client
      // In a real implementation, you might want to use a different strategy
      const { data, error } = await supabase
        .from('schedule_preview')
        .select('id')
        .eq('client_id', clientId)
        .eq('type', 'workout')
        .limit(1);

      if (error) {
        console.error('[SchedulePreviewService] Error checking for updates:', error);
        return false;
      }

      // For now, always return true to trigger refresh
      // In production, you might implement a more sophisticated change detection
      return true;
    } catch (error) {
      console.error('[SchedulePreviewService] Error in checkForUpdates:', error);
      return false;
    }
  }

  /**
   * Get the latest update timestamp for a client's schedule_preview data
   * Since there's no updated_at column, we'll return current time
   */
  static async getLatestUpdateTime(clientId: number): Promise<number> {
    try {
      // Since there's no updated_at column, return current time
      return Date.now();
    } catch (error) {
      console.error('[SchedulePreviewService] Error getting latest update time:', error);
      return 0;
    }
  }
}

export default SchedulePreviewService;
