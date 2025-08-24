"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import StatCard from "@/components/dashboard/StatCard"
import RecommendedActionsCard from "@/components/dashboard/RecommendedActionsCard"
import ClientDetailPanel from "@/components/dashboard/ClientDetailPanel"
import SlidingPanel from "@/components/layout/SlidingPanel"
import { useNavigate } from "react-router-dom"
import Demo from "@/components/dashboard/demo"
import ProfessionalCalendar from "@/components/dashboard/ProfessionalCalendar"
import { Users, Clipboard, BarChart3, MessageCircle, TrendingUp, Activity, CheckCircle } from "lucide-react"

// Sample client data
const sampleClient = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarah.j@example.com",
  phone: "(555) 123-4567",
  startDate: new Date(2023, 1, 15),
  status: "active" as const,
  goals: ["Weight loss", "Muscle toning", "Improve posture"],
  metrics: {
    weight: 65,
    height: 165,
    bodyFat: 22,
    bmi: 23.9,
  },
  assignedPlans: [
    {
      id: 101,
      name: "Weight Loss Program",
      type: "combined" as const,
      progress: 65,
    },
    {
      id: 102,
      name: "Core Strength Workout",
      type: "fitness" as const,
      progress: 30,
    },
  ],
  notes: [
    {
      id: 201,
      content:
        "Initial consultation. Sarah is motivated and has realistic goals. We discussed a combined approach with fitness and nutrition plans. She mentioned some back pain issues we need to be careful with.",
      date: new Date(2023, 1, 15),
    },
    {
      id: 202,
      content:
        "First progress check-in. Lost 2kg in the first month. Energy levels improving. Adjusted workout intensity to accommodate schedule changes.",
      date: new Date(2023, 2, 15),
    },
  ],
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<typeof sampleClient | null>(null)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)

  // Handle hash fragment with access token
  useEffect(() => {
    const handleHashFragment = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setIsProcessingAuth(true)
        console.log('🔐 Processing authentication from hash fragment...')
        
        try {
          // Extract token from hash
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken) {
            // Set the session manually
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              console.error('Error setting session:', error)
              navigate('/login')
              return
            }
            
            console.log('✅ Authentication successful!')
            // Clear the hash fragment
            window.history.replaceState(null, '', '/dashboard')
          }
        } catch (error) {
          console.error('Error processing auth:', error)
          navigate('/login')
        } finally {
          setIsProcessingAuth(false)
        }
      }
    }
    
    handleHashFragment()
  }, [navigate])

  // Show loading state while processing authentication
  if (isProcessingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Processing authentication...</div>
        </div>
      </div>
    )
  }

  const recommendedActions = [
    {
      id: 1,
      icon: <Users className="h-5 w-5" />,
      title: "View Clients",
      description: "Manage your client base and track their progress",
      actionLabel: "View Clients",
      onAction: () => navigate("/clients"),
      priority: "high" as const,
      detailData: {
        clients: [
          { name: "John Smith", progress: 85, status: "Active" },
          { name: "Emma Davis", progress: 72, status: "Active" },
          { name: "Michael Brown", progress: 45, status: "Needs Attention" },
          { name: "Sarah Wilson", progress: 90, status: "Excellent" },
        ],
        onClientClick: () => navigate("/clients"),
      },
    },
    {
      id: 2,
      icon: <Clipboard className="h-5 w-5" />,
      title: "Review Plans",
      description: "Check and update client training plans",
      actionLabel: "Review Plans",
      onAction: () => navigate("/clients?plans=review"),
      priority: "high" as const,
      detailData: {
        plans: [
          { client: "Tom Wilson", type: "Fitness Plan", status: "Due for Review" },
          { client: "Emma Davis", type: "Nutrition Plan", status: "Updated" },
          { client: "Michael Brown", type: "Combined Plan", status: "Needs Update" },
        ],
        onClientClick: () => navigate("/clients?plans=review"),
      },
    },
    {
      id: 3,
      icon: <BarChart3 className="h-5 w-5" />,
      title: "View Scores",
      description: "Monitor client engagement and outcome scores",
      actionLabel: "View Scores",
      onAction: () => navigate("/clients?outcome=low"),
      priority: "medium" as const,
      detailData: {
        scores: [
          { client: "John Smith", score: 85, trend: "up" },
          { client: "Emma Davis", score: 72, trend: "stable" },
          { client: "Michael Brown", score: 45, trend: "down" },
        ],
        onClientClick: () => navigate("/clients?outcome=low"),
      },
    },
    {
      id: 4,
      icon: <MessageCircle className="h-5 w-5" />,
      title: "New Messages",
      description: "Recent messages from your clients",
      actionLabel: "View Messages",
      onAction: () => {
        setSelectedClient(sampleClient)
        setIsPanelOpen(true)
      },
      priority: "medium" as const,
      detailData: {
        messages: [
          {
            from: "Sarah Johnson",
            preview: "Hi coach, I have a question about my nutrition plan",
            timestamp: "10:30 AM",
            unread: true,
          },
          {
            from: "Tom Wilson",
            preview: "Can we schedule a review session?",
            timestamp: "9:45 AM",
            unread: true,
          },
          {
            from: "Emma Davis",
            preview: "Just completed my workout!",
            timestamp: "Yesterday",
            unread: false,
          },
        ],
      },
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto py-6">
        <div className="mb-8">
          <Demo />
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="group hover:scale-105 transition-all duration-300">
            <StatCard
              title="Engagement Score"
              value="70"
              icon={<Activity className="h-6 w-6 text-blue-500 dark:text-blue-400" />}
              variant="info"
            />
          </div>
          <div className="group hover:scale-105 transition-all duration-300">
            <StatCard
              title="Outcome Score"
              value="15"
              icon={<TrendingUp className="h-6 w-6 text-green-500 dark:text-green-400" />}
              variant="success"
            />
          </div>
          <div className="group hover:scale-105 transition-all duration-300">
            <StatCard
              title="Check In"
              value="7"
              icon={<CheckCircle className="h-6 w-6 text-orange-500 dark:text-orange-400" />}
              variant="warning"
            />
          </div>
        </div>

        <div className="mb-8">
          <ProfessionalCalendar />
        </div>

        {/* Enhanced Recommended Actions */}
        

        <SlidingPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} title="Client Details" size="lg">
         <ClientDetailPanel client={selectedClient} />
        </SlidingPanel> 
      </div>
    </div>
  )
}

export default Dashboard
