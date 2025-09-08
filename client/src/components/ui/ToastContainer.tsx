/**
 * Toast Container Component
 * 
 * Manages the display and positioning of multiple toast notifications.
 * Provides a clean, accessible toast system.
 */

import React from 'react';
import { EnhancedToast } from './EnhancedToast';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  showProgress?: boolean;
  onRetry?: () => void;
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  className?: string;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
  maxToasts = 5,
  className
}) => {
  // Limit number of toasts
  const visibleToasts = toasts.slice(0, maxToasts);
  
  if (visibleToasts.length === 0) return null;
  
  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]} ${className || ''}`}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full duration-300"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <EnhancedToast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            showProgress={toast.showProgress}
            onClose={() => onClose(toast.id)}
            onRetry={toast.onRetry}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

