"use client"

import { TrendingUp, UserPlus, Calendar, MessageCircle } from "lucide-react"
import RecommendedActionsCard from "./RecommendedActionsCard"

export default function Demo() {
  const recommendedActions = [
    {
      id: 1,
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Client Progress Updates",
      description: "3 clients have completed their weekly goals and are showing excellent progress",
      actionLabel: "View Progress",
      onAction: () => console.log("Navigate to progress"),
      priority: "high" as const,
      detailData: {
        clients: [
          { name: "Sarah Johnson", progress: 85, status: "Excellent" },
          { name: "Mike Chen", progress: 72, status: "Active" },
          { name: "Emma Wilson", progress: 91, status: "Excellent" },
        ],
      },
    },
    {
      id: 2,
      icon: <UserPlus className="h-6 w-6" />,
      title: "New Client Onboarding",
      description: "2 new clients need initial assessment and goal setting sessions",
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
    {
      id: 3,
      icon: <Calendar className="h-6 w-6" />,
      title: "Schedule Reviews",
      description: "4 clients are due for their monthly progress reviews",
      actionLabel: "Schedule Reviews",
      onAction: () => console.log("Navigate to scheduling"),
      priority: "low" as const,
      detailData: {
        plans: [
          { client: "Tom Wilson", type: "Fitness Plan", status: "Due for Review" },
          { client: "Emma Davis", type: "Nutrition Plan", status: "Updated" },
          { client: "Michael Brown", type: "Combined Plan", status: "Needs Update" },
          { client: "Anna Smith", type: "Wellness Plan", status: "Due for Review" },
        ],
      },
    },
    {
      id: 4,
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Unread Messages",
      description: "You have 5 unread messages from clients requiring attention",
      actionLabel: "View Messages",
      onAction: () => console.log("Navigate to messages"),
      priority: "high" as const,
      detailData: {
        messages: [
          {
            from: "Sarah Johnson",
            preview: "Hi coach, I have a question about my nutrition plan and meal timing",
            timestamp: "10:30 AM",
            unread: true,
          },
          {
            from: "Tom Wilson",
            preview: "Can we schedule a review session for next week?",
            timestamp: "9:45 AM",
            unread: true,
          },
          {
            from: "Emma Davis",
            preview: "Just completed my workout! Feeling great today",
            timestamp: "Yesterday",
            unread: false,
          },
          {
            from: "Mike Chen",
            preview: "Need help adjusting my workout schedule",
            timestamp: "2 hours ago",
            unread: true,
          },
        ],
      },
    },
  ]

  return (
    <div className="mb-8">
      <RecommendedActionsCard actions={recommendedActions} />
    </div>
  )
}
