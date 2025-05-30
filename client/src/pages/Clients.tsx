import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import ClientProfileModal from "@/components/clients/ClientProfileModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client } from "@shared/schema";
import ClientForm from "@/components/clients/ClientForm";
import * as Icons from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { insertDummyClient } from "@/lib/dummy-data";
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useLocation } from "wouter";

const STATUS_FILTERS = [
  { label: "All Clients", value: "all" },
  { label: "Connected", value: "connected" },
  { label: "Pending", value: "pending" },
  { label: "Offline", value: "offline" },
  { label: "Waiting Activation", value: "waiting" },
  { label: "Need Programming", value: "need_programming" },
  { label: "Archived", value: "archived" },
];

const Clients: React.FC = () => {
  const { clients, isLoading, error } = useClients(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    // Placeholder: all clients are 'connected' for now
    const matchesStatus = statusFilter === "all" || statusFilter === "connected";
    return matchesSearch && matchesStatus;
  });

  const handleViewProfile = (client: Client) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    toast({
      title: selectedClient ? "Client updated" : "Client added",
      description: selectedClient
        ? "The client has been successfully updated."
        : "The client has been successfully added.",
    });
    window.location.reload();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <Icons.AlertTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-semibold">Error Loading Clients</h3>
        <p className="text-gray-500 dark:text-gray-400">{error.message}</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f8f9fb]">
        {/* Sidebar Filters */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-6 px-4">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Icons.UsersIcon className="h-5 w-5 text-blue-500" /> Clients
          </h2>
          <nav className="flex-1">
            <ul className="space-y-1">
              {STATUS_FILTERS.map((filter) => (
                <li key={filter.value}>
                  <button
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === filter.value ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"}`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <span className="text-xs font-semibold bg-gray-100 rounded px-2 py-0.5 ml-2">
                      {/* Placeholder: show all as 0 except All/Connected */}
                      {filter.value === "all"
                        ? clients?.length || 0
                        : filter.value === "connected"
                        ? clients?.length || 0
                        : 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <SidebarContent>
          <div className="max-w-7xl mx-auto w-full pt-8 px-6">
            {/* Header and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-2xl font-bold">All Clients ({filteredClients?.length || 0})</h1>
                <div className="flex gap-2">
                  <select className="border rounded px-2 py-1 text-sm bg-white" title="Category">
                    <option>Category: All</option>
                  </select>
                  <select className="border rounded px-2 py-1 text-sm bg-white" title="Status">
                    <option>Status: All</option>
                  </select>
                  <select className="border rounded px-2 py-1 text-sm bg-white" title="Last Activity">
                    <option>Last Activity</option>
                  </select>
                  <select className="border rounded px-2 py-1 text-sm bg-white" title="Last Assigned Workout">
                    <option>Last Assigned Workout</option>
                  </select>
                  <button className="text-blue-600 text-sm font-medium ml-2">Hide filters</button>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search client"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 rounded-lg border border-gray-200 bg-white"
                  />
                </div>
                <Button onClick={handleAddNew} className="ml-2">
                  <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add Client
                </Button>
              </div>
            </div>
            {/* Table Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Last Activity</th>
                    <th className="px-6 py-3 text-left font-semibold">Last 7d Training</th>
                    <th className="px-6 py-3 text-left font-semibold">Last 30d Training</th>
                    <th className="px-6 py-3 text-left font-semibold">Last 7d Tasks</th>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td>
                    </tr>
                  ) : filteredClients && filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr
                        key={client.client_id}
                        className="hover:bg-blue-50 transition cursor-pointer"
                        onClick={() => navigate(`/client/${client.client_id}`)}
                      >
                        <td className="flex items-center gap-3 px-6 py-4 whitespace-nowrap">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            {client.avatarUrl ? (
                              <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icons.UserIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <span
                            className="font-medium text-gray-900 hover:underline cursor-pointer"
                            onClick={e => {
                              e.stopPropagation();
                              navigate(`/client/${client.client_id}`);
                            }}
                          >
                            {client.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">5d</td>
                        <td className="px-6 py-4">100%</td>
                        <td className="px-6 py-4">100%</td>
                        <td className="px-6 py-4">100%</td>
                        <td className="px-6 py-4">Online</td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Connected</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">No clients found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Client Profile Modal */}
            <ClientProfileModal
              client={selectedClient}
              open={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
            {/* Client Form Modal */}
            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedClient ? "Edit Client" : "Add New Client"}
                  </DialogTitle>
                </DialogHeader>
                <ClientForm
                  client={selectedClient ?? undefined}
                  onSuccess={handleFormSuccess}
                  trainerId={1}
                />
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
};

export default Clients;
