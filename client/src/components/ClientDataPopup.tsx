import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'

interface ClientInfo {
  // Basic Information
  id: number
  name: string
  preferredName: string
  email: string
  username: string
  phone: number
  age: number
  sex: string
  
  // Physical Information
  height: number
  weight: number
  targetWeight: number
  
  // Goals & Preferences
  primaryGoal: string
  activityLevel: string
  specificOutcome: string
  goalTimeline: string
  obstacles: string
  confidenceLevel: number
  
  // Training Information
  trainingExperience: string
  previousTraining: string
  trainingDaysPerWeek: number
  trainingTimePerSession: string
  trainingLocation: string
  availableEquipment: string[]
  focusAreas: string[]
  injuriesLimitations: string
  
  // Nutrition Information
  eatingHabits: string
  dietPreferences: string[]
  foodAllergies: string
  preferredMealsPerDay: number
  
  // Lifestyle Information
  sleepHours: number
  stress: string
  alcohol: string
  supplements: string
  gastricIssues: string
  motivationStyle: string
  
  // Schedule Information
  wakeTime: string
  bedTime: string
  workoutTime: string
  workoutDays: any
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  snackTime: string
  
  // System Information
  onboardingCompleted: boolean
  onboardingProgress: any
  trainerId: number
  createdAt: string
  lastLogin: string
  lastCheckIn: string
}

interface ClientDataPopupProps {
  isOpen: boolean
  onClose: () => void
  clientInfo: ClientInfo | null
}

export function ClientDataPopup({ isOpen, onClose, clientInfo }: ClientDataPopupProps) {
  if (!clientInfo) return null

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'Not specified'
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'None'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-blue-600 border-b border-blue-200 pb-1">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  )

  const InfoItem = ({ label, value }: { label: string; value: any }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
        {formatValue(value)}
      </span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Client Information - {clientInfo.name || clientInfo.preferredName}
            <Badge variant="outline" className="ml-2">ID: {clientInfo.id}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            
            <InfoSection title="👤 Basic Information">
              <InfoItem label="Full Name" value={clientInfo.name} />
              <InfoItem label="Preferred Name" value={clientInfo.preferredName} />
              <InfoItem label="Email" value={clientInfo.email} />
              <InfoItem label="Username" value={clientInfo.username} />
              <InfoItem label="Phone" value={clientInfo.phone} />
              <InfoItem label="Age" value={clientInfo.age} />
              <InfoItem label="Sex" value={clientInfo.sex} />
            </InfoSection>

            <InfoSection title="📏 Physical Information">
              <InfoItem label="Height (cm)" value={clientInfo.height} />
              <InfoItem label="Current Weight (kg)" value={clientInfo.weight} />
              <InfoItem label="Target Weight (kg)" value={clientInfo.targetWeight} />
            </InfoSection>

            <InfoSection title="🎯 Goals & Preferences">
              <InfoItem label="Primary Goal" value={clientInfo.primaryGoal} />
              <InfoItem label="Activity Level" value={clientInfo.activityLevel} />
              <InfoItem label="Specific Outcome" value={clientInfo.specificOutcome} />
              <InfoItem label="Goal Timeline" value={clientInfo.goalTimeline} />
              <InfoItem label="Obstacles" value={clientInfo.obstacles} />
              <InfoItem label="Confidence Level" value={clientInfo.confidenceLevel} />
            </InfoSection>

            <InfoSection title="💪 Training Information">
              <InfoItem label="Training Experience" value={clientInfo.trainingExperience} />
              <InfoItem label="Previous Training" value={clientInfo.previousTraining} />
              <InfoItem label="Training Days/Week" value={clientInfo.trainingDaysPerWeek} />
              <InfoItem label="Training Time/Session" value={clientInfo.trainingTimePerSession} />
              <InfoItem label="Training Location" value={clientInfo.trainingLocation} />
              <InfoItem label="Available Equipment" value={clientInfo.availableEquipment} />
              <InfoItem label="Focus Areas" value={clientInfo.focusAreas} />
              <InfoItem label="Injuries/Limitations" value={clientInfo.injuriesLimitations} />
            </InfoSection>

            <InfoSection title="🍽️ Nutrition Information">
              <InfoItem label="Eating Habits" value={clientInfo.eatingHabits} />
              <InfoItem label="Diet Preferences" value={clientInfo.dietPreferences} />
              <InfoItem label="Food Allergies" value={clientInfo.foodAllergies} />
              <InfoItem label="Preferred Meals/Day" value={clientInfo.preferredMealsPerDay} />
            </InfoSection>

            <InfoSection title="🌙 Lifestyle Information">
              <InfoItem label="Sleep Hours" value={clientInfo.sleepHours} />
              <InfoItem label="Stress Level" value={clientInfo.stress} />
              <InfoItem label="Alcohol Consumption" value={clientInfo.alcohol} />
              <InfoItem label="Supplements" value={clientInfo.supplements} />
              <InfoItem label="Gastric Issues" value={clientInfo.gastricIssues} />
              <InfoItem label="Motivation Style" value={clientInfo.motivationStyle} />
            </InfoSection>

            <InfoSection title="⏰ Schedule Information">
              <InfoItem label="Wake Time" value={clientInfo.wakeTime} />
              <InfoItem label="Bed Time" value={clientInfo.bedTime} />
              <InfoItem label="Workout Time" value={clientInfo.workoutTime} />
              <InfoItem label="Workout Days" value={clientInfo.workoutDays} />
              <InfoItem label="Breakfast Time" value={clientInfo.breakfastTime} />
              <InfoItem label="Lunch Time" value={clientInfo.lunchTime} />
              <InfoItem label="Dinner Time" value={clientInfo.dinnerTime} />
              <InfoItem label="Snack Time" value={clientInfo.snackTime} />
            </InfoSection>

            <InfoSection title="⚙️ System Information">
              <InfoItem label="Onboarding Completed" value={clientInfo.onboardingCompleted} />
              <InfoItem label="Onboarding Progress" value={clientInfo.onboardingProgress} />
              <InfoItem label="Trainer ID" value={clientInfo.trainerId} />
              <InfoItem label="Account Created" value={new Date(clientInfo.createdAt).toLocaleString()} />
              <InfoItem label="Last Login" value={clientInfo.lastLogin ? new Date(clientInfo.lastLogin).toLocaleString() : 'Never'} />
              <InfoItem label="Last Check-in" value={clientInfo.lastCheckIn ? new Date(clientInfo.lastCheckIn).toLocaleString() : 'Never'} />
            </InfoSection>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 