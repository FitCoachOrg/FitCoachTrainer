/**
 * Comprehensive Tests for useWorkoutData Hook
 * 
 * Tests the React hook that provides unified data fetching:
 * - Hook behavior and state management
 * - Error handling and retry logic
 * - Background refresh capabilities
 * - Optimistic updates
 * - Integration with WorkoutDataService
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkoutData, useOptimisticWorkoutData } from '../useWorkoutData';
import WorkoutDataService from '@/services/WorkoutDataService';
import { type WorkoutDataParams, type WorkoutDataResult } from '@/services/WorkoutDataService';

// Mock WorkoutDataService
jest.mock('@/services/WorkoutDataService');
const mockWorkoutDataService = WorkoutDataService as jest.Mocked<typeof WorkoutDataService>;

describe('useWorkoutData', () => {
  const mockParams: WorkoutDataParams = {
    clientId: 123,
    startDate: new Date('2024-01-01'),
    viewMode: 'weekly'
  };

  const mockResult: WorkoutDataResult = {
    status: 'draft',
    source: 'database',
    previewData: [
      {
        for_date: '2024-01-01',
        summary: 'Test Workout',
        details_json: { exercises: [] },
        is_approved: false
      }
    ],
    scheduleData: [],
    totalDays: 7,
    fetchedAt: Date.now(),
    viewMode: 'weekly',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-07'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkoutDataService.fetchWorkoutData.mockResolvedValue(mockResult);
    mockWorkoutDataService.getCachedData.mockReturnValue(null);
    mockWorkoutDataService.isDataStale.mockReturnValue(false);
  });

  describe('Basic Functionality', () => {
    it('should fetch data on mount', async () => {
      const { result } = renderHook(() => useWorkoutData(mockParams));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResult);
      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledWith(mockParams);
    });

    it('should return cached data immediately if available', async () => {
      mockWorkoutDataService.getCachedData.mockReturnValue(mockResult);

      const { result } = renderHook(() => useWorkoutData(mockParams));

      expect(result.current.data).toEqual(mockResult);
      expect(result.current.isLoading).toBe(false);
      expect(mockWorkoutDataService.fetchWorkoutData).not.toHaveBeenCalled();
    });

    it('should handle data staleness correctly', async () => {
      mockWorkoutDataService.getCachedData.mockReturnValue(mockResult);
      mockWorkoutDataService.isDataStale.mockReturnValue(true);

      const { result } = renderHook(() => useWorkoutData(mockParams));

      expect(result.current.data).toEqual(mockResult);
      expect(result.current.isStale).toBe(true);

      await waitFor(() => {
        expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const error = new Error('Network error');
      mockWorkoutDataService.fetchWorkoutData.mockRejectedValue(error);

      const { result } = renderHook(() => useWorkoutData(mockParams));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeNull();
    });

    it('should retry failed requests', async () => {
      const error = new Error('Network error');
      mockWorkoutDataService.fetchWorkoutData
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue(mockResult);

      const { result } = renderHook(() => useWorkoutData(mockParams, {
        retry: { attempts: 3, delay: 100 }
      }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.data).toEqual(mockResult);
      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledTimes(3);
    });

    it('should call onError callback when provided', async () => {
      const error = new Error('Network error');
      const onError = jest.fn();
      mockWorkoutDataService.fetchWorkoutData.mockRejectedValue(error);

      renderHook(() => useWorkoutData(mockParams, { onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('Success Callbacks', () => {
    it('should call onSuccess callback when data is fetched', async () => {
      const onSuccess = jest.fn();

      renderHook(() => useWorkoutData(mockParams, { onSuccess }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockResult);
      });
    });
  });

  describe('Manual Refresh', () => {
    it('should allow manual refresh', async () => {
      const { result } = renderHook(() => useWorkoutData(mockParams));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Manual refresh
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledTimes(2);
    });

    it('should allow force refresh', async () => {
      const { result } = renderHook(() => useWorkoutData(mockParams));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Force refresh
      await act(async () => {
        await result.current.refetch(true);
      });

      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledWith({
        ...mockParams,
        forceRefresh: true
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should allow cache invalidation', async () => {
      const { result } = renderHook(() => useWorkoutData(mockParams));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Invalidate cache
      await act(async () => {
        await result.current.invalidate();
      });

      expect(mockWorkoutDataService.invalidateCache).toHaveBeenCalledWith(mockParams);
      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Background Refresh', () => {
    it('should enable background refresh by default', async () => {
      mockWorkoutDataService.getCachedData.mockReturnValue(mockResult);
      mockWorkoutDataService.isDataStale.mockReturnValue(true);

      renderHook(() => useWorkoutData(mockParams));

      await waitFor(() => {
        expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalled();
      });
    });

    it('should disable background refresh when option is false', async () => {
      mockWorkoutDataService.getCachedData.mockReturnValue(mockResult);
      mockWorkoutDataService.isDataStale.mockReturnValue(true);

      renderHook(() => useWorkoutData(mockParams, {
        enableBackgroundRefresh: false
      }));

      // Wait a bit to ensure no background refresh happens
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockWorkoutDataService.fetchWorkoutData).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Changes', () => {
    it('should refetch when parameters change', async () => {
      const { result, rerender } = renderHook(
        ({ params }) => useWorkoutData(params),
        { initialProps: { params: mockParams } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newParams = { ...mockParams, viewMode: 'monthly' as const };
      rerender({ params: newParams });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockWorkoutDataService.fetchWorkoutData).toHaveBeenCalledWith(newParams);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useWorkoutData(mockParams));

      unmount();

      // Should not throw any errors during cleanup
      expect(true).toBe(true);
    });
  });
});

describe('useOptimisticWorkoutData', () => {
  const mockParams: WorkoutDataParams = {
    clientId: 123,
    startDate: new Date('2024-01-01'),
    viewMode: 'weekly'
  };

  const mockResult: WorkoutDataResult = {
    status: 'draft',
    source: 'database',
    previewData: [],
    scheduleData: [],
    totalDays: 7,
    fetchedAt: Date.now(),
    viewMode: 'weekly',
    dateRange: { start: '2024-01-01', end: '2024-01-07' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorkoutDataService.fetchWorkoutData.mockResolvedValue(mockResult);
    mockWorkoutDataService.getCachedData.mockReturnValue(null);
  });

  it('should provide optimistic update functionality', async () => {
    const { result } = renderHook(() => useOptimisticWorkoutData(mockParams));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResult);
    });

    // Apply optimistic update
    act(() => {
      result.current.applyOptimisticUpdate((data) => ({
        ...data,
        status: 'approved' as const
      }));
    });

    expect(result.current.data?.status).toBe('approved');
    expect(result.current.hasOptimisticUpdate).toBe(true);

    // Clear optimistic update
    act(() => {
      result.current.clearOptimisticUpdate();
    });

    expect(result.current.data?.status).toBe('draft');
    expect(result.current.hasOptimisticUpdate).toBe(false);
  });

  it('should fallback to base data when no optimistic update', async () => {
    const { result } = renderHook(() => useOptimisticWorkoutData(mockParams));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockResult);
    });

    expect(result.current.hasOptimisticUpdate).toBe(false);
  });
});
