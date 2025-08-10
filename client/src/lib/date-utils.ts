/**
 * Date Utilities for Timezone Handling
 * 
 * This module provides consistent date handling between UTC (Supabase) and local timezone (client)
 */

/**
 * Convert a local date string (YYYY-MM-DD) to UTC date string
 * This ensures dates are stored correctly in Supabase
 */
export function localDateToUTC(dateString: string): string {
  // Create a date object in local timezone
  const localDate = new Date(dateString + 'T00:00:00');
  
  // Convert to UTC and format as YYYY-MM-DD
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
  return utcDate.toISOString().split('T')[0];
}

/**
 * Convert a UTC date string (YYYY-MM-DD) to local date string
 * This ensures dates are displayed correctly in the client
 */
export function utcDateToLocal(dateString: string): string {
  // Create a UTC date object
  const utcDate = new Date(dateString + 'T00:00:00Z');
  
  // Convert to local timezone and format as YYYY-MM-DD
  const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

/**
 * Ensure a date string is in the correct format for database storage
 * This handles both local and UTC date strings
 */
export function normalizeDateForStorage(dateString: string): string {
  // If the date string doesn't have timezone info, assume it's local
  if (!dateString.includes('T') || !dateString.includes('Z')) {
    return localDateToUTC(dateString);
  }
  
  // If it already has timezone info, extract just the date part
  return dateString.split('T')[0];
}

/**
 * Ensure a date string is in the correct format for display
 * This converts UTC dates to local timezone for display
 */
export function normalizeDateForDisplay(dateString: string): string {
  // If the date string has timezone info, convert to local
  if (dateString.includes('T') || dateString.includes('Z')) {
    return utcDateToLocal(dateString);
  }
  
  // If it's already a simple date string, return as is
  return dateString;
}

/**
 * Get the current date in local timezone as YYYY-MM-DD
 */
export function getCurrentLocalDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Create a Date object from a date string, ensuring proper timezone handling
 */
export function createDateFromString(dateString: string): Date {
  // If the date string is in YYYY-MM-DD format, create a local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T00:00:00');
  }
  
  // Otherwise, let JavaScript handle it
  return new Date(dateString);
} 