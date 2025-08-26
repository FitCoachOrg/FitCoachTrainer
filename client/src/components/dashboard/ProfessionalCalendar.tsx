"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  format, 
  addDays, 
  subDays, 
  isSameDay, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addMonths,
  subMonths,
  getDay,
  getDate,
  isSameMonth,
  parseISO
} from "date-fns"
import { useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  User, 
  Calendar,
  Grid3X3,
  List,
  X
} from "lucide-react"
import { ScheduleService, ScheduleUtils, type ScheduleEvent, type CreateScheduleEvent } from "@/lib/schedule-service"
import { supabase } from "@/lib/supabase"

interface CalendarEvent {
  id: string
  date: Date
  title: string
  description?: string
  type: "consultation" | "check-in" | "meeting" | "fitness" | "nutrition" | "assessment" | "follow-up" | "group_session"
  time: string
  duration: number // in minutes
  clientName?: string
  clientEmail?: string
  meetingUrl?: string
  color?: string
}

// Sample events with more realistic data
const initialEvents: CalendarEvent[] = [
  {
    id: "1",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
    title: "Nutrition Check-in",
    description: "Monthly nutrition plan review and adjustments",
    type: "nutrition",
    time: "09:00",
    duration: 45,
    clientName: "Sarah Johnson",
    color: "#10B981"
  },
  {
    id: "2",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
    title: "Team Meeting",
    description: "Weekly team sync and planning session",
    type: "meeting",
    time: "14:00",
    duration: 60,
    color: "#8B5CF6"
  },
  {
    id: "3",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2),
    title: "Fitness Assessment",
    description: "Quarterly fitness assessment and plan update",
    type: "fitness",
    time: "16:30",
    duration: 90,
    clientName: "Tom Lee",
    color: "#F59E0B"
  },
  {
    id: "4",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 4),
    title: "New Client Consultation",
    description: "Initial consultation and goal setting session",
    type: "consultation",
    time: "10:00",
    duration: 60,
    clientName: "Mike Chen",
    color: "#3B82F6"
  },
  {
    id: "5",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6),
    title: "Progress Check",
    description: "6-week progress evaluation and feedback",
    type: "check-in",
    time: "11:00",
    duration: 30,
    clientName: "Anna Kim",
    color: "#EF4444"
  },
]

