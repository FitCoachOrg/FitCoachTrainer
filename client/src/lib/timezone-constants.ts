/**
 * Timezone Constants for Dropdown Selection
 * 
 * This module provides a comprehensive list of common timezones
 * with user-friendly display names for dropdown menus.
 * 
 * Each timezone includes:
 * - value: The IANA timezone identifier (e.g., "America/New_York")
 * - label: User-friendly display name (e.g., "Eastern Time (ET)")
 * - offset: UTC offset for sorting and display
 */

export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

/**
 * Get timezone offset string for display
 * @param timezone - IANA timezone identifier
 * @returns Formatted offset string (e.g., "UTC-5")
 */
function getTimezoneOffset(timezone: string): string {
  // Common timezone offsets for display purposes
  const timezoneOffsets: Record<string, string> = {
    // North America
    "America/New_York": "UTC-5",
    "America/Chicago": "UTC-6", 
    "America/Denver": "UTC-7",
    "America/Los_Angeles": "UTC-8",
    "America/Anchorage": "UTC-9",
    "Pacific/Honolulu": "UTC-10",
    "America/Toronto": "UTC-5",
    "America/Vancouver": "UTC-8",
    "America/Mexico_City": "UTC-6",
    
    // Europe
    "Europe/London": "UTC+0",
    "Europe/Paris": "UTC+1",
    "Europe/Berlin": "UTC+1",
    "Europe/Rome": "UTC+1",
    "Europe/Madrid": "UTC+1",
    "Europe/Amsterdam": "UTC+1",
    "Europe/Stockholm": "UTC+1",
    "Europe/Vienna": "UTC+1",
    "Europe/Zurich": "UTC+1",
    "Europe/Helsinki": "UTC+2",
    "Europe/Athens": "UTC+2",
    "Europe/Bucharest": "UTC+2",
    "Europe/Moscow": "UTC+3",
    
    // Asia
    "Asia/Tokyo": "UTC+9",
    "Asia/Shanghai": "UTC+8",
    "Asia/Seoul": "UTC+9",
    "Asia/Singapore": "UTC+8",
    "Asia/Bangkok": "UTC+7",
    "Asia/Kolkata": "UTC+5:30",
    "Asia/Dubai": "UTC+4",
    "Asia/Jakarta": "UTC+7",
    "Asia/Manila": "UTC+8",
    "Asia/Ho_Chi_Minh": "UTC+7",
    "Asia/Hong_Kong": "UTC+8",
    "Asia/Taipei": "UTC+8",
    
    // Australia & Oceania
    "Australia/Sydney": "UTC+10",
    "Australia/Melbourne": "UTC+10",
    "Australia/Brisbane": "UTC+10",
    "Australia/Perth": "UTC+8",
    "Australia/Adelaide": "UTC+9:30",
    "Pacific/Auckland": "UTC+12",
    "Pacific/Fiji": "UTC+12",
    
    // South America
    "America/Sao_Paulo": "UTC-3",
    "America/Argentina/Buenos_Aires": "UTC-3",
    "America/Santiago": "UTC-3",
    "America/Lima": "UTC-5",
    "America/Bogota": "UTC-5",
    
    // Africa
    "Africa/Cairo": "UTC+2",
    "Africa/Johannesburg": "UTC+2",
    "Africa/Lagos": "UTC+1",
    "Africa/Casablanca": "UTC+0",
    "Africa/Nairobi": "UTC+3",
    
    // UTC and GMT
    "UTC": "UTC",
    "GMT": "UTC"
  }
  
  return timezoneOffsets[timezone] || "UTC"
}

