/**
 * Enhanced Toast Hook
 * 
 * Manages toast notifications with queue, positioning, and lifecycle management.
 * Provides a clean API for showing different types of toasts.
 */

import { useState, useCallback, useRef } from 'react';
import { EnhancedToast, ToastType } from '@/components/ui/EnhancedToast';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  showProgress?: boolean;
  onRetry?: () => void;
}

interface UseEnhancedToastReturn {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string, onRetry?: () => void) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  showLoading: (title: string, message?: string) => string;
}

export const useEnhancedToast = (): UseEnhancedToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdCounter = useRef(0);
  
  const generateId = useCallback(() => {
    return `toast-${++toastIdCounter.current}`;
  }, []);
  
  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000,
      showProgress: true,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, [generateId]);
  
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 3000
    });
  }, [showToast]);
  
  const showError = useCallback((title: string, message?: string, onRetry?: () => void): string => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 0, // Persistent until manually closed
      onRetry
    });
  }, [showToast]);
  
  const showWarning = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 4000
    });
  }, [showToast]);
  
  const showInfo = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000
    });
  }, [showToast]);
  
  const showLoading = useCallback((title: string, message?: string): string => {
    return showToast({
      type: 'loading',
      title,
      message,
      duration: 0, // Persistent until manually closed
      showProgress: false
    });
  }, [showToast]);
  
  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
};

export default useEnhancedToast;

