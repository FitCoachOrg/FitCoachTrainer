"use client"

import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  User,
  Clock,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Action {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  priority: "high" | "medium" | "low"
  detailData: {
    clients?: Array<{ name: string; progress?: number; status?: string }>
    messages?: Array<{ from: string; preview: string; timestamp?: string; unread?: boolean }>
    plans?: Array<{ client: string; type: string; status?: string }>
    scores?: Array<{ client: string; score: number; trend?: string }>
  }
}

interface RecommendedActionsCardProps {
  actions: Action[]
}

const RecommendedActionsCard: React.FC<RecommendedActionsCardProps> = ({ actions }) => {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())

  const toggleCardFlip = (actionId: number) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(actionId)) {
        newSet.delete(actionId)
      } else {
        newSet.add(actionId)
      }
      return newSet
    })
  }

  const getPriorityConfig = (priority: Action["priority"]) => {
    switch (priority) {
      case "high":
        return {
          badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
          cardBg:
            "bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-red-950/20 dark:via-rose-950/20 dark:to-pink-950/20",
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          border: "border-red-200/60 dark:border-red-800/60",
          accent: "bg-red-500",
        }
      case "medium":
        return {
          badge:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
          cardBg:
            "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/20 dark:via-yellow-950/20 dark:to-orange-950/20",
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          iconColor: "text-amber-600 dark:text-amber-400",
          border: "border-amber-200/60 dark:border-amber-800/60",
          accent: "bg-amber-500",
        }
      case "low":
        return {
          badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
          cardBg:
            "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20",
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          border: "border-blue-200/60 dark:border-blue-800/60",
          accent: "bg-blue-500",
        }
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "excellent":
      case "active":
      case "updated":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "needs attention":
      case "pending":
      case "due for review":
        return <AlertCircle className="h-3 w-3 text-amber-500" />
      default:
        return <Info className="h-3 w-3 text-gray-400" />
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "down":
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recommended Actions</h2>
          <p className="text-gray-600 dark:text-gray-400">Priority tasks to keep your coaching on track</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => {
          const priorityConfig = getPriorityConfig(action.priority)
          const isFlipped = flippedCards.has(action.id)

          return (
            <div key={action.id} className="group relative h-[320px]" style={{ perspective: "1000px" }}>
              <div
                className={cn(
                  "relative w-full h-full transition-transform duration-700 ease-in-out",
                  isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front Side */}
                <Card
                  className={cn(
                    "absolute inset-0 w-full h-full border-2 shadow-lg hover:shadow-xl transition-all duration-300",
                    priorityConfig.cardBg,
                    priorityConfig.border,
                    "[backface-visibility:hidden]",
                  )}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Priority Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1", priorityConfig.badge)}>
                        {action.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <div className={cn("w-3 h-3 rounded-full", priorityConfig.accent)} />
                    </div>

                    {/* Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl shadow-sm",
                          priorityConfig.iconBg,
                          priorityConfig.iconColor,
                        )}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{action.description}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3">
                      <Button
                        onClick={() => {
                          action.onAction()
                          toggleCardFlip(action.id)
                        }}
                        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {action.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardFlip(action.id)}
                        className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Back Side */}
                <Card
                  className={cn(
                    "absolute inset-0 w-full h-full border-2 shadow-lg",
                    "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
                    "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg",
                            priorityConfig.iconBg,
                            priorityConfig.iconColor,
                          )}
                        >
                          {action.icon}
                        </div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                          {action.title} Details
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardFlip(action.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {/* Clients */}
                      {action.detailData.clients?.map((client, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {client.progress && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                                {client.progress}%
                              </span>
                            )}
                            {client.status && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(client.status)}
                                <span className="text-xs text-gray-600 dark:text-gray-400">{client.status}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Messages */}
                      {action.detailData.messages?.map((message, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {message.from}
                              </span>
                              <div className="flex items-center gap-2">
                                {message.unread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                <span className="text-xs text-gray-500">{message.timestamp}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{message.preview}</p>
                          </div>
                        </div>
                      ))}

                      {/* Plans */}
                      {action.detailData.plans?.map((plan, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 block">
                                {plan.client}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">{plan.type}</span>
                            </div>
                          </div>
                          {plan.status && (
                            <div className="flex items-center gap-1">
                              {getStatusIcon(plan.status)}
                              <span className="text-xs text-gray-600 dark:text-gray-400">{plan.status}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Scores */}
                      {action.detailData.scores?.map((score, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{score.client}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(score.trend)}
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {score.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RecommendedActionsCard
