"use client"

import type * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant: "info" | "success" | "warning" | "danger"
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, variant, subtitle, trend, className }) => {
  const getVariantStyles = (variant: StatCardProps["variant"]) => {
    switch (variant) {
      case "info":
        return {
          gradient: "from-blue-500 via-blue-600 to-indigo-600",
          bg: "from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-950/50 dark:via-blue-900/50 dark:to-indigo-950/50",
          border: "border-blue-200/50 dark:border-blue-800/50",
          iconBg: "bg-blue-500/10 dark:bg-blue-400/10",
          iconColor: "text-blue-600 dark:text-blue-400",
          valueColor: "text-blue-700 dark:text-blue-300",
          ring: "ring-blue-500/20",
          shadow: "shadow-blue-500/25",
        }
      case "success":
        return {
          gradient: "from-emerald-500 via-green-600 to-teal-600",
          bg: "from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-900/50 dark:to-teal-950/50",
          border: "border-emerald-200/50 dark:border-emerald-800/50",
          iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          valueColor: "text-emerald-700 dark:text-emerald-300",
          ring: "ring-emerald-500/20",
          shadow: "shadow-emerald-500/25",
        }
      case "warning":
        return {
          gradient: "from-amber-500 via-orange-500 to-red-500",
          bg: "from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/50 dark:via-orange-900/50 dark:to-red-950/50",
          border: "border-amber-200/50 dark:border-amber-800/50",
          iconBg: "bg-amber-500/10 dark:bg-amber-400/10",
          iconColor: "text-amber-600 dark:text-amber-400",
          valueColor: "text-amber-700 dark:text-amber-300",
          ring: "ring-amber-500/20",
          shadow: "shadow-amber-500/25",
        }
      case "danger":
        return {
          gradient: "from-red-500 via-rose-600 to-pink-600",
          bg: "from-red-50 via-rose-50 to-pink-50 dark:from-red-950/50 dark:via-rose-900/50 dark:to-pink-950/50",
          border: "border-red-200/50 dark:border-red-800/50",
          iconBg: "bg-red-500/10 dark:bg-red-400/10",
          iconColor: "text-red-600 dark:text-red-400",
          valueColor: "text-red-700 dark:text-red-300",
          ring: "ring-red-500/20",
          shadow: "shadow-red-500/25",
        }
    }
  }

  const styles = getVariantStyles(variant)

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl",
        "bg-gradient-to-br",
        styles.bg,
        "border-2",
        styles.border,
        "ring-1",
        styles.ring,
        "shadow-lg hover:" + styles.shadow,
        "backdrop-blur-sm",
        className,
      )}
    >
      {/* Decorative gradient overlay */}
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 opacity-10",
          "bg-gradient-to-br",
          styles.gradient,
          "rounded-full blur-2xl transform translate-x-16 -translate-y-16",
        )}
      />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-3 rounded-xl shadow-sm ring-1 ring-white/20", styles.iconBg, styles.iconColor)}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {title}
                </p>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className={cn("text-3xl font-bold tracking-tight", styles.valueColor)}>{value}</p>
                {trend && (
                  <div className="flex items-center gap-1 mt-2">
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trend.isPositive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs",
                          trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {trend.isPositive ? "↗" : "↘"}
                      </span>
                      {Math.abs(trend.value)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={cn("absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r", styles.gradient)} />
      </CardContent>
    </Card>
  )
}

export default StatCard
