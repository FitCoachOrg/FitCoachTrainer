/**
 * RequestLogger - Comprehensive logging utility for tracking request patterns, performance, and state changes
 * 
 * This logger helps identify:
 * - Database query patterns and timing
 * - State change cascades
 * - Memory leaks and stuck states
 * - Performance bottlenecks
 * 
 * Usage:
 * - RequestLogger.logDatabaseQuery() for all Supabase queries
 * - RequestLogger.logStateChange() for React state updates
 * - RequestLogger.logPerformance() for timing operations
 * - RequestLogger.logError() for error tracking
 */

export interface DatabaseQueryLog {
  id: string;
  timestamp: number;
  table: string;
  operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  clientId?: number;
  filters?: Record<string, any>;
  duration?: number;
  success: boolean;
  error?: string;
  resultCount?: number;
  component: string;
  stackTrace?: string;
}

export interface StateChangeLog {
  id: string;
  timestamp: number;
  component: string;
  stateName: string;
  oldValue: any;
  newValue: any;
  trigger: string; // useEffect, user action, API response, etc.
  stackTrace?: string;
}

export interface PerformanceLog {
  id: string;
  timestamp: number;
  operation: string;
  component: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  component: string;
  error: Error;
  context?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

class RequestLoggerClass {
  private dbLogs: DatabaseQueryLog[] = [];
  private stateLogs: StateChangeLog[] = [];
  private performanceLogs: PerformanceLog[] = [];
  private errorLogs: ErrorLog[] = [];
  private isEnabled: boolean = true;
  private maxLogs: number = 1000; // Prevent memory issues
  
  constructor() {
    // Enable logging in development and when explicitly requested
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('enableRequestLogging') === 'true';
    
    if (this.isEnabled) {
      console.log('🔍 RequestLogger initialized - tracking all requests and state changes');
    }
  }

  /**
   * Generate unique ID for logs
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current stack trace for debugging
   */
  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (error) {
      return (error as Error).stack?.split('\n').slice(3, 8).join('\n') || '';
    }
  }

  /**
   * Trim logs if they exceed max count
   */
  private trimLogs<T>(logs: T[]): T[] {
    if (logs.length > this.maxLogs) {
      return logs.slice(-this.maxLogs);
    }
    return logs;
  }

  /**
   * Log database queries with timing and metadata
   */
  logDatabaseQuery(
    table: string,
    operation: DatabaseQueryLog['operation'],
    component: string,
    options: {
      clientId?: number;
      filters?: Record<string, any>;
      startTime?: number;
      success?: boolean;
      error?: string;
      resultCount?: number;
    } = {}
  ): string {
    if (!this.isEnabled) return '';

    const id = this.generateId();
    const timestamp = Date.now();
    const duration = options.startTime ? timestamp - options.startTime : undefined;

    const log: DatabaseQueryLog = {
      id,
      timestamp,
      table,
      operation,
      component,
      clientId: options.clientId,
      filters: options.filters,
      duration,
      success: options.success ?? true,
      error: options.error,
      resultCount: options.resultCount,
      stackTrace: this.getStackTrace()
    };

    this.dbLogs.push(log);
    this.dbLogs = this.trimLogs(this.dbLogs);

    // Log to console with appropriate level
    const logLevel = options.success === false ? 'error' : duration && duration > 5000 ? 'warn' : 'log';
    const durationText = duration ? ` (${duration}ms)` : '';
    const errorText = options.error ? ` - ERROR: ${options.error}` : '';
    const countText = options.resultCount !== undefined ? ` - ${options.resultCount} results` : '';
    
    console[logLevel](
      `🗄️ [DB ${operation.toUpperCase()}] ${table}${durationText}${countText}${errorText}`,
      { component, filters: options.filters, id }
    );

    return id;
  }

  /**
   * Log React state changes
   */
  logStateChange(
    component: string,
    stateName: string,
    oldValue: any,
    newValue: any,
    trigger: string
  ): string {
    if (!this.isEnabled) return '';

    const id = this.generateId();
    const log: StateChangeLog = {
      id,
      timestamp: Date.now(),
      component,
      stateName,
      oldValue,
      newValue,
      trigger,
      stackTrace: this.getStackTrace()
    };

    this.stateLogs.push(log);
    this.stateLogs = this.trimLogs(this.stateLogs);

    // Only log significant state changes to avoid spam
    const isSignificant = 
      stateName.includes('loading') || 
      stateName.includes('error') || 
      stateName.includes('fetching') ||
      stateName.includes('generating') ||
      JSON.stringify(oldValue) !== JSON.stringify(newValue);

    if (isSignificant) {
      console.log(
        `🔄 [STATE] ${component}.${stateName}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`,
        { trigger, id }
      );
    }

    return id;
  }