/**
 * Comprehensive list of common timezones
 * Organized by region for better user experience
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  // North America
  { value: "America/New_York", label: "Eastern Time (ET)", offset: getTimezoneOffset("America/New_York") },
  { value: "America/Chicago", label: "Central Time (CT)", offset: getTimezoneOffset("America/Chicago") },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: getTimezoneOffset("America/Denver") },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: getTimezoneOffset("America/Los_Angeles") },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: getTimezoneOffset("America/Anchorage") },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)", offset: getTimezoneOffset("Pacific/Honolulu") },
  { value: "America/Toronto", label: "Eastern Time - Toronto", offset: getTimezoneOffset("America/Toronto") },
  { value: "America/Vancouver", label: "Pacific Time - Vancouver", offset: getTimezoneOffset("America/Vancouver") },
  { value: "America/Mexico_City", label: "Central Time - Mexico", offset: getTimezoneOffset("America/Mexico_City") },
  
  // Europe
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)", offset: getTimezoneOffset("Europe/London") },
  { value: "Europe/Paris", label: "Central European Time (CET)", offset: getTimezoneOffset("Europe/Paris") },
  { value: "Europe/Berlin", label: "Central European Time - Berlin", offset: getTimezoneOffset("Europe/Berlin") },
  { value: "Europe/Rome", label: "Central European Time - Rome", offset: getTimezoneOffset("Europe/Rome") },
  { value: "Europe/Madrid", label: "Central European Time - Madrid", offset: getTimezoneOffset("Europe/Madrid") },
  { value: "Europe/Amsterdam", label: "Central European Time - Amsterdam", offset: getTimezoneOffset("Europe/Amsterdam") },
  { value: "Europe/Stockholm", label: "Central European Time - Stockholm", offset: getTimezoneOffset("Europe/Stockholm") },
  { value: "Europe/Vienna", label: "Central European Time - Vienna", offset: getTimezoneOffset("Europe/Vienna") },
  { value: "Europe/Zurich", label: "Central European Time - Zurich", offset: getTimezoneOffset("Europe/Zurich") },
  { value: "Europe/Helsinki", label: "Eastern European Time (EET)", offset: getTimezoneOffset("Europe/Helsinki") },
  { value: "Europe/Athens", label: "Eastern European Time - Athens", offset: getTimezoneOffset("Europe/Athens") },
  { value: "Europe/Bucharest", label: "Eastern European Time - Bucharest", offset: getTimezoneOffset("Europe/Bucharest") },
  { value: "Europe/Moscow", label: "Moscow Time (MSK)", offset: getTimezoneOffset("Europe/Moscow") },
  
  // Asia
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)", offset: getTimezoneOffset("Asia/Tokyo") },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)", offset: getTimezoneOffset("Asia/Shanghai") },
  { value: "Asia/Seoul", label: "Korea Standard Time (KST)", offset: getTimezoneOffset("Asia/Seoul") },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)", offset: getTimezoneOffset("Asia/Singapore") },
  { value: "Asia/Bangkok", label: "Indochina Time (ICT)", offset: getTimezoneOffset("Asia/Bangkok") },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)", offset: getTimezoneOffset("Asia/Kolkata") },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)", offset: getTimezoneOffset("Asia/Dubai") },
  { value: "Asia/Jakarta", label: "Western Indonesian Time (WIB)", offset: getTimezoneOffset("Asia/Jakarta") },
  { value: "Asia/Manila", label: "Philippine Time (PHT)", offset: getTimezoneOffset("Asia/Manila") },
  { value: "Asia/Ho_Chi_Minh", label: "Indochina Time - Ho Chi Minh", offset: getTimezoneOffset("Asia/Ho_Chi_Minh") },
  { value: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)", offset: getTimezoneOffset("Asia/Hong_Kong") },
  { value: "Asia/Taipei", label: "Taipei Time (CST)", offset: getTimezoneOffset("Asia/Taipei") },
  
  // Australia & Oceania
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)", offset: getTimezoneOffset("Australia/Sydney") },
  { value: "Australia/Melbourne", label: "Australian Eastern Time - Melbourne", offset: getTimezoneOffset("Australia/Melbourne") },
  { value: "Australia/Brisbane", label: "Australian Eastern Time - Brisbane", offset: getTimezoneOffset("Australia/Brisbane") },
  { value: "Australia/Perth", label: "Australian Western Time (AWT)", offset: getTimezoneOffset("Australia/Perth") },
  { value: "Australia/Adelaide", label: "Australian Central Time (ACT)", offset: getTimezoneOffset("Australia/Adelaide") },
  { value: "Pacific/Auckland", label: "New Zealand Standard Time (NZST)", offset: getTimezoneOffset("Pacific/Auckland") },
  { value: "Pacific/Fiji", label: "Fiji Time (FJT)", offset: getTimezoneOffset("Pacific/Fiji") },
  
  // South America
  { value: "America/Sao_Paulo", label: "Brasilia Time (BRT)", offset: getTimezoneOffset("America/Sao_Paulo") },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina Time (ART)", offset: getTimezoneOffset("America/Argentina/Buenos_Aires") },
  { value: "America/Santiago", label: "Chile Time (CLT)", offset: getTimezoneOffset("America/Santiago") },
  { value: "America/Lima", label: "Peru Time (PET)", offset: getTimezoneOffset("America/Lima") },
  { value: "America/Bogota", label: "Colombia Time (COT)", offset: getTimezoneOffset("America/Bogota") },
  
  // Africa
  { value: "Africa/Cairo", label: "Eastern European Time - Cairo", offset: getTimezoneOffset("Africa/Cairo") },
  { value: "Africa/Johannesburg", label: "South Africa Standard Time (SAST)", offset: getTimezoneOffset("Africa/Johannesburg") },
  { value: "Africa/Lagos", label: "West Africa Time (WAT)", offset: getTimezoneOffset("Africa/Lagos") },
  { value: "Africa/Casablanca", label: "Western European Time (WET)", offset: getTimezoneOffset("Africa/Casablanca") },
  { value: "Africa/Nairobi", label: "East Africa Time (EAT)", offset: getTimezoneOffset("Africa/Nairobi") },
  
  // UTC and GMT
  { value: "UTC", label: "Coordinated Universal Time (UTC)", offset: "UTC" },
  { value: "GMT", label: "Greenwich Mean Time (GMT)", offset: "UTC" },
]

/**
 * Get timezone option by value
 * @param value - IANA timezone identifier
 * @returns TimezoneOption or undefined if not found
 */
export function getTimezoneOption(value: string): TimezoneOption | undefined {
  return TIMEZONE_OPTIONS.find(option => option.value === value)
}

/**
 * Get user's local timezone option
 * @returns TimezoneOption for user's local timezone
 */
export function getLocalTimezoneOption(): TimezoneOption {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const option = getTimezoneOption(localTimezone)
  
  if (option) {
    return option
  }
  
  // Fallback to UTC if local timezone not found
  return TIMEZONE_OPTIONS.find(opt => opt.value === "UTC") || TIMEZONE_OPTIONS[0]
}

/**
 * Sort timezone options by offset for better organization
 * @returns Sorted array of timezone options
 */
export function getSortedTimezoneOptions(): TimezoneOption[] {
  return [...TIMEZONE_OPTIONS].sort((a, b) => {
    // Extract numeric offset for sorting
    const aOffset = parseInt(a.offset.replace(/[^0-9-]/g, '')) || 0
    const bOffset = parseInt(b.offset.replace(/[^0-9-]/g, '')) || 0
    return aOffset - bOffset
  })
}
