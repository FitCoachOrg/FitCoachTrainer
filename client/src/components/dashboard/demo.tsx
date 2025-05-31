"use client"

import RecommendedActionsCard from "./RecommendedActionsCard"
import { UserIcon, MessageCircleIcon, ClipboardIcon, TrendingUpIcon } from "lucide-react"

export default function Demo() {
  const recommendedActions = [
    {
      id: 1,
      icon: <UserIcon className="h-4 w-4" />,
      title: "4 clients need follow-up",
      description: "You have 4 clients who haven't checked in for over a week",
      actionLabel: "View Clients",
      onAction: () => console.log("Navigate to clients"),
      priority: "high" as const,
      detailData: {
        clients: ["Sarah Johnson", "Mike Chen", "Emma Wilson", "David Brown"],
        daysSince: [8, 10, 12, 9],
      },
    },
    {
      id: 2,
      icon: <MessageCircleIcon className="h-4 w-4" />,
      title: "3 new messages",
      description: "You have unread messages from clients",
      actionLabel: "View Messages",
      onAction: () => console.log("Open messages"),
      priority: "medium" as const,
      detailData: {
        messages: [
          { from: "Sarah Johnson", preview: "Question about my nutrition plan..." },
          { from: "Tom Rodriguez", preview: "Can we reschedule tomorrow's..." },
          { from: "Lisa Park", preview: "Thank you for the workout tips!" },
        ],
      },
    },
    {
      id: 3,
      icon: <ClipboardIcon className="h-4 w-4" />,
      title: "2 plans need review",
      description: "Fitness plans are due for 30-day review",
      actionLabel: "Review Plans",
      onAction: () => console.log("Navigate to plans"),
      priority: "medium" as const,
      detailData: {
        plans: [
          { client: "Tom Rodriguez", type: "Strength Training" },
          { client: "Anna Kim", type: "Weight Loss" },
        ],
      },
    },
    {
      id: 4,
      icon: <TrendingUpIcon className="h-4 w-4" />,
      title: "Nutrition Score Updates",
      description: "Weekly nutrition scores are available for review",
      actionLabel: "View Scores",
      onAction: () => console.log("Navigate to nutrition"),
      priority: "low" as const,
      detailData: {
        scores: [
          { client: "Sarah Johnson", score: 85 },
          { client: "Mike Chen", score: 72 },
          { client: "Emma Wilson", score: 91 },
          { client: "David Brown", score: 68 },
        ],
      },
    },
  ]

  return (
    <div className=" max-w-7xl mx-auto">
      <RecommendedActionsCard actions={recommendedActions} />
    </div>
  )
}
