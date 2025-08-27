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
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AddExerciseModal from "@/components/AddExerciseModal"
import { exerciseService, Exercise } from "@/lib/exercise-service"

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
  source?: 'default' | 'custom' // To distinguish between default and custom exercises
}

export default function ExerciseLibrary() {
  // Filters (multi-select arrays)
  const [nameFilter, setNameFilter] = useState("")
  const [experienceFilter, setExperienceFilter] = useState<string[]>([])
  const [targetFilter, setTargetFilter] = useState<string[]>([])
  const [primaryFilter, setPrimaryFilter] = useState<string[]>([])
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [sourceFilter, setSourceFilter] = useState<'all' | 'default' | 'custom'>('all')

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
  
  // Add exercise modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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

      // Use the exercise service to fetch all exercises
      const allExercises = await exerciseService.getAllExercises();

      // Apply filters using the service
      const filteredExercises = exerciseService.filterExercises(allExercises, {
        nameFilter,
        experienceFilter,
        targetFilter,
        primaryFilter,
        equipmentFilter,
        categoryFilter,
        sourceFilter
      });

      // Apply pagination using the service
      const paginatedExercises = exerciseService.paginateExercises(filteredExercises, page, pageSize);

      setRows(paginatedExercises as ExerciseRaw[]);
    } catch (err: any) {
      setError(err.message || "Failed to load exercises")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  // Dynamic options loader using the service
  const optionsReqId = useRef(0)
  const fetchDynamicOptions = async () => {
    optionsReqId.current += 1
    const rid = optionsReqId.current
    setOptionsLoading(true)
    try {
      // Use the exercise service to get options
      const options = await exerciseService.getExerciseOptions();

      if (rid !== optionsReqId.current) return;

      setExperienceOptions(options.experienceOptions)
      setTargetOptions(options.targetOptions)
      setPrimaryOptions(options.primaryOptions)
      setEquipmentOptions(options.equipmentOptions)
      setCategoryOptions(options.categoryOptions)
    } catch (error) {
      console.error("Error fetching dynamic options:", error);
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
  }, [nameFilter, experienceFilter, targetFilter, primaryFilter, equipmentFilter, categoryFilter, sourceFilter, page])

  const clearFilters = () => {
    setNameFilter("")
    setExperienceFilter([])
    setTargetFilter([])
    setPrimaryFilter([])
    setEquipmentFilter([])
    setCategoryFilter([])
    setSourceFilter('all')
    setPage(0)
    fetchDynamicOptions()
  }

  const clearOne = (setter: (v: string[]) => void) => {
    setter([])
    setPage(0)
    fetchDynamicOptions()
  }

  const canPrev = page > 0
  // Update pagination logic to work with client-side filtering
  const canNext = rows.length === pageSize && (page + 1) * pageSize < 1000 // Reasonable limit for client-side pagination

  const MultiSelect = ({ label, value, setValue, options }: { label: string, value: string[], setValue: (v: string[]) => void, options: string[] }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        {value.length > 0 && (
          <button type="button" onClick={() => clearOne(setValue)} className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors">
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
        className="w-full border border-input bg-background text-foreground p-3 rounded-md min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {value.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">{value.length} selected</div>
      )}
    </div>
  )

  return (
    <div className="p-6 w-full max-w-none">
      {/* Header with consistent screen title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Exercise Library</h1>
        <p className="text-muted-foreground">Browse and filter exercises to build workout plans</p>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Exercise
        </Button>
      </div>

      {/* Source Filter Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm font-medium text-foreground">Show:</div>
        <div className="flex items-center gap-2">
          <Button
            variant={sourceFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setPage(0); setSourceFilter('all') }}
          >
            All Exercises
          </Button>
          <Button
            variant={sourceFilter === 'default' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setPage(0); setSourceFilter('default') }}
          >
            Standard Only
          </Button>
          <Button
            variant={sourceFilter === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setPage(0); setSourceFilter('custom') }}
          >
            Custom Only
          </Button>
        </div>
        {sourceFilter !== 'all' && (
          <div className="text-xs text-muted-foreground">
            Showing {sourceFilter === 'default' ? 'standard' : 'custom'} exercises only
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-foreground">Filters</div>
            {optionsLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
      <div className="border border-border rounded-lg overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Exercise Name</TableHead>
              <TableHead className="font-semibold">Video</TableHead>
              <TableHead className="font-semibold">Experience</TableHead>
              <TableHead className="font-semibold">Target</TableHead>
              <TableHead className="font-semibold">Primary</TableHead>
              <TableHead className="font-semibold">Equipment</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg">⚠️</div>
                    <div className="font-medium">Error loading exercises</div>
                    <div className="text-sm text-muted-foreground">{error}</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {(!error && loading) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading exercises...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {(!error && !loading && rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg">🔍</div>
                    <div className="font-medium">No exercises found</div>
                    <div className="text-sm text-muted-foreground">Try adjusting your filters or search terms</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.source}-${r.id}`} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {r.exercise_name}
                    {r.source === 'custom' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Custom
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{r.video_link ? (
                  <a href={r.video_link} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 underline transition-colors">Link</a>
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
      <div className="flex items-center justify-center gap-4 mt-6">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!canPrev || loading} 
          onClick={() => setPage(p => Math.max(0, p - 1))}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm font-medium text-foreground">Page {page + 1}</span>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={!canNext || loading} 
          onClick={() => setPage(p => p + 1)}
          className="gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh the exercise list after adding a new exercise
          fetchExercises();
          fetchDynamicOptions();
        }}
      />
    </div>
  )
}
