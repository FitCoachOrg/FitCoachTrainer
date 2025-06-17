import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClientProfileModal from "@/components/clients/ClientProfileModal";
import * as Icons from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarContent } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

const STATUS_FILTERS = [
  { label: "All Clients", value: "all" },
  { label: "Activity Status", value: "inactive" },
  { label: "Engagement Score", value: "low" },
  { label: "Outcome Score", value: "low" }
];

// Helper function to calculate days since last activity
const getDaysSinceActivity = (lastActivity: string) => {
  const today = new Date();
  const activityDate = new Date(lastActivity);
  const diffTime = Math.abs(today.getTime() - activityDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to get activity status color
const getActivityStatusColor = (days: number) => {
  if (days <= 3) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30";
  if (days <= 5) return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30";
  return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30";
};

// Progress bar component
const ProgressBar: React.FC<{ value: number; className?: string }> = ({ value, className = "" }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Clients: React.FC = () => {
  const [clients, setClients] = useState<{ client_id: number; cl_name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for the enhanced UI
  const [selectedClient, setSelectedClient] = useState<{ client_id: number; cl_name: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Get filter from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    const engagement = params.get('engagement');
    
    if (filter && STATUS_FILTERS.some(f => f.value === filter)) {
      setStatusFilter(filter);
    }
    
    if (engagement === 'low') {
      setEngagementFilter('low');
    }
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (statusFilter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', statusFilter);
    }
    
    if (engagementFilter === 'all') {
      params.delete('engagement');
    } else {
      params.set('engagement', engagementFilter);
    }
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [statusFilter, engagementFilter, navigate]);

  // Enhanced filtering logic that works with the existing data structure
  const filteredClients = clients.filter((client) => {
    // Search filter - use cl_name since that's what we have from Supabase
    const matchesSearch = client.cl_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Mock data for demonstration - you can replace with actual client data
    const mockEngagementScore = Math.floor(Math.random() * 100) + 1;
    const mockOutcomeScore = Math.floor(Math.random() * 100) + 1;
    const mockLastActivity = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString();
    const daysSinceActivity = getDaysSinceActivity(mockLastActivity);

    // Status filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "inactive" && daysSinceActivity > 7) ||
      (statusFilter === "low" && mockEngagementScore < 40) ||
      (statusFilter === "low" && mockOutcomeScore < 40);

    // Engagement score filter
    const matchesEngagement = 
      engagementFilter === "all" ||
      (engagementFilter === "high" && mockEngagementScore >= 80) ||
      (engagementFilter === "medium" && mockEngagementScore >= 40 && mockEngagementScore < 80) ||
      (engagementFilter === "low" && mockEngagementScore < 40);

    // Outcome score filter
    const matchesOutcome = 
      outcomeFilter === "all" ||
      (outcomeFilter === "high" && mockOutcomeScore >= 80) ||
      (outcomeFilter === "medium" && mockOutcomeScore >= 40 && mockOutcomeScore < 80) ||
      (outcomeFilter === "low" && mockOutcomeScore < 40);

    // Activity filter
    const matchesActivity = 
      activityFilter === "all" ||
      (activityFilter === "recent" && daysSinceActivity <= 3) ||
      (activityFilter === "moderate" && daysSinceActivity > 3 && daysSinceActivity <= 7) ||
      (activityFilter === "inactive" && daysSinceActivity > 7);

    return matchesSearch && matchesStatus && matchesEngagement && matchesOutcome && matchesActivity;
  });

  const handleViewProfile = (client: { client_id: number; cl_name: string }) => {
    setSelectedClient(client);
    setIsProfileModalOpen(true);
  };

  const handleEdit = (client: { client_id: number; cl_name: string }) => {
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-[#f8f9fb] via-[#f0f4f9] to-[#e8f2ff] dark:from-black dark:via-slate-900 dark:to-slate-800">
        {/* Enhanced Sidebar Filters */}
        <aside className="w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200/70 flex flex-col py-6 px-4 dark:bg-black/90 dark:border-gray-800/70 dark:text-white shadow-lg">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            <Icons.UsersIcon className="h-5 w-5 text-blue-500" /> Clients
          </h2>
          <nav className="flex-1">
            <ul className="space-y-2">
              {STATUS_FILTERS.map((filter) => (
                <li key={filter.value}>
                  <button
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      statusFilter === filter.value
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500 shadow-md dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-400 dark:border-blue-400"
                        : "text-gray-700 hover:bg-gray-100/70 hover:shadow-sm dark:text-gray-300 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-1 ml-2 ${
                        statusFilter === filter.value
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {filter.value === "all"
                        ? clients.length || 0
                        : filter.value === "inactive"
                          ? clients.length || 0
                          : 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <SidebarContent>
          <div className="max-w-8xl mx-auto w-full pt-8 px-6">
            {/* Enhanced Header and Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-gray-100 dark:to-gray-400">
                  All Clients ({filteredClients.length || 0})
                </h1>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Category"
                  >
                    <option value="all">Category: All</option>
                    <option value="premium">Premium</option>
                    <option value="basic">Basic</option>
                  </select>
                  <select
                    value={engagementFilter}
                    onChange={(e) => setEngagementFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Engagement Score"
                  >
                    <option value="all">Engagement: All</option>
                    <option value="high">High (80-100)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (0-49)</option>
                  </select>
                  <select
                    value={outcomeFilter}
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Outcome Score"
                  >
                    <option value="all">Outcome: All</option>
                    <option value="high">High (80-100)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (0-49)</option>
                  </select>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 dark:bg-black/80 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                    title="Last Activity"
                  >
                    <option value="all">Activity: All</option>
                    <option value="recent">Recent (≤3 days)</option>
                    <option value="moderate">Moderate (4-7 days)</option>
                    <option value="inactive">Inactive (&gt;7 days)</option>
                  </select>
                  <button 
                    onClick={() => {
                      setCategoryFilter("all");
                      setEngagementFilter("all");
                      setOutcomeFilter("all");
                      setActivityFilter("all");
                      setStatusFilter("all");
                      setSearchQuery("");
                    }}
                    className="text-blue-600 text-sm font-medium ml-2 hover:text-blue-800 transition-colors dark:text-blue-400 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Icons.SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 shadow-sm hover:shadow-md transition-all duration-200 dark:bg-slate-900/80 dark:border-gray-700 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  />
                </div>
                <Button
                  onClick={handleAddNew}
                  className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 px-6 h-11"
                >
                  <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add Client
                </Button>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 dark:bg-slate-900/90 dark:border-gray-800/50 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/80 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-700/30">
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Last Activity
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Engagement Score
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                      Outcome Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client, index) => {
                      // Mock data for demonstration
                      const mockEngagementScore = Math.floor(Math.random() * 100) + 1;
                      const mockOutcomeScore = Math.floor(Math.random() * 100) + 1;
                      const mockLastActivity = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString();
                      const daysSinceActivity = getDaysSinceActivity(mockLastActivity);
                      const activityColorClass = getActivityStatusColor(daysSinceActivity);

                      return (
                        <tr
                          key={client.client_id}
                          className={`${
                            index % 2 === 0 ? "bg-gray-50/40 dark:bg-slate-800/20" : "bg-white/40 dark:bg-slate-900/20"
                          } hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-all duration-200 cursor-pointer border-b border-gray-100/50 dark:border-gray-800/50 group`}
                          onClick={() => navigate(`/client/${client.client_id}`)}
                        >
                          <td className="flex items-center gap-4 px-6 py-5 whitespace-nowrap">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-700 group-hover:shadow-xl transition-shadow duration-200">
                              <div className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                {client.cl_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            </div>
                            <span
                              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-base"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/client/${client.client_id}`);
                              }}
                            >
                              {client.cl_name}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                daysSinceActivity <= 3 ? 'bg-green-500 animate-pulse' : 
                                daysSinceActivity <= 5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              <span className={`font-medium ${
                                daysSinceActivity <= 3 ? 'text-green-700 dark:text-green-400' : 
                                daysSinceActivity <= 5 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                              }`}>
                                {daysSinceActivity}d ago
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${activityColorClass}`}>
                              {daysSinceActivity <= 3 ? 'Active' : daysSinceActivity <= 5 ? 'Moderate' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <ProgressBar value={mockEngagementScore} className="flex-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {mockEngagementScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <ProgressBar value={mockOutcomeScore} className="flex-1" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                {mockOutcomeScore}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Icons.SearchIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            No clients found
                          </h3>
                          <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your search or filters</p>
                          <Button
                            onClick={handleAddNew}
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Icons.PlusIcon className="h-4 w-4 mr-2" /> Add New Client
                          </Button>
                        </div>
                      </td>
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
                  <DialogTitle>{selectedClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    Client form functionality is not yet implemented. This would integrate with your Supabase client table.
                  </p>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setIsFormModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
};

export default Clients;