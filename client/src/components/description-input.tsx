"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface DescriptionInputProps {
  description: string
  onChange: (description: string) => void
}

export function DescriptionInput({ description, onChange }: DescriptionInputProps) {
  return (
    <div className="bg-[#121212] border border-[#2B2B2B] rounded-lg p-6 shadow-lg">
      <Label htmlFor="description" className="text-lg font-semibold text-[#F0F0F0] mb-4 block">
        Description
      </Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter program description..."
        className="min-h-[120px] bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] placeholder:text-[#666] focus:ring-[#39FF14] focus:border-[#39FF14] resize-none"
      />
    </div>
  )
}
