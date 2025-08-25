// QuestionComponents.tsx
// Individual question components for different input types

import React, { useState } from 'react';
import { OnboardingQuestion } from '../data/onboardingQuestions';
import { formatTimeForDisplay, parseTimeFromDisplay } from '../utils/onboardingUtils';

interface QuestionComponentsProps {
  question: OnboardingQuestion;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  formData?: any; // Add formData prop for accessing other field values
}

const QuestionComponents: React.FC<QuestionComponentsProps> = ({ question, value, error, onChange, formData = {} }) => {
  const [timeInputs, setTimeInputs] = useState({
    hours: '',
    minutes: '',
    ampm: 'AM'
  });

  // Initialize time inputs when value changes
  React.useEffect(() => {
    if (question.type === 'time_input' && value) {
      const formatted = formatTimeForDisplay(value);
      const match = formatted.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        setTimeInputs({
          hours: match[1],
          minutes: match[2],
          ampm: match[3].toUpperCase()
        });
      }
    }
  }, [question.type, value]);

  // Handle time input changes
  const handleTimeChange = (field: string, newValue: string) => {
    const updatedInputs = { ...timeInputs, [field]: newValue };
    setTimeInputs(updatedInputs);
    
    if (updatedInputs.hours && updatedInputs.minutes) {
      const timeString = `${updatedInputs.hours}:${updatedInputs.minutes} ${updatedInputs.ampm}`;
      onChange(timeString);
    }
  };

  // Render text input
  const renderTextInput = () => (
    <div className="input-group">
      <label className="question-label">
        {question.title}
        {question.required && <span className="required">*</span>}
      </label>
      <textarea
        className={`input-field ${error ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={question.multiline ? 4 : 1}
        maxLength={question.maxLength}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  // Render select dropdown
  const renderSelect = () => (
    <div className="input-group">
      <label className="question-label">
        {question.title}
        {question.required && <span className="required">*</span>}
      </label>
      <select
        className={`input-field select-field ${error ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an option...</option>
        {question.options?.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  // Render multi-select checkboxes
  const renderMultiSelect = () => {
    const selectedValues = Array.isArray(value) ? value : [];
    
    // Special handling for workout_days to limit selection based on training_days_per_week
    const maxSelections = question.field === 'workout_days' && formData.training_days_per_week 
      ? parseInt(formData.training_days_per_week) 
      : undefined;
    
    const handleOptionToggle = (optionValue: string) => {
      let newValues;
      
      if (selectedValues.includes(optionValue)) {
        // Remove option
        newValues = selectedValues.filter(v => v !== optionValue);
      } else {
        // Add option - check if we're at the limit for workout_days
        if (maxSelections && selectedValues.length >= maxSelections) {
          // Don't allow adding more if at limit
          return;
        }
        newValues = [...selectedValues, optionValue];
      }
      
      onChange(newValues);
    };

    return (
      <div className="input-group">
        <label className="question-label">
          {question.title}
          {question.required && <span className="required">*</span>}
          {maxSelections && (
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
              (Select up to {maxSelections} days)
            </span>
          )}
        </label>
        <div className="multi-select-container">
          {question.options?.map((option, index) => {
            const isSelected = selectedValues.includes(option.value as string);
            const isDisabled = maxSelections && !isSelected && selectedValues.length >= maxSelections;
            
            return (
              <label key={index} className={`checkbox-item ${isDisabled ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleOptionToggle(option.value as string)}
                  className="checkbox-input"
                  disabled={isDisabled}
                />
                <span className="checkbox-label">{option.label}</span>
              </label>
            );
          })}
        </div>
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };

  // Render time input
  const renderTimeInput = () => (
    <div className="input-group">
      <label className="question-label">
        {question.title}
        {question.required && <span className="required">*</span>}
      </label>
      <div className="time-input-container">
        <div className="time-input-group">
          <label className="time-label">Hours</label>
          <input
            type="number"
            min="1"
            max="12"
            value={timeInputs.hours}
            onChange={(e) => handleTimeChange('hours', e.target.value)}
            className={`time-input ${error ? 'error' : ''}`}
            placeholder="12"
          />
        </div>
        
        <div className="time-input-group">
          <label className="time-label">Minutes</label>
          <input
            type="number"
            min="0"
            max="59"
            value={timeInputs.minutes}
            onChange={(e) => handleTimeChange('minutes', e.target.value)}
            className={`time-input ${error ? 'error' : ''}`}
            placeholder="00"
          />
        </div>
        
        <div className="time-input-group">
          <label className="time-label">AM/PM</label>
          <select
            value={timeInputs.ampm}
            onChange={(e) => handleTimeChange('ampm', e.target.value)}
            className="time-select"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  // Render numeric input
  const renderNumericInput = () => (
    <div className="input-group">
      <label className="question-label">
        {question.title}
        {question.required && <span className="required">*</span>}
      </label>
      <input
        type="number"
        className={`input-field ${error ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        maxLength={question.maxLength}
        min={question.min}
        max={question.max}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  // Render picker (select with numeric values)
  const renderPicker = () => (
    <div className="input-group">
      <label className="question-label">
        {question.title}
        {question.required && <span className="required">*</span>}
      </label>
      <select
        className={`input-field select-field ${error ? 'error' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {question.options?.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );

  // Render based on question type
  const renderQuestion = () => {
    switch (question.type) {
      case 'text':
        return renderTextInput();
      
      case 'select':
        return renderSelect();
      
      case 'multi_select':
        return renderMultiSelect();
      
      case 'time_input':
        return renderTimeInput();
      
      case 'picker':
        return renderPicker();
      
      default:
        // Default to text input for unknown types
        return renderTextInput();
    }
  };

  return (
    <div className="question-component">
      {renderQuestion()}
    </div>
  );
};

export default QuestionComponents;
