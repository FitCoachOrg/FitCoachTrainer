/**
 * Tests for ApproveButtonStateMachine
 * 
 * Verifies that the state machine transitions work correctly
 * and handles all edge cases properly.
 */

import { 
  ApproveButtonStateMachine, 
  ApproveButtonState, 
  ApproveButtonAction,
  getButtonConfig,
  canTransition,
  getNextState 
} from '../approveButtonStateMachine';

describe('ApproveButtonStateMachine', () => {
  let stateMachine: ApproveButtonStateMachine;
  
  beforeEach(() => {
    stateMachine = new ApproveButtonStateMachine();
  });
  
  afterEach(() => {
    stateMachine.destroy();
  });
  
  describe('Initial State', () => {
    it('should start in hidden state', () => {
      expect(stateMachine.getState()).toBe('hidden');
    });
    
    it('should have correct initial button config', () => {
      const config = stateMachine.getButtonConfig();
      expect(config.show).toBe(false);
      expect(config.enabled).toBe(false);
      expect(config.loading).toBe(false);
    });
  });
  
  describe('State Transitions', () => {
    it('should transition from hidden to enabled_approve when plan is generated', () => {
      const result = stateMachine.dispatch('PLAN_GENERATED');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
    
    it('should stay in hidden when clean changes are dispatched from hidden state', () => {
      expect(stateMachine.getState()).toBe('hidden');
      
      const result = stateMachine.dispatch('CLEAN_CHANGES');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('hidden');
    });
    
    it('should transition from enabled_approve to saving when save starts', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      const result = stateMachine.dispatch('SAVE_START');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('saving');
    });
    
    it('should transition from saving to refreshing when save succeeds', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      const result = stateMachine.dispatch('SAVE_SUCCESS');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('refreshing');
    });
    
    it('should transition from refreshing to enabled_approve when refresh succeeds', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_SUCCESS');
      const result = stateMachine.dispatch('REFRESH_SUCCESS');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
    
    it('should transition from enabled_approve to disabled_save_first when changes are made', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      const result = stateMachine.dispatch('DIRTY_CHANGES');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('disabled_save_first');
    });
    
    it('should stay in disabled_save_first when plan is generated with unsaved changes', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('DIRTY_CHANGES');
      expect(stateMachine.getState()).toBe('disabled_save_first');
      
      // Generate another plan - should stay in disabled_save_first
      const result = stateMachine.dispatch('PLAN_GENERATED');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('disabled_save_first');
    });
    
    it('should stay in enabled_approve when new plan is generated', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      expect(stateMachine.getState()).toBe('enabled_approve');
      
      // Generate another plan - should stay enabled
      const result = stateMachine.dispatch('PLAN_GENERATED');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
    
    it('should stay in enabled_approve when clean changes are dispatched', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      expect(stateMachine.getState()).toBe('enabled_approve');
      
      // Clean changes should keep it enabled
      const result = stateMachine.dispatch('CLEAN_CHANGES');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
    
    it('should transition from saving to hidden when approve succeeds', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('APPROVE_START');
      expect(stateMachine.getState()).toBe('saving');
      
      const result = stateMachine.dispatch('APPROVE_SUCCESS');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('hidden');
    });
  });
  
  describe('Error Handling', () => {
    it('should transition to error_stuck when save fails', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      const result = stateMachine.dispatch('SAVE_ERROR');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('error_stuck');
    });
    
    it('should transition to error_stuck when refresh fails', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_SUCCESS');
      const result = stateMachine.dispatch('REFRESH_ERROR');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('error_stuck');
    });
    
    it('should transition to error_stuck when approve fails', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('APPROVE_START');
      const result = stateMachine.dispatch('APPROVE_ERROR');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('error_stuck');
    });
    
    it('should allow retry from error_stuck state', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_ERROR');
      const result = stateMachine.dispatch('RETRY');
      expect(result).toBe(true);
      expect(stateMachine.getState()).toBe('saving');
    });
  });
  
  describe('Invalid Transitions', () => {
    it('should reject invalid transitions', () => {
      const result = stateMachine.dispatch('SAVE_START');
      expect(result).toBe(false);
      expect(stateMachine.getState()).toBe('hidden');
    });
    
    it('should reject transitions from wrong state', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_SUCCESS');
      stateMachine.dispatch('REFRESH_SUCCESS');
      // Now in enabled_approve state
      const result = stateMachine.dispatch('SAVE_START');
      expect(result).toBe(false);
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
  });
  
  describe('Button Configurations', () => {
    it('should return correct config for hidden state', () => {
      const config = getButtonConfig('hidden');
      expect(config.show).toBe(false);
      expect(config.enabled).toBe(false);
      expect(config.loading).toBe(false);
      expect(config.message).toBe('');
    });
    
    it('should return correct config for disabled_save_first state', () => {
      const config = getButtonConfig('disabled_save_first');
      expect(config.show).toBe(true);
      expect(config.enabled).toBe(false);
      expect(config.loading).toBe(false);
      expect(config.message).toBe('💾 Save Plan First');
    });
    
    it('should return correct config for saving state', () => {
      const config = getButtonConfig('saving');
      expect(config.show).toBe(true);
      expect(config.enabled).toBe(false);
      expect(config.loading).toBe(true);
      expect(config.message).toBe('Saving...');
    });
    
    it('should return correct config for enabled_approve state', () => {
      const config = getButtonConfig('enabled_approve');
      expect(config.show).toBe(true);
      expect(config.enabled).toBe(true);
      expect(config.loading).toBe(false);
      expect(config.message).toBe('✅ Approve Plan');
    });
    
    it('should return correct config for error_stuck state', () => {
      const config = getButtonConfig('error_stuck');
      expect(config.show).toBe(true);
      expect(config.enabled).toBe(true);
      expect(config.loading).toBe(false);
      expect(config.message).toBe('Retry');
    });
  });
  
  describe('Utility Functions', () => {
    it('should correctly identify valid transitions', () => {
      expect(canTransition('hidden', 'PLAN_GENERATED')).toBe(true);
      expect(canTransition('hidden', 'SAVE_START')).toBe(false);
      expect(canTransition('disabled_save_first', 'SAVE_START')).toBe(true);
    });
    
    it('should return correct next states', () => {
      expect(getNextState('hidden', 'PLAN_GENERATED')).toBe('disabled_save_first');
      expect(getNextState('hidden', 'SAVE_START')).toBe(null);
      expect(getNextState('disabled_save_first', 'SAVE_START')).toBe('saving');
    });
  });
  
  describe('State Machine Operations', () => {
    it('should handle save operation correctly', async () => {
      stateMachine.dispatch('PLAN_GENERATED');
      
      const mockSaveFunction = jest.fn().mockResolvedValue({ success: true });
      const result = await stateMachine.handleSave({ test: 'data' }, mockSaveFunction);
      
      expect(result).toBe(true);
      expect(mockSaveFunction).toHaveBeenCalledWith({ test: 'data' });
      expect(stateMachine.getState()).toBe('refreshing');
    });
    
    it('should handle save operation failure correctly', async () => {
      stateMachine.dispatch('PLAN_GENERATED');
      
      const mockSaveFunction = jest.fn().mockResolvedValue({ success: false });
      const result = await stateMachine.handleSave({ test: 'data' }, mockSaveFunction);
      
      expect(result).toBe(false);
      expect(stateMachine.getState()).toBe('error_stuck');
    });
    
    it('should handle refresh operation correctly', async () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_SUCCESS');
      
      const mockRefreshFunction = jest.fn().mockResolvedValue({ canApprove: true });
      const result = await stateMachine.handleRefresh(mockRefreshFunction);
      
      expect(result).toBe(true);
      expect(mockRefreshFunction).toHaveBeenCalled();
      expect(stateMachine.getState()).toBe('enabled_approve');
    });
  });
  
  describe('Reset Functionality', () => {
    it('should reset to hidden state', () => {
      stateMachine.dispatch('PLAN_GENERATED');
      stateMachine.dispatch('SAVE_START');
      stateMachine.dispatch('SAVE_ERROR');
      
      expect(stateMachine.getState()).toBe('error_stuck');
      
      stateMachine.reset();
      expect(stateMachine.getState()).toBe('hidden');
    });
  });
});

// Integration test for complete workflow
describe('Complete Workflow Integration', () => {
  let stateMachine: ApproveButtonStateMachine;
  
  beforeEach(() => {
    stateMachine = new ApproveButtonStateMachine();
  });
  
  afterEach(() => {
    stateMachine.destroy();
  });
  
  it('should handle complete save and approve workflow', async () => {
    // 1. Plan is generated - should be ready to approve immediately
    stateMachine.dispatch('PLAN_GENERATED');
    expect(stateMachine.getState()).toBe('enabled_approve');
    
    // 2. User makes changes (dirty dates) - now needs to save first
    stateMachine.dispatch('DIRTY_CHANGES');
    expect(stateMachine.getState()).toBe('disabled_save_first');
    
    // 3. User saves changes
    const mockSaveFunction = jest.fn().mockResolvedValue({ success: true });
    await stateMachine.handleSave({ test: 'data' }, mockSaveFunction);
    expect(stateMachine.getState()).toBe('refreshing');
    
    // 4. Status refresh completes
    const mockRefreshFunction = jest.fn().mockResolvedValue({ canApprove: true });
    await stateMachine.handleRefresh(mockRefreshFunction);
    expect(stateMachine.getState()).toBe('enabled_approve');
    
    // 5. User approves plan
    const mockApproveFunction = jest.fn().mockResolvedValue({ success: true });
    await stateMachine.handleApprove(mockApproveFunction);
    expect(stateMachine.getState()).toBe('hidden'); // Approve completes and hides button
  });
});
