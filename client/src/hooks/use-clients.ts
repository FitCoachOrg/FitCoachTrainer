import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Helper to map database fields to client interface
export interface MappedClient {
  client_id: number;
  trainerId: number;
  cl_name: string;
  cl_email: string;
  cl_pic: string | null;
  cl_phone: string | null;
  cl_username?: string | null;
  cl_height?: number | null;
  cl_weight?: number | null;
  cl_dob?: string | null;
  cl_gender?: string | null;
  cl_address?: string | null;
  cl_join_date?: string | null;
  cl_goal?: string | null;
  cl_activity_level?: string | null;
  cl_target_weight?: number | null;
  cl_medical_conditions?: string | null;
  cl_allergies?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapClientFromDb(dbClient: any): MappedClient {
  return {
    client_id: dbClient.client_id,
    trainerId: dbClient.trainer_id,
    cl_name: dbClient.cl_name,
    cl_email: dbClient.cl_email,
    cl_pic: dbClient.cl_pic,
    cl_phone: dbClient.cl_phone,
    cl_username: dbClient.cl_username,
    cl_height: dbClient.cl_height,
    cl_weight: dbClient.cl_weight,
    cl_dob: dbClient.cl_dob,
    cl_gender: dbClient.cl_gender_name,
    cl_address: dbClient.cl_address,
    cl_join_date: dbClient.cl_join_date,
    cl_goal: dbClient.cl_goal,
    cl_activity_level: dbClient.cl_activity_level,
    cl_target_weight: dbClient.cl_target_weight,
    cl_medical_conditions: dbClient.cl_medical_conditions,
    cl_allergies: dbClient.cl_allergies,
    isActive: true,
    createdAt: dbClient.created_at,
    updatedAt: dbClient.created_at
  };
}

export const useClients = (trainerId?: number) => {
  const queryClient = useQueryClient();
  
  // Fetch all clients for a trainer
  const { 
    data: clientsRaw, 
    isLoading,
    error
  } = useQuery<MappedClient[]>({ 
    queryKey: ['clients', trainerId],
    queryFn: async () => {
      if (!trainerId) return [];
      const { data, error } = await supabase
        .from('client')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ? data.map(mapClientFromDb) : [];
    },
    enabled: !!trainerId
  });
  
  // Create a new client
  const createClient = useMutation({
    mutationFn: async (client: Omit<MappedClient, 'id' | 'createdAt' | 'updatedAt'>) => {
      const mappedClient = {
        trainer_id: trainerId,
        cl_name: client.name,
        cl_email: client.email,
        cl_pic: client.avatarUrl,
        cl_phone: client.phone,
        cl_username: client.username,
        cl_height: client.height,
        cl_weight: client.weight,
        cl_dob: client.dob,
        cl_gender_name: client.genderName,
        cl_p: 'default_password'
      };
      const { data, error } = await supabase
        .from('client')
        .insert([mappedClient])
        .select()
        .single();
      if (error) throw error;
      return data ? mapClientFromDb(data) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', trainerId] });
    },
  });
  
  // Update an existing client
  const updateClient = useMutation({
    mutationFn: async ({ id, ...client }: { id: number } & Partial<MappedClient>) => {
      const mappedClient = {
        cl_name: client.name,
        cl_email: client.email,
        cl_pic: client.avatarUrl,
        cl_phone: client.phone,
        cl_username: client.username,
        cl_height: client.height,
        cl_weight: client.weight,
        cl_dob: client.dob,
        cl_gender_name: client.genderName
      };
      const { data, error } = await supabase
        .from('client')
        .update(mappedClient)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? mapClientFromDb(data) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', trainerId] });
    },
  });
  
  // Delete a client
  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('client')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
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

export function useClientProfile(clientId: number, trainerId: number) {
  return useQuery({
    queryKey: ['clientProfile', clientId, trainerId],
    queryFn: async () => {
      console.log('useClientProfile - clientId:', clientId);
      console.log('useClientProfile - trainerId:', trainerId);
      
      if (!clientId || !trainerId) {
        console.log('useClientProfile - Missing clientId or trainerId');
        return null;
      }

      const { data, error } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', clientId)
        .eq('trainer_id', trainerId)
        .single();

      console.log('useClientProfile - Supabase response:', { data, error });

      if (error) {
        console.error('useClientProfile - Supabase error:', error);
        throw error;
      }

      const mappedClient = data ? mapClientFromDb(data) : null;
      console.log('useClientProfile - Mapped client:', mappedClient);
      return mappedClient;
    },
    enabled: !!clientId && !!trainerId,
  });
}
