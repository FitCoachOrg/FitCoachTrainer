// Shared datetime utilities

export const formatLocalTime = (time: string | null | undefined): string => {
  if (!time) return 'Not set'
  try {
    const trimmed = String(time).trim()
    const isPlainTime = /^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)
    let dateObj: Date
    if (isPlainTime) {
      const withSeconds = trimmed.length === 5 ? `${trimmed}:00` : trimmed
      dateObj = new Date(`1970-01-01T${withSeconds}Z`)
    } else if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !/[zZ]|[\+\-]\d{2}:?\d{2}$/.test(trimmed)) {
      dateObj = new Date(`${trimmed}Z`)
    } else {
      dateObj = new Date(trimmed)
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date(`1970-01-01T${trimmed}Z`)
      }
    }
    return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch {
    return String(time)
  }
}

// Enhanced formatting for training preferences
export const formatTrainingExperience = (experience: string | null | undefined): string => {
  if (!experience) return 'Not set'
  
  const experienceMap: { [key: string]: string } = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate', 
    'advanced': 'Advanced',
    'expert': 'Expert',
    'novice': 'Novice',
    'experienced': 'Experienced'
  }
  
  const normalized = experience.toLowerCase().trim()
  return experienceMap[normalized] || experience.charAt(0).toUpperCase() + experience.slice(1)
}

export const formatTrainingDuration = (duration: string | number | null | undefined): string => {
  if (!duration) return 'Not set'
  
  const durationStr = String(duration).trim()
  
  // Handle time format (HH:MM:SS or MM:SS)
  if (durationStr.includes(':')) {
    const parts = durationStr.split(':')
    if (parts.length === 3) {
      // HH:MM:SS format
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      } else {
        return `${minutes}m`
      }
    } else if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0])
      return `${minutes}m`
    }
  }
  
  // Handle numeric values (assume minutes)
  const numValue = parseInt(durationStr)
  if (!isNaN(numValue)) {
    if (numValue >= 60) {
      const hours = Math.floor(numValue / 60)
      const minutes = numValue % 60
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    } else {
      return `${numValue}m`
    }
  }
  
  return durationStr
}

export const formatTrainingFrequency = (frequency: number | string | null | undefined): string => {
  if (!frequency) return 'Not set'
  
  const numValue = typeof frequency === 'string' ? parseInt(frequency) : frequency
  if (isNaN(numValue) || numValue === 0) return 'Not set'
  
  if (numValue === 1) return '1 session/week'
  return `${numValue} sessions/week`
}

export const formatWorkoutDays = (days: string[] | string | null | undefined): string => {
  if (!days || (Array.isArray(days) && days.length === 0)) return 'Not set'
  
  const dayArray = Array.isArray(days) ? days : String(days).split(',').map(d => d.trim()).filter(Boolean)
  
  if (dayArray.length === 0) return 'Not set'
  
  const dayAbbreviations: { [key: string]: string } = {
    'monday': 'Mon',
    'tuesday': 'Tue', 
    'wednesday': 'Wed',
    'thursday': 'Thu',
    'friday': 'Fri',
    'saturday': 'Sat',
    'sunday': 'Sun'
  }
  
  const formattedDays = dayArray.map(day => {
    const normalized = day.toLowerCase().trim()
    return dayAbbreviations[normalized] || day
  })
  
  return formattedDays.join(', ')
}

export const formatEquipment = (equipment: string[] | string | null | undefined): string[] => {
  if (!equipment) return []
  
  const equipmentArray = Array.isArray(equipment) ? equipment : String(equipment).split(',').map(e => e.trim()).filter(Boolean)
  
  // Standardize common equipment names
  const equipmentMap: { [key: string]: string } = {
    'dumbbells': 'Dumbbells',
    'barbell': 'Barbell',
    'resistance bands': 'Resistance Bands',
    'yoga mat': 'Yoga Mat',
    'bench': 'Bench',
    'pull-up bar': 'Pull-up Bar',
    'kettlebell': 'Kettlebell',
    'treadmill': 'Treadmill',
    'elliptical': 'Elliptical',
    'stationary bike': 'Stationary Bike',
    'rower': 'Rowing Machine',
    'foam roller': 'Foam Roller',
    'medicine ball': 'Medicine Ball',
    'stability ball': 'Stability Ball',
    'trx': 'TRX',
    'cable machine': 'Cable Machine',
    'smith machine': 'Smith Machine',
    'leg press': 'Leg Press Machine',
    'lat pulldown': 'Lat Pulldown Machine',
    'chest press': 'Chest Press Machine'
  }
  
  return equipmentArray.map(item => {
    const normalized = item.toLowerCase().trim()
    return equipmentMap[normalized] || item.charAt(0).toUpperCase() + item.slice(1)
  })
}

export const getEquipmentIcon = (equipment: string): string => {
  const normalized = equipment.toLowerCase().trim()
  
  const iconMap: { [key: string]: string } = {
    'dumbbells': '🏋️',
    'barbell': '🏋️',
    'resistance bands': '🎯',
    'yoga mat': '🧘',
    'bench': '🪑',
    'pull-up bar': '🏋️',
    'kettlebell': '🏋️',
    'treadmill': '🏃',
    'elliptical': '🏃',
    'stationary bike': '🚴',
    'rowing machine': '🚣',
    'foam roller': '🧘',
    'medicine ball': '⚽',
    'stability ball': '⚽',
    'trx': '🎯',
    'cable machine': '🏋️',
    'smith machine': '🏋️',
    'leg press': '🏋️',
    'lat pulldown': '🏋️',
    'chest press': '🏋️'
  }
  
  return iconMap[normalized] || '🏋️'
}

export const formatLocation = (location: string | null | undefined): string => {
  if (!location) return 'Not set'
  
  const locationMap: { [key: string]: string } = {
    'home': 'Home Gym',
    'home gym': 'Home Gym',
    'gym': 'Commercial Gym',
    'commercial gym': 'Commercial Gym',
    'outdoor': 'Outdoor',
    'park': 'Park',
    'studio': 'Fitness Studio',
    'fitness studio': 'Fitness Studio',
    'work': 'Workplace',
    'workplace': 'Workplace',
    'hotel': 'Hotel Gym',
    'hotel gym': 'Hotel Gym'
  }
  
  const normalized = location.toLowerCase().trim()
  return locationMap[normalized] || location.charAt(0).toUpperCase() + location.slice(1)
}


