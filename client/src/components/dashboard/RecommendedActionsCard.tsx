"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BellIcon, CheckIcon } from "lucide-react"
import ChatPopup from "./ChatPopup"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Action {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  priority: 'high' | 'medium' | 'low'
  detailData: {
    clients?: Array<{ name: string; progress?: number; status?: string }>
    messages?: Array<{ from: string; preview: string }>
    plans?: Array<{ client: string; type: string }>
    scores?: Array<{ client: string; score: number }>
  }
}

interface RecommendedActionsCardProps {
  actions: Action[]
}

const RecommendedActionsCard: React.FC<RecommendedActionsCardProps> = ({ actions }) => {
  const [flippedCard, setFlippedCard] = useState<number | null>(null)

  const getPriorityColor = (priority: Action['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
  }

  return (
    <Card className="bg-white dark:bg-black shadow-sm">
      <CardHeader>
        <CardTitle>Recommended Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className={cn(
                "relative h-[200px] transition-all duration-500 transform-style-3d",
                flippedCard === action.id ? "rotate-y-180" : ""
              )}
              onMouseEnter={() => setFlippedCard(action.id)}
              onMouseLeave={() => setFlippedCard(null)}
            >
              {/* Front of card */}
              <div
                className={cn(
                  "absolute inset-0 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 backface-hidden",
                  flippedCard === action.id ? "hidden" : "block"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", getPriorityColor(action.priority))}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {action.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onAction()
                      }}
                    >
                      {action.actionLabel}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div
                className={cn(
                  "absolute inset-0 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 backface-hidden rotate-y-180",
                  flippedCard === action.id ? "block" : "hidden"
                )}
              >
                <div className="space-y-2">
                  {action.detailData.clients?.map((client, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>{client.name}</span>
                      {client.progress && (
                        <span className="text-gray-500">{client.progress}%</span>
                      )}
                      {client.status && (
                        <span className="text-gray-500">{client.status}</span>
                      )}
                    </div>
                  ))}
                  {action.detailData.messages?.map((message, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>{message.from}</span>
                      <span className="text-gray-500">{message.preview}</span>
                    </div>
                  ))}
                  {action.detailData.plans?.map((plan, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>{plan.client}</span>
                      <span className="text-gray-500">{plan.type}</span>
                    </div>
                  ))}
                  {action.detailData.scores?.map((score, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>{score.client}</span>
                      <span className="text-gray-500">{score.score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecommendedActionsCard
