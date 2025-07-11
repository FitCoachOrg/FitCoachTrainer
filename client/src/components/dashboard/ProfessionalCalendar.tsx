"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  List
} from "lucide-react"
import { ScheduleService, ScheduleUtils, type ScheduleEvent, type CreateScheduleEvent } from "@/lib/schedule-service"

interface CalendarEvent {
  id: string
  date: Date
  title: string
  description: string
  type: "consultation" | "check-in" | "meeting" | "fitness" | "nutrition" | "assessment" | "follow-up" | "group_session"
  time: string
  duration: number // in minutes
  clientName?: string
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
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    type: event?.type || "consultation",
    time: event?.time || "09:00",
    duration: event?.duration || 60,
    clientName: event?.clientName || "",
    date: event?.date || selectedDate || new Date(),
    color: event?.color || "#3B82F6"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newEvent: CalendarEvent = {
      id: event?.id || Date.now().toString(),
      ...formData,
    }
    onSave(newEvent)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="clientName">Client Name (Optional)</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
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
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration (min)</Label>
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

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={format(formData.date, "yyyy-MM-dd")}
          onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
          required
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
      className={`${typeColor.bg} ${typeColor.border} ${typeColor.text} ${typeColor.dark} rounded-lg p-2 border-l-4 cursor-pointer hover:shadow-md transition-all duration-200`}
      style={{ borderLeftColor: event.color }}
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
          {!compact && event.description && (
            <p className="text-xs mt-1 opacity-75 line-clamp-2">{event.description}</p>
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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(event.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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
        color: event.color
      }))
      
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load events when view or date changes
  useEffect(() => {
    loadEvents()
  }, [view, currentDate])

  const handleSaveEvent = async (event: CalendarEvent) => {
    try {
      setIsLoading(true)
      
      if (editingEvent) {
        // Update existing event
        const updateData: any = {
          title: event.title,
          description: event.description,
          event_type: event.type,
          start_time: event.date.toISOString(),
          end_time: new Date(event.date.getTime() + event.duration * 60000).toISOString(),
          duration_minutes: event.duration,
          client_name: event.clientName,
          color: event.color || ScheduleUtils.getEventTypeColor(event.type)
        }
        
        await ScheduleService.updateEvent({
          id: event.id,
          ...updateData
        })
        
        setEvents(prev => prev.map(e => e.id === event.id ? event : e))
      } else {
        // Create new event
        const createData: CreateScheduleEvent = {
          title: event.title,
          description: event.description,
          event_type: event.type,
          start_time: event.date.toISOString(),
          end_time: new Date(event.date.getTime() + event.duration * 60000).toISOString(),
          duration_minutes: event.duration,
          client_name: event.clientName,
          color: event.color || ScheduleUtils.getEventTypeColor(event.type)
        }
        
        const newEvent = await ScheduleService.createEvent(createData)
        
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
          color: newEvent.color
        }
        
        setEvents(prev => [...prev, calendarEvent])
      }
      
      setEditingEvent(undefined)
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Error saving event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsDialogOpen(true)
  }

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
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