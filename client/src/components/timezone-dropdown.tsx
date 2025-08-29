"use client"

import React, { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Clock, Globe } from "lucide-react"
import { 
  TIMEZONE_OPTIONS, 
  getLocalTimezoneOption, 
  getSortedTimezoneOptions,
  type TimezoneOption 
} from "@/lib/timezone-constants"
import { getCurrentTimezoneTime } from "@/lib/timezone-utils"

interface TimezoneDropdownProps {
  value?: string
  onValueChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
  showCurrentTime?: boolean
  disabled?: boolean
}

/**
 * Timezone Dropdown Component
 * 
 * Provides a user-friendly dropdown for selecting timezones when planning
 * custom programs and tasks. Includes current time display for each timezone.
 * 
 * Features:
 * - Comprehensive list of common timezones
 * - Current time display for each timezone
 * - Automatic detection of user's local timezone
 * - Organized by UTC offset for easy selection
 * - User-friendly labels with timezone abbreviations
 */
export function TimezoneDropdown({
  value,
  onValueChange,
  label = "Timezone",
  placeholder = "Select timezone",
  className = "",
  showCurrentTime = true,
  disabled = false
}: TimezoneDropdownProps) {
  const [currentTimes, setCurrentTimes] = useState<Record<string, string>>({})
  const [sortedOptions, setSortedOptions] = useState<TimezoneOption[]>([])

  // Initialize with user's local timezone if no value provided
  useEffect(() => {
    if (!value) {
      const localOption = getLocalTimezoneOption()
      onValueChange(localOption.value)
    }
  }, [value, onValueChange])

  // Get sorted timezone options
  useEffect(() => {
    setSortedOptions(getSortedTimezoneOptions())
  }, [])

  // Update current times for all timezones
  useEffect(() => {
    if (!showCurrentTime) return

    const updateTimes = () => {
      const times: Record<string, string> = {}
      TIMEZONE_OPTIONS.forEach(option => {
        times[option.value] = getCurrentTimezoneTime(option.value)
      })
      setCurrentTimes(times)
    }

    // Update immediately
    updateTimes()

    // Update every minute
    const interval = setInterval(updateTimes, 60000)

    return () => clearInterval(interval)
  }, [showCurrentTime])

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue)
  }

  const selectedOption = TIMEZONE_OPTIONS.find(option => option.value === value)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Globe className="h-4 w-4" />
          {label}
        </Label>
      )}
      
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{selectedOption.label}</span>
                {showCurrentTime && currentTimes[selectedOption.value] && (
                  <span className="text-sm text-gray-500 ml-auto">
                    {currentTimes[selectedOption.value]}
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-h-96">
          {/* Group timezones by offset */}
          {(() => {
            const grouped: Record<string, TimezoneOption[]> = {}
            
            sortedOptions.forEach(option => {
              const offset = option.offset
              if (!grouped[offset]) {
                grouped[offset] = []
              }
              grouped[offset].push(option)
            })

            return Object.entries(grouped).map(([offset, options]) => (
              <div key={offset}>
                {/* Offset header */}
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                  {offset}
                </div>
                
                {/* Timezone options for this offset */}
                {options.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {showCurrentTime && currentTimes[option.value] && (
                        <span className="text-sm text-gray-500">
                          {currentTimes[option.value]}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))
          })()}
        </SelectContent>
      </Select>
      
      {/* Helpful information */}
      {selectedOption && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>
            Selected: <strong>{selectedOption.label}</strong> ({selectedOption.offset})
          </p>
          {showCurrentTime && currentTimes[selectedOption.value] && (
            <p>
              Current time: <strong>{currentTimes[selectedOption.value]}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Simple Timezone Selector Component
 * 
 * A simplified version of the timezone dropdown for use in forms
 * where space is limited or current time display is not needed.
 */
export function SimpleTimezoneSelector({
  value,
  onValueChange,
  placeholder = "Select timezone",
  className = "",
  disabled = false
}: Omit<TimezoneDropdownProps, 'label' | 'showCurrentTime'>) {
  const [sortedOptions] = useState(() => getSortedTimezoneOptions())

  // Initialize with user's local timezone if no value provided
  useEffect(() => {
    if (!value) {
      const localOption = getLocalTimezoneOption()
      onValueChange(localOption.value)
    }
  }, [value, onValueChange])

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      
      <SelectContent>
        {sortedOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label} ({option.offset})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
