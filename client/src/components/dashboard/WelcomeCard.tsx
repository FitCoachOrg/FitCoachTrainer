import type React from "react"
import { Card } from "@/components/ui/card"
import { WavesIcon as WaveIcon } from "lucide-react"

interface WelcomeCardProps {
  name?: string
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ name = "Coach" }) => {
  // Get current time of day
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "morning"
    if (hour < 18) return "afternoon"
    return "evening"
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md p-8 mb-8 border border-neutral-200 dark:border-neutral-700 transition-all duration-300 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 dark:bg-green-900/20 rounded-full -translate-y-32 translate-x-32 opacity-50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-100 dark:bg-green-900/20 rounded-full translate-y-16 -translate-x-16 opacity-30" />

      <div className="relative flex items-start space-x-4">
        <div className="text-4xl">
          <WaveIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
            Good {getTimeOfDay()}, <span className="text-green-600 dark:text-green-400">{name}</span>!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Stay organized with smart alerts and a modular UI to manage clients effectively.{" "}
            <br className="hidden sm:block" />
            Deliver personalized fitness and nutrition plans effortlessly.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default WelcomeCard
