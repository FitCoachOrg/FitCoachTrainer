/**
 * ClientStats Component
 * 
 * This component displays key client statistics including:
 * - Workouts completed in the last 30 days
 * - Goals achieved
 * - Engagement score
 * - Days active
 * 
 * The component fetches data from the database and displays it in an attractive card layout.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Activity, Target, TrendingUp, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "../ui/LoadingSpinner"

interface ClientStatsProps {
  clientId?: number
  isActive?: boolean
}

export const ClientStats: React.FC<ClientStatsProps> = ({ clientId, isActive }) => {
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<any>(null)

  useEffect(() => {
    if (clientId && isActive) {
      setLoading(true);
      const fetchStats = async () => {
        try {
          // Workouts in last 30 days (existing)
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - 30);
          const sinceISOString = sinceDate.toISOString();

          const { count: workoutCount, error: workoutError } = await supabase
            .from("workout_info")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("created_at", sinceISOString);

          // Engagement Score
          // 1. Total schedule rows for this client
          const { count: totalSchedules, error: totalError } = await supabase
            .from("schedule")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId);

          // 2. Completed schedule rows for this client
          const { count: completedSchedules, error: completedError } = await supabase
            .from("schedule")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .eq("status", "completed");

          let engagementScore = 0;
          if (totalSchedules && totalSchedules > 0) {
            engagementScore = Math.round((completedSchedules || 0) / totalSchedules * 100);
          }

          setStatsData({
            totalSessions: workoutCount || 0,
            weeklyProgress: 85, // (keep or update as needed)
            monthlyGoals: 3,    // (keep or update as needed)
            engagementScore: engagementScore
          });
        } catch (err) {
          setStatsData({
            totalSessions: 0,
            weeklyProgress: 0,
            monthlyGoals: 0,
            engagementScore: 0
          });
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [clientId, isActive]);

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-900/90 border-0 shadow-xl p-6">
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: "Workouts Completed",
      value: statsData?.totalSessions?.toString() || "0",
      subtitle: "in Last 30 Days",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "from-emerald-500 to-green-600",
    },
    {
      label: "Goals Achieved",
      value: "3",
      icon: Target,
      color: "text-blue-600",
      bgColor: "from-blue-500 to-indigo-600",
    },
    {
      label: "Engagement Score",
      value: statsData?.engagementScore !== undefined ? `${statsData.engagementScore}%` : "0%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "from-purple-500 to-pink-600",
    },
    {
      label: "Days Active",
      value: "127",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "from-orange-500 to-red-600",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 dark:bg-gray-900/90 hover:scale-105"
          >
            {/* Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
            />

            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${stat.color} transition-colors duration-300`}>{stat.value}</p>
                    {stat.subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-2xl bg-gradient-to-br ${stat.bgColor} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-0 group-hover:h-[120px] w-full overflow-hidden transition-all duration-500 ease-out">
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  {/* <ResponsiveContainer width="100%" height="100%">
                    <Chart data={stat.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stat.color
                          .replace("text-", "#")
                          .replace("emerald-600", "059669")
                          .replace("blue-600", "2563eb")
                          .replace("purple-600", "9333ea")
                          .replace("orange-600", "ea580c")}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </Chart>
                  </ResponsiveContainer> */}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 