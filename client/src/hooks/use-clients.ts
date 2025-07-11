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
        const { data, error } = await supabase
          .from('client')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
          return
        }

        // Transform the data to match MappedClient interface
        const mappedClients: MappedClient[] = (data || []).map((client: any) => ({
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

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('schedule')
          .select('*')
          .eq('client_id', clientId)
          .gte('for_date', startDate)
          .lte('for_date', endDate)
          .order('for_date', { ascending: true })

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

  return { data: schedule, isLoading: loading, error }
}
