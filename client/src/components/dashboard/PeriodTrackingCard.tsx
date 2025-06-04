"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addDays, subDays, isSameDay, isToday } from "date-fns"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, User } from "lucide-react"

interface Appointment {
  id: string
  date: Date
  title: string
  description: string
  type: "consultation" | "check-in" | "meeting" | "fitness" | "nutrition"
  time: string
  clientName?: string
}

// Sample appointment data with more details
const initialAppointments: Appointment[] = [
  {
    id: "1",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
    title: "Nutrition Check-in",
    description: "Monthly nutrition plan review",
    type: "nutrition",
    time: "09:00",
    clientName: "Sarah Johnson",
  },
  {
    id: "2",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2),
    title: "Team Meeting",
    description: "Monthly review and planning",
    type: "meeting",
    time: "14:00",
  },
  {
    id: "3",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2),
    title: "Fitness Plan Update",
    description: "Quarterly fitness assessment",
    type: "fitness",
    time: "16:30",
    clientName: "Tom Lee",
  },
  {
    id: "4",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 4),
    title: "New Client Consultation",
    description: "Initial consultation and goal setting",
    type: "consultation",
    time: "10:00",
    clientName: "Mike Chen",
  },
  {
    id: "5",
    date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6),
    title: "Progress Check",
    description: "6-week progress evaluation",
    type: "check-in",
    time: "11:00",
    clientName: "Anna Kim",
  },
]

const appointmentTypeColors = {
  consultation: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300",
  "check-in":
    "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300",
  meeting:
    "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300",
  fitness:
    "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300",
  nutrition:
    "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300",
}

const getAppointmentsForDay = (date: Date, appointments: Appointment[]) => {
  return appointments.filter((appt) => isSameDay(appt.date, date)).sort((a, b) => a.time.localeCompare(b.time))
}

const AppointmentForm: React.FC<{
  appointment?: Appointment
  selectedDate?: Date
  onSave: (appointment: Appointment) => void
  onClose: () => void
}> = ({ appointment, selectedDate, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: appointment?.title || "",
    description: appointment?.description || "",
    type: appointment?.type || "consultation",
    time: appointment?.time || "09:00",
    clientName: appointment?.clientName || "",
    date: appointment?.date || selectedDate || new Date(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newAppointment: Appointment = {
      id: appointment?.id || Date.now().toString(),
      ...formData,
    }
    onSave(newAppointment)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
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

      <div className="grid grid-cols-2 gap-4">
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
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          {appointment ? "Update" : "Create"} Appointment
        </Button>
      </div>
    </form>
  )
}

const AppointmentCard: React.FC<{
  appointment: Appointment
  onEdit: (appointment: Appointment) => void
  onDelete: (id: string) => void
}> = ({ appointment, onEdit, onDelete }) => {
  return (
    <div
      className={`${appointmentTypeColors[appointment.type]} rounded-lg p-2 border transition-all hover:shadow-sm group relative`}
    >
      <div className="relative group flex items-start justify-between">
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1 mb-1">
      <Clock className="h-3 w-3" />
      <span className="text-xs font-medium">{appointment.time}</span>
    </div>
    <div className="font-semibold text-xs truncate">{appointment.title}</div>
    {appointment.clientName && (
      <div className="flex items-center gap-1 mt-1">
        <User className="h-3 w-3" />
        <span className="text-xs truncate">{appointment.clientName}</span>
      </div>
    )}
    <div className="text-xs opacity-75 mt-1 line-clamp-2">{appointment.description}</div>
  </div>

  {/* Hover buttons */}
  <div className="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0"
      onClick={() => onEdit(appointment)}
    >
      <Edit2 className="h-3 w-3" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
      onClick={() => onDelete(appointment.id)}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>
</div>

    </div>
  )
}

const EnhancedCalendar: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
  }, [startDate])

  const handlePrevWeek = () => setStartDate((prev) => subDays(prev, 7))
  const handleNextWeek = () => setStartDate((prev) => addDays(prev, 7))

  const handleSaveAppointment = (appointment: Appointment) => {
    if (editingAppointment) {
      setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? appointment : a)))
    } else {
      setAppointments((prev) => [...prev, appointment])
    }
    setEditingAppointment(undefined)
    setSelectedDate(undefined)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setIsDialogOpen(true)
  }

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAddAppointment = (date: Date) => {
    setSelectedDate(date)
    setEditingAppointment(undefined)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAppointment(undefined)
    setSelectedDate(undefined)
  }

  return (
    <Card className="shadow-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Weekly Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4" />
                  Add Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAppointment ? "Edit Appointment" : "Add New Appointment"}</DialogTitle>
                </DialogHeader>
                <AppointmentForm
                  appointment={editingAppointment}
                  selectedDate={selectedDate}
                  onSave={handleSaveAppointment}
                  onClose={handleCloseDialog}
                />
              </DialogContent>
            </Dialog>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={handlePrevWeek} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {format(startDate, "MMM d")} - {format(addDays(startDate, 6), "MMM d, yyyy")}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((date, idx) => {
            const dayAppointments = getAppointmentsForDay(date, appointments)
            const isCurrentDay = isToday(date)

            return (
              <div
                key={idx}
                className={`min-h-[200px] rounded-xl border-2 transition-all hover:shadow-md ${
                  isCurrentDay
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
                    : "border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50"
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-center ${isCurrentDay ? "text-green-700 dark:text-green-300" : ""}`}>
                      <div className="text-xs font-medium uppercase tracking-wide">{format(date, "EEE")}</div>
                      <div
                        className={`text-lg font-bold ${
                          isCurrentDay
                            ? "bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1"
                            : ""
                        }`}
                      >
                        {format(date, "d")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      onClick={() => handleAddAppointment(date)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {dayAppointments.length > 0 ? (
                      dayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onEdit={handleEditAppointment}
                          onDelete={handleDeleteAppointment}
                        />
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-lg">
                        No appointments
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(appointmentTypeColors).map(([type, colorClass]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded border ${colorClass}`}></div>
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedCalendar
