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
  console.log('🔍 TrainerPopupHost - Component rendered')
  console.log('🔍 TrainerPopupHost - openKey:', openKey)
  console.log('🔍 TrainerPopupHost - context:', context)
  
  if (!openKey) {
    console.log('🔍 TrainerPopupHost - No openKey, returning null')
    return null
  }
  
  const cfg = trainerPopups[openKey]
  if (!cfg) {
    console.log('🔍 TrainerPopupHost - No config found for openKey:', openKey)
    return null
  }

  console.log('🔍 TrainerPopupHost - Rendering popup with config:', cfg)

  return (
    <SidePopup isOpen={true} onClose={onClose} title={cfg.title} icon={cfg.icon}>
      {cfg.render(context)}
    </SidePopup>
  )
}


