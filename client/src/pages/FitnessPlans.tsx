import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { addDays, format } from "date-fns"
import { WorkoutPlanTable } from "@/components/WorkoutPlanTable"
import { useClients } from "@/hooks/use-clients"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type WorkoutTemplateRow = {
  id: string
  trainer_id: number
  name: string
  tags: string[] | null
  created_at: string
  template_json: any
}

type WeekDay = { date: string; focus: string; exercises: any[] }

type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const weekdayOrder: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function toWeekdayKey(dateStr: string): WeekdayKey {
  const d = new Date(dateStr)
  // getDay(): 0=Sun ... 6=Sat
  const idx = d.getDay()
  return ['sun','mon','tue','wed','thu','fri','sat'][idx] as WeekdayKey
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day // move to Monday
  const res = new Date(d)
  res.setDate(d.getDate() + diff)
  res.setHours(0,0,0,0)
  return res
}

function mapTemplateToWeek(templateJson: any, selectedDate: Date): WeekDay[] {
  // Compute Monday of the selected week
  const weekStart = startOfWeekMonday(selectedDate)
  const byWeekday = templateJson?.days_by_weekday
  const hasByWeekday = byWeekday && typeof byWeekday === 'object'

  const result: WeekDay[] = []
  weekdayOrder.forEach((wk, idx) => {
    const dateStr = format(addDays(weekStart, idx), 'yyyy-MM-dd')
    const src = hasByWeekday ? byWeekday[wk] : (Array.isArray(templateJson?.days) ? templateJson.days[idx] : null)
    const focus = String(src?.focus ?? 'Workout')
    const srcExercises = Array.isArray(src?.exercises) ? src.exercises : []
    const exercises = srcExercises.map((ex: any) => ({
      exercise: String(ex.exercise ?? ''),
      category: String(ex.category ?? ''),
      body_part: String(ex.body_part ?? ''),
      sets: String(ex.sets ?? ''),
      reps: String(ex.reps ?? ''),
      duration: String(ex.duration ?? ''),
      weight: String(ex.weight ?? ''),
      equipment: String(ex.equipment ?? ''),
      coach_tip: String(ex.coach_tip ?? ''),
      rest: String(ex.rest ?? ''),
      video_link: String(ex.video_link ?? ''),
      date: dateStr,
    }))
    result.push({ date: dateStr, focus, exercises })
  })
  return result
}

function buildTemplateFromWeek(week: WeekDay[], tags: string[] = []) {
  // Build a days_by_weekday structure; dates are ignored in storage
  const days_by_weekday: Record<WeekdayKey, { focus: string; exercises: any[] }> = {
    mon: { focus: 'Workout', exercises: [] },
    tue: { focus: 'Workout', exercises: [] },
    wed: { focus: 'Workout', exercises: [] },
    thu: { focus: 'Workout', exercises: [] },
    fri: { focus: 'Workout', exercises: [] },
    sat: { focus: 'Workout', exercises: [] },
    sun: { focus: 'Workout', exercises: [] },
  }
  week.forEach(day => {
    const key = toWeekdayKey(day.date)
    days_by_weekday[key] = {
      focus: String(day.focus ?? 'Workout'),
      exercises: (day.exercises || []).map((ex: any) => ({
        exercise: String(ex.exercise ?? ''),
        category: String(ex.category ?? ''),
        body_part: String(ex.body_part ?? ''),
        sets: String(ex.sets ?? ''),
        reps: String(ex.reps ?? ''),
        duration: String(ex.duration ?? ''),
        weight: String(ex.weight ?? ''),
        equipment: String(ex.equipment ?? ''),
        coach_tip: String(ex.coach_tip ?? ''),
        rest: String(ex.rest ?? ''),
        video_link: String(ex.video_link ?? ''),
      }))
    }
  })
  return { tags, days_by_weekday }
}

