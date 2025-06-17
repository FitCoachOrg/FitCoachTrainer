import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const  useClients = () => {
  return useQuery({
    queryKey: ["clients-by-trainer"],
    queryFn: async () => {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const trainerId = session?.user?.id;
      if (!trainerId) return [];
      // Fetch all client_ids for this trainer
      const { data: relationshipData, error: relationshipError } = await supabase
        .from("trainer_client_web")
        .select("client_id")
        .eq("trainer_id", trainerId);
      if (relationshipError) throw relationshipError;
      if (!relationshipData || relationshipData.length === 0) return [];
      const clientIds = relationshipData.map((rel) => rel.client_id);
      // Fetch client names
      const { data: clientData, error: clientError } = await supabase
        .from("client")
        .select("client_id, cl_name")
        .in("client_id", clientIds);
      if (clientError) throw clientError;
      return clientData || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};