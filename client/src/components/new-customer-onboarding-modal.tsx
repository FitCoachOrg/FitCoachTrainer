"use client"

import React, { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { convertLocalTimeToUTC } from "@/lib/timezone-utils"
import { addDays, addMonths, format, parseISO } from "date-fns"
import { Wand2 } from "lucide-react"
import { askCerebras } from "@/lib/cerebras-service"

type Frequency = "daily" | "weekly" | "monthly"

interface ProgramConfigRow {
  key: "wakeup" | "bedtime" | "hydration" | "progresspicture" | "weight" | "body_measurement"
  label: string
  enabled: boolean
  startDate: string // yyyy-MM-dd
  frequency: Frequency
  time: string // HH:mm
  coachTip: string
  eventName: string
}

interface NewCustomerOnboardingModalProps {
  clientId: number
  clientName?: string
  isOpen: boolean
  onClose: () => void
  onCompleted: () => void
}

const PROGRAM_DEFAULTS: Array<Omit<ProgramConfigRow, "enabled" | "startDate" | "coachTip">> = [
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

export function NewCustomerOnboardingModal({ clientId, clientName = "Client", isOpen, onClose, onCompleted }: NewCustomerOnboardingModalProps) {
  const { toast } = useToast()
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), [])

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingKey, setGeneratingKey] = useState<ProgramConfigRow["key"] | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [promptPreview, setPromptPreview] = useState<string>("")
  const [showPrompt, setShowPrompt] = useState(false)

  const updateRow = (key: ProgramConfigRow["key"], updates: Partial<ProgramConfigRow>) => {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...updates } : r))
  }

  const handleSubmit = async () => {
    const selected = rows.filter(r => r.enabled)
    if (selected.length === 0) {
      toast({ title: "Select programs", description: "Enable at least one program to add.", variant: "destructive" })
      return
    }

    // Build entries across all selected rows
    const allEntries: any[] = []
    let minStartDate: string | null = null
    let maxEndDate: string | null = null

    for (const r of selected) {
      if (!r.startDate || !r.time || !r.eventName) {
        toast({ title: "Missing fields", description: `Please complete all fields for ${r.label}.`, variant: "destructive" })
        return
      }

      const dates = generateDatesForRange(r.startDate, r.frequency)
      if (dates.length === 0) continue

      if (!minStartDate || r.startDate < minStartDate) minStartDate = r.startDate
      const endStr = dates[dates.length - 1]
      if (!maxEndDate || endStr > maxEndDate) maxEndDate = endStr

      if (r.key === "body_measurement") {
        dates.forEach(for_date => {
          allEntries.push({
            client_id: clientId,
            task: "custom",
            summary: r.eventName,
            type: r.key,
            for_date,
            for_time: convertLocalTimeToUTC(r.time),
            icon: getIconNameForType(r.key),
            coach_tip: r.coachTip || r.label,
            details_json: {
              task_type: r.key,
              frequency: r.frequency,
              program_name: r.eventName,
              selected_measurements: ["hip", "waist", "bicep", "thigh"],
              original_local_time: r.time,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
            for_time: convertLocalTimeToUTC(r.time),
            icon: getIconNameForType(r.key),
            coach_tip: r.coachTip || r.label,
            details_json: {
              task_type: r.key,
              frequency: r.frequency,
              program_name: r.eventName,
              original_local_time: r.time,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          })
        })
      }
    }

    if (allEntries.length === 0 || !minStartDate || !maxEndDate) {
      toast({ title: "No entries to add", description: "Nothing to insert based on current selections.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      // Fetch existing entries to avoid duplicates
      const types = Array.from(new Set(selected.map(r => r.key)))
      const { data: existingData, error: existingError } = await supabase
        .from("schedule")
        .select("for_date,type")
        .eq("client_id", clientId)
        .gte("for_date", minStartDate)
        .lte("for_date", maxEndDate)
        .in("type", types)

      if (existingError) throw existingError

      const existingSet = new Set((existingData || []).map((e: any) => `${e.for_date}-${e.type}`))
      const newEntries = allEntries.filter(e => !existingSet.has(`${e.for_date}-${e.type}`))

      if (newEntries.length === 0) {
        toast({ title: "No new entries", description: "Selected dates already exist for these programs.", variant: "destructive" })
        return
      }

      const { error: insertError } = await supabase.from("schedule").insert(newEntries)
      if (insertError) throw insertError

      toast({ title: "Onboarding added", description: `Inserted ${newEntries.length} schedule items for ${clientName}.` })

      onCompleted()
      onClose()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to add onboarding programs.", variant: "destructive" })
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
Reminder Time (local): ${time}

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
  "reminder_time_local": "${r.time}"
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
    setPromptPreview(prompt)
    setShowPrompt(true)
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
          <DialogTitle className="text-xl font-bold">New Customer Onboarding</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure which standard programs to start for {clientName}. Enable the ones you want, set the start date, frequency, reminder time, coach tip, and event name. Submitting will add them to the schedule for the next 3 months.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateTipsForSelected}
              disabled={generatingAll}
            >
              {generatingAll ? 'Generating Tips…' : 'Generate Coach Tips for Selected (AI)'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowPrompt(v => !v)}>
              {showPrompt ? 'Hide Prompt' : 'View Prompt Being Sent'}
            </Button>
          </div>

          {showPrompt && (
            <div className="rounded-md border p-3 bg-gray-50 dark:bg-gray-900/30 max-h-64 overflow-auto text-xs whitespace-pre-wrap">
              {promptPreview || 'No prompt generated yet. Click "Generate Coach Tips for Selected (AI)" to see the prompt.'}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="p-2 border-b">Enable</th>
                  <th className="p-2 border-b text-left">Program</th>
                  <th className="p-2 border-b">Program Start Date</th>
                  <th className="p-2 border-b">Frequency</th>
                  <th className="p-2 border-b">Reminder Time</th>
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
                {rows.map(r => (
                  <tr key={r.key} className="align-top">
                    <td className="p-2 border-b">
                      <Checkbox checked={r.enabled} onCheckedChange={(v: any) => updateRow(r.key, { enabled: Boolean(v) })} />
                    </td>
                    <td className="p-2 border-b font-semibold whitespace-nowrap">{r.label}</td>
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
                      <Input type="time" value={r.time} onChange={e => updateRow(r.key, { time: e.target.value })} />
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Submit"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


