import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Zap } from "lucide-react";

interface FitnessPlanSummaryProps {
  overview?: string;
  split?: string;
  progressionModel?: string;
}

const SummaryCard: React.FC<{
  title: string;
  content?: string;
  icon: React.ReactNode;
}> = ({ title, content, icon }) => (
  <Card className="flex-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 p-3">
    <CardContent className="p-0 flex items-center gap-3">
      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
        {icon}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {title}
        </div>
        <div className="text-sm font-semibold text-gray-800 dark:text-white">
          {content || "N/A"}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const FitnessPlanSummary: React.FC<FitnessPlanSummaryProps> = ({
  overview,
  split,
  progressionModel,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 mt-6">
      <SummaryCard
        title="Plan Overview"
        content={overview}
        icon={<Target className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
      />
      <SummaryCard
        title="Weekly Split"
        content={split}
        icon={<Zap className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
      />
      <SummaryCard
        title="Progression Model"
        content={progressionModel}
        icon={<TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-300" />}
      />
    </div>
  );
}; 