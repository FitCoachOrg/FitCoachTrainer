/**
 * Timezone Utilities for Supabase Integration
 * 
 * This module handles the conversion between local timezone and UTC for Supabase storage.
 * Supabase stores timestamps in UTC, but users input times in their local timezone.
 * 
 * Key functions:
 * - convertLocalTimeToUTC: Converts local time to UTC for storage
 * - convertUTCToLocalTime: Converts UTC time to local time for display
 * - getLocalTimezone: Gets the user's local timezone
 * - formatTimeForDisplay: Formats time for user display
 */

/**
 * Convert local time to UTC for Supabase storage
 * @param localTime - Time string in format "HH:mm" (local timezone)
 * @returns UTC time string in format "HH:mm"
 */
export function convertLocalTimeToUTC(localTime: string): string {
  try {
    const [hours, minutes] = localTime.split(':').map(Number)
    
    // Create a date object in local timezone
    const localDate = new Date()
    localDate.setHours(hours, minutes, 0, 0)
    
    // Convert to UTC
    const utcHours = localDate.getUTCHours()
    const utcMinutes = localDate.getUTCMinutes()
    
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting local time to UTC:', error)
    return localTime // Fallback to original time
  }
}

/**
 * Convert UTC time from Supabase to local time for display
 * @param utcTime - Time string in format "HH:mm" (UTC)
 * @returns Local time string in format "HH:mm"
 */
export function convertUTCToLocalTime(utcTime: string): string {
  try {
    const [hours, minutes] = utcTime.split(':').map(Number)
    
    // Create a UTC date object
    const utcDate = new Date()
    utcDate.setUTCHours(hours, minutes, 0, 0)
    
    // Convert to local time
    const localHours = utcDate.getHours()
    const localMinutes = utcDate.getMinutes()
    
    return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting UTC time to local:', error)
    return utcTime // Fallback to original time
  }
}

/**
 * Get the user's local timezone
 * @returns Timezone string (e.g., "America/New_York")
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Format time for display with timezone indicator
 * @param time - Time string in format "HH:mm"
 * @param includeTimezone - Whether to include timezone info
 * @returns Formatted time string
 */
export function formatTimeForDisplay(time: string, includeTimezone: boolean = false): string {
  if (!includeTimezone) {
    return time
  }
  
  const timezone = getLocalTimezone()
  return `${time} (${timezone})`
}

/**
 * Validate time string format
 * @param time - Time string to validate
 * @returns Whether the time format is valid
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Get current local time in HH:mm format
 * @returns Current local time string
 */
export function getCurrentLocalTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

/**
 * Convert time string to minutes for comparison
 * @param time - Time string in format "HH:mm"
 * @returns Minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes to time string
 * @param minutes - Minutes since midnight
 * @returns Time string in format "HH:mm"
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
} 