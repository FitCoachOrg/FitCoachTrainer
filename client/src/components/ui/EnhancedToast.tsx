/**
 * Enhanced Toast Notification Component
 * 
 * Provides rich toast notifications with icons, progress indicators,
 * and action buttons for better user feedback.
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface EnhancedToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = persistent
  showProgress?: boolean;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800',
    messageColor: 'text-green-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    messageColor: 'text-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    messageColor: 'text-blue-700'
  },
  loading: {
    icon: Info,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-800',
    messageColor: 'text-gray-700'
  }
};

export const EnhancedToast: React.FC<EnhancedToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  showProgress = true,
  onClose,
  onRetry,
  className
}) => {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  
  const config = toastConfig[type];
  const Icon = config.icon;
  
  useEffect(() => {
    if (duration === 0) return; // Persistent toast
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300); // Wait for animation
          return 0;
        }
        return newProgress;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={cn(
        'relative max-w-sm w-full border rounded-lg shadow-lg transition-all duration-300 ease-in-out transform',
        config.bgColor,
        config.borderColor,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
    >
      {/* Progress bar */}
      {showProgress && duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-gray-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon
              className={cn(
                'h-5 w-5',
                config.iconColor,
                type === 'loading' && 'animate-spin'
              )}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn('font-semibold text-sm', config.titleColor)}>
              {title}
            </h4>
            {message && (
              <p className={cn('text-sm mt-1', config.messageColor)}>
                {message}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRetry && type === 'error' && (
              <button
                onClick={onRetry}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Retry"
              >
                <RotateCcw className="h-4 w-4 text-gray-600" />
              </button>
            )}
            
            {onClose && (
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Close"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedToast;

