// Updated useClients hook with better debugging and fixed mapping
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Fixed interface - only include fields that actually exist in your mapping
interface MappedClient {
  client_id: number;
  cl_name: string;
  cl_email: string;
  created_at: string;
  status: string;
  cl_pic?: string;
  cl_username?: string;
  last_active?: string;
  cl_primary_goal?: string;
  training_experience?: string;
  cl_phone?: number;
  cl_height?: number;
  cl_weight?: number;
  cl_dob?: string;
  cl_gender_name?: string;
  cl_target_weight?: number;
  cl_activity_level?: string;
  specific_outcome?: string;
  goal_timeline?: string;
  obstacles?: string;
  confidence_level?: number;
  previous_training?: string;
  training_days_per_week?: number;
  training_time_per_session?: string;
  training_location?: string;
  available_equipment?: string[];
  injuries_limitations?: string;
  focus_areas?: string[];
  eating_habits?: string;
  diet_preferences?: string[];
  food_allergies?: string;
  preferred_meals_per_day?: number;
  cl_age?: number;
  cl_sex?: string;
  onboarding_completed?: boolean;
  onboarding_progress?: any;
  sleep_hours?: number;
  cl_stress?: string;
  cl_alcohol?: string;
  cl_supplements?: string;
  cl_gastric_issues?: string;
  motivation_style?: string;
  wake_time?: string;
  bed_time?: string;
  workout_time?: string;
  workout_days?: any;
  bf_time?: string;
  lunch_time?: string;
  dinner_time?: string;
  snack_time?: string;
  last_login?: string;
  last_logout?: string;
  current_streak?: number;
  longest_streak?: number;
}

const mapClientFromDb = (client: any, status: string): MappedClient => ({
  client_id: client.client_id,
  cl_name: client.cl_name,
  cl_email: client.cl_email,
  created_at: client.created_at,
  status: status, // Use status from the relationship table
  cl_pic: client.cl_pic,
  cl_username: client.cl_username,
  last_active: client.last_active,
  cl_primary_goal: client.cl_primary_goal,
  training_experience: client.training_experience,
  cl_phone: client.cl_phone,
  cl_height: client.cl_height,
  cl_weight: client.cl_weight,
  cl_dob: client.cl_dob,
  cl_gender_name: client.cl_gender_name,
  cl_target_weight: client.cl_target_weight,
  cl_activity_level: client.cl_activity_level,
  specific_outcome: client.specific_outcome,
  goal_timeline: client.goal_timeline,
  obstacles: client.obstacles,
  confidence_level: client.confidence_level,
  previous_training: client.previous_training,
  training_days_per_week: client.training_days_per_week,
  training_time_per_session: client.training_time_per_session,
  training_location: client.training_location,
  available_equipment: client.available_equipment,
  injuries_limitations: client.injuries_limitations,
  focus_areas: client.focus_areas,
  eating_habits: client.eating_habits,
  diet_preferences: client.diet_preferences,
  food_allergies: client.food_allergies,
  preferred_meals_per_day: client.preferred_meals_per_day,
  cl_age: client.cl_age,
  cl_sex: client.cl_sex,
  onboarding_completed: client.onboarding_completed,
  onboarding_progress: client.onboarding_progress,
  sleep_hours: client.sleep_hours,
  cl_stress: client.cl_stress,
  cl_alcohol: client.cl_alcohol,
  cl_supplements: client.cl_supplements,
  cl_gastric_issues: client.cl_gastric_issues,
  motivation_style: client.motivation_style,
  wake_time: client.wake_time,
  bed_time: client.bed_time,
  workout_time: client.workout_time,
  workout_days: client.workout_days,
  bf_time: client.bf_time,
  lunch_time: client.lunch_time,
  dinner_time: client.dinner_time,
  snack_time: client.snack_time,
  last_login: client.last_login,
  last_logout: client.last_logout,
  current_streak: client.current_streak,
  longest_streak: client.longest_streak,
});

