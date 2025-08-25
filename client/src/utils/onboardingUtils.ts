// onboardingUtils.ts
// Utility functions for trainer-side onboarding

import { onboardingQuestions, getQuestionsBySection, getSections } from '../data/onboardingQuestions';

/**
 * Clean data for database storage
 * @param {Object} data - Raw form data
 * @returns {Object} Cleaned data for database
 */
export const cleanDataForDatabase = (data: any) => {
  const cleaned: any = {};

  // Handle numeric fields
  const numericFields = [
    'cl_age', 'cl_height', 'cl_weight', 'waist', 'hip', 'thigh', 'bicep',
    'confidence_level', 'training_days_per_week', 'preferred_meals_per_day',
    'sleep_hours'
  ];

  numericFields.forEach(field => {
    if (data[field] && !isNaN(data[field])) {
      cleaned[field] = parseFloat(data[field]);
    }
  });

  // Handle array fields
  const arrayFields = [
    'available_equipment', 'focus_areas', 'diet_preferences', 'workout_days'
  ];

  arrayFields.forEach(field => {
    if (data[field] && Array.isArray(data[field])) {
      cleaned[field] = data[field];
    }
  });

  // Handle string fields
  const stringFields = [
    'cl_sex', 'cl_activity_level', 'cl_primary_goal', 'specific_outcome',
    'goal_timeline', 'obstacles', 'training_experience', 'previous_training',
    'training_time_per_session', 'training_location', 'injuries_limitations',
    'training_obstacles', 'eating_habits', 'food_allergies', 'cl_gastric_issues', 'cl_supplements',
    'cl_alcohol', 'cl_stress', 'motivation_style'
  ];

  stringFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      cleaned[field] = data[field].trim();
    }
  });

  // Handle time fields (convert to UTC format)
  const timeFields = [
    'wake_time', 'bed_time', 'bf_time', 'lunch_time', 'dinner_time',
    'snack_time', 'workout_time'
  ];

  timeFields.forEach(field => {
    if (data[field]) {
      cleaned[field] = convertTimeToUTC(data[field]);
    }
  });

  return cleaned;
};

/**
 * Convert local time to UTC format
 * @param {string} timeString - Time in format "HH:MM AM/PM"
 * @returns {string} UTC time in format "HH:MM:SS"
 */
export const convertTimeToUTC = (timeString: string) => {
  if (!timeString) return null;

  try {
    // Parse 12-hour format
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }

    // Parse 24-hour format
    const match24 = timeString.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      const hours = match24[1].padStart(2, '0');
      const minutes = match24[2];
      return `${hours}:${minutes}:00`;
    }

    return timeString;
  } catch (error) {
    console.error('Error converting time to UTC:', error);
    return timeString;
  }
};

/**
 * Convert UTC time to local display format
 * @param {string} utcTime - UTC time in format "HH:MM:SS"
 * @returns {string} Local time in format "HH:MM AM/PM"
 */
export const convertUTCToLocal = (utcTime: string) => {
  if (!utcTime) return '';

  try {
    const [hours, minutes] = utcTime.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;

    return `${hour}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error converting UTC to local time:', error);
    return utcTime;
  }
};

/**
 * Calculate completion percentage
 * @param {Object} formData - Current form data
 * @returns {number} Completion percentage (0-100)
 */
export const calculateCompletionPercentage = (formData: any) => {
  const requiredQuestions = onboardingQuestions.filter(q => q.required);
  let completedCount = 0;

  requiredQuestions.forEach(question => {
    const value = formData[question.field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          completedCount++;
        }
      } else {
        completedCount++;
      }
    }
  });

  return Math.round((completedCount / requiredQuestions.length) * 100);
};

/**
 * Validate form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result with errors
 */
export const validateFormData = (formData: any) => {
  const errors: Record<string, string> = {};

  onboardingQuestions.forEach(question => {
    if (question.required) {
      const value = formData[question.field];
      
      if (value === undefined || value === null || value === '') {
        errors[question.field] = `${question.title} is required`;
      } else if (Array.isArray(value) && value.length === 0) {
        errors[question.field] = `Please select at least one option for ${question.title}`;
      } else if (question.keyboardType === 'numeric' && isNaN(value)) {
        errors[question.field] = `${question.title} must be a number`;
      } else if (question.maxLength && value.length > question.maxLength) {
        errors[question.field] = `${question.title} must be ${question.maxLength} characters or less`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Get section progress
 * @param {Object} formData - Current form data
 * @param {string} section - Section name
 * @returns {Object} Section progress info
 */
export const getSectionProgress = (formData: any, section: string) => {
  const sectionQuestions = getQuestionsBySection(section);
  const requiredQuestions = sectionQuestions.filter(q => q.required);
  let completedCount = 0;

  requiredQuestions.forEach(question => {
    const value = formData[question.field];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          completedCount++;
        }
      } else {
        completedCount++;
      }
    }
  });

  return {
    total: requiredQuestions.length,
    completed: completedCount,
    percentage: Math.round((completedCount / requiredQuestions.length) * 100)
  };
};

/**
 * Get all sections with their progress
 * @param {Object} formData - Current form data
 * @returns {Array} Array of sections with progress info
 */
export const getAllSectionsProgress = (formData: any) => {
  const sections = getSections();
  return sections.map(section => ({
    name: section,
    ...getSectionProgress(formData, section)
  }));
};

/**
 * Debounce function for saving data
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format time for display
 * @param {string} time - Time string
 * @returns {string} Formatted time
 */
export const formatTimeForDisplay = (time: string) => {
  if (!time) return '';
  
  try {
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;

    return `${hour}:${minutes} ${ampm}`;
  } catch (error) {
    return time;
  }
};

/**
 * Parse time from display format
 * @param {string} displayTime - Time in display format
 * @returns {string} Time in 24-hour format
 */
export const parseTimeFromDisplay = (displayTime: string) => {
  if (!displayTime) return '';

  try {
    const match = displayTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return displayTime;
  } catch (error) {
    return displayTime;
  }
};

/**
 * Generate default form data
 * @returns {Object} Default form data
 */
export const generateDefaultFormData = () => {
  const defaultData: any = {};

  onboardingQuestions.forEach(question => {
    if (question.type === 'multi_select') {
      defaultData[question.field] = [];
    } else if (question.type === 'time_input') {
      defaultData[question.field] = '';
    } else {
      defaultData[question.field] = '';
    }
  });

  return defaultData;
};

/**
 * Check if all required fields are completed
 * @param {Object} formData - Form data
 * @returns {boolean} True if all required fields are completed
 */
export const isFormComplete = (formData: any) => {
  const validation = validateFormData(formData);
  return validation.isValid;
};

/**
 * Get next incomplete required field
 * @param {Object} formData - Form data
 * @returns {Object|null} Next incomplete question or null
 */
export const getNextIncompleteField = (formData: any) => {
  for (const question of onboardingQuestions) {
    if (question.required) {
      const value = formData[question.field];
      if (value === undefined || value === null || value === '') {
        return question;
      } else if (Array.isArray(value) && value.length === 0) {
        return question;
      }
    }
  }
  return null;
};

/**
 * Scroll to element by ID
 * @param {string} elementId - Element ID to scroll to
 */
export const scrollToElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Generate unique ID for form elements
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateUniqueId = (prefix = 'field') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
