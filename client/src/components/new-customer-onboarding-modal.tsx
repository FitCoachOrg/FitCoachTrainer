"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { convertLocalTimeToUTC, convertTimezoneTimeToUTC, convertClientTimeToUTC, convertUTCToClientTime } from "@/lib/timezone-utils"
import { addDays, addMonths, format, parseISO, isAfter, startOfDay } from "date-fns"
import { Wand2 } from "lucide-react"
import { askCerebras } from "@/lib/cerebras-service"

type Frequency = "daily" | "weekly" | "monthly"

interface ProgramConfigRow {
  key: "wakeup" | "bedtime" | "hydration" | "progresspicture" | "weight" | "body_measurement" | "workout_plan" | "nutritional_plan"
  label: string
  enabled: boolean
  startDate: string // yyyy-MM-dd
  frequency: Frequency
  time: string // HH:mm (in client's timezone for UI display)
  coachTip: string
  eventName: string
}

interface NewCustomerOnboardingModalProps {
  clientId: number
  clientName?: string
  isOpen: boolean
  onClose: () => void
  onCompleted: () => void
  selectedTimezone?: string
  clientTimezone?: string
}

const PROGRAM_DEFAULTS: Array<Omit<ProgramConfigRow, "enabled" | "startDate" | "coachTip">> = [
  { key: "workout_plan", label: "Workout Plan", frequency: "weekly", time: "08:00", eventName: "Workout Plan" },
  { key: "nutritional_plan", label: "Nutritional Plan", frequency: "daily", time: "09:00", eventName: "Nutritional Plan" },
  { key: "wakeup", label: "Wakeup", frequency: "daily", time: "07:00", eventName: "Sleep Data" },
  { key: "bedtime", label: "Bedtime", frequency: "daily", time: "21:00", eventName: "Bed time: No Screen Time" },
  { key: "hydration", label: "Hydration", frequency: "daily", time: "09:00", eventName: "Water Intake" },
  { key: "progresspicture", label: "Progress Picture", frequency: "weekly", time: "10:00", eventName: "Progress Picture" },
  { key: "weight", label: "Weight", frequency: "weekly", time: "08:00", eventName: "Weight" },
  { key: "body_measurement", label: "Body Measurement", frequency: "monthly", time: "09:00", eventName: "Body Measurements" },
]

function getIconNameForType(type: ProgramConfigRow["key"]): string {
  switch (type) {
    case "hydration": return "droplet"
    case "wakeup": return "bed"
    case "bedtime": return "bed"
    case "progresspicture": return "camera"
    case "weight": return "weight-scale"
    case "body_measurement": return "ruler"
    case "workout_plan": return "dumbbell"
    case "nutritional_plan": return "utensils"
    default: return "bell"
  }
}

function generateDatesForRange(startDateStr: string, frequency: Frequency): string[] {
  const start = parseISO(startDateStr)
  const end = addMonths(start, 3)
  const dates: string[] = []
  let current = start

  while (current <= end) {
    dates.push(format(current, "yyyy-MM-dd"))
    if (frequency === "daily") {
      current = addDays(current, 1)
    } else if (frequency === "weekly") {
      current = addDays(current, 7)
    } else {
      current = addMonths(current, 1)
    }
  }

  return dates
}

