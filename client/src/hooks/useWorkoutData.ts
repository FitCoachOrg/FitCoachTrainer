/**
 * useWorkoutData - Custom Hook for Workout Data Management
 * 
 * Industry-standard React hook following React Query/TanStack Query patterns:
 * - Automatic data fetching and caching
 * - Request deduplication and cancellation
 * - Loading and error states
 * - Background refresh capabilities
 * - Optimistic updates support
 * 
 * Provides a clean, consistent interface for all workout data needs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import WorkoutDataService, { 
  type WorkoutDataParams, 
  type WorkoutDataResult, 
  type WorkoutDataState 
} from '@/services/WorkoutDataService';
import DateManager from '@/utils/dateManager';

export interface UseWorkoutDataOptions {
  /**
   * Enable background refresh when data becomes stale
   * @default true
   */
  enableBackgroundRefresh?: boolean;
  
  /**
   * Enable optimistic updates for better UX
   * @default false
   */
  enableOptimisticUpdates?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
  
  /**
   * Custom success handler
   */
  onSuccess?: (data: WorkoutDataResult) => void;
  
  /**
   * Retry configuration
   */
  retry?: {
    attempts: number;
    delay: number;
  };
}

export interface UseWorkoutDataReturn extends WorkoutDataState {
  /**
   * Manually refresh the data
   */
  refetch: (forceRefresh?: boolean) => Promise<void>;
  
  /**
   * Invalidate cache and refetch
   */
  invalidate: () => Promise<void>;
  
  /**
   * Check if data is stale
   */
  isStale: boolean;
  
  /**
   * Get cached data immediately (for optimistic updates)
   */
  getCachedData: () => WorkoutDataResult | null;
}

/**
 * Custom hook for managing workout data
 * 
 * @param params - Parameters for data fetching
 * @param options - Additional configuration options
 * @returns Workout data state and control functions
 */
