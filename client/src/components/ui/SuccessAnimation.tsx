/**
 * Success Animation Component
 * 
 * Provides animated success feedback with checkmark animation
 * and customizable styling for different use cases.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAnimationProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'green' | 'blue' | 'purple' | 'emerald';
  message?: string;
  onComplete?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20'
};

const colorClasses = {
  green: 'text-green-500',
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  emerald: 'text-emerald-500'
};

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  size = 'md',
  color = 'green',
  message,
  onComplete,
  className
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      
      // Show message after animation starts
      setTimeout(() => {
        setShowMessage(true);
      }, 300);
      
      // Complete animation after duration
      setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 2000);
    } else {
      setIsAnimating(false);
      setShowMessage(false);
    }
  }, [show, onComplete]);
  
  if (!show && !isAnimating) return null;
  
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'relative transition-all duration-300 ease-out',
          sizeClasses[size],
          isAnimating && 'scale-110'
        )}
      >
        {/* Background circle with pulse animation */}
        <div
          className={cn(
            'absolute inset-0 rounded-full opacity-20 animate-ping',
            colorClasses[color],
            isAnimating && 'bg-current'
          )}
        />
        
        {/* Main checkmark icon */}
        <CheckCircle
          className={cn(
            'relative transition-all duration-500 ease-out',
            sizeClasses[size],
            colorClasses[color],
            isAnimating && 'animate-bounce'
          )}
          style={{
            animationDelay: isAnimating ? '0.1s' : '0s'
          }}
        />
        
        {/* Success ring animation */}
        {isAnimating && (
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 animate-pulse',
              colorClasses[color]
            )}
            style={{
              animation: 'successRing 1s ease-out forwards'
            }}
          />
        )}
      </div>
      
      {/* Success message */}
      {showMessage && message && (
        <div
          className={cn(
            'mt-3 text-sm font-medium transition-all duration-500 ease-out',
            colorClasses[color],
            'animate-in fade-in-0 slide-in-from-bottom-2'
          )}
        >
          {message}
        </div>
      )}
      
      {/* Custom CSS for success ring animation */}
      <style jsx>{`
        @keyframes successRing {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessAnimation;

