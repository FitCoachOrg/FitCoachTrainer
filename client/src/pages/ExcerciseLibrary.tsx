import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, RefreshCw, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

type ExerciseRaw = {
  id: number
  exercise_name: string
  video_link: string | null
  video_explanation: string | null
  expereince_level: string | null
  target_muscle: string | null
  primary_muscle: string | null
  equipment: string | null
  category: string | null
}

export default function ExerciseLibrary() {
  // Filters (multi-select arrays)
  const [nameFilter, setNameFilter] = useState("")
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [targetFilter, setTargetFilter] = useState<string[]>([])
  const [primaryFilter, setPrimaryFilter] = useState<string[]>([])
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])

  const [rows, setRows] = useState<ExerciseRaw[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dynamic options
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [experienceOptions, setExperienceOptions] = useState<string[]>([])
  const [targetOptions, setTargetOptions] = useState<string[]>([])
  const [primaryOptions, setPrimaryOptions] = useState<string[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])

  const pageSize = 50
  const [page, setPage] = useState(0)

  const uniq = (arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b))

  // Apply all filters helper
  const applyAllFilters = (q: any) => {
    if (nameFilter) q = q.ilike("exercise_name", `%${nameFilter}%`)
    if (experienceFilter.length) q = q.in("expereince_level", experienceFilter)
    if (targetFilter.length) q = q.in("target_muscle", targetFilter)
    if (primaryFilter.length) q = q.in("primary_muscle", primaryFilter)
    if (equipmentFilter.length) q = q.in("equipment", equipmentFilter)
    if (categoryFilter.length) q = q.in("category", categoryFilter)
    return q
  }

  const fetchExercises = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from("exercises_raw")
        .select("id, exercise_name, video_link, video_explanation, expereince_level, target_muscle, primary_muscle, equipment, category")
        .order("exercise_name", { ascending: true })
        .range(page * pageSize, page * pageSize + pageSize - 1)

      query = applyAllFilters(query)

      const { data, error } = await query
      if (error) throw error
      setRows((data || []) as ExerciseRaw[])
    } catch (err: any) {
      setError(err.message || "Failed to load exercises")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  // Dynamic options loader with spinner (single query, applies current filters)
  const optionsReqId = useRef(0)
  const fetchDynamicOptions = async () => {
    optionsReqId.current += 1
    const rid = optionsReqId.current
    setOptionsLoading(true)
    try {
      let q = supabase
        .from("exercises_raw")
        .select("expereince_level, target_muscle, primary_muscle, equipment, category")
        .limit(10000)
      q = applyAllFilters(q)
      const { data, error } = await q
      if (error) throw error
      if (rid !== optionsReqId.current) return
      const list = (data || []) as any[]
      setExperienceOptions(uniq(list.map(r => r.expereince_level)))
      setTargetOptions(uniq(list.map(r => r.target_muscle)))
      setPrimaryOptions(uniq(list.map(r => r.primary_muscle)))
      setEquipmentOptions(uniq(list.map(r => r.equipment)))
      setCategoryOptions(uniq(list.map(r => r.category)))
    } finally {
      if (rid === optionsReqId.current) setOptionsLoading(false)
    }
  }

  // Initial + reactive loads
  useEffect(() => {
    fetchDynamicOptions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchExercises()
      fetchDynamicOptions()
    }, 250)
    return () => clearTimeout(t)
  }, [nameFilter, experienceFilter, targetFilter, primaryFilter, equipmentFilter, categoryFilter, page])

  const clearFilters = () => {
    setNameFilter("")
    setExperienceFilter([])
    setTargetFilter([])
    setPrimaryFilter([])
    setEquipmentFilter([])
    setCategoryFilter([])
    setPage(0)
    fetchDynamicOptions()
  }

  const clearOne = (setter: (v: string[]) => void) => {
    setter([])
    setPage(0)
    fetchDynamicOptions()
  }

  const canPrev = page > 0
  const canNext = rows.length === pageSize

  const MultiSelect = ({ label, value, setValue, options }: { label: string, value: string[], setValue: (v: string[]) => void, options: string[] }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs text-gray-500">{label}</label>
        {value.length > 0 && (
          <button type="button" onClick={() => clearOne(setValue)} className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <select
        multiple
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(o => o.value)
          setPage(0)
          setValue(selected)
        }}
        className="w-full border p-2 rounded min-h-[120px]"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {value.length > 0 && (
        <div className="mt-1 text-[11px] text-gray-500">{value.length} selected</div>
      )}
    </div>
  )

  return (
    <div className="p-6 w-full max-w-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search exercise name"
            value={nameFilter}
            onChange={(e) => { setPage(0); setNameFilter(e.target.value) }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={clearFilters}>
          <RefreshCw className="h-4 w-4" /> Reset All
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Filters</div>
            {optionsLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" /> Updating filters…
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MultiSelect label="Experience Level" value={experienceFilter} setValue={setExperienceFilter} options={experienceOptions} />
            <MultiSelect label="Target Muscle" value={targetFilter} setValue={setTargetFilter} options={targetOptions} />
            <MultiSelect label="Primary Muscle" value={primaryFilter} setValue={setPrimaryFilter} options={primaryOptions} />
            <MultiSelect label="Equipment" value={equipmentFilter} setValue={setEquipmentFilter} options={equipmentOptions} />
            <MultiSelect label="Category" value={categoryFilter} setValue={setCategoryFilter} options={categoryOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Exercise Name</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-red-600">{error}</TableCell>
              </TableRow>
            )}
            {(!error && loading) && (
              <TableRow>
                <TableCell colSpan={7}>Loading…</TableCell>
              </TableRow>
            )}
            {(!error && !loading && rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={7}>No exercises found</TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.exercise_name}</TableCell>
                <TableCell>{r.video_link ? (
                  <a href={r.video_link} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a>
                ) : "-"}</TableCell>
                <TableCell>{r.expereince_level || "-"}</TableCell>
                <TableCell>{r.target_muscle || "-"}</TableCell>
                <TableCell>{r.primary_muscle || "-"}</TableCell>
                <TableCell>{r.equipment || "-"}</TableCell>
                <TableCell>{r.category || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
        <Button variant="ghost" size="sm" disabled={!canPrev || loading} onClick={() => setPage(p => Math.max(0, p - 1))}>{"<"}</Button>
        <span>Page {page + 1}</span>
        <Button variant="ghost" size="sm" disabled={!canNext || loading} onClick={() => setPage(p => p + 1)}>{">"}</Button>
      </div>
    </div>
  )
}