  /**
   * Log performance timing for operations
   */
  logPerformance(
    operation: string,
    component: string,
    startTime: number,
    options: {
      success?: boolean;
      error?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    if (!this.isEnabled) return '';

    const id = this.generateId();
    const timestamp = Date.now();
    const duration = timestamp - startTime;

    const log: PerformanceLog = {
      id,
      timestamp,
      operation,
      component,
      duration,
      success: options.success ?? true,
      error: options.error,
      metadata: options.metadata
    };

    this.performanceLogs.push(log);
    this.performanceLogs = this.trimLogs(this.performanceLogs);

    // Log with appropriate level based on duration
    const logLevel = duration > 10000 ? 'error' : duration > 5000 ? 'warn' : 'log';
    const errorText = options.error ? ` - ERROR: ${options.error}` : '';
    
    console[logLevel](
      `⏱️ [PERF] ${operation} (${duration}ms)${errorText}`,
      { component, metadata: options.metadata, id }
    );

    return id;
  }

  /**
   * Log errors with context
   */
  logError(
    component: string,
    error: Error,
    context?: Record<string, any>
  ): string {
    if (!this.isEnabled) return '';

    const id = this.generateId();
    const log: ErrorLog = {
      id,
      timestamp: Date.now(),
      component,
      error,
      context,
      stackTrace: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorLogs.push(log);
    this.errorLogs = this.trimLogs(this.errorLogs);

    console.error(
      `❌ [ERROR] ${component}: ${error.message}`,
      { error, context, id }
    );

    return id;
  }

  /**
   * Get all logs for debugging
   */
  getAllLogs() {
    return {
      database: this.dbLogs,
      state: this.stateLogs,
      performance: this.performanceLogs,
      errors: this.errorLogs
    };
  }

  /**
   * Get logs for specific component
   */
  getLogsForComponent(component: string) {
    return {
      database: this.dbLogs.filter(log => log.component === component),
      state: this.stateLogs.filter(log => log.component === component),
      performance: this.performanceLogs.filter(log => log.component === component),
      errors: this.errorLogs.filter(log => log.component === component)
    };
  }

  /**
   * Get recent logs (last 5 minutes)
   */
  getRecentLogs(minutes: number = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return {
      database: this.dbLogs.filter(log => log.timestamp > cutoff),
      state: this.stateLogs.filter(log => log.timestamp > cutoff),
      performance: this.performanceLogs.filter(log => log.timestamp > cutoff),
      errors: this.errorLogs.filter(log => log.timestamp > cutoff)
    };
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformance() {
    const recentLogs = this.getRecentLogs(10);
    
    // Find slow database queries
    const slowQueries = recentLogs.database
      .filter(log => log.duration && log.duration > 2000)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    // Find stuck loading states
    const stuckStates = recentLogs.state
      .filter(log => 
        log.stateName.includes('loading') && 
        log.newValue === true
      )
      .filter(log => {
        // Check if there's a corresponding false value within reasonable time
        const laterLogs = recentLogs.state.filter(laterLog => 
          laterLog.timestamp > log.timestamp &&
          laterLog.component === log.component &&
          laterLog.stateName === log.stateName &&
          laterLog.newValue === false
        );
        return laterLogs.length === 0;
      });

    // Find frequent errors
    const errorGroups = recentLogs.errors.reduce((groups, log) => {
      const key = `${log.component}:${log.error.message}`;
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    // Find performance bottlenecks
    const slowOperations = recentLogs.performance
      .filter(log => log.duration > 3000)
      .sort((a, b) => b.duration - a.duration);

    console.group('🔍 Performance Analysis');
    
    if (slowQueries.length > 0) {
      console.warn('🐌 Slow Database Queries:', slowQueries);
    }
    
    if (stuckStates.length > 0) {
      console.error('🔒 Potentially Stuck Loading States:', stuckStates);
    }
    
    if (Object.keys(errorGroups).length > 0) {
      console.error('💥 Frequent Errors:', errorGroups);
    }
    
    if (slowOperations.length > 0) {
      console.warn('⏱️ Slow Operations:', slowOperations);
    }

    console.groupEnd();

    return {
      slowQueries,
      stuckStates,
      errorGroups,
      slowOperations
    };
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.dbLogs = [];
    this.stateLogs = [];
    this.performanceLogs = [];
    this.errorLogs = [];
    console.log('🗑️ RequestLogger logs cleared');
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('enableRequestLogging', enabled.toString());
    console.log(`🔍 RequestLogger ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    const logs = this.getAllLogs();
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `request-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📁 Request logs exported');
  }
}

// Create singleton instance
export const RequestLogger = new RequestLoggerClass();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).RequestLogger = RequestLogger;
}

/**
 * Helper function to wrap async operations with performance logging
 */
export async function loggedOperation<T>(
  operation: string,
  component: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    RequestLogger.logPerformance(operation, component, startTime, {
      success: true,
      metadata
    });
    return result;
  } catch (error) {
    RequestLogger.logPerformance(operation, component, startTime, {
      success: false,
      error: (error as Error).message,
      metadata
    });
    RequestLogger.logError(component, error as Error, metadata);
    throw error;
  }
}

/**
 * Helper function to wrap state updates with logging
 */
export function loggedStateUpdate<T>(
  component: string,
  stateName: string,
  oldValue: T,
  newValue: T,
  setter: (value: T) => void,
  trigger: string = 'user action'
): void {
  RequestLogger.logStateChange(component, stateName, oldValue, newValue, trigger);
  setter(newValue);
}
