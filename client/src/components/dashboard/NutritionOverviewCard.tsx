import { Card } from "@/components/ui/card";
import React from "react";

interface Macro {
  label: string;
  consumed: number;
  goal: number;
  color: string;
  barColor: string;
}

interface NutritionOverviewCardProps {
  calories?: { consumed: number; goal: number };
  macros?: Macro[];
}

const defaultMacros: Macro[] = [
  {
    label: "Protein",
    consumed: 174,
    goal: 170,
    color: "#3ec6ff",
    barColor: "bg-[#3ec6ff]",
  },
  {
    label: "Carbs",
    consumed: 218,
    goal: 225,
    color: "#5ee6b0",
    barColor: "bg-[#5ee6b0]",
  },
  {
    label: "Fat",
    consumed: 78,
    goal: 74,
    color: "#ffe066",
    barColor: "bg-[#ffe066]",
  },
];

const NutritionOverviewCard: React.FC<NutritionOverviewCardProps> = ({
  calories = { consumed: 2270, goal: 2246 },
  macros = defaultMacros,
}) => {
  // For the circular progress
  const radius = 100;
  const stroke = 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percent = Math.min((calories.consumed / calories.goal) * 100, 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Colors for the circle (match screenshot: blue, green, yellow)
  const circleColors = ["#3ec6ff", "#5ee6b0", "#ffe066"];

  return (
    <Card className="bg-transparent border-0 shadow-none p-0">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 w-full px-2 py-6">
        {/* Left: Circular Progress */}
        <div className="flex flex-col items-center min-w-[120px]">
          <span className="uppercase text-xs tracking-widest text-gray-300 mb-2">Daily Nutrition Total</span>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
              {/* Background circle */}
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={stroke}
                cx={radius}
                cy={radius}
                r={normalizedRadius}
              />
              {/* Progress circle */}
              <circle
                stroke={
                  calories.consumed > calories.goal
                    ? "#ff6b6b"
                    : circleColors[0]
                }
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                style={{ transition: "stroke-dashoffset 0.5s" }}
                transform={`rotate(-90 ${radius} ${radius})`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {calories.consumed}
                <span className="text-gray-400 text-base"> / {calories.goal}</span>
              </span>
              <span className="text-xs text-gray-400">cal</span>
            </div>
          </div>
        </div>
        {/* Right: Macros */}
        <div className="flex-1 flex flex-col md:flex-row gap-8 w-full items-center md:items-end justify-center md:justify-start">
          {macros.map((macro, idx) => {
            const percent = Math.min((macro.consumed / macro.goal) * 100, 100);
            const over = macro.consumed > macro.goal;
            return (
              <div key={macro.label} className="flex flex-col items-center min-w-[160px]">
                <span className="text-lg font-semibold text-white">
                  {macro.consumed} <span className="text-gray-400">/ {macro.goal} g</span>
                </span>
                <div className="w-40 h-2 rounded-full bg-gray-200 mt-2 mb-1 relative overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${macro.barColor}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                  {over && (
                    <div className="absolute right-0 top-0 h-2 w-3 rounded-r-full bg-[#ff6b6b]"></div>
                  )}
                </div>
                <span className="text-sm text-gray-400">{macro.label}</span>
              </div>
            );
          })}
        </div>
        {/* Update Macro Goals link */}
        <div className="absolute right-8 top-6 hidden md:block">
          <button className="text-xs text-gray-300 hover:text-blue-500 transition-colors font-medium flex items-center gap-1">
            Update Macro Goals <span className="text-lg">&gt;</span>
          </button>
        </div>
      </div>
    </Card>
  );
};

export default NutritionOverviewCard;
