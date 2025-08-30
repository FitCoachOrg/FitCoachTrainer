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
    const endDate = new Date(new Date(month + '-01').getFullYear(), new Date(month + '-01').getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    
    console.log('📅 Date range calculation:', {
      month,
      startDate,
      endDate,
      startDateObj: new Date(startDate),
      endDateObj: new Date(endDate)
    });
    
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
      // Convert clientId to number if it's a string
      const numericClientId = parseInt(clientId, 10);
      console.log('🔢 Converted clientId:', { original: clientId, numeric: numericClientId });

      // Fetch client information
      const { data: clientInfo, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', numericClientId)
        .single();

      if (clientError) {
        console.error('❌ Error fetching client info:', clientError);
        throw new Error(`Failed to fetch client info: ${clientError.message}`);
      }

      console.log('✅ Client info fetched:', clientInfo?.cl_name);

      // Fetch activity data with debugging
      console.log('🔍 Fetching activity data for client:', numericClientId);
      const { data: activityData, error: activityError } = await supabase
        .from('activity_info')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (activityError) {
        console.error('❌ Error fetching activity data:', activityError);
        throw new Error(`Failed to fetch activity data: ${activityError.message}`);
      }

      console.log('✅ Activity data fetched:', {
        count: activityData?.length || 0,
        sample: activityData?.slice(0, 2) || []
      });

      // Fetch meal data
      const { data: mealData, error: mealError } = await supabase
        .from('meal_info')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (mealError) {
        console.error('❌ Error fetching meal data:', mealError);
        throw new Error(`Failed to fetch meal data: ${mealError.message}`);
      }

      console.log('✅ Meal data fetched:', { count: mealData?.length || 0 });

      // Fetch workout data
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_info')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (workoutError) {
        console.error('❌ Error fetching workout data:', workoutError);
        throw new Error(`Failed to fetch workout data: ${workoutError.message}`);
      }

      console.log('✅ Workout data fetched:', { count: workoutData?.length || 0 });

      // Fetch schedule data
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedule')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (scheduleError) {
        console.error('❌ Error fetching schedule data:', scheduleError);
        throw new Error(`Failed to fetch schedule data: ${scheduleError.message}`);
      }

      console.log('✅ Schedule data fetched:', { count: scheduleData?.length || 0 });

      // Fetch target data
      const { data: targetData, error: targetError } = await supabase
        .from('client_target')
        .select('*')
        .eq('client_id', numericClientId);

      if (targetError) {
        console.error('❌ Error fetching target data:', targetError);
        throw new Error(`Failed to fetch target data: ${targetError.message}`);
      }

      console.log('✅ Target data fetched:', { count: targetData?.length || 0 });

      // Fetch engagement data
      const { data: engagementData, error: engagementError } = await supabase
        .from('client_engagement_score')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1);

      if (engagementError) {
        console.error('❌ Error fetching engagement data:', engagementError);
        throw new Error(`Failed to fetch engagement data: ${engagementError.message}`);
      }

      console.log('✅ Engagement data fetched:', { count: engagementData?.length || 0 });

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

  /**
   * Debug function to check database structure and data
   */
  static async debugClientData(clientId: string): Promise<void> {
    try {
      const numericClientId = parseInt(clientId, 10);
      console.log('🔍 DEBUG: Checking data for client:', numericClientId);

      // Check if client exists
      const { data: client, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', numericClientId)
        .single();

      if (clientError) {
        console.error('❌ Client not found:', clientError);
        return;
      }

      console.log('✅ Client found:', client?.cl_name);

      // Check activity_info table structure
      const { data: activitySample, error: activityError } = await supabase
        .from('activity_info')
        .select('*')
        .limit(1);

      if (activityError) {
        console.error('❌ Error accessing activity_info table:', activityError);
        return;
      }

      console.log('✅ Activity_info table structure:', {
        columns: activitySample?.[0] ? Object.keys(activitySample[0]) : [],
        sample: activitySample?.[0]
      });

      // Test 1: Check all activity data for this client (no date filter)
      const { data: allActivity, error: allActivityError } = await supabase
        .from('activity_info')
        .select('*')
        .eq('client_id', numericClientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (allActivityError) {
        console.error('❌ Error fetching all activity data:', allActivityError);
        return;
      }

      console.log('✅ All activity data for client:', {
        count: allActivity?.length || 0,
        sample: allActivity?.slice(0, 3) || []
      });

      // Test 2: Check recent activity data (last 30 days) with different date format
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentActivity, error: recentActivityError } = await supabase
        .from('activity_info')
        .select('*')
        .eq('client_id', numericClientId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentActivityError) {
        console.error('❌ Error fetching recent activity data:', recentActivityError);
        return;
      }

      console.log('✅ Recent activity data (last 30 days):', {
        count: recentActivity?.length || 0,
        sample: recentActivity?.slice(0, 3) || []
      });

      // Test 3: Check if there are any activity records at all for this client
      const { count: totalActivityCount, error: countError } = await supabase
        .from('activity_info')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', numericClientId);

      if (countError) {
        console.error('❌ Error counting activity data:', countError);
      } else {
        console.log('✅ Total activity records for client:', totalActivityCount);
      }

      // Test 4: Check meal data
      const { data: mealData, error: mealError } = await supabase
        .from('meal_info')
        .select('*')
        .eq('client_id', numericClientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (mealError) {
        console.error('❌ Error fetching meal data:', mealError);
      } else {
        console.log('✅ Meal data for client:', {
          count: mealData?.length || 0,
          sample: mealData?.slice(0, 2) || []
        });
      }

      // Test 5: Check workout data
      const { data: workoutData, error: workoutError } = await supabase
        .from('workout_info')
        .select('*')
        .eq('client_id', numericClientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (workoutError) {
        console.error('❌ Error fetching workout data:', workoutError);
      } else {
        console.log('✅ Workout data for client:', {
          count: workoutData?.length || 0,
          sample: workoutData?.slice(0, 2) || []
        });
      }

      // Test 6: Check if RLS might be the issue by trying a simple query
      const { data: simpleActivity, error: simpleError } = await supabase
        .from('activity_info')
        .select('client_id, activity, qty, created_at')
        .eq('client_id', numericClientId)
        .limit(1);

      if (simpleError) {
        console.error('❌ Error with simple activity query:', simpleError);
      } else {
        console.log('✅ Simple activity query result:', simpleActivity);
      }

    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  }
}
