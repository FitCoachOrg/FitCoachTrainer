/**
 * Error Recovery System
 * 
 * Advanced error recovery with exponential backoff, circuit breaker pattern,
 * and intelligent retry strategies based on error types.
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add randomness to prevent thundering herd
}

export interface ErrorRecoveryOptions {
  retryConfig?: Partial<RetryConfig>;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
  onSuccess?: (attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time to wait before trying again
  monitoringPeriod: number; // Time window for failure counting
}

class ErrorRecoveryManager {
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  };

  private defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 60000
  };

  /**
   * Execute operation with error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    operationKey: string,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...options.retryConfig };
    const circuitBreakerConfig = this.defaultCircuitBreakerConfig;

    // Check circuit breaker
    if (this.isCircuitOpen(operationKey, circuitBreakerConfig)) {
      throw new Error(`Circuit breaker is open for operation: ${operationKey}`);
    }

    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker
        this.recordSuccess(operationKey);
        
        if (options.onSuccess) {
          options.onSuccess(attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (options.shouldRetry && !options.shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Record failure
        this.recordFailure(operationKey);
        
        // If this is the last attempt, throw the error
        if (attempt === retryConfig.maxRetries) {
          if (options.onMaxRetriesReached) {
            options.onMaxRetriesReached(lastError);
          }
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, retryConfig);
        
        if (options.onRetry) {
          options.onRetry(attempt + 1, lastError);
        }
        
        console.log(`[ErrorRecovery] Retry ${attempt + 1}/${retryConfig.maxRetries} for ${operationKey} in ${delay}ms`);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Cap at max delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(operationKey: string, config: CircuitBreakerConfig): boolean {
    const state = this.circuitBreakers.get(operationKey);
    if (!state) return false;
    
    const now = Date.now();
    
    // If circuit is open, check if recovery timeout has passed
    if (state.isOpen && now - state.lastFailureTime > config.recoveryTimeout) {
      // Try to close the circuit
      state.isOpen = false;
      state.failureCount = 0;
      console.log(`[ErrorRecovery] Circuit breaker closed for ${operationKey}`);
    }
    
    return state.isOpen;
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationKey: string): void {
    const state = this.circuitBreakers.get(operationKey);
    if (state) {
      state.failureCount = 0;
      state.isOpen = false;
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationKey: string): void {
    const now = Date.now();
    let state = this.circuitBreakers.get(operationKey);
    
    if (!state) {
      state = {
        failureCount: 0,
        lastFailureTime: now,
        isOpen: false
      };
      this.circuitBreakers.set(operationKey, state);
    }
    
    state.failureCount++;
    state.lastFailureTime = now;
    
    // Open circuit if threshold reached
    if (state.failureCount >= this.defaultCircuitBreakerConfig.failureThreshold) {
      state.isOpen = true;
      console.log(`[ErrorRecovery] Circuit breaker opened for ${operationKey} (${state.failureCount} failures)`);
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(operationKey: string) {
    const state = this.circuitBreakers.get(operationKey);
    return state ? {
      isOpen: state.isOpen,
      failureCount: state.failureCount,
      lastFailureTime: state.lastFailureTime
    } : null;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(operationKey: string): void {
    this.circuitBreakers.delete(operationKey);
    console.log(`[ErrorRecovery] Circuit breaker reset for ${operationKey}`);
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllCircuitBreakerStatuses() {
    const statuses: Record<string, any> = {};
    for (const [key, state] of this.circuitBreakers.entries()) {
      statuses[key] = {
        isOpen: state.isOpen,
        failureCount: state.failureCount,
        lastFailureTime: state.lastFailureTime
      };
    }
    return statuses;
  }
}

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  isOpen: boolean;
}

// Create singleton instance
const errorRecoveryManager = new ErrorRecoveryManager();

export default errorRecoveryManager;

/**
 * Utility functions for common error types
 */
export const shouldRetryOnError = (error: Error): boolean => {
  // Network errors - retry
  if (error.message.includes('network') || error.message.includes('timeout')) {
    return true;
  }
  
  // Server errors (5xx) - retry
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return true;
  }
  
  // Client errors (4xx) - don't retry
  if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
    return false;
  }
  
  // Database connection errors - retry
  if (error.message.includes('connection') || error.message.includes('database')) {
    return true;
  }
  
  // Default to retry
  return true;
};

export const getRetryConfigForOperation = (operationType: string): Partial<RetryConfig> => {
  switch (operationType) {
    case 'SAVE':
      return {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 5000
      };
    case 'FETCH':
      return {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 2000
      };
    case 'APPROVE':
      return {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 8000
      };
    default:
      return {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      };
  }
};
