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
    if (!formData.clientName) return 'custom'
    // Check if the current client name matches any client in the list
    const matchingClient = clients.find(client => client.cl_name === formData.clientName)
    return matchingClient ? matchingClient.client_id.toString() : 'custom'
  }

  // Check if we should show the custom input field
  const shouldShowCustomInput = () => {
    if (!formData.clientName) return true // Always show if no client name
    // Show if it's a custom name (not matching any client in the list)
    return !clients.some(client => client.cl_name === formData.clientName)
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
            <SelectValue placeholder="Select existing client or add custom name" />
          </SelectTrigger>
          <SelectContent>
            {clients.length === 0 ? (
              <SelectItem value="custom">+ Add Custom Name</SelectItem>
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
        {shouldShowCustomInput() && (
          <div className="mt-2">
            <Input
              value={formData.clientName}
              onChange={(e) => handleCustomClientNameChange(e.target.value)}
              placeholder="Enter custom client name"
              className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <span>✏️</span>
              <span>Custom client - not in your client list</span>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          {isLoadingClients ? 'Loading clients...' : 
           clients.length > 0 ? `${clients.length} existing clients available` : 'No existing clients found'}
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
            min="1"
            max="480"
            step="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
            placeholder="Enter duration in minutes"
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

// Event Card Component - Enhanced with better contrast and type-specific colors
const EventCard: React.FC<{
  event: CalendarEvent
  onEdit: (event: CalendarEvent) => void
  onDelete: (id: string) => void
  compact?: boolean
  proportional?: boolean // New prop for proportional rendering
}> = ({ event, onEdit, onDelete, compact = false, proportional = false }) => {
  const typeColor = eventTypeColors[event.type]
  
  return (
    <div 
      className={`group ${typeColor.bg} ${typeColor.dark} border ${typeColor.border} rounded-md cursor-pointer hover:shadow-lg transition-all duration-200 h-full overflow-hidden relative`}
      style={{ 
        borderLeftColor: event.color || typeColor.border,
        borderLeftWidth: '4px'
      }}
      onClick={() => onEdit(event)}
    >
      {compact ? (
        // Single row layout for weekly view (same as daily)
        <div className="flex items-center h-full p-1 justify-between">
          {/* Main content in a single row */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Title */}
            <h4 className={`font-medium text-xs leading-tight truncate flex-1 ${typeColor.text}`}>{event.title}</h4>
            
            {/* Client name */}
            {event.clientName && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <User className="h-2 w-2 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-16">{event.clientName}</span>
              </div>
            )}
            
            {/* Time and duration */}
            <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
              <Clock className="h-2 w-2" />
              <span>{event.time}</span>
              {event.duration > 0 && (
                <span>• {event.duration}m</span>
              )}
            </div>
            
            {/* Meeting link indicator */}
            {event.meetingUrl && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-blue-600 dark:text-blue-400">🔗</span>
              </div>
            )}
          </div>
          
          {/* Action buttons for compact view */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(event)
              }}
            >
              <Edit2 className="h-2 w-2 text-gray-600 dark:text-gray-300" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-red-600 hover:text-red-700 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <X className="h-2 w-2" />
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
      ) : (
      <div className="flex items-center h-full p-2 justify-between">
        {/* Main content in a single row */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Title */}
          <h4 className={`font-medium text-sm leading-tight truncate flex-1 ${typeColor.text}`}>{event.title}</h4>
          
          {/* Client name */}
          {event.clientName && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-24">{event.clientName}</span>
            </div>
          )}
          
          {/* Time and duration */}
          <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 flex-shrink-0">
            <Clock className="h-3 w-3" />
            <span>{event.time}</span>
            {event.duration > 0 && (
              <span>• {event.duration}min</span>
            )}
          </div>
          
          {/* Meeting link indicator */}
          {event.meetingUrl && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className={`text-xs ${typeColor.text} font-medium`}>🔗 Meeting</span>
            </div>
          )}
        </div>
        
        {/* Action buttons - Enhanced with better contrast */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(event)
            }}
          >
            <Edit2 className="h-3 w-3 text-gray-600 dark:text-gray-300" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-600"
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
      )}
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

  // Time slots for daily view - Google Calendar style with better spacing
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 22) slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [])

  // Hour slots for better time display
  const hourSlots = useMemo(() => {
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }, [])

  // Render different views
  const renderDailyView = () => {
    const dayEvents = getEventsForDay(currentDate, events)
    
    // Google Calendar style - more zoomed in with better spacing
    const startHour = 6
    const endHour = 22
    const totalMinutes = (endHour - startHour) * 60
    const containerHeight = 1200 // Increased height for better zoom
    const timeSlotHeight = 60 // 60px per 30-minute slot
    
    // Calculate pixels per minute for proportional display
    const pixelsPerMinute = containerHeight / totalMinutes
    
    return (
      <div className="h-[800px] overflow-y-auto relative bg-white dark:bg-gray-900">
        {/* Time grid background - Google Calendar style */}
        <div className="absolute inset-0 ml-20">
          {hourSlots.map((time, index) => {
            const [hours] = time.split(':').map(Number)
            const minutesFromStart = (hours - startHour) * 60
            const top = minutesFromStart * pixelsPerMinute
            
            return (
              <div 
                key={time} 
                className="absolute left-0 right-0 border-b-2 border-gray-100 dark:border-gray-700"
                style={{ top: `${top}px`, height: `${timeSlotHeight * 2}px` }}
              />
            )
          })}
          
          {/* Half-hour lines */}
          {timeSlots.filter((_, index) => index % 2 === 1).map((time) => {
            const [hours, minutes] = time.split(':').map(Number)
            const minutesFromStart = (hours - startHour) * 60 + minutes
            const top = minutesFromStart * pixelsPerMinute
            
            return (
              <div 
                key={time} 
                className="absolute left-0 right-0 border-b border-gray-50 dark:border-gray-800"
                style={{ top: `${top}px`, height: `${timeSlotHeight}px` }}
              />
            )
          })}
        </div>
        
        {/* Time labels - Google Calendar style */}
        <div className="absolute left-0 top-0 w-20 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {hourSlots.map((time) => {
            const [hours] = time.split(':').map(Number)
            const minutesFromStart = (hours - startHour) * 60
            const top = minutesFromStart * pixelsPerMinute
            
            return (
              <div 
                key={time} 
                className="absolute flex items-start justify-end w-full pr-2 pt-1"
                style={{ top: `${top}px`, height: `${timeSlotHeight * 2}px` }}
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {hours === 12 ? '12 PM' : hours > 12 ? `${hours - 12} PM` : `${hours} AM`}
                </span>
              </div>
            )
          })}
        </div>
        
        {/* Events positioned absolutely with proportional sizing */}
        <div className="ml-20 relative h-full">
          {dayEvents.map((event) => {
            const eventDate = new Date(event.date)
            const eventHours = eventDate.getHours()
            const eventMinutes = eventDate.getMinutes()
            
            // Calculate position based on start time
            const minutesFromStart = (eventHours - startHour) * 60 + eventMinutes
            const top = minutesFromStart * pixelsPerMinute
            
            // Calculate height based on duration for proportional display
            const height = Math.max(event.duration * pixelsPerMinute, 24) // Minimum 24px height
            
            return (
              <div
                key={event.id}
                className="absolute left-2 right-2 rounded-md cursor-pointer hover:shadow-lg transition-all duration-200"
                style={{ 
                  top: `${top}px`, 
                  height: `${height}px`,
                  minHeight: '24px' // Minimum height for visibility
                }}
              >
                <EventCard
                  event={event}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  proportional={true}
                />
              </div>
            )
          })}
        </div>
        
        {/* Add event button overlay - Google Calendar style */}
        <div className="absolute inset-0 ml-20 pointer-events-none">
          <div className="relative h-full">
            {timeSlots.map((time) => {
              const [hours, minutes] = time.split(':').map(Number)
              const minutesFromStart = (hours - startHour) * 60 + minutes
              const top = minutesFromStart * pixelsPerMinute
              
              return (
                <div 
                  key={time}
                  className="absolute left-0 right-0 flex justify-center pointer-events-auto"
                  style={{ top: `${top}px`, height: '60px' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700"
                    onClick={() => {
                      const eventDate = new Date(currentDate)
                      eventDate.setHours(hours, minutes, 0, 0)
                      handleAddEvent(eventDate)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    // Enhanced weekly view with increased height and 30-minute ticks
    const startHour = 6
    const endHour = 22
    const totalMinutes = (endHour - startHour) * 60
    const containerHeight = 1200 - 48 // Increased height for better zoom
    const pixelsPerMinute = containerHeight / totalMinutes
    const timeSlotHeight = 120 // 120px per hour (60px per 30-minute slot)
    
    return (
      <div className="h-[1200px] overflow-y-auto bg-white dark:bg-gray-900">
        <div className="grid grid-cols-8 gap-0">
          {/* Time column - Enhanced with 30-minute ticks */}
          <div className="relative border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Time header */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Time</span>
            </div>
            
            {/* Time labels with 30-minute ticks */}
            <div className="relative h-[1152px]">
              {timeSlots.map((time) => {
                const [hours, minutes] = time.split(':').map(Number)
                const minutesFromStart = (hours - startHour) * 60 + minutes
                const top = minutesFromStart * pixelsPerMinute
                const isHourMark = minutes === 0
                
                return (
                  <div 
                    key={time} 
                    className="absolute flex items-start justify-end w-full pr-2 pt-1"
                    style={{ top: `${top}px`, height: `${timeSlotHeight}px` }}
                  >
                    <span className={`font-medium text-gray-600 dark:text-gray-400 ${
                      isHourMark ? 'text-sm' : 'text-xs'
                    }`}>
                      {isHourMark 
                        ? (hours === 12 ? '12 PM' : hours > 12 ? `${hours - 12} PM` : `${hours} AM`)
                        : `${minutes}`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Day columns with proportional event positioning */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day, events)
            const isCurrentDay = isToday(day)
            
            return (
              <div key={day.toISOString()} className="relative border-r border-gray-200 dark:border-gray-700">
                {/* Day header - Google Calendar style */}
                <div className={`h-12 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center ${
                  isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
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
                
                {/* Time grid background - Enhanced with 30-minute ticks */}
                <div className="relative h-[1152px]">
                  {/* Hour lines */}
                  {hourSlots.map((time) => {
                    const [hours] = time.split(':').map(Number)
                    const minutesFromStart = (hours - startHour) * 60
                    const top = minutesFromStart * pixelsPerMinute
                    
                    return (
                      <div 
                        key={time} 
                        className="absolute left-0 right-0 border-b-2 border-gray-100 dark:border-gray-700"
                        style={{ top: `${top}px`, height: `${timeSlotHeight * 2}px` }}
                      />
                    )
                  })}
                  
                  {/* 30-minute lines */}
                  {timeSlots.filter((_, index) => index % 2 === 1).map((time) => {
                    const [hours, minutes] = time.split(':').map(Number)
                    const minutesFromStart = (hours - startHour) * 60 + minutes
                    const top = minutesFromStart * pixelsPerMinute
                    
                    return (
                      <div 
                        key={time} 
                        className="absolute left-0 right-0 border-b border-gray-50 dark:border-gray-800"
                        style={{ top: `${top}px`, height: `${timeSlotHeight}px` }}
                      />
                    )
                  })}
                  
                  {/* Events positioned absolutely with proportional sizing */}
                  {dayEvents.map((event) => {
                    const eventDate = new Date(event.date)
                    const eventHours = eventDate.getHours()
                    const eventMinutes = eventDate.getMinutes()
                    
                    // Calculate position based on start time
                    const minutesFromStart = (eventHours - startHour) * 60 + eventMinutes
                    const top = minutesFromStart * pixelsPerMinute
                    
                    // Calculate height based on duration for proportional display
                    const height = Math.max(event.duration * pixelsPerMinute, 20) // Minimum 20px height
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 rounded-md cursor-pointer hover:shadow-lg transition-all duration-200"
                        style={{ 
                          top: `${top}px`, 
                          height: `${height}px`,
                          minHeight: '20px' // Minimum height for visibility
                        }}
                      >
                        <EventCard
                          event={event}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                          compact={true}
                          proportional={true}
                        />
                      </div>
                    )
                  })}
                  
                  {/* Add event button overlay - Enhanced for 30-minute slots */}
                  <div className="absolute inset-0 pointer-events-none">
                    {timeSlots.map((time) => {
                      const [hours, minutes] = time.split(':').map(Number)
                      const minutesFromStart = (hours - startHour) * 60 + minutes
                      const top = minutesFromStart * pixelsPerMinute
                      
                      return (
                        <div 
                          key={time}
                          className="absolute left-0 right-0 flex justify-center pointer-events-auto"
                          style={{ top: `${top}px`, height: '60px' }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-700/80"
                            onClick={() => {
                              const eventDate = new Date(day)
                              eventDate.setHours(hours, minutes, 0, 0)
                              handleAddEvent(eventDate)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
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
            {/* View Toggle - Improved styling for better clickability */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative z-10">
              <Button
                variant={view === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("daily")}
                className={`rounded-none border-0 px-4 py-2 transition-all duration-200 cursor-pointer ${
                  view === "daily" 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <List className="h-4 w-4 mr-2" />
                Daily
              </Button>
              <Button
                variant={view === "weekly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("weekly")}
                className={`rounded-none border-0 px-4 py-2 transition-all duration-200 cursor-pointer ${
                  view === "weekly" 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Weekly
              </Button>
              <Button
                variant={view === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("monthly")}
                className={`rounded-none border-0 px-4 py-2 transition-all duration-200 cursor-pointer ${
                  view === "monthly" 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
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