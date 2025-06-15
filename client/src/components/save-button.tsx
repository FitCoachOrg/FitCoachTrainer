"use client"

import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface SaveButtonProps {
  onSave: () => void
  disabled?: boolean
}

export function SaveButton({ onSave, disabled = false }: SaveButtonProps) {
  return (
    <div className="fixed bottom-8 right-8">
      <Button
        onClick={onSave}
        disabled={disabled}
        className="bg-[#39FF14] hover:bg-[#32E012] text-black font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl hover:shadow-[#39FF14]/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-5 h-5 mr-2" />
        Save Program
      </Button>
    </div>
  )
}
