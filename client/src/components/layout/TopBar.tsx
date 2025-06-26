import React, { useEffect, useState } from "react"

import { useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "@/context/ThemeContext"
import { useSidebar } from "@/context/sidebar-context"
import * as Icons from "@/lib/icons"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TopBar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleTheme, theme } = useTheme()
  const { isExpanded } = useSidebar()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [trainerName, setTrainerName] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrainerData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session && session.user.email) {
        const { data: trainerData, error } = await supabase
          .from("trainer")
          .select("avatar_url, trainer_name")
          .eq("trainer_email", session.user.email)
          .single()

        if (error) {
          console.error("Error fetching trainer data:", error)
        } else if (trainerData) {
          setAvatarUrl(trainerData.avatar_url)
          setTrainerName(trainerData.trainer_name)
        }
      }
    }

    fetchTrainerData()
  }, [])

  // Format the page title based on the current location
  const getPageTitle = () => {
    const path = location.pathname.split("/")[1]

    if (path === "") return "Dashboard / Home"

    const formattedPath = path.charAt(0).toUpperCase() + path.slice(1)
    return `Dashboard / ${formattedPath}`
  }

  return (
    <header
      className={cn(
        "bg-white dark:bg-black shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20 transition-all duration-300 ease-in-out",
        isExpanded ? "ml-64" : "ml-16",
      )}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Welcome,{" "}
              <span className="text-green-600 dark:text-green-400 font-medium">{trainerName || "Coach"}</span>!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            {theme === "dark" ? <Icons.SunIcon className="h-5 w-5" /> : <Icons.MoonIcon className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 relative"
          >
            <Icons.BellIcon className="h-5 w-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary-600 rounded-full"></span>
          </Button>
          <button
            onClick={() => navigate("/trainer-profile")}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
          >
            <img
              src={
                avatarUrl ||
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=120"
              }
              alt="Trainer profile"
              className="object-cover w-full h-full"
            />
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
