/**
 * Request Deduplication Utility
 * 
 * Prevents multiple simultaneous requests to the same endpoint by returning
 * the existing promise for duplicate requests. This eliminates race conditions
 * and improves performance by reducing unnecessary database queries and API calls.
 */

interface RequestCache {
  promise: Promise<any>;
  timestamp: number;
  abortController?: AbortController;
}

class RequestDeduplication {
  private static pendingRequests = new Map<string, RequestCache>();
  private static readonly REQUEST_TIMEOUT = 45 * 1000; // Increased to 45 seconds for database operations
  private static readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private static readonly SAVE_OPERATION_TIMEOUT = 60 * 1000; // 60 seconds for save operations

  /**
   * Execute a request with deduplication
   * @param key Unique identifier for the request
   * @param requestFn Function that performs the actual request
   * @param options Configuration options
   * @returns Promise that resolves with the request result
   */
  static async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      timeout?: number;
      showDuplicateMessage?: boolean;
      duplicateMessage?: string;
      onDuplicate?: () => void;
      isSaveOperation?: boolean; // Flag for save operations
    } = {}
  ): Promise<T> {
    const {
      timeout = options.isSaveOperation ? this.SAVE_OPERATION_TIMEOUT : this.REQUEST_TIMEOUT,
      showDuplicateMessage = true,
      duplicateMessage = 'Request already in progress. Please wait.',
      onDuplicate,
      isSaveOperation = false
    } = options;

    // Clean up expired requests
    this.cleanupExpiredRequests();

    // Check if request is already in progress
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      const age = Date.now() - existingRequest.timestamp;
      
      // If request is too old, remove it and start fresh
      if (age > timeout) {
        console.log(`🔄 [RequestDeduplication] Removing expired request: ${key} (age: ${age}ms)`);
        this.pendingRequests.delete(key);
      } else {
        console.log(`🔄 [RequestDeduplication] Request already in progress: ${key} (age: ${age}ms)`);
        
        // Call duplicate handler if provided
        if (onDuplicate) {
          onDuplicate();
        }
        
        // Return existing promise
        return existingRequest.promise;
      }
    }

    // Create abort controller for this request
    const abortController = new AbortController();

    // Create the request promise
    const requestPromise = requestFn().catch((error) => {
      // Remove from pending requests on error
      this.pendingRequests.delete(key);
      throw error;
    });

    // Store the request
    this.pendingRequests.set(key, {
      promise: requestPromise,
      timestamp: Date.now(),
      abortController
    });

    console.log(`🚀 [RequestDeduplication] Starting new request: ${key}`);

    try {
      const result = await requestPromise;
      console.log(`✅ [RequestDeduplication] Request completed: ${key}`);
      return result;
    } finally {
      // Clean up on completion
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancel a pending request
   * @param key Request identifier
   * @returns true if request was cancelled, false if not found
   */
  static cancel(key: string): boolean {
    const request = this.pendingRequests.get(key);
    if (request) {
      console.log(`❌ [RequestDeduplication] Cancelling request: ${key}`);
      request.abortController?.abort();
      this.pendingRequests.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Check if a request is pending
   * @param key Request identifier
   * @returns true if request is in progress
   */
  static isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  /**
   * Get all pending request keys
   * @returns Array of pending request keys
   */
  static getPendingKeys(): string[] {
    return Array.from(this.pendingRequests.keys());
  }

  /**
   * Clear all pending requests
   */
  static clearAll(): void {
    console.log(`🧹 [RequestDeduplication] Clearing all pending requests (${this.pendingRequests.size})`);
    this.pendingRequests.forEach((request) => {
      request.abortController?.abort();
    });
    this.pendingRequests.clear();
  }

  /**
   * Clean up expired requests
   */
  private static cleanupExpiredRequests(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        console.log(`🧹 [RequestDeduplication] Cleaning up expired request: ${key}`);
        request.abortController?.abort();
        this.pendingRequests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 [RequestDeduplication] Cleaned up ${cleanedCount} expired requests`);
    }
  }

  /**
   * Generate a unique request key based on operation and parameters
   * @param operation Operation name
   * @param params Request parameters
   * @returns Unique request key
   */
  static generateKey(operation: string, params: any): string {
    // Create a stable string representation of params
    const paramsString = typeof params === 'object' 
      ? JSON.stringify(params, Object.keys(params).sort())
      : String(params);
    
    return `${operation}_${paramsString}`;
  }

  /**
   * Get request statistics
   * @returns Statistics about pending requests
   */
  static getStats(): {
    pendingCount: number;
    pendingKeys: string[];
    oldestRequestAge: number;
  } {
    const now = Date.now();
    const ages = Array.from(this.pendingRequests.values()).map(
      request => now - request.timestamp
    );

    return {
      pendingCount: this.pendingRequests.size,
      pendingKeys: this.getPendingKeys(),
      oldestRequestAge: ages.length > 0 ? Math.max(...ages) : 0
    };
  }
}

// Set up periodic cleanup
setInterval(() => {
  RequestDeduplication['cleanupExpiredRequests']();
}, RequestDeduplication['CLEANUP_INTERVAL']);

export default RequestDeduplication;
