/**
 * Progress Bar Component
 * 
 * Displays progress for multi-step operations with smooth animations
 * and customizable styling.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

const variantClasses = {
  default: 'bg-gray-200',
  primary: 'bg-blue-200',
  success: 'bg-green-200',
  warning: 'bg-yellow-200',
  error: 'bg-red-200'
};

const fillVariantClasses = {
  default: 'bg-gray-600',
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600'
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  variant = 'default',
  showPercentage = false,
  animated = true,
  className,
  label
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          'w-full rounded-full overflow-hidden',
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            fillVariantClasses[variant],
            animated && 'animate-pulse'
          )}
          style={{
            width: `${clampedProgress}%`,
            transition: animated ? 'width 0.3s ease-out' : 'none'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

