/**
 * WorkoutDataService - Unified Data Fetching Service
 * 
 * Industry-standard approach to managing workout data with:
 * - Single source of truth for all workout data
 * - Request deduplication and cancellation
 * - Intelligent caching with TTL
 * - Integration with existing infrastructure
 * - AbortController support for race condition prevention
 * 
 * Based on React Query/TanStack Query patterns and enterprise best practices
 */

import { supabase } from '@/lib/supabase';
import { checkWorkoutApprovalStatus, type WorkoutStatusResult } from '@/utils/workoutStatusUtils';
import RequestDeduplication from '@/utils/requestDeduplication';
import performanceMonitor from '@/utils/performanceMonitor';
import errorRecoveryManager from '@/utils/errorRecovery';
import DateManager from '@/utils/dateManager';
import { format, addDays } from 'date-fns';

export interface WorkoutDataParams {
  clientId: number;
  startDate: Date;
  viewMode: 'weekly' | 'monthly';
  forceRefresh?: boolean;
}

export interface WorkoutDataCache {
  data: WorkoutDataResult;
  timestamp: number;
  viewMode: 'weekly' | 'monthly';
  ttl: number; // Time to live in milliseconds
}

export interface WorkoutDataResult {
  status: 'no_plan' | 'draft' | 'approved' | 'partial_approved';
  source: 'generated' | 'template' | 'database';
  previewData: any[];
  scheduleData: any[];
  totalDays: number;
  weeklyBreakdown?: any[];
  error?: string;
  // Enhanced metadata
  fetchedAt: number;
  viewMode: 'weekly' | 'monthly';
  dateRange: {
    start: string;
    end: string;
  };
}

export interface WorkoutDataState {
  data: WorkoutDataResult | null;
  isLoading: boolean;
  error: Error | null;
  lastFetch: number | null;
  isStale: boolean;
}

class WorkoutDataService {
  private static cache = new Map<string, WorkoutDataCache>();
  private static abortControllers = new Map<string, AbortController>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  
  /**
   * Generate cache key for request deduplication with robust date validation
   */
  private static generateCacheKey(params: WorkoutDataParams): string {
    // Use DateManager for robust date validation
    const safeDate = DateManager.createSafeDate(params.startDate, new Date());
    const dateStr = DateManager.safeFormat(safeDate, 'yyyy-MM-dd');
    
    return `workout-data-${params.clientId}-${dateStr}-${params.viewMode}`;
  }
  
  /**
   * Cancel previous request for the same key
   */
  private static cancelPreviousRequest(key: string): void {
    const existingController = this.abortControllers.get(key);
    if (existingController) {
      console.log(`[WorkoutDataService] Cancelling previous request: ${key}`);
      existingController.abort();
      this.abortControllers.delete(key);
    }
  }
  
  /**
   * Check if cached data is still valid
   */
  private static isCacheValid(key: string, forceRefresh: boolean = false): boolean {
    if (forceRefresh) return false;
    
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < cached.ttl;
  }
  
  /**
   * Check if data is stale (needs background refresh)
   */
  private static isDataStale(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return true;
    
    const age = Date.now() - cached.timestamp;
    return age > this.STALE_THRESHOLD;
  }
  
