/**
 * useUnifiedWorkoutData - Simplified Hook for Schedule Preview Data
 * 
 * Based on clarified requirements:
 * - Only fetches from schedule_preview table
 * - Supports weekly (7 days) and monthly (28 days) views
 * - Fetches 1 week at a time for monthly view
 * - Handles "no plan exists" scenarios
 * - Real-time refresh when schedule_preview is updated
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import SchedulePreviewService, { 
  type UnifiedWorkoutData, 
  type FetchParams 
} from '@/services/SchedulePreviewService';
import DateManager from '@/utils/dateManager';

export interface UseUnifiedWorkoutDataOptions {
  /**
   * Enable automatic refresh when schedule_preview is updated
   * @default true
   */
  enableAutoRefresh?: boolean;
  
  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;
  
  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
  
  /**
   * Custom success handler
   */
  onSuccess?: (data: UnifiedWorkoutData) => void;
}

export interface UseUnifiedWorkoutDataReturn {
  /**
   * The workout data
   */
  data: UnifiedWorkoutData | null;
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error state
   */
  error: Error | null;
  
  /**
   * Last fetch timestamp
   */
  lastFetch: number | null;
  
  /**
   * Manually refresh the data
   */
  refetch: () => Promise<void>;
  
  /**
   * Check if data needs refresh
   */
  needsRefresh: boolean;
}

/**
 * Hook for unified workout data management
 */
export function useUnifiedWorkoutData(
  params: FetchParams,
  options: UseUnifiedWorkoutDataOptions = {}
): UseUnifiedWorkoutDataReturn {
  const {
    enableAutoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    onError,
    onSuccess
  } = options;

  // Validate parameters
  if (!params.clientId) {
    console.warn('[useUnifiedWorkoutData] Invalid clientId:', params.clientId);
    return {
      data: null,
      isLoading: false,
      error: new Error('clientId is required'),
      lastFetch: null,
      refetch: async () => {},
      needsRefresh: false
    };
  }

  const dateValidation = DateManager.validateDate(params.startDate);
  if (!dateValidation.isValid) {
    console.warn('[useUnifiedWorkoutData] Invalid startDate:', params.startDate, dateValidation.error);
    return {
      data: null,
      isLoading: false,
      error: new Error(`Invalid startDate: ${dateValidation.error}`),
      lastFetch: null,
      refetch: async () => {},
      needsRefresh: false
    };
  }

  // Create safe parameters
  const safeParams: FetchParams = {
    ...params,
    startDate: dateValidation.date!
  };

  // State management
  const [data, setData] = useState<UnifiedWorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateCheckRef = useRef<number>(0);

  /**
   * Fetch data from schedule_preview
   */
  const fetchData = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useUnifiedWorkoutData] Fetching data:', {
        clientId: safeParams.clientId,
        startDate: safeParams.startDate.toISOString(),
        viewMode: safeParams.viewMode
      });

      const result = await SchedulePreviewService.fetchWorkoutData(safeParams);

      if (!isMountedRef.current) return;

      setData(result);
      setLastFetch(Date.now());
      setNeedsRefresh(false);
      lastUpdateCheckRef.current = Date.now();

      console.log('[useUnifiedWorkoutData] Data fetched successfully:', {
        totalDays: result.days.length,
        hasAnyPlans: result.hasAnyPlans,
        viewMode: result.viewMode
      });

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useUnifiedWorkoutData] Error fetching data:', error);
      
      setError(error);
      setNeedsRefresh(true);

      if (onError) {
        onError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [safeParams, onError, onSuccess]);

  /**
   * Check for updates in schedule_preview
   */
  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current || !enableAutoRefresh) return;

    try {
      const hasUpdates = await SchedulePreviewService.checkForUpdates(
        safeParams.clientId,
        lastUpdateCheckRef.current
      );

      if (hasUpdates && isMountedRef.current) {
        console.log('[useUnifiedWorkoutData] Schedule preview updated, refreshing data');
        setNeedsRefresh(true);
        await fetchData();
      }
    } catch (error) {
      console.error('[useUnifiedWorkoutData] Error checking for updates:', error);
    }
  }, [safeParams.clientId, enableAutoRefresh, fetchData]);

  /**
   * Manual refresh function
   */
  const refetch = useCallback(async (): Promise<void> => {
    console.log('[useUnifiedWorkoutData] Manual refresh requested');
    await fetchData();
  }, [fetchData]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    console.log('[useUnifiedWorkoutData] Effect triggered:', {
      clientId: safeParams.clientId,
      startDate: safeParams.startDate.toISOString(),
      viewMode: safeParams.viewMode
    });

    fetchData();

    // Set up auto-refresh interval
    if (enableAutoRefresh) {
      refreshIntervalRef.current = setInterval(checkForUpdates, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [safeParams.clientId, safeParams.startDate.toISOString(), safeParams.viewMode, fetchData, enableAutoRefresh, refreshInterval, checkForUpdates]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refetch,
    needsRefresh
  };
}

export default useUnifiedWorkoutData;
