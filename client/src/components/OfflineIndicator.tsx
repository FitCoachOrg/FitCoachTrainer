/**
 * Offline Indicator Component
 * 
 * Shows offline status and queued operations with sync progress
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Cloud,
  CloudOff
} from 'lucide-react';
import offlineManager, { OfflineState, QueuedOperation } from '@/utils/offlineManager';

export interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    queuedOperations: [],
    lastSyncTime: null,
    syncInProgress: false
  });

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineState);
    return unsubscribe;
  }, []);

  const { isOnline, queuedOperations, lastSyncTime, syncInProgress } = offlineState;

  // Don't show anything if online and no queued operations
  if (isOnline && queuedOperations.length === 0) {
    return null;
  }

  const handleSyncNow = () => {
    offlineManager.syncOperations();
  };

  const handleClearQueue = () => {
    offlineManager.clearQueuedOperations();
  };

  const getStatusIcon = () => {
    if (syncInProgress) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isOnline) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (syncInProgress) {
      return 'Syncing...';
    }
    if (isOnline) {
      return queuedOperations.length > 0 ? 'Online (queued)' : 'Online';
    }
    return 'Offline';
  };

  const getStatusColor = () => {
    if (syncInProgress) return 'text-blue-600';
    if (isOnline) return 'text-green-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`offline-indicator ${className}`}>
      {/* Main Status Indicator */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {queuedOperations.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {queuedOperations.length} queued
          </Badge>
        )}
      </div>

      {/* Detailed View */}
      {showDetails && queuedOperations.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Queued Operations
            </h4>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={!isOnline || syncInProgress}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                className="h-6 px-2 text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {queuedOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {operation.type === 'SAVE' && <Cloud className="h-3 w-3 text-blue-500" />}
                    {operation.type === 'APPROVE' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {operation.type === 'DELETE' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {operation.type === 'UPDATE' && <RefreshCw className="h-3 w-3 text-orange-500" />}
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {operation.type}
                    </span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getPriorityColor(operation.priority)}`}>
                    {operation.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatTime(operation.timestamp)}
                  {operation.retryCount > 0 && (
                    <span className="text-orange-600">
                      (retry {operation.retryCount})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lastSyncTime && (
            <div className="mt-2 text-xs text-gray-500">
              Last sync: {formatTime(lastSyncTime)}
            </div>
          )}
        </div>
      )}

      {/* Sync Progress */}
      {syncInProgress && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Syncing {queuedOperations.length} operations...</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Offline Status Badge
 */
export const OfflineStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    queuedOperations: [],
    lastSyncTime: null,
    syncInProgress: false
  });

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineState);
    return unsubscribe;
  }, []);

  const { isOnline, queuedOperations, syncInProgress } = offlineState;

  if (isOnline && queuedOperations.length === 0) {
    return null;
  }

  return (
    <div className={`offline-status-badge ${className}`}>
      {syncInProgress ? (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      ) : isOnline ? (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <CloudOff className="h-3 w-3 mr-1" />
          {queuedOperations.length} queued
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
    </div>
  );
};
