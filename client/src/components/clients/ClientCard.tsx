import { Badge } from "@/components/ui/badge";
import * as Icons from "@/lib/icons";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

interface MappedClient {
    client_id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
    avatar_url: string | null;
    username?: string;
    height?: number;
    weight?: number;
    dob?: string;
    phone?: string;
    program?: {
        program_id: number;
        program_name: string;
    } | null;
}

interface ClientCardProps {
  client: MappedClient;
  onEdit: (client: MappedClient) => void;
  onViewProfile: (client: MappedClient) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onViewProfile }) => {
  const [, navigate] = useLocation();
  
  // Dummy progress data for the line graph
  const progressData = [
    { week: "W1", progress: 10 },
    { week: "W2", progress: 30 },
    { week: "W3", progress: 50 },
    { week: "W4", progress: 70 },
    { week: "W5", progress: 90 },
  ];

  return (
    <div className="bg-white dark:bg-black shadow-lg rounded-xl overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                <Icons.UserIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{client.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
            </div>
          </div>
          <Badge variant={client.is_active ? "default" : "secondary"}>
            {client.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Current Program:</p>
          <p className="text-md font-semibold text-gray-800 dark:text-white">{client.program?.program_name || 'Not Assigned'}</p>
        </div>
        
        <div className="h-24 mt-4 -mx-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                }}
              />
              <Line type="monotone" dataKey="progress" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-slate-900 px-5 py-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>Quick Edit</Button>
        <Button variant="default" size="sm" onClick={() => navigate(`/client/${client.client_id}`)}>View Profile</Button>
      </div>
    </div>
  );
};

export default ClientCard;
