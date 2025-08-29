import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface ContentEditableProps {
  value: string | number;
  onSave: (value: string) => void;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  minWidth?: string;
  maxWidth?: string;
  multiline?: boolean;
  numeric?: boolean;
  children?: React.ReactNode;
}

export const ContentEditable: React.FC<ContentEditableProps> = ({
  value,
  onSave,
  onCancel,
  className,
  placeholder = "Click to edit",
  disabled = false,
  minWidth = "60px",
  maxWidth,
  multiline = false,
  numeric = false,
  children
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  // Focus the element when editing starts
  useEffect(() => {
    if (isEditing && elementRef.current) {
      elementRef.current.focus();
      // Let the browser handle cursor position naturally
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && containerRef.current) {
      // Capture dimensions before editing
      const rect = containerRef.current.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
      setIsEditing(true);
      setHasChanges(false);
    }
  };

  const handleSave = () => {
    if (elementRef.current) {
      const newValue = elementRef.current.textContent || '';
      
      if (numeric) {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue)) {
          onSave(numValue.toString());
        } else {
          // Revert to original value if invalid
          return;
        }
      } else {
        onSave(newValue);
      }
    }
    setIsEditing(false);
    setContainerDimensions(null);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
    setContainerDimensions(null);
    setHasChanges(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || '';
    setHasChanges(newValue !== value.toString());
  };

  const handleBlur = () => {
    // Don't auto-save on blur, let user use the save button
    // Only exit editing if no changes
    if (!hasChanges) {
      setIsEditing(false);
      setContainerDimensions(null);
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <div
          ref={elementRef}
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          className={cn(
            "cursor-text rounded px-2 py-1 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
            "min-h-[24px] bg-white dark:bg-gray-800",
            "border-2 border-blue-500 shadow-lg",
            "whitespace-pre-wrap break-words overflow-hidden",
            className
          )}
          style={{
            width: containerDimensions ? `${containerDimensions.width}px` : minWidth,
            height: containerDimensions ? `${containerDimensions.height}px` : 'auto',
            minWidth,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            display: 'block',
            resize: 'none',
          }}
        >
          {value}
        </div>
        
        {/* Small save button that appears when there are changes */}
        {hasChanges && (
          <div className="absolute -top-8 right-0 flex gap-1">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded shadow-lg transition-colors"
              title="Save changes"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded shadow-lg transition-colors"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20",
        "rounded px-2 py-1 transition-all duration-200",
        "group relative min-h-[24px] flex items-center",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      title={disabled ? undefined : placeholder}
      style={{ minWidth }}
    >
      <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-medium">
        {children || value}
      </span>
      
      {/* Subtle edit indicator on hover */}
      <div className="absolute inset-0 bg-blue-500/5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      {/* Edit icon that appears on hover */}
      {!disabled && (
        <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      )}
    </div>
  );
}; 