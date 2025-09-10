/**
 * Approve Button State Machine
 * 
 * Industry-standard state machine for managing approve button states
 * with automatic error recovery and user feedback.
 * 
 * Based on patterns used by Netflix, Airbnb, and Google for complex UI state management.
 */

// Define all possible button states
export type ApproveButtonState = 
  | 'hidden'                    // Button not shown (no plan exists)
  | 'disabled_save_first'       // Button shown but disabled (unsaved changes)
  | 'saving'                    // Button disabled, showing save progress
  | 'refreshing'                // Button disabled, checking status
  | 'enabled_approve'           // Button enabled, ready to approve
  | 'error_stuck';              // Button shows retry option

// Define all possible actions/events
export type ApproveButtonAction = 
  | 'SAVE_START'                // User clicks save or save operation starts
  | 'SAVE_SUCCESS'              // Save operation completes successfully
  | 'SAVE_ERROR'                // Save operation fails
  | 'REFRESH_START'             // Status refresh starts
  | 'REFRESH_SUCCESS'           // Status refresh completes successfully
  | 'REFRESH_ERROR'             // Status refresh fails
  | 'APPROVE_START'             // User clicks approve
  | 'APPROVE_SUCCESS'           // Approve operation completes
  | 'APPROVE_ERROR'             // Approve operation fails
  | 'RETRY'                     // User clicks retry or auto-retry
  | 'RESET'                     // Reset to initial state
  | 'PLAN_GENERATED'            // New plan is generated
  | 'PLAN_IMPORTED'             // Plan is imported
  | 'DIRTY_CHANGES'             // User makes changes (dirty dates)
  | 'CLEAN_CHANGES';            // All changes are saved

// State machine definition with allowed transitions
export const APPROVE_BUTTON_STATE_MACHINE: Record<ApproveButtonState, Partial<Record<ApproveButtonAction, ApproveButtonState>>> = {
  hidden: {
    PLAN_GENERATED: 'enabled_approve',
    PLAN_IMPORTED: 'enabled_approve',
    DIRTY_CHANGES: 'disabled_save_first',
    CLEAN_CHANGES: 'enabled_approve'  // Fixed: CLEAN_CHANGES should enable the button
  },
  
  disabled_save_first: {
    SAVE_START: 'saving',
    CLEAN_CHANGES: 'enabled_approve',
    PLAN_GENERATED: 'enabled_approve',
    PLAN_IMPORTED: 'enabled_approve',
    DIRTY_CHANGES: 'disabled_save_first',
    RESET: 'hidden'
  },
  
  saving: {
    SAVE_SUCCESS: 'refreshing',
    SAVE_ERROR: 'error_stuck',
    APPROVE_SUCCESS: 'hidden',
    APPROVE_ERROR: 'error_stuck',
    CLEAN_CHANGES: 'enabled_approve',  // Allow transition from saving to enabled_approve
    RETRY: 'saving'
  },
  
  refreshing: {
    REFRESH_SUCCESS: 'enabled_approve',
    REFRESH_ERROR: 'error_stuck',
    RETRY: 'refreshing'
  },
  
  enabled_approve: {
    APPROVE_START: 'saving',
    DIRTY_CHANGES: 'disabled_save_first',
    CLEAN_CHANGES: 'enabled_approve',
    PLAN_GENERATED: 'enabled_approve',
    PLAN_IMPORTED: 'enabled_approve',
    RESET: 'hidden'
  },
  
  error_stuck: {
    RETRY: 'saving',
    RESET: 'hidden',
    SAVE_START: 'saving',
    REFRESH_START: 'refreshing'
  }
};

// Button configuration for each state
export interface ButtonConfig {
  show: boolean;
  enabled: boolean;
  loading: boolean;
  message: string;
  icon?: string;
  className?: string;
}

