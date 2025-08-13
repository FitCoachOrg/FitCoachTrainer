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


