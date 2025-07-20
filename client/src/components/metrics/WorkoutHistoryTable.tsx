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
  timeRange?: "7D" | "30D" | "90D"
}

export const WorkoutHistoryTable: React.FC<WorkoutHistoryTableProps> = ({
  activityData,
  loadingActivity,
  activityError,
  workoutCount,
  timeRange = "30D"
}) => {
  // Helper function to format time spent
  const formatTimeSpent = (totalMinutes: number) => {
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${totalMinutes}m`;
  };

  // Calculate total time spent
  const totalTimeSpent = activityData.reduce((total, workout) => {
    const duration = workout.duration ? Number(workout.duration) : 0;
    return total + duration;
  }, 0);
  return (
    <>
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
            <div className="space-y-6">
              {/* Workout History Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Workouts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activityData.length}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Time Spent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatTimeSpent(totalTimeSpent)}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Exercise Frequency Chart */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exercise Frequency</h3>
                    <div className="space-y-3">
                      {(() => {
                        // Calculate exercise frequency
                        const exerciseFrequency = activityData.reduce((acc, workout) => {
                          const exerciseName = workout.exercise_name || 'Unknown';
                          if (!acc[exerciseName]) {
                            acc[exerciseName] = 0;
                          }
                          acc[exerciseName]++;
                          return acc;
                        }, {});
                        
                        // Sort by frequency (highest first)
                        const sortedExercises = Object.entries(exerciseFrequency)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 5); // Show top 5 exercises
                        
                        return (
                          <>
                            {sortedExercises.map(([exercise, count]) => {
                              const percentage = Math.round(((count as number) / activityData.length) * 100);
                              const barWidth = Math.max(10, percentage); // Minimum 10% width for visibility
                              
                              // Calculate stats for this specific exercise
                              const exerciseWorkouts = activityData.filter(w => w.exercise_name === exercise);
                              const avgDuration = exerciseWorkouts.filter(w => w.duration).length > 0 
                                ? (exerciseWorkouts.filter(w => w.duration).reduce((sum, w) => sum + Number(w.duration), 0) / exerciseWorkouts.filter(w => w.duration).length).toFixed(1)
                                : 'N/A';
                              const avgSets = exerciseWorkouts.filter(w => w.sets).length > 0 
                                ? (exerciseWorkouts.filter(w => w.sets).reduce((sum, w) => sum + Number(w.sets), 0) / exerciseWorkouts.filter(w => w.sets).length).toFixed(1)
                                : 'N/A';
                              const avgReps = exerciseWorkouts.filter(w => w.reps).length > 0 
                                ? (exerciseWorkouts.filter(w => w.reps).reduce((sum, w) => sum + Number(w.reps), 0) / exerciseWorkouts.filter(w => w.reps).length).toFixed(1)
                                : 'N/A';
                              const avgWeight = exerciseWorkouts.filter(w => w.weight).length > 0 
                                ? (exerciseWorkouts.filter(w => w.weight).reduce((sum, w) => sum + Number(w.weight), 0) / exerciseWorkouts.filter(w => w.weight).length).toFixed(1)
                                : 'N/A';
                              const maxWeight = exerciseWorkouts.filter(w => w.weight).length > 0 
                                ? Math.max(...exerciseWorkouts.filter(w => w.weight).map(w => Number(w.weight)))
                                : 'N/A';
                              const maxReps = exerciseWorkouts.filter(w => w.reps).length > 0 
                                ? Math.max(...exerciseWorkouts.filter(w => w.reps).map(w => Number(w.reps)))
                                : 'N/A';
                              const maxSets = exerciseWorkouts.filter(w => w.sets).length > 0 
                                ? Math.max(...exerciseWorkouts.filter(w => w.sets).map(w => Number(w.sets)))
                                : 'N/A';
                              
                              return (
                                <div key={exercise} className="space-y-2">
                                  {/* Main bar */}
                                  <div className="flex items-center gap-3">
                                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                      {exercise}
                                    </div>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                      <div 
                                        className="bg-gradient-to-r from-orange-500 to-red-500 h-4 rounded-full transition-all duration-300"
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">
                                      {count as number} ({percentage}%)
                                    </div>
                                  </div>
                                  
                                  {/* Individual exercise stats */}
                                  <div className="ml-36 space-y-1">
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                      <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                                        <span className="text-gray-500 dark:text-gray-400">Avg Dur:</span>
                                        <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{avgDuration}min</span>
                                      </div>
                                      <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                                        <span className="text-gray-500 dark:text-gray-400">Avg Sets:</span>
                                        <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{avgSets}</span>
                                      </div>
                                      <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                                        <span className="text-gray-500 dark:text-gray-400">Avg Reps:</span>
                                        <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{avgReps}</span>
                                      </div>
                                      <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                                        <span className="text-gray-500 dark:text-gray-400">Avg Weight:</span>
                                        <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">{avgWeight}kg</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 border border-blue-200 dark:border-blue-700">
                                        <span className="text-blue-600 dark:text-blue-400">Max Weight:</span>
                                        <span className="ml-1 font-medium text-blue-700 dark:text-blue-300">{maxWeight}kg</span>
                                      </div>
                                      <div className="bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 border border-green-200 dark:border-green-700">
                                        <span className="text-green-600 dark:text-green-400">Max Reps:</span>
                                        <span className="ml-1 font-medium text-green-700 dark:text-green-300">{maxReps}</span>
                                      </div>
                                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1 border border-purple-200 dark:border-purple-700">
                                        <span className="text-purple-600 dark:text-purple-400">Max Sets:</span>
                                        <span className="ml-1 font-medium text-purple-700 dark:text-purple-300">{maxSets}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Stats below Exercise Frequency Chart */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Exercise Frequency Stats</h4>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <span className="text-gray-600 dark:text-gray-400">Total Exercises:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                    {Object.keys(exerciseFrequency).length}
                                  </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <span className="text-gray-600 dark:text-gray-400">Most Frequent:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                    {sortedExercises[0]?.[0] || 'N/A'}
                                  </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <span className="text-gray-600 dark:text-gray-400">Top Exercise %:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                    {sortedExercises[0] ? Math.round(((sortedExercises[0][1] as number) / activityData.length) * 100) : 0}%
                                  </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <span className="text-gray-600 dark:text-gray-400">Avg Frequency:</span>
                                  <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                    {(activityData.length / Math.max(Object.keys(exerciseFrequency).length, 1)).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  

                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
} 