export function NewCustomerOnboardingModal({ clientId, clientName = "Client", isOpen, onClose, onCompleted, selectedTimezone, clientTimezone }: NewCustomerOnboardingModalProps) {
  const { toast } = useToast()
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

  // Use clientTimezone as the primary timezone for this modal
  const effectiveClientTimezone = clientTimezone || selectedTimezone || 'UTC'

  const [rows, setRows] = useState<ProgramConfigRow[]>(
    PROGRAM_DEFAULTS.map(d => ({
      key: d.key,
      label: d.label,
      enabled: false,
      startDate: today,
      frequency: d.frequency,
      time: d.time,
      coachTip: "",
      eventName: d.eventName,
    }))
  )

  // Track previous state to detect changes
  const [previousRows, setPreviousRows] = useState<ProgramConfigRow[]>([])

  // Load existing programs data when modal opens
  useEffect(() => {
    if (isOpen && clientId) {
      loadExistingPrograms()
    }
  }, [isOpen, clientId])

  const loadExistingPrograms = async () => {
    try {
      const { data: clientData, error } = await supabase
        .from('client')
        .select('programs')
        .eq('client_id', clientId)
        .single()

      if (error) {
        console.error('Error loading existing programs:', error)
        return
      }

      if (clientData?.programs) {
        try {
          const existingPrograms = JSON.parse(clientData.programs)
          if (Array.isArray(existingPrograms)) {
            // Update rows with existing data, converting times from UTC to client timezone
            const updatedRows = PROGRAM_DEFAULTS.map(d => {
              const existing = existingPrograms.find((p: any) => p.key === d.key)
              if (existing) {
                // Convert time from UTC to client timezone for display
                let displayTime = d.time // Default time
                if (existing.time) {
                  // If the stored time is in UTC, convert it to client timezone
                  // Check if the time was stored with timezone info
                  if (existing.details_json?.original_local_time) {
                    // Use the original local time that was stored
                    displayTime = existing.details_json.original_local_time
                  } else {
                    // Convert from UTC to client timezone
                    displayTime = convertUTCToClientTime(existing.time, effectiveClientTimezone)
                  }
                }

                return {
                  key: d.key,
                  label: d.label,
                  enabled: existing.enabled || false,
                  startDate: existing.startDate || today,
                  frequency: existing.frequency || d.frequency,
                  time: displayTime,
                  coachTip: existing.coachTip || existing.details_json?.coach_tip || "",
                  eventName: existing.eventName || d.eventName,
                }
              }
              return {
                key: d.key,
                label: d.label,
                enabled: false,
                startDate: today,
                frequency: d.frequency,
                time: d.time,
                coachTip: "",
                eventName: d.eventName,
              }
            })
            
            setRows(updatedRows)
            setPreviousRows(updatedRows) // Store initial state
          }
        } catch (parseError) {
          console.error('Error parsing existing programs JSON:', parseError)
        }
      }
    } catch (error) {
      console.error('Error loading existing programs:', error)
    }
  }

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingKey, setGeneratingKey] = useState<ProgramConfigRow["key"] | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)

  const updateRow = (key: ProgramConfigRow["key"], updates: Partial<ProgramConfigRow>) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...updates } : r))
  }

  // Function to remove future tasks for deselected programs
  const removeFutureTasksForDeselectedPrograms = async (deselectedPrograms: ProgramConfigRow[]) => {
    if (deselectedPrograms.length === 0) return

    try {
      const today = new Date()
      const todayStr = format(today, "yyyy-MM-dd")

      // Get all program types that were deselected
      const deselectedTypes = deselectedPrograms.map(p => p.key)

      console.log(`🗑️ Removing future tasks for deselected programs: ${deselectedTypes.join(', ')}`)

      // Delete future schedule entries for deselected program types
      const { error: deleteError } = await supabase
        .from('schedule')
        .delete()
        .eq('client_id', clientId)
        .in('type', deselectedTypes)
        .gte('for_date', todayStr)

      if (deleteError) {
        console.error('Error removing future tasks:', deleteError)
        throw deleteError
      }

      console.log(`✅ Successfully removed future tasks for deselected programs`)
      
      // Show success message
      const programNames = deselectedPrograms.map(p => p.label).join(', ')
      toast({ 
        title: "Programs Removed", 
        description: `Future ${programNames} tasks have been removed from the schedule.` 
      })

    } catch (error: any) {
      console.error('Error removing future tasks:', error)
      toast({ 
        title: "Error", 
        description: `Failed to remove future tasks: ${error.message}`, 
        variant: "destructive" 
      })
      throw error
    }
  }

  const handleSubmit = async () => {
    const selected = rows.filter(r => r.enabled)
    if (selected.length === 0) {
      toast({ title: "Select programs", description: "Enable at least one program to add.", variant: "destructive" })
      return
    }

    // Exclude custom program creation for Workout and Nutritional plans (temporary behavior)
    const excludedTypes: ProgramConfigRow["key"][] = ["workout_plan", "nutritional_plan"]
    const actionableSelected = selected.filter(r => !excludedTypes.includes(r.key))

    // Identify deselected programs (programs that were enabled before but are now disabled)
    const deselectedPrograms = previousRows.filter(prev => 
      prev.enabled && !rows.find(curr => curr.key === prev.key)?.enabled
    )

    // Remove future tasks for deselected programs
    if (deselectedPrograms.length > 0) {
      await removeFutureTasksForDeselectedPrograms(deselectedPrograms)
    }

    // Build entries across all selected rows
    const allEntries: any[] = []

    for (const r of actionableSelected) {
      if (!r.startDate || !r.time || !r.eventName) {
        toast({ title: "Missing fields", description: `Please complete all fields for ${r.label}.`, variant: "destructive" })
        return
      }

      const dates = generateDatesForRange(r.startDate, r.frequency)
      if (dates.length === 0) continue

      // Track range no longer needed when using upsert

      // Convert time from client timezone to UTC for database storage
      const utcTime = convertClientTimeToUTC(r.time, effectiveClientTimezone)

      if (r.key === "body_measurement") {
        dates.forEach(for_date => {
          allEntries.push({
            client_id: clientId,
            task: "custom",
            summary: r.eventName,
            type: r.key,
            for_date,
            for_time: utcTime, // Store in UTC
            icon: getIconNameForType(r.key),
            coach_tip: r.coachTip || r.label,
            details_json: {
              task_type: r.key,
              frequency: r.frequency,
              program_name: r.eventName,
              selected_measurements: ["hip", "waist", "bicep", "thigh"],
              coach_tip: r.coachTip || r.label,
              original_local_time: r.time, // Store original client timezone time
              timezone: effectiveClientTimezone // Store client timezone
            }
          })
        })
      } else {
        dates.forEach(for_date => {
          allEntries.push({
            client_id: clientId,
            task: "custom",
            summary: r.eventName,
            type: r.key,
            for_date,
            for_time: utcTime, // Store in UTC
            icon: getIconNameForType(r.key),
            coach_tip: r.coachTip || r.label,
            details_json: {
              task_type: r.key,
              frequency: r.frequency,
              program_name: r.eventName,
              coach_tip: r.coachTip || r.label,
              original_local_time: r.time, // Store original client timezone time
              timezone: effectiveClientTimezone // Store client timezone
            }
          })
        })
      }
    }

    if (allEntries.length === 0) {
      // No schedule items to create (likely only excluded types selected). Still save programs JSON and finish.
      try {
        setIsSubmitting(true)
        const programsData = rows.map(row => ({
          key: row.key,
          label: row.label,
          enabled: row.enabled,
          startDate: row.startDate,
          frequency: row.frequency,
          time: row.time,
          coachTip: row.coachTip,
          eventName: row.eventName,
          details_json: {
            original_local_time: row.time,
            timezone: effectiveClientTimezone
          }
        }))

        const { error: updateError } = await supabase
          .from('client')
          .update({ programs: JSON.stringify(programsData) })
          .eq('client_id', clientId)

        if (updateError) {
          throw updateError
        }

        setPreviousRows(rows)
        const actionMessage = deselectedPrograms.length > 0
          ? `Updated programs and removed ${deselectedPrograms.length} deselected program(s).`
          : `Saved program settings. No schedule items created.`
        toast({ title: 'Onboarding updated', description: actionMessage })
        onCompleted()
        onClose()
      } catch (err: any) {
        toast({ title: 'Error', description: err?.message || 'Failed to save programs.', variant: 'destructive' })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setIsSubmitting(true)
    try {
      // Single bulk upsert to insert or update in one operation.
      // Assumes a unique constraint on (client_id, for_date, type) in schedule table.
      const { error: upsertError } = await supabase
        .from("schedule")
        .upsert(allEntries, { onConflict: 'client_id,for_date,type' })
      if (upsertError) throw upsertError

      // Save programs data to client table in JSON format
      const programsData = rows.map(row => ({
        key: row.key,
        label: row.label,
        enabled: row.enabled,
        startDate: row.startDate,
        frequency: row.frequency,
        time: row.time, // Store the time as displayed in client timezone
        coachTip: row.coachTip,
        eventName: row.eventName,
        details_json: {
          coach_tip: row.coachTip,
          original_local_time: row.time, // Store original client timezone time
          timezone: effectiveClientTimezone // Store client timezone
        }
      }))

      const { error: updateError } = await supabase
        .from('client')
        .update({ programs: JSON.stringify(programsData) })
        .eq('client_id', clientId)

      if (updateError) {
        console.error('Error saving programs data:', updateError)
        // Don't throw error here as the schedule entries were already saved
      }

      // Update previous rows state to reflect current state
      setPreviousRows(rows)

      const actionMessage = deselectedPrograms.length > 0 
        ? `Updated programs and removed ${deselectedPrograms.length} deselected program(s).`
        : `Upserted ${allEntries.length} schedule items for ${clientName}.`

      toast({ title: "Onboarding updated", description: actionMessage })

      onCompleted()
      onClose()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to update onboarding programs.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateCoachTip = async (row: ProgramConfigRow) => {
    try {
      setGeneratingKey(row.key)
      const program = row.label
      const freq = row.frequency
      const time = row.time
      const eventName = row.eventName || row.label
      const prompt = `You are an encouraging certified fitness coach. Write a concise, actionable coach tip (1–2 sentences) for this client reminder.

Task Type: ${program} (${row.key})
Event Name: ${eventName}
Frequency: ${freq}
Reminder Time (client timezone): ${time}

Requirements:
- Keep to 1–2 short sentences.
- Be supportive, specific, and practical.
- No emojis, no quotes, no markdown, no lists.`

      const ai = await askCerebras(prompt)
      let text = (ai.response || '').trim()
      if (!text) throw new Error('Empty AI response')
      // Truncate to at most two sentences
      const parts = text.split(/(?<=[.!?])\s+/).slice(0, 2)
      const tip = parts.join(' ').trim()
      updateRow(row.key, { coachTip: tip })
    } catch (err: any) {
      toast({ title: 'AI Error', description: err?.message || 'Failed to generate coach tip', variant: 'destructive' })
    } finally {
      setGeneratingKey(null)
    }
  }

  const buildBatchPrompt = (selectedRows: ProgramConfigRow[]) => {
    const items = selectedRows.map(r => (
      `{
  "key": "${r.key}",
  "program": "${r.label}",
  "event_name": "${r.eventName || r.label}",
  "frequency": "${r.frequency}",
  "reminder_time_client_timezone": "${r.time}"
}`
    ))
    return `You are an encouraging certified fitness coach. For each of the following reminder tasks, write a concise, actionable coach tip.

Return ONLY VALID JSON in exactly this schema (no extra text):
{
  "tips": [
    { "key": "wakeup", "coach_tip": "..." },
    { "key": "hydration", "coach_tip": "..." }
  ]
}

Rules:
- Each coach_tip must be 1–2 sentences maximum.
- Be supportive, specific, and practical.
- No emojis, quotes, markdown, or lists.

Tasks:
[
${items.join(',\n')}
]
`
  }

  const handleGenerateTipsForSelected = async () => {
    const selected = rows.filter(r => r.enabled)
    if (selected.length === 0) {
      toast({ title: 'Select programs', description: 'Enable at least one program to generate tips for.', variant: 'destructive' })
      return
    }
    const prompt = buildBatchPrompt(selected)
    console.log('[Onboarding] Cerebras prompt for batch tips:', prompt)

    setGeneratingAll(true)
    try {
      const ai = await askCerebras(prompt)
      let text = (ai.response || '').trim()
      // Try to extract JSON
      let jsonText = text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) jsonText = jsonMatch[0]
      const parsed = JSON.parse(jsonText)
      const tips: Array<{ key: ProgramConfigRow['key']; coach_tip: string }> = parsed?.tips || []
      if (!Array.isArray(tips) || tips.length === 0) throw new Error('AI did not return tips array')
      setRows(prev => prev.map(r => {
        const found = tips.find(t => t.key === r.key)
        return found ? { ...r, coachTip: (found.coach_tip || '').trim() } : r
      }))
      toast({ title: 'AI Tips Ready', description: `Generated coach tips for ${tips.length} program(s).` })
    } catch (err: any) {
      toast({ title: 'AI Error', description: err?.message || 'Failed to generate tips', variant: 'destructive' })
    } finally {
      setGeneratingAll(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Customer Program Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure which standard programs to start for {clientName}. Enable the ones you want, set the start date, frequency, reminder time, coach tip, and event name. Submitting will add them to the schedule for the next 3 months. <strong>Note: Deselecting a program will remove all future tasks of that type from the schedule.</strong>
          </p>

          {effectiveClientTimezone && (
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <strong>Client Timezone:</strong> {effectiveClientTimezone} - All times will be displayed and stored in this timezone.
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateTipsForSelected}
              disabled={generatingAll}
            >
              {generatingAll ? 'Generating Tips…' : 'Generate Coach Tips for Selected (AI)'}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Main Programs</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Configure the primary workout and nutrition programs for your client.</p>
            </div>
            <table className="min-w-full text-xs md:text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="p-2 border-b">Enable</th>
                  <th className="p-2 border-b text-left">Program</th>
                  <th className="p-2 border-b">Program Start Date</th>
                  <th className="p-2 border-b">Frequency</th>
                  <th className="p-2 border-b">Reminder Time ({effectiveClientTimezone})</th>
                  <th className="p-2 border-b">
                    <div className="flex items-center gap-2 justify-center">
                      <span>Coach Tip</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleGenerateTipsForSelected}
                        disabled={generatingAll}
                        title="Generate Coach Tips for all enabled programs"
                      >
                        <Wand2 className={`h-4 w-4 ${generatingAll ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                  </th>
                  <th className="p-2 border-b">Event Name</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => (
                  <React.Fragment key={r.key}>
                    <tr className={`align-top ${index < 2 ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}>
                      <td className="p-2 border-b">
                        <Checkbox checked={r.enabled} onCheckedChange={(v: any) => updateRow(r.key, { enabled: Boolean(v) })} />
                      </td>
                      <td className="p-2 border-b font-semibold whitespace-nowrap">
                        {index < 2 && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2" title="Main Program"></span>
                        )}
                        {r.label}
                      </td>
                      <td className="p-2 border-b">
                        <Input type="date" value={r.startDate} onChange={e => updateRow(r.key, { startDate: e.target.value })} />
                      </td>
                      <td className="p-2 border-b min-w-[120px]">
                        <Select value={r.frequency} onValueChange={(v: any) => updateRow(r.key, { frequency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 border-b">
                        <Input 
                          type="time" 
                          value={r.time} 
                          onChange={e => updateRow(r.key, { time: e.target.value })}
                          title={`Time in ${effectiveClientTimezone} timezone`}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <div className="flex items-center gap-2">
                          <Input placeholder="Optional" value={r.coachTip} onChange={e => updateRow(r.key, { coachTip: e.target.value })} />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleGenerateCoachTip(r)}
                            disabled={generatingKey === r.key}
                            title="Generate coach tip with AI"
                          >
                            <Wand2 className={`h-4 w-4 ${generatingKey === r.key ? 'animate-pulse' : ''}`} />
                          </Button>
                        </div>
                      </td>
                      <td className="p-2 border-b">
                        <Input value={r.eventName} onChange={e => updateRow(r.key, { eventName: e.target.value })} />
                      </td>
                    </tr>
                    {index === 1 && (
                      <tr>
                        <td colSpan={7} className="p-2 bg-gray-100 dark:bg-gray-800 border-b">
                          <div className="text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                            Additional Programs
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Updating..." : "Submit"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}



