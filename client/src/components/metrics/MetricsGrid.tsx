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
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ selectedKeys, onDragEnd }) => {
  const selectedMetrics = METRIC_LIBRARY.filter((metric) =>
    selectedKeys.includes(metric.key)
  )

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={selectedMetrics.map((m: any) => m.key)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {selectedMetrics.map((metric: any) => (
            <MetricChart key={metric.key} metric={metric} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
} 