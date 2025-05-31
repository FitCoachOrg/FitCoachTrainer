import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Icons from '@/lib/icons';
import { ClientDashboard } from '@/components/clients/ClientDashboard';
import { useClients } from '@/hooks/use-clients';
import { Input } from '@/components/ui/input';

// Match the field mapping from use-clients
function mapClientFromDb(dbClient: any) {
  return {
    id: dbClient.id,
    trainerId: dbClient.trainer_id,
    name: dbClient.cl_name,
    email: dbClient.cl_email,
    avatarUrl: dbClient.cl_pic,
    phone: dbClient.cl_phone,
    username: dbClient.cl_username,
    height: dbClient.cl_height,
    weight: dbClient.cl_weight,
    dob: dbClient.cl_dob,
    genderName: dbClient.cl_gender_name,
    isActive: true,
    createdAt: dbClient.created_at,
    updatedAt: dbClient.created_at
  };
}

export default function ClientProfilePage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const { clients } = useClients(1);

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!clientId || isNaN(Number(clientId))) {
      setError("Invalid or missing client ID in URL.");
      setLoading(false);
      // Optionally auto-redirect after 2 seconds
      setTimeout(() => navigate('/clients'), 2000);
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError(null);
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', Number(clientId))
        .eq('trainer_id', 1)
        .maybeSingle();
      if (clientError || !clientData) {
        setError('Failed to fetch client details');
        setLoading(false);
        return;
      }
      setClient(mapClientFromDb(clientData));
      setLoading(false);
    }
    fetchData();
  }, [clientId]);

  if (loading) return <div>Loading...</div>;
  if (error) return (
    <div className="text-red-600 flex flex-col items-center gap-4 mt-12">
      <div>{error}</div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => navigate('/clients')}
      >
        Back to Clients
      </button>
    </div>
  );
  if (!client) return <div>No client found.</div>;

  return (
    <div className="min-h-screen w-full flex flex-col justify-start bg-[#faf9f8]">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-2 mt-8 px-2 md:px-0">
        {/* Client List Sidebar */}
        <div className="w-full md:w-72 flex flex-col gap-6 shrink-0">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">All Clients</h3>
              <div className="relative">
                <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {filteredClients?.map((c) => (
                <button
                  key={c.client_id}
                  onClick={() => navigate(`/client/${c.client_id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    c.client_id === Number(clientId)
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="font-bold text-gray-600 dark:text-gray-400 text-sm">
                        {c.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{c.name}</div>
                    {c.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Profile Header */}
          <Card className="flex flex-col md:flex-row items-center gap-6 p-6 mb-2">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {client.avatarUrl ? (
                <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                <Icons.UserIcon className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold mb-1">{client.name}</h2>
              {client.username && (
                <div className="text-gray-500 text-sm mb-1">@{client.username}</div>
              )}
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {client.email && <span className="text-gray-500">{client.email}</span>}
                {client.phone && <span className="text-gray-500">{client.phone}</span>}
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
                <span>DOB: {client.dob}</span>
                <span>Height: {client.height} cm</span>
                <span>Weight: {client.weight} kg</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Joined: {new Date(client.createdAt).toLocaleDateString()}</div>
            </div>
          </Card>
          {/* Client Dashboard and Schedule */}
          <ClientDashboard clientId={client.id} />
        </div>
      </div>
    </div>
  );
} 