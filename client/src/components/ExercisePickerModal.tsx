import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ExerciseRaw = {
  id: number;
  exercise_name: string;
  video_link: string | null;
  video_explanation: string | null;
  expereince_level: string | null;
  target_muscle: string | null;
  primary_muscle: string | null;
  equipment: string | null;
  category: string | null;
};

export interface ExercisePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseRaw) => void;
}

// Modal that mirrors the Exercise Library filters, scoped for picking one exercise to add
export default function ExercisePickerModal({ open, onClose, onSelect }: ExercisePickerModalProps) {
  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [targetFilter, setTargetFilter] = useState<string[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // Data
  const [rows, setRows] = useState<ExerciseRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic options
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [experienceOptions, setExperienceOptions] = useState<string[]>([]);
  const [targetOptions, setTargetOptions] = useState<string[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const pageSize = 50;
  const [page, setPage] = useState(0);

  const uniq = (arr: (string | null | undefined)[]) =>
    Array.from(new Set(arr.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));

  const applyAllFilters = (q: any) => {
    if (nameFilter) q = q.ilike("exercise_name", `%${nameFilter}%`);
    if (experienceFilter.length) q = q.in("expereince_level", experienceFilter);
    if (targetFilter.length) q = q.in("target_muscle", targetFilter);
    if (equipmentFilter.length) q = q.in("equipment", equipmentFilter);
    if (categoryFilter.length) q = q.in("category", categoryFilter);
    return q;
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from("exercises_raw")
        .select(
          "id, exercise_name, video_link, video_explanation, expereince_level, target_muscle, primary_muscle, equipment, category"
        )
        .order("exercise_name", { ascending: true })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      query = applyAllFilters(query);
      const { data, error } = await query;
      if (error) throw error;
      setRows((data || []) as ExerciseRaw[]);
    } catch (err: any) {
      setError(err.message || "Failed to load exercises");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic options loader (single query, applies current filters)
  const optionsReqId = useRef(0);
  const fetchDynamicOptions = async () => {
    optionsReqId.current += 1;
    const rid = optionsReqId.current;
    setOptionsLoading(true);
    try {
      let q = supabase
        .from("exercises_raw")
        .select("expereince_level, target_muscle, equipment, category")
        .limit(3000);
      q = applyAllFilters(q);
      const { data, error } = await q;
      if (error) throw error;
      if (rid !== optionsReqId.current) return;
      const list = (data || []) as any[];
      setExperienceOptions(uniq(list.map((r) => r.expereince_level)));
      setTargetOptions(uniq(list.map((r) => r.target_muscle)));
      setEquipmentOptions(uniq(list.map((r) => r.equipment)));
      setCategoryOptions(uniq(list.map((r) => r.category)));
    } finally {
      // Always clear the loading flag to avoid a stuck spinner if a request is cancelled/replaced
      setOptionsLoading(false);
    }
  };

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setNameFilter("");
      setExperienceFilter([]);
      setTargetFilter([]);
      setEquipmentFilter([]);
      setCategoryFilter([]);
      setPage(0);
      fetchDynamicOptions();
      fetchExercises();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      fetchExercises();
      fetchDynamicOptions();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, experienceFilter, targetFilter, equipmentFilter, categoryFilter, page]);

  const clearFilters = () => {
    setNameFilter("");
    setExperienceFilter([]);
    setTargetFilter([]);
    setEquipmentFilter([]);
    setCategoryFilter([]);
    setPage(0);
    fetchDynamicOptions();
  };

  const clearOne = (setter: (v: string[]) => void) => {
    setter([]);
    setPage(0);
    fetchDynamicOptions();
  };

  const canPrev = page > 0;
  const canNext = rows.length === pageSize;

  const MultiSelect = ({
    label,
    value,
    setValue,
    options,
  }: {
    label: string;
    value: string[];
    setValue: (v: string[]) => void;
    options: string[];
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs text-gray-500 dark:text-gray-400">{label}</label>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => clearOne(setValue)}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <select
        multiple
        value={value}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
          setPage(0);
          setValue(selected);
        }}
        className="w-full border p-2 rounded min-h-[120px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {value.length > 0 && <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{value.length} selected</div>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-[90vw] md:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>Add an exercise to the selected day</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search (sticky) */}
          <div className="sticky top-0 z-10 bg-background pt-1 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search exercise name"
                  value={nameFilter}
                  onChange={(e) => {
                    setPage(0);
                    setNameFilter(e.target.value);
                  }}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" className="gap-2" onClick={clearFilters}>
                <RefreshCw className="h-4 w-4" /> Reset All
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">Filters</div>
                {optionsLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Updating filters…
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MultiSelect label="Experience Level" value={experienceFilter} setValue={setExperienceFilter} options={experienceOptions} />
                <MultiSelect label="Target Muscle" value={targetFilter} setValue={setTargetFilter} options={targetOptions} />
                <MultiSelect label="Equipment" value={equipmentFilter} setValue={setEquipmentFilter} options={equipmentOptions} />
                <MultiSelect label="Category" value={categoryFilter} setValue={setCategoryFilter} options={categoryOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto w-full bg-white dark:bg-gray-800">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700">
                  <TableHead className="text-gray-900 dark:text-gray-100">Exercise Name</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Experience</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Target</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Equipment</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Category</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-red-600 dark:text-red-400">
                      {error}
                    </TableCell>
                  </TableRow>
                )}
                {!error && loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-gray-700 dark:text-gray-300">Loading…</TableCell>
                  </TableRow>
                )}
                {!error && !loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-gray-700 dark:text-gray-300">No exercises found</TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{r.exercise_name}</TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{r.expereince_level || "-"}</TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{r.target_muscle || "-"}</TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{r.equipment || "-"}</TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{r.category || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => onSelect(r)}>Add</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <Button
              variant="ghost"
              size="sm"
              disabled={!canPrev || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              {"<"}
            </Button>
            <span>Page {page + 1}</span>
            <Button variant="ghost" size="sm" disabled={!canNext || loading} onClick={() => setPage((p) => p + 1)}>
              {">"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


