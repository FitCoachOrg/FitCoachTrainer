/**
 * useOptimisticUpdates Hook
 * 
 * Provides optimistic updates for immediate UI feedback while operations
 * are being processed in the background. Based on React Query patterns.
 */

import { useState, useCallback, useRef } from 'react';

export interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  originalData?: T;
  timestamp: number;
  status: 'pending' | 'success' | 'error' | 'reverted';
  error?: Error;
}

export interface UseOptimisticUpdatesReturn<T> {
  optimisticData: T | null;
  isOptimistic: boolean;
  pendingUpdates: OptimisticUpdate<T>[];
  applyOptimisticUpdate: (update: Omit<OptimisticUpdate<T>, 'id' | 'timestamp' | 'status'>) => string;
  confirmUpdate: (id: string, finalData: T) => void;
  revertUpdate: (id: string) => void;
  clearAllUpdates: () => void;
  getUpdateById: (id: string) => OptimisticUpdate<T> | undefined;
}

export const useOptimisticUpdates = <T>(
  initialData: T | null = null
): UseOptimisticUpdatesReturn<T> => {
  const [currentData, setCurrentData] = useState<T | null>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate<T>[]>([]);
  const updateCounter = useRef(0);

  // Generate unique ID for updates
  const generateId = useCallback(() => {
    return `update_${Date.now()}_${++updateCounter.current}`;
  }, []);

  // Apply optimistic update
  const applyOptimisticUpdate = useCallback((
    update: Omit<OptimisticUpdate<T>, 'id' | 'timestamp' | 'status'>
  ): string => {
    const id = generateId();
    const optimisticUpdate: OptimisticUpdate<T> = {
      ...update,
      id,
      timestamp: Date.now(),
      status: 'pending'
    };

    setPendingUpdates(prev => [...prev, optimisticUpdate]);

    // Apply optimistic change to current data
    setCurrentData(prevData => {
      if (!prevData) return update.data;

      switch (update.type) {
        case 'create':
          // For arrays, add to the end
          if (Array.isArray(prevData)) {
            return [...prevData, update.data] as T;
          }
          // For objects, merge properties
          return { ...prevData, ...update.data } as T;

        case 'update':
          // For arrays, find and replace
          if (Array.isArray(prevData)) {
            return prevData.map((item: any) => 
              item.id === (update.data as any).id ? update.data : item
            ) as T;
          }
          // For objects, merge with update
          return { ...prevData, ...update.data } as T;

        case 'delete':
          // For arrays, filter out the item
          if (Array.isArray(prevData)) {
            return prevData.filter((item: any) => 
              item.id !== (update.data as any).id
            ) as T;
          }
          // For objects, remove the property
          const { [update.data as any]: removed, ...rest } = prevData as any;
          return rest as T;

        default:
          return prevData;
      }
    });

    console.log(`[OptimisticUpdate] Applied update ${id}:`, update.type);
    return id;
  }, [generateId]);

  // Confirm update (operation succeeded)
  const confirmUpdate = useCallback((id: string, finalData: T) => {
    setPendingUpdates(prev => 
      prev.map(update => 
        update.id === id 
          ? { ...update, status: 'success' as const }
          : update
      )
    );

    // Update current data with final result
    setCurrentData(finalData);

    // Remove confirmed update after a short delay
    setTimeout(() => {
      setPendingUpdates(prev => prev.filter(update => update.id !== id));
    }, 1000);

    console.log(`[OptimisticUpdate] Confirmed update ${id}`);
  }, []);

  // Revert update (operation failed)
  const revertUpdate = useCallback((id: string) => {
    const update = pendingUpdates.find(u => u.id === id);
    if (!update) return;

    setPendingUpdates(prev => 
      prev.map(u => 
        u.id === id 
          ? { ...u, status: 'reverted' as const }
          : u
      )
    );

    // Revert to original data
    if (update.originalData !== undefined) {
      setCurrentData(update.originalData);
    }

    // Remove reverted update after a short delay
    setTimeout(() => {
      setPendingUpdates(prev => prev.filter(u => u.id !== id));
    }, 2000);

    console.log(`[OptimisticUpdate] Reverted update ${id}`);
  }, [pendingUpdates]);

  // Clear all updates
  const clearAllUpdates = useCallback(() => {
    setPendingUpdates([]);
    console.log('[OptimisticUpdate] Cleared all updates');
  }, []);

  // Get update by ID
  const getUpdateById = useCallback((id: string) => {
    return pendingUpdates.find(update => update.id === id);
  }, [pendingUpdates]);

  const isOptimistic = pendingUpdates.some(update => update.status === 'pending');

  return {
    optimisticData: currentData,
    isOptimistic,
    pendingUpdates,
    applyOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    clearAllUpdates,
    getUpdateById
  };
};

/**
 * Hook for workout plan optimistic updates
 */
export const useWorkoutPlanOptimisticUpdates = () => {
  const {
    optimisticData,
    isOptimistic,
    pendingUpdates,
    applyOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    clearAllUpdates,
    getUpdateById
  } = useOptimisticUpdates();

  // Optimistic save
  const optimisticSave = useCallback((planData: any) => {
    return applyOptimisticUpdate({
      type: 'update',
      data: planData,
      originalData: optimisticData
    });
  }, [applyOptimisticUpdate, optimisticData]);

  // Optimistic approval
  const optimisticApprove = useCallback((planData: any) => {
    return applyOptimisticUpdate({
      type: 'update',
      data: { ...planData, isApproved: true },
      originalData: optimisticData
    });
  }, [applyOptimisticUpdate, optimisticData]);

  return {
    optimisticData,
    isOptimistic,
    pendingUpdates,
    optimisticSave,
    optimisticApprove,
    confirmUpdate,
    revertUpdate,
    clearAllUpdates,
    getUpdateById
  };
};
