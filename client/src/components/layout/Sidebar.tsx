import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import * as Icons from "@/lib/icons"
import React from "react"
import { useSidebar } from "@/context/sidebar-context"

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  alert?: boolean
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    name: "Smart Alerts",
    href: "/alerts",
    icon: <Icons.BellIcon className="h-5 w-5" />,
    alert: true,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: <Icons.UsersIcon className="h-5 w-5" />,
  },
  {
    name: "Plan Library",
    href: "/plans",
    icon: <Icons.ClipboardIcon className="h-5 w-5" />,
    children: [
      {
        name: "Nutrition Plans",
        href: "/nutrition-plans",
        icon: <Icons.UtensilsIcon className="h-4 w-4" />,
      },
      {
        name: "Fitness Plans",
        href: "/fitness-plans",
        icon: <Icons.DumbbellIcon className="h-4 w-4" />,
      },
    ],
  },
  {
    name: "Notes & Logs",
    href: "/notes",
    icon: <Icons.ScrollIcon className="h-5 w-5" />,
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
    href: "/logout",
    icon: <Icons.LogOutIcon className="h-5 w-5" />,
  },
]

const Sidebar: React.FC = () => {
  const { isExpanded, setIsExpanded } = useSidebar()

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
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"
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
            <h1 className="font-semibold text-lg whitespace-nowrap">FitProDash</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">info@fitprodash.com</p>
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
              <NavItem key={item.name} {...item} isExpanded={isExpanded} />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

interface NavItemProps extends NavItem {
  isExpanded: boolean
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon,
  name,
  alert,
  children,
  isExpanded,
}) => {
  const location = useLocation()
  const isActive = location.pathname.startsWith(href)
  const [open, setOpen] = React.useState(false)
  const hasChildren = children && children.length > 0

  return (
    <li className="relative group">
      <NavLink
        to={href}
        className={({ isActive }) =>
          cn(
            "flex items-center px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer relative",
            isActive || isActive
              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
          )
        }
        onMouseEnter={() => hasChildren && setOpen(true)}
        onMouseLeave={() => hasChildren && setOpen(false)}
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
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {name}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
          </div>
        )}
      </NavLink>

      {/* Dropdown */}
      {hasChildren && isExpanded && (
        <ul
          className={cn(
            "ml-8 mt-1 space-y-1 transition-all duration-200 overflow-hidden",
            open ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0"
          )}
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
