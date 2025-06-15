"use client"

import { TrendingUpIcon } from "lucide-react"
import RecommendedActionsCard from "./RecommendedActionsCard"

export default function Demo() {
  const recommendedActions = [
    {
      id: 1,
      icon: <TrendingUpIcon className="h-4 w-4" />,
      title: "Client Progress Updates",
      description: "3 clients have completed their weekly goals",
      actionLabel: "View Progress",
      onAction: () => console.log("Navigate to progress"),
      priority: "high" as const,
      detailData: {
        clients: [
          { name: "Sarah Johnson", progress: 85 },
          { name: "Mike Chen", progress: 72 },
          { name: "Emma Wilson", progress: 91 },
        ],
      },
    },
    {
      id: 2,
      icon: <TrendingUpIcon className="h-4 w-4" />,
      title: "New Client Onboarding",
      description: "2 new clients need initial assessment",
      actionLabel: "Start Assessment",
      onAction: () => console.log("Navigate to assessment"),
      priority: "medium" as const,
      detailData: {
        clients: [
          { name: "David Brown", status: "Pending" },
          { name: "Lisa Wang", status: "Pending" },
        ],
      },
    },
  ]

  return (
    <div className="mb-6">
      <RecommendedActionsCard actions={recommendedActions} />
    </div>
  )
}
