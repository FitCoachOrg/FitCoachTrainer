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
  { label: "Engagement Score", value: "engagement_low" },
  { label: "Outcome Score", value: "outcome_low" }
];

const ACTIVITY_TYPES = [
  "hydration",
  "Sleep Duration",
  "Sleep Quality",
  "Energy Level"
];

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

  const [activityBreakdown, setActivityBreakdown] = useState<{
    [clientId: number]: {
      [activityType: string]: number | null;
    };
  }>({});
  
  let clientIds: number[] = [];
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

        if (trainerError) throw trainerError;
        if (!trainerRows || trainerRows.length === 0) {
          setClients([]);
          setLoading(false);
          
          return;
        }
        const trainerId = trainerRows[0].id;

        // Get client ids
        const { data: relationshipData, error: relationshipError } = await supabase
          .from("trainer_client_web")
          .select("client_id")
          .eq("trainer_id", trainerId);
          
        
        if (relationshipError) throw relationshipError;
        if (!relationshipData || relationshipData.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }
        clientIds = relationshipData.map((rel) => rel.client_id);
        // Get client names
        const { data: clientData, error: clientError } = await supabase
          .from("client")
          .select("client_id, cl_name,last_checkIn,last_active")
          .in("client_id", clientIds);
        if (clientError) throw clientError;
        setClients(clientData || []);
        // --- DEBUG: Log clientIds and all rows in activity_info and meal_info ---
        const { data: allActivity, error: allActivityError } = await supabase
          .from("activity_info")
          .select("client_id,activity,created_at");
        const { data: allMeals, error: allMealsError } = await supabase
          .from("meal_info")
          .select("client_id,calories,protein,carbs,fat,meal_type");
        // --- END DEBUG ---
        // --- Fetch and process activity info for the 4 types ---
        const { data: activityRows, error: activityRowsError } = await supabase
          .from("activity_info")
          .select("client_id,activity,created_at")
          .in("client_id", clientIds)
          .in("activity", ACTIVITY_TYPES);
        if (activityRowsError) {
          console.error("[DEBUG] Error fetching filtered activity_info:", activityRowsError);
        }
        // Process: for each client, for each activity type, get the latest created_at
        const summary: { [clientId: number]: { [activityType: string]: { created_at: string | null } } } = {};
        if (activityRows) {
          for (const row of activityRows) {
            const cid = row.client_id;
            const atype = row.activity;
            const created = row.created_at;
            if (!summary[cid]) summary[cid] = {};
            if (!summary[cid][atype] || (created && summary[cid][atype].created_at && new Date(created) > new Date(summary[cid][atype].created_at!))) {
              summary[cid][atype] = { created_at: created };
            }
          }
        }
        // Convert summary to days-since breakdown
        const now = new Date();
        const breakdown: { [clientId: number]: { [activityType: string]: number | null } } = {};
        for (const cid in summary) {
          breakdown[cid] = {};
          for (const atype of ACTIVITY_TYPES) {
            const createdAt = summary[cid][atype]?.created_at;
            if (createdAt) {
              const last = new Date(createdAt);
              const diffTime = Math.abs(now.getTime() - last.getTime());
              breakdown[cid][atype] = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } else {
              breakdown[cid][atype] = null;
            }
          }
        }
        setActivityBreakdown(breakdown);
        // --- END activity summary ---
      } catch (err: any) {
        setError(err.message || "Unknown error");
        console.error("[DEBUG] Error in fetchClients:", err);
      } finally {
        setLoading(false);
      }
      // Use the clientIds from the try block for the queries below
      const { data: activityInfo, error: activityError } = await supabase
        .from("activity_info")
        .select("client_id, last_weight_time, last_excercise_input, last_sleep_info")
        .in("client_id", clientIds);
      if (activityError) {
        console.error("[DEBUG] Error fetching activity info:", activityError);
      }
      const { data: mealInfo, error: mealError } = await supabase
        .from("meal_info")
        .select("client_id,calories,protein,carbs,fat,meal_type")
        .in("client_id", clientIds);
      if (mealError) {
        console.error("[DEBUG] Error fetching meal info:", mealError);
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

  // Helper function to calculate days since last check-in
  const getDaysSinceLastCheckIn = (lastCheckIn: string | null | undefined) => {
    if (!lastCheckIn) return null;
    const now = new Date();
    const last = new Date(lastCheckIn);
    const diffTime = Math.abs(now.getTime() - last.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Enhanced filtering logic that works with the existing data structure
  const filteredClients = clients.filter((client) => {
    // Search filter - use cl_name since that's what we have from Supabase
    const matchesSearch = client.cl_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Use actual last_checkIn for activity calculation
    const daysSinceActivity = getDaysSinceLastCheckIn((client as any).last_checkIn || (client as any).lastCheckIn || (client as any).last_checkin);

    // Status filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "inactive" && daysSinceActivity !== null && daysSinceActivity > 7);

    // Engagement score filter (mocked for now)
    const matchesEngagement = true;
    // Outcome score filter (mocked for now)
    const matchesOutcome = true;
    // Activity filter
    const matchesActivity = 
      activityFilter === "all" ||
      (activityFilter === "recent" && daysSinceActivity !== null && daysSinceActivity <= 3) ||
      (activityFilter === "moderate" && daysSinceActivity !== null && daysSinceActivity > 3 && daysSinceActivity <= 7) ||
      (activityFilter === "inactive" && daysSinceActivity !== null && daysSinceActivity > 7);

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

  // Helper to get color class for activity status
  function getActivityStatusColor(days: number) {
    if (days <= 3) return 'bg-green-500';
    if (days <= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  }

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
                    {/* Dynamically add a column for each activity type */}
                    {ACTIVITY_TYPES.map((type) => (
                      <th key={type} className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 tracking-wide">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </th>
                    ))}
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
                      const daysSinceActivity = getDaysSinceLastCheckIn((client as any).last_checkIn || (client as any).lastCheckIn || (client as any).last_checkin);
                      const activityColorClass = getActivityStatusColor(daysSinceActivity ?? 999);
                      const breakdown = activityBreakdown[client.client_id] || {};
                      return (
                        <tr
                          key={client.client_id}
                          className={`$${
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
                          {/* Render a cell for each activity type */}
                          {ACTIVITY_TYPES.map((type) => (
                            <td key={type} className="px-6 py-5">
                              <span className="font-medium flex items-center gap-2">
                                {/* Color dot logic: green (≤1), yellow (≤5), red (>5), gray for N/A */}
                                {breakdown[type] !== undefined && breakdown[type] !== null ? (
                                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                                    breakdown[type] <= 1 ? 'bg-green-500' :
                                    breakdown[type] <= 5 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}></span>
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-300"></span>
                                )}
                                {breakdown[type] !== undefined && breakdown[type] !== null ? `${breakdown[type]}d ago` : 'N/A'}
                              </span>
                            </td>
                          ))}
                          {/* Last Activity column: show days since lastCheckIn from client */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${activityColorClass}`}></div>
                              <span className={`font-medium ${
                                daysSinceActivity !== null && daysSinceActivity <= 3 ? 'text-green-700 dark:text-green-400' : 
                                daysSinceActivity !== null && daysSinceActivity <= 5 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                              }`}>
                                {daysSinceActivity !== null ? `${daysSinceActivity}d ago` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${activityColorClass}`}>
                              {daysSinceActivity !== null && daysSinceActivity <= 3 ? 'Active' : daysSinceActivity !== null && daysSinceActivity <= 5 ? 'Moderate' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                100%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '100%' }}></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem]">
                                100%
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
              open={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
            {/* Client Form Modal */}
            <ClientProfileModal
              open={isFormModalOpen}
              onClose={() => setIsFormModalOpen(false)}
            />
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
};

export default Clients;