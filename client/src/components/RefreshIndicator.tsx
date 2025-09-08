/**
 * RefreshIndicator Component
 * 
 * Industry-standard loading and error states for refresh operations
 */

import React from 'react';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshState } from '@/utils/unifiedRefreshManager';

export interface RefreshIndicatorProps {
  state: RefreshState;
  onRetry?: () => void;
  onCancel?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  state,
  onRetry,
  onCancel,
  className = '',
  showDetails = false
}) => {
  const { isRefreshing, errors, pendingOperations, lastRefresh } = state;
  
  // Don't show anything if not refreshing and no errors
  if (!isRefreshing && errors.length === 0) {
    return null;
  }
  
  return (
    <div className={`refresh-indicator ${className}`}>
      {/* Loading State */}
      {isRefreshing && (
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Syncing changes...
            {showDetails && pendingOperations.length > 0 && (
              <span className="ml-2 text-xs opacity-75">
                ({pendingOperations.length} operation{pendingOperations.length > 1 ? 's' : ''})
              </span>
            )}
          </span>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      {/* Error State */}
      {errors.length > 0 && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            Sync failed
            {showDetails && (
              <span className="ml-2 text-xs opacity-75">
                ({errors.length} error{errors.length > 1 ? 's' : ''})
              </span>
            )}
          </span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
      
      {/* Success State (brief) */}
      {!isRefreshing && errors.length === 0 && lastRefresh && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Synced</span>
        </div>
      )}
    </div>
  );
};

/**
 * Error Recovery Component
 */
export interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onCancel?: () => void;
  maxRetries?: number;
  retryCount?: number;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onCancel,
  maxRetries = 3,
  retryCount = 0
}) => {
  const canRetry = retryCount < maxRetries;
  const retriesLeft = maxRetries - retryCount;
  
  return (
    <div className="error-recovery p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Sync Failed
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            {error.message || 'An error occurred while syncing your changes.'}
          </p>
          <div className="flex gap-2">
            {canRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry ({retriesLeft} left)
              </Button>
            )}
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Cancel
              </Button>
            )}
          </div>
          {!canRetry && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Maximum retries reached. Please refresh the page or contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Optimistic Update Indicator
 */
export interface OptimisticUpdateProps {
  isOptimistic: boolean;
  onRevert?: () => void;
  className?: string;
}

export const OptimisticUpdateIndicator: React.FC<OptimisticUpdateProps> = ({
  isOptimistic,
  onRevert,
  className = ''
}) => {
  if (!isOptimistic) return null;
  
  return (
    <div className={`optimistic-update ${className}`}>
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
        <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium">Changes pending sync</span>
        {onRevert && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevert}
            className="h-4 w-4 p-0 text-orange-600 hover:text-orange-800"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  );
};
