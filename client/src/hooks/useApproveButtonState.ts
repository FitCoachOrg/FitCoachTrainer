/**
 * useApproveButtonState Hook
 * 
 * React hook for managing approve button state using the state machine.
 * Provides a clean interface for components to interact with the state machine.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  approveButtonStateMachine, 
  ApproveButtonState, 
  ApproveButtonAction, 
  ButtonConfig 
} from '@/utils/approveButtonStateMachine';

export interface UseApproveButtonStateReturn {
  // Current state
  state: ApproveButtonState;
  buttonConfig: ButtonConfig;
  
  // State machine actions
  dispatch: (action: ApproveButtonAction) => boolean;
  
  // High-level operations
  handleSave: (planData: any, saveFunction: (data: any) => Promise<any>) => Promise<boolean>;
  handleRefresh: (refreshFunction: () => Promise<any>) => Promise<boolean>;
  handleApprove: (approveFunction: () => Promise<any>) => Promise<boolean>;
  handleRetry: (retryFunction: () => Promise<any>) => Promise<boolean>;
  reset: () => void;
  
  // Utility functions
  isState: (state: ApproveButtonState) => boolean;
  canTransition: (action: ApproveButtonAction) => boolean;
  getRetryInfo: () => { count: number; maxRetries: number; canRetry: boolean };
}

export const useApproveButtonState = (): UseApproveButtonStateReturn => {
  const [state, setState] = useState<ApproveButtonState>(approveButtonStateMachine.getState());
  const [buttonConfig, setButtonConfig] = useState<ButtonConfig>(approveButtonStateMachine.getButtonConfig());
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = approveButtonStateMachine.subscribe((newState, oldState, action) => {
      console.log(`[useApproveButtonState] State changed: ${oldState} → ${newState} (action: ${action})`);
      setState(newState);
      setButtonConfig(approveButtonStateMachine.getButtonConfig());
    });
    
    return unsubscribe;
  }, []);
  
  // Dispatch action
  const dispatch = useCallback((action: ApproveButtonAction): boolean => {
    return approveButtonStateMachine.dispatch(action);
  }, []);
  
  // Handle save operation
  const handleSave = useCallback(async (planData: any, saveFunction: (data: any) => Promise<any>): Promise<boolean> => {
    return await approveButtonStateMachine.handleSave(planData, saveFunction);
  }, []);
  
  // Handle refresh operation
  const handleRefresh = useCallback(async (refreshFunction: () => Promise<any>): Promise<boolean> => {
    return await approveButtonStateMachine.handleRefresh(refreshFunction);
  }, []);
  
  // Handle approve operation
  const handleApprove = useCallback(async (approveFunction: () => Promise<any>): Promise<boolean> => {
    return await approveButtonStateMachine.handleApprove(approveFunction);
  }, []);
  
  // Handle retry operation
  const handleRetry = useCallback(async (retryFunction: () => Promise<any>): Promise<boolean> => {
    return await approveButtonStateMachine.handleRetry(retryFunction);
  }, []);
  
  // Reset state machine
  const reset = useCallback(() => {
    approveButtonStateMachine.reset();
  }, []);
  
  // Check if current state matches given state
  const isState = useCallback((targetState: ApproveButtonState): boolean => {
    return state === targetState;
  }, [state]);
  
  // Check if action can be dispatched
  const canTransition = useCallback((action: ApproveButtonAction): boolean => {
    return approveButtonStateMachine.dispatch(action);
  }, []);
  
  // Get retry information
  const getRetryInfo = useCallback(() => {
    return approveButtonStateMachine.getRetryInfo();
  }, []);
  
  return {
    state,
    buttonConfig,
    dispatch,
    handleSave,
    handleRefresh,
    handleApprove,
    handleRetry,
    reset,
    isState,
    canTransition,
    getRetryInfo
  };
};

export default useApproveButtonState;