// Get button configuration for a given state
export const getButtonConfig = (state: ApproveButtonState): ButtonConfig => {
  switch (state) {
    case 'hidden':
      return {
        show: false,
        enabled: false,
        loading: false,
        message: '',
        className: 'hidden'
      };
      
    case 'disabled_save_first':
      return {
        show: true,
        enabled: false,
        loading: false,
        message: '💾 Save Plan First',
        icon: 'save',
        className: 'bg-gray-400 text-white cursor-not-allowed'
      };
      
    case 'saving':
      return {
        show: true,
        enabled: false,
        loading: true,
        message: 'Saving...',
        icon: 'spinner',
        className: 'bg-blue-500 text-white cursor-not-allowed'
      };
      
    case 'refreshing':
      return {
        show: true,
        enabled: false,
        loading: true,
        message: 'Checking status...',
        icon: 'spinner',
        className: 'bg-blue-500 text-white cursor-not-allowed'
      };
      
    case 'enabled_approve':
      return {
        show: true,
        enabled: true,
        loading: false,
        message: '✅ Approve Plan',
        icon: 'check',
        className: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-300 dark:border-green-700 min-w-[200px]'
      };
      
    case 'error_stuck':
      return {
        show: true,
        enabled: true,
        loading: false,
        message: 'Retry',
        icon: 'retry',
        className: 'bg-red-500 hover:bg-red-600 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-red-300 dark:border-red-700 min-w-[200px]'
      };
      
    default:
      return {
        show: false,
        enabled: false,
        loading: false,
        message: '',
        className: 'hidden'
      };
  }
};

// Validate if a transition is allowed
export const canTransition = (currentState: ApproveButtonState, action: ApproveButtonAction): boolean => {
  const allowedTransitions = APPROVE_BUTTON_STATE_MACHINE[currentState];
  return allowedTransitions && action in allowedTransitions;
};

// Get the next state for a given action
export const getNextState = (currentState: ApproveButtonState, action: ApproveButtonAction): ApproveButtonState | null => {
  const allowedTransitions = APPROVE_BUTTON_STATE_MACHINE[currentState];
  return allowedTransitions?.[action] || null;
};

