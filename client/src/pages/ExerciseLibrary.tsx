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
import VideoModal from "@/components/VideoModal"
import VideoThumbnail from "@/components/VideoThumbnail"
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
  
  // Video modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; name: string } | null>(null)

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

  // Video modal handlers
  const openVideoModal = (videoUrl: string, exerciseName: string) => {
    setSelectedVideo({ url: videoUrl, name: exerciseName })
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setSelectedVideo(null)
  }

  const canPrev = page > 0
  // Update pagination logic to work with client-side filtering
  const canNext = rows.length === pageSize && (page + 1) * pageSize < 1000 // Reasonable limit for client-side pagination

  const MultiSelect = ({ label, value, setValue, options }: { label: string, value: string[], setValue: (v: string[]) => void, options: string[] }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
        {value.length > 0 && (
          <button 
            type="button" 
            onClick={() => clearOne(setValue)} 
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors font-medium"
          >
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
        className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-3 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-sm"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="py-1">{opt}</option>
        ))}
      </select>
      {value.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-full">
            {value.length} selected
          </div>
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map(item => (
              <span key={item} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                {item}
              </span>
            ))}
            {value.length > 2 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">
                +{value.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Exercise Library
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Discover and manage exercises to create powerful workout plans
              </p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5" /> Add Exercise
            </Button>
          </div>
        </div>

        {/* Search and Quick Actions */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search exercises by name..."
                  value={nameFilter}
                  onChange={(e) => { setPage(0); setNameFilter(e.target.value) }}
                  className="pl-12 h-12 text-lg border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700"
                />
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700" 
                  onClick={clearFilters}
                >
                  <RefreshCw className="h-4 w-4" /> Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Filter Toggle */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Exercise Type:</div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={sourceFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setPage(0); setSourceFilter('all') }}
                  className={`${
                    sourceFilter === 'all' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' 
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  } transition-all duration-200`}
                >
                  All Exercises
                </Button>
                <Button
                  variant={sourceFilter === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setPage(0); setSourceFilter('default') }}
                  className={`${
                    sourceFilter === 'default' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0' 
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  } transition-all duration-200`}
                >
                  Standard Only
                </Button>
                <Button
                  variant={sourceFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setPage(0); setSourceFilter('custom') }}
                  className={`${
                    sourceFilter === 'custom' 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-0' 
                      : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                  } transition-all duration-200`}
                >
                  Custom Only
                </Button>
              </div>
              {sourceFilter !== 'all' && (
                <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                  Showing {sourceFilter === 'default' ? 'standard' : 'custom'} exercises only
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Advanced Filters</h3>
              </div>
              {optionsLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Updating filters…
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <MultiSelect label="Experience Level" value={experienceFilter} setValue={setExperienceFilter} options={experienceOptions} />
              <MultiSelect label="Target Muscle" value={targetFilter} setValue={setTargetFilter} options={targetOptions} />
              <MultiSelect label="Primary Muscle" value={primaryFilter} setValue={setPrimaryFilter} options={primaryOptions} />
              <MultiSelect label="Equipment" value={equipmentFilter} setValue={setEquipmentFilter} options={equipmentOptions} />
              <MultiSelect label="Category" value={categoryFilter} setValue={setCategoryFilter} options={categoryOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {!loading && !error && (
              <span>
                Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{rows.length}</span> exercises
                {sourceFilter !== 'all' && (
                  <span> ({sourceFilter === 'default' ? 'standard' : 'custom'} only)</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Exercise Table */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 border-0">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Exercise Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Video Preview</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Experience</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Target</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Primary</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Equipment</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-200 py-4">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">Error loading exercises</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center">{error}</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {(!error && loading) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                    <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">Loading exercises...</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Please wait while we fetch your exercise library</div>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {(!error && !loading && rows.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">No exercises found</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center">
                      Try adjusting your filters, search terms, or add a new custom exercise
                    </div>
                    <Button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Exercise
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={`${r.source}-${r.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 border-b border-slate-100 dark:border-slate-700">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {r.exercise_name}
                      </div>
                      {r.source === 'custom' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                          Custom Exercise
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {r.video_link ? (
                    <VideoThumbnail
                      videoUrl={r.video_link}
                      exerciseName={r.exercise_name}
                      onClick={() => openVideoModal(r.video_link!, r.exercise_name)}
                    />
                  ) : (
                    <div className="w-20 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-slate-400 dark:text-slate-500">No video</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.expereince_level === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    r.expereince_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    r.expereince_level === 'Expert' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {r.expereince_level || "Not specified"}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-slate-700 dark:text-slate-300">{r.target_muscle || "—"}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-slate-700 dark:text-slate-300">{r.primary_muscle || "—"}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-slate-700 dark:text-slate-300">{r.equipment || "—"}</span>
                </TableCell>
                <TableCell className="py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.category === 'Strength' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                    r.category === 'Cardio' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    r.category === 'Flexibility' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    r.category === 'Core' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {r.category || "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
        </Card>

      {/* Pagination */}
      <Card className="mt-6 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {!loading && !error && rows.length > 0 && (
                <span>
                  Showing page <span className="font-semibold text-slate-800 dark:text-slate-200">{page + 1}</span>
                  {canNext && (
                    <span> of results</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!canPrev || loading} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="gap-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Page</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-md">
                  {page + 1}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!canNext || loading} 
                onClick={() => setPage(p => p + 1)}
                className="gap-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          open={isVideoModalOpen}
          onClose={closeVideoModal}
          videoUrl={selectedVideo.url}
          exerciseName={selectedVideo.name}
        />
      )}
    </div>
  </div>
  )
}
