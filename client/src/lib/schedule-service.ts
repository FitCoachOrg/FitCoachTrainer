/**
 * Schedule Service for Professional Calendar
 * Handles all schedule-related operations with Supabase
 */

import { supabase } from './supabase';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from 'date-fns';

// Types for schedule management
export interface ScheduleEvent {
  id?: number;
  title: string;
  description?: string;
  event_type: 'consultation' | 'check-in' | 'meeting' | 'fitness' | 'nutrition' | 'assessment' | 'follow-up' | 'group_session';
  start_time: string; // ISO string
  end_time: string; // ISO string
  duration_minutes: number;
  location?: string;
  is_virtual?: boolean;
  meeting_url?: string;
  meeting_platform?: string;
  trainer_id: string; // UUID
  trainer_email: string;
  client_id?: number; // bigint
  client_name?: string;
  client_email?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  parent_event_id?: number;
  color?: string;
  custom_color?: string;
  reminder_minutes?: number;
  send_reminder?: boolean;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string; // UUID
  updated_by?: string; // UUID
}

export interface CreateScheduleEvent {
  title: string;
  description?: string;
  event_type: ScheduleEvent['event_type'];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  location?: string;
  is_virtual?: boolean;
  meeting_url?: string;
  meeting_platform?: string;
  trainer_id?: string; // UUID
  trainer_email?: string;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  status?: ScheduleEvent['status'];
  priority?: ScheduleEvent['priority'];
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  color?: string;
  reminder_minutes?: number;
  send_reminder?: boolean;
}

export interface UpdateScheduleEvent extends Partial<CreateScheduleEvent> {
  id: number;
}

export interface ScheduleEventNote {
  id?: number;
  event_id: number;
  note_type?: 'general' | 'pre_session' | 'post_session' | 'follow_up' | 'assessment';
  title?: string;
  content: string;
  attachments?: any;
  created_by: string; // UUID
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrainerAvailability {
  id?: number;
  trainer_id: string; // UUID
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available?: boolean;
  max_bookings_per_slot?: number;
  valid_from: string; // YYYY-MM-DD format
  valid_until?: string; // YYYY-MM-DD format
  created_at?: string;
  updated_at?: string;
}

export interface TrainerTimeOff {
  id?: number;
  trainer_id: string; // UUID
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  time_off_type?: 'personal' | 'sick' | 'vacation' | 'training' | 'other';
  is_all_day?: boolean;
  auto_decline_bookings?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Utility functions for schedule management
export const ScheduleUtils = {
  /**
   * Convert calendar event to database format
   */
  calendarEventToScheduleEvent(event: any): CreateScheduleEvent {
    return {
      title: event.title,
      description: event.description,
      event_type: event.type,
      start_time: event.start_time,
      end_time: event.end_time,
      duration_minutes: event.duration_minutes,
      location: event.location,
      is_virtual: event.is_virtual,
      meeting_url: event.meeting_url,
      meeting_platform: event.meeting_platform,
      trainer_id: event.trainer_id,
      trainer_email: event.trainer_email,
      client_id: event.client_id,
      client_name: event.client_name,
      client_email: event.client_email,
      status: event.status,
      priority: event.priority,
      is_recurring: event.is_recurring,
      recurring_pattern: event.recurring_pattern,
      recurring_end_date: event.recurring_end_date,
      color: event.color,
      reminder_minutes: event.reminder_minutes,
      send_reminder: event.send_reminder
    }
  },

  /**
   * Convert database event to calendar format
   */
  scheduleEventToCalendarEvent(event: ScheduleEvent): any {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.event_type,
      start_time: event.start_time,
      end_time: event.end_time,
      duration_minutes: event.duration_minutes,
      location: event.location,
      is_virtual: event.is_virtual,
      meeting_url: event.meeting_url,
      meeting_platform: event.meeting_platform,
      client_id: event.client_id,
      client_name: event.client_name,
      client_email: event.client_email,
      status: event.status,
      priority: event.priority,
      is_recurring: event.is_recurring,
      recurring_pattern: event.recurring_pattern,
      recurring_end_date: event.recurring_end_date,
      color: event.color,
      reminder_minutes: event.reminder_minutes,
      send_reminder: event.send_reminder,
      created_at: event.created_at,
      updated_at: event.updated_at
    }
  },

