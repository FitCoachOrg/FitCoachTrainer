import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import * as Icons from "@/lib/icons"
import React, { useEffect, useState } from "react"
import { useSidebar } from "@/context/sidebar-context"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  alert?: boolean
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Icons.BellIcon className="h-5 w-5" />,
    alert: true,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: <Icons.UsersIcon className="h-5 w-5" />,
  },
  {
    name: "Exercise Library",
    href: "/exercise-lib",
    icon: <Icons.ScrollIcon className="h-5 w-5" />,
  },
  {
    name: "Fitness Plans",
    href: "/fitness-plans",
    icon: <Icons.CalendarIcon className="h-5 w-5" />,
  },
  {
    name: "Branding",
    href: "/branding",
    icon: <Icons.PaintbrushIcon className="h-5 w-5" />,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: <Icons.CreditCardIcon className="h-5 w-5" />,
  },
]

const secondaryNavItems: NavItem[] = [
  {
    name: "Log out",
    href: "#",
    icon: <Icons.LogOutIcon className="h-5 w-5" />,
  },
]

const Sidebar: React.FC = () => {
  const { isExpanded, setIsExpanded } = useSidebar()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [trainerEmail, setTrainerEmail] = useState<string | null>(null)
  const [trainerName, setTrainerName] = useState<string | null>(null)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  useEffect(() => {
    const fetchTrainerData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session && session.user.email) {
        const { data: trainerData, error } = await supabase
          .from("trainer")
          .select("avatar_url, profile_picture_url, trainer_email, trainer_name")
          .eq("trainer_email", session.user.email)
          .single()

        if (error) {
          console.error("Error fetching trainer data:", error)
        } else if (trainerData) {
          // Use profile_picture_url if available, otherwise fall back to avatar_url
          const profileUrl = trainerData.profile_picture_url || trainerData.avatar_url;
          setAvatarUrl(profileUrl)
          setTrainerEmail(trainerData.trainer_email)
          setTrainerName(trainerData.trainer_name)
        }
      }
    }

    fetchTrainerData()
  }, [])

  const handleSmartAlertsClick = () => {
    navigate("/dashboard")
  }

  // Show logout confirmation dialog
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  // Handle confirmed logout
  const handleConfirmLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('Logout successful')
      
      // Close confirmation dialog
      setShowLogoutConfirmation(false)
      
      // Redirect to login page
      navigate("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      // Close confirmation dialog even if there's an error
      setShowLogoutConfirmation(false)
      navigate("/login")
    }
  }

  // Handle logout cancellation
  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 bg-white dark:bg-black shadow-lg z-30 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-4 py-5 border-b border-gray-200 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={
                avatarUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
              }
              alt="Trainer profile"
              className="object-cover w-full h-full"
            />
          </div>
          <div
            className={cn(
              "ml-3 transition-all duration-300 overflow-hidden",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}
          >
            <h1 className="font-semibold text-lg whitespace-nowrap">{trainerName || "Trainer"}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {trainerEmail || ""}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin">
          <ul className="space-y-1 px-2">
            {navigationItems.map((item) => (
              <NavItem key={item.name} {...item} isExpanded={isExpanded} />
            ))}
          </ul>

          <div className="border-t my-6 border-gray-200 dark:border-gray-700 mx-2" />

          <ul className="space-y-1 px-2">
            {secondaryNavItems.map((item) => (
              <NavItem 
                key={item.name} 
                {...item} 
                isExpanded={isExpanded} 
                onClick={item.name === "Log out" ? handleLogoutClick : undefined}
              />
            ))}
          </ul>
        </nav>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLogout}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLogout}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface NavItemProps extends NavItem {
  isExpanded: boolean
  onClick?: () => void
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon,
  name,
  alert,
  children,
  isExpanded,
  onClick,
}) => {
  const location = useLocation()
  const isActive = location.pathname.startsWith(href)
  const [open, setOpen] = React.useState(false)
  const hasChildren = children && children.length > 0
  const closeTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <li className="relative group">
      <NavLink
        to={href}
        onClick={handleClick}
        className={({ isActive }) =>
          cn(
            "flex items-center px-3 py-3 rounded-lg transition-all duration-500 cursor-pointer relative",
            isActive || isActive
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          )
        }
        onMouseEnter={() => {
          if (hasChildren) {
            if (closeTimeout.current) clearTimeout(closeTimeout.current)
            setOpen(true)
          }
        }}
        onMouseLeave={() => {
          if (hasChildren) {
            closeTimeout.current = setTimeout(() => setOpen(false), 150)
          }
        }}
      >
        <span className="flex items-center justify-center w-8 h-8 relative flex-shrink-0">
          {icon}
          {alert && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
          )}
        </span>

        <div
          className={cn(
            "ml-3 flex items-center justify-between flex-1 transition-all duration-300 overflow-hidden",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}
        >
          <span className="whitespace-nowrap">{name}</span>
          {hasChildren && (
            <svg
              className={cn("w-4 h-4 transition-transform", open ? "rotate-90" : "")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>

        {!isExpanded && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none whitespace-nowrap z-50">
            {name}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
          </div>
        )}
      </NavLink>

      {/* Dropdown */}
      {hasChildren && isExpanded && (
        <ul
          className={cn(
            "ml-8 mt-1 space-y-1 transition-all duration-500 overflow-hidden",
            open ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0"
          )}
          onMouseEnter={() => {
            if (closeTimeout.current) clearTimeout(closeTimeout.current)
            setOpen(true)
          }}
          onMouseLeave={() => {
            closeTimeout.current = setTimeout(() => setOpen(false), 150)
          }}
        >
          {children.map((child) => (
            <NavItem key={child.name} {...child} isExpanded={isExpanded} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default Sidebar
