/**
 * MetricsCustomizationPanel Component
 * 
 * This component provides the drag-and-drop interface for customizing
 * which metrics are displayed and in what order. It includes:
 * - Time range selection (7D, 30D, 90D)
 * - Metric selection dropdown
 * - Drag-and-drop reordering of selected metrics
 * - Remove functionality for metrics
 * 
 * The component integrates with the METRIC_LIBRARY for available metrics
 * and manages the selected metrics state.
 */

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, BarChart3 } from "lucide-react"
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { arrayMove } from "@dnd-kit/sortable"
import { METRIC_LIBRARY } from "@/lib/metrics-library"

interface MetricsCustomizationPanelProps {
  selectedKeys: string[]
  setSelectedKeys: (keys: string[]) => void
  timeRange: "7D" | "30D" | "90D"
  setTimeRange: (range: "7D" | "30D" | "90D") => void
  chartType: "line" | "bar"
  setChartType: (type: "line" | "bar") => void
  viewMode?: "cards" | "table"
  setViewMode?: (mode: "cards" | "table") => void
  draggingId: string | null
  setDraggingId: (id: string | null) => void
  onDragEnd: (event: DragEndEvent) => void
  client?: any
}

export const MetricsCustomizationPanel: React.FC<MetricsCustomizationPanelProps> = ({
  selectedKeys,
  setSelectedKeys,
  timeRange,
  setTimeRange,
  chartType,
  setChartType,
  viewMode = "cards",
  setViewMode = () => {},
  draggingId,
  setDraggingId,
  onDragEnd,
  client
}) => {
  const selectedMetrics = METRIC_LIBRARY.filter((metric) =>
    selectedKeys.includes(metric.key)
  )
  // Exclude certain metrics from being shown in the dropdown
  const hiddenFromDropdown = new Set<string>(["progress"]) // Progress Improvement hidden from add list
  const availableMetrics = METRIC_LIBRARY.filter((m) => !selectedKeys.includes(m.key) && !hiddenFromDropdown.has(m.key))



  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (selectedKeys.length < 6 && value && !selectedKeys.includes(value)) {
      setSelectedKeys([...selectedKeys, value])
    }
  }

  function handleCategorySelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const category = e.target.value
    if (!category) return

    // Reset charts and load only metrics from the selected category (up to 6)
    const metricsInCategory = METRIC_LIBRARY
      .filter((m) => m.category === category || (Array.isArray(m.categories) && m.categories.includes(category)))
      .filter((m) => !hiddenFromDropdown.has(m.key))
      .slice(0, 6)
      .map((m) => m.key)

    setSelectedKeys(metricsInCategory)
  }

  function handleRemove(key: string) {
    setSelectedKeys(selectedKeys.filter((k: string) => k !== key))
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900/50 dark:via-blue-900/50 dark:to-indigo-900/50 border border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 shadow-xl border border-white/20">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                    Analytics Dashboard
                  </h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {client?.cl_name || client?.cl_prefer_name || 'Client'} • {selectedKeys.length}/6 Metrics Active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl p-1 flex shadow-lg border border-white/50">
                  <button
                    onClick={() => setTimeRange("7D")}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      timeRange === "7D"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("30D")}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      timeRange === "30D"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    30 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("90D")}
                    className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      timeRange === "90D"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    90 Days
                  </button>
                </div>
                                <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl p-1 flex shadow-lg border border-white/50">
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      chartType === "line"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      chartType === "bar"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Bar Chart
                  </button>
                </div>
                <div className="bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl p-1 flex shadow-lg border border-white/50">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      viewMode === "cards"
                        ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Cards View
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                      viewMode === "table"
                        ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg transform scale-105"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-600/70 hover:shadow-md"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Table View
                  </button>
                </div>
                <select
                  id="category-select"
                  className="border-2 border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-md hover:shadow-lg"
                  onChange={handleCategorySelectChange}
                  value=""
                  aria-label="Add all metrics by category"
                >
                  <option value="">✨ Add Category</option>
                  {Array.from(new Set(
                    METRIC_LIBRARY.flatMap((m) => {
                      const base = (m.category ? [m.category] : []) as string[]
                      const multi = (Array.isArray(m.categories) ? m.categories : []) as string[]
                      return [...base, ...multi]
                    }).filter(Boolean)
                  )).map((cat) => (
                    <option key={cat} value={cat}>📊 {cat}</option>
                  ))}
                </select>
                <select
                  id="metric-select"
                  className="border-2 border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 shadow-md hover:shadow-lg"
                  onChange={handleSelectChange}
                  value=""
                  disabled={selectedKeys.length >= 6}
                >
                  <option value="">+ Add Metric ({selectedKeys.length}/6)</option>
                  {availableMetrics.map((m: any) => (
                    <option key={m.key} value={m.key}>
                      <m.icon className="inline w-4 h-4 mr-2" />{m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                  onDragStart={(e) => setDraggingId(String(e.active.id))}
                >
                  <SortableContext
                    items={selectedMetrics.map((m: any) => m.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedMetrics.map((metric: any) => (
                      <div
                        key={metric.key}
                        className="flex items-center gap-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-5 py-3 shadow-lg cursor-grab hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                        tabIndex={0}
                        aria-label={`Drag to reorder ${metric.label}`}
                      >
                        <span
                          className="cursor-grab text-slate-400 group-hover:text-indigo-500 transition-colors"
                          title="Drag to reorder"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2z" />
                          </svg>
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50">
                            <metric.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{metric.label}</span>
                        </div>
                        <button
                          onClick={() => handleRemove(metric.key)}
                          className="ml-auto text-red-400 hover:text-red-600 transition-all p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50 hover:shadow-md"
                          aria-label={`Remove ${metric.label}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 