"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import ProfessionalCalendar from "@/components/dashboard/ProfessionalCalendar"
import TodoList from "@/components/dashboard/TodoList"
import { ClientInsightsCards, InsightsData } from "@/components/dashboard/ClientInsightsCards"

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    console.log('[Route] Dashboard mounted')
  }, [])

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

  // Load insights (adherence 14d and momentum 3w) for the trainer's clients
  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoadingInsights(true)

        // Resolve current trainer via email -> trainer.id (match Clients page approach)
        const { data: sessionData } = await supabase.auth.getSession()
        const trainerEmail = sessionData?.session?.user?.email

        let trainerClientIds: number[] = []
        if (trainerEmail) {
          const { data: trainerRows, error: trainerError } = await supabase
            .from('trainer')
            .select('id')
            .eq('trainer_email', trainerEmail)
            .limit(1)

          if (!trainerError && trainerRows && trainerRows.length > 0) {
            const trainerId = trainerRows[0].id
            const { data: relationshipData, error: relationshipError } = await supabase
              .from('trainer_client_web')
              .select('client_id, status')
              .eq('trainer_id', trainerId)

            if (!relationshipError && relationshipData) {
              trainerClientIds = relationshipData
                .map((r: any) => r.client_id)
                .filter((id: any) => typeof id === 'number' && id > 0)
            }
          }
        }

        // Fetch client names for mapping
        let clientNameById: Record<number, string> = {}
        if (trainerClientIds.length > 0) {
          const { data: clients, error: clientsError } = await supabase
            .from('client')
            .select('client_id, cl_name')
            .in('client_id', trainerClientIds)
          if (!clientsError && clients) {
            for (const c of clients as any[]) {
              clientNameById[c.client_id] = c.cl_name || `Client ${c.client_id}`
            }
          }
        }

        // Fetch adherence from the Supabase view
        const { data: adherenceRows, error: adherenceError } = await supabase
          .from('adherence_14d')
          .select('client_id, adherence_pct, completed_count, total_count, window_start, window_end')

        if (adherenceError) {
          console.error('Error loading adherence_14d:', adherenceError)
        }

        // Fetch momentum from the Supabase view
        const { data: momentumRows, error: momentumError } = await supabase
          .from('momentum_3w')
          .select('client_id, sessions_delta, volume_delta, avg_sessions, avg_volume, start_week, end_week')

        if (momentumError) {
          console.error('Error loading momentum_3w:', momentumError)
        }

        // Filter to trainer's clients if list available
        let rows = (adherenceRows || []) as Array<{
          client_id: number
          adherence_pct: number | null
          completed_count: number
          total_count: number
          window_start: string
          window_end: string
        }>
        rows = rows.filter(r => trainerClientIds.includes(r.client_id))

        // Compute adherence insights
        const valid = rows.filter(r => r.adherence_pct !== null)
        const adherenceAverage = valid.length > 0
          ? Number((valid.reduce((s, r) => s + (r.adherence_pct as number), 0) / valid.length).toFixed(1))
          : 0

        const sortedDesc = [...valid].sort((a, b) => (b.adherence_pct as number) - (a.adherence_pct as number))
        const sortedAsc = [...valid].sort((a, b) => (a.adherence_pct as number) - (b.adherence_pct as number))

        const topPerformers = sortedDesc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: Number((r.adherence_pct as number).toFixed(1))
        }))

        const bottomPerformers = sortedAsc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: Number((r.adherence_pct as number).toFixed(1))
        }))

        // Compute momentum insights
        let momentumRowsFiltered = (momentumRows || []) as Array<{
          client_id: number
          sessions_delta: number | null
          volume_delta: number | null
          avg_sessions: number | null
          avg_volume: number | null
          start_week: string
          end_week: string
        }>
        momentumRowsFiltered = momentumRowsFiltered.filter(r => trainerClientIds.includes(r.client_id))

        const momentumWithPct = momentumRowsFiltered.map(r => {
          const base = r.avg_volume && r.avg_volume !== 0 ? r.avg_volume : 0
          const delta = r.volume_delta || 0
          const pct = base > 0 ? Number(((delta / base) * 100).toFixed(1)) : 0
          return { ...r, momentum_pct: pct }
        })

        const momentumAverage = momentumWithPct.length > 0
          ? Number((momentumWithPct.reduce((s, r) => s + r.momentum_pct, 0) / momentumWithPct.length).toFixed(1))
          : 0

        const momentumSortedDesc = [...momentumWithPct].sort((a, b) => b.momentum_pct - a.momentum_pct)
        const momentumSortedAsc = [...momentumWithPct].sort((a, b) => a.momentum_pct - b.momentum_pct)

        const momentumTop = momentumSortedDesc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: r.momentum_pct
        }))

        const momentumBottom = momentumSortedAsc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: r.momentum_pct
        }))

        const momentumTrend: 'up' | 'down' | 'stable' = momentumAverage > 0 ? 'up' : momentumAverage < 0 ? 'down' : 'stable'

        // Fetch engagement from the Supabase view
        const { data: engagementRows, error: engagementError } = await supabase
          .from('engagement_14d')
          .select('client_id, eng_score_avg, latest_score, window_start, window_end')

        if (engagementError) {
          console.error('Error loading engagement_14d:', engagementError)
        }

        let engagementRowsFiltered = (engagementRows || []) as Array<{
          client_id: number
          eng_score_avg: number | null
          latest_score: number | null
          window_start: string
          window_end: string
        }>
        engagementRowsFiltered = engagementRowsFiltered.filter(r => trainerClientIds.includes(r.client_id))

        const engagementValid = engagementRowsFiltered.filter(r => r.eng_score_avg !== null)
        const engagementAverage = engagementValid.length > 0
          ? Number((engagementValid.reduce((s, r) => s + (r.eng_score_avg as number), 0) / engagementValid.length).toFixed(1))
          : 0

        const engagementSortedDesc = [...engagementValid].sort((a, b) => (b.eng_score_avg as number) - (a.eng_score_avg as number))
        const engagementSortedAsc = [...engagementValid].sort((a, b) => (a.eng_score_avg as number) - (b.eng_score_avg as number))

        const engagementTop = engagementSortedDesc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: Number((r.eng_score_avg as number).toFixed(1))
        }))

        const engagementBottom = engagementSortedAsc.slice(0, 3).map(r => ({
          client_id: r.client_id,
          client_name: clientNameById[r.client_id] || `Client ${r.client_id}`,
          value: Number((r.eng_score_avg as number).toFixed(1))
        }))

        const meanLatest = engagementRowsFiltered.length > 0
          ? Number((engagementRowsFiltered.reduce((s, r) => s + (r.latest_score || 0), 0) / engagementRowsFiltered.length).toFixed(1))
          : 0
        const engagementTrend: 'up' | 'down' | 'stable' = meanLatest > engagementAverage ? 'up' : meanLatest < engagementAverage ? 'down' : 'stable'

        const insights: InsightsData = {
          momentum: {
            average: momentumAverage,
            topPerformers: momentumTop,
            bottomPerformers: momentumBottom,
            trend: momentumTrend
          },
          adherence: {
            average: adherenceAverage,
            topPerformers,
            bottomPerformers,
            trend: 'stable'
          },
          engagement: {
            average: engagementAverage,
            topPerformers: engagementTop,
            bottomPerformers: engagementBottom,
            trend: engagementTrend
          }
        }

        setInsightsData(insights)
      } catch (e) {
        console.error('Error building insights data:', e)
        setInsightsData(null)
      } finally {
        setLoadingInsights(false)
      }
    }

    loadInsights()
  }, [])

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
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 w-full">
        {/* Client Insights Cards - Top Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">Client Performance Overview</h2>
          <ClientInsightsCards data={insightsData} />
        </div>
        
        {/* Main Dashboard Grid - Improved responsive layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
          {/* Professional Calendar - Left Side */}
          <div className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex flex-col">
            <ProfessionalCalendar />
          </div>
          
          {/* To-Do List - Right Side */}
          <div className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex flex-col">
            <TodoList />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
