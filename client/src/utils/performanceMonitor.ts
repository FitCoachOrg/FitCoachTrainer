/**
 * Performance Monitoring System
 * 
 * Tracks and analyzes performance metrics for operations, providing
 * insights into system performance and bottlenecks.
 */

export interface PerformanceMetric {
  operationId: string;
  operationType: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  p99Duration: number;
  operationsPerMinute: number;
  errorRate: number;
}

export interface PerformanceAlert {
  type: 'slow_operation' | 'high_error_rate' | 'circuit_breaker_open';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private operationStartTimes = new Map<string, number>(); // Track operation start times
  private alertThresholds = {
    slowOperation: 5000, // 5 seconds
    highErrorRate: 0.1, // 10%
    circuitBreakerOpen: true
  };

  /**
   * Start tracking an operation
   */
  startOperation(operationId: string, operationType: string, metadata?: Record<string, any>): Record<string, any> {
    const startTime = performance.now();
    
    // Store start time in both metadata and global tracking map
    if (!metadata) metadata = {};
    metadata._startTime = startTime;
    metadata._operationId = operationId;
    metadata._operationType = operationType;
    
    // Also store in global tracking map as fallback
    this.operationStartTimes.set(operationId, startTime);
    
    console.log(`[PerformanceMonitor] Started ${operationType} operation: ${operationId}`);
    
    // Return the metadata so it can be passed to completeOperation
    return metadata;
  }

  /**
   * Complete tracking an operation
   */
  completeOperation(
    operationId: string, 
    success: boolean, 
    error?: string, 
    metadata?: Record<string, any>
  ): void {
    const endTime = performance.now();
    
    if (!metadata || !metadata._startTime) {
      console.warn(`[PerformanceMonitor] No start time found for operation: ${operationId}`);
      // Try to find the operation in a global tracking map as fallback
      const fallbackStartTime = this.findOperationStartTime(operationId);
      if (!fallbackStartTime) {
        console.warn(`[PerformanceMonitor] Could not find start time for operation: ${operationId}, skipping metric`);
        return;
      }
      // Use fallback start time
      metadata = metadata || {};
      metadata._startTime = fallbackStartTime;
    }
    
    const startTime = metadata._startTime;
    const operationType = metadata._operationType || 'unknown';
    const duration = endTime - startTime;
    
    const metric: PerformanceMetric = {
      operationId,
      operationType,
      startTime,
      endTime,
      duration,
      success,
      error,
      metadata: { ...metadata }
    };
    
    // Remove internal tracking fields
    delete metric.metadata!._startTime;
    delete metric.metadata!._operationId;
    delete metric.metadata!._operationType;
    
    // Clean up global tracking map
    this.operationStartTimes.delete(operationId);
    
    this.addMetric(metric);
    this.checkAlerts(metric);
    
    console.log(`[PerformanceMonitor] Completed ${operationType} operation: ${operationId} in ${duration.toFixed(2)}ms`);
  }

  /**
   * Find operation start time from global tracking map
   */
  private findOperationStartTime(operationId: string): number | null {
    return this.operationStartTimes.get(operationId) || null;
  }

  /**
   * Add metric to storage
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metric: PerformanceMetric): void {
    // Slow operation alert
    if (metric.duration > this.alertThresholds.slowOperation) {
      this.addAlert({
        type: 'slow_operation',
        message: `Operation ${metric.operationType} took ${metric.duration.toFixed(2)}ms`,
        severity: metric.duration > 10000 ? 'critical' : 'high',
        timestamp: Date.now(),
        metadata: {
          operationId: metric.operationId,
          operationType: metric.operationType,
          duration: metric.duration
        }
      });
    }
    
    // High error rate alert (check last 10 operations)
    const recentMetrics = this.metrics.slice(-10);
    if (recentMetrics.length >= 10) {
      const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
      if (errorRate > this.alertThresholds.highErrorRate) {
        this.addAlert({
          type: 'high_error_rate',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.5 ? 'critical' : 'medium',
          timestamp: Date.now(),
          metadata: {
            errorRate,
            recentOperations: recentMetrics.length
          }
        });
      }
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    console.warn(`[PerformanceMonitor] Alert: ${alert.message}`, alert);
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): PerformanceStats {
    let metrics = this.metrics;
    
    // Filter by time window if specified
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      metrics = metrics.filter(m => m.startTime >= cutoff);
    }
    
    if (metrics.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        operationsPerMinute: 0,
        errorRate: 0
      };
    }
    
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);
    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    
    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95Duration = durations[p95Index] || 0;
    const p99Duration = durations[p99Index] || 0;
    
    // Calculate operations per minute
    const timeSpan = metrics.length > 1 ? 
      (metrics[metrics.length - 1].startTime - metrics[0].startTime) / 1000 / 60 : 1;
    const operationsPerMinute = metrics.length / Math.max(timeSpan, 1);
    
    const errorRate = failed.length / metrics.length;
    
    return {
      totalOperations: metrics.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration,
      minDuration,
      maxDuration,
      p95Duration,
      p99Duration,
      operationsPerMinute,
      errorRate
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count: number = 10): PerformanceAlert[] {
    return this.alerts.slice(-count);
  }

  /**
   * Get metrics for specific operation type
   */
  getMetricsForOperation(operationType: string, timeWindow?: number): PerformanceMetric[] {
    let metrics = this.metrics.filter(m => m.operationType === operationType);
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      metrics = metrics.filter(m => m.startTime >= cutoff);
    }
    
    return metrics;
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
    console.log('[PerformanceMonitor] Cleared all metrics and alerts');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      stats: this.getStats(),
      timestamp: Date.now()
    }, null, 2);
  }

  /**
   * Get performance summary for dashboard
   */
  getDashboardSummary(): {
    stats: PerformanceStats;
    recentAlerts: PerformanceAlert[];
    topSlowOperations: Array<{ operationType: string; averageDuration: number; count: number }>;
  } {
    const stats = this.getStats();
    const recentAlerts = this.getRecentAlerts(5);
    
    // Group by operation type and calculate averages
    const operationGroups = new Map<string, { totalDuration: number; count: number }>();
    
    this.metrics.forEach(metric => {
      const existing = operationGroups.get(metric.operationType) || { totalDuration: 0, count: 0 };
      operationGroups.set(metric.operationType, {
        totalDuration: existing.totalDuration + metric.duration,
        count: existing.count + 1
      });
    });
    
    const topSlowOperations = Array.from(operationGroups.entries())
      .map(([operationType, data]) => ({
        operationType,
        averageDuration: data.totalDuration / data.count,
        count: data.count
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);
    
    return {
      stats,
      recentAlerts,
      topSlowOperations
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

/**
 * Performance tracking decorator
 */
export function trackPerformance(operationType: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const operationId = `${operationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const performanceMetadata = performanceMonitor.startOperation(operationId, operationType, {
        method: propertyName,
        args: args.length
      });
      
      try {
        const result = await method.apply(this, args);
        performanceMonitor.completeOperation(operationId, true, undefined, {
          ...performanceMetadata,
          resultType: typeof result
        });
        return result;
      } catch (error) {
        performanceMonitor.completeOperation(operationId, false, (error as Error).message, {
          ...performanceMetadata,
          errorType: (error as Error).constructor.name
        });
        throw error;
      }
    };
    
    return descriptor;
  };
}
