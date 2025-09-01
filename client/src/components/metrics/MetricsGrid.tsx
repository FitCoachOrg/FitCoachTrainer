/**
 * MetricsGrid Component
 * 
 * This component displays the selected metrics in a responsive grid layout.
 * It includes:
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Drag-and-drop reordering functionality
 * - Individual metric charts
 * - Proper spacing and styling
 * 
 * The component integrates with the METRIC_LIBRARY and uses MetricChart
 * for rendering individual metric displays.
 */

import React from "react"
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { METRIC_LIBRARY } from "@/lib/metrics-library"
import { MetricChart } from "./MetricChart"

interface MetricsGridProps {
  selectedKeys: string[]
  onDragEnd: (event: DragEndEvent) => void
  chartType: "line" | "bar"
  viewMode?: "cards" | "table"
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  selectedKeys,
  onDragEnd,
  chartType,
  viewMode = "cards"
}) => {
  const selectedMetrics = METRIC_LIBRARY.filter((metric) =>
    selectedKeys.includes(metric.key)
  )

  if (viewMode === "table") {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-lg font-semibold text-white">Metrics Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedMetrics.map((metric: any, index) => (
                <tr key={metric.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: `${metric.color}20` }}>
                          <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{metric.label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {metric.description || 'No description available'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {metric.unit || metric.yLabel || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={selectedMetrics.map((m: any) => m.key)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {selectedMetrics.map((metric: any) => (
            <MetricChart key={metric.key} metric={metric} chartType={chartType} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
} 