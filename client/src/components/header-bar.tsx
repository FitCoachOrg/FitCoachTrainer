"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { ProgramData, Difficulty, StartDay } from "@/types/program"

interface HeaderBarProps {
  programData: ProgramData
  updateProgramData: (updates: Partial<ProgramData>) => void
}

export function HeaderBar({ programData, updateProgramData }: HeaderBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  return (
    <div className="bg-[#121212] border border-[#2B2B2B] rounded-lg p-6 shadow-lg">
      <div className="flex flex-wrap items-center gap-6">
        {/* Title */}
        <div className="flex-1 min-w-[200px]">
          {isEditingTitle ? (
            <Input
              value={programData.title}
              onChange={(e) => updateProgramData({ title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="text-2xl font-bold bg-transparent border-none p-0 text-[#F0F0F0] focus:ring-2 focus:ring-[#39FF14]"
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-[#39FF14] transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {programData.title}
            </h1>
          )}
        </div>

        {/* Tag */}
        <div className="flex items-center gap-2">
          <Label htmlFor="tag" className="text-sm text-[#F0F0F0]">
            Tag
          </Label>
          <Input
            id="tag"
            value={programData.tag}
            onChange={(e) => updateProgramData({ tag: e.target.value })}
            placeholder="Enter tag"
            className="w-32 bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14]"
          />
        </div>

        {/* Editable Badge */}
        {programData.isEditable && <Badge className="bg-[#39FF14] text-black hover:bg-[#32E012]">Editable</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-8 mt-6">
        {/* Difficulty */}
        <div>
          <Label className="text-sm text-[#F0F0F0] mb-3 block">Difficulty</Label>
          <RadioGroup
            value={programData.difficulty}
            onValueChange={(value: Difficulty) => updateProgramData({ difficulty: value })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="easy" id="easy" className="border-[#39FF14] text-[#39FF14]" />
              <Label htmlFor="easy" className="text-[#F0F0F0]">
                Easy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" className="border-[#39FF14] text-[#39FF14]" />
              <Label htmlFor="medium" className="text-[#F0F0F0]">
                Medium
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="hard" className="border-[#39FF14] text-[#39FF14]" />
              <Label htmlFor="hard" className="text-[#F0F0F0]">
                Hard
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Start Day */}
        <div>
          <Label className="text-sm text-[#F0F0F0] mb-3 block">Start Day</Label>
          <Select
            value={programData.startDay}
            onValueChange={(value: StartDay) => updateProgramData({ startDay: value })}
          >
            <SelectTrigger className="w-32 bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <SelectItem key={day} value={day} className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Picker */}
        <div>
          <Label className="text-sm text-[#F0F0F0] mb-3 block">Assign Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border-2 border-[#2B2B2B] cursor-pointer"
              style={{ backgroundColor: programData.assignedColor }}
              onClick={() => document.getElementById("color-input")?.click()}
            />
            <Input
              id="color-input"
              type="color"
              value={programData.assignedColor}
              onChange={(e) => updateProgramData({ assignedColor: e.target.value })}
              className="w-0 h-0 opacity-0 absolute"
            />
            <Input
              value={programData.assignedColor}
              onChange={(e) => updateProgramData({ assignedColor: e.target.value })}
              placeholder="#39FF14"
              className="w-24 bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14]"
            />
          </div>
        </div>

        {/* Assign to Client */}
        <div>
          <Label className="text-sm text-[#F0F0F0] mb-3 block">Assign to Client</Label>
          <Select
            value={programData.assignedClient}
            onValueChange={(value: string) => updateProgramData({ assignedClient: value })}
          >
            <SelectTrigger className="w-48 bg-[#1A1A1A] border-[#2B2B2B] text-[#F0F0F0] focus:ring-[#39FF14] focus:border-[#39FF14]">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#2B2B2B]">
              <SelectItem value="john-doe" className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                John Doe
              </SelectItem>
              <SelectItem value="jane-smith" className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                Jane Smith
              </SelectItem>
              <SelectItem value="mike-johnson" className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                Mike Johnson
              </SelectItem>
              <SelectItem value="sarah-wilson" className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                Sarah Wilson
              </SelectItem>
              <SelectItem value="david-brown" className="text-[#F0F0F0] focus:bg-[#39FF14] focus:text-black">
                David Brown
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
