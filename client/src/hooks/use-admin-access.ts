import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

/**
 * Custom hook to check if the current trainer has admin access
 * Admin access is determined by the admin_access column in the trainer table
 * 
 * @returns {Object} Object containing admin access status and loading state
 * @returns {boolean} returns.isAdmin - Whether the current trainer has admin access
 * @returns {boolean} returns.isLoading - Whether the admin access check is in progress
 * @returns {boolean} returns.error - Any error that occurred during the check
 */
export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { trainer } = useAuth()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // If no trainer data, user is not authenticated
        if (!trainer) {
          setIsAdmin(false)
          return
        }

        // Check if the trainer has admin access
        const { data: adminData, error: adminError } = await supabase
          .from('trainer')
          .select('admin_access')
          .eq('trainer_email', trainer.trainer_email)
          .single()

        if (adminError) {
          console.error('Error checking admin access:', adminError)
          setError(adminError.message)
          setIsAdmin(false)
          return
        }

        // Set admin status based on the admin_access column
        setIsAdmin(adminData?.admin_access || false)

      } catch (err: any) {
        console.error('Error in useAdminAccess:', err)
        setError(err.message)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [trainer])

  return {
    isAdmin,
    isLoading,
    error
  }
}
