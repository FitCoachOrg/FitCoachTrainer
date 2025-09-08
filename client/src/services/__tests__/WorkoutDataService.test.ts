/**
 * Comprehensive Tests for WorkoutDataService
 * 
 * Tests the unified data fetching service to ensure:
 * - Request deduplication works correctly
 * - Caching behavior is proper
 * - Race conditions are prevented
 * - Error handling is robust
 * - Performance monitoring is accurate
 */

import WorkoutDataService, { type WorkoutDataParams, type WorkoutDataResult } from '../WorkoutDataService';
import { supabase } from '@/lib/supabase';
import { checkWorkoutApprovalStatus } from '@/utils/workoutStatusUtils';
import RequestDeduplication from '@/utils/requestDeduplication';
import performanceMonitor from '@/utils/performanceMonitor';
import errorRecoveryManager from '@/utils/errorRecovery';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/utils/workoutStatusUtils');
jest.mock('@/utils/requestDeduplication');
jest.mock('@/utils/performanceMonitor');
jest.mock('@/utils/errorRecovery');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockCheckWorkoutApprovalStatus = checkWorkoutApprovalStatus as jest.MockedFunction<typeof checkWorkoutApprovalStatus>;
const mockRequestDeduplication = RequestDeduplication as jest.Mocked<typeof RequestDeduplication>;
const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>;
const mockErrorRecoveryManager = errorRecoveryManager as jest.Mocked<typeof errorRecoveryManager>;

