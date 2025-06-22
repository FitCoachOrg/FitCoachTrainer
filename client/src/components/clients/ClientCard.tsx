import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as Icons from "@/lib/icons";
import { MappedClient } from "@/hooks/use-clients";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ClientCardProps {
  client: MappedClient;
  onEdit: (client: MappedClient) => void;
  onViewProfile: (client: MappedClient) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onViewProfile }) => {
  const navigate = useNavigate();
  
  // Dummy progress data for the line graph
  const progressData = [
    { week: "W1", progress: 10 },
    { week: "W2", progress: 30 },
    { week: "W3", progress: 50 },
    { week: "W4", progress: 70 },
    { week: "W5", progress: 90 },
  ];

  return (
    <Card className="overflow-visible group relative">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
              {client.avatarUrl ? (
                <img 
                  src={client.avatarUrl} 
                  alt={client.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  <Icons.UserIcon className="h-7 w-7" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold truncate">{client.name}</h3>
                <Badge variant={client.isActive ? "default" : "secondary"}>
                  {client.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {client.email} {client.username ? `• ${client.username}` : ""}
              </p>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>Height: {client.height ?? "-"}cm • Weight: {client.weight ?? "-"}kg</p>
                <p>DOB: {client.dob ? new Date(client.dob).toLocaleDateString() : "-"}</p>
                {client.phone && <p>Phone: {client.phone}</p>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Icons.CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              Joined {new Date(client.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>

      {/* Dropdown below card */}
      <div className="absolute left-0 right-0 top-full mt-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mx-2">
          <div className="h-32 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip />
                <Line type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mb-3">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/nutrition-plans")}>
              <Icons.UtensilsIcon className="mr-2 h-4 w-4" />
              Nutritional Plan
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/fitness-plans")}>
              <Icons.DumbbellIcon className="mr-2 h-4 w-4" />
              Fitness Plan
            </Button>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(client)}
            >
              <Icons.PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => navigate(`/client/${client.client_id}`)}
            >
              <Icons.UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClientCard;
