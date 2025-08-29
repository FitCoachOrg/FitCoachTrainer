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
  Ruler,
  Divide,
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
  /** Optional category used for grouping and category-based selection in the UI */
  category?: string
  /** Optional multiple categories for a metric to belong to several groups */
  categories?: string[]
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
    dataSource: "activity_info",
    category: "Body Metrics",
    categories: ["Body Metrics", "Outcome/Results"]
  },
  // Body measurements (inches)
  {
    key: "hipCircumference",
    label: "Hips",
    icon: Ruler,
    type: "line",
    color: "#0ea5e9",
    data: [],
    dataKey: "qty",
    yLabel: "in",
    activityName: "hip",
    dataSource: "activity_info",
    category: "Body Metrics",
    categories: ["Body Metrics", "Outcome/Results"]
  },
  {
    key: "waistCircumference",
    label: "Waist",
    icon: Ruler,
    type: "line",
    color: "#22c55e",
    data: [],
    dataKey: "qty",
    yLabel: "in",
    activityName: "waist",
    dataSource: "activity_info",
    category: "Body Metrics",
    categories: ["Body Metrics"]
  },
  {
    key: "bicepCircumference",
    label: "Bicep",
    icon: Ruler,
    type: "line",
    color: "#f59e0b",
    data: [],
    dataKey: "qty",
    yLabel: "in",
    activityName: "bicep",
    dataSource: "activity_info",
    category: "Body Metrics",
    categories: ["Body Metrics", "Outcome/Results"]
  },
  {
    key: "thighCircumference",
    label: "Thigh",
    icon: Ruler,
    type: "line",
    color: "#ef4444",
    data: [],
    dataKey: "qty",
    yLabel: "in",
    activityName: "thigh",
    dataSource: "activity_info",
    category: "Body Metrics",
    categories: ["Body Metrics"]
  },
  {
    key: "hipsWaistRatio",
    label: "Hips/Waist Ratio",
    icon: Divide,
    type: "line",
    color: "#a855f7",
    data: [],
    dataKey: "qty",
    yLabel: "ratio",
    activityName: "hipsWaistRatio",
    dataSource: "activity_info",
    categories: ["Outcome/Results"]
  },
  {
    key: "sleep",
    label: "Sleep Hours",
    icon: Clock,
    type: "bar",
    color: "#14b8a6",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "h",
    activityName: "Sleep Duration",
    dataSource: "activity_info",
    categories: ["Sleep Quality Data"]
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
    yLabel: "mL",
    activityName: "hydration",
    dataSource: "activity_info",
    categories: ["Nutritional and Hydration"]
  },
  {
    key: "hydrationLogins",
    label: "Hydration Logins",
    icon: Droplet,
    type: "bar",
    color: "#22d3ee",
    data: [],
    dataKey: "qty",
    yLabel: "count",
    activityName: "hydration",
    dataSource: "activity_info",
    categories: ["Engagement"]
  },
  {
    key: "sleepQuality",
    label: "Sleep Quality (Average Stars)",
    icon: Moon,
    type: "line",
    color: "#8b5cf6",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "stars",
    activityName: "Sleep Quality",
    dataSource: "activity_info",
    categories: ["Sleep Quality Data"]
  },
  {
    key: "energyLevel",
    label: "Morning Energy",
    icon: Zap,
    type: "line",
    color: "#f59e0b",
    data: [], // Will be populated from activity_info table
    dataKey: "qty",
    yLabel: "stars",
    activityName: "Energy Level",
    dataSource: "activity_info",
    categories: ["Sleep Quality Data"]
  },
  {
    key: "mealLogins",
    label: "Meal Logins",
    icon: Utensils,
    type: "bar",
    color: "#34d399",
    data: [],
    dataKey: "qty",
    yLabel: "count",
    activityName: "Meal Logins",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "count",
    categories: ["Engagement"]
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
    key: "wakeupLogins",
    label: "Wakeup Logins",
    icon: Clock,
    type: "bar",
    color: "#fbbf24",
    data: [],
    dataKey: "qty",
    yLabel: "count",
    activityName: "wakeup",
    dataSource: "activity_info",
    categories: ["Engagement"]
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
    columnName: "eng_score",
    categories: ["Engagement"]
  },
  {
    key: "workoutLogins",
    label: "Workout Logins",
    icon: Activity,
    type: "bar",
    color: "#7dd3fc",
    data: [], // Computed count from workout_info
    dataKey: "qty",
    yLabel: "count",
    activityName: "Workout Logins",
    dataSource: "workout_info",
    tableName: "workout_info",
    columnName: "count",
    categories: ["Engagement"]
  },
  {
    key: "calories",
    label: "Calories Intake",
    icon: Utensils,
    type: "bar",
    color: "#f97316",
    data: [], // Will be populated from meal_info table
    dataKey: "qty",
    yLabel: "kcal",
    activityName: "Calories Consumed",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "calories",
    categories: ["Nutritional and Hydration"]
  },
  {
    key: "proteinIntake",
    label: "Protein Intake",
    icon: Utensils,
    type: "bar",
    color: "#16a34a",
    data: [], // From meal_info.protein
    dataKey: "qty",
    yLabel: "g",
    activityName: "Protein Intake",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "protein",
    categories: ["Nutritional and Hydration"]
  },
  {
    key: "fatIntake",
    label: "Fats Intake",
    icon: Utensils,
    type: "bar",
    color: "#a16207",
    data: [], // From meal_info.fat
    dataKey: "qty",
    yLabel: "g",
    activityName: "Fats Intake",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "fat",
    categories: ["Nutritional and Hydration"]
  },
  {
    key: "carbsIntake",
    label: "Carbs Intake",
    icon: Utensils,
    type: "bar",
    color: "#2563eb",
    data: [], // From meal_info.carbs
    dataKey: "qty",
    yLabel: "g",
    activityName: "Carbs Intake",
    dataSource: "meal_info",
    tableName: "meal_info",
    columnName: "carbs",
    categories: ["Nutritional and Hydration"]
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
    columnName: "duration",
    categories: ["Workouts"]
  },
  {
    key: "numExercises",
    label: "Number of Exercises",
    icon: Activity,
    type: "bar",
    color: "#06b6d4",
    data: [], // Will be computed from workout_info table as a count
    dataKey: "qty",
    yLabel: "count",
    activityName: "Number of Exercises",
    dataSource: "workout_info",
    tableName: "workout_info",
    columnName: "count",
    categories: ["Workouts"]
  },
] 