describe('WorkoutDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    WorkoutDataService.clearCache();
    
    // Setup default mocks
    mockRequestDeduplication.execute.mockImplementation(async (key, fn) => fn());
    mockPerformanceMonitor.startOperation.mockReturnValue('test-operation-id');
    mockErrorRecoveryManager.executeWithRecovery.mockImplementation(async (fn) => fn());
  });

  describe('fetchWorkoutData', () => {
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

    it('should fetch data successfully for weekly view', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      const result = await WorkoutDataService.fetchWorkoutData(mockParams);

      expect(result).toEqual(mockResult);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledWith(
        mockSupabase,
        123,
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );
    });

    it('should fetch data successfully for monthly view', async () => {
      const monthlyParams = { ...mockParams, viewMode: 'monthly' as const };
      const monthlyResult = { ...mockResult, viewMode: 'monthly' as const, totalDays: 28 };
      
      mockCheckWorkoutApprovalStatus.mockResolvedValue(monthlyResult);

      const result = await WorkoutDataService.fetchWorkoutData(monthlyParams);

      expect(result).toEqual(monthlyResult);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledWith(
        mockSupabase,
        123,
        new Date('2024-01-01'),
        new Date('2024-01-28')
      );
    });

    it('should use request deduplication to prevent duplicate calls', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // Make multiple simultaneous calls
      const promises = [
        WorkoutDataService.fetchWorkoutData(mockParams),
        WorkoutDataService.fetchWorkoutData(mockParams),
        WorkoutDataService.fetchWorkoutData(mockParams)
      ];

      await Promise.all(promises);

      // Should only call the actual fetch function once due to deduplication
      expect(mockRequestDeduplication.execute).toHaveBeenCalledTimes(3);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledTimes(1);
    });

    it('should cache results and return cached data on subsequent calls', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // First call
      const result1 = await WorkoutDataService.fetchWorkoutData(mockParams);
      expect(result1).toEqual(mockResult);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledTimes(1);

      // Second call should return cached data
      const result2 = await WorkoutDataService.fetchWorkoutData(mockParams);
      expect(result2).toEqual(mockResult);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when forceRefresh is true', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // First call
      await WorkoutDataService.fetchWorkoutData(mockParams);
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledTimes(1);

      // Second call with force refresh
      await WorkoutDataService.fetchWorkoutData({ ...mockParams, forceRefresh: true });
      expect(mockCheckWorkoutApprovalStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockCheckWorkoutApprovalStatus.mockRejectedValue(error);

      await expect(WorkoutDataService.fetchWorkoutData(mockParams)).rejects.toThrow(error);
    });

    it('should use error recovery for failed requests', async () => {
      const error = new Error('Network error');
      mockCheckWorkoutApprovalStatus.mockRejectedValue(error);

      await expect(WorkoutDataService.fetchWorkoutData(mockParams)).rejects.toThrow(error);
      expect(mockErrorRecoveryManager.executeWithRecovery).toHaveBeenCalled();
    });

    it('should monitor performance correctly', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      await WorkoutDataService.fetchWorkoutData(mockParams);

      expect(mockPerformanceMonitor.startOperation).toHaveBeenCalledWith(
        'workout-data-fetch',
        'WorkoutDataService',
        expect.objectContaining({
          clientId: 123,
          viewMode: 'weekly',
          startDate: '2024-01-01T00:00:00.000Z'
        })
      );
      expect(mockPerformanceMonitor.completeOperation).toHaveBeenCalledWith(
        'test-operation-id',
        true,
        expect.objectContaining({
          duration: expect.any(Number),
          dataSize: expect.any(Number),
          viewMode: 'weekly'
        })
      );
    });
  });

  describe('getCachedData', () => {
    it('should return cached data if available', async () => {
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

      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // Fetch data first to populate cache
      await WorkoutDataService.fetchWorkoutData(mockParams);

      // Get cached data
      const cachedData = WorkoutDataService.getCachedData(mockParams);
      expect(cachedData).toEqual(mockResult);
    });

    it('should return null if no cached data available', () => {
      const cachedData = WorkoutDataService.getCachedData(mockParams);
      expect(cachedData).toBeNull();
    });
  });

  describe('isDataStale', () => {
    it('should return true for stale data', async () => {
      const mockResult: WorkoutDataResult = {
        status: 'draft',
        source: 'database',
        previewData: [],
        scheduleData: [],
        totalDays: 7,
        fetchedAt: Date.now() - 3 * 60 * 1000, // 3 minutes ago
        viewMode: 'weekly',
        dateRange: { start: '2024-01-01', end: '2024-01-07' }
      };

      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);
      await WorkoutDataService.fetchWorkoutData(mockParams);

      const isStale = WorkoutDataService.isDataStale(mockParams);
      expect(isStale).toBe(true);
    });

    it('should return false for fresh data', async () => {
      const mockResult: WorkoutDataResult = {
        status: 'draft',
        source: 'database',
        previewData: [],
        scheduleData: [],
        totalDays: 7,
        fetchedAt: Date.now() - 30 * 1000, // 30 seconds ago
        viewMode: 'weekly',
        dateRange: { start: '2024-01-01', end: '2024-01-07' }
      };

      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);
      await WorkoutDataService.fetchWorkoutData(mockParams);

      const isStale = WorkoutDataService.isDataStale(mockParams);
      expect(isStale).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should remove cached data for specific parameters', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // Fetch and cache data
      await WorkoutDataService.fetchWorkoutData(mockParams);
      expect(WorkoutDataService.getCachedData(mockParams)).toEqual(mockResult);

      // Invalidate cache
      WorkoutDataService.invalidateCache(mockParams);
      expect(WorkoutDataService.getCachedData(mockParams)).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should remove all cached data', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // Fetch and cache data
      await WorkoutDataService.fetchWorkoutData(mockParams);
      expect(WorkoutDataService.getCachedData(mockParams)).toEqual(mockResult);

      // Clear all cache
      WorkoutDataService.clearCache();
      expect(WorkoutDataService.getCachedData(mockParams)).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', async () => {
      mockCheckWorkoutApprovalStatus.mockResolvedValue(mockResult);

      // Initially empty
      let stats = WorkoutDataService.getCacheStats();
      expect(stats.size).toBe(0);

      // After caching data
      await WorkoutDataService.fetchWorkoutData(mockParams);
      stats = WorkoutDataService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toHaveLength(1);
      expect(stats.oldestEntry).toBe(stats.newestEntry);
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      // Mock expired data
      const expiredResult: WorkoutDataResult = {
        ...mockResult,
        fetchedAt: Date.now() - 10 * 60 * 1000 // 10 minutes ago
      };

      mockCheckWorkoutApprovalStatus.mockResolvedValue(expiredResult);
      await WorkoutDataService.fetchWorkoutData(mockParams);

      // Verify data is cached
      expect(WorkoutDataService.getCachedData(mockParams)).toEqual(expiredResult);

      // Cleanup expired entries
      WorkoutDataService.cleanupExpiredCache();

      // Verify expired data is removed
      expect(WorkoutDataService.getCachedData(mockParams)).toBeNull();
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent race conditions with AbortController', async () => {
      const slowPromise = new Promise<WorkoutDataResult>((resolve) => {
        setTimeout(() => resolve(mockResult), 100);
      });
      
      mockCheckWorkoutApprovalStatus.mockReturnValue(slowPromise);

      // Start first request
      const promise1 = WorkoutDataService.fetchWorkoutData(mockParams);
      
      // Start second request (should cancel first)
      const promise2 = WorkoutDataService.fetchWorkoutData(mockParams);

      const results = await Promise.all([promise1, promise2]);
      
      // Both should resolve successfully
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResult);
      expect(results[1]).toEqual(mockResult);
    });
  });
});
