import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Save, X, Check, Edit3, Clock, MapPin, Calendar, User, Target, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface TrainingPreferencesSectionProps {
  client: any
  onPreferencesSaved?: () => void
}

interface EditableField {
  key: string
  label: string
  value: string | string[] | number
  type: 'text' | 'textarea' | 'array' | 'number'
  isEditing: boolean
  hasChanges: boolean
  category: 'experience' | 'schedule' | 'logistics' | 'equipment'
  icon: React.ComponentType<any>
}

export function TrainingPreferencesSection({ client, onPreferencesSaved }: TrainingPreferencesSectionProps) {
  // Guard: if no client data is supplied just render a friendly empty state to avoid runtime errors
  if (!client) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Dumbbell className="h-5 w-5 text-blue-500" />
            Training Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No client selected.</p>
        </CardContent>
      </Card>
    )
  }

  // --- Helper to robustly parse workout_days ---
  function parseWorkoutDays(val: any): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
        // fallback: split by comma if not valid JSON array
        return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      } catch {
        // fallback: split by comma if JSON.parse fails
        return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  // Format a time value (possibly stored in UTC) into the user's local timezone
  const formatLocalTime = (time: string | null | undefined): string => {
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

  const [editableFields, setEditableFields] = useState<EditableField[]>([])
  const [originalValues, setOriginalValues] = useState<{[key: string]: any}>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasAnyChanges, setHasAnyChanges] = useState(false)
  const { toast } = useToast()
  const inputRefs = useRef<{[key: string]: HTMLInputElement | HTMLTextAreaElement | null}>({})

  // Initialize editable fields from client data
  useEffect(() => {
    const fields: EditableField[] = [
      {
        key: 'training_experience',
        label: 'Training Experience',
        value: client.training_experience || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'experience',
        icon: User
      },
      {
        key: 'previous_training',
        label: 'Previous Training',
        value: client.previous_training || '',
        type: 'textarea',
        isEditing: false,
        hasChanges: false,
        category: 'experience',
        icon: Target
      },
      {
        key: 'training_days_per_week',
        label: 'Training Sessions/Week',
        value: client.training_days_per_week || 0,
        type: 'number',
        isEditing: false,
        hasChanges: false,
        category: 'schedule',
        icon: Calendar
      },
      {
        key: 'training_time_per_session',
        label: 'Time per Session',
        value: client.training_time_per_session || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'schedule',
        icon: Clock
      },
      // --- NEW FIELD: Workout Time (time of day for preferred workout) ---
      {
        key: 'workout_time',
        label: 'Preferred Workout Time',
        value: client.workout_time || '', // Should be in HH:MM:SS or HH:MM format
        type: 'text', // Could use 'time' if you want a time picker in the future
        isEditing: false,
        hasChanges: false,
        category: 'schedule',
        icon: Clock
      },
      // --- NEW FIELD: Workout Days (array of preferred days) ---
      {
        key: 'workout_days',
        label: 'Preferred Workout Days',
        value: parseWorkoutDays(client.workout_days),
        type: 'array',
        isEditing: false,
        hasChanges: false,
        category: 'schedule',
        icon: Calendar
      },
      {
        key: 'training_location',
        label: 'Preferred Location',
        value: client.training_location || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'logistics',
        icon: MapPin
      },
      {
        key: 'available_equipment',
        label: 'Available Equipment',
        value: client.available_equipment || [],
        type: 'array',
        isEditing: false,
        hasChanges: false,
        category: 'equipment',
        icon: Dumbbell
      }
    ]

    setEditableFields(fields)
    
    // Store original values for comparison
    const original: {[key: string]: any} = {}
    fields.forEach(field => {
      original[field.key] = field.value
    })
    setOriginalValues(original)
  }, [client])

  // Handle field editing
  const handleFieldEdit = (key: string) => {
    setEditableFields(prev => prev.map(field => 
      field.key === key ? { ...field, isEditing: true } : field
    ))
    
    // Focus the input after a brief delay to ensure DOM update
    setTimeout(() => {
      const input = inputRefs.current[key]
      if (input) {
        input.focus()
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.select()
        }
      }
    }, 10)
  }

  // Handle field value change
  const handleFieldChange = (key: string, value: string | string[] | number) => {
    setEditableFields(prev => prev.map(field => {
      if (field.key === key) {
        const hasChanges = JSON.stringify(value) !== JSON.stringify(originalValues[key])
        return { ...field, value, hasChanges }
      }
      return field
    }))
    
    // Check if any field has changes
    const updatedFields = editableFields.map(field => 
      field.key === key ? { ...field, value, hasChanges: JSON.stringify(value) !== JSON.stringify(originalValues[key]) } : field
    )
    setHasAnyChanges(updatedFields.some(field => field.hasChanges))
  }

  // Save field to Supabase DB
  const handleFieldSave = async (key: string) => {
    const field = editableFields.find(f => f.key === key)
    if (!field) return
    setIsSaving(true)
    try {
      // Prepare update payload
      let updateValue = field.value
      // For array fields, store as array (not string)
      if (field.type === 'array' && typeof updateValue === 'string') {
        updateValue = (updateValue as string).split(',').map(s => s.trim()).filter(s => s)
      }
      // For number fields, ensure it's a number
      if (field.type === 'number') {
        updateValue = typeof updateValue === 'string' ? parseInt(updateValue) || 0 : updateValue
      }
      // Update the client table in Supabase
      const { error } = await supabase
        .from('client')
        .update({ [key]: updateValue })
        .eq('client_id', client.client_id)
      if (error) throw error
      // Update original values
      setOriginalValues(prev => ({ ...prev, [key]: field.value }))
      // Mark field as not editing and no changes
      setEditableFields(prev => prev.map(f =>
        f.key === key ? { ...f, isEditing: false, hasChanges: false } : f
      ))
      toast({
        title: "Field Updated",
        description: `${field.label} has been saved successfully.`,
      })
      onPreferencesSaved?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save ${field?.label}: ${error.message || error}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle field cancel
  const handleFieldCancel = (key: string) => {
    setEditableFields(prev => prev.map(field => 
      field.key === key 
        ? { ...field, isEditing: false, hasChanges: false, value: originalValues[key] || (Array.isArray(originalValues[key]) ? [] : field.type === 'number' ? 0 : '') }
        : field
    ))
  }

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      const updates: {[key: string]: any} = {}
      editableFields.forEach(field => {
        if (field.hasChanges) {
          let value = field.value
          if (field.type === 'array' && typeof value === 'string') {
            value = (value as string).split(',').map(s => s.trim()).filter(s => s)
          }
          if (field.type === 'number') {
            value = typeof value === 'string' ? parseInt(value) || 0 : value
          }
          updates[field.key] = value
        }
      })
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('client')
          .update(updates)
          .eq('client_id', client.client_id)
        if (error) throw error
      }
      // Update all original values
      const newOriginalValues = { ...originalValues }
      editableFields.forEach(field => {
        if (field.hasChanges) {
          newOriginalValues[field.key] = field.value
        }
      })
      setOriginalValues(newOriginalValues)
      // Mark all fields as not editing and no changes
      setEditableFields(prev => prev.map(field => ({
        ...field,
        isEditing: false,
        hasChanges: false
      })))
      setHasAnyChanges(false)
      toast({
        title: "All Changes Saved",
        description: "All training preferences have been updated successfully.",
      })
      onPreferencesSaved?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to save changes: ${error.message || error}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel all changes
  const handleCancelAll = () => {
    setEditableFields(prev => prev.map(field => ({ 
      ...field, 
      isEditing: false, 
      hasChanges: false,
      value: originalValues[field.key] || (Array.isArray(originalValues[field.key]) ? [] : field.type === 'number' ? 0 : '')
    })))
    setHasAnyChanges(false)
  }

  // Handle key press events
  const handleKeyPress = (key: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFieldSave(key)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleFieldCancel(key)
    }
  }

  // Helper function to render array values
  const renderArrayValue = (value: string[] | string) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-gray-500 italic">Not set</span>
    }
    // Type guard: if value is a number, treat as not set
    if (typeof value === 'number') {
      return <span className="text-gray-500 italic">Not set</span>
    }
    const arrayValue = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(s => s) : [])
    return (
      <div className="flex flex-wrap gap-2">
        {arrayValue.map((item, index) => (
          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  // Group fields by category
  const groupedFields = editableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as {[key: string]: EditableField[]})

  const categoryConfig = {
    experience: { title: 'Training Experience', color: 'blue', icon: User },
    schedule: { title: 'Training Schedule', color: 'green', icon: Calendar },
    logistics: { title: 'Logistics', color: 'purple', icon: MapPin },
    equipment: { title: 'Equipment', color: 'orange', icon: Dumbbell }
  }

  return (
    <div className="space-y-6">
      {/* Header with Save All button */}
      {hasAnyChanges && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSaving ? "Saving..." : "Save All Changes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAll}
                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Experience */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
            <User className="h-5 w-5" />
            Training Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.experience?.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                {!field.isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit(field.key)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {field.isEditing ? (
                <div className="space-y-2">
                  {field.type === 'textarea' ? (
                    <Textarea
                      ref={(el) => inputRefs.current[field.key] = el}
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      onKeyDown={(e) => handleKeyPress(field.key, e)}
                      onBlur={() => handleFieldSave(field.key)}
                      className="border-blue-200 focus:border-blue-500 min-h-[100px] resize-y"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <Input
                      ref={(el) => inputRefs.current[field.key] = el}
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                      onChange={(e) => handleFieldChange(field.key, field.type === 'array' ? e.target.value.split(',').map(s => s.trim()).filter(s => s) : e.target.value)}
                      onKeyDown={(e) => handleKeyPress(field.key, e)}
                      onBlur={() => handleFieldSave(field.key)}
                      className="border-blue-200 focus:border-blue-500"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave(field.key)}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel(field.key)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-white">
                  {field.type === 'array' ? renderArrayValue(Array.isArray(field.value) || typeof field.value === 'string' ? field.value : (typeof field.value === 'number' ? '' : '')) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Training Schedule */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-600">
            <Calendar className="h-5 w-5" />
            Training Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.schedule?.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                {!field.isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit(field.key)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-green-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {field.isEditing ? (
                <div className="space-y-2">
                  {field.type === 'number' ? (
                    <Input
                      ref={(el) => inputRefs.current[field.key] = el}
                      type="number"
                      value={field.value as number}
                      onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
                      onKeyDown={(e) => handleKeyPress(field.key, e)}
                      onBlur={() => handleFieldSave(field.key)}
                      className="border-green-200 focus:border-green-500"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <Input
                      ref={(el) => inputRefs.current[field.key] = el}
                      value={field.value as string}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      onKeyDown={(e) => handleKeyPress(field.key, e)}
                      onBlur={() => handleFieldSave(field.key)}
                      className="border-green-200 focus:border-green-500"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave(field.key)}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel(field.key)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-white">
                  {field.key === 'workout_time' ? formatLocalTime(field.value as string) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logistics */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
            <MapPin className="h-5 w-5" />
            Logistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.logistics?.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                {!field.isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit(field.key)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-purple-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {field.isEditing ? (
                <div className="space-y-2">
                  <Input
                    ref={(el) => inputRefs.current[field.key] = el}
                    value={field.value as string}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onKeyDown={(e) => handleKeyPress(field.key, e)}
                    onBlur={() => handleFieldSave(field.key)}
                    className="border-purple-200 focus:border-purple-500"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave(field.key)}
                      disabled={isSaving}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel(field.key)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-white">
                  {field.value || "Not set"}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-orange-600">
            <Dumbbell className="h-5 w-5" />
            Equipment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.equipment?.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                {!field.isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit(field.key)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-orange-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {field.isEditing ? (
                <div className="space-y-2">
                  <Input
                    ref={(el) => inputRefs.current[field.key] = el}
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                    onChange={(e) => handleFieldChange(field.key, e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    onKeyDown={(e) => handleKeyPress(field.key, e)}
                    onBlur={() => handleFieldSave(field.key)}
                    className="border-orange-200 focus:border-orange-500"
                    placeholder={`Enter ${field.label.toLowerCase()} (comma-separated)...`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave(field.key)}
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel(field.key)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-white">
                  {field.type === 'array' ? renderArrayValue(field.value as string[] | string) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-600">Training Preferences Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {groupedFields.experience?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Experience</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {groupedFields.schedule?.filter(f => {
                  if (f.type === 'array') {
                    return Array.isArray(f.value) ? f.value.length > 0 : (typeof f.value === 'string' ? f.value.trim().length > 0 : false)
                  }
                  return !!f.value
                }).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Schedule</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {groupedFields.logistics?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Logistics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {groupedFields.equipment?.filter(f => {
                  if (f.type === 'array') {
                    return Array.isArray(f.value) ? f.value.length > 0 : (typeof f.value === 'string' ? f.value.trim().length > 0 : false)
                  }
                  return !!f.value
                }).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Equipment</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 