export function useWorkoutData(
  params: WorkoutDataParams,
  options: UseWorkoutDataOptions = {}
): UseWorkoutDataReturn {
  const {
    enableBackgroundRefresh = true,
    enableOptimisticUpdates = false,
    onError,
    onSuccess,
    retry = { attempts: 3, delay: 1000 }
  } = options;
  
  // Enhanced parameter validation using DateManager
  if (!params.clientId) {
    console.warn('[useWorkoutData] Invalid clientId:', params.clientId);
    return {
      data: null,
      isLoading: false,
      error: new Error('Invalid parameters: clientId is required'),
      lastFetch: null,
      isStale: false,
      refetch: async () => {},
      invalidate: async () => {},
      getCachedData: () => null
    };
  }
  
  // Validate and normalize the start date
  const dateValidation = DateManager.validateDate(params.startDate);
  if (!dateValidation.isValid) {
    console.warn('[useWorkoutData] Invalid startDate:', params.startDate, dateValidation.error);
    return {
      data: null,
      isLoading: false,
      error: new Error(`Invalid startDate: ${dateValidation.error}`),
      lastFetch: null,
      isStale: false,
      refetch: async () => {},
      invalidate: async () => {},
      getCachedData: () => null
    };
  }
  
  // Create safe parameters with validated date
  const safeParams: WorkoutDataParams = {
    ...params,
    startDate: dateValidation.date!
  };
  
  // State management
  const [state, setState] = useState<WorkoutDataState>({
    data: null,
    isLoading: false,
    error: null,
    lastFetch: null,
    isStale: false
  });
  
  // Refs for cleanup and tracking
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const backgroundRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Update state safely (only if component is mounted)
   */
  const updateState = useCallback((updates: Partial<WorkoutDataState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);
  
  /**
   * Fetch data with retry logic
   */
  const fetchData = useCallback(async (
    forceRefresh: boolean = false,
    isRetry: boolean = false
  ): Promise<void> => {
    if (!isMountedRef.current) return;
    
    try {
      // Set loading state
      updateState({ 
        isLoading: true, 
        error: null,
        isStale: false 
      });
      
      console.log(`[useWorkoutData] Fetching data:`, {
        clientId: safeParams.clientId,
        startDate: safeParams.startDate.toISOString(),
        viewMode: safeParams.viewMode,
        forceRefresh,
        isRetry,
        retryCount: retryCountRef.current
      });
      
      // Fetch data using the unified service
      const result = await WorkoutDataService.fetchWorkoutData({
        ...safeParams,
        forceRefresh
      });
      
      if (!isMountedRef.current) return;
      
      // Update state with successful result
      updateState({
        data: result,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false
      });
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      // Call success handler
      if (onSuccess) {
        onSuccess(result);
      }
      
      console.log(`[useWorkoutData] Data fetched successfully:`, {
        status: result.status,
        previewDataCount: result.previewData.length,
        scheduleDataCount: result.scheduleData.length,
        viewMode: result.viewMode
      });
      
    } catch (error) {
      if (!isMountedRef.current) return;
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      
      console.error(`[useWorkoutData] Error fetching data:`, err);
      
      // Handle retry logic
      if (retryCountRef.current < retry.attempts && !isRetry) {
        retryCountRef.current++;
        console.log(`[useWorkoutData] Retrying in ${retry.delay}ms (attempt ${retryCountRef.current}/${retry.attempts})`);
        
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(forceRefresh, true);
          }
        }, retry.delay);
        
        return;
      }
      
      // Update state with error
      updateState({
        isLoading: false,
        error: err,
        isStale: true
      });
      
      // Call error handler
      if (onError) {
        onError(err);
      }
    }
  }, [safeParams, updateState, onError, onSuccess, retry]);
  
  /**
   * Manual refresh function
   */
  const refetch = useCallback(async (forceRefresh: boolean = false): Promise<void> => {
    console.log(`[useWorkoutData] Manual refresh requested:`, { forceRefresh });
    await fetchData(forceRefresh);
  }, [fetchData]);
  
  /**
   * Invalidate cache and refetch
   */
  const invalidate = useCallback(async (): Promise<void> => {
    console.log(`[useWorkoutData] Invalidating cache and refetching`);
    WorkoutDataService.invalidateCache(safeParams);
    await fetchData(true);
  }, [safeParams, fetchData]);
  
  /**
   * Get cached data immediately
   */
  const getCachedData = useCallback((): WorkoutDataResult | null => {
    return WorkoutDataService.getCachedData(safeParams);
  }, [safeParams]);
  
  /**
   * Check if data is stale
   */
  const isStale = WorkoutDataService.isDataStale(safeParams);
  
  /**
   * Initial data fetch effect
   */
  useEffect(() => {
    console.log(`[useWorkoutData] Effect triggered:`, {
      clientId: safeParams.clientId,
      startDate: safeParams.startDate.toISOString(),
      viewMode: safeParams.viewMode
    });
    
    // Check for cached data first
    const cachedData = getCachedData();
    if (cachedData) {
      console.log(`[useWorkoutData] Using cached data`);
      updateState({
        data: cachedData,
        isLoading: false,
        error: null,
        lastFetch: cachedData.fetchedAt,
        isStale: isStale
      });
      
      // If data is stale and background refresh is enabled, refresh in background
      if (isStale && enableBackgroundRefresh) {
        console.log(`[useWorkoutData] Data is stale, refreshing in background`);
        fetchData(false);
      }
    } else {
      // No cached data, fetch immediately
      console.log(`[useWorkoutData] No cached data, fetching immediately`);
      fetchData(false);
    }
    
    // Cleanup function
    return () => {
      if (backgroundRefreshTimeoutRef.current) {
        clearTimeout(backgroundRefreshTimeoutRef.current);
      }
    };
  }, [safeParams.clientId, safeParams.startDate.toISOString(), safeParams.viewMode, getCachedData, updateState, isStale, enableBackgroundRefresh, fetchData]);
  
  /**
   * Background refresh effect
   */
  useEffect(() => {
    if (!enableBackgroundRefresh || !state.data) return;
    
    // Set up background refresh when data becomes stale
    const checkStaleness = () => {
      if (WorkoutDataService.isDataStale(safeParams) && isMountedRef.current) {
        console.log(`[useWorkoutData] Data became stale, refreshing in background`);
        updateState({ isStale: true });
        fetchData(false);
      }
    };
    
    // Check staleness every minute
    const interval = setInterval(checkStaleness, 60000);
    
    return () => clearInterval(interval);
  }, [enableBackgroundRefresh, state.data, safeParams, fetchData, updateState]);
  
  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (backgroundRefreshTimeoutRef.current) {
        clearTimeout(backgroundRefreshTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...state,
    refetch,
    invalidate,
    isStale,
    getCachedData
  };
}

/**
 * Hook for optimistic updates
 * Useful for immediate UI updates before server confirmation
 */
export function useOptimisticWorkoutData(
  params: WorkoutDataParams,
  options: UseWorkoutDataOptions = {}
) {
  const baseHook = useWorkoutData(params, { ...options, enableOptimisticUpdates: true });
  const [optimisticData, setOptimisticData] = useState<WorkoutDataResult | null>(null);
  
  const applyOptimisticUpdate = useCallback((updateFn: (data: WorkoutDataResult) => WorkoutDataResult) => {
    if (baseHook.data) {
      const updated = updateFn(baseHook.data);
      setOptimisticData(updated);
    }
  }, [baseHook.data]);
  
  const clearOptimisticUpdate = useCallback(() => {
    setOptimisticData(null);
  }, []);
  
  return {
    ...baseHook,
    data: optimisticData || baseHook.data,
    applyOptimisticUpdate,
    clearOptimisticUpdate,
    hasOptimisticUpdate: optimisticData !== null
  };
}

export default useWorkoutData;
