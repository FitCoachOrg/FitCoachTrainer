import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Target, Save, X, Check, Edit3, Trophy, Calendar, MapPin, Dumbbell, AlertTriangle, TrendingUp, Clock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface FitnessGoalsSectionProps {
  client: any
  onGoalsSaved?: () => void
}

interface EditableField {
  key: string
  label: string
  value: string | string[]
  type: 'text' | 'textarea' | 'array'
  isEditing: boolean
  hasChanges: boolean
  category: 'primary' | 'training' | 'constraints' | 'logistics'
  icon: React.ComponentType<any>
}

export function FitnessGoalsSection({ client, onGoalsSaved }: FitnessGoalsSectionProps) {
  // Guard: if no client data is supplied just render a friendly empty state to avoid runtime errors
  if (!client) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Target className="h-5 w-5 text-blue-500" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">No client selected.</p>
        </CardContent>
      </Card>
    )
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
        key: 'cl_primary_goal',
        label: 'Primary Goal',
        value: client.cl_primary_goal || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'primary',
        icon: Trophy
      },
      {
        key: 'specific_outcome',
        label: 'Specific Outcome',
        value: client.specific_outcome || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'primary',
        icon: Target
      },
      {
        key: 'goal_timeline',
        label: 'Timeline',
        value: client.goal_timeline || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'primary',
        icon: Calendar
      },
      {
        key: 'training_experience',
        label: 'Training Experience',
        value: client.training_experience || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'training',
        icon: User
      },
      {
        key: 'focus_areas',
        label: 'Focus Areas',
        value: client.focus_areas || [],
        type: 'array',
        isEditing: false,
        hasChanges: false,
        category: 'training',
        icon: TrendingUp
      },
      {
        key: 'available_equipment',
        label: 'Available Equipment',
        value: client.available_equipment || [],
        type: 'array',
        isEditing: false,
        hasChanges: false,
        category: 'training',
        icon: Dumbbell
      },
      {
        key: 'training_location',
        label: 'Training Location',
        value: client.training_location || '',
        type: 'text',
        isEditing: false,
        hasChanges: false,
        category: 'logistics',
        icon: MapPin
      },
      {
        key: 'injuries_limitations',
        label: 'Injuries & Limitations',
        value: client.injuries_limitations || '',
        type: 'textarea',
        isEditing: false,
        hasChanges: false,
        category: 'constraints',
        icon: AlertTriangle
      },
      {
        key: 'obstacles',
        label: 'Obstacles & Constraints',
        value: client.obstacles || '',
        type: 'textarea',
        isEditing: false,
        hasChanges: false,
        category: 'constraints',
        icon: AlertTriangle
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
  const handleFieldChange = (key: string, value: string | string[]) => {
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
      onGoalsSaved?.()
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
        ? { ...field, isEditing: false, hasChanges: false, value: originalValues[key] || (Array.isArray(originalValues[key]) ? [] : '') }
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
        description: "All fitness goals have been updated successfully.",
      })
      onGoalsSaved?.()
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
      value: originalValues[field.key] || (Array.isArray(originalValues[field.key]) ? [] : '')
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
    primary: { title: 'Primary Goals', color: 'green', icon: Trophy },
    training: { title: 'Training Details', color: 'blue', icon: Dumbbell },
    constraints: { title: 'Limitations & Constraints', color: 'red', icon: AlertTriangle },
    logistics: { title: 'Logistics', color: 'purple', icon: MapPin }
  }

  return (
    <div className="space-y-6">
      {/* Header with Save All button */}
      {hasAnyChanges && (
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
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

      {/* Primary Goals */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-green-600">
            <Trophy className="h-5 w-5" />
            Primary Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.primary?.map((field) => (
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
                  {field.type === 'textarea' ? (
                    <Textarea
                      ref={(el) => inputRefs.current[field.key] = el}
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      onKeyDown={(e) => handleKeyPress(field.key, e)}
                      onBlur={() => handleFieldSave(field.key)}
                      className="border-green-200 focus:border-green-500 min-h-[100px] resize-y"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <Input
                      ref={(el) => inputRefs.current[field.key] = el}
                      value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                      onChange={(e) => handleFieldChange(field.key, field.type === 'array' ? e.target.value.split(',').map(s => s.trim()).filter(s => s) : e.target.value)}
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
                  {field.type === 'array' ? renderArrayValue(field.value) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Training Details */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
            <Dumbbell className="h-5 w-5" />
            Training Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.training?.map((field) => (
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
                  {field.type === 'array' ? renderArrayValue(field.value) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Limitations & Constraints */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Limitations & Constraints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedFields.constraints?.map((field) => (
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
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {field.isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    ref={(el) => inputRefs.current[field.key] = el}
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onKeyDown={(e) => handleKeyPress(field.key, e)}
                    onBlur={() => handleFieldSave(field.key)}
                    className="border-red-200 focus:border-red-500 min-h-[100px] resize-y"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave(field.key)}
                      disabled={isSaving}
                      className="bg-red-600 hover:bg-red-700"
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
                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value as string}
                    onChange={(e) => handleFieldChange(field.key, field.type === 'array' ? e.target.value.split(',').map(s => s.trim()).filter(s => s) : e.target.value)}
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
                  {field.type === 'array' ? renderArrayValue(field.value) : (field.value || "Not set")}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-600">Fitness Goals Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {groupedFields.primary?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Primary Goals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {groupedFields.training?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Training Details</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {groupedFields.constraints?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Constraints</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {groupedFields.logistics?.filter(f => f.value).length || 0}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Logistics</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 