/**
 * MetricChart Component
 * 
 * This component renders individual metric charts including:
 * - Line charts for continuous data (heart rate, weight, etc.)
 * - Bar charts for discrete data (steps, calories, etc.)
 * - Interactive tooltips with data source information
 * - Responsive design with proper styling
 * 
 * The component handles both real data and demo data with appropriate labeling.
 */

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { type Metric } from "@/lib/metrics-library"

interface MetricChartProps {
  metric: Metric
}

export const MetricChart: React.FC<MetricChartProps> = ({ metric }) => {
  return (
    <Card className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl transition-all duration-300 dark:bg-gray-900/90 cursor-grab">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3">
          <div className="p-3 rounded-xl shadow-lg" style={{ backgroundColor: `${metric.color}20` }}>
            <metric.icon className="h-6 w-6" style={{ color: metric.color }} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">
              {metric.label} <span className="text-sm text-gray-500 dark:text-gray-400">({metric.yLabel})</span>
              {metric.data.length > 0 && (metric.data[0].isFallback || metric.data[0].is_dummy_data) && (
                <span className="text-xs text-amber-500 dark:text-amber-400 ml-1">(Demo)</span>
              )}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {metric.type === "line" ? (
              <LineChart data={metric.data} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    // Check if payload and payload.isFallback exist
                    const isDummyData = props.payload && (props.payload.isFallback === true || props.payload.is_dummy_data === true);
                    const sourceText = isDummyData ? 'Demo Data' : 'Daily Average';
                    return [`${value} ${metric.yLabel}`, sourceText];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="qty"
                  stroke={metric.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, stroke: metric.color, fill: "white" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: metric.color }}
                />
              </LineChart>
            ) : (
              <BarChart data={metric.data} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    // Check if payload and payload.isFallback exist
                    const isDummyData = props.payload && (props.payload.isFallback === true || props.payload.is_dummy_data === true);
                    const sourceText = isDummyData ? 'Demo Data' : 'Daily Average';
                    return [`${value} ${metric.yLabel}`, sourceText];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="qty" fill={metric.color} radius={[8, 8, 0, 0]} barSize={12} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 