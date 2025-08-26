"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import ProfessionalCalendar from "@/components/dashboard/ProfessionalCalendar"

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)

  // Handle hash fragment with access token
  useEffect(() => {
    const handleHashFragment = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setIsProcessingAuth(true)
        console.log('🔐 Processing authentication from hash fragment...')
        
        try {
          // Extract token from hash
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          
          if (accessToken) {
            // Set the session manually
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              console.error('Error setting session:', error)
              navigate('/login')
              return
            }
            
            console.log('✅ Authentication successful!')
            // Clear the hash fragment
            window.history.replaceState(null, '', '/dashboard')
          }
        } catch (error) {
          console.error('Error processing auth:', error)
          navigate('/login')
        } finally {
          setIsProcessingAuth(false)
        }
      }
    }
    
    handleHashFragment()
  }, [navigate])

  // Show loading state while processing authentication
  if (isProcessingAuth) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Processing authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto py-6">
        <div className="mb-8">
          <ProfessionalCalendar />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