// State machine class for managing state transitions
export class ApproveButtonStateMachine {
  private state: ApproveButtonState = 'hidden';
  private listeners: Array<(newState: ApproveButtonState, oldState: ApproveButtonState, action: ApproveButtonAction) => void> = [];
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;
  private retryTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    console.log('[ApproveButtonStateMachine] Initialized with state:', this.state);
  }
  
  // Get current state
  getState(): ApproveButtonState {
    return this.state;
  }
  
  // Get current button configuration
  getButtonConfig(): ButtonConfig {
    return getButtonConfig(this.state);
  }
  
  // Subscribe to state changes
  subscribe(listener: (newState: ApproveButtonState, oldState: ApproveButtonState, action: ApproveButtonAction) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  // Transition to new state
  private transition(newState: ApproveButtonState, action: ApproveButtonAction): boolean {
    if (!canTransition(this.state, action)) {
      console.warn(`[ApproveButtonStateMachine] Invalid transition: ${this.state} --${action}--> ${newState}`);
      return false;
    }
    
    const oldState = this.state;
    this.state = newState;
    
    console.log(`[ApproveButtonStateMachine] ✅ State transition: ${oldState} --${action}--> ${newState}`, {
      oldState,
      action,
      newState,
      buttonConfig: this.getButtonConfig()
    });
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(newState, oldState, action));
    
    return true;
  }
  
  // Dispatch an action
  dispatch(action: ApproveButtonAction): boolean {
    console.log(`[ApproveButtonStateMachine] 🎯 Dispatching action: ${action} from state: ${this.state}`);
    
    const nextState = getNextState(this.state, action);
    
    if (!nextState) {
      console.warn(`[ApproveButtonStateMachine] ❌ No valid transition for action: ${action} from state: ${this.state}`);
      return false;
    }
    
    console.log(`[ApproveButtonStateMachine] 🔄 Attempting transition: ${this.state} --${action}--> ${nextState}`);
    
    return this.transition(nextState, action);
  }
  
  // Handle save operation
  async handleSave(planData: any, saveFunction: (data: any) => Promise<any>): Promise<boolean> {
    try {
      console.log('[ApproveButtonStateMachine] Starting save, current state:', this.state);
      this.dispatch('SAVE_START');
      console.log('[ApproveButtonStateMachine] After SAVE_START, current state:', this.state);
      
      const result = await saveFunction(planData);
      console.log('[ApproveButtonStateMachine] Save function completed, result:', result);
      console.log('[ApproveButtonStateMachine] Result success check:', result?.success);
      
      if (result && result.success) {
        console.log('[ApproveButtonStateMachine] Dispatching SAVE_SUCCESS');
        this.dispatch('SAVE_SUCCESS');
        console.log('[ApproveButtonStateMachine] After SAVE_SUCCESS, current state:', this.state);
        return true;
      } else {
        console.log('[ApproveButtonStateMachine] Dispatching SAVE_ERROR, result:', result);
        this.dispatch('SAVE_ERROR');
        return false;
      }
    } catch (error) {
      console.error('[ApproveButtonStateMachine] Save error:', error);
      this.dispatch('SAVE_ERROR');
      return false;
    }
  }
  
  // Handle status refresh
  async handleRefresh(refreshFunction: () => Promise<any>): Promise<boolean> {
    try {
      console.log('[ApproveButtonStateMachine] Starting refresh, current state:', this.state);
      this.dispatch('REFRESH_START');
      console.log('[ApproveButtonStateMachine] After REFRESH_START, current state:', this.state);
      
      const result = await refreshFunction();
      console.log('[ApproveButtonStateMachine] Refresh function completed, result:', result);
      console.log('[ApproveButtonStateMachine] Result canApprove check:', result?.canApprove);
      
      if (result && result.canApprove) {
        console.log('[ApproveButtonStateMachine] Dispatching REFRESH_SUCCESS');
        this.dispatch('REFRESH_SUCCESS');
        console.log('[ApproveButtonStateMachine] After REFRESH_SUCCESS, current state:', this.state);
        this.retryCount = 0; // Reset retry count on success
        return true;
      } else {
        console.log('[ApproveButtonStateMachine] Dispatching REFRESH_ERROR, result:', result);
        this.dispatch('REFRESH_ERROR');
        return false;
      }
    } catch (error) {
      console.error('[ApproveButtonStateMachine] Refresh error:', error);
      this.dispatch('REFRESH_ERROR');
      return false;
    }
  }
  
  // Handle approve operation
  async handleApprove(approveFunction: () => Promise<any>): Promise<boolean> {
    try {
      this.dispatch('APPROVE_START');
      
      const result = await approveFunction();
      
      if (result.success) {
        this.dispatch('APPROVE_SUCCESS');
        return true;
      } else {
        this.dispatch('APPROVE_ERROR');
        return false;
      }
    } catch (error) {
      console.error('[ApproveButtonStateMachine] Approve error:', error);
      this.dispatch('APPROVE_ERROR');
      return false;
    }
  }
  
  // Handle retry with exponential backoff
  async handleRetry(retryFunction: () => Promise<any>): Promise<boolean> {
    if (this.retryCount >= this.maxRetries) {
      console.warn('[ApproveButtonStateMachine] Max retries reached');
      return false;
    }
    
    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
    
    console.log(`[ApproveButtonStateMachine] Retrying in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
    
    return new Promise((resolve) => {
      this.retryTimer = setTimeout(async () => {
        try {
          const result = await retryFunction();
          resolve(result);
        } catch (error) {
          console.error('[ApproveButtonStateMachine] Retry failed:', error);
          resolve(false);
        }
      }, delay);
    });
  }
  
  // Reset to initial state
  reset(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.retryCount = 0;
    this.dispatch('RESET');
  }
  
  // Clean up resources
  destroy(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.listeners = [];
    this.retryCount = 0;
  }
  
  // Get retry information
  getRetryInfo(): { count: number; maxRetries: number; canRetry: boolean } {
    return {
      count: this.retryCount,
      maxRetries: this.maxRetries,
      canRetry: this.retryCount < this.maxRetries
    };
  }
}

// Create global instance (singleton pattern) - but allow multiple instances
let _approveButtonStateMachine: ApproveButtonStateMachine | null = null;

export const approveButtonStateMachine = (() => {
  if (!_approveButtonStateMachine) {
    _approveButtonStateMachine = new ApproveButtonStateMachine();
  }
  return _approveButtonStateMachine;
})();

// Factory function to create new instances
export const createApproveButtonStateMachine = (): ApproveButtonStateMachine => {
  return new ApproveButtonStateMachine();
};

// Export for use in components
export default approveButtonStateMachine;
