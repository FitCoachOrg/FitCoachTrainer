import { useState } from "react";
import StatCard from "@/components/dashboard/StatCard";
import UpcomingWeekAppointments from "@/components/dashboard/PeriodTrackingCard";
import SleepAnalysisCard from "@/components/dashboard/SleepAnalysisCard";
import NutritionOverviewCard from "@/components/dashboard/NutritionOverviewCard";
import ClientManagementCard from "@/components/dashboard/ClientManagementCard";
import RecommendedActionsCard from "@/components/dashboard/RecommendedActionsCard";
import ClientDetailPanel from "@/components/dashboard/ClientDetailPanel";
import SlidingPanel from "@/components/layout/SlidingPanel";
import * as Icons from "@/lib/icons";
import { useNavigate } from "react-router-dom";
import AverageClientScoreCard from "@/components/dashboard/AverageClientScoreCard";
import { SupabaseTest } from "@/components/SupabaseTest";
import Demo from "@/components/dashboard/demo";
import EnhancedCalendar from "@/components/dashboard/PeriodTrackingCard";

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
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const recommendedActions = [
    {
      id: 1,
      icon: <Icons.UsersIcon className="h-4 w-4" />,
      title: "View Clients",
      description: "Manage your client base and track their progress",
      actionLabel: "View Clients",
      onAction: () => navigate("/clients"),
      priority: 'high' as const,
      detailData: {
        clients: ["John Smith", "Emma Davis", "Michael Brown", "Sarah Wilson"],
        daysSince: [8, 9, 10, 12],
        onClientClick: () => navigate("/clients")
      }
    },
    {
      id: 2,
      icon: <Icons.ClipboardIcon className="h-4 w-4" />,
      title: "Review Plans",
      description: "Check and update client training plans",
      actionLabel: "Review Plans",
      onAction: () => navigate("/clients?plans=review"),
      priority: 'high' as const,
      detailData: {
        plans: [
          { client: "Tom Wilson", type: "Fitness Plan" },
          { client: "Emma Davis", type: "Nutrition Plan" },
          { client: "Michael Brown", type: "Combined Plan" }
        ],
        onClientClick: () => navigate("/clients?plans=review")
      }
    },
    {
      id: 3,
      icon: <Icons.ChartBarIcon className="h-4 w-4" />,
      title: "View Scores",
      description: "Monitor client engagement and outcome scores",
      actionLabel: "View Scores",
      onAction: () => navigate("/clients?outcome=low"),
      priority: 'high' as const,
      detailData: {
        scores: [
          { client: "John Smith", score: 45 },
          { client: "Emma Davis", score: 55 },
          { client: "Michael Brown", score: 40 }
        ],
        onClientClick: () => navigate("/clients?outcome=low")
      }
    },
    {
      id: 4,
      icon: <Icons.MessageCircleIcon className="h-4 w-4" />,
      title: "New message from Sarah Johnson",
      description: "Sarah has a question about her nutrition plan",
      actionLabel: "View Message",
      onAction: () => {
        setSelectedClient("Sarah Johnson");
        setIsPanelOpen(true);
      },
      priority: 'medium' as const,
      detailData: {
        messages: [
          { 
            from: "Sarah Johnson", 
            preview: "Hi coach, I have a question about my nutrition plan",
            lastMessage: "Hi coach, I have a question about my nutrition plan",
            timestamp: "10:30 AM"
          },
          { 
            from: "Tom Wilson", 
            preview: "Can we schedule a review session?",
            lastMessage: "Can we schedule a review session?",
            timestamp: "9:45 AM"
          },
          { 
            from: "Emma Davis", 
            preview: "Just completed my workout!",
            lastMessage: "Just completed my workout!",
            timestamp: "Yesterday"
          }
        ]
      }
    }
  ];

  return (
    <div className="px-2 md:px-4 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <Demo />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatCard 
          title="Engagement Score" 
          value="70" 
          icon={<Icons.FootprintsIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
          variant="info"
        />
        <StatCard 
          title="Outcome Score" 
          value="15" 
          icon={<Icons.CheckIcon className="h-5 w-5 text-green-500 dark:text-green-400" />}
          variant="success"
        />
        <StatCard 
          title="Check In" 
          value="7" 
          icon={<Icons.FlameIcon className="h-5 w-5 text-orange-500 dark:text-orange-400" />}
          variant="warning"
        />
      </div>

      <div className="mb-6">
        <EnhancedCalendar />
      </div>

      {/* <div className="mb-6">
        <NutritionOverviewCard />
      </div> */}

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
