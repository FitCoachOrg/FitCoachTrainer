import { supabase } from './supabase';

export interface ClientReportData {
  clientInfo: any;
  activityData: any[];
  mealData: any[];
  workoutData: any[];
  scheduleData: any[];
  targetData: any[];
  engagementData: any[];
  month: string;
  startDate: string;
  endDate: string;
}

export interface ProcessedMetrics {
  [metricKey: string]: {
    metric: any;
    weeklyData: any[];
    monthlyAverage: number;
    trend: 'up' | 'down' | 'stable';
    performance?: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  };
}

export class MonthlyReportDataService {
  /**
   * Get client data for a specific month
   */
  static async getClientData(clientId: string, month: string): Promise<ClientReportData> {
    const startDate = new Date(month + '-01').toISOString();
    const endDate = new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 0).toISOString();
    
    return this.getClientDataForDateRange(clientId, startDate, endDate, month);
  }

  /**
   * Get client data for a custom date range (past 30 days from selected date)
   */
  static async getClientDataForDateRange(
    clientId: string, 
    startDate: string, 
    endDate: string, 
    monthLabel: string
  ): Promise<ClientReportData> {
    console.log('📊 Fetching client data for date range:', {
      clientId,
      startDate,
      endDate,
      monthLabel
    });

    try {
      // Fetch client information
      const { data: clientInfo, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (clientError) {
        console.error('❌ Error fetching client info:', clientError);
        throw new Error(`Failed to fetch client info: ${clientError.message}`);
      }

      // Fetch activity data
      const { data: activityData, error: activityError } = await supabase
        .from('activity_info')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (activityError) {
        console.error('❌ Error fetching activity data:', activityError);
        throw new Error(`Failed to fetch activity data: ${activityError.message}`);
      }

      // Fetch meal data
      const { data: mealData, error: mealError } = await supabase
        .from('meal_info')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (mealError) {
        console.error('❌ Error fetching meal data:', mealError);
        throw new Error(`Failed to fetch meal data: ${mealError.message}`);
      }

      // Fetch workout data
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_info')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (workoutError) {
        console.error('❌ Error fetching workout data:', workoutError);
        throw new Error(`Failed to fetch workout data: ${workoutError.message}`);
      }

      // Fetch schedule data
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (scheduleError) {
        console.error('❌ Error fetching schedule data:', scheduleError);
        throw new Error(`Failed to fetch schedule data: ${scheduleError.message}`);
      }

      // Fetch target data
      const { data: targetData, error: targetError } = await supabase
        .from('client_target')
        .select('*')
        .eq('client_id', clientId);

      if (targetError) {
        console.error('❌ Error fetching target data:', targetError);
        throw new Error(`Failed to fetch target data: ${targetError.message}`);
      }

      // Fetch engagement data
      const { data: engagementData, error: engagementError } = await supabase
        .from('client_engagement_score')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1);

      if (engagementError) {
        console.error('❌ Error fetching engagement data:', engagementError);
        throw new Error(`Failed to fetch engagement data: ${engagementError.message}`);
      }

      const clientData: ClientReportData = {
        clientInfo,
        activityData: activityData || [],
        mealData: mealData || [],
        workoutData: workoutData || [],
        scheduleData: scheduleData || [],
        targetData: targetData || [],
        engagementData: engagementData || [],
        month: monthLabel,
        startDate,
        endDate
      };

      console.log('✅ Client data fetched successfully:', {
        clientName: clientInfo?.cl_name,
        activityRecords: activityData?.length || 0,
        mealRecords: mealData?.length || 0,
        workoutRecords: workoutData?.length || 0,
        scheduleRecords: scheduleData?.length || 0,
        targetRecords: targetData?.length || 0,
        engagementRecords: engagementData?.length || 0,
        dateRange: `${startDate} to ${endDate}`
      });

      return clientData;
    } catch (error) {
      console.error('❌ Error in getClientDataForDateRange:', error);
      throw error;
    }
  }

  /**
   * Get client data for past 30 days from a selected date
   */
  static async getClientDataForPast30Days(clientId: string, fromDate: string): Promise<ClientReportData> {
    const endDate = new Date(fromDate);
    const startDate = new Date(fromDate);
    startDate.setDate(startDate.getDate() - 30);

    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    
    // Create a descriptive month label
    const monthLabel = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    console.log('📅 Fetching data for past 30 days:', {
      fromDate,
      startDate: startDateISO,
      endDate: endDateISO,
      monthLabel
    });

    return this.getClientDataForDateRange(clientId, startDateISO, endDateISO, monthLabel);
  }

  /**
   * Get available date ranges for a client
   */
  static async getAvailableDateRanges(clientId: string): Promise<{ month: string; label: string; recordCount: number }[]> {
    try {
      // Get the earliest and latest activity dates
      const { data: activityDates, error } = await supabase
        .from('activity_info')
        .select('created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error || !activityDates || activityDates.length === 0) {
        return [];
      }

      const earliestDate = new Date(activityDates[0].created_at);
      const latestDate = new Date(activityDates[activityDates.length - 1].created_at);

      // Generate monthly ranges
      const ranges: { month: string; label: string; recordCount: number }[] = [];
      const currentDate = new Date(earliestDate);
      currentDate.setDate(1); // Start from beginning of month

      while (currentDate <= latestDate) {
        const monthKey = currentDate.toISOString().slice(0, 7);
        const monthLabel = currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });

        // Count records for this month
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const recordCount = activityDates.filter(date => {
          const recordDate = new Date(date.created_at);
          return recordDate >= monthStart && recordDate <= monthEnd;
        }).length;

        ranges.push({
          month: monthKey,
          label: monthLabel,
          recordCount
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return ranges.reverse(); // Most recent first
    } catch (error) {
      console.error('❌ Error getting available date ranges:', error);
      return [];
    }
  }
}
