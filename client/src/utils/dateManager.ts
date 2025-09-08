/**
 * DateManager - Robust Date Management System
 * 
 * Provides safe, consistent date operations throughout the application
 * with comprehensive validation and error handling.
 */

import { format, addDays, startOfDay, isSameDay } from 'date-fns';

export interface DateValidationResult {
  isValid: boolean;
  date: Date | null;
  error?: string;
}

export interface DateAlignmentResult {
  alignedDate: Date;
  wasAligned: boolean;
  originalDate: Date;
  targetDay: string;
}

export class DateManager {
  private static readonly WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  /**
   * Safely validate and create a Date object from any input
   */
  static validateDate(input: any): DateValidationResult {
    try {
      // Handle null/undefined
      if (input == null) {
        return {
          isValid: false,
          date: null,
          error: 'Input is null or undefined'
        };
      }
      
      // Handle string input
      if (typeof input === 'string') {
        if (input.trim() === '') {
          return {
            isValid: false,
            date: null,
            error: 'Empty string provided'
          };
        }
        
        const parsed = new Date(input);
        if (isNaN(parsed.getTime())) {
          return {
            isValid: false,
            date: null,
            error: `Invalid date string: "${input}"`
          };
        }
        
        return {
          isValid: true,
          date: parsed
        };
      }
      
      // Handle Date object
      if (input instanceof Date) {
        if (isNaN(input.getTime())) {
          return {
            isValid: false,
            date: null,
            error: 'Invalid Date object'
          };
        }
        
        return {
          isValid: true,
          date: input
        };
      }
      
      // Handle number (timestamp)
      if (typeof input === 'number') {
        const date = new Date(input);
        if (isNaN(date.getTime())) {
          return {
            isValid: false,
            date: null,
            error: `Invalid timestamp: ${input}`
          };
        }
        
        return {
          isValid: true,
          date: date
        };
      }
      
      return {
        isValid: false,
        date: null,
        error: `Unsupported input type: ${typeof input}`
      };
      
    } catch (error) {
      return {
        isValid: false,
        date: null,
        error: `Date validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Create a safe Date object with fallback
   */
  static createSafeDate(input: any, fallback: Date = new Date()): Date {
    const validation = this.validateDate(input);
    if (validation.isValid && validation.date) {
      return validation.date;
    }
    
    console.warn('[DateManager] Invalid date input, using fallback:', {
      input,
      error: validation.error,
      fallback: fallback.toISOString()
    });
    
    return fallback;
  }
  
  /**
   * Align a date with a specific day of the week
   */
  static alignWithDayOfWeek(date: Date, targetDay: string): DateAlignmentResult {
    const validation = this.validateDate(date);
    if (!validation.isValid || !validation.date) {
      throw new Error(`Invalid date for alignment: ${validation.error}`);
    }
    
    const validDate = validation.date;
    const targetDayIndex = this.WEEKDAYS.indexOf(targetDay);
    
    if (targetDayIndex === -1) {
      throw new Error(`Invalid target day: "${targetDay}". Must be one of: ${this.WEEKDAYS.join(', ')}`);
    }
    
    const currentDayIndex = validDate.getDay();
    
    if (currentDayIndex === targetDayIndex) {
      return {
        alignedDate: validDate,
        wasAligned: false,
        originalDate: validDate,
        targetDay
      };
    }
    
    // Calculate days to add to get to the target day
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7; // Go to next week's target day
    }
    
    const alignedDate = new Date(validDate);
    alignedDate.setDate(validDate.getDate() + daysToAdd);
    
    return {
      alignedDate,
      wasAligned: true,
      originalDate: validDate,
      targetDay
    };
  }
  
  /**
   * Normalize a date to start of day (remove time component)
   */
  static normalizeToStartOfDay(date: Date): Date {
    const validation = this.validateDate(date);
    if (!validation.isValid || !validation.date) {
      throw new Error(`Invalid date for normalization: ${validation.error}`);
    }
    
    return startOfDay(validation.date);
  }
  
  /**
   * Format a date safely with error handling
   */
  static safeFormat(date: Date, formatString: string): string {
    const validation = this.validateDate(date);
    if (!validation.isValid || !validation.date) {
      console.error('[DateManager] Cannot format invalid date:', {
        date,
        error: validation.error,
        formatString
      });
      return 'Invalid Date';
    }
    
    try {
      return format(validation.date, formatString);
    } catch (error) {
      console.error('[DateManager] Date formatting error:', {
        date: validation.date.toISOString(),
        formatString,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'Format Error';
    }
  }
  
  /**
   * Add days to a date safely
   */
  static safeAddDays(date: Date, days: number): Date {
    const validation = this.validateDate(date);
    if (!validation.isValid || !validation.date) {
      throw new Error(`Invalid date for adding days: ${validation.error}`);
    }
    
    try {
      return addDays(validation.date, days);
    } catch (error) {
      throw new Error(`Error adding days to date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    const validation1 = this.validateDate(date1);
    const validation2 = this.validateDate(date2);
    
    if (!validation1.isValid || !validation2.isValid) {
      return false;
    }
    
    try {
      return isSameDay(validation1.date!, validation2.date!);
    } catch (error) {
      console.error('[DateManager] Error comparing dates:', {
        date1: date1.toISOString(),
        date2: date2.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  /**
   * Get the day of the week name
   */
  static getDayName(date: Date): string {
    const validation = this.validateDate(date);
    if (!validation.isValid || !validation.date) {
      return 'Invalid Day';
    }
    
    return this.WEEKDAYS[validation.date.getDay()];
  }
  
  /**
   * Generate a date range for a given start date and number of days
   */
  static generateDateRange(startDate: Date, days: number): Date[] {
    const validation = this.validateDate(startDate);
    if (!validation.isValid || !validation.date) {
      throw new Error(`Invalid start date for range generation: ${validation.error}`);
    }
    
    if (days < 0) {
      throw new Error(`Invalid days count: ${days}. Must be non-negative.`);
    }
    
    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      dates.push(this.safeAddDays(validation.date, i));
    }
    
    return dates;
  }
  
  /**
   * Create a date from URL parameters or localStorage with validation
   */
  static createDateFromSources(
    urlParam?: string | null,
    localStorageValue?: string | null,
    fallback: Date = new Date()
  ): Date {
    // Try URL parameter first
    if (urlParam) {
      const urlValidation = this.validateDate(urlParam);
      if (urlValidation.isValid && urlValidation.date) {
        console.log('[DateManager] Using date from URL parameter:', urlValidation.date.toISOString());
        return urlValidation.date;
      }
    }
    
    // Try localStorage value
    if (localStorageValue) {
      const storageValidation = this.validateDate(localStorageValue);
      if (storageValidation.isValid && storageValidation.date) {
        console.log('[DateManager] Using date from localStorage:', storageValidation.date.toISOString());
        return storageValidation.date;
      }
    }
    
    // Use fallback
    console.log('[DateManager] Using fallback date:', fallback.toISOString());
    return fallback;
  }
}

export default DateManager;
