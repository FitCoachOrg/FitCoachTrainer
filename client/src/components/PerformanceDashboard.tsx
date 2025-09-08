/**
 * Performance Dashboard Component
 * 
 * Real-time performance monitoring dashboard showing:
 * - Operation statistics
 * - Performance alerts
 * - Circuit breaker status
 * - System health metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import unifiedRefreshManager from '@/utils/unifiedRefreshManager';
import { PerformanceStats, PerformanceAlert } from '@/utils/performanceMonitor';

export interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<Record<string, any>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const dashboard = unifiedRefreshManager.getPerformanceDashboard();
      setStats(dashboard.stats);
      setAlerts(dashboard.recentAlerts);
      setCircuitBreakers(errorRecoveryManager.getAllCircuitBreakerStatuses());
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    refreshData();
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`performance-dashboard fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Performance Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = unifiedRefreshManager.exportPerformanceData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-data-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Operation Statistics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalOperations || 0}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Activity className="h-3 w-3" />
                {stats?.operationsPerMinute.toFixed(1) || 0} ops/min
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(1 - (stats?.errorRate || 0))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" />
                {stats?.successfulOperations || 0} successful
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(stats?.averageDuration || 0)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                P95: {formatDuration(stats?.p95Duration || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(stats?.errorRate || 0)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <AlertTriangle className="h-3 w-3" />
                {stats?.failedOperations || 0} failed
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Recent Alerts
              </CardTitle>
              <CardDescription>
                Performance alerts and system warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>No alerts</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={`p-1 rounded-full ${getSeverityColor(alert.severity)}`}>
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Circuit Breaker Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Circuit Breakers
              </CardTitle>
              <CardDescription>
                System protection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.keys(circuitBreakers).length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>All circuits closed</p>
                  </div>
                ) : (
                  Object.entries(circuitBreakers).map(([key, status]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${status.isOpen ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          <Zap className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {key}
                          </p>
                          <p className="text-xs text-gray-500">
                            {status.failureCount} failures
                          </p>
                        </div>
                      </div>
                      <Badge variant={status.isOpen ? 'destructive' : 'default'}>
                        {status.isOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
