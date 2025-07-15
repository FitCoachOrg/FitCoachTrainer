/**
 * WorkoutHistoryTable Component
 * 
 * This component displays the complete workout history in a table format.
 * It includes:
 * - Loading state with spinner
 * - Error state with appropriate messaging
 * - Empty state when no data is available
 * - Responsive table with workout details
 * - Proper styling and hover effects
 * 
 * The component fetches workout data from the database and displays
 * comprehensive workout information including date, exercise, duration,
 * intensity, sets, reps, weight, feedback, rest, and distance.
 */

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Dumbbell } from "lucide-react"
import { LoadingSpinner } from "../ui/LoadingSpinner"

interface WorkoutHistoryTableProps {
  activityData: any[]
  loadingActivity: boolean
  activityError: string | null
  workoutCount: number
}

export const WorkoutHistoryTable: React.FC<WorkoutHistoryTableProps> = ({
  activityData,
  loadingActivity,
  activityError,
  workoutCount
}) => {
  return (
    <>
      {/* Enhanced Workout Info Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-900/90 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Dumbbell className="h-5 w-5 text-orange-500" />
            <span className="text-gray-900 dark:text-white">Workouts Completed (Last 30 Days):</span>
            <span className="ml-2 text-2xl font-bold text-orange-600 dark:text-orange-400">{workoutCount}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-900/90">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-gray-900 dark:text-white">Workout History</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal mt-1">
                Complete history of all workout sessions
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="text-center py-16">
              <LoadingSpinner />
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading workout history from database...</p>
            </div>
          ) : activityError ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-500 dark:text-red-400">{activityError}</p>
            </div>
          ) : activityData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">No workout history found</p>
              <p className="text-sm text-gray-400">Complete workouts to see your history here</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Exercise</th>
                    <th className="px-4 py-3 font-semibold">Duration (min)</th>
                    <th className="px-4 py-3 font-semibold">Intensity</th>
                    <th className="px-4 py-3 font-semibold">Sets</th>
                    <th className="px-4 py-3 font-semibold">Reps</th>
                    <th className="px-4 py-3 font-semibold">Weight</th>
                    <th className="px-4 py-3 font-semibold">Feedback</th>
                    <th className="px-4 py-3 font-semibold">Rest (sec)</th>
                    <th className="px-4 py-3 font-semibold">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {activityData.map((w, idx) => (
                    <tr
                      key={w.id}
                      className={
                        idx % 2 === 0
                          ? "bg-orange-50/40 dark:bg-orange-900/10"
                          : "bg-white dark:bg-gray-900"
                      }
                    >
                      <td className="px-4 py-3">{w.created_at ? new Date(w.created_at).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-3 font-semibold">{w.exercise_name}</td>
                      <td className="px-4 py-3">{w.duration ?? ""}</td>
                      <td className="px-4 py-3">{w.intensity ?? ""}</td>
                      <td className="px-4 py-3">{w.sets ?? ""}</td>
                      <td className="px-4 py-3">{w.reps ?? ""}</td>
                      <td className="px-4 py-3">{w.weight ?? ""}</td>
                      <td className="px-4 py-3">{w.feedback ?? ""}</td>
                      <td className="px-4 py-3">{w.rest ?? ""}</td>
                      <td className="px-4 py-3">{w.distance ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
} 