const FitnessPlansPage = () => {
  const { toast } = useToast()

  // Templates state
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>([])
  const [filtered, setFiltered] = useState<WorkoutTemplateRow[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplateRow | null>(null)

  // Filters
  const [nameFilter, setNameFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('') // comma-separated

  // Editing fields for selected template
  const [editName, setEditName] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [week, setWeek] = useState<WeekDay[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Clients for applying a template to a specific week
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('workout_plan_templates')
        .select('id, trainer_id, name, tags, created_at, template_json')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error loading templates:', error)
        toast({ title: 'Load Failed', description: error.message, variant: 'destructive' })
      } else {
        setTemplates(data as WorkoutTemplateRow[])
        setFiltered(data as WorkoutTemplateRow[])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Apply filters
  useEffect(() => {
    const tags = tagFilter
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)
    const filteredList = templates.filter(t => {
      const nameOk = t.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
      const tagsOk = tags.length === 0 || (Array.isArray(t.tags) && tags.every(tag => t.tags!.map(x => x.toLowerCase()).includes(tag)))
      return nameOk && tagsOk
    })
    setFiltered(filteredList)
  }, [nameFilter, tagFilter, templates])

  // Helpers to summarize template JSON
  function getExerciseCount(templateJson: any): number {
    const byWeekday = templateJson?.days_by_weekday
    if (!byWeekday || typeof byWeekday !== 'object') return 0
    return Object.values(byWeekday).reduce((sum: number, day: any) => sum + (Array.isArray(day?.exercises) ? day.exercises.length : 0), 0)
  }
  function getFocusSummary(templateJson: any): string {
    const byWeekday = templateJson?.days_by_weekday
    if (!byWeekday || typeof byWeekday !== 'object') return '-'
    const focuses = Object.values(byWeekday)
      .map((d: any) => String(d?.focus || ''))
      .filter(Boolean)
    const unique = Array.from(new Set(focuses))
    return unique.length ? unique.join(' / ') : '-'
  }

  // When selecting a template, set edit fields and week mapping
  const handleSelectTemplate = (t: WorkoutTemplateRow) => {
    setSelectedTemplate(t)
    setEditName(t.name)
    setEditTags(Array.isArray(t.tags) ? t.tags : [])
    const mapped = mapTemplateToWeek(t.template_json, startDate)
    setWeek(mapped)
  }

  // Re-map week when start date changes
  useEffect(() => {
    if (selectedTemplate) {
      setWeek(mapTemplateToWeek(selectedTemplate.template_json, startDate))
    }
  }, [startDate])

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return
    try {
      setIsSaving(true)
      const sourceWeek = editorDraft.current && editorDraft.current.length === 7 ? editorDraft.current : week
      const newJson = buildTemplateFromWeek(sourceWeek, editTags)
      const { error } = await supabase
        .from('workout_plan_templates')
        .update({ name: editName.trim(), tags: editTags, template_json: newJson })
        .eq('id', selectedTemplate.id)
      if (error) throw error
      toast({ title: 'Template Saved', description: 'Template updated successfully.' })
      // reflect in memory list
      const updated = templates.map(t => t.id === selectedTemplate.id ? { ...t, name: editName.trim(), tags: editTags, template_json: newJson } : t)
      setTemplates(updated)
      // re-apply filters
      const tags = tagFilter
        .split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      const filteredList = updated.filter(t => {
        const nameOk = t.name.toLowerCase().includes(nameFilter.trim().toLowerCase())
        const tagsOk = tags.length === 0 || (Array.isArray(t.tags) && tags.every(tag => t.tags!.map(x => x.toLowerCase()).includes(tag)))
        return nameOk && tagsOk
      })
      setFiltered(filteredList)
      // update selectedTemplate ref
      setSelectedTemplate(prev => prev ? { ...prev, name: editName.trim(), tags: editTags, template_json: newJson } as WorkoutTemplateRow : prev)
    } catch (err: any) {
      console.error('Save template error:', err)
      toast({ title: 'Save Failed', description: err.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const applyTemplateToClientWeek = async () => {
    if (!selectedTemplate) {
      toast({ title: 'No Template Selected', description: 'Please select a template first.', variant: 'destructive' })
      return
    }
    if (!selectedClientId) {
      toast({ title: 'No Client Selected', description: 'Please select a client to apply the plan to.', variant: 'destructive' })
      return
    }
    try {
      setIsApplying(true)
      // For each day, upsert into schedule_preview
      for (const day of week) {
        const dateStr = day.date
        const { data: existing, error: fetchErr } = await supabase
          .from('schedule_preview')
          .select('id, summary, details_json')
          .eq('client_id', selectedClientId)
          .eq('for_date', dateStr)
          .eq('type', 'workout')
        if (fetchErr) throw fetchErr
        const summary = day.focus || 'Workout'
        const details_json = { exercises: day.exercises || [] }
        if (existing && existing.length > 0) {
          const rowId = existing[0].id
          const { error: updErr } = await supabase
            .from('schedule_preview')
            .update({ summary, details_json })
            .eq('id', rowId)
          if (updErr) throw updErr
        } else {
          const { error: insErr } = await supabase
            .from('schedule_preview')
            .insert({
              client_id: selectedClientId,
              type: 'workout',
              for_date: dateStr,
              summary,
              details_json,
            })
          if (insErr) throw insErr
        }
      }
      toast({ title: 'Applied', description: 'Template applied to the selected week for the client.' })
    } catch (err: any) {
      console.error('Apply template error:', err)
      toast({ title: 'Apply Failed', description: err.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setIsApplying(false)
    }
  }

  // Simple standalone template week editor (date-agnostic)
  const editorDraft = React.useRef<WeekDay[] | null>(null)

  const TemplateWeekEditor = ({ weekData, onDraftChange }: { weekData: WeekDay[]; onDraftChange: (next: WeekDay[]) => void }) => {
    const [draft, setDraft] = useState<WeekDay[]>(weekData)
    useEffect(() => { setDraft(weekData) }, [weekData])
    useEffect(() => { editorDraft.current = draft; onDraftChange(draft) }, [draft])

    const updateExercise = (dayIdx: number, exIdx: number, field: string, value: any) => {
      setDraft(prev => {
        const next = prev.map(d => ({ ...d, exercises: d.exercises.map((e: any) => ({ ...e })) }))
        const ex = { ...next[dayIdx].exercises[exIdx], [field]: value }
        next[dayIdx].exercises[exIdx] = ex
        return next
      })
    }
    const removeExercise = (dayIdx: number, exIdx: number) => {
      setDraft(prev => {
        const next = prev.map(d => ({ ...d, exercises: d.exercises.map((e: any) => ({ ...e })) }))
        next[dayIdx].exercises.splice(exIdx, 1)
        return next
      })
    }
    const addExercise = (dayIdx: number) => {
      setDraft(prev => {
        const next = prev.map(d => ({ ...d, exercises: d.exercises.map((e: any) => ({ ...e })) }))
        next[dayIdx].exercises.push({
          exercise: '', category: '', body_part: '', sets: '', reps: '', duration: '', weight: '', equipment: '', coach_tip: '', rest: '', video_link: '', date: prev[dayIdx].date
        })
        return next
      })
    }
    const updateFocus = (dayIdx: number, value: string) => {
      setDraft(prev => {
        const next = prev.map(d => ({ ...d }))
        next[dayIdx].focus = value
        return next
      })
    }
    return (
      <div className="space-y-3">
        {weekData.map((day, dayIdx) => (
          <Card key={dayIdx}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500">Day {dayIdx + 1}</div>
                  <Input value={draft[dayIdx].focus} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateFocus(dayIdx, e.target.value)} className="w-[260px]" />
                </div>
                <Button type="button" variant="outline" size="sm" onMouseDown={(e) => e.preventDefault()} onClick={() => addExercise(dayIdx)}>Add Exercise</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                    <th className="text-left p-2">Exercise</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Body Part</th>
                    <th className="text-left p-2">Sets</th>
                    <th className="text-left p-2">Reps</th>
                    <th className="text-left p-2">Rest</th>
                    <th className="text-left p-2">Weight</th>
                    <th className="text-left p-2">Duration</th>
                    <th className="text-left p-2">Equipment</th>
                    <th className="text-left p-2">Coach Tip</th>
                    <th className="text-left p-2">Video Link</th>
                    <th className="text-right p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {draft[dayIdx].exercises.map((ex: any, exIdx: number) => (
                    <tr key={exIdx} className="border-b">
                      <td className="p-2"><Input value={ex.exercise} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'exercise', e.target.value)} /></td>
                      <td className="p-2"><Input value={ex.category} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'category', e.target.value)} /></td>
                      <td className="p-2"><Input value={ex.body_part} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'body_part', e.target.value)} /></td>
                      <td className="p-2 w-20"><Input value={ex.sets} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'sets', e.target.value)} /></td>
                      <td className="p-2 w-20"><Input value={ex.reps} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'reps', e.target.value)} /></td>
                      <td className="p-2 w-24"><Input value={ex.rest} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'rest', e.target.value)} /></td>
                      <td className="p-2 w-24"><Input value={ex.weight} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'weight', e.target.value)} /></td>
                      <td className="p-2 w-24"><Input value={ex.duration} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'duration', e.target.value)} /></td>
                      <td className="p-2"><Input value={ex.equipment} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'equipment', e.target.value)} /></td>
                      <td className="p-2"><Input value={ex.coach_tip} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'coach_tip', e.target.value)} /></td>
                      <td className="p-2"><Input value={ex.video_link} onKeyDown={(e)=>e.stopPropagation()} onChange={e => updateExercise(dayIdx, exIdx, 'video_link', e.target.value)} /></td>
                      <td className="p-2 text-right"><button type="button" className="text-red-600" onMouseDown={(e)=>e.preventDefault()} onClick={() => removeExercise(dayIdx, exIdx)}>✕</button></td>
                    </tr>
                  ))}
                  {day.exercises.length === 0 && (
                    <tr><td className="p-3 text-muted-foreground" colSpan={12}>Rest Day</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top: Filters and Templates Grid */}
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Plan Library</h1>
          <p className="text-muted-foreground">Filter and select a saved plan template. Edit below and save updates.</p>
        </header>

        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Filter by Name</Label>
              <Input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="e.g., Strength" />
            </div>
            <div className="grid gap-2">
              <Label>Filter by Tags (comma separated)</Label>
              <Input value={tagFilter} onChange={e => setTagFilter(e.target.value)} placeholder="e.g., strength, beginner" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-muted-foreground">No templates match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Template Name</TableHead>
                      <TableHead className="w-[30%]">Tags</TableHead>
                      <TableHead className="w-[15%]"># Exercises</TableHead>
                      <TableHead className="w-[25%]">Focus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(t => (
                      <TableRow
                        key={t.id}
                        className={`cursor-pointer ${selectedTemplate?.id === t.id ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
                        onClick={() => handleSelectTemplate(t)}
                      >
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(t.tags || []).map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getExerciseCount(t.template_json)}</TableCell>
                        <TableCell className="truncate max-w-[360px]">{getFocusSummary(t.template_json)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: Selected Template Editor and Week Table */}
      <div className="mt-6 space-y-4">
        {selectedTemplate ? (
          <>
        <Card>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Template Name</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Tags (comma to add)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value && !editTags.includes(value)) setEditTags(prev => [...prev, value])
                          ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" className="text-xs" onMouseDown={(e)=>e.preventDefault()} onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}>✕</button>
                      </Badge>
                    ))}
                    {editTags.length === 0 && (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Apply To Client</Label>
              {clientsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading clients…</div>
                  ) : (
                    <Select value={selectedClientId?.toString() ?? ''} onValueChange={(v) => setSelectedClientId(Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
                  <div className="flex items-center gap-2 justify-end mt-2">
                    <Button type="button" variant="outline" onClick={handleSaveTemplate} disabled={isSaving}>
                      {isSaving ? 'Saving…' : 'Save Template'}
                  </Button>
                    <Button type="button" onClick={applyTemplateToClientWeek} disabled={isApplying || !selectedClientId}>
                      {isApplying ? 'Applying…' : 'Apply to Week'}
              </Button>
                  </div>
            </div>
          </CardContent>
        </Card>

            <TemplateWeekEditor weekData={week} onDraftChange={setWeek} />
          </>
        ) : (
          <Card className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Select a template above to view and edit its workouts.</div>
            </Card>
          )}
      </div>
    </div>
  )
}

export default FitnessPlansPage;