/**
 * Offline Manager
 * 
 * Provides offline support with:
 * - Network status detection
 * - Operation queuing for offline scenarios
 * - Automatic sync when connection is restored
 * - Local storage for critical data
 */

export interface QueuedOperation {
  id: string;
  type: 'SAVE' | 'APPROVE' | 'DELETE' | 'UPDATE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface OfflineState {
  isOnline: boolean;
  queuedOperations: QueuedOperation[];
  lastSyncTime: number | null;
  syncInProgress: boolean;
}

class OfflineManager {
  private isOnline = navigator.onLine;
  private queuedOperations: QueuedOperation[] = [];
  private syncInProgress = false;
  private lastSyncTime: number | null = null;
  private subscribers = new Set<(state: OfflineState) => void>();
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'offline_operations';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.loadQueuedOperations();
    this.setupEventListeners();
    this.startPeriodicSync();
  }

  /**
   * Subscribe to offline state changes
   */
  subscribe(subscriber: (state: OfflineState) => void): () => void {
    this.subscribers.add(subscriber);
    
    // Immediately notify subscriber of current state
    subscriber(this.getState());
    
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return {
      isOnline: this.isOnline,
      queuedOperations: [...this.queuedOperations],
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Queue operation for offline execution
   */
  queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): string {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queuedOperations.push(queuedOp);
    this.saveQueuedOperations();
    this.notifySubscribers();

    console.log(`[OfflineManager] Queued operation: ${queuedOp.type} (${queuedOp.id})`);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOperations();
    }

    return queuedOp.id;
  }

  /**
   * Remove operation from queue
   */
  removeOperation(operationId: string): boolean {
    const index = this.queuedOperations.findIndex(op => op.id === operationId);
    if (index !== -1) {
      this.queuedOperations.splice(index, 1);
      this.saveQueuedOperations();
      this.notifySubscribers();
      console.log(`[OfflineManager] Removed operation: ${operationId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all queued operations
   */
  clearQueuedOperations(): void {
    this.queuedOperations = [];
    this.saveQueuedOperations();
    this.notifySubscribers();
    console.log('[OfflineManager] Cleared all queued operations');
  }

  /**
   * Sync queued operations
   */
  async syncOperations(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queuedOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.notifySubscribers();

    console.log(`[OfflineManager] Starting sync of ${this.queuedOperations.length} operations`);

    try {
      // Sort operations by priority
      const sortedOperations = [...this.queuedOperations].sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const successfulOperations: string[] = [];
      const failedOperations: QueuedOperation[] = [];

      for (const operation of sortedOperations) {
        try {
          await this.executeOperation(operation);
          successfulOperations.push(operation.id);
          console.log(`[OfflineManager] Successfully synced operation: ${operation.id}`);
        } catch (error) {
          console.error(`[OfflineManager] Failed to sync operation ${operation.id}:`, error);
          
          // Increment retry count
          operation.retryCount++;
          
          // Remove if max retries reached
          if (operation.retryCount >= operation.maxRetries) {
            console.log(`[OfflineManager] Max retries reached for operation: ${operation.id}`);
            // Could emit an event here for user notification
          } else {
            failedOperations.push(operation);
          }
        }
      }

      // Remove successful operations
      this.queuedOperations = failedOperations;
      this.saveQueuedOperations();
      this.lastSyncTime = Date.now();
      
      console.log(`[OfflineManager] Sync completed. ${successfulOperations.length} successful, ${failedOperations.length} failed`);

    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifySubscribers();
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // This would integrate with your actual API calls
    // For now, we'll simulate the operation
    
    switch (operation.type) {
      case 'SAVE':
        // Simulate save operation
        await this.simulateApiCall('save', operation.data);
        break;
      case 'APPROVE':
        // Simulate approve operation
        await this.simulateApiCall('approve', operation.data);
        break;
      case 'DELETE':
        // Simulate delete operation
        await this.simulateApiCall('delete', operation.data);
        break;
      case 'UPDATE':
        // Simulate update operation
        await this.simulateApiCall('update', operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Simulate API call (replace with actual API calls)
   */
  private async simulateApiCall(endpoint: string, data: any): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error(`Simulated API error for ${endpoint}`);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineManager] Network connection restored');
      this.isOnline = true;
      this.notifySubscribers();
      this.syncOperations();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineManager] Network connection lost');
      this.isOnline = false;
      this.notifySubscribers();
    });
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queuedOperations.length > 0) {
        this.syncOperations();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Save queued operations to localStorage
   */
  private saveQueuedOperations(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queuedOperations));
    } catch (error) {
      console.error('[OfflineManager] Failed to save queued operations:', error);
    }
  }

  /**
   * Load queued operations from localStorage
   */
  private loadQueuedOperations(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queuedOperations = JSON.parse(stored);
        console.log(`[OfflineManager] Loaded ${this.queuedOperations.length} queued operations`);
      }
    } catch (error) {
      console.error('[OfflineManager] Failed to load queued operations:', error);
      this.queuedOperations = [];
    }
  }

  /**
   * Notify all subscribers of state changes
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => subscriber(this.getState()));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopPeriodicSync();
    this.subscribers.clear();
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

export default offlineManager;