  /**
   * Main unified data fetching method
   * Single entry point for all workout data requests
   */
  static async fetchWorkoutData(params: WorkoutDataParams): Promise<WorkoutDataResult> {
    // Enhanced parameter validation using DateManager
    if (!params.clientId) {
      throw new Error('Invalid parameters: clientId is required');
    }
    
    // Validate and normalize the start date
    const dateValidation = DateManager.validateDate(params.startDate);
    if (!dateValidation.isValid) {
      throw new Error(`Invalid startDate: ${dateValidation.error}`);
    }
    
    // Create safe parameters with validated date
    const safeParams: WorkoutDataParams = {
      ...params,
      startDate: dateValidation.date!
    };
    
    const key = this.generateCacheKey(safeParams);
    const startTime = Date.now();
    
    console.log(`[WorkoutDataService] Fetching workout data: ${key}`, {
      clientId: safeParams.clientId,
      startDate: safeParams.startDate.toISOString(),
      viewMode: safeParams.viewMode,
      forceRefresh: safeParams.forceRefresh
    });
    
    // Check cache first (unless force refresh)
    if (this.isCacheValid(key, safeParams.forceRefresh)) {
      const cached = this.cache.get(key)!;
      console.log(`[WorkoutDataService] Returning cached data: ${key} (age: ${Date.now() - cached.timestamp}ms)`);
      return {
        ...cached.data,
        fetchedAt: Date.now() // Update fetch time for staleness check
      };
    }
    
    // Use existing RequestDeduplication infrastructure
    return RequestDeduplication.execute(key, async () => {
      // Cancel any previous request for this key
      this.cancelPreviousRequest(key);
      
      // Create new abort controller
      const abortController = new AbortController();
      this.abortControllers.set(key, abortController);
      
      try {
        // Start performance monitoring
        const perfId = performanceMonitor.startOperation(
          'workout-data-fetch',
          'WorkoutDataService',
          {
            clientId: safeParams.clientId,
            viewMode: safeParams.viewMode,
            startDate: safeParams.startDate.toISOString()
          }
        );
        
        // Fetch data with error recovery
        const result = await errorRecoveryManager.executeWithRecovery(
          () => this.fetchFromDatabase(safeParams, abortController.signal),
          'workout-data-fetch',
          {
            maxRetries: 3,
            retryDelay: 1000,
            exponentialBackoff: true
          }
        );
        
        // Complete performance monitoring
        performanceMonitor.completeOperation(perfId, true, {
          duration: Date.now() - startTime,
          dataSize: result.previewData.length + result.scheduleData.length,
          viewMode: safeParams.viewMode
        });
        
        // Cache the result
        this.cache.set(key, {
          data: result,
          timestamp: Date.now(),
          viewMode: safeParams.viewMode,
          ttl: this.DEFAULT_TTL
        });
        
        console.log(`[WorkoutDataService] Successfully fetched and cached data: ${key}`, {
          previewDataCount: result.previewData.length,
          scheduleDataCount: result.scheduleData.length,
          status: result.status,
          duration: Date.now() - startTime
        });
        
        return result;
        
      } catch (error) {
        console.error(`[WorkoutDataService] Error fetching data: ${key}`, error);
        
        // Complete performance monitoring with error
        performanceMonitor.completeOperation(
          performanceMonitor.startOperation('workout-data-fetch', 'WorkoutDataService'),
          false,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        );
        
        throw error;
      } finally {
        // Clean up abort controller
        this.abortControllers.delete(key);
      }
    }, {
      timeout: 30000, // 30 second timeout
      showDuplicateMessage: true,
      duplicateMessage: 'Workout data is already being loaded. Please wait.',
      onDuplicate: () => {
        console.log(`[WorkoutDataService] Duplicate request detected: ${key}`);
      }
    });
  }
  
  /**
   * Fetch data from database with proper date range calculation using DateManager
   */
  private static async fetchFromDatabase(
    params: WorkoutDataParams,
    signal: AbortSignal
  ): Promise<WorkoutDataResult> {
    const daysToFetch = params.viewMode === 'monthly' ? 28 : 7;
    
    // Use DateManager for safe date calculations
    const endDate = DateManager.safeAddDays(params.startDate, daysToFetch - 1);
    
    console.log(`[WorkoutDataService] Fetching ${daysToFetch} days of data:`, {
      startDate: DateManager.safeFormat(params.startDate, 'yyyy-MM-dd'),
      endDate: DateManager.safeFormat(endDate, 'yyyy-MM-dd'),
      viewMode: params.viewMode
    });
    
    // Single unified database call - no more separate weekly/monthly functions
    const result = await checkWorkoutApprovalStatus(
      supabase,
      params.clientId,
      params.startDate,
      endDate
    );
    
    // Enhance result with metadata
    const enhancedResult: WorkoutDataResult = {
      ...result,
      fetchedAt: Date.now(),
      viewMode: params.viewMode,
      dateRange: {
        start: DateManager.safeFormat(params.startDate, 'yyyy-MM-dd'),
        end: DateManager.safeFormat(endDate, 'yyyy-MM-dd')
      }
    };
    
    return enhancedResult;
  }
  
  /**
   * Get cached data if available (for immediate UI updates)
   */
  static getCachedData(params: WorkoutDataParams): WorkoutDataResult | null {
    const key = this.generateCacheKey(params);
    const cached = this.cache.get(key);
    
    if (cached) {
      return {
        ...cached.data,
        fetchedAt: Date.now()
      };
    }
    
    return null;
  }
  
  /**
   * Check if data is stale and needs refresh
   */
  static isDataStale(params: WorkoutDataParams): boolean {
    const key = this.generateCacheKey(params);
    return this.isDataStale(key);
  }
  
  /**
   * Invalidate cache for specific parameters
   */
  static invalidateCache(params: WorkoutDataParams): void {
    const key = this.generateCacheKey(params);
    this.cache.delete(key);
    console.log(`[WorkoutDataService] Cache invalidated: ${key}`);
  }
  
  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('[WorkoutDataService] All cache cleared');
  }
  
  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(c => c.timestamp);
    
    return {
      size: this.cache.size,
      keys,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
    };
  }
  
  /**
   * Cleanup expired cache entries
   */
  static cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[WorkoutDataService] Cleaned up ${cleanedCount} expired cache entries`);
    }
  }
}

// Auto-cleanup expired cache every 5 minutes
setInterval(() => {
  WorkoutDataService.cleanupExpiredCache();
}, 5 * 60 * 1000);

export default WorkoutDataService;