export const useClients = (trainerId?: string) => {
  const queryClient = useQueryClient();
  
  // Fetch all clients for a trainer
  const { 
    data: clientsRaw, 
    isLoading,
    error
  } = useQuery<MappedClient[]>({ 
    queryKey: ['clients', trainerId],
    queryFn: async () => {
      if (!trainerId) {
        console.log('❌ No trainer ID provided');
        return [];
      }
      
      console.log('🔍 Fetching clients for trainer:', trainerId);
      console.log('📋 Trainer ID type:', typeof trainerId);
      
      try {
        // Step 1: Get trainer-client relationships
        console.log('⏳ Step 1: Fetching trainer-client relationships...');
        const { data: relationshipData, error: relationshipError } = await supabase
          .from('trainer_client_web')
          .select('*')
          .eq('trainer_id', trainerId);
          
        console.log('✅ Relationship query completed');
        console.log('📊 Raw relationship data:', relationshipData);
        console.log('❌ Relationship error:', relationshipError);
        
        if (relationshipError) {
          console.error('💥 Error fetching relationships:', relationshipError);
          throw relationshipError;
        }
        
        if (!relationshipData || relationshipData.length === 0) {
          console.log('⚠️ No relationships found for trainer:', trainerId);
          return [];
        }
        
        // Step 2: Get client IDs and prepare mapping
        const clientIds = relationshipData.map(rel => rel.client_id);
        console.log('🎯 Client IDs to fetch:', clientIds);
        
        // Step 3: Fetch client details
        console.log('⏳ Step 2: Fetching client details...');
        const { data: clientData, error: clientError } = await supabase
          .from('client')
          .select('*')
          .in('client_id', clientIds);
          
        console.log('✅ Client query completed');
        console.log('👥 Raw client data:', clientData);
        console.log('❌ Client error:', clientError);
        
        if (clientError) {
          console.error('💥 Error fetching clients:', clientError);
          throw clientError;
        }
        
        if (!clientData || clientData.length === 0) {
          console.log('⚠️ No client data found for IDs:', clientIds);
          return [];
        }
        
        // Step 4: Map and combine data
        console.log('⏳ Step 3: Mapping client data...');
        const mappedClients = relationshipData.map(relationship => {
          const client = clientData.find(c => c.client_id === relationship.client_id);
          if (!client) {
            console.warn(`⚠️ Client not found for ID: ${relationship.client_id}`);
            return null;
          }
          
          console.log(`🔄 Mapping client ${client.client_id}: ${client.cl_name}`);
          return mapClientFromDb(client, relationship.status);
        }).filter((client): client is MappedClient => client !== null);
        
        console.log('🎉 Final mapped clients:', mappedClients);
        console.log(`📈 Successfully mapped ${mappedClients.length} clients`);
        
        return mappedClients;
        
      } catch (error) {
        console.error('💥 Unexpected error in useClients:', error);
        throw error;
      }
    },
    enabled: !!trainerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Create a new client
  const createClient = useMutation({
    mutationFn: async (client: Omit<MappedClient, 'client_id' | 'created_at'>) => {
      console.log('🔄 Creating new client with data:', client);
      
      // Create the client first
      const { data: newClient, error: clientError } = await supabase
        .from('client')
        .insert([{
          cl_name: client.cl_name,
          cl_email: client.cl_email,
          cl_username: client.cl_username || client.cl_email?.split('@')[0] || 'user',
          cl_pass: 'temp_password' // You'll want to handle this properly
        }])
        .select()
        .single();

      if (clientError) {
        console.error('💥 Error creating client:', clientError);
        throw clientError;
      }
      
      if (!newClient) throw new Error('Failed to create client');
      
      console.log('✅ Created new client:', newClient);

      // Then create the trainer-client relationship
      const { error: relationError } = await supabase
        .from('trainer_client_web')
        .insert([{
          trainer_id: trainerId,
          client_id: newClient.client_id,
          status: 'pending'
        }]);

      if (relationError) {
        console.error('💥 Error creating relationship:', relationError);
        throw relationError;
      }

      console.log('✅ Created trainer-client relationship');
      return mapClientFromDb(newClient, 'pending');
    },
    onSuccess: (data) => {
      console.log('🎉 Client created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['clients', trainerId] });
    },
    onError: (error) => {
      console.error('💥 Failed to create client:', error);
    }
  });
  
  // Update an existing client
  const updateClient = useMutation({
    mutationFn: async ({ client_id, ...client }: { client_id: number } & Partial<MappedClient>) => {
      console.log('🔄 Updating client:', client_id, client);
      
      const { data, error } = await supabase
        .from('client')
        .update({
          cl_name: client.cl_name,
          cl_email: client.cl_email
        })
        .eq('client_id', client_id)
        .select()
        .single();
        
      if (error) {
        console.error('💥 Error updating client:', error);
        throw error;
      }
      
      console.log('✅ Updated client:', data);
      return data ? mapClientFromDb(data, client.status || 'pending') : null;
    },
    onSuccess: (data) => {
      console.log('🎉 Client updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['clients', trainerId] });
    },
  });
  
  // Delete a client
  const deleteClient = useMutation({
    mutationFn: async (client_id: number) => {
      console.log('🗑️ Deleting client:', client_id);
      
      // First delete the trainer-client relationship
      const { error: relationError } = await supabase
        .from('trainer_client_web')
        .delete()
        .eq('client_id', client_id);
        
      if (relationError) {
        console.error('💥 Error deleting relationship:', relationError);
        throw relationError;
      }

      // Then delete the client
      const { error } = await supabase
        .from('client')
        .delete()
        .eq('client_id', client_id);
        
      if (error) {
        console.error('💥 Error deleting client:', error);
        throw error;
      }
      
      console.log('✅ Client deleted successfully');
    },
    onSuccess: () => {
      console.log('🎉 Client deletion completed');
      queryClient.invalidateQueries({ queryKey: ['clients', trainerId] });
    },
  });
  
  return {
    clients: clientsRaw,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient
  };
};

export function useClientSchedule(clientId: number, weekStart: string, weekEnd: string) {
  return useQuery({
    queryKey: ['clientSchedule', clientId, weekStart, weekEnd],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !!weekStart && !!weekEnd,
  });
}