/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component with different size options.
 * Used throughout the application to show loading states.
 */

import React from "react"

interface LoadingSpinnerProps {
  size?: "small" | "default" | "large"
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "default" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8", 
    large: "h-12 w-12"
  }
  
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-blue-500 border-t-transparent`} />
    </div>
  )
} 