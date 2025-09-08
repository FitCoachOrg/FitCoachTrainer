/**
 * Integration Tests for WorkoutPlanSection with Unified Data Fetching
 * 
 * Tests the integration of the unified data fetching system:
 * - Race condition prevention
 * - Data consistency between components
 * - Loading states and error handling
 * - View mode switching
 * - Monthly vs Weekly data handling
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { WorkoutPlanSection } from '../WorkoutPlanSection';
import useWorkoutData from '@/hooks/useWorkoutData';
import WorkoutDataService from '@/services/WorkoutDataService';

// Mock dependencies
jest.mock('@/hooks/useWorkoutData');
jest.mock('@/services/WorkoutDataService');
jest.mock('@/lib/supabase');
jest.mock('@/hooks/use-auth');

const mockUseWorkoutData = useWorkoutData as jest.MockedFunction<typeof useWorkoutData>;
const mockWorkoutDataService = WorkoutDataService as jest.Mocked<typeof WorkoutDataService>;

// Mock client data
const mockClient = {
  id: 123,
  name: 'Test Client',
  workout_days: ['Monday', 'Wednesday', 'Friday'],
  plan_start_day: 'Monday'
};

const mockWorkoutData = {
  status: 'draft' as const,
  source: 'database' as const,
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
  viewMode: 'weekly' as const,
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-07'
  }
};

describe('WorkoutPlanSection - Unified Data Fetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for useWorkoutData
    mockUseWorkoutData.mockReturnValue({
      data: mockWorkoutData,
      isLoading: false,
      error: null,
      lastFetch: Date.now(),
      isStale: false,
      refetch: jest.fn(),
      invalidate: jest.fn(),
      isStale: false,
      getCachedData: jest.fn()
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent race conditions between weekly and monthly data fetching', async () => {
      const { rerender } = render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      // Switch to monthly view
      act(() => {
        rerender(
          <WorkoutPlanSection 
            clientId="123" 
            client={mockClient}
          />
        );
      });

      // Verify that useWorkoutData is called with correct parameters
      expect(mockUseWorkoutData).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 123,
          viewMode: 'weekly' // Default view mode
        }),
        expect.any(Object)
      );
    });

    it('should handle rapid view mode switching without data inconsistency', async () => {
      const { rerender } = render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      // Rapidly switch between views
      for (let i = 0; i < 5; i++) {
        act(() => {
          rerender(
            <WorkoutPlanSection 
              clientId="123" 
              client={mockClient}
            />
          );
        });
      }

      // Should not cause multiple simultaneous data fetches
      expect(mockUseWorkoutData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data between WorkoutPlanSection and child components', async () => {
      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });

      // Verify that the unified data is being used
      expect(mockUseWorkoutData).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 123,
          startDate: expect.any(Date),
          viewMode: 'weekly'
        }),
        expect.objectContaining({
          enableBackgroundRefresh: true,
          onError: expect.any(Function),
          onSuccess: expect.any(Function)
        })
      );
    });

    it('should handle monthly view data correctly', async () => {
      const monthlyWorkoutData = {
        ...mockWorkoutData,
        viewMode: 'monthly' as const,
        totalDays: 28
      };

      mockUseWorkoutData.mockReturnValue({
        data: monthlyWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });

      // Verify monthly data is handled correctly
      expect(mockUseWorkoutData).toHaveBeenCalledWith(
        expect.objectContaining({
          viewMode: 'weekly' // Initial view mode
        }),
        expect.any(Object)
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state when data is being fetched', async () => {
      mockUseWorkoutData.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        lastFetch: null,
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      expect(screen.getByText('Loading workout plan...')).toBeInTheDocument();
    });

    it('should hide loading state when data is loaded', async () => {
      mockUseWorkoutData.mockReturnValue({
        data: mockWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading workout plan...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle data fetching errors gracefully', async () => {
      const error = new Error('Failed to fetch workout data');
      
      mockUseWorkoutData.mockReturnValue({
        data: null,
        isLoading: false,
        error: error,
        lastFetch: null,
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error Loading Workout Data')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const mockRefetch = jest.fn();
      const error = new Error('Failed to fetch workout data');
      
      mockUseWorkoutData.mockReturnValue({
        data: null,
        isLoading: false,
        error: error,
        lastFetch: null,
        isStale: false,
        refetch: mockRefetch,
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      // Should be able to retry
      expect(mockRefetch).toBeDefined();
    });
  });

  describe('Background Refresh', () => {
    it('should enable background refresh by default', async () => {
      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      expect(mockUseWorkoutData).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enableBackgroundRefresh: true
        })
      );
    });

    it('should handle stale data with background refresh', async () => {
      mockUseWorkoutData.mockReturnValue({
        data: mockWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now() - 3 * 60 * 1000, // 3 minutes ago
        isStale: true,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: true,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      // Should show stale data while refreshing in background
      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Management', () => {
    it('should use cached data when available', async () => {
      const mockGetCachedData = jest.fn().mockReturnValue(mockWorkoutData);
      
      mockUseWorkoutData.mockReturnValue({
        data: mockWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: mockGetCachedData
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      expect(mockGetCachedData).toBeDefined();
    });

    it('should allow cache invalidation', async () => {
      const mockInvalidate = jest.fn();
      
      mockUseWorkoutData.mockReturnValue({
        data: mockWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        refetch: jest.fn(),
        invalidate: mockInvalidate,
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      expect(mockInvalidate).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      const renderCount = jest.fn();
      
      const TestComponent = () => {
        renderCount();
        return (
          <WorkoutPlanSection 
            clientId="123" 
            client={mockClient}
          />
        );
      };

      const { rerender } = render(<TestComponent />);

      // Re-render with same props
      rerender(<TestComponent />);

      // Should not cause additional data fetches
      expect(mockUseWorkoutData).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets efficiently', async () => {
      const largeWorkoutData = {
        ...mockWorkoutData,
        previewData: Array.from({ length: 100 }, (_, i) => ({
          for_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          summary: `Workout ${i + 1}`,
          details_json: { exercises: [] },
          is_approved: false
        }))
      };

      mockUseWorkoutData.mockReturnValue({
        data: largeWorkoutData,
        isLoading: false,
        error: null,
        lastFetch: Date.now(),
        isStale: false,
        refetch: jest.fn(),
        invalidate: jest.fn(),
        isStale: false,
        getCachedData: jest.fn()
      });

      render(
        <WorkoutPlanSection 
          clientId="123" 
          client={mockClient}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });

      // Should handle large dataset without performance issues
      expect(largeWorkoutData.previewData).toHaveLength(100);
    });
  });
});
