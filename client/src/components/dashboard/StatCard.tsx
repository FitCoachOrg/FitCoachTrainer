import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp } from "lucide-react"

type StatCardVariant = "default" | "success" | "warning" | "danger" | "info"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: StatCardVariant
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, variant = "default" }) => {
  const getVariantStyles = (): {
    bg: string
    text: string
    iconBg: string
    iconText: string
    gradientFrom: string
    gradientTo: string
  } => {
    switch (variant) {
      case "success":
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-600 dark:text-green-400",
          iconBg: "bg-green-500 dark:bg-green-600",
          iconText: "text-white",
          gradientFrom: "from-green-500/5",
          gradientTo: "to-green-600/10",
        }
      case "warning":
        return {
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-600 dark:text-amber-400",
          iconBg: "bg-amber-500 dark:bg-amber-600",
          iconText: "text-white",
          gradientFrom: "from-amber-500/5",
          gradientTo: "to-amber-600/10",
        }
      case "danger":
        return {
          bg: "bg-rose-100 dark:bg-rose-900/30",
          text: "text-rose-600 dark:text-rose-400",
          iconBg: "bg-rose-500 dark:bg-rose-600",
          iconText: "text-white",
          gradientFrom: "from-rose-500/5",
          gradientTo: "to-rose-600/10",
        }
      case "info":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600 dark:text-blue-400",
          iconBg: "bg-blue-500 dark:bg-blue-600",
          iconText: "text-white",
          gradientFrom: "from-blue-500/5",
          gradientTo: "to-blue-600/10",
        }
      default:
        return {
          bg: "bg-gray-100 dark:bg-slate-700/50",
          text: "text-gray-700 dark:text-gray-300",
          iconBg: "bg-gray-500 dark:bg-gray-600",
          iconText: "text-white",
          gradientFrom: "from-gray-500/5",
          gradientTo: "to-gray-600/10",
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <Card className="shadow-md h-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:shadow-lg group overflow-hidden">
      <CardContent className="p-0 h-full">
        <div className="relative h-full">
          {/* Background gradient */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              variantStyles.gradientFrom,
              variantStyles.gradientTo,
            )}
          />

          <div className="relative p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
              <div className={cn("w-10 h-10 flex items-center justify-center rounded-full", variantStyles.iconBg)}>
                <div className={variantStyles.iconText}>{icon}</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-baseline space-x-2">
                <p className={cn("text-4xl font-bold", variantStyles.text)}>{value}</p>
                <div className={cn("flex items-center text-xs font-medium", variantStyles.text)}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12%</span>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div
              className={cn(
                "absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-5 translate-x-16 translate-y-16",
                variantStyles.iconBg,
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard
