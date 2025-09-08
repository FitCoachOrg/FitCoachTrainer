/**
 * Status Indicator Component
 * 
 * Provides visual status indicators with icons, colors, and messages
 * for different operation states.
 */

import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'idle' | 'loading' | 'success' | 'warning' | 'error' | 'info';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  idle: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  loading: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  }
};

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'md',
  showIcon = true,
  className
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizeClasses[size],
            config.color,
            status === 'loading' && 'animate-spin'
          )}
        />
      )}
      {message && (
        <span className={cn('font-medium', config.color)}>
          {message}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;

