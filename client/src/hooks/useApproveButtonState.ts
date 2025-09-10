/**
 * useApproveButtonState Hook
 * 
 * React hook for managing approve button state using the state machine.
 * Provides a clean interface for components to interact with the state machine.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ApproveButtonState, 
  ApproveButtonAction, 
  ButtonConfig,
  canTransition,
  createApproveButtonStateMachine,
  ApproveButtonStateMachine
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
  // Create a unique state machine instance for this hook
  const [stateMachine] = useState<ApproveButtonStateMachine>(() => createApproveButtonStateMachine());
  const [state, setState] = useState<ApproveButtonState>(stateMachine.getState());
  const [buttonConfig, setButtonConfig] = useState<ButtonConfig>(stateMachine.getButtonConfig());
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((newState, oldState, action) => {
      console.log(`[useApproveButtonState] State changed: ${oldState} → ${newState} (action: ${action})`);
      setState(newState);
      setButtonConfig(stateMachine.getButtonConfig());
    });
    
    return unsubscribe;
  }, [stateMachine]);
  
  // Dispatch action
  const dispatch = useCallback((action: ApproveButtonAction): boolean => {
    return stateMachine.dispatch(action);
  }, [stateMachine]);
  
  // Handle save operation
  const handleSave = useCallback(async (planData: any, saveFunction: (data: any) => Promise<any>): Promise<boolean> => {
    return await stateMachine.handleSave(planData, saveFunction);
  }, [stateMachine]);
  
  // Handle refresh operation
  const handleRefresh = useCallback(async (refreshFunction: () => Promise<any>): Promise<boolean> => {
    return await stateMachine.handleRefresh(refreshFunction);
  }, [stateMachine]);
  
  // Handle approve operation
  const handleApprove = useCallback(async (approveFunction: () => Promise<any>): Promise<boolean> => {
    return await stateMachine.handleApprove(approveFunction);
  }, [stateMachine]);
  
  // Handle retry operation
  const handleRetry = useCallback(async (retryFunction: () => Promise<any>): Promise<boolean> => {
    return await stateMachine.handleRetry(retryFunction);
  }, [stateMachine]);
  
  // Reset state machine
  const reset = useCallback(() => {
    stateMachine.reset();
  }, [stateMachine]);
  
  // Check if current state matches given state
  const isState = useCallback((targetState: ApproveButtonState): boolean => {
    return state === targetState;
  }, [state]);
  
  // Check if action can be dispatched
  const canTransitionAction = useCallback((action: ApproveButtonAction): boolean => {
    return canTransition(state, action);
  }, [state]);
  
  // Get retry information
  const getRetryInfo = useCallback(() => {
    return stateMachine.getRetryInfo();
  }, [stateMachine]);
  
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
    canTransition: canTransitionAction,
    getRetryInfo
  };
};

export default useApproveButtonState;

