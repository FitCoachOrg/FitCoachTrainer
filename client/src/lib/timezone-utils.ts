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
 * - convertTimeBetweenTimezones: Converts time between different timezones
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
 * Convert time from one timezone to another
 * @param time - Time string in format "HH:mm"
 * @param fromTimezone - Source timezone (IANA identifier)
 * @param toTimezone - Target timezone (IANA identifier)
 * @returns Converted time string in format "HH:mm"
 */
export function convertTimeBetweenTimezones(
  time: string, 
  fromTimezone: string, 
  toTimezone: string
): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    
    // Create a date object in the source timezone
    const sourceDate = new Date()
    sourceDate.setHours(hours, minutes, 0, 0)
    
    // Get the time in the source timezone
    const sourceTimeString = sourceDate.toLocaleString('en-US', { 
      timeZone: fromTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Create a new date object with the source time
    const [sourceHours, sourceMinutes] = sourceTimeString.split(':').map(Number)
    const dateWithSourceTime = new Date()
    dateWithSourceTime.setHours(sourceHours, sourceMinutes, 0, 0)
    
    // Convert to target timezone
    const targetTimeString = dateWithSourceTime.toLocaleString('en-US', {
      timeZone: toTimezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return targetTimeString
  } catch (error) {
    console.error('Error converting time between timezones:', error)
    return time // Fallback to original time
  }
}

/**
 * Convert time from a specific timezone to UTC for storage
 * @param time - Time string in format "HH:mm"
 * @param timezone - Source timezone (IANA identifier)
 * @returns UTC time string in format "HH:mm"
 */
export function convertTimezoneTimeToUTC(time: string, timezone: string): string {
  return convertTimeBetweenTimezones(time, timezone, 'UTC')
}

/**
 * Convert time from client's timezone to UTC for storage
 * This is the main function to use when saving reminder times
 * @param time - Time string in format "HH:mm" (in client's timezone)
 * @param clientTimezone - Client's timezone (IANA identifier)
 * @returns UTC time string in format "HH:mm"
 */
export function convertClientTimeToUTC(time: string, clientTimezone: string): string {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    
    // Common timezone offsets (in hours) - positive means ahead of UTC
    const timezoneOffsets: Record<string, number> = {
      // North America
      'America/New_York': -5, // EST (UTC-5)
      'America/Chicago': -6,  // CST (UTC-6)
      'America/Denver': -7,   // MST (UTC-7)
      'America/Los_Angeles': -8, // PST (UTC-8)
      'America/Anchorage': -9, // AKST (UTC-9)
      'Pacific/Honolulu': -10, // HST (UTC-10)
      'America/Toronto': -5,  // EST (UTC-5)
      'America/Vancouver': -8, // PST (UTC-8)
      'America/Mexico_City': -6, // CST (UTC-6)
      
      // Europe
      'Europe/London': 0,     // GMT (UTC+0)
      'Europe/Paris': 1,      // CET (UTC+1)
      'Europe/Berlin': 1,     // CET (UTC+1)
      'Europe/Rome': 1,       // CET (UTC+1)
      'Europe/Madrid': 1,     // CET (UTC+1)
      'Europe/Amsterdam': 1,  // CET (UTC+1)
      'Europe/Stockholm': 1,  // CET (UTC+1)
      'Europe/Vienna': 1,     // CET (UTC+1)
      'Europe/Zurich': 1,     // CET (UTC+1)
      'Europe/Helsinki': 2,   // EET (UTC+2)
      'Europe/Athens': 2,     // EET (UTC+2)
      'Europe/Bucharest': 2,  // EET (UTC+2)
      'Europe/Moscow': 3,     // MSK (UTC+3)
      
      // Asia
      'Asia/Tokyo': 9,        // JST (UTC+9)
      'Asia/Shanghai': 8,     // CST (UTC+8)
      'Asia/Seoul': 9,        // KST (UTC+9)
      'Asia/Singapore': 8,    // SGT (UTC+8)
      'Asia/Bangkok': 7,      // ICT (UTC+7)
      'Asia/Kolkata': 5.5,    // IST (UTC+5:30)
      'Asia/Dubai': 4,        // GST (UTC+4)
      'Asia/Jakarta': 7,      // WIB (UTC+7)
      'Asia/Manila': 8,       // PHT (UTC+8)
      'Asia/Ho_Chi_Minh': 7,  // ICT (UTC+7)
      'Asia/Hong_Kong': 8,    // HKT (UTC+8)
      'Asia/Taipei': 8,       // CST (UTC+8)
      
      // Australia & Oceania
      'Australia/Sydney': 10, // AEST (UTC+10)
      'Australia/Melbourne': 10, // AEST (UTC+10)
      'Australia/Brisbane': 10, // AEST (UTC+10)
      'Australia/Perth': 8,   // AWST (UTC+8)
      'Australia/Adelaide': 9.5, // ACST (UTC+9:30)
      'Pacific/Auckland': 12, // NZST (UTC+12)
      'Pacific/Fiji': 12,     // FJT (UTC+12)
      
      // South America
      'America/Sao_Paulo': -3, // BRT (UTC-3)
      'America/Argentina/Buenos_Aires': -3, // ART (UTC-3)
      'America/Santiago': -3, // CLT (UTC-3)
      'America/Lima': -5,     // PET (UTC-5)
      'America/Bogota': -5,   // COT (UTC-5)
      
      // Africa
      'Africa/Cairo': 2,      // EET (UTC+2)
      'Africa/Johannesburg': 2, // SAST (UTC+2)
      'Africa/Lagos': 1,      // WAT (UTC+1)
      'Africa/Casablanca': 0, // WET (UTC+0)
      'Africa/Nairobi': 3,    // EAT (UTC+3)
      
      // UTC and GMT
      'UTC': 0,
      'GMT': 0
    }
    
    const offset = timezoneOffsets[clientTimezone] || 0
    
    // Convert client time to UTC
    let utcHours = hours - Math.floor(offset)
    let utcMinutes = minutes
    
    // Handle fractional hours (like IST which is UTC+5:30)
    if (offset % 1 !== 0) {
      const fractionalPart = offset % 1
      utcMinutes -= Math.round(fractionalPart * 60)
      
      // Adjust hours if minutes go negative
      if (utcMinutes < 0) {
        utcMinutes += 60
        utcHours -= 1
      }
    }
    
    // Handle negative hours (previous day)
    if (utcHours < 0) {
      utcHours += 24
    }
    
    // Handle hours >= 24 (next day)
    if (utcHours >= 24) {
      utcHours -= 24
    }
    
    return `${Math.floor(utcHours).toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting client time to UTC:', error)
    return time // Fallback to original time
  }
}

/**
 * Convert UTC time to client's timezone for display
 * @param utcTime - Time string in format "HH:mm" (UTC)
 * @param clientTimezone - Client's timezone (IANA identifier)
 * @returns Time string in client's timezone format "HH:mm"
 */
export function convertUTCToClientTime(utcTime: string, clientTimezone: string): string {
  try {
    const [hours, minutes] = utcTime.split(':').map(Number)
    
    // Common timezone offsets (in hours) - positive means ahead of UTC
    const timezoneOffsets: Record<string, number> = {
      // North America
      'America/New_York': -5, // EST (UTC-5)
      'America/Chicago': -6,  // CST (UTC-6)
      'America/Denver': -7,   // MST (UTC-7)
      'America/Los_Angeles': -8, // PST (UTC-8)
      'America/Anchorage': -9, // AKST (UTC-9)
      'Pacific/Honolulu': -10, // HST (UTC-10)
      'America/Toronto': -5,  // EST (UTC-5)
      'America/Vancouver': -8, // PST (UTC-8)
      'America/Mexico_City': -6, // CST (UTC-6)
      
      // Europe
      'Europe/London': 0,     // GMT (UTC+0)
      'Europe/Paris': 1,      // CET (UTC+1)
      'Europe/Berlin': 1,     // CET (UTC+1)
      'Europe/Rome': 1,       // CET (UTC+1)
      'Europe/Madrid': 1,     // CET (UTC+1)
      'Europe/Amsterdam': 1,  // CET (UTC+1)
      'Europe/Stockholm': 1,  // CET (UTC+1)
      'Europe/Vienna': 1,     // CET (UTC+1)
      'Europe/Zurich': 1,     // CET (UTC+1)
      'Europe/Helsinki': 2,   // EET (UTC+2)
      'Europe/Athens': 2,     // EET (UTC+2)
      'Europe/Bucharest': 2,  // EET (UTC+2)
      'Europe/Moscow': 3,     // MSK (UTC+3)
      
      // Asia
      'Asia/Tokyo': 9,        // JST (UTC+9)
      'Asia/Shanghai': 8,     // CST (UTC+8)
      'Asia/Seoul': 9,        // KST (UTC+9)
      'Asia/Singapore': 8,    // SGT (UTC+8)
      'Asia/Bangkok': 7,      // ICT (UTC+7)
      'Asia/Kolkata': 5.5,    // IST (UTC+5:30)
      'Asia/Dubai': 4,        // GST (UTC+4)
      'Asia/Jakarta': 7,      // WIB (UTC+7)
      'Asia/Manila': 8,       // PHT (UTC+8)
      'Asia/Ho_Chi_Minh': 7,  // ICT (UTC+7)
      'Asia/Hong_Kong': 8,    // HKT (UTC+8)
      'Asia/Taipei': 8,       // CST (UTC+8)
      
      // Australia & Oceania
      'Australia/Sydney': 10, // AEST (UTC+10)
      'Australia/Melbourne': 10, // AEST (UTC+10)
      'Australia/Brisbane': 10, // AEST (UTC+10)
      'Australia/Perth': 8,   // AWST (UTC+8)
      'Australia/Adelaide': 9.5, // ACST (UTC+9:30)
      'Pacific/Auckland': 12, // NZST (UTC+12)
      'Pacific/Fiji': 12,     // FJT (UTC+12)
      
      // South America
      'America/Sao_Paulo': -3, // BRT (UTC-3)
      'America/Argentina/Buenos_Aires': -3, // ART (UTC-3)
      'America/Santiago': -3, // CLT (UTC-3)
      'America/Lima': -5,     // PET (UTC-5)
      'America/Bogota': -5,   // COT (UTC-5)
      
      // Africa
      'Africa/Cairo': 2,      // EET (UTC+2)
      'Africa/Johannesburg': 2, // SAST (UTC+2)
      'Africa/Lagos': 1,      // WAT (UTC+1)
      'Africa/Casablanca': 0, // WET (UTC+0)
      'Africa/Nairobi': 3,    // EAT (UTC+3)
      
      // UTC and GMT
      'UTC': 0,
      'GMT': 0
    }
    
    const offset = timezoneOffsets[clientTimezone] || 0
    
    // Convert UTC time to client timezone
    let clientHours = hours + Math.floor(offset)
    let clientMinutes = minutes
    
    // Handle fractional hours (like IST which is UTC+5:30)
    if (offset % 1 !== 0) {
      const fractionalPart = offset % 1
      clientMinutes += Math.round(fractionalPart * 60)
      
      // Adjust hours if minutes go over 60
      if (clientMinutes >= 60) {
        clientMinutes -= 60
        clientHours += 1
      }
    }
    
    // Handle negative hours (previous day)
    if (clientHours < 0) {
      clientHours += 24
    }
    
    // Handle hours >= 24 (next day)
    if (clientHours >= 24) {
      clientHours -= 24
    }
    
    return `${Math.floor(clientHours).toString().padStart(2, '0')}:${clientMinutes.toString().padStart(2, '0')}`
  } catch (error) {
    console.error('Error converting UTC to client time:', error)
    return utcTime // Fallback to original time
  }
}

/**
 * Convert UTC time to a specific timezone for display
 * @param utcTime - Time string in format "HH:mm" (UTC)
 * @param timezone - Target timezone (IANA identifier)
 * @returns Time string in target timezone format "HH:mm"
 */
export function convertUTCToTimezoneTime(utcTime: string, timezone: string): string {
  return convertTimeBetweenTimezones(utcTime, 'UTC', timezone)
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
 * @param timezone - Optional timezone to display (defaults to local)
 * @returns Formatted time string
 */
export function formatTimeForDisplay(
  time: string, 
  includeTimezone: boolean = false, 
  timezone?: string
): string {
  if (!includeTimezone) {
    return time
  }
  
  const displayTimezone = timezone || getLocalTimezone()
  return `${time} (${displayTimezone})`
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
 * Get current time in a specific timezone
 * @param timezone - Target timezone (IANA identifier)
 * @returns Current time in target timezone format "HH:mm"
 */
export function getCurrentTimezoneTime(timezone: string): string {
  try {
    const now = new Date()
    return now.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error getting current time for timezone:', error)
    return getCurrentLocalTime() // Fallback to local time
  }
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

/**
 * Validate timezone identifier
 * @param timezone - Timezone string to validate
 * @returns Whether the timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
} 