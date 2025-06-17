import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import * as Icons from "@/lib/icons";

const Clients: React.FC = () => {
  const [clients, setClients] = useState<{ client_id: number; cl_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("[DEBUG] Session fetched:", session, sessionError);
        if (sessionError) throw sessionError;
        const authUserId = session?.user?.id;
        const authUserEmail = session?.user?.email;
        console.log("[DEBUG] Auth User ID:", authUserId);
        console.log("[DEBUG] Auth User Email:", authUserEmail);
        if (!authUserEmail) {
          setClients([]);
          setLoading(false);
          console.log("[DEBUG] No auth user email found. Returning empty client list.");
          return;
        }
        // Fetch the trainer row using the email
        const { data: trainerRows, error: trainerError } = await supabase
          .from("trainer")
          .select("id")
          .eq("trainer_email", authUserEmail)
          .limit(1);
        console.log("[DEBUG] Trainer row:", trainerRows, trainerError);
        if (trainerError) throw trainerError;
        if (!trainerRows || trainerRows.length === 0) {
          setClients([]);
          setLoading(false);
          console.log("[DEBUG] No trainer found for this email.");
          return;
        }
        const trainerId = trainerRows[0].id;
        console.log("[DEBUG] Trainer Table ID:", trainerId);
        // Get client ids
        const { data: relationshipData, error: relationshipError } = await supabase
          .from("trainer_client_web")
          .select("client_id")
          .eq("trainer_id", trainerId);
          
        console.log("[DEBUG] Relationship data:", relationshipData, relationshipError);
        if (relationshipError) throw relationshipError;
        if (!relationshipData || relationshipData.length === 0) {
          setClients([]);
          setLoading(false);
          console.log("[DEBUG] No client relationships found for trainer.");
          return;
        }
        const clientIds = relationshipData.map((rel) => rel.client_id);
        console.log("[DEBUG] Client IDs:", clientIds);
        // Get client names
        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("client_id, cl_name")
          .in("client_id", clientIds);
        console.log("[DEBUG] Client data:", clientData, clientError);
        if (clientError) throw clientError;
        setClients(clientData || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
        console.error("[DEBUG] Error in fetchClients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Icons.AlertTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold">Error Loading Clients</h3>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  const filteredClients = clients.filter((client) =>
    client.cl_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Clients</h1>
      <Input
        placeholder="Search clients by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full"
      />
      <ul className="divide-y divide-gray-200">
        {filteredClients.length === 0 ? (
          <li className="py-8 text-center text-gray-500">No clients found.</li>
        ) : (
          filteredClients.map((client) => (
            <li key={client.client_id} className="py-4 flex items-center">
              <span className="font-medium text-gray-900">{client.cl_name}</span>
              <span className="ml-2 text-gray-400 text-xs">(ID: {client.client_id})</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Clients;