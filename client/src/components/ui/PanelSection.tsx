"use client"

import React from "react"

interface PanelSectionProps {
  children: React.ReactNode
}

// Shared scrollable container for side popups to ensure consistent UX
export const PanelSection: React.FC<PanelSectionProps> = ({ children }) => {
  return (
    <div className="space-y-6 pr-2 pb-24">
      {children}
    </div>
  )
}