const eventTypeColors = {
  consultation: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", dark: "dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" },
  "check-in": { bg: "bg-green-100", border: "border-green-300", text: "text-green-800", dark: "dark:bg-green-900/30 dark:border-green-700 dark:text-green-300" },
  meeting: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800", dark: "dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300" },
  fitness: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800", dark: "dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300" },
  nutrition: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", dark: "dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300" },
  assessment: { bg: "bg-red-100", border: "border-red-300", text: "text-red-800", dark: "dark:bg-red-900/30 dark:border-red-700 dark:text-red-300" },
  "follow-up": { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800", dark: "dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300" },
  group_session: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800", dark: "dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300" },
}

const getEventsForDay = (date: Date, events: CalendarEvent[]) => {
  return events.filter((event) => isSameDay(event.date, date)).sort((a, b) => a.time.localeCompare(b.time))
}

const getEventsForTimeSlot = (date: Date, time: string, events: CalendarEvent[]) => {
  return events.filter((event) => isSameDay(event.date, date) && event.time === time)
}

// Event Form Component
const EventForm: React.FC<{
  event?: CalendarEvent
  selectedDate?: Date
  onSave: (event: CalendarEvent) => void
  onClose: () => void
}> = ({ event, selectedDate, onSave, onClose }) => {
  const [clients, setClients] = useState<{client_id: number, cl_name: string, cl_email: string}[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [formData, setFormData] = useState({
    title: event?.title || "",
    clientName: event?.clientName || "",
    clientEmail: event?.clientEmail || "",
    type: event?.type || "consultation",
    time: event?.time || "09:00",
    duration: event?.duration || 60,
    date: event?.date || selectedDate || new Date(),
    meetingUrl: event?.meetingUrl || "",
    color: event?.color || "#3B82F6"
  })

  // Load trainer's clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      // Add a small delay to ensure component is fully mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        setIsLoadingClients(true)
        console.log('🔄 Loading trainer clients...')
        
        // Check authentication status first
        console.log('🔍 Checking authentication status...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('🔍 Session:', session)
        console.log('🔍 Session error:', sessionError)
        
        if (!session) {
          console.log('❌ No active session found - user not authenticated')
          setClients([])
          return
        }
        
        console.log('✅ User authenticated:', session.user.email)
        console.log('📊 Using direct database access...')
        
                // Get clients directly by trainer_email
        console.log('🔍 Getting clients for trainer_email:', session.user.email)
        console.log('🔍 Session user:', session.user)
        console.log('🔍 Session access token length:', session.access_token?.length || 'undefined')
        
        const { data, error } = await supabase
          .from('trainer_client_web')
          .select(`
            client_id,
            cl_email,
            trainer_name
          `)
          .eq('trainer_email', session.user.email)
          .eq('status', 'active')
          .order('client_id', { ascending: true })

        if (error) {
          console.error('❌ Error getting client relationships:', error)
          setClients([])
          return
        }

        console.log('✅ Found', data.length, 'client relationships')

        if (data.length === 0) {
          console.log('❌ No client relationships found')
          setClients([])
          return
        }

        // Get client details separately
        const clientIds = data.map(item => item.client_id)
        const { data: clientData, error: clientError } = await supabase
          .from('client')
          .select('client_id, cl_name, cl_email')
          .in('client_id', clientIds)
          .order('cl_name', { ascending: true })

        if (clientError) {
          console.error('❌ Error getting client details:', clientError)
          setClients([])
          return
        }

        console.log('✅ Found', clientData.length, 'client details')

        // Merge the data
        const trainerClients = data.map(item => {
          const client = clientData.find(c => c.client_id === item.client_id)
          return {
            client_id: item.client_id,
            cl_name: client?.cl_name || 'Unknown Client',
            cl_email: item.cl_email || client?.cl_email || ''
          }
        })

        console.log('✅ Final client list:', trainerClients)
        setClients(trainerClients)
        
      } catch (error) {
        console.error('❌ Error loading clients:', error)
        setClients([])
      } finally {
        setIsLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  // Handle client selection - auto-populate email
  const handleClientChange = (clientId: string) => {
    if (clientId === 'custom') {
      // Custom client - clear email for manual input
      setFormData(prev => ({ ...prev, clientName: '', clientEmail: '' }))
    } else {
      // Selected client - auto-populate name and email
      const selectedClient = clients.find(client => client.client_id.toString() === clientId)
      if (selectedClient) {
        setFormData(prev => ({ 
          ...prev, 
          clientName: selectedClient.cl_name,
          clientEmail: selectedClient.cl_email || ''
        }))
      }
    }
  }

  // Handle custom client name input
  const handleCustomClientNameChange = (name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      clientName: name,
      // Clear email if it was auto-populated from a selected client
      clientEmail: prev.clientEmail && clients.some(c => c.cl_email === prev.clientEmail) ? '' : prev.clientEmail
    }))
  }

  // Get the current selected value for the dropdown
  const getSelectedValue = () => {
    if (!formData.clientName) return ''
    // Check if the current client name matches any client in the list
    const matchingClient = clients.find(client => client.cl_name === formData.clientName)
    return matchingClient ? matchingClient.client_id.toString() : 'custom'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 Form submitted with data:', formData)
    
    const newEvent: CalendarEvent = {
      id: event?.id || Date.now().toString(),
      ...formData,
    }
    console.log('📅 Created calendar event:', newEvent)
    
    onSave(newEvent)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event Name */}
      <div>
        <Label htmlFor="title">Event Name *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event name"
          required
        />
      </div>

      {/* Client Name */}
      <div>
        <Label htmlFor="clientName">Client Name</Label>
        {isLoadingClients && <div className="text-sm text-gray-500 mb-2">Loading clients...</div>}
        <Select 
          value={getSelectedValue()} 
          onValueChange={handleClientChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select client or enter custom name" />
          </SelectTrigger>
          <SelectContent>
            {clients.length === 0 ? (
              <SelectItem value="custom" disabled>No clients found</SelectItem>
            ) : (
              <>
                <SelectItem value="custom">+ Add Custom Name</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id.toString()}>
                    {client.cl_name} (ID: {client.client_id})
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
        {formData.clientName && (
          <Input
            className="mt-2"
            value={formData.clientName}
            onChange={(e) => handleCustomClientNameChange(e.target.value)}
            placeholder="Enter client name"
          />
        )}
        <div className="text-xs text-gray-500 mt-1">
          {isLoadingClients ? 'Loading clients...' : 
           clients.length > 0 ? `${clients.length} clients available` : 'No clients found'}
          {formData.clientName && !clients.some(c => c.cl_name === formData.clientName) && (
            <span className="ml-2 text-blue-600">(Custom name)</span>
          )}
        </div>
      </div>

      {/* Email Address */}
      <div>
        <Label htmlFor="clientEmail">Email Address</Label>
        <Input
          id="clientEmail"
          type="email"
          value={formData.clientEmail}
          onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
          placeholder="Enter email address"
        />
      </div>

      {/* Type, Time, Duration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="check-in">Check-in</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="fitness">Fitness</SelectItem>
              <SelectItem value="nutrition">Nutrition</SelectItem>
              <SelectItem value="assessment">Assessment</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="group_session">Group Session</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (min) *</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            max="480"
            step="15"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={format(formData.date, "yyyy-MM-dd")}
          onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
          required
        />
      </div>

      {/* Zoom/Google Meet Link */}
      <div>
        <Label htmlFor="meetingUrl">Zoom/Google Meet Link</Label>
        <Input
          id="meetingUrl"
          type="url"
          value={formData.meetingUrl}
          onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
          placeholder="https://zoom.us/j/... or https://meet.google.com/..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          {event ? "Update" : "Create"} Event
        </Button>
      </div>
    </form>
  )
}

// Event Card Component
const EventCard: React.FC<{
  event: CalendarEvent
  onEdit: (event: CalendarEvent) => void
  onDelete: (id: string) => void
  compact?: boolean
}> = ({ event, onEdit, onDelete, compact = false }) => {
  const typeColor = eventTypeColors[event.type]
  
  return (
    <div 
      className={`group ${typeColor.bg} ${typeColor.border} ${typeColor.text} ${typeColor.dark} rounded-lg p-2 border-l-4 cursor-pointer hover:shadow-md transition-all duration-200`}
      style={{ borderLeftColor: event.color }}
      onClick={() => onEdit(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium">{event.time}</span>
            <span className="text-xs opacity-75">({event.duration}min)</span>
          </div>
          <h4 className="font-medium text-sm truncate">{event.title}</h4>
          {event.clientName && (
            <div className="flex items-center gap-1 mt-1">
              <User className="h-3 w-3" />
              <span className="text-xs opacity-75">{event.clientName}</span>
            </div>
          )}
          {event.clientEmail && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs opacity-75">{event.clientEmail}</span>
            </div>
          )}
          {!compact && event.meetingUrl && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs opacity-75 text-blue-600">🔗 Meeting Link</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(event)
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={(e) => e.stopPropagation()}
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{event.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(event.id)
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

// Professional Calendar Component
const ProfessionalCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [session, setSession] = useState<any>(null)

  // Navigation functions
  const handlePrev = () => {
    switch (view) {
      case "daily":
        setCurrentDate(prev => subDays(prev, 1))
        break
      case "weekly":
        setCurrentDate(prev => subWeeks(prev, 1))
        break
      case "monthly":
        setCurrentDate(prev => subMonths(prev, 1))
        break
    }
  }

  const handleNext = () => {
    switch (view) {
      case "daily":
        setCurrentDate(prev => addDays(prev, 1))
        break
      case "weekly":
        setCurrentDate(prev => addWeeks(prev, 1))
        break
      case "monthly":
        setCurrentDate(prev => addMonths(prev, 1))
        break
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Event handlers
  // Load events from Supabase
  const loadEvents = async () => {
    try {
      setIsLoading(true)
      let eventsData: ScheduleEvent[] = []
      
      switch (view) {
        case "daily":
          eventsData = await ScheduleService.getDayEvents(currentDate)
          break
        case "weekly":
          eventsData = await ScheduleService.getWeekEvents(currentDate)
          break
        case "monthly":
          const monthStart = startOfMonth(currentDate)
          const monthEnd = endOfMonth(currentDate)
          eventsData = await ScheduleService.getTrainerEvents(monthStart, monthEnd)
          break
      }
      
      // Convert to calendar format
      const calendarEvents = eventsData.map(event => ({
        id: event.id?.toString() || Date.now().toString(),
        date: parseISO(event.start_time),
        title: event.title,
        description: event.description || '',
        type: event.event_type,
        time: ScheduleUtils.formatTime(event.start_time),
        duration: event.duration_minutes,
        clientName: event.client_name,
        clientEmail: event.client_email,
        meetingUrl: event.meeting_url,
        color: event.color
      }))
      
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get session on component mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  // Load events when view or date changes
  useEffect(() => {
    loadEvents()
  }, [view, currentDate])

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      setIsLoading(true)
      console.log('🔄 Saving event:', event)
      
      if (editingEvent) {
        console.log('📝 Updating existing event...')
        // Update existing event
        // Calculate start_time and end_time properly
        const startTime = new Date(event.date)
        const [hours, minutes] = event.time.split(':').map(Number)
        startTime.setHours(hours, minutes, 0, 0)
        
        const endTime = new Date(startTime.getTime() + event.duration * 60000)
        
        const updateData: any = {
          title: event.title,
          description: event.description,
          event_type: event.type,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: event.duration,
          client_name: event.clientName,
          client_email: event.clientEmail,
          meeting_url: event.meetingUrl,
          color: event.color || ScheduleUtils.getEventTypeColor(event.type)
          // Note: updated_by will be set by ScheduleService.updateEvent using trainer profile
        }
        
        console.log('📊 Update data:', updateData)
        const updatedEvent = await ScheduleService.updateEvent({
          id: event.id,
          ...updateData
        })
        console.log('✅ Event updated:', updatedEvent)
        
        setEvents(prev => prev.map(e => e.id === event.id ? event : e))
      } else {
        console.log('➕ Creating new event...')
        // Create new event
        // Calculate start_time and end_time properly
        const startTime = new Date(event.date)
        const [hours, minutes] = event.time.split(':').map(Number)
        startTime.setHours(hours, minutes, 0, 0)
        
        const endTime = new Date(startTime.getTime() + event.duration * 60000)
        
        const createData: CreateScheduleEvent = {
          title: event.title,
          description: event.description,
          event_type: event.type,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: event.duration,
          client_name: event.clientName,
          client_email: event.clientEmail,
          meeting_url: event.meetingUrl,
          color: event.color || ScheduleUtils.getEventTypeColor(event.type),
          // Add trainer information from session
          trainer_id: session.user.id,
          trainer_email: session.user.email
        }
        
        console.log('📊 Create data:', createData)
        const newEvent = await ScheduleService.createEvent(createData)
        console.log('✅ Event created:', newEvent)
        
        // Add to local state
        const calendarEvent = {
          id: newEvent.id?.toString() || Date.now().toString(),
          date: parseISO(newEvent.start_time),
          title: newEvent.title,
          description: newEvent.description || '',
          type: newEvent.event_type,
          time: ScheduleUtils.formatTime(newEvent.start_time),
          duration: newEvent.duration_minutes,
          clientName: newEvent.client_name,
          clientEmail: newEvent.client_email,
          meetingUrl: newEvent.meeting_url,
          color: newEvent.color
        }
        
        console.log('📅 Calendar event to add:', calendarEvent)
        setEvents(prev => [...prev, calendarEvent])
        console.log('✅ Event added to local state')
      }
      
      setEditingEvent(undefined)
      setSelectedDate(undefined)
      console.log('✅ Event save completed successfully')
    } catch (error) {
      console.error('❌ Error saving event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      console.log('🗑️ Deleting event with ID:', id)
      
      // Convert string ID to number for database
      const numericId = parseInt(id)
      if (isNaN(numericId)) {
        console.error('❌ Invalid event ID:', id)
        return
      }
      
      // Delete from database
      await ScheduleService.deleteEvent(numericId)
      console.log('✅ Event deleted from database')
      
      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== id))
      console.log('✅ Event removed from local state')
    } catch (error) {
      console.error('❌ Error deleting event:', error)
      // You might want to show a toast notification here
    }
  }

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date)
    setEditingEvent(undefined)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingEvent(undefined)
    setSelectedDate(undefined)
  }

  // Time slots for daily view
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 22) slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Render different views
  const renderDailyView = () => {
    const dayEvents = getEventsForDay(currentDate, events)
    
    return (
      <div className="h-[600px] overflow-y-auto">
        <div className="grid grid-cols-1 gap-0">
          {timeSlots.map((time) => {
            const timeEvents = getEventsForTimeSlot(currentDate, time, events)
            return (
              <div key={time} className="relative min-h-[60px] border-b border-gray-200 dark:border-gray-700">
                <div className="absolute left-0 top-0 w-16 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{time}</span>
                </div>
                <div className="ml-16 p-2 min-h-[60px]">
                  {timeEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const [hours, minutes] = time.split(':').map(Number)
                      const eventDate = new Date(currentDate)
                      eventDate.setHours(hours, minutes, 0, 0)
                      handleAddEvent(eventDate)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    return (
      <div className="h-[600px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-0">
          {/* Time column */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            {timeSlots.map((time) => (
              <div key={time} className="h-[60px] border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{time}</span>
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day, events)
            const isCurrentDay = isToday(day)
            
            return (
              <div key={day.toISOString()} className="relative border-r border-gray-200 dark:border-gray-700">
                {/* Day header */}
                <div className={`h-12 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center ${
                  isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-sm font-bold ${
                    isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Time slots */}
                {timeSlots.map((time) => {
                  const timeEvents = getEventsForTimeSlot(day, time, events)
                  return (
                    <div key={time} className="relative h-[60px] border-b border-gray-200 dark:border-gray-700 p-1">
                      {timeEvents.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                          compact={true}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
    
    return (
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="h-10 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{day}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        {weeks.map((weekStart, weekIndex) => {
          const weekDays = eachDayOfInterval({ 
            start: weekStart, 
            end: addDays(weekStart, 6) 
          })
          
          return (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {weekDays.map((day: Date) => {
              const dayEvents = getEventsForDay(day, events)
              const isCurrentDay = isToday(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg ${
                    isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                      onClick={() => handleAddEvent(day)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                        compact={true}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Professional Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
              <Button
                variant={view === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("daily")}
                className="rounded-none border-0"
              >
                <List className="h-4 w-4 mr-1" />
                Daily
              </Button>
              <Button
                variant={view === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("weekly")}
                className="rounded-none border-0"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Weekly
              </Button>
              <Button
                variant={view === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("monthly")}
                className="rounded-none border-0"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Monthly
              </Button>
            </div>
            
            {/* Add Event Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
                </DialogHeader>
                <EventForm
                  event={editingEvent}
                  selectedDate={selectedDate}
                  onSave={handleSaveEvent}
                  onClose={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {view === "daily" && format(currentDate, "EEEE, MMMM d, yyyy")}
            {view === "weekly" && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`}
            {view === "monthly" && format(currentDate, "MMMM yyyy")}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {view === "daily" && renderDailyView()}
        {view === "weekly" && renderWeeklyView()}
        {view === "monthly" && renderMonthlyView()}
      </CardContent>
    </Card>
  )
}

export default ProfessionalCalendar 