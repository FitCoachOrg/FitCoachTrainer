import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Check } from 'lucide-react';

// Week-level approval status interface
interface WeekApprovalStatus {
  weekNumber: number;
  status: 'approved' | 'draft' | 'no_plan';
  startDate: Date;
  endDate: Date;
  canApprove: boolean;
}

// Unified approval status interface
interface UnifiedApprovalStatus {
  global: {
    canApprove: boolean;
    status: 'approved' | 'draft' | 'no_plan' | 'partial_approved' | 'pending';
    hasUnsavedChanges: boolean;
    message: string;
  };
  weeks: WeekApprovalStatus[];
}

interface UnifiedApprovalButtonProps {
  type: 'global' | 'week';
  weekIndex?: number;
  status: UnifiedApprovalStatus;
  onApprove: (scope: 'global' | 'week', weekIndex?: number) => void;
  isApproving: boolean;
  className?: string;
}

export const UnifiedApprovalButton: React.FC<UnifiedApprovalButtonProps> = ({
  type,
  weekIndex,
  status,
  onApprove,
  isApproving,
  className = ''
}) => {
  const isGlobal = type === 'global';
  const buttonConfig = isGlobal ? status.global : status.weeks[weekIndex!];
  
  // Don't render if button config doesn't exist
  if (!buttonConfig) {
    return null;
  }
  
  // Don't render if button shouldn't be shown
  if (!buttonConfig.canApprove && !buttonConfig.hasUnsavedChanges) {
    return null;
  }
  
  const handleClick = () => {
    onApprove(type, weekIndex);
  };
  
  // Determine button styling based on type and state
  const getButtonClassName = () => {
    const baseClasses = isGlobal 
      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-green-300 dark:border-green-700 min-w-[200px]'
      : 'px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center min-w-fit';
    
    return `${baseClasses} ${className}`;
  };
  
  // Determine button content based on state
  const getButtonContent = () => {
    if (isApproving) {
      return (
        <>
          {isGlobal ? (
            <CheckCircle className="h-5 w-5 mr-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 mr-1 animate-spin" />
          )}
          <span className={isGlobal ? 'ml-3' : ''}>
            {isGlobal ? 'Approving...' : 'Approving...'}
          </span>
        </>
      );
    }
    
    if (buttonConfig.hasUnsavedChanges) {
      return (
        <>
          {isGlobal ? (
            <CheckCircle className="h-5 w-5 mr-3" />
          ) : (
            <Check className="h-3 w-3 mr-1" />
          )}
          <span className={isGlobal ? 'ml-3' : ''}>
            {isGlobal ? '💾 Save Plan First' : 'Save First'}
          </span>
        </>
      );
    }
    
    return (
      <>
        {isGlobal ? (
          <CheckCircle className="h-5 w-5 mr-3" />
        ) : (
          <Check className="h-3 w-3 mr-1" />
        )}
        <span className={isGlobal ? 'ml-3' : ''}>
          {isGlobal ? '✅ Approve Plan' : 'Approve Week'}
        </span>
      </>
    );
  };
  
  return (
    <Button
      onClick={handleClick}
      disabled={!buttonConfig.canApprove || isApproving}
      className={getButtonClassName()}
      size={isGlobal ? 'lg' : 'sm'}
    >
      {getButtonContent()}
    </Button>
  );
};

export default UnifiedApprovalButton;
