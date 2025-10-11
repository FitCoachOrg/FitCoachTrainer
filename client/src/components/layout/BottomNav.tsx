import React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { Home, Users, Calendar, CreditCard } from "lucide-react"

const BottomNav: React.FC = () => {
  const location = useLocation()
  
  // Check if we're on a client profile page
  const isClientRoute = location.pathname.startsWith('/client')
  
  return (
    <nav
      role="navigation"
      aria-label="Primary mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-black/80 border-t border-gray-200 dark:border-slate-700 shadow-lg"
    >
      <ul className="grid grid-cols-4 gap-1 px-2 py-2 safe-area-inset-bottom">
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs min-h-[44px] touch-manipulation ${
                isActive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-700 dark:text-gray-300"
              }`
            }
            aria-label="Dashboard"
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/clients"
            className={() =>
              `flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs min-h-[44px] touch-manipulation ${
                isClientRoute
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-700 dark:text-gray-300"
              }`
            }
            aria-label="Clients"
          >
            <Users className="h-5 w-5" />
            <span>Clients</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs min-h-[44px] touch-manipulation ${
                isActive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-700 dark:text-gray-300"
              }`
            }
            aria-label="Plans"
          >
            <Calendar className="h-5 w-5" />
            <span>Plans</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/payments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-xs min-h-[44px] touch-manipulation ${
                isActive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-700 dark:text-gray-300"
              }`
            }
            aria-label="Payments"
          >
            <CreditCard className="h-5 w-5" />
            <span>Payments</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

export default BottomNav



