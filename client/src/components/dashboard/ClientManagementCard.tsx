import { Card } from "@/components/ui/card";
import { useClients } from "@/hooks/use-clients";
import { useLocation } from "wouter";
import * as Icons from "@/lib/icons";
import { useState } from "react";
import type { MappedClient } from "@/hooks/use-clients";

interface ClientManagementCardProps {
  currentClientId: number;
}

const ClientManagementCard: React.FC<ClientManagementCardProps> = ({ currentClientId }) => {
  const { clients, isLoading } = useClients();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  // Only show other clients
  const otherClients = (clients || []).filter(
    (c: MappedClient) => c.client_id !== currentClientId && c.isActive && c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="bg-[#fcfbfa] rounded-2xl p-4 flex flex-col gap-2 min-w-[220px]">
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-400 tracking-widest mb-1">CLIENTS</div>
        <div className="text-xl font-bold text-gray-700 mb-2">All Clients</div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Search client"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-blue-500" title="Sort clients">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pb-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : otherClients.length > 0 ? (
          otherClients.map((client: MappedClient) => (
            <button
              key={client.client_id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white shadow-sm hover:shadow-md transition border border-transparent hover:border-blue-200 focus:outline-none"
              onClick={() => navigate(`/client/${client.client_id}`)}
              title={client.name}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                {client.avatarUrl ? (
                  <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <Icons.UserIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <span className="truncate text-base font-medium text-gray-700 text-left">{client.name}</span>
            </button>
          ))
        ) : (
          <div className="text-xs text-gray-400 px-2 py-4">No other clients</div>
        )}
      </div>
    </Card>
  );
};

export default ClientManagementCard;
