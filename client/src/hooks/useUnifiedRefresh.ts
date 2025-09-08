/**
 * useUnifiedRefresh Hook
 * 
 * React hook that provides unified refresh functionality with:
 * - State management
 * - Error handling
 * - Loading states
 * - Smart deduplication
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import unifiedRefreshManager, { RefreshOperation, RefreshState } from '@/utils/unifiedRefreshManager';

export interface UseUnifiedRefreshReturn {
  state: RefreshState;
  refresh: (operation: RefreshOperation) => Promise<any>;
  cancel: (key: string) => boolean;
  clearAll: () => void;
  getStats: () => any;
}

export const useUnifiedRefresh = (): UseUnifiedRefreshReturn => {
  const [state, setState] = useState<RefreshState>({
    isRefreshing: false,
    lastRefresh: null,
    errors: [],
    pendingOperations: [],
    operationHistory: new Map()
  });
  
  const managerRef = useRef(unifiedRefreshManager);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Subscribe to refresh manager state changes
  useEffect(() => {
    const manager = managerRef.current;
    unsubscribeRef.current = manager.subscribe(setState);
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
  
  // Refresh function
  const refresh = useCallback(async (operation: RefreshOperation): Promise<any> => {
    try {
      return await managerRef.current.refresh(operation);
    } catch (error) {
      console.error('[useUnifiedRefresh] Refresh failed:', error);
      throw error;
    }
  }, []);
  
  // Cancel function
  const cancel = useCallback((key: string): boolean => {
    return managerRef.current.cancel(key);
  }, []);
  
  // Clear all function
  const clearAll = useCallback((): void => {
    managerRef.current.clearAll();
  }, []);
  
  // Get stats function
  const getStats = useCallback(() => {
    return managerRef.current.getStats();
  }, []);
  
  return {
    state,
    refresh,
    cancel,
    clearAll,
    getStats
  };
};

/**
 * Hook for specific refresh operations
 */
export const useWorkoutPlanRefresh = (clientId?: number, planStartDate?: Date) => {
  const { state, refresh } = useUnifiedRefresh();
  
  const refreshWorkoutPlan = useCallback(async () => {
    if (!clientId || !planStartDate) {
      console.warn('[useWorkoutPlanRefresh] Missing required parameters');
      return;
    }
    
    return refresh({
      type: 'WORKOUT_PLAN',
      params: { clientId, planStartDate },
      cooldown: 1000,
      priority: 'high'
    });
  }, [clientId, planStartDate, refresh]);
  
  const refreshApprovalStatus = useCallback(async () => {
    if (!clientId || !planStartDate) {
      console.warn('[useWorkoutPlanRefresh] Missing required parameters');
      return;
    }
    
    return refresh({
      type: 'APPROVAL_STATUS',
      params: { clientId, planStartDate },
      cooldown: 500,
      priority: 'normal'
    });
  }, [clientId, planStartDate, refresh]);
  
  return {
    state,
    refreshWorkoutPlan,
    refreshApprovalStatus
  };
};

/**
 * Hook for weekly header refresh
 */
export const useWeeklyHeaderRefresh = (clientId?: number, planStartDate?: Date, viewMode?: 'weekly' | 'monthly') => {
  const { state, refresh } = useUnifiedRefresh();
  
  const refreshWeeklyHeader = useCallback(async () => {
    if (!clientId || !planStartDate) {
      console.warn('[useWeeklyHeaderRefresh] Missing required parameters');
      return;
    }
    
    return refresh({
      type: 'WEEKLY_HEADER',
      params: { clientId, planStartDate, viewMode },
      cooldown: 1000,
      priority: 'normal'
    });
  }, [clientId, planStartDate, viewMode, refresh]);
  
  const refreshMonthlyData = useCallback(async () => {
    if (!clientId || !planStartDate || viewMode !== 'monthly') {
      console.warn('[useWeeklyHeaderRefresh] Missing required parameters or not monthly view');
      return;
    }
    
    return refresh({
      type: 'MONTHLY_DATA',
      params: { clientId, planStartDate },
      cooldown: 1000,
      priority: 'normal'
    });
  }, [clientId, planStartDate, viewMode, refresh]);
  
  return {
    state,
    refreshWeeklyHeader,
    refreshMonthlyData
  };
};