  /**
   * Format time for display in local timezone
   */
  formatTime(time: string): string {
    // Parse ISO string and format in local timezone
    const date = parseISO(time)
    return format(date, 'HH:mm')
  },

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    return format(parseISO(date), 'MMM d, yyyy')
  },

  /**
   * Get event type color
   */
  getEventTypeColor(eventType: ScheduleEvent['event_type']): string {
    const colors = {
      consultation: '#3B82F6',
      'check-in': '#10B981',
      meeting: '#8B5CF6',
      fitness: '#F59E0B',
      nutrition: '#059669',
      assessment: '#EF4444',
      'follow-up': '#06B6D4',
      group_session: '#EC4899'
    }
    return colors[eventType] || '#6B7280'
  }
}

// Schedule Service Class
export class ScheduleService {
  // Ensure a trainer profile row exists for the authenticated user (required by FK on schedule_events)
  static async ensureTrainerProfile(userId: string, userEmail: string): Promise<{ id: string, trainer_email: string } | null> {
    try {
      // Check if trainer record exists by email (more reliable than by id)
      const { data: existingTrainer, error: checkError } = await supabase
        .from('trainer')
        .select('id, trainer_email')
        .eq('trainer_email', userEmail)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means "not found"
        console.error('Error checking existing trainer profile:', checkError)
        throw checkError
      }

      if (existingTrainer) {
        console.log('✅ Found existing trainer profile:', existingTrainer)
        return existingTrainer
      }

      // If not found, create a minimal trainer record
      console.log(`Trainer profile for ${userEmail} not found, creating minimal record...`)
      const { data: newTrainer, error: insertError } = await supabase
        .from('trainer')
        .insert([
          {
            id: userId,
            trainer_email: userEmail,
            trainer_name: userEmail.split('@')[0], // Default name from email
            is_active: true,
            terms_accepted: true,
            privacy_accepted: true,
            profile_completion_percentage: 20 // Basic profile
          }
        ])
        .select('id, trainer_email')
        .single()

      if (insertError) {
        console.error('Error creating minimal trainer profile:', insertError)
        throw insertError
      }

      console.log('Minimal trainer profile created successfully.')
      return newTrainer
    } catch (error) {
      console.error('Failed to ensure trainer profile:', error)
      return null
    }
  }
  // Get events for a date range
  static async getEvents(trainerId: string, startDate: string, endDate: string): Promise<ScheduleEvent[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('trainer_id', trainerId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Get events for a specific week
  static async getWeekEvents(date: Date): Promise<ScheduleEvent[]> {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
    return this.getTrainerEvents(weekStart, weekEnd)
  }

  // Get events for a specific day
  static async getDayEvents(date: Date): Promise<ScheduleEvent[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    return this.getTrainerEvents(startOfDay, endOfDay)
  }

  // Get trainer events for a date range
  static async getTrainerEvents(startDate: Date, endDate: Date): Promise<ScheduleEvent[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('trainer_email', user.email!)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching trainer events:', error)
      throw error
    }
  }

  // Create a new event
  static async createEvent(event: CreateScheduleEvent): Promise<ScheduleEvent> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Look up trainer UUID from trainer table by email (FK requires trainer.id)
      const { data: trainerRow, error: trainerLookupError } = await supabase
        .from('trainer')
        .select('id')
        .eq('trainer_email', user.email!)
        .single()

      if (trainerLookupError || !trainerRow?.id) {
        console.error('Unable to resolve trainer.id from trainer_email; check trainer RLS/policy:', trainerLookupError)
        throw new Error('Trainer profile not accessible. Ensure trainer RLS allows self-select.')
      }

      const eventData: Partial<ScheduleEvent> = {
        ...event,
        trainer_id: trainerRow.id,
        trainer_email: user.email!,
        created_by: trainerRow.id,
        updated_by: trainerRow.id,
        status: event.status || 'scheduled',
        priority: event.priority || 'medium',
        is_virtual: event.is_virtual || false,
        color: event.color || ScheduleUtils.getEventTypeColor(event.event_type),
        reminder_minutes: event.reminder_minutes || 15,
        send_reminder: event.send_reminder !== false,
        is_recurring: event.is_recurring || false
      }

      const { data, error } = await supabase
        .from('schedule_events')
        .insert(eventData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  // Update an existing event
  static async updateEvent(eventData: UpdateScheduleEvent): Promise<ScheduleEvent> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get trainer profile to ensure we have the correct trainer_id
      const trainerProfile = await ScheduleService.ensureTrainerProfile(user.id, user.email!)
      if (!trainerProfile) throw new Error('Trainer profile could not be ensured.')

      const { data, error } = await supabase
        .from('schedule_events')
        .update({
          ...eventData,
          updated_by: trainerProfile.id, // Use the resolved trainer_id
          updated_at: new Date().toISOString()
        })
        .eq('id', eventData.id)
        .eq('trainer_email', user.email!) // Ensure trainer owns the event
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  // Delete an event
  static async deleteEvent(id: number): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', id)
        .eq('trainer_email', user.email!) // Ensure trainer owns the event

      if (error) throw error
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  }

  // Get event notes
  static async getEventNotes(eventId: number): Promise<ScheduleEventNote[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_event_notes')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching event notes:', error);
      throw error;
    }
  }

  // Create event note
  static async createEventNote(note: Omit<ScheduleEventNote, 'id'>): Promise<ScheduleEventNote> {
    try {
      const { data, error } = await supabase
        .from('schedule_event_notes')
        .insert([note])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating event note:', error);
      throw error;
    }
  }

  // Update event note
  static async updateEventNote(id: number, updates: Partial<ScheduleEventNote>): Promise<ScheduleEventNote> {
    try {
      const { data, error } = await supabase
        .from('schedule_event_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating event note:', error);
      throw error;
    }
  }

  // Delete event note
  static async deleteEventNote(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedule_event_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting event note:', error);
      throw error;
    }
  }

  // Get trainer availability
  static async getTrainerAvailability(trainerId: string): Promise<TrainerAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('day_of_week');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trainer availability:', error);
      throw error;
    }
  }

  // Create trainer availability
  static async createTrainerAvailability(availability: Omit<TrainerAvailability, 'id'>): Promise<TrainerAvailability> {
    try {
      const { data, error } = await supabase
        .from('trainer_availability')
        .insert([availability])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating trainer availability:', error);
      throw error;
    }
  }

  // Update trainer availability
  static async updateTrainerAvailability(id: number, updates: Partial<TrainerAvailability>): Promise<TrainerAvailability> {
    try {
      const { data, error } = await supabase
        .from('trainer_availability')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating trainer availability:', error);
      throw error;
    }
  }

  // Delete trainer availability
  static async deleteTrainerAvailability(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('trainer_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting trainer availability:', error);
      throw error;
    }
  }

  // Get trainer time off
  static async getTrainerTimeOff(trainerId: string, startDate?: string, endDate?: string): Promise<TrainerTimeOff[]> {
    try {
      let query = supabase
        .from('trainer_time_off')
        .select('*')
        .eq('trainer_id', trainerId);

      if (startDate) {
        query = query.gte('start_time', startDate);
      }
      if (endDate) {
        query = query.lte('end_time', endDate);
      }

      const { data, error } = await query.order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trainer time off:', error);
      throw error;
    }
  }

  // Create trainer time off
  static async createTrainerTimeOff(timeOff: Omit<TrainerTimeOff, 'id'>): Promise<TrainerTimeOff> {
    try {
      const { data, error } = await supabase
        .from('trainer_time_off')
        .insert([timeOff])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating trainer time off:', error);
      throw error;
    }
  }

  // Update trainer time off
  static async updateTrainerTimeOff(id: number, updates: Partial<TrainerTimeOff>): Promise<TrainerTimeOff> {
    try {
      const { data, error } = await supabase
        .from('trainer_time_off')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating trainer time off:', error);
      throw error;
    }
  }

  // Delete trainer time off
  static async deleteTrainerTimeOff(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('trainer_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting trainer time off:', error);
      throw error;
    }
  }

  // Helper method to format date for database
  static formatDateForDB(date: Date): string {
    return date.toISOString();
  }

  // Helper method to format time for database
  static formatTimeForDB(time: string): string {
    return time; // Should be in HH:MM format
  }

  // Helper method to check if time slot is available
  static async isTimeSlotAvailable(
    trainerId: string,
    startTime: string,
    endTime: string,
    excludeEventId?: number
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('schedule_events')
        .select('id')
        .eq('trainer_id', trainerId)
        .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

      if (excludeEventId) {
        query = query.neq('id', excludeEventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

    // Get trainer's clients for dropdown
  static async getTrainerClients(): Promise<{client_id: number, cl_name: string, cl_email: string}[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get clients directly by trainer_email
      const { data, error } = await supabase
        .from('trainer_client_web')
        .select(`
          client_id,
          cl_email
        `)
        .eq('trainer_email', user.email)
        .eq('status', 'active')
        .order('client_id', { ascending: true })

      if (error) throw error

      // Get client details separately
      if (data && data.length > 0) {
        const clientIds = data.map(item => item.client_id)
        const { data: clientData, error: clientError } = await supabase
          .from('client')
          .select('client_id, cl_name, cl_email')
          .in('client_id', clientIds)
          .order('cl_name', { ascending: true })

        if (clientError) throw clientError

        // Merge the data
        return data.map(item => {
          const client = clientData?.find(c => c.client_id === item.client_id)
          return {
            client_id: item.client_id,
            cl_name: client?.cl_name || 'Unknown Client',
            cl_email: item.cl_email || client?.cl_email || ''
          }
        })
      }

      return []
    } catch (error) {
      console.error('Error fetching trainer clients:', error)
      throw error
    }
  }

  // Add workout schedule to database
  static async addWorkoutSchedule(clientId: number, exercises: any[]): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Use the authenticated user's UUID directly as trainer_id
      const trainerId = user.id

      // Convert exercises to schedule events
      const scheduleEvents = exercises.map(exercise => {
        const startTime = new Date(`${exercise.for_date}T${exercise.for_time}`)
        const endTime = new Date(startTime.getTime() + (exercise.duration * 60000))
        
        return {
          title: exercise.workout,
          description: `Workout: ${exercise.workout} - ${exercise.coach_tip}`,
          event_type: 'fitness' as const,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: exercise.duration,
          location: 'Gym/Home',
          is_virtual: false,
          trainer_id: trainerId,
          trainer_email: user.email!,
          client_id: clientId,
          client_name: exercise.client_name || 'Client',
          status: 'scheduled' as const,
          priority: 'medium' as const,
          color: '#F59E0B', // Orange for fitness events
          reminder_minutes: 15,
          send_reminder: true
        }
      })

      // Insert all events
      const { data, error } = await supabase
        .from('schedule_events')
        .insert(scheduleEvents)
        .select()

      if (error) throw error

      return {
        success: true,
        message: `Successfully added ${scheduleEvents.length} workout sessions to schedule.`
      }
    } catch (error: any) {
      console.error('Error adding workout schedule:', error)
      return {
        success: false,
        message: error.message || 'Failed to add workout schedule to database.'
      }
    }
  }
}

// Export the addWorkoutSchedule function directly for easier importing
export const addWorkoutSchedule = ScheduleService.addWorkoutSchedule;