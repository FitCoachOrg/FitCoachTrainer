/**
 * State Machine Based Approval Button
 * 
 * Uses the approve button state machine for reliable state management
 * and user feedback. Replaces the old UnifiedApprovalButton with
 * industry-standard state machine patterns.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Check, Loader2, AlertCircle, RotateCcw, Save, Clock } from 'lucide-react';
import { useApproveButtonState } from '@/hooks/useApproveButtonState';
import { ApproveButtonState } from '@/utils/approveButtonStateMachine';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

interface StateMachineApprovalButtonProps {
  type: 'global' | 'week';
  weekIndex?: number;
  onApprove: (scope: 'global' | 'week', weekIndex?: number) => void;
  onRetry?: () => void;
  className?: string;
}

export const StateMachineApprovalButton: React.FC<StateMachineApprovalButtonProps> = ({
  type,
  weekIndex,
  onApprove,
  onRetry,
  className = ''
}) => {
  const isGlobal = type === 'global';
  const {
    state: approveButtonState,
    buttonConfig,
    handleApprove,
    handleRetry,
    isState
  } = useApproveButtonState();
  
  // Don't render if button shouldn't be shown
  if (!buttonConfig.show) {
    return null;
  }
  
  const handleClick = async () => {
    if (isState('error_stuck')) {
      // Handle retry
      if (onRetry) {
        onRetry();
      } else {
        await handleRetry(async () => {
          // Default retry behavior - could be customized
          return { success: true };
        });
      }
    } else if (isState('enabled_approve')) {
      // Handle approve
      await handleApprove(async () => {
        try {
          await onApprove(type, weekIndex);
          return { success: true };
        } catch (error) {
          console.error('[StateMachineApprovalButton] Approval failed:', error);
          return { success: false, error: error.message };
        }
      });
    }
  };
  
  // Get icon based on state
  const getIcon = () => {
    if (buttonConfig.loading) {
      return (
        <LoadingSpinner 
          size={isGlobal ? 'md' : 'sm'} 
          variant="primary"
          className={isGlobal ? 'mr-3' : 'mr-1'}
        />
      );
    }
    
    if (isState('error_stuck')) {
      return isGlobal ? (
        <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
      ) : (
        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
      );
    }
    
    if (isState('enabled_approve')) {
      return isGlobal ? (
        <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
      ) : (
        <Check className="h-3 w-3 mr-1 text-green-500" />
      );
    }
    
    if (isState('disabled_save_first')) {
      return isGlobal ? (
        <Save className="h-5 w-5 mr-3 text-gray-500" />
      ) : (
        <Save className="h-3 w-3 mr-1 text-gray-500" />
      );
    }
    
    return isGlobal ? (
      <CheckCircle className="h-5 w-5 mr-3" />
    ) : (
      <Check className="h-3 w-3 mr-1" />
    );
  };
  
  // Get button content
  const getButtonContent = () => {
    return (
      <>
        {getIcon()}
        <span className={isGlobal ? 'ml-3' : ''}>
          {buttonConfig.message}
        </span>
      </>
    );
  };
  
  // Get button styling
  const getButtonClassName = () => {
    const baseClasses = isGlobal 
      ? 'font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 min-w-[200px]'
      : 'px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit';
    
    // Use state machine button config className or fallback
    const stateClasses = buttonConfig.className || 'bg-gray-400 text-white';
    
    return `${baseClasses} ${stateClasses} ${className}`;
  };
  
  return (
    <div className="approve-button-container">
      <Button
        onClick={handleClick}
        disabled={!buttonConfig.enabled}
        className={getButtonClassName()}
        size={isGlobal ? 'lg' : 'sm'}
      >
        {getButtonContent()}
      </Button>
      
      {/* Enhanced user feedback */}
      <div className="mt-3 space-y-2">
        {/* Status indicator */}
        <StatusIndicator
          status={getStatusType(approveButtonState)}
          message={getUserFeedbackMessage(approveButtonState)}
          size="sm"
          showIcon={true}
        />
        
        {/* Progress bar for loading states */}
        {(isState('saving') || isState('refreshing')) && (
          <ProgressBar
            progress={getProgressValue(approveButtonState)}
            size="sm"
            variant="primary"
            animated={true}
            showPercentage={false}
            label={getProgressLabel(approveButtonState)}
          />
        )}
      </div>
    </div>
  );
};

// Get user-friendly feedback message
const getUserFeedbackMessage = (state: ApproveButtonState): string => {
  switch (state) {
    case 'saving':
      return 'Saving your changes...';
    case 'refreshing':
      return 'Checking plan status...';
    case 'enabled_approve':
      return 'Ready to approve your plan!';
    case 'error_stuck':
      return 'Something went wrong. Click retry to try again.';
    case 'disabled_save_first':
      return 'Please save your changes before approving.';
    default:
      return '';
  }
};

// Get status type for StatusIndicator
const getStatusType = (state: ApproveButtonState): 'idle' | 'loading' | 'success' | 'warning' | 'error' | 'info' => {
  switch (state) {
    case 'saving':
    case 'refreshing':
      return 'loading';
    case 'enabled_approve':
      return 'success';
    case 'error_stuck':
      return 'error';
    case 'disabled_save_first':
      return 'warning';
    default:
      return 'idle';
  }
};

// Get progress value for ProgressBar
const getProgressValue = (state: ApproveButtonState): number => {
  switch (state) {
    case 'saving':
      return 50; // Simulate save progress
    case 'refreshing':
      return 75; // Simulate refresh progress
    default:
      return 0;
  }
};

// Get progress label for ProgressBar
const getProgressLabel = (state: ApproveButtonState): string => {
  switch (state) {
    case 'saving':
      return 'Saving changes...';
    case 'refreshing':
      return 'Checking status...';
    default:
      return '';
  }
};

export default StateMachineApprovalButton;
