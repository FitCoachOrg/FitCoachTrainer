import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types for client data
export interface MappedClient {
  id: number
  client_id: number
  name: string
  email: string
  phone: string
  startDate: Date
  status: 'active' | 'pending' | 'inactive'
  isActive: boolean
  avatarUrl?: string
  goals: string[]
  metrics: {
    weight: number
    height: number
    bodyFat?: number
    bmi?: number
  }
  assignedPlans: {
    id: number
    name: string
    type: string
    startDate: Date
    endDate?: Date
  }[]
  notes: {
    id: number
    content: string
    createdAt: Date
  }[]
}

// Hook to fetch clients
export function useClients() {
  const [clients, setClients] = useState<MappedClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email) {
          setError('User not authenticated')
          return
        }

        // Get trainer ID from trainer table using email
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainer')
          .select('id')
          .eq('trainer_email', session.user.email)
          .single()

        if (trainerError || !trainerData?.id) {
          setError('Trainer profile not found')
          return
        }

        // Step 1: Get client IDs associated with this trainer from trainer_client_web table
        const { data: clientRelationships, error: relationshipError } = await supabase
          .from('trainer_client_web')
          .select('client_id')
          .eq('trainer_id', trainerData.id)

        if (relationshipError) {
          console.error('Error fetching client relationships:', relationshipError)
          setError(relationshipError.message)
          return
        }

        // If no client relationships found, return empty array
        if (!clientRelationships || clientRelationships.length === 0) {
          console.log('No client relationships found for trainer:', trainerData.id)
          setClients([])
          return
        }

        // Extract client IDs
        const clientIds = clientRelationships.map(rel => rel.client_id).filter(Boolean)
        
        if (clientIds.length === 0) {
          console.log('No valid client IDs found')
          setClients([])
          return
        }

        // Step 2: Fetch client data for these client IDs
        const { data: clientsData, error: clientsError } = await supabase
          .from('client')
          .select('*')
          .in('client_id', clientIds)
          .order('created_at', { ascending: false })

        if (clientsError) {
          console.error('Error fetching clients:', clientsError)
          setError(clientsError.message)
          return
        }

        // Transform the data to match MappedClient interface
        const mappedClients: MappedClient[] = (clientsData || []).map((client: any) => ({
          id: client.client_id,
          client_id: client.client_id,
          name: client.cl_name,
          email: client.cl_email || '',
          phone: client.cl_phone || '',
          startDate: new Date(client.created_at),
          status: 'active' as const, // Default to active
          isActive: true, // Default to active
          avatarUrl: client.cl_pic || undefined,
          goals: client.cl_primary_goal ? [client.cl_primary_goal] : [],
          metrics: {
            weight: client.cl_weight || 0,
            height: client.cl_height || 0,
            bodyFat: undefined,
            bmi: undefined
          },
          assignedPlans: [], // TODO: Fetch from plans table
          notes: [] // TODO: Fetch from notes table
        }))

        setClients(mappedClients)
      } catch (err) {
        setError('Failed to fetch clients')
        console.error('Error fetching clients:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  return { clients, loading: loading, isLoading: loading, error }
}

// Hook to fetch client schedule
export function useClientSchedule(clientId: number, startDate: string, endDate: string) {
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDraftPlan, setIsDraftPlan] = useState(false)

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true)
        // ALWAYS fetch from schedule_preview first (primary source)
        let { data, error } = await supabase
          .from('schedule_preview')
          .select('*')
          .eq('client_id', clientId)
          .gte('for_date', startDate)
          .lte('for_date', endDate)
          .order('for_date', { ascending: true })
        if (error) {
          console.warn('Error fetching from schedule_preview:', error)
        }
        
        let isFromPreview = true;
        
        // FALLBACK LOGIC COMMENTED OUT - UI should ONLY get data from schedule_preview table
        // if (!data || data.length === 0) {
        //   // Only fallback to schedule if no preview data exists
        //   console.log('No preview data found, checking schedule table as fallback');
        //   ({ data, error } = await supabase
        //     .from('schedule')
        //     .select('*')
        //     .eq('client_id', clientId)
        //     .gte('for_date', startDate)
        //     .lte('for_date', endDate)
        //     .order('for_date', { ascending: true }))
        //   isFromPreview = false;
        // }
        
        // Set draft status based on data source
        setIsDraftPlan(isFromPreview);
        if (error) {
          setError(error.message)
          return
        }
        // Transform the data for the schedule component
        const transformedSchedule = (data || []).map((item: any) => ({
          date: item.for_date,
          workout_name: item.summary,
          exercises: item.details_json?.main_workout || [],
          status: item.status,
          type: item.type,
          icon: item.icon
        }))
        setSchedule(transformedSchedule)
      } catch (err) {
        setError('Failed to fetch schedule')
        console.error('Error fetching schedule:', err)
      } finally {
        setLoading(false)
      }
    }
    if (clientId && startDate && endDate) {
      fetchSchedule()
    }
  }, [clientId, startDate, endDate])

  return { data: schedule, isLoading: loading, error, isDraftPlan }
}
