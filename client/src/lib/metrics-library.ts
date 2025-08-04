/**
 * Metrics Library for Client Profile Dashboard
 * 
 * This file contains the definition of all available metrics that can be displayed
 * in the client dashboard. Each metric includes configuration for:
 * - Data source (activity_info, external_device_connect, client_info, meal_info, workout_info, client_engagement_score tables)
 * - Chart type (line or bar)
 * - Visual styling (colors, icons)
 * - Data processing requirements
 * 
 * The metrics are used by the MetricsSection component to render interactive charts
 * and allow users to customize their dashboard view.
 */

import React from 'react'
import {
  Weight,
  Clock,
  Heart,
  Footprints,
  Droplet,
  Moon,
  Zap,
  Activity,
  TrendingUp,
  Calculator,
  AlertTriangle,
  Target,
  Utensils,
  Dumbbell,
} from "lucide-react"

// Type definitions for metrics
export interface MetricData {
  date: string
  qty: number | null
  fullDate?: string
  isFallback?: boolean
  is_dummy_data?: boolean
}

export interface Metric {
  key: string
  label: string
  icon: React.ElementType
  type: "line" | "bar"
  color: string
  data: MetricData[]
  dataKey: string
  yLabel: string
  activityName: string
  dataSource: "activity_info" | "external_device_connect" | "client_info" | "meal_info" | "workout_info" | "client_engagement_score"
  columnName?: string // Only for external_device_connect metrics
  tableName?: string // For specific table references
}

/**
 * METRIC_LIBRARY - Complete definition of all available metrics
 * 
 * Each metric is configured with:
 * - key: Unique identifier for the metric
 * - label: Human-readable name
 * - icon: Lucide React icon component
 * - type: Chart type (line or bar)
 * - color: Hex color for the chart
 * - dataKey: Property name for the value in data objects
 * - yLabel: Unit label (kg, bpm, steps, etc.)
 * - activityName: Name used in activity_info table
 * - dataSource: Which database table to query
 * - columnName: Specific column name for external_device_connect table
 * - tableName: Specific table name for other data sources
 */
export const METRIC_LIBRARY: Metric[] = [
  {
    key: "weight",
    label: "Weight",
    icon: Weight,
    type: "line",
    color: "#3b82f6",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "kg",
    activityName: "weight",
    dataSource: "activity_info"
  },
  {
    key: "sleep",
    label: "Sleep",
    icon: Clock,
    type: "bar",
    color: "#14b8a6",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "h",
    activityName: "Sleep Duration",
    dataSource: "activity_info"
  },
  {
    key: "heartRate",
    label: "Resting Heart Rate",
    icon: Heart,
    type: "line",
    color: "#e11d48",
    data: [], // Will be populated from external_device_connect table
    dataKey: "qty",
    yLabel: "bpm",
    activityName: "Heart Rate",
    dataSource: "external_device_connect",
    columnName: "heart_rate"
  },
  {
    key: "steps",
    label: "Steps",
    icon: Footprints,
    type: "bar",
    color: "#d97706",
    data: [], // Will be populated from external_device_connect table
    dataKey: "qty",
    yLabel: "steps",
    activityName: "Steps",
    dataSource: "external_device_connect",
    columnName: "steps"
  },
  {
    key: "waterIntake",
    label: "Water Intake",
    icon: Droplet,
    type: "bar",
    color: "#0ea5e9",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "cups",
    activityName: "hydration",
    dataSource: "activity_info"
  },
  {
    key: "sleepQuality",
    label: "Sleep Quality",
    icon: Moon,
    type: "line",
    color: "#8b5cf6",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "stars",
    activityName: "Sleep Quality",
    dataSource: "activity_info"
  },
  {
    key: "energyLevel",
    label: "Energy Level",
    icon: Zap,
    type: "line",
    color: "#f59e0b",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "stars",
    activityName: "Energy Level",
    dataSource: "activity_info"
  },
  {
    key: "caloriesSpent",
    label: "Calories Spent",
    icon: Activity,
    type: "bar",
    color: "#6366f1",
    data: [], // Will be populated from external_device_connect table
    dataKey: "qty",
    yLabel: "kcal",
    activityName: "Calories Spent",
    dataSource: "external_device_connect",
    columnName: "calories_spent"
  },
  {
    key: "exerciseTime",
    label: "Exercise Time",
    icon: Clock,
    type: "bar",
    color: "#10b981",
    data: [], // Will be populated from external_device_connect table
    dataKey: "qty",
    yLabel: "min",
    activityName: "Exercise Time",
    dataSource: "external_device_connect",
    columnName: "exercise_time"
  },
  {
    key: "workoutAdherence",
    label: "Workout Adherence",
    icon: Activity,
    type: "line",
    color: "#6366f1",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "%",
    activityName: "Workout Adherence",
    dataSource: "activity_info"
  },
  {
    key: "progress",
    label: "Progress Improvement",
    icon: TrendingUp,
    type: "line",
    color: "#9333ea",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "%",
    activityName: "Progress",
    dataSource: "activity_info"
  },
  // NEW KPIs ADDED
  {
    key: "bmi",
    label: "BMI",
    icon: Calculator,
    type: "line",
    color: "#059669",
    data: [], // Will be populated from activity_info table where activity = 'BMI'
    dataKey: "qty",
    yLabel: "kg/m²",
    activityName: "BMI",
    dataSource: "activity_info"
  },
  {
    key: "stress",
    label: "Stress Level",
    icon: AlertTriangle,
    type: "line",
    color: "#dc2626",
    data: [], // Will be populated from activity_info table where activity = 'stress'
    dataKey: "qty",
    yLabel: "level",
    activityName: "stress",
    dataSource: "activity_info"
  },
  {
    key: "engagementLevel",
    label: "Engagement Level",
    icon: Target,
    type: "line",
    color: "#7c3aed",
    data: [], // Will be populated from client_engagement_score table
    dataKey: "qty",
    yLabel: "%",
    activityName: "Engagement Level",
    dataSource: "client_engagement_score",
    tableName: "client_engagement_score",
    columnName: "eng_score"
  },
  {
    key: "calories",
    label: "Calories Consumed",
    icon: Utensils,
    type: "bar",
    color: "#f97316",
    data: [], // Will be populated from meal_info table
    dataKey: "qty",
    yLabel: "kcal",
    activityName: "Calories Consumed",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "calories"
  },
  {
    key: "workoutTime",
    label: "Workout Time",
    icon: Dumbbell,
    type: "bar",
    color: "#0891b2",
    data: [], // Will be populated from workout_info table
    dataKey: "qty",
    yLabel: "min",
    activityName: "Workout Time",
    dataSource: "workout_info",
    tableName: "workout_info",
    columnName: "duration"
  },
] 