import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAccess } from '@/hooks/use-admin-access'
import { Loader2 } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

/**
 * AdminProtectedRoute - Protects routes that require admin access
 * 
 * This component checks if the current trainer has admin_access = true
 * in the trainer table. If not, they are redirected to the dashboard.
 * 
 * Admin access is required for:
 * - Admin page (/admin)
 * - Branding page (/branding) 
 * - Notes page (/notes)
 * - Programs page (/programs)
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, error } = useAdminAccess()
  const location = useLocation()

  // Show loading spinner while checking admin access
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // If there was an error checking admin access, redirect to dashboard
  if (error) {
    console.error('Admin access check error:', error)
    return <Navigate to="/dashboard" replace />
  }

  // If user doesn't have admin access, redirect to dashboard
  if (!isAdmin) {
    console.log('User does not have admin access, redirecting to dashboard')
    return <Navigate to="/dashboard" replace />
  }

  // If user has admin access, render the protected content
  return <>{children}</>
}

export default AdminProtectedRoute
