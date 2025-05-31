import { useState } from "react";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatCard from "@/components/dashboard/StatCard";
import UpcomingWeekAppointments from "@/components/dashboard/PeriodTrackingCard";
import SleepAnalysisCard from "@/components/dashboard/SleepAnalysisCard";
import NutritionOverviewCard from "@/components/dashboard/NutritionOverviewCard";
import ClientManagementCard from "@/components/dashboard/ClientManagementCard";
import RecommendedActionsCard from "@/components/dashboard/RecommendedActionsCard";
import ClientDetailPanel from "@/components/dashboard/ClientDetailPanel";
import SlidingPanel from "@/components/layout/SlidingPanel";
import * as Icons from "@/lib/icons";
import { useLocation } from "wouter";
import AverageClientScoreCard from "@/components/dashboard/AverageClientScoreCard";

// Sample client data
const sampleClient = {
  id: 1,
  name: "Sarah Johnson",
  email: "sarah.j@example.com",
  phone: "(555) 123-4567",
  startDate: new Date(2023, 1, 15),
  status: 'active' as const,
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
      type: 'combined' as const,
      progress: 65,
    },
    {
      id: 102,
      name: "Core Strength Workout",
      type: 'fitness' as const,
      progress: 30,
    }
  ],
  notes: [
    {
      id: 201,
      content: "Initial consultation. Sarah is motivated and has realistic goals. We discussed a combined approach with fitness and nutrition plans. She mentioned some back pain issues we need to be careful with.",
      date: new Date(2023, 1, 15),
    },
    {
      id: 202,
      content: "First progress check-in. Lost 2kg in the first month. Energy levels improving. Adjusted workout intensity to accommodate schedule changes.",
      date: new Date(2023, 2, 15),
    }
  ]
};

const Dashboard: React.FC = () => {
  const [_, navigate] = useLocation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof sampleClient | null>(null);
  
  // Sample actions for the recommended actions card
  const recommendedActions = [
    {
      id: 1,
      icon: <Icons.UserIcon className="h-4 w-4" />,
      title: "4 clients need follow-up",
      description: "You have 4 clients who haven't checked in for over a week",
      actionLabel: "View Clients",
      onAction: () => navigate("/clients"),
      priority: 'high' as const,
    },
    {
      id: 2,
      icon: <Icons.MessageCircleIcon className="h-4 w-4" />,
      title: "New message from Sarah Johnson",
      description: "Sarah has a question about her nutrition plan",
      actionLabel: "View Message",
      onAction: () => {
        setSelectedClient(sampleClient);
        setIsPanelOpen(true);
      },
      priority: 'medium' as const,
    },
    {
      id: 3,
      icon: <Icons.ClipboardIcon className="h-4 w-4" />,
      title: "Plan review needed",
      description: "Tom's fitness plan is due for a 30-day review",
      actionLabel: "Review Plan",
      onAction: () => navigate("/plans"),
      priority: 'medium' as const,
    },
  ];

  return (
    <div>
      <WelcomeCard />
      
      {/* Recommended Actions */}
      <div className="mb-6">
        <RecommendedActionsCard actions={recommendedActions} />
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard 
          title="Daily Check-ins" 
          value="15" 
          icon={<Icons.CheckIcon className="h-5 w-5 text-green-500 dark:text-green-400" />}
          variant="success"
        />
      </div>
      
      {/* Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UpcomingWeekAppointments />
        </div>
        <AverageClientScoreCard />
      </div>
      
      {/* Nutrition Overview */}
      <div className="mb-6">
        <NutritionOverviewCard />
      </div>
      
      {/* Sliding Panel for Client Details */}
      <SlidingPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title="Client Details"
        size="lg"
      >
        <ClientDetailPanel client={selectedClient} />
      </SlidingPanel>
    </div>
  );
};

export default Dashboard;
