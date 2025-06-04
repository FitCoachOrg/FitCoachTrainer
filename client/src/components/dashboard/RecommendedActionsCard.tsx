"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BellIcon, CheckIcon } from "lucide-react"
import ChatPopup from "./ChatPopup"

interface Action {
  id: number
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  priority: "high" | "medium" | "low"
  detailData: any
}

interface RecommendedActionsCardProps {
  actions: Action[]
}

const FlipCard: React.FC<{ action: Action }> = ({ action }) => {
  const [isFlipped, setIsFlipped] = React.useState(false)
  const [selectedClient, setSelectedClient] = React.useState<string | null>(null)

  const renderDetailContent = () => {
    switch (action.id) {
      case 1: // Clients needing follow-up
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">Clients to follow up:</h4>
            {action.detailData.clients.map((client: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  action.detailData?.onClientClick?.();
                }}
              >
                <span>{client}</span>
                <span className="text-gray-500">{action.detailData.daysSince[index]} days</span>
              </div>
            ))}
          </div>
        )
      case 2: // Messages
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">Recent messages:</h4>
            {action.detailData.messages.map((message: any, index: number) => (
              <div 
                key={index} 
                className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClient(message.from);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{message.from}</div>
                  <div className="text-gray-500 text-[10px]">{message.timestamp}</div>
                </div>
                <div className="text-gray-600 dark:text-gray-400 truncate mt-1">{message.preview}</div>
              </div>
            ))}
          </div>
        )
      case 3: // Plan reviews
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">Plans due for review:</h4>
            {action.detailData.plans.map((plan: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  action.detailData?.onClientClick?.();
                }}
              >
                <span>{plan.client}</span>
                <span className="text-gray-500">{plan.type}</span>
              </div>
            ))}
          </div>
        )
      case 4: // Nutrition scores
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">Client nutrition scores:</h4>
            {action.detailData.scores.map((score: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  action.detailData?.onClientClick?.();
                }}
              >
                <span>{score.client}</span>
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      score.score >= 80 ? "bg-green-500" : score.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span>{score.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )
      default:
        return <div>No details available</div>
    }
  }

  return (
    <>
      <div className="relative h-48 w-full perspective-1000">
        <div
          className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden">
            <div className="h-full flex flex-col p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
              <div className="flex items-start mb-3">
                <div
                  className={`mr-3 p-2 rounded-full flex-shrink-0 ${
                    action.priority === "high"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : action.priority === "medium"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{action.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{action.description}</p>
                </div>
              </div>
              <div className="mt-auto">
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (action.id === 2) {
                      setSelectedClient(action.detailData.messages[0].from)
                    } else {
                      action.onAction()
                    }
                  }}
                >
                  {action.actionLabel}
                </Button>
              </div>
              <div className="text-xs text-gray-400 mt-2 text-center">Click to view details</div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
            <div className="h-full flex flex-col p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900">
              <div className="flex-1 overflow-y-auto">{renderDetailContent()}</div>
              <div className="text-xs text-gray-400 mt-2 text-center">Click to go back</div>
            </div>
          </div>
        </div>
      </div>
      {selectedClient && (
        <ChatPopup
          clientName={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  )
}

const RecommendedActionsCard: React.FC<RecommendedActionsCardProps> = ({ actions }) => {
  const sortedActions = [...actions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedActions.map((action) => (
        <FlipCard key={action.id} action={action} />
      ))}
    </div>
  )
}

export default RecommendedActionsCard
