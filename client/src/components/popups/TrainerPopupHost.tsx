"use client"

import React from "react"
import { SidePopup } from "@/components/ui/side-popup"
import { trainerPopups, type PopupKey } from "@/components/popups/trainer-popups.config"

interface TrainerPopupHostProps {
  openKey: PopupKey | null
  onClose: () => void
  context: any
}

export const TrainerPopupHost: React.FC<TrainerPopupHostProps> = ({ openKey, onClose, context }) => {
  if (!openKey) {
    return null
  }
  
  const cfg = trainerPopups[openKey]
  if (!cfg) {
    return null
  }

  return (
    <SidePopup isOpen={true} onClose={onClose} title={cfg.title} icon={cfg.icon}>
      {cfg.render(context)}
    </SidePopup>
  )
}


