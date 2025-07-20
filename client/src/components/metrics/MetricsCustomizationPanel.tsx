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
  draggingId,
  setDraggingId,
  onDragEnd,
  client
}) => {
  const selectedMetrics = METRIC_LIBRARY.filter((metric) =>
    selectedKeys.includes(metric.key)
  )
  const availableMetrics = METRIC_LIBRARY.filter((m) => !selectedKeys.includes(m.key))



  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    if (selectedKeys.length < 6 && value && !selectedKeys.includes(value)) {
      setSelectedKeys([...selectedKeys, value])
    }
  }

  function handleRemove(key: string) {
    setSelectedKeys(selectedKeys.filter((k: string) => k !== key))
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Metrics Dashboard for {client?.cl_name || client?.cl_prefer_name || 'Client'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedKeys.length}/6 metrics selected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-1 flex shadow-md">
                  <button
                    onClick={() => setTimeRange("7D")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      timeRange === "7D" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    7D
                  </button>
                  <button
                    onClick={() => setTimeRange("30D")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      timeRange === "30D" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    30D
                  </button>
                  <button
                    onClick={() => setTimeRange("90D")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      timeRange === "90D" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    90D
                  </button>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-1 flex shadow-md">
                  <button
                    onClick={() => setChartType("line")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                      chartType === "line" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Line
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                      chartType === "bar" 
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Bar
                  </button>
                </div>
                <select
                  id="metric-select"
                  className="border-2 border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  onChange={handleSelectChange}
                  value=""
                  disabled={selectedKeys.length >= 6}
                >
                  <option value="">+ Add Metric ({selectedKeys.length}/6)</option>
                  {availableMetrics.map((m: any) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
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
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 shadow-lg cursor-grab hover:shadow-xl transition-all duration-300 group"
                        tabIndex={0}
                        aria-label={`Drag to reorder ${metric.label}`}
                      >
                        <span
                          className="cursor-grab text-gray-400 group-hover:text-blue-500 transition-colors"
                          title="Drag to reorder"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 5h14a1 1 0 010 2H3a1 1 0 010-2z" />
                          </svg>
                        </span>
                        <metric.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.label}</span>
                        <button
                          onClick={() => handleRemove(metric.key)}
                          className="ml-2 text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/50"
                          aria-label={`Remove ${metric.label}`}
                        >
                          <X className="w-3 h-3" />
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