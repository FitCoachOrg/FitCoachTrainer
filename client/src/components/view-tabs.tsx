"use client"

import type { ViewMode } from "@/app/page"

interface ViewTabsProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

export function ViewTabs({ viewMode, setViewMode }: ViewTabsProps) {
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ]

  const getTabDescription = (mode: ViewMode) => {
    switch (mode) {
      case "day":
        return "Single Day"
      case "week":
        return "7 Days"
      case "month":
        return "Full Month"
      default:
        return ""
    }
  }

  return (
    <div className="flex border-b border-[#2B2B2B]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setViewMode(tab.key)}
          className={`px-6 py-3 text-lg font-medium transition-all duration-200 relative ${
            viewMode === tab.key ? "text-[#39FF14]" : "text-[#F0F0F0] hover:text-[#39FF14]"
          }`}
        >
          <div className="flex flex-col items-center">
            <span>{tab.label}</span>
            <span className="text-xs opacity-70">({getTabDescription(tab.key)})</span>
          </div>
          {viewMode === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#39FF14]" />}
        </button>
      ))}
    </div>
  )
}
